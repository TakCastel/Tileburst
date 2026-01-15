import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-grid-indicator',
  template: `
    <div
      class="absolute pointer-events-none transition-all duration-500 ease-in-out"
      [class]="indicatorClasses()">
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridIndicatorComponent {
  private gameService = inject(GameService);
  changeDirectionIndex = this.gameService.changeDirectionIndex;
  isShrinking = this.gameService.isShrinking;
  isShrinkImminent = this.gameService.isShrinkImminent;

  indicatorClasses = computed(() => {
    if (this.isShrinking() || this.isShrinkImminent()) {
      return 'opacity-0';
    }

    const base = 'w-5 h-5 border-2 border-slate-400/70';
    switch (this.changeDirectionIndex()) {
      case 0: // BR
        return `${base} -bottom-2 -right-2 border-t-transparent border-l-transparent rounded-br-lg`;
      case 1: // BL
        return `${base} -bottom-2 -left-2 border-t-transparent border-r-transparent rounded-bl-lg`;
      case 2: // TL
        return `${base} -top-2 -left-2 border-b-transparent border-r-transparent rounded-tl-lg`;
      case 3: // TR
        return `${base} -top-2 -right-2 border-b-transparent border-l-transparent rounded-tr-lg`;
      default:
        return '';
    }
  });
}
