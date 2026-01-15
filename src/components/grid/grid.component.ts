import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Tile, Cell } from '../../models/game.model';
import { GridIndicatorComponent } from '../grid-indicator/grid-indicator.component';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  standalone: true,
  imports: [CommonModule, GridIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridComponent {
  protected gameService = inject(GameService);
  
  grid = this.gameService.grid;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  lastPlacedTileId = this.gameService.lastPlacedTileId;
  isShrinking = this.gameService.isShrinking;
  isShrinkImminent = this.gameService.isShrinkImminent;
  changeDirectionIndex = this.gameService.changeDirectionIndex;

  private previewCells = signal<Set<string>>(new Set());
  private clearingPreviewCells = signal<Set<string>>(new Set());
  private isPlacementValid = signal(false);
  private lastHoveredCell = signal<{row: number, col: number} | null>(null);
  private previewStartPosition = signal<{row: number, col: number} | null>(null);

  private readonly COLOR_PALETTE: { [key: string]: { bg: string } } = {
    blue:   { bg: 'bg-cyan-400' },
    red:    { bg: 'bg-red-400' },
    green:  { bg: 'bg-green-400' },
    yellow: { bg: 'bg-amber-400' },
    purple: { bg: 'bg-violet-400' },
  };
  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400' };

  gridStyles = computed(() => ({
    'grid-template-columns': `repeat(${this.gridSize()}, minmax(0, 1fr))`,
  }));

  constructor() {
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
    return (this.COLOR_PALETTE[color] || this.DEFAULT_COLOR).bg;
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
        classes += ' cell-in-shrink-path';
      }
    }

    return classes;
  }

  private _updateHoveredCellFromEvent(event: MouseEvent | DragEvent): void {
    const gridElement = event.currentTarget as HTMLElement;
    const rect = gridElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const gridSize = this.gridSize();
    if (rect.width === 0 || rect.height === 0) return;

    const cellWidth = rect.width / gridSize;
    const cellHeight = rect.height / gridSize;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

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

    const tile = this.currentTile();
    const startPos = this.previewStartPosition();
    
    if (tile && this.isPlacementValid() && startPos) {
        this.gameService.placeTile(tile, startPos.row, startPos.col);
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
}