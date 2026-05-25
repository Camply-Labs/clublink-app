import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  collectionData,
  serverTimestamp,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { Observable, map } from 'rxjs';
import { IUserRepository } from '../../core/repositories';
import { CreateUserPayload, PermissionKey, UpdateProfilePayload, User } from '../../core/models';
import { environment } from '../../../environments/environment';

function toDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof (v as { toDate?: unknown }).toDate === 'function')
    return (v as { toDate: () => Date }).toDate();
  return undefined;
}

function docToUser(data: Record<string, unknown>, uid: string): User {
  return {
    uid,
    name:          (data['name']          as string)          ?? '',
    email:         (data['email']         as string)          ?? '',
    unit:          (data['unit']          as string)          ?? '',
    position:      (data['position']      as string)          ?? '',
    role:          (data['role']          as User['role'])    ?? 'desbravador',
    points:        (data['points']        as number)          ?? 0,
    photoUrl:      (data['photoUrl']      as string)          ?? '',
    birth:         (data['birth']          as string)          ?? undefined,
    googleUid:     (data['googleUid']     as string)          ?? undefined,
    isAdmin:       (data['isAdmin']       as boolean)         ?? false,
    permissions:   (data['permissions']   as PermissionKey[]) ?? [],
    createdBy:     (data['createdBy']     as string)          ?? '',
    lastUpdatedBy: (data['lastUpdatedBy'] as string)          ?? '',
    createdAt:     toDate(data['createdAt']),
    lastUpdate:    toDate(data['lastUpdate']),
  };
}

@Injectable()
export class FirebaseUserRepository implements IUserRepository {
  private readonly firestore = inject(Firestore);
  private readonly auth      = inject(Auth);

  private usersCol()        { return collection(this.firestore, 'users'); }
  private userDoc(uid: string) { return doc(this.firestore, 'users', uid); }

  watchAll(): Observable<User[]> {
    return collectionData(query(this.usersCol()), { idField: 'uid' }).pipe(
      map(docs =>
        docs.map(d => docToUser(d as Record<string, unknown>, (d as { uid: string }).uid))
      ),
    );
  }

  async findById(uid: string): Promise<User | null> {
    const snap = await getDoc(this.userDoc(uid));
    if (!snap.exists()) return null;
    return docToUser(snap.data() as Record<string, unknown>, uid);
  }

  async findByGoogleUid(googleUid: string): Promise<User | null> {
    const q    = query(this.usersCol(), where('googleUid', '==', googleUid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToUser(d.data() as Record<string, unknown>, d.id);
  }

  async create(payload: CreateUserPayload): Promise<string> {
    const secondaryApp  = initializeApp(environment.firebase, `secondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred   = await createUserWithEmailAndPassword(secondaryAuth, payload.email, payload.password);
      const newUid = cred.user.uid;
      await setDoc(this.userDoc(newUid), {
        name:        payload.name,
        unit:        payload.unit,
        position:    payload.position,
        email:       payload.email,
        role:        payload.role,
        points:      payload.points,
        photoUrl:    payload.photoUrl,
        birth:       payload.birth        ?? '',
        isAdmin:     payload.isAdmin     ?? false,
        permissions: payload.permissions ?? [],
        createdAt:   serverTimestamp(),
        createdBy:   this.auth.currentUser?.uid ?? '',
      });
      return newUid;
    } finally {
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
    }
  }

  async update(uid: string, data: Partial<Omit<User, 'uid'>>): Promise<void> {
    const { lastUpdate: _lu, createdAt: _ca, ...rest } = data as Record<string, unknown>;
    void _lu; void _ca;
    await updateDoc(this.userDoc(uid), { ...rest, lastUpdate: serverTimestamp() });
  }

  async updateProfile(uid: string, payload: UpdateProfilePayload): Promise<void> {
    await updateDoc(this.userDoc(uid), {
      name:        payload.name,
      unit:        payload.unit,
      position:    payload.position,
      photoUrl:    payload.photoUrl,
      isAdmin:     payload.isAdmin     ?? false,
      permissions: payload.permissions ?? [],
      lastUpdate:  serverTimestamp(),
    });
  }

  async linkGoogle(uid: string, googleUid: string): Promise<void> {
    await updateDoc(this.userDoc(uid), { googleUid, lastUpdate: serverTimestamp() });
  }

  async delete(uid: string): Promise<void> {
    const batch    = writeBatch(this.firestore);
    const histSnap = await getDocs(collection(this.firestore, 'users', uid, 'history'));
    histSnap.forEach(d => batch.delete(d.ref));
    batch.delete(this.userDoc(uid));
    await batch.commit();
  }
}
