
import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { Tile } from '../../models/game.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tile-preview',
  templateUrl: './tile-preview.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TilePreviewComponent {
  tile = input.required<Tile>();

  private readonly COLOR_PALETTE: { [key: string]: { bg: string, shadow: string } } = {
    blue:   { bg: 'bg-cyan-400',    shadow: 'rgba(8, 145, 178, 0.5)' },
    red:    { bg: 'bg-red-400',     shadow: 'rgba(220, 38, 38, 0.5)' },
    green:  { bg: 'bg-green-400',   shadow: 'rgba(22, 163, 74, 0.5)' },
    yellow: { bg: 'bg-amber-400',   shadow: 'rgba(217, 119, 6, 0.5)' },
    purple: { bg: 'bg-violet-400',  shadow: 'rgba(139, 92, 246, 0.5)' },
  };
  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400', shadow: 'rgba(107, 114, 128, 0.5)' };

  backgroundColorClass = computed(() => {
    const color = this.tile().color;
    return (this.COLOR_PALETTE[color] || this.DEFAULT_COLOR).bg;
  });

  shadowStyle = computed(() => {
    const color = this.tile().color;
    const shadowColor = (this.COLOR_PALETTE[color] || this.DEFAULT_COLOR).shadow;
    return {
      'box-shadow': `inset 0 -3px 0 0 ${shadowColor}`
    };
  });

  gridStyles = computed(() => {
    const tile = this.tile();
    return {
      'grid-template-columns': `repeat(${tile.width}, minmax(0, 1fr))`
    };
  });

  cellSize = computed(() => {
    const tile = this.tile();
    // Taille maximale du conteneur (peut être ajustée selon les besoins)
    const maxContainerSize = 100; // pixels
    const gap = 2; // gap-0.5 = 2px
    const maxDimension = Math.max(tile.width, tile.height);
    // Calculer la taille de cellule pour que la tuile s'adapte au conteneur
    const cellSize = Math.floor((maxContainerSize - (maxDimension - 1) * gap) / maxDimension);
    // Limiter entre une taille minimale et maximale raisonnable
    return Math.max(10, Math.min(cellSize, 20));
  });
}
