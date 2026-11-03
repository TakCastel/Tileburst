import { Injectable, signal, computed, WritableSignal, inject } from '@angular/core';
import { GameState, Cell, Tile } from '../models/game.model';
import { TutorialService } from './tutorial.service';
import { SoundService } from './sound.service';

/** Changement de taille animé: `dir` = sens utilisé (0: BR, 1: BL, 2: TL, 3: TR) */
export interface GridResizeEvent { id: number; from: number; to: number; dir: number; }
/** Cases sur le point d'être retirées: la grille les fait exploser */
export interface ShrinkBurstEvent { id: number; size: number; dir: number; }
/** Points gagnés, avec les cases qui les ont rapportés (pour afficher le "+XX" au bon endroit). */
export interface ScoreGainEvent { id: number; points: number; size: number; cells: string[]; }
/** Annulation d'un coup: cases vidées (la pièce reprise) et cases revenues (effacées par le coup). */
export interface UndoEvent {
  id: number;
  size: number;
  removed: { r: number; c: number; color: string }[];
  restored: { r: number; c: number }[];
}
const COLORS = ['blue', 'red', 'green', 'yellow', 'purple'];
const TILE_SHAPES = [
  // 1x1
  { shape: [[1]] },
  // 1x2
  { shape: [[1, 1]] },
  // 1x3
  { shape: [[1, 1, 1]] },
  // L-3
  { shape: [[1, 0], [1, 1]] },
  // O - 4
  { shape: [[1, 1], [1, 1]] },
  // I - 4
  { shape: [[1, 1, 1, 1]] },
  // T - 4
  { shape: [[0, 1, 0], [1, 1, 1]] },
  // L - 4
  { shape: [[1, 0, 0], [1, 1, 1]] },
  // S - 4
  { shape: [[0, 1, 1], [1, 1, 0]] },
];

const PENTOMINO_SHAPES = [
  // I-5
  { shape: [[1, 1, 1, 1, 1]] },
  // L-5
  { shape: [[1, 0], [1, 0], [1, 0], [1, 1]] },
  // T-5
  { shape: [[1, 1, 1], [0, 1, 0]] },
  // P-5
  { shape: [[1, 1], [1, 1], [1, 0]] },
  // X-5 (plus)
  { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
];

const HEXOMINO_SHAPES = [
  // I-6
  { shape: [[1, 1, 1, 1, 1, 1]] },
  // 2x3
  { shape: [[1, 1, 1], [1, 1, 1]] },
  // C-6
  { shape: [[1, 1], [1, 0], [1, 1]] },
  // Stairs
  { shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]] },
];

const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 10;
const STARTING_GRID_SIZE = 6;
const ANIMATION_DURATION = 300;
const SHRINK_WARNING_DURATION = 1500;
const PRE_SHRINK_DELAY = 1000;
/** Durée de l'explosion des cases retirées avant le rétrécissement effectif */
const SHRINK_BURST_DURATION = 720;
const STORAGE_KEY_GAME_STATE = 'pavat_game_state';
const STORAGE_KEY_BEST_SCORE = 'pavat_best_score';
const MAX_UNDO_CHARGES = 3;
/** Points à cumuler pour la première annulation débloquée */
const UNDO_POINTS_PER_CHARGE = 300;
/** Chaque annulation débloquée rend la suivante plus chère (×1.5) */
const UNDO_COST_GROWTH = 1.5;
const STARTING_UNDO_CHARGES = 1;
/** Points rapportés par une case validée (×multiplicateur de taille de grille) */
const VALIDATED_CELL_POINTS = 15;

interface UndoSnapshot {
  grid: Cell[][];
  gridSize: number;
  score: number;
  currentTile: Tile | null;
  nextTile: Tile | null;
  changeDirectionIndex: number;
  undoCharges: number;
  undoProgressPoints: number;
  undoUnlocked: number;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private tutorialService = inject(TutorialService);
  private soundService = inject(SoundService);
  private _gameState: WritableSignal<GameState> = signal(this.getInitialState());
  private _previewLinePoints: WritableSignal<number> = signal(0);
  
  // Public signals from state
  public readonly state = this._gameState.asReadonly();
  public readonly grid = computed(() => this.state().grid);
  public readonly score = computed(() => this.state().score);
  public readonly currentTile = computed(() => this.state().currentTile);
  public readonly nextTile = computed(() => this.state().nextTile);
  public readonly isGameOver = computed(() => this.state().isGameOver);
  public readonly gridSize = computed(() => this.state().gridSize);
  public readonly scoreMultiplier = computed(() => this.state().gridSize - (MIN_GRID_SIZE - 1));
  public readonly lastPlacedTileId = computed(() => this.state().lastPlacedTileId);
  public readonly isShrinking = computed(() => this.state().isShrinking);
  public readonly changeDirectionIndex = computed(() => this.state().changeDirectionIndex);
  public readonly isShrinkImminent = computed(() => this.state().isShrinkImminent);
  public readonly undoCharges = computed(() => this.state().undoCharges ?? 0);
  public readonly undoProgressPoints = computed(() => this.state().undoProgressPoints ?? 0);
  public readonly canUndo = computed(() =>
    (this.state().undoCharges ?? 0) > 0 &&
    this._undoStack.length > 0 &&
    !this._isPlacementAnimating() &&
    !this.state().isShrinking &&
    !this.state().isShrinkImminent &&
    !this.state().isGameOver
  );
  public readonly previewLinePoints = this._previewLinePoints.asReadonly();
  public readonly shrinkPoints = computed(() => {
    const validatedCount = this.grid().reduce(
      (count, row) => count + row.filter(cell => cell.validated).length,
      0
    );
    return validatedCount * 15 * this.scoreMultiplier();
  });
  public readonly minValidatedGroupSize = computed(() => {
    const size = this.gridSize();
    // Progression: 6, 8, 10, 12 selon la taille de la grille
    if (size === 6) return 6;
    if (size === 7) return 8;
    if (size === 8) return 10;
    if (size === 9) return 12;
    if (size === 10) return 12;
    // Pour les tailles < 6, on garde une logique de base
    return size + 2;
  });

  private tileIdCounter = 0;
  private shrinkTimeout: any = null;
  private _animSeq = 0;
  private _gridResize = signal<GridResizeEvent | null>(null);
  public readonly gridResize = this._gridResize.asReadonly();
  private _shrinkBurst = signal<ShrinkBurstEvent | null>(null);
  public readonly shrinkBurst = this._shrinkBurst.asReadonly();
  private _undoEvent = signal<UndoEvent | null>(null);
  public readonly undoEvent = this._undoEvent.asReadonly();
  private _scoreGain = signal<ScoreGainEvent | null>(null);
  public readonly scoreGain = this._scoreGain.asReadonly();

  private emitScoreGain(points: number, cells: Set<string>): void {
    if (points <= 0) return;
    this._scoreGain.set({ id: ++this._animSeq, points, size: this.state().gridSize, cells: [...cells] });
  }
  private isFirstGame = true;
  private _undoStack: UndoSnapshot[] = [];
  /** Tuiles déjà tirées puis rendues par un undo: on les ressert avant d'en générer de nouvelles */
  private _upcomingTiles: Tile[] = [];
  private _isPlacementAnimating = signal(false);
  private _bestScore: WritableSignal<number> = signal(this.loadBestScore());

  public readonly bestScore = this._bestScore.asReadonly();

  constructor() {
    // Accès de debug/test (harness E2E)
    (window as any).__pavatGame = this;
    // Essayer de restaurer l'état sauvegardé
    const savedState = this.loadGameState();
    if (savedState && !savedState.isGameOver) {
      this.restoreGameState(savedState);
    } else {
      this.startGame();
    }
    if (this.isFirstGame) {
      this.tutorialService.startTutorial();
      this.isFirstGame = false;
    }
  }
  
  private getInitialState(
    gridSize = STARTING_GRID_SIZE,
    score = 0
  ): GameState {
    return {
      grid: this.createEmptyGrid(gridSize),
      gridSize,
      score,
      currentTile: null,
      nextTile: null,
      isGameOver: false,
      lastPlacedTileId: null,
      isShrinking: false,
      changeDirectionIndex: 0,
      isShrinkImminent: false,
      undoCharges: STARTING_UNDO_CHARGES,
      undoProgressPoints: 0,
      undoUnlocked: 0,
    };
  }

  private cloneGridForSnapshot(grid: Cell[][]): Cell[][] {
    return grid.map(row =>
      row.map(cell => ({
        color: cell.color,
        tileId: cell.tileId,
        validated: cell.validated,
        blocked: cell.blocked,
      }))
    );
  }

  private cloneTile(tile: Tile | null): Tile | null {
    if (!tile) return null;
    return {
      ...tile,
      shape: tile.shape.map(row => [...row]),
      barycenter: { ...tile.barycenter },
    };
  }

  private pushUndoSnapshot(): void {
    const state = this.state();
    this._undoStack.push({
      grid: this.cloneGridForSnapshot(state.grid),
      gridSize: state.gridSize,
      score: state.score,
      currentTile: this.cloneTile(state.currentTile),
      nextTile: this.cloneTile(state.nextTile),
      changeDirectionIndex: state.changeDirectionIndex,
      undoCharges: state.undoCharges ?? 0,
      undoProgressPoints: state.undoProgressPoints ?? 0,
      undoUnlocked: state.undoUnlocked ?? 0,
    });
    if (this._undoStack.length > 30) {
      this._undoStack.shift();
    }
  }

  /** Coût (en points) de la prochaine annulation, selon le nombre déjà débloquées. */
  private undoCostFor(unlocked: number): number {
    return Math.round(UNDO_POINTS_PER_CHARGE * Math.pow(UNDO_COST_GROWTH, unlocked) / 5) * 5;
  }

  /**
   * Chaque case nouvellement validée (groupe de couleur) rapporte des points d'annulation.
   * Une annulation se débloque quand la jauge atteint le coût courant (3 max),
   * et chaque déblocage rend le suivant plus cher.
   */
  private grantUndoChargesForValidated(newlyValidatedCells: number): void {
    if (newlyValidatedCells <= 0) return;
    let charges = this.state().undoCharges ?? 0;
    let progress = (this.state().undoProgressPoints ?? 0)
      + newlyValidatedCells * VALIDATED_CELL_POINTS * this.scoreMultiplier();
    let unlocked = this.state().undoUnlocked ?? 0;
    let gained = 0;
    while (charges < MAX_UNDO_CHARGES && progress >= this.undoCostFor(unlocked)) {
      progress -= this.undoCostFor(unlocked);
      unlocked++;
      charges++;
      gained++;
    }
    // Plein: la jauge reste au maximum en attendant qu'une annulation soit utilisée
    if (charges >= MAX_UNDO_CHARGES) progress = Math.min(progress, this.undoCostFor(unlocked));
    this._gameState.update(s => ({ ...s, undoProgressPoints: progress, undoCharges: charges, undoUnlocked: unlocked }));
    if (gained > 0) this._undoGained.update(n => n + 1);
  }

  /** Incrémenté à chaque annulation gagnée (pour animer le bouton). */
  private _undoGained = signal(0);
  public readonly undoGained = this._undoGained.asReadonly();
  /** Progression (0 → 1) vers la prochaine annulation. */
  /** Points nécessaires pour débloquer la prochaine annulation. */
  public readonly undoPointsPerCharge = computed(() => this.undoCostFor(this.state().undoUnlocked ?? 0));
  public readonly undoProgress = computed(() =>
    Math.min(1, (this.state().undoProgressPoints ?? 0) / this.undoPointsPerCharge())
  );
  public readonly undoFull = computed(() => (this.state().undoCharges ?? 0) >= MAX_UNDO_CHARGES);

  public undo(): void {
    if (!this.canUndo()) return;
    clearTimeout(this.shrinkTimeout);
    const snapshot = this._undoStack.pop()!;
    // Garder en mémoire la tuile tirée après le coup annulé pour ne pas la re-tirer au hasard
    // (elle peut être en "suivante" ou en "courante" si le joueur a fait un swap entre-temps)
    const keptIds = new Set([snapshot.currentTile?.id, snapshot.nextTile?.id]);
    const drawnTiles = [this.state().nextTile, this.state().currentTile]
      .filter((t): t is Tile => !!t && !keptIds.has(t.id) && !this._upcomingTiles.some(u => u.id === t.id));
    this._upcomingTiles.unshift(...drawnTiles);
    // Une annulation gagnée par le coup annulé est reprise (sinon on pourrait en farmer)
    const chargesAfter = Math.max(0, Math.min((this.state().undoCharges ?? 0) - 1, snapshot.undoCharges));
    this._isPlacementAnimating.set(false);
    // Différence entre la grille actuelle et celle restaurée, pour l'animation
    const removed: UndoEvent['removed'] = [];
    const restored: UndoEvent['restored'] = [];
    const before = this.state().grid;
    if (this.state().gridSize === snapshot.gridSize) {
      snapshot.grid.forEach((row, r) => row.forEach((cell, c) => {
        const cur = before[r]?.[c];
        if (!cur) return;
        if (cur.color && !cur.blocked && !cell.color) removed.push({ r, c, color: cur.color });
        else if (cell.color && !cur.color) restored.push({ r, c });
      }));
    }
    this._gameState.update(s => ({
      ...s,
      grid: snapshot.grid,
      gridSize: snapshot.gridSize,
      score: snapshot.score,
      currentTile: snapshot.currentTile,
      nextTile: snapshot.nextTile,
      changeDirectionIndex: snapshot.changeDirectionIndex,
      undoCharges: chargesAfter,
      // Utiliser une annulation vide la jauge
      undoProgressPoints: 0,
      // Si le coup annulé avait débloqué une annulation, elle est reprise: le coût redescend aussi
      undoUnlocked: snapshot.undoUnlocked,
      lastPlacedTileId: null,
      isShrinking: false,
      isShrinkImminent: false,
    }));
    this._previewLinePoints.set(0);
    this._undoEvent.set({ id: ++this._animSeq, size: snapshot.gridSize, removed, restored });
    this.saveGameState();
    this.soundService.playSwapSound();
  }

  private saveGameState(): void {
    try {
      const state = this.state();
      // Ne pas sauvegarder les propriétés temporaires d'animation
      const stateToSave: Partial<GameState> = {
        grid: state.grid.map(row => row.map(cell => ({
          color: cell.color,
          tileId: cell.tileId,
          validated: cell.validated,
          blocked: cell.blocked,
        }))),
        gridSize: state.gridSize,
        score: state.score,
        currentTile: state.currentTile,
        nextTile: state.nextTile,
        isGameOver: state.isGameOver,
        changeDirectionIndex: state.changeDirectionIndex,
        undoCharges: state.undoCharges,
        undoProgressPoints: state.undoProgressPoints,
        undoUnlocked: state.undoUnlocked,
      };
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  private loadGameState(): Partial<GameState> | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GAME_STATE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
    return null;
  }

  private restoreGameState(savedState: Partial<GameState>): void {
    try {
      const restoredState: GameState = {
        grid: savedState.grid || this.createEmptyGrid(savedState.gridSize || STARTING_GRID_SIZE),
        gridSize: savedState.gridSize || STARTING_GRID_SIZE,
        score: savedState.score || 0,
        currentTile: savedState.currentTile || null,
        nextTile: savedState.nextTile || null,
        isGameOver: savedState.isGameOver || false,
        lastPlacedTileId: null,
        isShrinking: false,
        changeDirectionIndex: savedState.changeDirectionIndex || 0,
        isShrinkImminent: false,
        undoCharges: savedState.undoCharges ?? STARTING_UNDO_CHARGES,
        undoProgressPoints: savedState.undoProgressPoints ?? 0,
        undoUnlocked: savedState.undoUnlocked ?? 0,
      };

      // Restaurer le compteur de tileId
      if (restoredState.currentTile) {
        this.tileIdCounter = Math.max(this.tileIdCounter, restoredState.currentTile.id);
      }
      if (restoredState.nextTile) {
        this.tileIdCounter = Math.max(this.tileIdCounter, restoredState.nextTile.id);
      }
      // Vérifier aussi les tuiles dans la grille
      restoredState.grid.forEach(row => {
        row.forEach(cell => {
          if (cell.tileId !== null) {
            this.tileIdCounter = Math.max(this.tileIdCounter, cell.tileId);
          }
        });
      });

      this._gameState.set(restoredState);
      this._undoStack = [];
      this._upcomingTiles = [];
      
      // Mettre à jour le meilleur score si nécessaire
      this.updateBestScore(restoredState.score);
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      this.startGame();
    }
  }

  private loadBestScore(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BEST_SCORE);
      if (saved) {
        const score = parseInt(saved, 10);
        return isNaN(score) ? 0 : score;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du meilleur score:', error);
    }
    return 0;
  }

  private saveBestScore(score: number): void {
    try {
      localStorage.setItem(STORAGE_KEY_BEST_SCORE, score.toString());
      this._bestScore.set(score);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du meilleur score:', error);
    }
  }

  private updateBestScore(currentScore: number): void {
    const bestScore = this._bestScore();
    if (currentScore > bestScore) {
      this.saveBestScore(currentScore);
    }
  }

  public resetBestScore(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_BEST_SCORE);
      this._bestScore.set(0);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du meilleur score:', error);
    }
  }

  public startGame(): void {
    clearTimeout(this.shrinkTimeout);
    this._undoStack = [];
    this._upcomingTiles = [];
    this._isPlacementAnimating.set(false);
    try {
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'état sauvegardé:', error);
    }

    const initialState = this.getInitialState(STARTING_GRID_SIZE, 0);
    // Utiliser la taille de la nouvelle grille, pas celle de la partie précédente
    initialState.currentTile = this._generateRandomTile(STARTING_GRID_SIZE);
    initialState.nextTile = this._generateRandomTile(STARTING_GRID_SIZE);
    this._gameState.set(initialState);
    this.saveGameState();

    if (!this.canPlaceAtLeastOneTile(initialState.currentTile, initialState.nextTile)) {
      this._gameState.update(state => ({ ...state, isGameOver: true }));
      this.soundService.playGameOverSound();
      this.updateBestScore(initialState.score);
      this.saveGameState();
    }
  }

  private createEmptyGrid(size: number): Cell[][] {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ color: null, tileId: null, blocked: false }))
    );
  }

  private _generateRandomTile(size: number = this.state().gridSize): Tile {
    let availableShapes = [...TILE_SHAPES];

    if (size >= 8) {
      availableShapes.push(...PENTOMINO_SHAPES);
    }
    if (size >= 9) {
      availableShapes.push(...HEXOMINO_SHAPES);
    }

    const randomShapeDef = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    let shape = randomShapeDef.shape;

    if (!this._isShapeHorizontallySymmetric(shape) && Math.random() < 0.5) {
      shape = this._mirrorShapeHorizontally(shape);
    }
    const height = shape.length;
    const width = shape[0].length;

    return {
      id: ++this.tileIdCounter,
      shape,
      color: randomColor,
      height,
      width,
      barycenter: {
        r: Math.floor(height / 2),
        c: Math.floor(width / 2),
      },
    };
  }

  private _isShapeHorizontallySymmetric(shape: number[][]): boolean {
    const height = shape.length;
    const width = shape[0].length;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < Math.floor(width / 2); c++) {
        if (shape[r][c] !== shape[r][width - 1 - c]) {
          return false;
        }
      }
    }
    return true;
  }

  private _mirrorShapeHorizontally(shape: number[][]): number[][] {
    return shape.map(row => [...row].reverse());
  }

  private advanceToNextTile(): void {
      clearTimeout(this.shrinkTimeout);
      const state = this.state();
      const current = state.nextTile;
      const next = this._upcomingTiles.shift() ?? this._generateRandomTile();

      this._gameState.update(s => ({...s, currentTile: current, nextTile: next }));
      
      // Vérifier si au moins une des deux tuiles peut être placée
      if (!this.canPlaceAtLeastOneTile(current, next)) {
          this._gameState.update(s => ({...s, isShrinkImminent: true}));
          this.saveGameState();
          this.soundService.playShrinkWarningSound();
          this.shrinkTimeout = setTimeout(() => {
              if (this.gridSize() > MIN_GRID_SIZE) {
                  this.changeGridSize(-1);
              } else {
                  const finalScore = this.state().score;
                  this._gameState.update(s => ({...s, isGameOver: true }));
                  this.soundService.playGameOverSound();
                  this.updateBestScore(finalScore);
                  this.saveGameState();
              }
              this._gameState.update(s => ({...s, isShrinkImminent: false}));
              this.saveGameState();
          }, PRE_SHRINK_DELAY);
      } else {
          this.saveGameState();
      }
  }

  public rotateCurrentTile(): void {
    const tile = this.currentTile();
    if (!tile) return;

    const shape = tile.shape;
    const height = tile.height;
    const width = tile.width;
    
    const newShape: number[][] = Array.from({ length: width }, () => Array(height).fill(0));

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            newShape[c][height - 1 - r] = shape[r][c];
        }
    }

    const newHeight = width;
    const newWidth = height;

    const rotatedTile: Tile = {
        ...tile,
        shape: newShape,
        height: newHeight,
        width: newWidth,
        barycenter: {
          r: Math.floor(newHeight / 2),
          c: Math.floor(newWidth / 2),
        },
    };
    
    this._gameState.update(state => ({ ...state, currentTile: rotatedTile }));
    this.saveGameState();
    this.soundService.playRotateSound();
  }

  public mirrorCurrentTile(): void {
    const tile = this.currentTile();
    if (!tile) return;

    const shape = tile.shape;
    const height = tile.height;
    const width = tile.width;
    
    // Miroir horizontal : inverser les colonnes
    const newShape: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            newShape[r][width - 1 - c] = shape[r][c];
        }
    }

    const mirroredTile: Tile = {
        ...tile,
        shape: newShape,
        height: height,
        width: width,
        barycenter: {
          r: Math.floor(height / 2),
          c: Math.floor(width / 2),
        },
    };
    
    this._gameState.update(state => ({ ...state, currentTile: mirroredTile }));
    this.saveGameState();
    this.soundService.playRotateSound();
  }

  public canMirrorTile(tile: Tile | null): boolean {
    if (!tile) return false;
    
    // Les pièces symétriques n'ont pas besoin de miroir
    // Vérifier si la pièce est asymétrique horizontalement
    const shape = tile.shape;
    const height = shape.length;
    const width = shape[0].length;
    
    // Si la pièce est symétrique horizontalement, le miroir ne change rien
    let isSymmetric = true;
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < Math.floor(width / 2); c++) {
            if (shape[r][c] !== shape[r][width - 1 - c]) {
                isSymmetric = false;
                break;
            }
        }
        if (!isSymmetric) break;
    }
    
    // Retourner true si la pièce n'est pas symétrique (peut être miroirée)
    return !isSymmetric;
  }

  public swapTiles(): void {
    const state = this.state();
    if (!state.currentTile || !state.nextTile) return;
    
    this._gameState.update(s => ({
      ...s,
      currentTile: s.nextTile,
      nextTile: s.currentTile
    }));
    this.saveGameState();
    this.soundService.playSwapSound();
  }

  public canPlaceTile(tile: Tile, startRow: number, startCol: number): boolean {
    const grid = this.grid();
    const gridSize = this.gridSize();
    for (let r = 0; r < tile.height; r++) {
      for (let c = 0; c < tile.width; c++) {
        if (tile.shape[r][c] === 1) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          if (
            gridRow >= gridSize ||
            gridCol >= gridSize ||
            gridRow < 0 ||
            gridCol < 0 ||
            grid[gridRow][gridCol].blocked ||
            grid[gridRow][gridCol].color !== null
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private canPlaceTileAnywhere(tile: Tile): boolean {
    const gridSize = this.gridSize();
    const startRowOffset = -tile.height + 1;
    const startColOffset = -tile.width + 1;
    for (let r = startRowOffset; r < gridSize; r++) {
        for (let c = startColOffset; c < gridSize; c++) {
            if (this.canPlaceTile(tile, r, c)) {
                return true;
            }
        }
    }
    return false;
  }

  public canPlaceTileInAnyRotation(tile: Tile): boolean {
    if (!tile) return false;
    
    let tempTile: Tile = JSON.parse(JSON.stringify(tile)); 

    for (let i = 0; i < 4; i++) {
        if (this.canPlaceTileAnywhere(tempTile)) {
            return true;
        }
        const shape = tempTile.shape;
        const height = tempTile.height;
        const width = tempTile.width;
        
        const newShape: number[][] = Array.from({ length: width }, () => Array(height).fill(0));
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                newShape[c][height - 1 - r] = shape[r][c];
            }
        }
        tempTile.shape = newShape;
        tempTile.height = width;
        tempTile.width = height;
    }

    return false;
  }

  private canPlaceAtLeastOneTile(currentTile: Tile | null, nextTile: Tile | null): boolean {
    // Si au moins une des deux tuiles peut être placée, le jeu continue
    const canPlaceCurrent = currentTile ? this.canPlaceTileInAnyRotation(currentTile) : false;
    const canPlaceNext = nextTile ? this.canPlaceTileInAnyRotation(nextTile) : false;
    return canPlaceCurrent || canPlaceNext;
  }

  private _findCompletedLines(grid: Cell[][]): { cellsToClear: Set<string>; points: number; linesCleared: number; } {
    const gridSize = grid.length;
    const cellsToClear = new Set<string>();
    let linesCleared = 0;

    for (let r = 0; r < gridSize; r++) {
        const playableCells: { c: number; cell: Cell }[] = [];
        for (let c = 0; c < gridSize; c++) {
          if (!grid[r][c].blocked) playableCells.push({ c, cell: grid[r][c] });
        }
        if (playableCells.length === 0) continue;
        const firstColor = playableCells[0].cell.color;
        if (firstColor === null) continue;
        if (playableCells.every(({ cell }) => cell.color === firstColor)) {
            linesCleared++;
            for (const { c } of playableCells) {
                cellsToClear.add(`${r},${c}`);
            }
        }
    }

    for (let c = 0; c < gridSize; c++) {
        const playableCells: { r: number; cell: Cell }[] = [];
        for (let r = 0; r < gridSize; r++) {
          if (!grid[r][c].blocked) playableCells.push({ r, cell: grid[r][c] });
        }
        if (playableCells.length === 0) continue;
        const firstColor = playableCells[0].cell.color;
        if (firstColor === null) continue;
        if (playableCells.every(({ cell }) => cell.color === firstColor)) {
            linesCleared++;
            for (const { r } of playableCells) {
                cellsToClear.add(`${r},${c}`);
            }
        }
    }

    const points = linesCleared * gridSize * 25 * this.scoreMultiplier();
    return { cellsToClear, points, linesCleared };
  }

  /**
   * Après un shrink (ou toute "mise à jour" de grille), il peut arriver que la grille
   * contienne déjà une ligne/colonne complète (même couleur).
   * Si on laisse cet état, le prochain placement déclenche un clear/expand "gratuit"
   * et l'aide de placement devient incohérente (souvent (0,0)).
   *
   * On résout donc immédiatement : clear des lignes/colonnes complètes + points + expand.
   */
  private resolveCompletedLinesAndExpandIfNeeded(): void {
    const grid = this.grid();
    const clearInfo = this._findCompletedLines(grid);
    if (clearInfo.linesCleared <= 0) return;

    const gridAfterLineClear = grid.map((row, r) =>
      row.map((cell, c) =>
        clearInfo.cellsToClear.has(`${r},${c}`)
          ? { color: null, tileId: null }
          : { color: cell.color, tileId: cell.tileId }
      )
    );

    const currentState = this.state();
    const newScore = currentState.score + clearInfo.points;
    const { grid: validatedGrid } = this._updateValidatedGroups(gridAfterLineClear);

    this._gameState.update((s) => ({
      ...s,
      grid: validatedGrid,
      score: newScore,
    }));
    this.updateBestScore(newScore);
    this.saveGameState();
    this.emitScoreGain(clearInfo.points, clearInfo.cellsToClear);

    this.soundService.playClearSound(clearInfo.linesCleared);
    this.changeGridSize(1);
  }
  
  public placeTile(tile: Tile, startRow: number, startCol: number): void {
      if (!this.canPlaceTile(tile, startRow, startCol)) return;
      if (this._isPlacementAnimating() || this.state().isShrinking) return;

      this.pushUndoSnapshot();
      this._isPlacementAnimating.set(true);

      let gridWithTile = this.grid().map(row => row.map(cell => ({ ...cell })));
      for (let r = 0; r < tile.height; r++) {
        for (let c = 0; c < tile.width; c++) {
          if (tile.shape[r][c] === 1) {
            const gridRow = startRow + r;
            const gridCol = startCol + c;
            gridWithTile[gridRow][gridCol] = { color: tile.color, tileId: tile.id };
          }
        }
      }

      const clearInfo = this._findCompletedLines(gridWithTile);

      if (clearInfo.linesCleared > 0) {
        const gridWithClearing = gridWithTile.map((row, r) =>
          row.map((cell, c) => {
            if (clearInfo.cellsToClear.has(`${r},${c}`)) {
              return { ...cell, clearing: true };
            }
            return cell;
          })
        );
        
        const currentState = this.state();
        const newScore = currentState.score + clearInfo.points;
        this._gameState.update(state => ({
          ...state,
          grid: gridWithClearing,
          currentTile: null,
          lastPlacedTileId: tile.id,
          score: newScore
        }));
        this.updateBestScore(newScore);
        this.saveGameState();
        this.emitScoreGain(clearInfo.points, clearInfo.cellsToClear);
        
        // Son de placement suivi du son de suppression
        this.soundService.playPlaceSound();
        setTimeout(() => {
          this.soundService.playClearSound(clearInfo.linesCleared);
        }, 50);
        
        setTimeout(() => {
          const finalGrid = gridWithClearing.map((row) =>
            row.map((cell) => cell.clearing ? { color: null, tileId: null } : { ...cell })
          );
          const oldValidatedCount = this.grid().reduce((count, row) => 
            count + row.filter(cell => cell.validated).length, 0
          );
          const { grid: finalGridWithValidated, validatedGroupCount } = this._updateValidatedGroups(finalGrid);
          const newValidatedCount = finalGridWithValidated.reduce((count, row) => 
            count + row.filter(cell => cell.validated).length, 0
          );
          
          // Détecter si de nouveaux groupes ont été validés
          if (newValidatedCount > oldValidatedCount && validatedGroupCount > 0) {
            this.soundService.playVictorySound(validatedGroupCount);
          }
          
          this._gameState.update(state => ({ ...state, grid: finalGridWithValidated, lastPlacedTileId: null }));
          this.saveGameState();
          this.grantUndoChargesForValidated(newValidatedCount - oldValidatedCount);
          this.changeGridSize(1);
          this.advanceToNextTile();
          this._isPlacementAnimating.set(false);
        }, ANIMATION_DURATION);

      } else {
        const oldValidatedCount = this.grid().reduce((count, row) => 
          count + row.filter(cell => cell.validated).length, 0
        );
        const { grid: gridWithValidated, validatedGroupCount } = this._updateValidatedGroups(gridWithTile);
        const newValidatedCount = gridWithValidated.reduce((count, row) => 
          count + row.filter(cell => cell.validated).length, 0
        );
        
        this._gameState.update(state => ({
          ...state,
          grid: gridWithValidated,
          currentTile: null,
          lastPlacedTileId: tile.id,
        }));
        this.saveGameState();
        this.grantUndoChargesForValidated(newValidatedCount - oldValidatedCount);
        this.saveGameState();
        
        // Son de placement simple
        this.soundService.playPlaceSound();
        
        // Détecter si de nouveaux groupes ont été validés
        if (newValidatedCount > oldValidatedCount && validatedGroupCount > 0) {
          setTimeout(() => {
            this.soundService.playVictorySound(validatedGroupCount);
          }, 100);
        }
        
        setTimeout(() => {
          this._gameState.update(s => ({...s, lastPlacedTileId: null}));
          this.saveGameState();
          this.advanceToNextTile();
          this._isPlacementAnimating.set(false);
        }, ANIMATION_DURATION);
      }
  }

  public previewLineClears(grid: Cell[][], tile: Tile, startRow: number, startCol: number): Set<string> {
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const gridSize = this.gridSize();

    for (let r = 0; r < tile.height; r++) {
      for (let c = 0; c < tile.width; c++) {
        if (tile.shape[r][c] === 1) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          if (gridRow >= 0 && gridRow < gridSize && gridCol >= 0 && gridCol < gridSize) {
            tempGrid[gridRow][gridCol] = { ...tempGrid[gridRow][gridCol], color: tile.color, tileId: tile.id };
          }
        }
      }
    }

    const clearInfo = this._findCompletedLines(tempGrid);
    return clearInfo.cellsToClear;
  }

  public getLineClearPointsForPlacement(tile: Tile, startRow: number, startCol: number): number {
    if (!this.canPlaceTile(tile, startRow, startCol)) {
      return 0;
    }
    const tempGrid = this.grid().map(row => row.map(cell => ({ ...cell })));
    const gridSize = this.gridSize();

    for (let r = 0; r < tile.height; r++) {
      for (let c = 0; c < tile.width; c++) {
        if (tile.shape[r][c] === 1) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          if (gridRow >= 0 && gridRow < gridSize && gridCol >= 0 && gridCol < gridSize) {
            tempGrid[gridRow][gridCol] = { ...tempGrid[gridRow][gridCol], color: tile.color, tileId: tile.id };
          }
        }
      }
    }

    const clearInfo = this._findCompletedLines(tempGrid);
    return clearInfo.points;
  }

  private rotateTileOnce(tile: Tile): Tile {
    const shape = tile.shape;
    const height = tile.height;
    const width = tile.width;
    const newShape: number[][] = Array.from({ length: width }, () => Array(height).fill(0));
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        newShape[c][height - 1 - r] = shape[r][c];
      }
    }
    return {
      ...tile,
      shape: newShape,
      width: height,
      height: width,
    };
  }

  public findBestLineClearPlacement(tile: Tile | null): { startRow: number; startCol: number; points: number; shape: number[][]; width: number; height: number } | null {
    if (!tile) return null;
    const gridSize = this.gridSize();
    let best: { startRow: number; startCol: number; points: number; shape: number[][]; width: number; height: number } | null = null;
    let tempTile: Tile = {
      ...tile,
      shape: tile.shape.map(row => row.slice()),
    };

    for (let rotation = 0; rotation < 4; rotation++) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (!this.canPlaceTile(tempTile, r, c)) continue;
          const points = this.getLineClearPointsForPlacement(tempTile, r, c);
          if (points <= 0) continue;
          if (!best || points > best.points) {
            best = { startRow: r, startCol: c, points, shape: tempTile.shape, width: tempTile.width, height: tempTile.height };
          }
        }
      }
      tempTile = this.rotateTileOnce(tempTile);
    }

    return best;
  }

  public setPreviewLinePoints(points: number): void {
    this._previewLinePoints.set(points);
  }

  private _updateValidatedGroups(grid: Cell[][]): { grid: Cell[][]; validatedGroupCount: number } {
    const gridSize = grid.length;
    // Calculer minSize basé sur la taille de la grille passée plutôt que sur le state
    let minSize: number;
    if (gridSize === 6) minSize = 6;
    else if (gridSize === 7) minSize = 8;
    else if (gridSize === 8) minSize = 10;
    else if (gridSize === 9) minSize = 12;
    else if (gridSize === 10) minSize = 12;
    else minSize = gridSize + 2;
    
    const visited = new Set<string>();
    const newGrid = grid.map(row => row.map(cell => ({...cell, validated: false})));
    let validatedGroupCount = 0;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const key = `${r},${c}`;
            if (visited.has(key) || newGrid[r][c].color === null || newGrid[r][c].blocked) {
                continue;
            }

            const currentGroup = new Set<string>();
            const queue: {r: number, c: number}[] = [{ r, c }];
            visited.add(key);
            const colorToFind = newGrid[r][c].color;

            while (queue.length > 0) {
                const { r: cr, c: cc } = queue.shift()!;
                currentGroup.add(`${cr},${cc}`);
                
                const neighbors = [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]];
                for (const [nr, nc] of neighbors) {
                    const nKey = `${nr},${nc}`;
                    if (
                        nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && 
                        !visited.has(nKey) && !newGrid[nr][nc].blocked &&
                        newGrid[nr][nc].color === colorToFind
                    ) {
                        visited.add(nKey);
                        queue.push({r: nr, c: nc});
                    }
                }
            }
            
            if (currentGroup.size >= minSize) {
                validatedGroupCount++;
                currentGroup.forEach(cellKey => {
                    const [row, col] = cellKey.split(',').map(Number);
                    newGrid[row][col].validated = true;
                });
            }
        }
    }

    return { grid: newGrid, validatedGroupCount };
  }

  private changeGridSize(delta: 1 | -1): void {
    const oldState = this.state();
    const newSize = oldState.gridSize + delta;

    if (newSize < MIN_GRID_SIZE || newSize > MAX_GRID_SIZE || oldState.isShrinking) {
        return;
    }

    if (delta === 1) { // Expanding
        const oldSize = oldState.gridSize;
        const newGrid = this.createEmptyGrid(newSize);
        const dir = this.changeDirectionIndex();

        for (let r = 0; r < oldSize; r++) {
            for (let c = 0; c < oldSize; c++) {
                switch (dir) {
                    case 0: newGrid[r][c] = { ...oldState.grid[r][c] }; break;
                    case 1: newGrid[r][c + 1] = { ...oldState.grid[r][c] }; break;
                    case 2: newGrid[r + 1][c + 1] = { ...oldState.grid[r][c] }; break;
                    case 3: newGrid[r + 1][c] = { ...oldState.grid[r][c] }; break;
                }
            }
        }

        const { grid: validatedGrid } = this._updateValidatedGroups(newGrid);
        this._gameState.update(state => ({
            ...state,
            grid: validatedGrid,
            gridSize: newSize,
            changeDirectionIndex: (state.changeDirectionIndex + 1) % 4
        }));
        this._gridResize.set({ id: ++this._animSeq, from: oldSize, to: newSize, dir });
        this.saveGameState();
        this.soundService.playExpandSound();
    } else { // Shrinking
        this._gameState.update(state => ({ ...state, isShrinking: true }));
        const grid = this.grid();
        const validatedCellsToClear = new Set<string>();
        grid.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell.validated) {
                    validatedCellsToClear.add(`${r},${c}`);
                }
            });
        });

        if (validatedCellsToClear.size > 0) {
            const gridWithClearing = grid.map((row, r) =>
                row.map((cell, c) => validatedCellsToClear.has(`${r},${c}`) ? { ...cell, clearing: true, validated: false } : cell)
            );
            
            const points = validatedCellsToClear.size * 15 * this.scoreMultiplier();
            const currentState = this.state();
            const newScore = currentState.score + points;
            this._gameState.update(state => ({ ...state, grid: gridWithClearing, score: newScore }));
            this.updateBestScore(newScore);
            this.saveGameState();
            this.emitScoreGain(points, validatedCellsToClear);

            // Son de suppression des cellules validées
            this.soundService.playClearSound(Math.ceil(validatedCellsToClear.size / 3));

            setTimeout(() => {
                const gridAfterClear = grid.map((row, r) =>
                    row.map((cell, c) => validatedCellsToClear.has(`${r},${c}`) ? { color: null, tileId: null } : cell)
                );
                this.startShrinkWarningPhase(gridAfterClear);
            }, ANIMATION_DURATION);
        } else {
            this.startShrinkWarningPhase(grid);
        }
    }
  }

  private startShrinkWarningPhase(grid: Cell[][]): void {
    const oldSize = grid.length;
    const newSize = oldSize - 1;
    const dir = this.changeDirectionIndex();

    if (newSize < MIN_GRID_SIZE) {
        const finalScore = this.state().score;
        this._gameState.update(s => ({...s, isGameOver: true, isShrinking: false }));
        this.soundService.playGameOverSound();
        this.updateBestScore(finalScore);
        this.saveGameState();
        return;
    }

    const cellsToWarn = new Set<string>();
    for (let r = 0; r < oldSize; r++) {
        for (let c = 0; c < oldSize; c++) {
            if (grid[r][c].color) {
                let shouldWarn = false;
                switch(dir) {
                    case 0: shouldWarn = r >= newSize || c >= newSize; break;
                    case 1: shouldWarn = r >= newSize || c < 1; break;
                    case 2: shouldWarn = r < 1 || c < 1; break;
                    case 3: shouldWarn = r < 1 || c >= newSize; break;
                }
                if (shouldWarn) cellsToWarn.add(`${r},${c}`);
            }
        }
    }

    const gridWithWarning = grid.map((row, r) =>
        row.map((cell, c) => {
            return cellsToWarn.has(`${r},${c}`) ? { ...cell, shrinking: true } : cell;
        })
    );
    
    this._gameState.update(state => ({ ...state, grid: gridWithWarning }));
  
    setTimeout(() => {
      // Les cases retirées explosent, puis la grille se resserre
      this._shrinkBurst.set({ id: ++this._animSeq, size: oldSize, dir });
      setTimeout(() => {
        this._shrinkBurst.set(null);
        const newGrid = this.createEmptyGrid(newSize);
        for (let r = 0; r < newSize; r++) {
            for (let c = 0; c < newSize; c++) {
                switch (dir) {
                    case 0: newGrid[r][c] = grid[r][c]; break;
                    case 1: newGrid[r][c] = grid[r][c + 1]; break;
                    case 2: newGrid[r][c] = grid[r + 1][c + 1]; break;
                    case 3: newGrid[r][c] = grid[r + 1][c]; break;
                }
            }
        }
        
        const { grid: validatedGrid } = this._updateValidatedGroups(newGrid);
        this._gameState.update(state => ({ 
          ...state, 
          grid: validatedGrid, 
          gridSize: newSize, 
          isShrinking: false,
          changeDirectionIndex: (state.changeDirectionIndex + 1) % 4
        }));
        this._gridResize.set({ id: ++this._animSeq, from: oldSize, to: newSize, dir });
        this.saveGameState();


        // Si le shrink a créé une ligne/colonne déjà complète, on la résout tout de suite
        // (sinon ça "pollue" le prochain coup et les aides de placement).
        this.resolveCompletedLinesAndExpandIfNeeded();

        // Vérifier si au moins une des deux tuiles peut être placée après le shrink
        if (!this.canPlaceAtLeastOneTile(this.currentTile(), this.nextTile())) {
            const finalScore = this.state().score;
            this._gameState.update(s => ({...s, isGameOver: true }));
            this.soundService.playGameOverSound();
            this.updateBestScore(finalScore);
            this.saveGameState();
        }
      }, SHRINK_BURST_DURATION);
    }, SHRINK_WARNING_DURATION);
  }
}
