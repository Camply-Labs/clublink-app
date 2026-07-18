import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { ClubLogoComponent } from '../club-logo/club-logo.component';
import { CustomizationService }  from '../../../core/services/customization.service';
import { PhonePipe } from '../../pipes/phone.pipe';

const CURRENT_YEAR = new Date().getFullYear();

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'footer.component.scss',
  imports: [ClubLogoComponent, PhonePipe],
  template: `
    <footer class="app-footer">

      <!-- ── Linha superior ───────────────────────────────── -->
      <div class="footer-top">

        <!-- Identidade -->
        <div class="footer-brand">
          <div class="footer-brand-header">
            <app-club-logo [size]="48" />
            <div>
              <div class="footer-brand-name">{{ _customization.getValueOrDefault('clubName') }}</div>
              <div class="footer-brand-sub">Clube de Desbravadores</div>
            </div>
          </div>
          <div class="footer-brand-contact">
            <address class="footer-contact">
              <a class="footer-contact-item" href="https://maps.google.com/?q={{ _customization.getValueOrDefault('contact').churchName }}" target="_blank" rel="noopener">
                <!-- Cruz -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="12" y1="3" x2="12" y2="21"/>
                  <line x1="5"  y1="9" x2="19" y2="9"/>
                </svg>
                {{ _customization.getValueOrDefault('contact').churchName }}
              </a>
              <a class="footer-contact-item" href="https://maps.google.com/?q={{ _customization.getValueOrDefault('contact').addressLine1 }}+{{ _customization.getValueOrDefault('contact').addressLine2 }}" target="_blank" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ _customization.getValueOrDefault('contact').addressLine1 }} — {{ _customization.getValueOrDefault('contact').addressLine2 }}
              </a>
              <a class="footer-contact-item" rel="noopener">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                {{ _customization.getValueOrDefault('contact').meetingSchedule }}
              </a>
              <a class="footer-contact-item" [href]="'tel:' + _customization.getValueOrDefault('contact').phone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                </svg>
                {{ _customization.getValueOrDefault('contact').phone | phone }}
              </a>
              <a class="footer-contact-item" [href]="'mailto:' + _customization.getValueOrDefault('contact').email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {{ _customization.getValueOrDefault('contact').email }}
              </a>
            </address>
          </div>
        </div>

        <!-- Redes sociais do clube -->
        @if(_customization.haveSocialLinks()) {
          <div class="footer-section">
            <div class="footer-section-title">Redes Sociais</div>
            <div class="footer-links">
              @if(_customization.getValueOrDefault('social').instagram) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').instagram"
                  target="_blank" rel="noopener"
                  title="Instagram do Clube">
                  <!-- Instagram -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                  Instagram
                </a>
              }

              @if(_customization.getValueOrDefault('social').whatsapp) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').whatsapp"
                  target="_blank" rel="noopener"
                  title="WhatsApp do Clube">
                  <!-- WhatsApp -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.522 5.859L.057 23.569a.5.5 0 0 0 .611.628l5.9-1.545A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.519-5.188-1.42l-.372-.22-3.854 1.01 1.032-3.767-.242-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
              }

              @if(_customization.getValueOrDefault('social').tiktok) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').tiktok"
                  target="_blank" rel="noopener"
                  title="TikTok do Clube">
                  <!-- TikTok -->
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                  </svg>
                  TikTok
                </a>
              }

              @if(_customization.getValueOrDefault('social').twitter) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').twitter"
                  target="_blank" rel="noopener"
                  title="Twitter do Clube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                  </svg>
                  Twitter
                </a>
              }

              @if(_customization.getValueOrDefault('social').facebook) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').facebook"
                  target="_blank" rel="noopener"
                  title="Facebook do Clube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.015 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.088 24 18.098 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
              }

              @if(_customization.getValueOrDefault('social').youtube) {
                <a class="footer-link"
                  [href]="_customization.getValueOrDefault('social').youtube"
                  target="_blank" rel="noopener"
                  title="Canal do Youtube do Clube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                  </svg>
                  Youtube
                </a>
              }
            </div>
          </div>
        }

        <!-- Suporte & Dev -->
        <div class="footer-section">
          <div class="footer-section-title">Suporte &amp; Dev</div>
          <div class="footer-links">
            @if(_customization.getValueOrDefault('support').supportPhone) {
              <a class="footer-link"
                href="https://wa.me/5511959955896?text=Suporte%20ClubLink"
                target="_blank" rel="noopener"
                title="Suporte técnico via WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.522 5.859L.057 23.569a.5.5 0 0 0 .611.628l5.9-1.545A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.519-5.188-1.42l-.372-.22-3.854 1.01 1.032-3.767-.242-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Suporte Técnico
              </a>
            }

            @if(_customization.getValueOrDefault('support').supportEmail) {
              <a class="footer-link"
                [href]="'mailto:' + _customization.getValueOrDefault('support').supportEmail"
                target="_blank" rel="noopener"
                title="Suporte técnico via e-mail">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {{ _customization.getValueOrDefault('support').supportEmail }}
              </a>
            }

            @if(_customization.getValueOrDefault('support').docsUrl) {
              <a class="footer-link"
                [href]="_customization.getValueOrDefault('support').docsUrl"
                target="_blank" rel="noopener"
                title="Guia de Uso">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                Guia de Uso
              </a>
            }

            <a class="footer-link"
               href="https://github.com/Camply-Labs/clublink-app"
               target="_blank" rel="noopener"
               title="Repositório no GitHub">
              <!-- GitHub -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>

      <!-- ── Linha inferior ────────────────────────────────── -->
      <div class="footer-bottom">
        <span>
          Copyright © {{ year }} Camply Labs.
          Todos os direitos reservados.
        </span>
        <span class="footer-version">v{{ version() }}</span>
      </div>

    </footer>
  `,
})
export class FooterComponent {
  readonly _customization = inject(CustomizationService);

  /** Versão exibida no rodapé. Padrão: '1.0.0' */
  readonly version = input('1.0.0');

  readonly year = CURRENT_YEAR;
}
