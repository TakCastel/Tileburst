
import { Component, input, ChangeDetectionStrategy, computed, inject, effect, ChangeDetectorRef } from '@angular/core';
import { Tile } from '../../models/game.model';
import { CommonModule } from '@angular/common';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-tile-preview',
  templateUrl: './tile-preview.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TilePreviewComponent {
  tile = input.required<Tile>();
  private optionsService = inject(OptionsService);
  private cdr = inject(ChangeDetectorRef);
  
  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400', shadow: 'rgba(107, 114, 128, 0.5)' };
  
  colorPalette = this.optionsService.colorPalette;
  shapeMode = this.optionsService.shapeMode;
  
  getShapeForColor(color: string): 'square' | 'circle' | 'triangle' | 'cross' | 'star' | null {
    return this.optionsService.getShapeForColor(color);
  }
  
  getShapeColorClass(color: string): string {
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    const colorDef = palette[color] || this.DEFAULT_COLOR;
    // Retourner une version plus sombre de la couleur selon la palette
    const darkerMap: { [key: string]: string } = {
      // Normal
      'bg-cyan-400': 'bg-cyan-600',
      'bg-red-400': 'bg-red-600',
      'bg-green-400': 'bg-green-600',
      'bg-amber-400': 'bg-amber-600',
      'bg-violet-400': 'bg-violet-600',
      // High contrast
      'bg-blue-600': 'bg-blue-800',
      'bg-red-600': 'bg-red-800',
      'bg-green-600': 'bg-green-800',
      'bg-yellow-500': 'bg-yellow-700',
      'bg-purple-600': 'bg-purple-800',
    };
    return darkerMap[colorDef.bg] || 'bg-slate-600';
  }

  constructor() {
    // Forcer la mise à jour quand les options changent
    effect(() => {
      this.colorPalette();
      this.shapeMode();
      this.cdr.markForCheck();
    });
  }

  backgroundColorClass = computed(() => {
    const color = this.tile().color;
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    return (palette[color] || this.DEFAULT_COLOR).bg;
  });

  shadowStyle = computed(() => {
    const color = this.tile().color;
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    const shadowColor = (palette[color] || this.DEFAULT_COLOR).shadow || 'rgba(107, 114, 128, 0.5)';
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
    // Taille maximale du conteneur - plus petite sur mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const maxContainerSize = isMobile ? 45 : 100; // pixels - réduit de 60 à 45 sur mobile
    const gap = 2; // gap-0.5 = 2px
    const maxDimension = Math.max(tile.width, tile.height);
    // Calculer la taille de cellule pour que la tuile s'adapte au conteneur
    const cellSize = Math.floor((maxContainerSize - (maxDimension - 1) * gap) / maxDimension);
    // Limiter entre une taille minimale et maximale raisonnable
    return Math.max(6, Math.min(cellSize, isMobile ? 12 : 20)); // Réduit de 8/14 à 6/12 sur mobile
  });
}
