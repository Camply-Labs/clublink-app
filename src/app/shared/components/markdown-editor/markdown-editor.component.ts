import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import EasyMDE from 'easymde';

type EditorMode = 'simple' | 'markdown';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  // Default (não OnPush) — evita que o CD do Angular interfira
  // no loop de renderização interno do CodeMirror, que é o que
  // causa o ponteiro/cursor a descolar do texto digitado.
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: 'markdown-editor.component.scss',
  imports: [FormsModule],
  template: `
    <!-- Seletor de modo -->
    <div class="editor-mode-bar">
      <button type="button" class="mode-btn"
              [class.active]="editorMode() === 'simple'"
              (click)="setMode('simple')">
        📝 Modo Simples
      </button>
      <button type="button" class="mode-btn"
              [class.active]="editorMode() === 'markdown'"
              (click)="setMode('markdown')">
        🔣 Markdown
      </button>
    </div>

    <!-- ── MODO SIMPLES ───────────────────────────────────────── -->
    <!-- Sempre no DOM, apenas oculto via CSS. Nunca usa @if para
         não destruir o textarea do EasyMDE ao trocar de modo.    -->
    <div class="simple-editor" [class.is-hidden]="editorMode() !== 'simple'">
      <div class="form-group">
        <label class="form-label">Imagem de Capa (opcional)</label>
        <div class="image-upload-area"
             [class.has-image]="imagePreview()"
             (click)="imageInput.click()">
          <input #imageInput type="file" accept="image/*"
                 style="display:none;" (change)="onImageFile($event)" />
          @if (imagePreview()) {
            <img [src]="imagePreview()!" alt="Capa" class="image-preview-thumb" />
            <button type="button" class="image-remove-btn"
                    (click)="removeImage($event)">✕</button>
          } @else {
            <div class="image-upload-icon">🖼️</div>
            <div class="image-upload-label">Clique para selecionar imagem</div>
            <div class="image-upload-hint">JPG, PNG, GIF — será armazenada como base64</div>
          }
        </div>
        @if (!imagePreview()) {
          <input type="url" class="form-control"
                 style="margin-top:.4rem;"
                 placeholder="Ou cole uma URL de imagem externa…"
                 [ngModel]="externalImageUrl()"
                 (ngModelChange)="onExternalUrl($event)" />
        }
      </div>

      <div class="form-group">
        <label class="form-label">Texto do Aviso</label>
        <textarea class="form-control simple-textarea"
                  rows="5"
                  placeholder="Digite o texto do aviso aqui…"
                  [ngModel]="simpleText()"
                  (ngModelChange)="onSimpleText($event)">
        </textarea>
      </div>
    </div>

    <!-- ── MODO MARKDOWN (EasyMDE) ────────────────────────────── -->
    <!-- Sempre no DOM, oculto via CSS quando não ativo.
         O EasyMDE é inicializado uma única vez — nunca destruído
         enquanto o componente existir.                           -->
    <div class="markdown-mode-wrapper" [class.is-hidden]="editorMode() !== 'markdown'">
      <div class="markdown-editor-wrapper">
        <textarea #mdTextarea class="markdown-textarea-host"></textarea>
      </div>
      <div class="md-hint">
        Use a barra de ferramentas para formatar: negrito, itálico, títulos,
        links, imagens, código, citações, listas e mais. Clique no ícone de
        olho 👁 para visualizar o resultado renderizado.
      </div>
    </div>
  `,
})
export class MarkdownEditorComponent implements OnDestroy {
  readonly value      = model<string>('');
  readonly coverImage = model<string>('');
  readonly changed    = output<string>();

  readonly mdTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('mdTextarea');

  readonly editorMode       = signal<EditorMode>('simple');
  readonly imagePreview     = signal<string | null>(null);
  readonly externalImageUrl = signal('');
  readonly simpleText       = signal('');

  private easyMde: EasyMDE | null = null;

  /**
   * Guard para evitar que uma atualização programática do valor
   * (setEditorValue) dispare o listener 'change' do CodeMirror
   * e crie um loop.
   */
  private _ignoreNextChange = false;

  constructor(private readonly zone: NgZone) {
    // afterNextRender garante que o DOM está pronto antes de
    // instanciar o EasyMDE — mais confiável que ngAfterViewInit
    // com OnPush ou com modais que controlam visibilidade.
    afterNextRender(() => {
      this.initEditor();
    });
  }

  ngOnDestroy(): void {
    if (this.easyMde) {
      this.easyMde.toTextArea();
      this.easyMde = null;
    }
  }

  setMode(mode: EditorMode): void {
    if (this.editorMode() === mode) return;
    this.editorMode.set(mode);

    if (mode === 'markdown') {
      // Após revelar o editor (que estava oculto via CSS), o
      // CodeMirror precisa recalcular dimensões e receber foco.
      setTimeout(() => {
        this.easyMde?.codemirror.refresh();
        this.easyMde?.codemirror.focus();
      }, 50);
    }
  }

  private initEditor(): void {
    const el = this.mdTextarea()?.nativeElement;
    if (!el || this.easyMde) return;

    // Roda FORA da zona do Angular para que os eventos internos
    // do CodeMirror (mousemove, keydown, etc.) não disparem CD
    // desnecessariamente — este é o fix definitivo para o cursor.
    this.zone.runOutsideAngular(() => {
      this.easyMde = new EasyMDE({
        element: el,
        initialValue: this.value(),
        spellChecker: false,
        status: false,
        placeholder: 'Escreva seu aviso em Markdown…',
        toolbar: [
          'bold', 'italic', 'heading', '|',
          'quote', 'unordered-list', 'ordered-list', '|',
          'link', 'image', 'code', 'horizontal-rule', '|',
          'preview', 'guide',
        ],
        minHeight: '220px',
        autoDownloadFontAwesome: true,
      });

      this.easyMde.codemirror.on('change', () => {
        if (this._ignoreNextChange) return;
        const val = this.easyMde!.value();
        // Re-entra na zona apenas para propagar o valor ao Angular
        this.zone.run(() => {
          this.value.set(val);
          this.changed.emit(val);
        });
      });
    });
  }

  /** Carrega um valor existente no editor (ex: ao abrir edição de aviso). */
  setEditorValue(val: string): void {
    if (!this.easyMde) return;
    if (this.easyMde.value() === val) return;
    this._ignoreNextChange = true;
    this.easyMde.value(val);
    this._ignoreNextChange = false;
  }

  // ── Imagem de capa ────────────────────────────────────────
  onImageFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      this.imagePreview.set(base64);
      this.externalImageUrl.set('');
      this.coverImage.set(base64);
    };
    reader.readAsDataURL(file);
  }

  onExternalUrl(url: string): void {
    this.externalImageUrl.set(url);
    this.coverImage.set(url);
  }

  removeImage(e: Event): void {
    e.stopPropagation();
    this.imagePreview.set(null);
    this.externalImageUrl.set('');
    this.coverImage.set('');
  }

  // ── Texto simples ─────────────────────────────────────────
  onSimpleText(text: string): void {
    this.simpleText.set(text);
    this.value.set(text);
    this.changed.emit(text);
  }
}

// ── Renderizador Markdown leve para exibição nos cards ────────
export function renderMarkdown(md: string): string {
  if (!md) return '';

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/`(.+?)`/g,           '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="md-image" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />');

  html = html.replace(/(<li>.*?<\/li>)(\s*<br \/>)*/gs, m => {
    const items = m.replace(/<br \/>/g, '').trim();
    return `<ul>${items}</ul>`;
  });

  return `<p>${html}</p>`;
}
