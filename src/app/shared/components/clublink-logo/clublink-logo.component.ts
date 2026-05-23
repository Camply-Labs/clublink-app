import { Component, input } from '@angular/core';

@Component({
  selector: 'app-clublink-logo',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      class="clublink-logo"
    >
      <defs>
        <linearGradient id="logoGold_{{ uid }}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#c9a84c"/>
          <stop offset="100%" stop-color="#e2c060"/>
        </linearGradient>
      </defs>
      <!-- Triângulo externo -->
      <polygon
        points="60,8 112,100 8,100"
        fill="none"
        [attr.stroke]="'url(#logoGold_' + uid + ')'"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <!-- Triângulo interno -->
      <polygon
        points="60,24 96,90 24,90"
        fill="none"
        [attr.stroke]="'url(#logoGold_' + uid + ')'"
        stroke-width="2"
        opacity="0.5"
      />
      <!-- Escudo -->
      <path
        d="M60,36 L73,52 L60,82 L47,52 Z"
        [attr.fill]="'url(#logoGold_' + uid + ')'"
      />
      <!-- Estrela -->
      <polygon
        points="60,12 62.5,18 69,18 64,22 66,29 60,25 54,29 56,22 51,18 57.5,18"
        fill="#c9a84c"
      />
      <!-- Cruz -->
      <line x1="60" y1="44" x2="60" y2="70" stroke="#0a1628" stroke-width="2.5"/>
      <line x1="51" y1="54" x2="69" y2="54" stroke="#0a1628" stroke-width="2.5"/>
    </svg>
  `,
})
export class ClubLinkLogoComponent {
  readonly size = input<number>(42);
  readonly uid  = Math.random().toString(36).slice(2); // evita conflito de IDs de gradiente
}
