import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppButtonVariant = 'slate' | 'green' | 'cyan' | 'violet' | 'purple' | 'blue' | 'red';
export type AppButtonSize = 'sm' | 'md' | 'lg';
export type AppButtonShape = 'rounded' | 'full';
export type AppKeyHintPlacement = 'inline' | 'corner';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Permet au <button> interne d'être l'élément "layout" (flex item, grid item, etc.)
  // et évite que le host <app-button> impose une largeur basée sur le contenu.
  host: {
    style: 'display: contents;',
  },
})
export class AppButtonComponent {
  /** If set, replaces projected content text (icons can still be projected). */
  @Input() label: string | null = null;

  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  /** Use either variant OR provide bgClass + shadowColor. */
  @Input() variant: AppButtonVariant = 'slate';
  @Input() bgClass: string | null = null;
  @Input() textClass: string | null = 'text-white';
  @Input() shadowColor: string | null = null;

  @Input() size: AppButtonSize = 'md';
  @Input() block = false;
  @Input() square = false;
  @Input() shape: AppButtonShape = 'rounded';
  @Input() customClass: string | null = null;

  @Input() ariaLabel: string | null = null;
  @Input() ariaExpanded: boolean | null = null;
  @Input() ariaPressed: boolean | null = null;

  /** Keyboard hint badge, e.g. "F", "R", "T". */
  @Input() keyHint: string | null = null;
  @Input() keyHintPlacement: AppKeyHintPlacement = 'inline';

  @Output() pressed = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled) return;
    this.pressed.emit(event);
  }

  get resolvedShadowColor(): string {
    if (this.shadowColor) return this.shadowColor;
    switch (this.variant) {
      case 'green': return '#15803d';
      case 'cyan': return '#0891b2';
      case 'violet': return '#9333ea';
      case 'purple': return '#9333ea';
      case 'blue': return '#2563eb';
      case 'red': return '#dc2626';
      case 'slate':
      default:
        return '#475569';
    }
  }

  get resolvedBgClass(): string {
    if (this.bgClass) return this.bgClass;
    switch (this.variant) {
      case 'green': return 'bg-gradient-to-b from-emerald-400 to-emerald-600';
      case 'cyan': return 'bg-gradient-to-b from-cyan-300 to-cyan-500';
      case 'violet': return 'bg-gradient-to-b from-violet-300 to-violet-600';
      case 'purple': return 'bg-gradient-to-b from-purple-400 to-purple-700';
      case 'blue': return 'bg-gradient-to-b from-sky-400 to-blue-600';
      case 'red': return 'bg-gradient-to-b from-rose-400 to-red-600';
      case 'slate':
      default:
        return 'bg-gradient-to-b from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800';
    }
  }

  get sizeClass(): string {
    if (this.square) {
      switch (this.size) {
        case 'sm': return 'w-8 h-8';
        case 'lg': return 'w-10 h-10';
        case 'md':
        default:
          return 'w-9 h-9';
      }
    }

    switch (this.size) {
      case 'sm': return 'py-2 px-3 text-sm';
      case 'lg': return 'py-3 px-4 text-base';
      case 'md':
      default:
        return 'py-3 px-4 text-sm font-bold';
    }
  }

  get shapeClass(): string {
    return this.shape === 'full' ? 'rounded-full' : 'rounded-[0.85rem]';
  }

  get buttonClass(): string {
    const base = [
      'btn-game',
      'font-bold',
      'select-none',
      'inline-block',
      'hover:brightness-110',
      'active:brightness-90',
      this.sizeClass,
      this.shapeClass,
      this.block ? 'w-full' : '',
      this.resolvedBgClass,
      this.textClass || '',
      this.disabled ? 'opacity-60 pointer-events-none' : '',
      this.customClass || '',
    ].filter(Boolean);
    return base.join(' ');
  }

  get contentClass(): string {
    const base = [
      'flex',
      'items-center',
      'justify-center',
      this.keyHint && this.keyHintPlacement === 'inline' ? 'gap-2' : '',
    ].filter(Boolean);
    return base.join(' ');
  }

  get keyHintClass(): string {
    // Single source of truth for the "key hint" visual.
    return 'rounded-md bg-white/20 px-2 py-0.5 text-xs font-extrabold tracking-widest leading-none';
  }
}

