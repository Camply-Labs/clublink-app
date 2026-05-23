import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  styleUrl: 'avatar.component.scss',
  template: `
    @if (photoUrl()) {
      <img
        [src]="photoUrl()"
        [alt]="name()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        class="avatar-img"
        (error)="imgError = true"
      />
    } @else {
      <div
        class="avatar-placeholder"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="fontSize()"
      >
        {{ initial() }}
      </div>
    }
  `,
})
export class AvatarComponent {
  readonly photoUrl = input<string | undefined | null>(undefined);
  readonly name     = input<string>('');
  readonly size     = input<number>(40);

  readonly initial  = computed(() => (this.name() || '?')[0].toUpperCase());
  readonly fontSize = computed(() => Math.floor(this.size() * 0.38));

  imgError = false;
}
