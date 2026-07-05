import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * LandingPageComponent
 *
 * Landing page do Clube de Desbravadores Garras de Águia.
 * Standalone component – registre em app.config.ts ou importe diretamente.
 *
 * Uso:
 *   <app-landing-page></app-landing-page>
 *
 * O componente é self-contained: tudo que precisa de JS está aqui.
 * O SCSS companheiro (landing-page.component.scss) cuida dos estilos.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Referências privadas ──────────────────────────────────────────────────
  private _scrollHandler!: () => void;
  private _resizeHandler!: () => void;
  private _intersectionObserver!: IntersectionObserver;
  private _starsAnimId!: number;
  private _starsCtx: CanvasRenderingContext2D | null = null;

  // Estado das estrelas
  private _stars: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];

  constructor(
    private _el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private _platformId: object,
  ) {}

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    this._setFooterYear();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    this._initNavScroll();
    this._initHamburger();
    this._initStarfield();
    this._initScrollReveal();
    this._initContactForm();
    this._initSmoothAnchor();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    window.removeEventListener('scroll', this._scrollHandler);
    window.removeEventListener('resize', this._resizeHandler);
    cancelAnimationFrame(this._starsAnimId);
    this._intersectionObserver?.disconnect();
  }

  // ── Ano no footer ─────────────────────────────────────────────────────────

  private _setFooterYear(): void {
    // Usamos requestAnimationFrame para garantir que o DOM já foi pintado
    requestAnimationFrame(() => {
      const el = this._root().querySelector<HTMLElement>('#ga-year');
      if (el) el.textContent = String(new Date().getFullYear());
    });
  }

  // ── Navbar – comportamento ao rolar ──────────────────────────────────────

  private _initNavScroll(): void {
    const nav = this._root().querySelector<HTMLElement>('.ga-nav');
    if (!nav) return;

    this._scrollHandler = () => {
      if (window.scrollY > 60) {
        nav.classList.add('ga-nav--scrolled');
      } else {
        nav.classList.remove('ga-nav--scrolled');
      }
    };

    window.addEventListener('scroll', this._scrollHandler, { passive: true });
    this._scrollHandler(); // executar na carga
  }

  // ── Hamburger mobile ─────────────────────────────────────────────────────

  private _initHamburger(): void {
    const btn  = this._root().querySelector<HTMLButtonElement>('#ga-hamburger');
    const menu = this._root().querySelector<HTMLUListElement>('#ga-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      btn.classList.toggle('is-active', open);
      btn.setAttribute('aria-expanded', String(open));
    });

    // Fechar ao clicar num link
    menu.querySelectorAll('.ga-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e: MouseEvent) => {
      if (!btn.contains(e.target as Node) && !menu.contains(e.target as Node)) {
        menu.classList.remove('is-open');
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Starfield canvas (hero) ────────────────────────────────────────────

  private _initStarfield(): void {
    const canvas = this._root().querySelector<HTMLCanvasElement>('#ga-stars');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this._starsCtx = ctx;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this._buildStars(canvas);
    };

    this._resizeHandler = resize;
    window.addEventListener('resize', this._resizeHandler, { passive: true });
    resize();
    this._animateStars(canvas);
  }

  private _buildStars(canvas: HTMLCanvasElement): void {
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    this._stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.7 + 0.2,
    }));
  }

  private _animateStars(canvas: HTMLCanvasElement): void {
    const ctx = this._starsCtx;
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this._stars.forEach(star => {
        // Twinkle
        star.opacity += (Math.random() - 0.5) * 0.04;
        star.opacity  = Math.min(0.9, Math.max(0.1, star.opacity));

        // Drift lento para baixo
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 215, 255, ${star.opacity})`;
        ctx.fill();
      });

      this._starsAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  // ── Scroll Reveal (IntersectionObserver) ─────────────────────────────────

  private _initScrollReveal(): void {
    const root = this._root();

    // Adiciona .ga-reveal a elementos estratégicos automaticamente
    const revealTargets = root.querySelectorAll<HTMLElement>(
      '.ga-sobre__grid, .ga-valor, .ga-card, .ga-tl__item, .ga-pillar, .ga-info-card, .ga-section__header'
    );

    revealTargets.forEach((el, i) => {
      el.classList.add('ga-reveal');
      // Escalonamento por índice dentro do mesmo parent
      const siblings = Array.from(el.parentElement?.children ?? []);
      const idx = siblings.indexOf(el);
      if (idx >= 0 && idx <= 5) {
        el.classList.add(`ga-reveal--delay-${idx + 1}`);
      }
    });

    // Observer
    this._intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Para a timeline, usa classe diferente
            if ((entry.target as HTMLElement).classList.contains('ga-tl__item')) {
              (entry.target as HTMLElement).classList.add('is-visible');
            }
            this._intersectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach(el => this._intersectionObserver.observe(el));
  }

  // ── Formulário de contato ─────────────────────────────────────────────────

  private _initContactForm(): void {
    const form    = this._root().querySelector<HTMLFormElement>('#ga-contact-form');
    const success = this._root().querySelector<HTMLElement>('#ga-form-success');
    if (!form || !success) return;

    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Aqui você integraria com seu backend / serviço de e-mail.
      // Por ora, simulamos um envio com delay:
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando…';
      }

      setTimeout(() => {
        success.hidden = false;
        form.reset();
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `Enviar mensagem
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>`;
        }
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
    });
  }

  // ── Smooth scroll para âncoras internas ──────────────────────────────────

  private _initSmoothAnchor(): void {
    this._root().querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e: Event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector<HTMLElement>(href);
        if (!target) return;
        e.preventDefault();
        const navH = (this._root().querySelector('.ga-nav') as HTMLElement)?.offsetHeight ?? 72;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Retorna o elemento raiz do componente para evitar queries globais */
  private _root(): HTMLElement {
    return this._el.nativeElement;
  }
}
