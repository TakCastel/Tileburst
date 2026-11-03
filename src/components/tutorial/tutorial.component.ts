import {
  Component, ChangeDetectionStrategy, inject, computed, effect, OnDestroy, signal, untracked, viewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TilePreviewComponent } from '../tile-preview/tile-preview.component';
import { Tile } from '../../models/game.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule, RotateCwSquare, Replace } from 'lucide-angular';
import { TutorialService, TutorialStepId } from '../../services/tutorial.service';
import { I18nService } from '../../services/i18n.service';
import { OptionsService } from '../../services/options.service';
import { SoundService } from '../../services/sound.service';
import { ColorblindIconService } from '../../services/colorblind-icon.service';
import {
  TutGrid, TutPiece, parseGrid, piece, rotatePiece, anchor, pieceCells, canPlace, withPiece,
  completedLines, markValidated, growGrid, shrinkGrid, isOnShrinkEdge, minGroupSize,
} from './tutorial-engine';

type Status = 'playing' | 'busy' | 'success' | 'retry';
type ShrinkPhase = 'intro' | 'watching' | 'after';

interface Level {
  grid: string[];
  current: TutPiece;
  next?: TutPiece;
  /** Cases conseillées une fois la grille rétrécie */
  afterShrinkTargets?: [number, number][];
}

/** Pièces de base (mêmes formes que le jeu) */
const DOMINO = [[1, 1]];
const I3 = [[1, 1, 1]];
const L3 = [[1, 0], [1, 1]];
const O4 = [[1, 1], [1, 1]];

/**
 * Niveaux du tuto. Lettres = couleurs (b r g y p), `.` = vide, `*` = case conseillée.
 * Chaque niveau n'a qu'une manière "intéressante" de réussir pour guider le joueur.
 */
const LEVELS: Record<Exclude<TutorialStepId, 'finish'>, () => Level> = {
  place: () => ({
    grid: ['....', '....', '....', '....'],
    current: piece(L3, 'green'),
  }),
  // Le carré ne rentre nulle part: il faut échanger, puis pivoter la barre pour la fente verticale
  tools: () => ({
    grid: ['rygpb', 'gr*yp', 'yp*rg', 'pg*by', 'brypg'],
    current: piece(O4, 'yellow'),
    next: piece(I3, 'blue'),
  }),
  line: () => ({
    grid: ['b..g.', '..y..', 'rrr**', '.p...', '...yb'],
    current: piece(DOMINO, 'red'),
  }),
  group: () => ({
    grid: ['......', '.pp...', '..p.g.', '..p**.', 'y....r', '....bb'],
    current: piece(DOMINO, 'purple'),
  }),
  // Grille pleine: la pièce ne rentre pas, la grille rétrécit et encaisse le groupe violet.
  // En 4×4, la seule place du carré complète la ligne jaune du haut: la grille regrandit.
  shrink: () => ({
    grid: ['ppyyg', 'ppppr', 'prgby', 'gbryb', 'rybgr'],
    current: piece(O4, 'yellow'),
    afterShrinkTargets: [[0, 0], [0, 1], [1, 0], [1, 1]],
  }),
};

const CLEAR_MS = 320;
const RETRY_MS = 1300;
const SHRINK_START_MS = 1700;
const SHRINK_WARNING_MS = 1100;

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'onKeydown($event)',
  },
})
export class TutorialComponent implements OnDestroy {
  protected tutorialService = inject(TutorialService);
  protected i18n = inject(I18nService);
  private options = inject(OptionsService);
  private sound = inject(SoundService);
  private colorblindIcons = inject(ColorblindIconService);
  private sanitizer = inject(DomSanitizer);

  readonly RotateIcon = RotateCwSquare;
  readonly SwapIcon = Replace;

  isTutorialActive = this.tutorialService.isTutorialActive;
  currentStep = this.tutorialService.currentStep;
  activeStepIndex = this.tutorialService.activeStepIndex;
  steps = this.tutorialService.allSteps;
  isFirstStep = this.tutorialService.isFirstStep;
  isLastStep = this.tutorialService.isLastStep;

  private boardRef = viewChild<ElementRef<HTMLElement>>('board');

  // --- État du mini-jeu ---
  grid = signal<TutGrid>([]);
  current = signal<TutPiece | null>(null);
  next = signal<TutPiece | null>(null);
  status = signal<Status>('playing');
  shrinkPhase = signal<ShrinkPhase>('intro');
  /** Étapes déjà réussies (le bouton Suivant passe en vert) */
  solved = signal<Set<TutorialStepId>>(new Set());
  hover = signal<{ r: number; c: number } | null>(null);
  /** Pièce en cours de glisser (mêmes règles que le jeu, voir AppComponent.startDrag) */
  isDragging = signal(false);
  /** Coin haut-gauche du fantôme */
  ghostPosition = signal<{ x: number; y: number } | null>(null);
  /** Taille réelle d'une case de la grille du tuto et des écarts */
  ghostCell = signal({ cell: 40, cellH: 40, gap: 4, rowGap: 4 });
  /** Souris au-dessus d'une place valide: le fantôme s'aimante sur les cases */
  ghostSnap = signal<{ x: number; y: number } | null>(null);
  /** Au doigt: la pièce suit librement, l'emplacement est surligné sur la grille */
  ghostFree = signal(false);
  /** Point de la pièce attrapé, gardé sous le pointeur */
  ghostGrab = signal({ x: 0, y: 0 });
  /** Départ de l'animation d'envol (taille sur la carte) */
  ghostEnter = signal({ scaleX: 1, scaleY: 1 });
  /** Points flottants affichés au-dessus de la grille */
  bonus = signal<{ id: number; value: number } | null>(null);
  /** Rejoue l'animation de changement de taille de la grille */
  resizeTick = signal(0);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private bonusSeq = 0;
  private pointerStart: { x: number; y: number; id: number; moved: boolean; mouse: boolean } | null = null;

  gridSize = computed(() => this.grid().length);
  isSolved = computed(() => {
    const step = this.currentStep();
    return !!step && this.solved().has(step.id);
  });

  /** Message sous le titre: consigne, réussite ou "réessaie" */
  message = computed(() => {
    const step = this.currentStep();
    const t = this.i18n.t().tutorial;
    if (!step || step.id === 'finish') return { text: '', tone: 'hint' };
    const status = this.status();
    if (status === 'success') return { text: t[step.id].success, tone: 'success' };
    if (status === 'retry') return { text: t.tryAgain, tone: 'retry' };
    if (step.id === 'shrink') {
      const phase = this.shrinkPhase();
      if (phase === 'watching') return { text: t.shrink.watching, tone: 'hint' };
      if (phase === 'after') return { text: t.shrink.after, tone: 'hint' };
    }
    return { text: t[step.id].hint, tone: 'hint' };
  });

  /** Aperçu de la pièce sous le pointeur */
  preview = computed(() => {
    const h = this.hover();
    const p = this.current();
    if (!h || !p || this.status() !== 'playing') return null;
    const a = anchor(p);
    const start = { r: h.r - a.r, c: h.c - a.c };
    const grid = this.grid();
    const valid = canPlace(grid, p, start.r, start.c);
    const keys = new Set(pieceCells(p, start.r, start.c).map(({ r, c }) => `${r},${c}`));
    const clear = valid ? completedLines(withPiece(grid, p, start.r, start.c)).cells : new Set<string>();
    return { start, valid, keys, clear };
  });

  private loadLevelEffect = effect(() => {
    const step = this.currentStep();
    const active = this.isTutorialActive();
    untracked(() => {
      this.clearTimers();
      this.endDrag();
      if (active && step) this.loadLevel(step.id);
    });
  });

  private scrollBlockEffect = effect(() => {
    if (this.isTutorialActive()) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      this.unlockScroll();
    }
  });

  ngOnDestroy(): void {
    this.clearTimers();
    this.endDrag();
    this.unlockScroll();
  }

  private unlockScroll(): void {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    if (scrollY) window.scrollTo(0, parseInt(scrollY, 10) * -1);
  }

  // ---------------------------------------------------------------------------
  // Niveaux
  // ---------------------------------------------------------------------------

  private loadLevel(id: TutorialStepId): void {
    this.hover.set(null);
    this.bonus.set(null);
    this.shrinkPhase.set('intro');
    if (id === 'finish') {
      this.grid.set([]);
      this.current.set(null);
      this.next.set(null);
      this.status.set('success');
      this.markSolved('finish');
      return;
    }
    const level = LEVELS[id]();
    this.grid.set(markValidated(parseGrid(level.grid)).grid);
    this.current.set(level.current);
    this.next.set(level.next ?? null);
    this.status.set('playing');
    if (id === 'shrink') this.later(() => this.playShrink(), SHRINK_START_MS);
  }

  /** Rejoue l'étape après une erreur */
  private resetLevel(): void {
    const step = this.currentStep();
    if (!step) return;
    this.clearTimers();
    this.endDrag();
    this.loadLevel(step.id);
  }

  private markSolved(id: TutorialStepId): void {
    this.solved.update(s => new Set(s).add(id));
  }

  private succeed(): void {
    const step = this.currentStep();
    if (!step) return;
    this.status.set('success');
    this.markSolved(step.id);
  }

  private fail(): void {
    this.status.set('retry');
    this.later(() => this.resetLevel(), RETRY_MS);
  }

  /** Séquence de rétrécissement: les validés sont encaissés, puis le bord disparaît */
  private playShrink(): void {
    this.status.set('busy');
    this.shrinkPhase.set('watching');
    this.hover.set(null);
    const size = this.gridSize();
    const validated = this.grid().flat().filter(c => c.validated).length;

    this.grid.update(g => g.map(row => row.map(cell => (cell.validated ? { ...cell, clearing: true } : cell))));
    this.sound.playClearSound(Math.ceil(validated / 3));
    this.showBonus(validated * 15 * (size - 3));

    this.later(() => {
      this.grid.update(g =>
        g.map((row, r) =>
          row.map((cell, c) => {
            if (cell.clearing) return { color: null };
            return cell.color && isOnShrinkEdge(size, r, c) ? { ...cell, shrinking: true } : cell;
          })
        )
      );
      this.sound.playShrinkWarningSound();
      this.later(() => {
        const targets = LEVELS.shrink().afterShrinkTargets ?? [];
        const shrunk = shrinkGrid(this.grid());
        targets.forEach(([r, c]) => (shrunk[r][c] = { ...shrunk[r][c], target: true }));
        this.grid.set(shrunk);
        this.resizeTick.update(n => n + 1);
        this.sound.playShrinkSound();
        this.shrinkPhase.set('after');
        this.status.set('playing');
      }, SHRINK_WARNING_MS);
    }, CLEAR_MS);
  }

  // ---------------------------------------------------------------------------
  // Actions du joueur
  // ---------------------------------------------------------------------------

  private canAct(): boolean {
    return this.status() === 'playing' && !!this.current();
  }

  rotate(): void {
    if (!this.canAct()) return;
    this.current.update(p => (p ? rotatePiece(p) : p));
    this.sound.playRotateSound();
  }

  swap(): void {
    if (!this.canAct() || !this.next()) return;
    const cur = this.current();
    this.current.set(this.next());
    this.next.set(cur);
    this.sound.playSwapSound();
  }

  private place(startRow: number, startCol: number): void {
    const p = this.current();
    const step = this.currentStep();
    if (!p || !step || !this.canAct() || !canPlace(this.grid(), p, startRow, startCol)) return;

    const size = this.gridSize();
    const validatedBefore = this.grid().flat().filter(c => c.validated).length;
    const placed = withPiece(this.grid(), p, startRow, startCol);
    const { cells: toClear, lines } = completedLines(placed);
    this.current.set(null);
    // Plus de pièce à jouer après ce coup: la suivante disparaît aussi
    this.next.set(null);
    this.hover.set(null);
    this.sound.playPlaceSound();

    if (lines > 0) {
      this.status.set('busy');
      this.grid.set(placed.map((row, r) => row.map((cell, c) => (toClear.has(`${r},${c}`) ? { ...cell, clearing: true } : cell))));
      this.later(() => this.sound.playClearSound(lines), 50);
      this.showBonus(lines * size * 25 * (size - 3));
      this.later(() => {
        const emptied = this.grid().map(row => row.map(cell => (cell.clearing ? { color: null } : cell)));
        this.grid.set(markValidated(growGrid(emptied)).grid);
        this.resizeTick.update(n => n + 1);
        this.sound.playExpandSound();
        this.judge(step.id, lines, 0);
      }, CLEAR_MS);
      return;
    }

    const { grid, groups } = markValidated(placed, minGroupSize(size));
    this.grid.set(grid);
    const newlyValidated = grid.flat().filter(c => c.validated).length - validatedBefore;
    if (newlyValidated > 0) {
      this.later(() => this.sound.playVictorySound(groups), 100);
      this.showBonus(newlyValidated * 15 * (size - 3));
    }
    this.judge(step.id, 0, newlyValidated);
  }

  /** L'objectif de l'étape est-il atteint ? */
  private judge(id: TutorialStepId, lines: number, newlyValidated: number): void {
    const ok =
      id === 'line' ? lines > 0 :
      id === 'group' ? newlyValidated > 0 :
      true;
    if (ok) this.succeed();
    else this.fail();
  }

  private showBonus(value: number): void {
    if (value <= 0) return;
    const id = ++this.bonusSeq;
    this.bonus.set({ id, value });
    this.later(() => {
      if (this.bonus()?.id === id) this.bonus.set(null);
    }, 1200);
  }

  // ---------------------------------------------------------------------------
  // Pointeur: glisser la pièce, ou survoler la grille + clic (souris)
  // ---------------------------------------------------------------------------

  /** Case de la grille sous un point, mêmes règles que GridComponent: dans le carré réel uniquement */
  private cellFromPoint(x: number, y: number): { r: number; c: number } | null {
    const board = this.boardRef()?.nativeElement;
    const size = this.gridSize();
    if (!board || !size) return null;
    const rect = board.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const style = getComputedStyle(board);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padT = parseFloat(style.paddingTop) || 0;
    const w = rect.width - padL - (parseFloat(style.paddingRight) || 0);
    const h = rect.height - padT - (parseFloat(style.paddingBottom) || 0);
    if (w <= 0 || h <= 0) return null;
    return {
      r: Math.max(0, Math.min(size - 1, Math.floor(((y - rect.top - padT) / h) * size))),
      c: Math.max(0, Math.min(size - 1, Math.floor(((x - rect.left - padL) / w) * size))),
    };
  }

  /** Mesure une vraie case de la grille pour dessiner le fantôme à la même taille */
  private measureGridCell(): void {
    const board = this.boardRef()?.nativeElement;
    const cellEl = board?.firstElementChild as HTMLElement | null;
    if (!board || !cellEl) return;
    const r = cellEl.getBoundingClientRect();
    const style = getComputedStyle(board);
    const gap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;
    if (r.width > 0 && r.height > 0) this.ghostCell.set({ cell: r.width, cellH: r.height, gap, rowGap });
  }

  /** Centre de la case-pivot de la pièce, depuis le coin haut-gauche du fantôme */
  private ghostAnchor(): { x: number; y: number } {
    const p = this.current();
    if (!p) return { x: 0, y: 0 };
    const a = anchor(p);
    const { cell, cellH, gap, rowGap } = this.ghostCell();
    return { x: a.c * (cell + gap) + cell / 2, y: a.r * (cellH + rowGap) + cellH / 2 };
  }

  ghostTransform = computed(() => {
    const pos = this.ghostPosition();
    if (!pos) return '';
    const p = this.ghostFree() ? pos : (this.ghostSnap() ?? pos);
    return `translate3d(${p.x}px, ${p.y}px, 0)`;
  });

  onBoardPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || this.isDragging() || !this.canAct()) return;
    this.setHover(this.cellFromPoint(event.clientX, event.clientY));
  }

  onBoardPointerLeave(): void {
    if (!this.isDragging()) this.hover.set(null);
  }

  onBoardClick(): void {
    const prev = this.preview();
    if (prev?.valid && !this.isDragging()) this.place(prev.start.r, prev.start.c);
  }

  onPiecePointerDown(event: PointerEvent): void {
    if (!this.canAct() || event.button > 0) return;
    event.preventDefault();
    this.pointerStart = {
      x: event.clientX, y: event.clientY, id: event.pointerId, moved: false, mouse: event.pointerType === 'mouse',
    };
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerCancel);
  }

  /** Démarre le glisser au point où la pièce a été attrapée (comme AppComponent.startDrag) */
  private startDrag(startX: number, startY: number, free: boolean): void {
    const p = this.current();
    if (!p) return;
    this.measureGridCell();
    const { cell, cellH, gap, rowGap } = this.ghostCell();
    const pw = p.shape[0].length;
    const ph = p.shape.length;
    const w = pw * cell + (pw - 1) * gap;
    const h = ph * cellH + (ph - 1) * rowGap;
    const from = (document.querySelector('.tut-tray-current app-tile-preview .grid') as HTMLElement | null)
      ?.getBoundingClientRect();
    if (from && from.width > 0 && from.height > 0) {
      const fx = Math.min(1, Math.max(0, (startX - from.left) / from.width));
      const fy = Math.min(1, Math.max(0, (startY - from.top) / from.height));
      this.ghostGrab.set({ x: fx * w, y: fy * h });
      this.ghostEnter.set({ scaleX: from.width / w, scaleY: from.height / h });
    } else {
      this.ghostGrab.set(this.ghostAnchor());
      this.ghostEnter.set({ scaleX: 1, scaleY: 1 });
    }
    this.ghostFree.set(free);
    this.isDragging.set(true);
  }

  /** Le fantôme suit le pointeur; on vise le centre de sa case-pivot, là où on la voit */
  private moveDrag(clientX: number, clientY: number): void {
    const g = this.ghostGrab();
    const a = this.ghostAnchor();
    const topLeft = { x: clientX - g.x, y: clientY - g.y };
    this.ghostPosition.set(topLeft);
    this.setHover(this.cellFromPoint(topLeft.x + a.x, topLeft.y + a.y));
    this.updateGhostSnap();
  }

  /** Aimante le fantôme sur la vraie case de départ quand la place est valide */
  private updateGhostSnap(): void {
    const prev = this.preview();
    const board = this.boardRef()?.nativeElement;
    if (!prev?.valid || !board) { this.ghostSnap.set(null); return; }
    const cellEl = board.children[prev.start.r * this.gridSize() + prev.start.c] as HTMLElement | undefined;
    if (!cellEl) { this.ghostSnap.set(null); return; }
    const c = cellEl.getBoundingClientRect();
    this.ghostSnap.set({ x: c.left, y: c.top });
  }

  private onWindowPointerMove = (event: PointerEvent): void => {
    const start = this.pointerStart;
    if (!start || event.pointerId !== start.id) return;
    if (!start.moved) {
      // Un vrai déplacement démarre le glisser, sinon c'est un tap (rotation), comme dans le jeu
      const threshold = start.mouse ? 5 : 8;
      if (Math.abs(event.clientX - start.x) <= threshold && Math.abs(event.clientY - start.y) <= threshold) return;
      start.moved = true;
      this.startDrag(start.x, start.y, !start.mouse);
    }
    this.moveDrag(event.clientX, event.clientY);
  };

  private onWindowPointerUp = (event: PointerEvent): void => {
    const start = this.pointerStart;
    if (!start || event.pointerId !== start.id) return;
    const wasDrag = start.moved;
    if (wasDrag) this.moveDrag(event.clientX, event.clientY);
    const prev = this.preview();
    this.endDrag();
    if (!wasDrag) {
      this.rotate();
      return;
    }
    if (prev?.valid) this.place(prev.start.r, prev.start.c);
  };

  private onWindowPointerCancel = (): void => this.endDrag();

  private endDrag(): void {
    this.pointerStart = null;
    this.isDragging.set(false);
    this.ghostPosition.set(null);
    this.ghostSnap.set(null);
    this.ghostFree.set(false);
    this.hover.set(null);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerCancel);
  }

  private setHover(cell: { r: number; c: number } | null): void {
    const cur = this.hover();
    if (cur?.r === cell?.r && cur?.c === cell?.c) return;
    this.hover.set(cell);
  }

  /** Pièce du tuto au format du jeu, pour l'afficher avec app-tile-preview */
  private tileCache = new WeakMap<TutPiece, Tile>();
  asTile(p: TutPiece): Tile {
    let t = this.tileCache.get(p);
    if (!t) {
      const height = p.shape.length;
      const width = p.shape[0].length;
      t = { id: 0, shape: p.shape, color: p.color, width, height, barycenter: anchor(p) };
      this.tileCache.set(p, t);
    }
    return t;
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.isTutorialActive()) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') this.close();
    else if (key === 'r' || key === ' ') { event.preventDefault(); this.rotate(); }
    else if (key === 'f') this.swap();
    else if (key === 'arrowright' || key === 'enter') this.isLastStep() ? this.close() : this.next_();
    else if (key === 'arrowleft') this.previous();
  }

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  private bg(color: string | null | undefined): string {
    if (!color) return '';
    return this.options.getColorPaletteClasses(this.options.colorPalette())[color]?.bg ?? 'bg-slate-400';
  }

  pieceBg(p: TutPiece): string {
    return this.bg(p.color);
  }

  bgFor(color: string): string {
    return this.bg(color);
  }

  cellClass(r: number, c: number): string {
    const cell = this.grid()[r][c];
    const key = `${r},${c}`;
    const prev = this.preview();
    if (cell.shrinking) return 'cell-shrinking-warning';
    if (cell.clearing) return `${this.bg(cell.color)} cell-3d animate-explode`;
    if (prev?.keys.has(key)) {
      if (!prev.valid) return 'invalid-placement-preview';
      const pulse = prev.clear.has(key) ? ' animate-clear-preview' : '';
      return `${this.bg(this.current()?.color)} cell-3d placement-preview${pulse}`;
    }
    if (cell.color) {
      const pulse = prev?.clear.has(key) ? ' animate-clear-preview' : '';
      const fresh = cell.fresh ? ' animate-place' : '';
      return `${this.bg(cell.color)} cell-3d${fresh}${pulse}${cell.validated ? ' validated' : ''}`;
    }
    const target = cell.target && this.status() === 'playing' ? ' tut-target' : '';
    return `tut-empty${target}`;
  }

  /** Coche des blocs validés (cachée en mode daltonien: l'icône pleine la remplace) */
  showCheck(r: number, c: number): boolean {
    const cell = this.grid()[r][c];
    return !!cell.validated && !cell.clearing && !cell.shrinking && this.options.colorPalette() !== 'daltonien';
  }

  private iconCache = new Map<string, SafeHtml>();

  colorblindIcon(color: string | null | undefined, filled = false): SafeHtml | null {
    if (!color || this.options.colorPalette() !== 'daltonien') return null;
    const shape = this.options.getColorblindShape(color);
    if (!shape) return null;
    const key = `${shape}-${filled}`;
    if (!this.iconCache.has(key)) {
      this.iconCache.set(key, this.sanitizer.bypassSecurityTrustHtml(this.colorblindIcons.getShapeSvg(shape, filled, 24)));
    }
    return this.iconCache.get(key)!;
  }

  cellIcon(r: number, c: number): SafeHtml | null {
    const cell = this.grid()[r][c];
    if (cell.shrinking) return null;
    const prev = this.preview();
    if (prev?.valid && prev.keys.has(`${r},${c}`)) return this.colorblindIcon(this.current()?.color);
    return this.colorblindIcon(cell.color, !!cell.validated);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  close(): void {
    this.clearTimers();
    this.endDrag();
    this.tutorialService.endTutorial();
  }

  next_(): void {
    this.tutorialService.goToNextStep();
  }

  previous(): void {
    this.tutorialService.goToPreviousStep();
  }

  goTo(index: number): void {
    this.tutorialService.goToStep(index);
  }
}
