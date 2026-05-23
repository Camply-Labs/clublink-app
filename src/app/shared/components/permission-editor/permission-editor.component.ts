import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { ALL_PERMISSIONS, PermissionKey } from '../../../core/models';

// Agrupa as permissões por grupo para exibição em blocos
interface PermGroup {
  name:  string;
  items: { key: PermissionKey; label: string; checked: boolean }[];
}

@Component({
  selector: 'app-permission-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'permission-editor.component.scss',
  template: `
    <div class="perm-editor">
      <div class="perm-header">
        <span class="perm-title">🔐 Permissões</span>
        @if (!isAdmin()) {
          <button class="btn-select-all" type="button" (click)="toggleAll()">
            {{ allSelected() ? 'Desmarcar todas' : 'Selecionar todas' }}
          </button>
        }
      </div>

      <!-- Modo admin: aviso simples -->
      @if (isAdmin()) {
        <div class="perm-admin-badge">
          ⭐ Administrador — acesso total a todas as funções
        </div>
      } @else {
        <!-- Grade de permissões por grupo -->
        @for (group of groups(); track group.name) {
          <div class="perm-group">
            <div class="perm-group-name">{{ group.name }}</div>
            <div class="perm-items">
              @for (item of group.items; track item.key) {
                <label class="perm-item" [class.checked]="item.checked">
                  <input
                    type="checkbox"
                    [checked]="item.checked"
                    (change)="toggle(item.key)"
                  />
                  <span class="perm-checkmark">{{ item.checked ? '✓' : '' }}</span>
                  <span class="perm-label">{{ item.label }}</span>
                </label>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class PermissionEditorComponent {
  /** Permissões atualmente selecionadas (two-way via model()) */
  readonly selected = model<PermissionKey[]>([]);
  /** Se true, desabilita a grade e mostra badge de admin */
  readonly isAdmin  = input(false);

  readonly changed = output<PermissionKey[]>();

  readonly allSelected = computed(() =>
    ALL_PERMISSIONS.every(p => this.selected().includes(p.key))
  );

  readonly groups = computed<PermGroup[]>(() => {
    const sel = this.selected();
    const map = new Map<string, PermGroup>();

    for (const p of ALL_PERMISSIONS) {
      if (!map.has(p.group)) map.set(p.group, { name: p.group, items: [] });
      map.get(p.group)!.items.push({
        key:     p.key,
        label:   p.label,
        checked: sel.includes(p.key),
      });
    }
    return [...map.values()];
  });

  toggle(key: PermissionKey): void {
    const cur = this.selected();
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    this.selected.set(next);
    this.changed.emit(next);
  }

  toggleAll(): void {
    const next = this.allSelected()
      ? []
      : ALL_PERMISSIONS.map(p => p.key);
    this.selected.set(next);
    this.changed.emit(next);
  }
}
