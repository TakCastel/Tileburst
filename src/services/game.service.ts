import { Injectable, signal, computed, WritableSignal, inject } from '@angular/core';
import { GameState, Cell, Tile } from '../models/game.model';
import { TutorialService } from './tutorial.service';
import { SoundService } from './sound.service';

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
const STORAGE_KEY_GAME_STATE = 'tileburst_game_state';
const STORAGE_KEY_BEST_SCORE = 'tileburst_best_score';

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
  private isFirstGame = true;
  private _bestScore: WritableSignal<number> = signal(this.loadBestScore());

  public readonly bestScore = this._bestScore.asReadonly();

  constructor() {
    // Essayer de restaurer l'état sauvegardé
    const savedState = this.loadGameState();
    if (savedState && !savedState.isGameOver) {
      this.restoreGameState(savedState);
    } else {
      this.startGame();
    }
    // Démarrer le tutoriel seulement au premier chargement de l'app
    if (this.isFirstGame) {
      this.tutorialService.startTutorial();
      this.isFirstGame = false;
    }
  }
  
  private getInitialState(gridSize = STARTING_GRID_SIZE, score = 0): GameState {
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
    };
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
          // Ne pas sauvegarder clearing et shrinking
        }))),
        gridSize: state.gridSize,
        score: state.score,
        currentTile: state.currentTile,
        nextTile: state.nextTile,
        isGameOver: state.isGameOver,
        changeDirectionIndex: state.changeDirectionIndex,
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
    // Effacer l'état sauvegardé
    try {
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'état sauvegardé:', error);
    }
    
    const initialState = this.getInitialState();
    initialState.currentTile = this._generateRandomTile();
    initialState.nextTile = this._generateRandomTile();
    this._gameState.set(initialState);
    this.saveGameState();

    // Vérifier si au moins une des deux tuiles peut être placée
    if (!this.canPlaceAtLeastOneTile(initialState.currentTile, initialState.nextTile)) {
        this._gameState.update(state => ({...state, isGameOver: true}));
        this.updateBestScore(initialState.score);
        this.saveGameState();
    }
    // Ne pas démarrer le tutoriel lors d'un rejeu
  }

  private createEmptyGrid(size: number): Cell[][] {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ color: null, tileId: null }))
    );
  }
  
  private _generateRandomTile(): Tile {
    let availableShapes = [...TILE_SHAPES];
    const size = this.gridSize();

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
      const next = this._generateRandomTile();

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
        const firstColor = grid[r][0].color;
        if (firstColor === null) continue;
        if (grid[r].every(cell => cell.color === firstColor)) {
            linesCleared++;
            for (let c = 0; c < gridSize; c++) {
                cellsToClear.add(`${r},${c}`);
            }
        }
    }

    for (let c = 0; c < gridSize; c++) {
        const firstColor = grid[0][c].color;
        if (firstColor === null) continue;
        let isFullLine = true;
        for (let r = 1; r < gridSize; r++) {
            if (grid[r][c].color !== firstColor) {
                isFullLine = false;
                break;
            }
        }
        if (isFullLine) {
            linesCleared++;
            for (let r = 0; r < gridSize; r++) {
                cellsToClear.add(`${r},${c}`);
            }
        }
    }

    const points = linesCleared * gridSize * 25 * this.scoreMultiplier();
    return { cellsToClear, points, linesCleared };
  }
  
  public placeTile(tile: Tile, startRow: number, startCol: number): void {
      if (!this.canPlaceTile(tile, startRow, startCol)) return;

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
          this.changeGridSize(1);
          this.advanceToNextTile();
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
            if (visited.has(key) || newGrid[r][c].color === null) {
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
                        !visited.has(nKey) && newGrid[nr][nc].color === colorToFind
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
                    case 0: newGrid[r][c] = oldState.grid[r][c]; break; // Expand BR -> Copy to TL
                    case 1: newGrid[r][c + 1] = oldState.grid[r][c]; break; // Expand BL -> Copy to TR
                    case 2: newGrid[r + 1][c + 1] = oldState.grid[r][c]; break; // Expand TL -> Copy to BR
                    case 3: newGrid[r + 1][c] = oldState.grid[r][c]; break; // Expand TR -> Copy to BL
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
        this.saveGameState();
        
        // Son de réduction de grille
        this.soundService.playShrinkSound();

        // Vérifier si au moins une des deux tuiles peut être placée après le shrink
        if (!this.canPlaceAtLeastOneTile(this.currentTile(), this.nextTile())) {
            const finalScore = this.state().score;
            this._gameState.update(s => ({...s, isGameOver: true }));
            this.updateBestScore(finalScore);
            this.saveGameState();
        }
    }, SHRINK_WARNING_DURATION);
  }
}