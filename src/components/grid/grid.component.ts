import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, ChangeDetectorRef, ElementRef, Injector, afterNextRender, untracked, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GameService, GridResizeEvent, ScoreGainEvent, ShrinkBurstEvent, UndoEvent } from '../../services/game.service';
import { Tile, Cell } from '../../models/game.model';
import { GridIndicatorComponent } from '../grid-indicator/grid-indicator.component';
import { I18nService } from '../../services/i18n.service';
import { OptionsService } from '../../services/options.service';
import { ColorblindIconService } from '../../services/colorblind-icon.service';
import { SoundService, ShrinkPop } from '../../services/sound.service';
/** Décalage (ms) entre deux cases qui explosent pendant la réduction */
const SHRINK_CELL_STAGGER = 30;

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
  private optionsService = inject(OptionsService);
  private colorblindIconService = inject(ColorblindIconService);
  private soundService = inject(SoundService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  private boardRef = viewChild<ElementRef<HTMLElement>>('board');
  private fxLayerRef = viewChild<ElementRef<HTMLElement>>('fxLayer');
  /** Animations "cases soufflées" à annuler quand la grille change vraiment de taille */
  private burstAnimations: Animation[] = [];
  protected shrinkBurst = this.gameService.shrinkBurst;

  grid = this.gameService.grid;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  nextTile = this.gameService.nextTile;
  lastPlacedTileId = this.gameService.lastPlacedTileId;
  isShrinking = this.gameService.isShrinking;
  isShrinkImminent = this.gameService.isShrinkImminent;
  changeDirectionIndex = this.gameService.changeDirectionIndex;

  private previewCells = signal<Set<string>>(new Set());
  private clearingPreviewCells = signal<Set<string>>(new Set());
  private hintColors = signal<Map<string, string>>(new Map());
  private isPlacementValid = signal(false);
  private lastHoveredCell = signal<{row: number, col: number} | null>(null);
  private previewStartPosition = signal<{row: number, col: number} | null>(null);
  protected pulseDelay = signal('0ms');
  private lastTouchTime = 0;

  private suppressNextClick = false;

  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400' };
  
  colorPalette = this.optionsService.colorPalette;
  shapeMode = this.optionsService.shapeMode;

  visibleGrid = this.grid;
  displaySize = this.gridSize;

  gridStyles = computed(() => ({
    'grid-template-columns': `repeat(${this.displaySize()}, minmax(0, 1fr))`,
  }));

  constructor() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = 1000;
    this.pulseDelay.set(`-${Math.round(now % durationMs)}ms`);


    effect(() => {
      const burst = this.gameService.shrinkBurst();
      if (burst) untracked(() => this.playShrinkBurst(burst));
    });

    effect(() => {
      const gain = this.gameService.scoreGain();
      if (gain) untracked(() => this.showScorePop(gain));
    });

    effect(() => {
      const undo = this.gameService.undoEvent();
      if (!undo) return;
      untracked(() => afterNextRender(() => this.playUndo(undo), { injector: this.injector }));
    });

    effect(() => {
      const resize = this.gameService.gridResize();
      if (!resize) return;
      untracked(() => {
        // Les cases soufflées sont réutilisées par le nouveau rendu: on les rend visibles
        this.burstAnimations.forEach(a => a.cancel());
        this.burstAnimations = [];
        afterNextRender(() => this.playResize(resize), { injector: this.injector });
      });
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
            this.gameService.setPreviewLinePoints(0);
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
            const points = this.gameService.getLineClearPointsForPlacement(tile, startRow, startCol);
            this.gameService.setPreviewLinePoints(points);
        } else {
            this.clearingPreviewCells.set(new Set());
            this.gameService.setPreviewLinePoints(0);
        }
    });

    effect(() => {
      const tile = this.currentTile();
      const grid = this.grid();
      const isShrinking = this.isShrinking();

      if (isShrinking || !grid || !tile) {
        this.hintColors.set(new Map());
        return;
      }

      const hintMap = new Map<string, string>();

      const applyHintForTile = (hintTile: Tile | null): void => {
        if (!hintTile) return;
        const bestPlacement = this.gameService.findBestLineClearPlacement(hintTile);
        if (!bestPlacement) return;

        for (let r = 0; r < bestPlacement.height; r++) {
          for (let c = 0; c < bestPlacement.width; c++) {
            if (bestPlacement.shape[r][c] === 1) {
              const key = `${bestPlacement.startRow + r},${bestPlacement.startCol + c}`;
              if (!hintMap.has(key)) {
                hintMap.set(key, hintTile.color);
              }
            }
          }
        }
      };

      // Ne prendre en compte que la tuile actuelle pour les hints, pas la suivante
      applyHintForTile(tile);
      this.hintColors.set(hintMap);
    });

  }

  private getBackgroundColorClass(color: string | null | undefined): string {
    if (!color) return 'bg-slate-100';
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    return (palette[color] || this.DEFAULT_COLOR).bg;
  }
  
  isPreviewCell(row: number, col: number): boolean {
    const world = this.toWorldCoords(row, col);
    return this.previewCells().has(`${world.row},${world.col}`);
  }

  toWorldCoords(localRow: number, localCol: number): { row: number; col: number } {
    return { row: localRow, col: localCol };
  }

  private getWorldCellFromClient(
    clientX: number,
    clientY: number,
    surface: HTMLElement
  ): { row: number; col: number; cell: Cell } | null {
    const rect = surface.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const style = window.getComputedStyle(surface);
    const padT = parseFloat(style.paddingTop) || 0;
    const padL = parseFloat(style.paddingLeft) || 0;
    const padB = parseFloat(style.paddingBottom) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const innerX = x - padL;
    const innerY = y - padT;
    const size = this.displaySize();
    const gridW = rect.width - padL - padR;
    const gridH = rect.height - padT - padB;
    if (gridW <= 0 || gridH <= 0) return null;
    const localCol = Math.max(0, Math.min(size - 1, Math.floor((innerX / gridW) * size)));
    const localRow = Math.max(0, Math.min(size - 1, Math.floor((innerY / gridH) * size)));
    const world = this.toWorldCoords(localRow, localCol);
    const cell = this.grid()[world.row]?.[world.col];
    if (!cell) return null;
    return { row: world.row, col: world.col, cell };
  }

  private getPulseColorClass(color: string | null | undefined): string {
    const colorMap: { [key: string]: string } = {
      blue: 'pulse-color-blue',
      red: 'pulse-color-red',
      green: 'pulse-color-green',
      yellow: 'pulse-color-yellow',
      purple: 'pulse-color-purple',
    };
    return color ? (colorMap[color] || '') : '';
  }

  private getHintClass(key: string): string {
    const color = this.hintColors().get(key);
    if (!color) return '';
    return `pulse-hint ${this.getPulseColorClass(color)}`.trim();
  }

  getShapeForColor(color: string | null | undefined, row?: number, col?: number): 'square' | 'circle' | 'triangle' | 'cross' | 'star' | null {
    let finalColor = color;
    if (!finalColor && row !== undefined && col !== undefined && this.isPreviewCell(row, col)) {
      finalColor = this.currentTile()?.color;
    }
    if (!finalColor || this.shapeMode() === 'none') return null;
    return this.optionsService.getShapeForColor(finalColor);
  }
  
  getShapeColorClass(color: string | null | undefined, row?: number, col?: number): string {
    let finalColor = color;
    if (!finalColor && row !== undefined && col !== undefined && this.isPreviewCell(row, col)) {
      finalColor = this.currentTile()?.color;
    }
    if (!finalColor) return '';
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    const colorDef = palette[finalColor] || this.DEFAULT_COLOR;
    // Retourner une version plus sombre de la couleur selon la palette
    const darkerMap: { [key: string]: string } = {
      // Couleurs
      'bg-cyan-400': 'bg-cyan-600',
      'bg-red-500': 'bg-red-700',
      'bg-green-500': 'bg-green-700',
      'bg-amber-400': 'bg-amber-600',
      'bg-violet-500': 'bg-violet-700',
    };
    return darkerMap[colorDef.bg] || 'bg-slate-600';
  }

  getColorblindShape(color: string | null | undefined, row?: number, col?: number): 'square' | 'circle' | 'hexagon' | 'triangle' | 'star' | null {
    // En mode daltonien, afficher les icônes sur toutes les cellules colorées
    if (this.colorPalette() !== 'daltonien') return null;

    // Si c'est une cellule de preview, utiliser la couleur de la tuile actuelle
    // Sinon, utiliser la couleur de la cellule
    let finalColor = color;
    const isPreview = row !== undefined && col !== undefined && this.isPreviewCell(row, col);
    if (isPreview) {
      finalColor = this.currentTile()?.color;
    }
    
    // Toujours afficher les icônes si la cellule a une couleur (ou si c'est une preview)
    if (!finalColor) return null;
    
    return this.optionsService.getColorblindShape(finalColor);
  }

  getColorblindIconSvg(color: string | null | undefined, row?: number, col?: number, filled: boolean = false): SafeHtml | null {
    const shape = this.getColorblindShape(color, row, col);
    if (!shape) return null;
    
    // Pour les previews, toujours utiliser la version non remplie
    const isPreview = row !== undefined && col !== undefined && this.isPreviewCell(row, col);
    if (isPreview) {
      filled = false;
    }
    
    const svgString = this.colorblindIconService.getShapeSvg(shape, filled, 24);
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }
  
  getCellClass(row: number, col: number): string {
    const worldCoords = this.toWorldCoords(row, col);
    const cell = this.grid()[worldCoords.row][worldCoords.col];
    const key = `${worldCoords.row},${worldCoords.col}`;
    
    let classes = 'rounded-md';

    if (this.isShrinkImminent()) {
        const newSize = this.gridSize() - 1;
        let willBeRemoved = false;
        const wr = worldCoords.row;
        const wc = worldCoords.col;
        switch (this.changeDirectionIndex()) {
            case 0: willBeRemoved = wr >= newSize || wc >= newSize; break;
            case 1: willBeRemoved = wr >= newSize || wc < 1; break;
            case 2: willBeRemoved = wr < 1 || wc < 1; break;
            case 3: willBeRemoved = wr < 1 || wc >= newSize; break;
        }
        if (willBeRemoved) {
             classes += ' cell-shrink-imminent';
        }
    }

    if (cell.blocked) {
      return `${classes} cell-blocked bg-stone-700 opacity-90`;
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
          const hasLineClear = this.clearingPreviewCells().size > 0;
          const pulseClass = hasLineClear ? `pulse-preview ${this.getPulseColorClass(tileColor)}` : '';
          return `${classes} ${this.getBackgroundColorClass(tileColor)} cell-3d placement-preview ${pulseClass} ${this.getHintClass(key)}`;
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
      classes += ' bg-slate-100';
      classes += ' cell-empty';
      // Met en évidence le chemin de rétrécissement/agrandissement
      {
        const size = this.gridSize();
        const wr = worldCoords.row;
        const wc = worldCoords.col;
        let isInPath = false;
        switch (this.changeDirectionIndex()) {
          case 0: isInPath = wr === size - 1 || wc === size - 1; break;
          case 1: isInPath = wr === size - 1 || wc === 0; break;
          case 2: isInPath = wr === 0 || wc === 0; break;
          case 3: isInPath = wr === 0 || wc === size - 1; break;
        }
        if (isInPath) {
          classes += ' bg-slate-200';
          classes += ' cell-in-shrink-path';
        }
      }
      const hintClass = this.getHintClass(key);
      if (hintClass) {
        classes += ` ${hintClass}`;
      }
    }

    return classes;
  }

  private _updateHoveredCellFromCoordinates(clientX: number, clientY: number, surface: HTMLElement): void {
    const worldCell = this.getWorldCellFromClient(clientX, clientY, surface);
    if (!worldCell) {
      this.lastHoveredCell.set(null);
      return;
    }
    if (
      this.lastHoveredCell()?.row !== worldCell.row ||
      this.lastHoveredCell()?.col !== worldCell.col
    ) {
      this.lastHoveredCell.set({ row: worldCell.row, col: worldCell.col });
    }
  }

  private _updateHoveredCellFromEvent(event: MouseEvent | DragEvent | TouchEvent): void {
    const surface = event.currentTarget as HTMLElement;
    const rect = surface.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(surface);
    
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    
    let clientX: number;
    let clientY: number;
    if ('touches' in event || 'changedTouches' in event) {
      const touchEvent = event as TouchEvent;
      const touch = (touchEvent.touches && touchEvent.touches.length > 0) ? touchEvent.touches[0] : 
                   ((touchEvent.changedTouches && touchEvent.changedTouches.length > 0) ? touchEvent.changedTouches[0] : null);
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('clientX' in event && 'clientY' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return;
    }

    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const x = clientX - rect.left - paddingLeft;
    const y = clientY - rect.top - paddingTop;
    
    const gridSize = this.displaySize();
    if (rect.width === 0 || rect.height === 0) return;

    const gridWidth = rect.width - paddingLeft - paddingRight;
    const gridHeight = rect.height - paddingTop - paddingBottom;

    const cellWidth = gridWidth / gridSize;
    const cellHeight = gridHeight / gridSize;

    const localCol = Math.max(0, Math.min(gridSize - 1, Math.floor(x / cellWidth)));
    const localRow = Math.max(0, Math.min(gridSize - 1, Math.floor(y / cellHeight)));
    const world = this.toWorldCoords(localRow, localCol);

    if (this.lastHoveredCell()?.row !== world.row || this.lastHoveredCell()?.col !== world.col) {
      this.lastHoveredCell.set({ row: world.row, col: world.col });
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
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    
    // Éviter les doubles déclenchements après un événement tactile
    const now = Date.now();
    if (now - this.lastTouchTime < 300) {
      return;
    }

    const tile = this.currentTile();
    const startPos = this.previewStartPosition();
    
    if (tile && this.isPlacementValid() && startPos) {
        this.gameService.placeTile(tile, startPos.row, startPos.col);
        this.lastHoveredCell.set(null);
    }
  }

  // Sur écran tactile, on ne pose pas une pièce en touchant la grille:
  // il faut la glisser depuis la carte « Pièce actuelle » (événements tile-drag-*).
  // On bloque quand même le geste pour éviter le clic simulé qui la poserait.
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.lastTouchTime = Date.now();
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.lastTouchTime = Date.now();
  }

  // Gestion des événements de drag depuis la tuile
  onTileDragMove(event: CustomEvent): void {
    if (!this.currentTile() || this.isShrinking()) return;
    const gridElement = event.detail.target as HTMLElement;
    if (!gridElement) return;
    
    // Utiliser les coordonnées directement pour mettre à jour la position
    this._updateHoveredCellFromCoordinates(
      event.detail.clientX,
      event.detail.clientY,
      gridElement
    );
  }

  // Le pointeur a quitté la grille pendant un drag: retirer la prévisualisation
  onTileDragLeave(): void {
    this.onGridMouseLeave();
  }

  onTileDragEnd(event: CustomEvent): void {
    if (this.isShrinking()) return;
    const gridElement = event.detail.target as HTMLElement;
    if (!gridElement) return;
    
    // Utiliser les coordonnées directement pour mettre à jour la position finale
    this._updateHoveredCellFromCoordinates(
      event.detail.clientX,
      event.detail.clientY,
      gridElement
    );
    
    // Placer la tuile si valide
    const tile = this.currentTile();
    const startPos = this.previewStartPosition();
    
    if (tile && this.isPlacementValid() && startPos) {
        this.gameService.placeTile(tile, startPos.row, startPos.col);
    }
    // Nettoyer l'état
    this.onGridMouseLeave();
  }

  // ---------- Animations de changement de taille ----------

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  /** Décalage (lignes, colonnes) entre la petite et la grande grille selon le sens */
  private resizeOffset(dir: number): { r: number; c: number } {
    switch (dir) {
      case 1: return { r: 0, c: 1 };
      case 2: return { r: 1, c: 1 };
      case 3: return { r: 1, c: 0 };
      default: return { r: 0, c: 0 };
    }
  }

  private isRemovedOnShrink(r: number, c: number, size: number, dir: number): boolean {
    const n = size - 1;
    switch (dir) {
      case 0: return r >= n || c >= n;
      case 1: return r >= n || c < 1;
      case 2: return r < 1 || c < 1;
      default: return r < 1 || c >= n;
    }
  }

  private boardCells(board: HTMLElement): HTMLElement[] {
    return Array.from(board.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('cell-base')
    );
  }

  /** Les cases retirées explosent en éclats qui partent vers l'extérieur */
  /** Affiche un "+XX" qui monte et s'efface au-dessus des cases qui ont rapporté les points. */
  private showScorePop(gain: ScoreGainEvent): void {
    const board = this.boardRef()?.nativeElement;
    const layer = this.fxLayerRef()?.nativeElement;
    if (!board || !layer || gain.cells.length === 0) return;

    // Centre des cases concernées, en fraction de la grille (indépendant du re-rendu du DOM)
    let sumR = 0, sumC = 0;
    for (const key of gain.cells) {
      const [r, c] = key.split(',').map(Number);
      sumR += r;
      sumC += c;
    }
    const fr = (sumR / gain.cells.length + 0.5) / gain.size;
    const fc = (sumC / gain.cells.length + 0.5) / gain.size;

    const boardRect = board.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const x = boardRect.left - layerRect.left + fc * boardRect.width;
    const y = boardRect.top - layerRect.top + fr * boardRect.height;

    const el = document.createElement('div');
    el.className = 'tb-score-pop';
    el.textContent = `+${gain.points}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    // Taille proportionnelle à la grille, un peu plus grosse pour les gros gains
    const base = Math.max(22, Math.min(44, boardRect.width * 0.085));
    const boost = gain.points >= 500 ? 1.35 : gain.points >= 200 ? 1.15 : 1;
    el.style.fontSize = `${Math.round(base * boost)}px`;
    layer.appendChild(el);

    const keyframes = this.prefersReducedMotion()
      ? [
          { opacity: 0, transform: 'translate(-50%, -50%)' },
          { opacity: 1, transform: 'translate(-50%, -50%)', offset: 0.2 },
          { opacity: 0, transform: 'translate(-50%, -50%)' },
        ]
      : [
          { opacity: 0, transform: 'translate(-50%, -20%) scale(0.5)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1.15)', offset: 0.18 },
          { opacity: 1, transform: 'translate(-50%, -80%) scale(1)', offset: 0.55 },
          { opacity: 0, transform: 'translate(-50%, -170%) scale(0.95)' },
        ];
    const anim = el.animate(keyframes, { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = anim.oncancel = () => el.remove();
  }

  private playShrinkBurst(burst: ShrinkBurstEvent): void {
    const board = this.boardRef()?.nativeElement;
    const layer = this.fxLayerRef()?.nativeElement;
    // Sans animation, on joue quand même l'explosion (cascade simulée)
    if (!board || !layer || this.prefersReducedMotion()) {
      this.soundService.playShrinkSound();
      return;
    }

    const cells = this.boardCells(board);
    if (cells.length !== burst.size * burst.size) {
      this.soundService.playShrinkSound();
      return;
    }

    // Une explosion sonore par instant de l'animation (les cases au même délai sont groupées)
    const pops = new Map<number, ShrinkPop>();
    const grid = this.grid();

    const boardRect = board.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const cx = boardRect.left + boardRect.width / 2;
    const cy = boardRect.top + boardRect.height / 2;

    board.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: 'translate(-5px, 3px)' },
        { transform: 'translate(5px, -3px)' },
        { transform: 'translate(-3px, -2px)' },
        { transform: 'translate(2px, 2px)' },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 360, easing: 'ease-out' }
    );

    cells.forEach((cell, i) => {
      const r = Math.floor(i / burst.size);
      const c = i % burst.size;
      if (!this.isRemovedOnShrink(r, c, burst.size, burst.dir)) return;

      const rect = cell.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      let dx = x - cx;
      let dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // Petit décalage pour que la vague parte du coin vers les bords
      const delay = Math.min(r, c, burst.size - 1 - r, burst.size - 1 - c) === 0
        ? (Math.abs(r - c) % burst.size) * SHRINK_CELL_STAGGER
        : 0;
      const pop = pops.get(delay) ?? { delayMs: delay, count: 0, filled: false };
      pop.count++;
      pop.filled ||= !!grid[r]?.[c]?.color;
      pops.set(delay, pop);
      const spin = (Math.random() - 0.5) * 120;

      this.burstAnimations.push(
        cell.animate(
          [
            { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
            { transform: 'scale(1.18)', opacity: 1, filter: 'brightness(1.8)', offset: 0.25 },
            {
              transform: `translate(${dx * rect.width * 0.6}px, ${dy * rect.height * 0.6}px) rotate(${spin}deg) scale(0)`,
              opacity: 0,
              filter: 'brightness(1)',
            },
          ],
          { duration: 420, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' }
        )
      );

      const color = getComputedStyle(cell).backgroundColor;
      const pieces = 7;
      for (let p = 0; p < pieces; p++) {
        const shard = document.createElement('div');
        const size = rect.width * (0.14 + Math.random() * 0.16);
        shard.style.cssText = `position:absolute;left:${x - layerRect.left - size / 2}px;top:${y - layerRect.top - size / 2}px;width:${size}px;height:${size}px;border-radius:${Math.random() < 0.5 ? '50%' : '22%'};background:${color};box-shadow:inset 0 -2px 0 rgba(0,0,0,.2),0 1px 2px rgba(0,0,0,.3);will-change:transform,opacity;`;
        layer.appendChild(shard);

        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2.2;
        const dist = rect.width * (0.8 + Math.random() * 1.4);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const fall = rect.height * (0.3 + Math.random() * 0.5);
        const rot = (Math.random() - 0.5) * 540;
        shard
          .animate(
            [
              { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
              { transform: `translate(${tx * 0.7}px, ${ty * 0.7}px) rotate(${rot * 0.6}deg) scale(1)`, opacity: 1, offset: 0.55 },
              { transform: `translate(${tx}px, ${ty + fall}px) rotate(${rot}deg) scale(0.3)`, opacity: 0 },
            ],
            { duration: 520 + Math.random() * 160, delay: delay + 40, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
          )
          .finished.finally(() => shard.remove());
      }
    });

    this.soundService.playShrinkSound([...pops.values()]);
  }

  /**
   * Transition fluide entre l'ancienne et la nouvelle taille (technique FLIP):
   * chaque case part de sa place dans l'ancienne grille et glisse vers la nouvelle.
   */
  private playResize(ev: GridResizeEvent): void {
    const board = this.boardRef()?.nativeElement;
    if (!board || this.prefersReducedMotion()) return;

    const cells = this.boardCells(board);
    if (cells.length !== ev.to * ev.to) return;

    const style = getComputedStyle(board);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const padT = parseFloat(style.paddingTop) || 0;
    const padB = parseFloat(style.paddingBottom) || 0;
    const colGap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;
    const boardRect = board.getBoundingClientRect();
    const originX = boardRect.left + board.clientLeft + padL;
    const originY = boardRect.top + board.clientTop + padT;
    const innerW = board.clientWidth - padL - padR;
    const innerH = board.clientHeight - padT - padB;
    const oldW = (innerW - colGap * (ev.from - 1)) / ev.from;
    const oldH = (innerH - rowGap * (ev.from - 1)) / ev.from;

    const growing = ev.to > ev.from;
    const off = this.resizeOffset(ev.dir);
    // Agrandissement: ancienne case = nouvelle - décalage; rétrécissement: + décalage
    const sign = growing ? -1 : 1;
    const duration = growing ? 520 : 480;

    cells.forEach((cell, i) => {
      const r = Math.floor(i / ev.to);
      const c = i % ev.to;
      const oldR = r + sign * off.r;
      const oldC = c + sign * off.c;
      const rect = cell.getBoundingClientRect();

      if (oldR < 0 || oldC < 0 || oldR >= ev.from || oldC >= ev.from) {
        // Nouvelle case: elle surgit depuis le bord de la grille
        const edgeDist = growing ? (r === 0 || r === ev.to - 1 ? c : r) : 0;
        cell.animate(
          [
            { transform: 'scale(0) rotate(-25deg)', opacity: 0 },
            { transform: 'scale(1.18) rotate(4deg)', opacity: 1, offset: 0.6 },
            { transform: 'scale(0.95) rotate(0deg)', opacity: 1, offset: 0.82 },
            { transform: 'scale(1) rotate(0deg)', opacity: 1 },
          ],
          { duration: 460, delay: 140 + edgeDist * 35, easing: 'ease-out', fill: 'backwards' }
        );
        return;
      }

      const fromX = originX + oldC * (oldW + colGap);
      const fromY = originY + oldR * (oldH + rowGap);
      const sx = oldW / rect.width;
      const sy = oldH / rect.height;
      cell.animate(
        [
          { transformOrigin: '0 0', transform: `translate(${fromX - rect.left}px, ${fromY - rect.top}px) scale(${sx}, ${sy})` },
          { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' },
        ],
        { duration, easing: 'cubic-bezier(.34,1.45,.5,1)' }
      );
    });

    board.animate(
      growing
        ? [{ transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: 0.35 }, { transform: 'scale(1)' }]
        : [{ transform: 'scale(1)' }, { transform: 'scale(0.96)', offset: 0.3 }, { transform: 'scale(1.015)', offset: 0.7 }, { transform: 'scale(1)' }],
      { duration: growing ? 520 : 480, easing: 'ease-out' }
    );
  }

  /**
   * Annulation: les cases de la pièce reprise se décollent de la grille et
   * repartent vers la carte de la pièce actuelle; les cases effacées par le
   * coup reviennent en rembobinant leur explosion.
   */
  private playUndo(ev: UndoEvent): void {
    const board = this.boardRef()?.nativeElement;
    const layer = this.fxLayerRef()?.nativeElement;
    if (!board || !layer || this.prefersReducedMotion()) return;

    const cells = this.boardCells(board);
    if (cells.length !== ev.size * ev.size) return;

    // Petit recul de la grille, comme une bande qu'on rembobine
    board.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(-1.2deg) scale(0.985)', offset: 0.3 },
        { transform: 'rotate(0.6deg) scale(1.005)', offset: 0.65 },
        { transform: 'rotate(0deg) scale(1)' },
      ],
      { duration: 420, easing: 'ease-out' }
    );

    const layerRect = layer.getBoundingClientRect();
    const target = (document.querySelector('.tb-piece-cur .tb-piece-slot') as HTMLElement | null)
      ?.getBoundingClientRect();
    const flyDuration = 480;

    if (ev.removed.length) {
      // Centre de la pièce reprise, pour garder sa forme pendant le vol
      const rects = ev.removed.map(p => cells[p.r * ev.size + p.c].getBoundingClientRect());
      const pcx = rects.reduce((a, r) => a + r.left + r.width / 2, 0) / rects.length;
      const pcy = rects.reduce((a, r) => a + r.top + r.height / 2, 0) / rects.length;
      const radius = getComputedStyle(cells[0]).borderRadius;

      ev.removed.forEach((p, i) => {
        const rect = rects[i];
        const ghost = document.createElement('div');
        ghost.className = `${this.getBackgroundColorClass(p.color)} cell-3d`;
        ghost.style.cssText = `position:absolute;left:${rect.left - layerRect.left}px;top:${rect.top - layerRect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:${radius};will-change:transform,opacity;`;
        layer.appendChild(ghost);

        const lift = rect.height * 0.35;
        let end: string;
        if (target && target.width) {
          // Toute la pièce rétrécit autour de son centre en filant vers la carte
          const scale = 0.4;
          const tx = target.left + target.width / 2 + (rect.left + rect.width / 2 - pcx) * scale - (rect.left + rect.width / 2);
          const ty = target.top + target.height / 2 + (rect.top + rect.height / 2 - pcy) * scale - (rect.top + rect.height / 2);
          end = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(-12deg)`;
        } else {
          end = `translate(0, ${-rect.height * 1.5}px) scale(0.3) rotate(-20deg)`;
        }
        ghost
          .animate(
            [
              { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: 'brightness(1)' },
              { transform: `translate(0, ${-lift}px) scale(1.12)`, opacity: 1, filter: 'brightness(1.35)', offset: 0.25 },
              { transform: end, opacity: 0, filter: 'brightness(1)' },
            ],
            { duration: flyDuration, delay: i * 18, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }
          )
          .finished.finally(() => ghost.remove());
      });

      // La carte de la pièce actuelle "réceptionne" la pièce
      (document.querySelector('.tb-piece-cur') as HTMLElement | null)?.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.07, 0.93)', offset: 0.3 },
          { transform: 'scale(0.97, 1.04)', offset: 0.65 },
          { transform: 'scale(1)' },
        ],
        { duration: 360, delay: flyDuration * 0.75, easing: 'ease-out' }
      );
    }

    // Les cases effacées par le coup réapparaissent (explosion à l'envers)
    ev.restored.forEach((p, i) => {
      const cell = cells[p.r * ev.size + p.c];
      cell.animate(
        [
          { transform: 'scale(0) rotate(90deg)', opacity: 0 },
          { transform: 'scale(1.15) rotate(-6deg)', opacity: 1, offset: 0.65 },
          { transform: 'scale(1) rotate(0deg)', opacity: 1 },
        ],
        { duration: 380, delay: 120 + (i % 12) * 22, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' }
      );
    });
  }
}
