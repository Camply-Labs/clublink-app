import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CollectionKey,
  ALL_COLLECTIONS,
  DatabaseIOService,
  DatabaseExport,
  ImportValidationError,
  EXPORT_SCHEMA_VERSION
} from '../../core/services/database-io.service';
import { AppStatusService } from '../../core/services/app-status.service';
import {
  AppStatusKey,
  APP_STATUS_CONFIG,
} from '../../core/models/app-status.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type ActiveTab = 'status' | 'export' | 'import';

interface CollectionOption {
  key:   CollectionKey;
  label: string;
  icon:  string;
  desc:  string;
}

const COLLECTION_OPTIONS: CollectionOption[] = [
  { key: 'users',   label: 'Usuários',  icon: '👥', desc: 'Perfis de desbravadores e diretoria' },
  { key: 'history', label: 'Histórico', icon: '📋', desc: 'Apontamentos de pontos de todos os membros' },
];

const STATUS_OPTIONS: { key: AppStatusKey; label: string; icon: string; color: string }[] = [
  { key: 'production',  label: 'Em Produção',   icon: '✅', color: '#68d391' },
  { key: 'maintenance', label: 'Em Manutenção', icon: '🔧', color: '#f6ad55' },
  { key: 'offline',     label: 'Fora do Ar',    icon: '🚫', color: '#fc8181' },
];

@Component({
  selector: 'app-console',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'console.component.scss',
  imports: [FormsModule],
  template: `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 17 10 11 4 5"/>
          <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        Console
      </h2>
      <div class="console-version-badge">Schema v{{ schemaVersion }}</div>
    </div>

    <div class="console-warning">
      ⚠️ Área restrita a administradores. Operações de importação
      <strong>sobrescrevem</strong> dados existentes. Exporte antes de importar.
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────── -->
    <div class="tab-bar">
      <button class="tab-btn" [class.active]="activeTab() === 'status'"
              (click)="activeTab.set('status')">
        🚦 Status
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'export'"
              (click)="activeTab.set('export')">
        📤 Exportar
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'import'"
              (click)="activeTab.set('import')">
        📥 Importar
      </button>
    </div>

    <!-- ════════════════════════════════════════════════════════
         ABA: STATUS
         ════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'status') {
      <div class="console-panel">
        <h3 class="panel-title">🚦 Status da Aplicação</h3>
        <p class="panel-desc">
          Define o estado visível da aplicação para todos os usuários.
          Status diferentes de <strong>Em Produção</strong> bloqueiam
          o acesso de não-administradores e exibem uma tela dedicada.
          Apenas o estado atual é salvo — não há histórico.
        </p>

        <!-- Status atual -->
        @if (currentStatus(); as cs) {
          <div class="current-status-bar" [attr.data-status]="cs.status">
            <span class="current-status-icon">{{ statusCfg(cs.status).icon }}</span>
            <div class="current-status-info">
              <div class="current-status-label"
                   [style.color]="statusCfg(cs.status).color">
                {{ statusCfg(cs.status).label }}
              </div>
              <div class="current-status-since">
                Desde {{ formatDate(cs.since) }}
                @if (cs.updatedByName) { · por {{ cs.updatedByName }} }
              </div>
            </div>
            @if (cs.status !== 'production') {
              <div class="current-status-eta">
                <div class="current-eta-label">Previsão de retorno</div>
                <div class="current-eta-value" [style.color]="statusCfg(cs.status).color">
                  {{ cs.eta ? formatDate(cs.eta) : 'Indeterminada' }}
                </div>
              </div>
            }
          </div>
        }

        <div class="status-form-divider"></div>

        <!-- Formulário para alterar status -->
        <div class="status-form">
          <div class="form-group">
            <label class="form-label">Novo status *</label>
            <div class="status-options">
              @for (opt of statusOptions; track opt.key) {
                <label class="status-option" [class.selected]="newStatus() === opt.key">
                  <input type="radio" name="status"
                         [value]="opt.key"
                         [checked]="newStatus() === opt.key"
                         (change)="newStatus.set(opt.key)" />
                  <span class="status-option-icon">{{ opt.icon }}</span>
                  <span class="status-option-label" [style.color]="opt.color">
                    {{ opt.label }}
                  </span>
                </label>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mensagem para os usuários (opcional)</label>
            <input type="text" class="form-control"
                   placeholder="Ex: Sistema em atualização. Voltamos em breve!"
                   [(ngModel)]="newMessage" />
          </div>

          <!-- ETA só quando não é "Em Produção" -->
          @if (newStatus() !== 'production') {
            <div class="form-group">
              <label class="form-label">Previsão de retorno</label>
              <div class="eta-options">
                <label class="eta-toggle" [class.active]="etaIndeterminate()">
                  <input type="checkbox" [(ngModel)]="etaIndeterminate"
                         (ngModelChange)="onEtaIndeterminateChange($event)" />
                  <span class="eta-toggle-box">{{ etaIndeterminate() ? '✓' : '' }}</span>
                  <span>Indeterminada</span>
                </label>
              </div>
              @if (!etaIndeterminate()) {
                <input type="datetime-local" class="form-control" style="margin-top:.5rem;"
                       [(ngModel)]="newEtaString"
                       [min]="minEtaString" />
              }
            </div>
          }

          <div class="panel-actions" style="margin-top:1.25rem;">
            <button class="btn btn-primary"
                    [disabled]="savingStatus()"
                    (click)="saveStatus()">
              @if (savingStatus()) {
                Salvando…
              } @else {
                💾 Aplicar Status
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════
         ABA: EXPORTAR
         ════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'export') {
      <div class="console-panel">
        <h3 class="panel-title">📤 Exportar Base de Dados</h3>
        <p class="panel-desc">
          Selecione as coleções que deseja exportar. O arquivo JSON gerado segue
          o schema proprietário <code>clublink-app-export v{{ schemaVersion }}</code>
          e pode ser reimportado neste sistema.
        </p>

        <div class="collection-grid">
          @for (opt of collectionOptions; track opt.key) {
            <label class="collection-card" [class.selected]="isExportSelected(opt.key)">
              <input type="checkbox"
                     [checked]="isExportSelected(opt.key)"
                     (change)="toggleExport(opt.key)" />
              <div class="collection-card-icon">{{ opt.icon }}</div>
              <div class="collection-card-info">
                <div class="collection-card-label">{{ opt.label }}</div>
                <div class="collection-card-desc">{{ opt.desc }}</div>
              </div>
              <div class="collection-card-check">
                {{ isExportSelected(opt.key) ? '✓' : '' }}
              </div>
            </label>
          }
        </div>

        <div class="panel-actions">
          <button class="btn btn-primary"
                  [disabled]="exporting() || exportSelected().length === 0"
                  (click)="doExport()">
            @if (exporting()) {
              Exportando…
            } @else {
              📤 Exportar JSON
            }
          </button>
          <span class="panel-hint">{{ exportSelected().length }} coleção(ões) selecionada(s)</span>
        </div>

        @if (exportResult()) {
          <div class="result-box result-success">
            <div class="result-title">✅ Exportação concluída</div>
            <div class="result-detail">{{ exportResult() }}</div>
          </div>
        }
      </div>
    }

    <!-- ════════════════════════════════════════════════════════
         ABA: IMPORTAR
         ════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'import') {
      <div class="console-panel">
        <h3 class="panel-title">📥 Importar Base de Dados</h3>
        <p class="panel-desc">
          Selecione um arquivo JSON exportado por este sistema. Somente o schema
          <code>clublink-app-export</code> é aceito. Campos inválidos ou
          ausentes retornarão erro antes de qualquer escrita.
        </p>

        <div class="upload-area"
             [class.has-file]="importFile()"
             [class.has-error]="validationError()"
             (click)="fileInput.click()"
             (dragover)="$event.preventDefault()"
             (drop)="onDrop($event)">
          <input #fileInput type="file" accept=".json,application/json"
                 style="display:none;" (change)="onFileSelect($event)" />
          @if (importFile()) {
            <div class="upload-file-name">📄 {{ importFile()!.name }}</div>
            <div class="upload-file-size">{{ formatBytes(importFile()!.size) }}</div>
          } @else {
            <div class="upload-icon">📂</div>
            <div class="upload-label">Clique ou arraste o arquivo JSON aqui</div>
            <div class="upload-hint">Somente arquivos .json exportados por este sistema</div>
          }
        </div>

        @if (validationError()) {
          <div class="result-box result-error">
            <div class="result-title">❌ Arquivo inválido</div>
            <div class="result-detail">{{ validationError() }}</div>
            @if (validationField()) {
              <div class="result-field">Campo: <code>{{ validationField() }}</code></div>
            }
          </div>
        }

        @if (parsedExport() && !validationError()) {
          <div class="import-preview">
            <div class="preview-title">📋 Prévia do arquivo</div>
            <div class="preview-grid">
              <div class="preview-item">
                <span class="preview-label">Schema</span>
                <span class="preview-value">{{ parsedExport()!._version }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Exportado em</span>
                <span class="preview-value">{{ formatDate(parsedExport()!.exportedAt) }}</span>
              </div>
              @if (parsedExport()!.collections.users) {
                <div class="preview-item">
                  <span class="preview-label">👥 Usuários</span>
                  <span class="preview-value preview-count">
                    {{ parsedExport()!.collections.users!.length }} registros
                  </span>
                </div>
              }
              @if (parsedExport()!.collections.history) {
                <div class="preview-item">
                  <span class="preview-label">📋 Histórico</span>
                  <span class="preview-value preview-count">
                    {{ countHistoryEntries(parsedExport()!.collections.history!) }} entradas
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="import-scope">
            <div class="import-scope-title">Selecione o que deseja importar:</div>
            <div class="collection-grid">
              @for (opt of availableImportCollections(); track opt.key) {
                <label class="collection-card" [class.selected]="isImportSelected(opt.key)">
                  <input type="checkbox"
                         [checked]="isImportSelected(opt.key)"
                         (change)="toggleImport(opt.key)" />
                  <div class="collection-card-icon">{{ opt.icon }}</div>
                  <div class="collection-card-info">
                    <div class="collection-card-label">{{ opt.label }}</div>
                    <div class="collection-card-desc">{{ opt.desc }}</div>
                  </div>
                  <div class="collection-card-check">{{ isImportSelected(opt.key) ? '✓' : '' }}</div>
                </label>
              }
            </div>
          </div>

          <div class="import-confirm-warning">
            ⚠️ A importação usa <strong>merge</strong> — documentos existentes com o mesmo ID
            serão <strong>sobrescritos</strong>. Esta ação não pode ser desfeita.
          </div>

          <div class="panel-actions">
            <button class="btn btn-secondary" (click)="clearImport()">🗑 Limpar</button>
            <button class="btn btn-primary"
                    [disabled]="importing() || importSelected().length === 0"
                    (click)="doImport()">
              @if (importing()) {
                Importando…
              } @else {
                📥 Importar agora
              }
            </button>
          </div>
        }

        @if (importResult()) {
          <div class="result-box"
               [class.result-success]="!importResult()!.hasErrors"
               [class.result-partial]="importResult()!.hasErrors">
            <div class="result-title">
              {{ importResult()!.hasErrors ? '⚠️ Importação parcial' : '✅ Importação concluída' }}
            </div>
            <div class="result-detail">{{ importResult()!.summary }}</div>
            @if (importResult()!.errors.length > 0) {
              <div class="result-errors">
                @for (e of importResult()!.errors; track e) {
                  <div class="result-error-item">• {{ e }}</div>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class ConsoleComponent implements OnInit {
  private readonly dbIO      = inject(DatabaseIOService);
  private readonly statusSvc = inject(AppStatusService);
  private readonly auth      = inject(AuthService);
  private readonly toast     = inject(ToastService);

  readonly schemaVersion     = EXPORT_SCHEMA_VERSION;
  readonly collectionOptions = COLLECTION_OPTIONS;
  readonly statusOptions     = STATUS_OPTIONS;

  // ── Tabs ───────────────────────────────────────────────────
  readonly activeTab = signal<ActiveTab>('status');

  // ── Status ─────────────────────────────────────────────────
  readonly currentStatus  = this.statusSvc.status;
  readonly savingStatus   = signal(false);
  readonly newStatus      = signal<AppStatusKey>('production');
  readonly etaIndeterminate = signal(true);
  newMessage    = '';
  newEtaString  = '';
  readonly minEtaString = new Date().toISOString().slice(0, 16);

  ngOnInit(): void {
    // Pré-preenche o form com o status atual
    const s = this.currentStatus();
    if (s) {
      this.newStatus.set(s.status);
      this.newMessage = s.message ?? '';
      if (s.eta) {
        this.etaIndeterminate.set(false);
        this.newEtaString = new Date(s.eta).toISOString().slice(0, 16);
      } else {
        this.etaIndeterminate.set(true);
      }
    }
  }

  statusCfg(key: AppStatusKey) {
    return APP_STATUS_CONFIG[key];
  }

  onEtaIndeterminateChange(val: boolean): void {
    if (val) this.newEtaString = '';
  }

  async saveStatus(): Promise<void> {
    this.savingStatus.set(true);
    try {
      const status = this.newStatus();
      const eta    = (status !== 'production' && !this.etaIndeterminate() && this.newEtaString)
        ? new Date(this.newEtaString)
        : null;

      await this.statusSvc.setStatus(status, this.newMessage, eta);
      this.toast.success('Status atualizado com sucesso!');
    } catch (err) {
      this.toast.error('Erro ao atualizar status: ' + (err as Error).message);
    } finally {
      this.savingStatus.set(false);
    }
  }

  // ── Export ─────────────────────────────────────────────────
  readonly exportSelected = signal<CollectionKey[]>([...ALL_COLLECTIONS]);
  readonly exporting      = signal(false);
  readonly exportResult   = signal<string | null>(null);

  isExportSelected(key: CollectionKey): boolean { return this.exportSelected().includes(key); }

  toggleExport(key: CollectionKey): void {
    const cur = this.exportSelected();
    this.exportSelected.set(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
    this.exportResult.set(null);
  }

  async doExport(): Promise<void> {
    this.exporting.set(true);
    this.exportResult.set(null);
    try {
      const data     = await this.dbIO.export(this.exportSelected());
      const cols     = this.exportSelected().join('-');
      const date     = new Date().toISOString().slice(0, 10);
      const filename = `clublink-app_${cols}_${date}.json`;
      this.dbIO.downloadJson(data, filename);
      const userCount = data.collections.users?.length ?? 0;
      const histCount = data.collections.history
        ? this.countHistoryEntries(data.collections.history)
        : 0;
      const parts: string[] = [];
      if (data.collections.users)   parts.push(`${userCount} usuário(s)`);
      if (data.collections.history) parts.push(`${histCount} entrada(s) de histórico`);
      this.exportResult.set(`Arquivo "${filename}" baixado com ${parts.join(' e ')}.`);
      this.toast.success('Exportação concluída!');
    } catch (err) {
      this.toast.error('Erro ao exportar: ' + (err as Error).message);
    } finally {
      this.exporting.set(false);
    }
  }

  // ── Import ─────────────────────────────────────────────────
  readonly importing       = signal(false);
  readonly importFile      = signal<File | null>(null);
  readonly parsedExport    = signal<DatabaseExport | null>(null);
  readonly validationError = signal<string | null>(null);
  readonly validationField = signal<string | null>(null);
  readonly importSelected  = signal<CollectionKey[]>([...ALL_COLLECTIONS]);
  readonly importResult    = signal<{ summary: string; errors: string[]; hasErrors: boolean } | null>(null);

  availableImportCollections(): CollectionOption[] {
    const p = this.parsedExport();
    if (!p) return [];
    return COLLECTION_OPTIONS.filter(opt => opt.key in p.collections);
  }

  isImportSelected(key: CollectionKey): boolean { return this.importSelected().includes(key); }

  toggleImport(key: CollectionKey): void {
    const cur = this.importSelected();
    this.importSelected.set(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  }

  onFileSelect(event: Event): void {
    this.loadFile((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.loadFile(event.dataTransfer?.files?.[0] ?? null);
  }

  private loadFile(file: File | null): void {
    this.clearImport();
    if (!file) return;
    this.importFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw    = JSON.parse(e.target?.result as string);
        const parsed = this.dbIO.validate(raw);
        this.parsedExport.set(parsed);
        this.validationError.set(null);
        this.validationField.set(null);
        this.importSelected.set(Object.keys(parsed.collections) as CollectionKey[]);
      } catch (err) {
        if (err instanceof ImportValidationError) {
          this.validationError.set(err.message);
          this.validationField.set(err.field ?? null);
        } else if (err instanceof SyntaxError) {
          this.validationError.set('O arquivo não é um JSON válido: ' + err.message);
          this.validationField.set(null);
        } else {
          this.validationError.set('Erro inesperado ao ler o arquivo.');
          this.validationField.set(null);
        }
        this.parsedExport.set(null);
      }
    };
    reader.readAsText(file);
  }

  clearImport(): void {
    this.importFile.set(null);
    this.parsedExport.set(null);
    this.validationError.set(null);
    this.validationField.set(null);
    this.importResult.set(null);
    this.importSelected.set([...ALL_COLLECTIONS]);
  }

  async doImport(): Promise<void> {
    const data = this.parsedExport();
    if (!data) return;
    this.importing.set(true);
    this.importResult.set(null);
    try {
      const summary = await this.dbIO.import(data, this.importSelected());
      const parts: string[] = [];
      if (this.importSelected().includes('users'))   parts.push(`${summary.users} usuário(s)`);
      if (this.importSelected().includes('history')) parts.push(`${summary.historyEntries} entrada(s) de histórico`);
      this.importResult.set({
        summary:   `Importados: ${parts.join(', ')}.`,
        errors:    summary.errors,
        hasErrors: summary.errors.length > 0,
      });
      summary.errors.length === 0
        ? this.toast.success('Importação concluída com sucesso!')
        : this.toast.info(`Importação concluída com ${summary.errors.length} erro(s).`);
    } catch (err) {
      this.toast.error('Erro ao importar: ' + (err as Error).message);
    } finally {
      this.importing.set(false);
    }
  }

  // ── Formatação ─────────────────────────────────────────────
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }

  countHistoryEntries(history: Record<string, unknown[]>): number {
    return Object.values(history).reduce((acc, arr) => acc + arr.length, 0);
  }
}
