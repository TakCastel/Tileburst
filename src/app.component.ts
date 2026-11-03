import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit, Injector, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GameService } from './services/game.service';
import { GridComponent } from './components/grid/grid.component';
import { TilePreviewComponent } from './components/tile-preview/tile-preview.component';
import { TutorialComponent } from './components/tutorial/tutorial.component';
import { TutorialService } from './services/tutorial.service';
import { SoundService } from './services/sound.service';
import { I18nService } from './services/i18n.service';
import { OptionsService } from './services/options.service';
import { ColorblindIconService } from './services/colorblind-icon.service';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { LucideAngularModule, Volume2, VolumeX, Sun, Moon, Sparkles, ShieldCheck, Undo2, RotateCwSquare, Replace } from 'lucide-angular';

import { CookieBannerComponent } from './components/cookie-banner/cookie-banner.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, GridComponent, TilePreviewComponent, TutorialComponent, OptionsMenuComponent, LandingPageComponent, CookieBannerComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Pendant le tuto, ses propres raccourcis prennent le relais: la partie ne bouge pas
    '(window:keydown.r)': 'tutorialService.isTutorialActive() || rotateTile()',
    '(window:keydown.space)': 'tutorialService.isTutorialActive() || rotateTile()',
    '(window:keydown.f)': 'tutorialService.isTutorialActive() || onSwapKeyPress()',
    '(window:keydown.z)': 'tutorialService.isTutorialActive() || onUndoKeyPress()',
  },
})
export class AppComponent implements OnInit {
  protected gameService = inject(GameService);
  protected tutorialService = inject(TutorialService);
  protected soundService = inject(SoundService);
  protected i18n = inject(I18nService);
  protected optionsService = inject(OptionsService);
  protected colorblindIconService = inject(ColorblindIconService);
  private sanitizer = inject(DomSanitizer);
  private injector = inject(Injector);

  // État de la landing page
  showLandingPage = signal(true);

  ngOnInit(): void {
    this.portraitQuery?.addEventListener('change', (e) => this.isPortrait.set(e.matches));

    // Ne pas afficher la landing page dans les apps natives Capacitor
    // Les apps natives doivent lancer directement le jeu
    const isCapacitorApp = (window as any).Capacitor !== undefined;
    if (isCapacitorApp) {
      this.showLandingPage.set(false);
      this.gameService.startGame();
      return;
    }

    // Pour le site web uniquement : vérifier si l'utilisateur a déjà visité
    const hasVisited = localStorage.getItem('pavat_has_visited');
    if (hasVisited === 'true') {
      this.showLandingPage.set(false);
    }

    // Écouter l'événement pour lancer le jeu
    window.addEventListener('start-game', () => {
      this.startGame();
    });
  }

  startGame(): void {
    this.showLandingPage.set(false);
    localStorage.setItem('pavat_has_visited', 'true');
    this.gameService.startGame();
  }

  // Icônes Lucide
  readonly Volume2Icon = Volume2;
  readonly VolumeXIcon = VolumeX;
  readonly SunIcon = Sun;
  readonly MoonIcon = Moon;
  readonly SparklesIcon = Sparkles;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly Undo2Icon = Undo2;
  readonly RotateIcon = RotateCwSquare;
  readonly SwapIcon = Replace;
  protected readonly Math = Math;

  score = this.gameService.score;
  bestScore = this.gameService.bestScore;
  previewLinePoints = this.gameService.previewLinePoints;
  shrinkPoints = this.gameService.shrinkPoints;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  nextTile = this.gameService.nextTile;
  isGameOver = this.gameService.isGameOver;
  undoCharges = this.gameService.undoCharges;
  canUndo = this.gameService.canUndo;
  undoProgressPoints = this.gameService.undoProgressPoints;
  undoProgress = this.gameService.undoProgress;
  undoPointsPerCharge = this.gameService.undoPointsPerCharge;
  undoFull = this.gameService.undoFull;
  /** Petit rebond du bouton Annuler quand une annulation est gagnée */
  protected undoGainPulse = signal(false);
  private undoGainEffect = effect(() => {
    if (this.gameService.undoGained() === 0) return;
    this.undoGainPulse.set(false);
    requestAnimationFrame(() => this.undoGainPulse.set(true));
    setTimeout(() => this.undoGainPulse.set(false), 700);
  });
  minValidatedGroupSize = this.gameService.minValidatedGroupSize;
  isSoundEnabled = this.soundService.isSoundEnabled;
  colorPalette = this.optionsService.colorPalette;

  /** Écran portrait (gabarit mobile): les cartes de pièces y sont plus hautes, donc ratio plus petit. */
  private portraitQuery = typeof window !== 'undefined' ? window.matchMedia('(max-aspect-ratio: 1/1)') : null;
  protected isPortrait = signal(this.portraitQuery?.matches ?? false);
  /** Taille max d'une case = hauteur de la zone × ratio (voir app-tile-preview). */
  curCellRatio = computed(() => (this.isPortrait() ? 0.4 : 0.86));
  nextCellRatio = computed(() => (this.isPortrait() ? 0.55 : 0.86));

  /** 4150 → "4 150" */
  fmt(n: number): string {
    return n.toLocaleString('fr-FR').replace(/[\u202f\u00a0,]/g, ' ');
  }

  isDragging = signal(false);
  isHintTooltipVisible = signal(false);
  isRestartConfirmVisible = signal(false);
  /** Coin haut-gauche du fantôme (tuile flottante) pendant un drag, souris ou tactile. */
  protected ghostPosition = signal<{ x: number; y: number } | null>(null);
  /** Taille d'une case de la grille et de l'espace entre cases, mesurée au début du drag. */
  /** Les cases de la grille ne sont pas forcément carrées: largeur/hauteur et écarts mesurés. */
  protected ghostCell = signal({ cell: 40, cellH: 40, gap: 4, rowGap: 4 });
  /** Quand la pièce survole une place valide de la grille, le fantôme s'aimante sur les cases. */
  protected ghostSnap = signal<{ x: number; y: number } | null>(null);
  /**
   * Drag tactile: la pièce suit le doigt librement (pas d'aimantation case par
   * case, qui donnait des saccades). L'emplacement final est surligné sur la grille.
   */
  protected ghostFree = signal(false);
  /**
   * Point de la pièce attrapé par le pointeur (en px, à la taille de la grille).
   * La pièce garde ce point sous le doigt/curseur: elle suit sans sauter.
   */
  protected ghostGrab = signal({ x: 0, y: 0 });
  /** État de départ de l'animation d'envol: taille sur la carte et hauteur à rattraper. */
  protected ghostEnter = signal({ scaleX: 1, scaleY: 1, lift: 0 });
  protected ghostTransform = computed(() => {
    const pos = this.ghostPosition();
    if (!pos) return '';
    const p = this.ghostFree() ? pos : (this.ghostSnap() ?? pos);
    return `translate3d(${p.x}px, ${p.y}px, 0)`;
  });

  /**
   * Aimante le fantôme sur la case visée, avec exactement les règles de la grille
   * (GridComponent.getWorldCellFromClient): même élément, marge ramenée sur la
   * case du bord. Le fantôme se cale sur la vraie case affichée, donc pile sur
   * l'aperçu que dessine la grille, sans doublon décalé.
   */
  private updateGhostSnap(clientX: number, clientY: number): void {
    const tile = this.currentTile();
    const board = document.querySelector('app-grid .tb-board') as HTMLElement | null;
    if (!tile || !board) { this.ghostSnap.set(null); return; }
    const rect = board.getBoundingClientRect();
    // Hors de la grille: la grille ne reçoit pas l'événement (voir dispatchTileDrag)
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      this.ghostSnap.set(null);
      return;
    }
    const st = getComputedStyle(board);
    const padL = parseFloat(st.paddingLeft) || 0;
    const padT = parseFloat(st.paddingTop) || 0;
    const innerW = rect.width - padL - (parseFloat(st.paddingRight) || 0);
    const innerH = rect.height - padT - (parseFloat(st.paddingBottom) || 0);
    if (innerW <= 0 || innerH <= 0) { this.ghostSnap.set(null); return; }
    const n = this.gridSize();
    const col = Math.max(0, Math.min(n - 1, Math.floor(((clientX - rect.left - padL) / innerW) * n)));
    const row = Math.max(0, Math.min(n - 1, Math.floor(((clientY - rect.top - padT) / innerH) * n)));
    const startRow = row - tile.barycenter.r;
    const startCol = col - tile.barycenter.c;
    if (!this.gameService.canPlaceTile(tile, startRow, startCol)) { this.ghostSnap.set(null); return; }
    const cellEl = board.querySelectorAll('.cell-base')[startRow * n + startCol] as HTMLElement | undefined;
    if (!cellEl) { this.ghostSnap.set(null); return; }
    const c = cellEl.getBoundingClientRect();
    this.ghostSnap.set({ x: c.left, y: c.top });
  }

  /** Centre de la case-pivot de la pièce, mesuré depuis le coin haut-gauche du fantôme. */
  protected ghostAnchor = computed(() => {
    const tile = this.currentTile();
    const { cell, cellH, gap, rowGap } = this.ghostCell();
    if (!tile) return { x: 0, y: 0 };
    return {
      x: tile.barycenter.c * (cell + gap) + cell / 2,
      y: tile.barycenter.r * (cellH + rowGap) + cellH / 2,
    };
  });
  private mouseStartPosition: { x: number; y: number } | null = null;
  private isMouseDragActive = false;
  private touchStartPosition: { x: number; y: number } | null = null;
  protected isTouchDragging = signal(false);
  private touchDragStarted = false;
  private ghostLiftPx = 0; // hauteur du fantôme au-dessus du doigt pendant un drag tactile

  restartGame(): void {
    if (this.isGameOver()) {
      this.gameService.startGame();
      return;
    }
    this.isRestartConfirmVisible.set(true);
  }

  showRestartConfirm(): void {
    this.isRestartConfirmVisible.set(true);
  }

  hideRestartConfirm(): void {
    this.isRestartConfirmVisible.set(false);
  }

  confirmAndRestart(): void {
    this.gameService.startGame();
    this.isRestartConfirmVisible.set(false);
  }

  private rotateAnim: Animation | null = null;

  /**
   * Rotation animée: la nouvelle forme apparaît tournée de -90° (= l'ancienne
   * position) puis pivote jusqu'à 0° avec un léger rebond.
   */
  rotateTile(): void {
    if (!this.currentTile()) return;
    this.gameService.rotateCurrentTile();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    afterNextRender(() => {
      const el = document.querySelector('.tb-piece-cur .tb-piece-slot > div') as HTMLElement | null;
      if (!el) return;
      // Rotations rapides: on repart du début plutôt que d'empiler les animations
      this.rotateAnim?.cancel();
      this.rotateAnim = el.animate(
        [
          { transform: 'rotate(-90deg) scale(0.9)' },
          { transform: 'rotate(8deg) scale(1.06)', offset: 0.65 },
          { transform: 'rotate(-2deg) scale(0.99)', offset: 0.85 },
          { transform: 'rotate(0deg) scale(1)' },
        ],
        { duration: 280, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' }
      );
    }, { injector: this.injector });
  }

  // Animation d'échange: les deux présentoirs glissent l'un vers l'autre,
  // le contenu est échangé à mi-course
  protected isSwapping = signal(false);

  /**
   * Échange animé: chaque pièce s'envole en arc vers l'autre carte en changeant
   * de taille (technique FLIP), et les deux cartes rebondissent à l'arrivée.
   */
  swapTiles(): void {
    if (this.isSwapping()) return;
    const pieceEl = (card: string) =>
      document.querySelector(`.${card} .tb-piece-slot app-tile-preview .grid`) as HTMLElement | null;
    const before = {
      cur: pieceEl('tb-piece-cur')?.getBoundingClientRect(),
      next: pieceEl('tb-piece-next')?.getBoundingClientRect(),
    };
    this.isSwapping.set(true);
    this.gameService.swapTiles();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !before.cur || !before.next) {
      this.isSwapping.set(false);
      return;
    }

    // Attendre le rendu des pièces échangées avant de mesurer leur nouvelle place
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const duration = 520;
      // La pièce maintenant "actuelle" vient de la carte "suivante", et inversement
      this.flyPiece(pieceEl('tb-piece-cur'), before.next!, -1, duration);
      this.flyPiece(pieceEl('tb-piece-next'), before.cur!, 1, duration);
      for (const card of ['.tb-piece-cur', '.tb-piece-next']) {
        (document.querySelector(card) as HTMLElement | null)?.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(0.94, 0.9)', offset: 0.25 },
            { transform: 'scale(1.05, 1.07)', offset: 0.7 },
            { transform: 'scale(0.99)', offset: 0.85 },
            { transform: 'scale(1)' },
          ],
          { duration, easing: 'ease-out' }
        );
      }
      setTimeout(() => this.isSwapping.set(false), duration);
    }));
  }

  /** Fait partir une pièce depuis `from` (ancienne position) jusqu'à sa place actuelle, en arc. */
  private flyPiece(el: HTMLElement | null, from: DOMRect, direction: 1 | -1, duration: number): void {
    if (!el) return;
    const to = el.getBoundingClientRect();
    if (!to.width) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.width / to.width;
    const lift = Math.max(60, Math.abs(dx) * 0.35);
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)`, zIndex: 20 },
        {
          transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) scale(${(scale + 1) / 2 * 1.15}) rotate(${direction * 14}deg)`,
          offset: 0.45,
          zIndex: 20,
        },
        { transform: 'translate(0, 0) scale(1.08) rotate(0deg)', offset: 0.8, zIndex: 20 },
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', zIndex: 20 },
      ],
      { duration, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' }
    );
  }

  undoMove(): void {
    this.gameService.undo();
  }

  onUndoKeyPress(): void {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    this.undoMove();
  }

  onSwapKeyPress(): void {
    // Ne pas déclencher le swap si on est en train de taper dans un input
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    this.swapTiles();
  }

  showTutorial(): void {
    // Forcer l'affichage du tutoriel même si déjà vu
    this.tutorialService.startTutorial(true);
  }

  toggleHintTooltip(): void {
    this.isHintTooltipVisible.update(v => !v);
  }

  toggleSound(): void {
    this.soundService.toggleSound();
  }



  // Dispatch des événements de drag vers la grille (partagé souris/tactile).
  // Le pointeur doit être dans le carré réel de la grille: relâcher la tuile
  // ailleurs (ex: retour au deck) annule le placement au lieu de le forcer.
  private dispatchTileDrag(type: 'tile-drag-move' | 'tile-drag-end', clientX: number, clientY: number): boolean {
    const elementBelow = document.elementFromPoint(clientX, clientY);
    const gridHost = elementBelow?.closest('app-grid');
    const gridElement = gridHost?.querySelector('.grid') as HTMLElement | null;
    if (gridElement) {
      const rect = gridElement.getBoundingClientRect();
      const inside = clientX >= rect.left && clientX <= rect.right
        && clientY >= rect.top && clientY <= rect.bottom;
      if (inside) {
        gridElement.dispatchEvent(new CustomEvent(type, {
          detail: { clientX, clientY, target: gridElement },
          bubbles: true
        }));
        return true;
      }
    }
    document.querySelectorAll('app-grid .grid').forEach((g) => {
      g.dispatchEvent(new CustomEvent('tile-drag-leave'));
    });
    return false;
  }

  // Gestion du drag & drop à la souris (desktop)
  /** Mesure une case de la grille pour dessiner le fantôme à la même taille. */
  private measureGridCell(): void {
    const board = document.querySelector('app-grid .tb-board') as HTMLElement | null;
    const cellEl = board?.querySelector('.cell-base') as HTMLElement | null;
    if (!board || !cellEl) return;
    const r = cellEl.getBoundingClientRect();
    const style = getComputedStyle(board);
    const gap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;
    if (r.width > 0 && r.height > 0) this.ghostCell.set({ cell: r.width, cellH: r.height, gap, rowGap });
  }

  /**
   * Démarre un drag depuis le point (startX, startY) où la pièce a été attrapée.
   * La pièce de la carte est masquée et le fantôme apparaît pile à sa place et à
   * sa taille, puis grandit jusqu'à la taille de la grille et monte au-dessus du
   * doigt (animation CSS jouée à l'apparition, voir .tb-ghost-inner).
   */
  private startDrag(startX: number, startY: number, lift: number, free = false): void {
    const tile = this.currentTile();
    if (!tile) return;
    this.measureGridCell();
    const { cell, cellH, gap, rowGap } = this.ghostCell();
    const w = tile.width * cell + (tile.width - 1) * gap;
    const h = tile.height * cellH + (tile.height - 1) * rowGap;
    const source = document.querySelector(
      '.tb-piece-cur .tb-piece-slot app-tile-preview .grid'
    ) as HTMLElement | null;
    const from = source?.getBoundingClientRect();
    if (from && from.width > 0 && from.height > 0) {
      const fx = Math.min(1, Math.max(0, (startX - from.left) / from.width));
      const fy = Math.min(1, Math.max(0, (startY - from.top) / from.height));
      this.ghostGrab.set({ x: fx * w, y: fy * h });
      this.ghostEnter.set({ scaleX: from.width / w, scaleY: from.height / h, lift });
    } else {
      this.ghostGrab.set(this.ghostAnchor());
      this.ghostEnter.set({ scaleX: 1, scaleY: 1, lift });
    }
    this.ghostLiftPx = lift;
    this.ghostFree.set(free);
    this.isDragging.set(true);
  }

  /**
   * Déplace le fantôme sous le pointeur. Le point visé sur la grille est le
   * centre de la case-pivot de la pièce, là où on la voit.
   */
  private moveDrag(clientX: number, clientY: number): void {
    const g = this.ghostGrab();
    const a = this.ghostAnchor();
    const topLeft = { x: clientX - g.x, y: clientY - this.ghostLiftPx - g.y };
    this.ghostPosition.set(topLeft);
    const aimX = topLeft.x + a.x;
    const aimY = topLeft.y + a.y;
    this.updateGhostSnap(aimX, aimY);
    this.dispatchTileDrag('tile-drag-move', aimX, aimY);
  }

  /** Pose la pièce au point visé (si c'est sur la grille) et termine le drag. */
  private dropDrag(clientX: number, clientY: number): void {
    const g = this.ghostGrab();
    const a = this.ghostAnchor();
    const aimX = clientX - g.x + a.x;
    const aimY = clientY - this.ghostLiftPx - g.y + a.y;
    this.endDrag();
    this.dispatchTileDrag('tile-drag-end', aimX, aimY);
  }

  private endDrag(): void {
    this.isDragging.set(false);
    this.ghostPosition.set(null);
    this.ghostSnap.set(null);
    this.ghostFree.set(false);
    this.ghostLiftPx = 0;
  }

  onTileMouseDown(event: MouseEvent): void {
    if (!this.currentTile() || event.button !== 0) return;
    event.preventDefault();
    this.mouseStartPosition = { x: event.clientX, y: event.clientY };
    this.isMouseDragActive = false;
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }

  private onWindowMouseMove = (event: MouseEvent): void => {
    if (!this.mouseStartPosition) return;
    const movedX = Math.abs(event.clientX - this.mouseStartPosition.x);
    const movedY = Math.abs(event.clientY - this.mouseStartPosition.y);
    if (!this.isMouseDragActive && (movedX > 5 || movedY > 5)) {
      this.isMouseDragActive = true;
      this.startDrag(this.mouseStartPosition.x, this.mouseStartPosition.y, 0);
    }
    if (this.isMouseDragActive) this.moveDrag(event.clientX, event.clientY);
  };

  private onWindowMouseUp = (event: MouseEvent): void => {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    const wasDragging = this.isMouseDragActive;
    this.mouseStartPosition = null;
    this.isMouseDragActive = false;
    if (!wasDragging) {
      // Simple clic sans déplacement: rotation (comportement historique)
      this.endDrag();
      this.rotateTile();
      return;
    }
    this.dropDrag(event.clientX, event.clientY);
  };

  // Gestion des événements tactiles pour mobile.
  // Un simple appui ne fait rien apparaître: le drag ne commence qu'au premier
  // vrai déplacement du doigt, sinon c'est un tap (rotation).
  onTileTouchStart(event: TouchEvent): void {
    if (!this.currentTile()) return;
    const touch = event.touches[0];
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.isTouchDragging.set(true);
    this.touchDragStarted = false;
    // Empêcher le scroll et les actions par défaut pendant le geste
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchMove(event: TouchEvent): void {
    if (!this.isTouchDragging() || !this.touchStartPosition) return;
    event.preventDefault();
    event.stopPropagation();

    const touch = event.touches[0];
    if (!this.touchDragStarted) {
      const dx = Math.abs(touch.clientX - this.touchStartPosition.x);
      const dy = Math.abs(touch.clientY - this.touchStartPosition.y);
      if (dx < 8 && dy < 8) return;
      this.touchDragStarted = true;
      this.measureGridCell();
      // La pièce reste collée sous le doigt, au point exact où on l'a attrapée
      const { x, y } = this.touchStartPosition;
      this.startDrag(x, y, 0, true);
    }
    this.moveDrag(touch.clientX, touch.clientY);
  }

  onTileTouchEnd(event: TouchEvent): void {
    if (!this.isTouchDragging()) return;
    const touch = event.changedTouches[0];
    event.preventDefault();
    event.stopPropagation();

    if (!this.touchDragStarted) {
      // Tap sans déplacement: rotation
      this.resetTouch();
      this.rotateTile();
      return;
    }
    // Drag terminé: poser la pièce si on est sur la grille
    this.dropDrag(touch.clientX, touch.clientY);
    this.resetTouch();
  }

  onTileTouchCancel(): void {
    this.resetTouch();
    document.querySelectorAll('app-grid .grid').forEach((g) => {
      g.dispatchEvent(new CustomEvent('tile-drag-leave'));
    });
  }

  private resetTouch(): void {
    this.isTouchDragging.set(false);
    this.touchDragStarted = false;
    this.touchStartPosition = null;
    this.endDrag();
  }

  async shareScore(): Promise<void> {
    const score = this.score();
    const gameUrl = 'https://pavat-game.web.app/';
    const locale = this.i18n.getLanguage() === 'fr' ? 'fr-FR' : this.i18n.getLanguage() === 'en' ? 'en-US' : 'en-US';
    const shareText = this.i18n.translateWithParams('shareScoreText', score.toLocaleString(locale));
    const shareTextWithUrl = `${shareText}\n\n${gameUrl}`;
    
    try {
      // Utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        const shareData: ShareData = {
          text: shareTextWithUrl,
        };
        
        try {
          await navigator.share(shareData);
          return;
        } catch (shareError) {
          // Si le partage échoue, fallback
          if ((shareError as Error).name !== 'AbortError') {
            this.fallbackShare(shareTextWithUrl);
          }
        }
      } else {
        // Fallback desktop : copier dans le presse-papiers
        this.fallbackShare(shareTextWithUrl);
      }
    } catch (error) {
      // L'utilisateur a annulé ou une erreur s'est produite
      if ((error as Error).name !== 'AbortError') {
        console.log('Partage annulé:', error);
        this.fallbackShare(shareTextWithUrl);
      }
    }
  }

  private fallbackShare(text: string): void {
    // Copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        // Afficher un message de confirmation (optionnel)
        alert(this.i18n.translate('shareScoreCopied'));
      }).catch((err) => {
        console.error('Erreur lors de la copie:', err);
        // Fallback ultime : afficher le texte
        this.showShareDialog(text);
      });
    } else {
      // Fallback ultime : afficher le texte
      this.showShareDialog(text);
    }
  }

  private showShareDialog(text: string): void {
    // Créer une zone de texte temporaire pour copier
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert(this.i18n.translate('shareScoreCopied'));
    } catch (err) {
      // Si tout échoue, afficher le texte
      prompt(this.i18n.translate('shareScoreCopyError'), text);
    }
    document.body.removeChild(textarea);
  }
  
  getColorblindIconSvg(color: string | null | undefined): SafeHtml | null {
    const shape = this.optionsService.getColorblindShape(color);
    if (!shape) return null;
    
    // Pour les présentoirs (currentTile et nextTile), toujours utiliser la version non remplie
    // La taille sera adaptée par le CSS (w-14 h-14 lg:w-16 lg:h-16), donc on utilise une taille de base
    const svgString = this.colorblindIconService.getShapeSvg(shape, false, 56);
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }
}