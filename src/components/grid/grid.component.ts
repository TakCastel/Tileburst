import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Tile, Cell } from '../../models/game.model';
import { GridIndicatorComponent } from '../grid-indicator/grid-indicator.component';
import { ThemeService } from '../../services/theme.service';
import { I18nService } from '../../services/i18n.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  standalone: true,
  imports: [CommonModule, GridIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block w-full h-full'
  }
})
export class GridComponent {
  protected gameService = inject(GameService);
  protected i18n = inject(I18nService);
  private themeService = inject(ThemeService);
  private optionsService = inject(OptionsService);
  private cdr = inject(ChangeDetectorRef);
  
  grid = this.gameService.grid;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  lastPlacedTileId = this.gameService.lastPlacedTileId;
  isShrinking = this.gameService.isShrinking;
  isShrinkImminent = this.gameService.isShrinkImminent;
  changeDirectionIndex = this.gameService.changeDirectionIndex;
  isDarkMode = this.themeService.isDarkMode; // Dépendance au thème pour forcer la mise à jour

  private previewCells = signal<Set<string>>(new Set());
  private clearingPreviewCells = signal<Set<string>>(new Set());
  private isPlacementValid = signal(false);
  private lastHoveredCell = signal<{row: number, col: number} | null>(null);
  private previewStartPosition = signal<{row: number, col: number} | null>(null);
  private lastTouchTime = 0;

  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400' };
  
  colorPalette = this.optionsService.colorPalette;
  shapeMode = this.optionsService.shapeMode;

  gridStyles = computed(() => ({
    'grid-template-columns': `repeat(${this.gridSize()}, minmax(0, 1fr))`,
  }));

  constructor() {
    // Forcer la détection de changement quand le thème change
    effect(() => {
      this.isDarkMode();
      this.cdr.markForCheck();
    });

    // Forcer la mise à jour quand les options changent
    effect(() => {
      this.colorPalette();
      this.shapeMode();
      this.cdr.markForCheck();
    });

    effect(() => {
        const tile = this.currentTile();
        const hoverCoords = this.lastHoveredCell();

        if (!tile || !hoverCoords) {
            this.previewCells.set(new Set());
            this.previewStartPosition.set(null);
            this.clearingPreviewCells.set(new Set());
            return;
        }
        
        const startRow = hoverCoords.row - tile.barycenter.r;
        const startCol = hoverCoords.col - tile.barycenter.c;
        this.previewStartPosition.set({ row: startRow, col: startCol });

        const canPlace = this.gameService.canPlaceTile(tile, startRow, startCol);
        this.isPlacementValid.set(canPlace);
        
        const newPreviewCells = new Set<string>();
        for (let r = 0; r < tile.height; r++) {
            for (let c = 0; c < tile.width; c++) {
                if (tile.shape[r][c] === 1) {
                    newPreviewCells.add(`${startRow + r},${startCol + c}`);
                }
            }
        }
        this.previewCells.set(newPreviewCells);
        
        if (canPlace) {
            const cellsToClear = this.gameService.previewLineClears(this.grid(), tile, startRow, startCol);
            this.clearingPreviewCells.set(cellsToClear);
        } else {
            this.clearingPreviewCells.set(new Set());
        }
    });
  }
  
  private getBackgroundColorClass(color: string | null | undefined): string {
    if (!color) return 'bg-slate-100';
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    return (palette[color] || this.DEFAULT_COLOR).bg;
  }
  
  getShapeForColor(color: string | null | undefined): 'square' | 'circle' | 'triangle' | 'cross' | 'star' | null {
    if (!color || this.shapeMode() === 'none') return null;
    return this.optionsService.getShapeForColor(color);
  }
  
  getShapeColorClass(color: string | null | undefined): string {
    if (!color) return '';
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
  
  getCellClass(row: number, col: number): string {
    const cell = this.grid()[row][col];
    const key = `${row},${col}`;
    
    let classes = 'rounded-md';

    if (this.isShrinkImminent()) {
        const newSize = this.gridSize() - 1;
        let willBeRemoved = false;
        switch (this.changeDirectionIndex()) {
            case 0: willBeRemoved = row >= newSize || col >= newSize; break;
            case 1: willBeRemoved = row >= newSize || col < 1; break;
            case 2: willBeRemoved = row < 1 || col < 1; break;
            case 3: willBeRemoved = row < 1 || col >= newSize; break;
        }
        if (willBeRemoved) {
             classes += ' cell-shrink-imminent';
        }
    }

    if (cell.shrinking) {
        return `${classes} cell-shrinking-warning`;
    }
    if (cell.clearing) {
        return `${classes} ${this.getBackgroundColorClass(cell.color)} animate-explode`;
    }
    if (this.clearingPreviewCells().has(key)) {
        const color = this.previewCells().has(key) ? this.currentTile()?.color : cell.color;
        return `${classes} ${this.getBackgroundColorClass(color)} cell-3d animate-clear-preview`;
    }
    if (this.previewCells().has(key)) {
        if (this.isPlacementValid()) {
          const tileColor = this.currentTile()?.color;
          const previewColorMap: { [key: string]: string } = {
            blue: 'bg-cyan-400/50',
            red: 'bg-red-400/50',
            green: 'bg-green-400/50',
            yellow: 'bg-amber-400/50',
            purple: 'bg-violet-400/50',
          };
          return `${classes} ${previewColorMap[tileColor || ''] || 'bg-gray-400/50'}`;
        } else {
            return `invalid-placement-preview rounded-md`;
        }
    }

    classes += ` ${this.getBackgroundColorClass(cell.color)}`;

    if (cell.color) {
      classes += ' cell-3d';
      if (cell.tileId && cell.tileId === this.lastPlacedTileId()) {
        classes += ' animate-place';
      }
      if (cell.validated) {
        classes += ' validated';
      }
    } else {
      // Utiliser des classes Tailwind directement pour une réactivité immédiate au thème
      classes += ' bg-slate-100 dark:bg-slate-800';
      classes += ' cell-empty';
      // Highlight the shrink/expand path for empty cells
      const size = this.gridSize();
      let isInPath = false;
      switch (this.changeDirectionIndex()) {
        case 0: isInPath = row === size - 1 || col === size - 1; break; // BR
        case 1: isInPath = row === size - 1 || col === 0; break;     // BL
        case 2: isInPath = row === 0 || col === 0; break;         // TL
        case 3: isInPath = row === 0 || col === size - 1; break;     // TR
      }
      if (isInPath) {
        classes += ' bg-slate-200 dark:bg-slate-700';
        classes += ' cell-in-shrink-path';
      }
      // Forcer la mise à jour en lisant le signal du thème
      this.isDarkMode();
    }

    return classes;
  }

  private _updateHoveredCellFromEvent(event: MouseEvent | DragEvent | TouchEvent): void {
    const gridElement = event.currentTarget as HTMLElement;
    const rect = gridElement.getBoundingClientRect();
    
    let x: number, y: number;
    // Vérifier si c'est un TouchEvent en utilisant la propriété 'touches'
    if ('touches' in event || 'changedTouches' in event) {
      const touchEvent = event as TouchEvent;
      // Utiliser changedTouches pour touchend, touches pour touchmove/touchstart
      const touch = (touchEvent.touches && touchEvent.touches.length > 0) ? touchEvent.touches[0] : 
                   ((touchEvent.changedTouches && touchEvent.changedTouches.length > 0) ? touchEvent.changedTouches[0] : null);
      if (!touch) return;
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else if ('clientX' in event && 'clientY' in event) {
      // MouseEvent ou DragEvent
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      return;
    }
    
    const gridSize = this.gridSize();
    if (rect.width === 0 || rect.height === 0) return;

    const cellWidth = rect.width / gridSize;
    const cellHeight = rect.height / gridSize;

    // S'assurer que les coordonnées sont dans les limites
    const col = Math.max(0, Math.min(gridSize - 1, Math.floor(x / cellWidth)));
    const row = Math.max(0, Math.min(gridSize - 1, Math.floor(y / cellHeight)));

    if (this.lastHoveredCell()?.row !== row || this.lastHoveredCell()?.col !== col) {
      this.lastHoveredCell.set({ row, col });
    }
  }

  onGridMouseMove(event: MouseEvent): void {
    if (this.currentTile()) {
      this._updateHoveredCellFromEvent(event);
    }
  }

  onGridMouseLeave(): void {
    this.lastHoveredCell.set(null);
  }

  onCellClick(row: number, col: number): void {
    // This functionality is removed per user request.
  }

  onGridClick(): void {
    if (this.isShrinking()) return;
    
    // Éviter les doubles déclenchements après un événement tactile
    const now = Date.now();
    if (now - this.lastTouchTime < 300) {
      return;
    }

    const tile = this.currentTile();
    const startPos = this.previewStartPosition();
    
    if (tile && this.isPlacementValid() && startPos) {
        this.gameService.placeTile(tile, startPos.row, startPos.col);
        // Réinitialiser l'état après placement
        this.lastHoveredCell.set(null);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this._updateHoveredCellFromEvent(event);
  }

  onDragLeave(event: DragEvent): void {
    this.onGridMouseLeave();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.isShrinking()) return;
    this.onGridClick();
    this.onGridMouseLeave();
  }

  // Gestion des événements tactiles pour mobile
  onTouchStart(event: TouchEvent): void {
    if (!this.currentTile() || this.isShrinking()) return;
    event.preventDefault();
    event.stopPropagation();
    this.lastTouchTime = Date.now();
    // Mettre à jour immédiatement pour un feedback instantané
    this._updateHoveredCellFromEvent(event);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.currentTile() || this.isShrinking()) return;
    event.preventDefault();
    event.stopPropagation();
    // Mettre à jour en temps réel pendant le mouvement
    this._updateHoveredCellFromEvent(event);
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.isShrinking()) return;
    event.preventDefault();
    event.stopPropagation();
    this.lastTouchTime = Date.now();
    // Placer la tuile si valide
    const tile = this.currentTile();
    const startPos = this.previewStartPosition();
    
    if (tile && this.isPlacementValid() && startPos) {
        this.gameService.placeTile(tile, startPos.row, startPos.col);
    }
    // Nettoyer l'état
    this.onGridMouseLeave();
  }
}