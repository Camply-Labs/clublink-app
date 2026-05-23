# 🦅 ClubLink App — Angular 19

Sistema de gerenciamento de pontuação para o Clube de Desbravadores **ClubLink App**.
Angular 19 · Firebase Auth · Cloud Firestore · Clean Architecture · SOLID

---

## 📁 Estrutura

```
src/app/
├── core/
│   ├── models/           # User, HistoryEntry, PermissionKey, ALL_PERMISSIONS…
│   ├── repositories/     # IUserRepository, IHistoryRepository (contratos)
│   ├── services/         # AuthService, UserService, AppointmentService,
│   │                     # PermissionService, ToastService
│   └── guards/           # authGuard, roleGuard, permissionGuard
├── infrastructure/
│   └── firebase/         # FirebaseUserRepository, FirebaseHistoryRepository
├── shared/components/
│   ├── shell/            # Navbar + layout
│   ├── avatar/           # Avatar com fallback de iniciais
│   ├── modal/            # Modal reutilizável
│   ├── spinner/          # Loading spinner
│   ├── toast/            # Notificações
│   ├── clublink-logo/  # Logo SVG dos Desbravadores
│   ├── permission-editor/# Editor de permissões (chips clicáveis por grupo)
│   └── edit-member/      # Modal de edição de perfil
└── features/
    ├── auth/             # Login (e-mail + Google)
    ├── podium/           # Monte Everest com fotos dos escaladores
    ├── members/          # Lista + editar + remover
    ├── appointments/     # Apontamentos de pontos
    ├── register/         # Cadastro com permissões
    ├── my-points/        # Pontos do desbravador
    └── profile/          # Perfil (vincular Google + alterar senha)
```

---

## 🔥 Configuração do Firebase

### 1. Criar projeto e ativar serviços

| Serviço | Caminho no console |
|---|---|
| Authentication | Authentication → Começar → E-mail/Senha → Ativar |
| Google Auth | Authentication → Sign-in method → Google → Ativar |
| Firestore | Firestore Database → Criar → Modo produção |

### 2. Preencher `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey:            'AIzaSy...',
    authDomain:        'meu-projeto.firebaseapp.com',
    projectId:         'meu-projeto',
    storageBucket:     'meu-projeto.appspot.com',
    messagingSenderId: '123456789',
    appId:             '1:123:web:abc',
  },
};
```

### 3. Criar o primeiro usuário Admin

**Passo 1 — Authentication:**
- Authentication → Usuários → Adicionar usuário
- E-mail + senha → anote o **UID gerado**

**Passo 2 — Firestore (Dados):**
```
Coleção: users
Documento: [UID]
Campos:
  name:        "Nome do Admin"
  email:       "admin@garradeaguia.com"
  unit:        "Diretoria"
  role:        "diretoria"
  isAdmin:     true          ← IMPORTANTE
  permissions: []
  points:      0
  photoUrl:    ""
  createdAt:   (timestamp)
```

### 4. Regras e índices

```bash
# Instalar Firebase CLI
npm install -g firebase-tools
firebase login
firebase init firestore   # usa firestore.rules e firestore.indexes.json existentes
firebase deploy --only firestore
```

---

## 🚀 Executar

```bash
npm install
npm start            # http://localhost:4200
npm run build:prod   # build de produção
firebase deploy      # deploy completo (hosting + firestore)
```

---

## 🔐 Sistema de Permissões

### Roles

| Role | Descrição |
|---|---|
| `desbravador` | Acesso apenas às próprias informações e ranking |
| `diretoria` | Acesso conforme permissões definidas |
| `diretoria` + `isAdmin: true` | Acesso total irrestrito |

### Permissões disponíveis

| Chave | O que libera |
|---|---|
| `podium.view` | Ver ranking Monte Everest |
| `members.view` | Ver lista de membros |
| `members.edit` | Editar perfil de membros |
| `members.delete` | Remover membros |
| `appointments.view` | Ver tela de apontamentos |
| `appointments.edit` | Realizar apontamentos |
| `register.view` | Ver tela de cadastro |
| `register.edit` | Criar novos cadastros |
| `admin.view` | Gerenciar permissões de diretores |

### Como funciona

- **Admin** (`isAdmin: true`) → todas as permissões automaticamente
- **Diretoria comum** → só o que está no array `permissions[]`
- **Guard de rota** → `permissionGuard('members.view')` bloqueia a rota
- **Guard no navbar** → links só aparecem se o usuário tiver a permissão
- **Botões** → `permSvc.can('members.edit')` exibe/oculta botões na UI
- **Regras Firestore** → validação server-side com `canDoPermission()`

### Onde editar permissões

O Admin pode editar permissões em dois lugares:
1. **Cadastrar** (`/register`) → ao criar um novo membro da diretoria
2. **Membros → Editar** → clicando no botão ✏️ de qualquer diretor

---

## 🔗 Login com Google

1. Ative o provedor Google no Firebase Console
2. O usuário acessa `/login` e clica em **Entrar com Google**
3. O sistema busca o `googleUid` no Firestore — se não encontrar, recusa o acesso
4. Para vincular uma conta existente: **Perfil → Vincular conta Google**

---

## 🔄 Migrar para Backend REST

Troque apenas em `app.config.ts`:
```ts
// Antes (Firebase):
{ provide: IUserRepository,    useClass: FirebaseUserRepository },
{ provide: IHistoryRepository, useClass: FirebaseHistoryRepository },

// Depois (REST):
{ provide: IUserRepository,    useClass: HttpUserRepository },
{ provide: IHistoryRepository, useClass: HttpHistoryRepository },
```

Nenhum componente, service de aplicação ou guard precisa ser alterado.

---

## ✨ Funcionalidades

| Recurso | Admin | Diretoria | Desbravador |
|---|:---:|:---:|:---:|
| Ver ranking | ✅ | ✅ (perm) | ✅ |
| Ver próprios pontos | — | — | ✅ |
| Editar membros | ✅ | ✅ (perm) | — |
| Remover membros | ✅ | ✅ (perm) | — |
| Apontamentos | ✅ | ✅ (perm) | — |
| Cadastrar membros | ✅ | ✅ (perm) | — |
| Gerenciar permissões | ✅ | — | — |
| Alterar própria senha | ✅ | ✅ | ✅ |
| Vincular Google | ✅ | ✅ | ✅ |

---

*Camply -> ClubLink App* 🦅
