import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnInit } from '@angular/core';
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
import { LucideAngularModule, Volume2, VolumeX, Sparkles, ShieldCheck, Undo2, RefreshCw, ArrowRightLeft } from 'lucide-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, GridComponent, TilePreviewComponent, TutorialComponent, OptionsMenuComponent, LandingPageComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.r)': 'rotateTile()',
    '(window:keydown.space)': 'rotateTile()',
    '(window:keydown.f)': 'onSwapKeyPress()',
    '(window:keydown.z)': 'onUndoKeyPress()',
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
  readonly SparklesIcon = Sparkles;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly Undo2Icon = Undo2;
  readonly RotateIcon = RefreshCw;
  readonly SwapIcon = ArrowRightLeft;
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
  // Position du ghost (tuile flottante) pendant un drag, souris ou tactile
  protected ghostPosition = signal<{ x: number; y: number } | null>(null);
  /** Taille d'une case de la grille et de l'espace entre cases, mesurée au début du drag. */
  protected ghostCell = signal<{ cell: number; gap: number }>({ cell: 40, gap: 4 });
  /** Décalage du coin haut-gauche du fantôme pour que la case-pivot soit sous le point visé. */
  /** Quand la pièce survole une place valide de la grille, le fantôme s'aimante sur les cases. */
  protected ghostSnap = signal<{ x: number; y: number } | null>(null);
  protected ghostTransform = computed(() => {
    const pos = this.ghostPosition();
    if (!pos) return '';
    const snap = this.ghostSnap();
    const a = this.ghostAnchor();
    const x = snap ? snap.x : pos.x - a.x;
    const y = snap ? snap.y : pos.y - a.y;
    return `translate3d(${x}px, ${y}px, 0)`;
  });

  /** Calcule la position aimantée du fantôme pour un point visé (mêmes règles que la grille). */
  private updateGhostSnap(clientX: number, clientY: number): void {
    const tile = this.currentTile();
    const board = document.querySelector('app-grid .tb-board') as HTMLElement | null;
    if (!tile || !board) { this.ghostSnap.set(null); return; }
    const rect = board.getBoundingClientRect();
    const st = getComputedStyle(board);
    const padL = parseFloat(st.paddingLeft) || 0;
    const padT = parseFloat(st.paddingTop) || 0;
    const innerW = rect.width - padL - (parseFloat(st.paddingRight) || 0);
    const innerH = rect.height - padT - (parseFloat(st.paddingBottom) || 0);
    const n = this.gridSize();
    const col = Math.floor(((clientX - rect.left - padL) / innerW) * n);
    const row = Math.floor(((clientY - rect.top - padT) / innerH) * n);
    if (col < 0 || row < 0 || col >= n || row >= n) { this.ghostSnap.set(null); return; }
    const startRow = row - tile.barycenter.r;
    const startCol = col - tile.barycenter.c;
    if (!this.gameService.canPlaceTile(tile, startRow, startCol)) { this.ghostSnap.set(null); return; }
    const colGap = parseFloat(st.columnGap) || 0;
    const rowGap = parseFloat(st.rowGap) || 0;
    const cellW = (innerW - colGap * (n - 1)) / n;
    const cellH = (innerH - rowGap * (n - 1)) / n;
    this.ghostSnap.set({
      x: rect.left + padL + startCol * (cellW + colGap),
      y: rect.top + padT + startRow * (cellH + rowGap),
    });
  }

  protected ghostAnchor = computed(() => {
    const tile = this.currentTile();
    const { cell, gap } = this.ghostCell();
    if (!tile) return { x: 0, y: 0 };
    return {
      x: tile.barycenter.c * (cell + gap) + cell / 2,
      y: tile.barycenter.r * (cell + gap) + cell / 2,
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

  rotateTile(): void {
    this.gameService.rotateCurrentTile();
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
    const cell = cellEl.getBoundingClientRect().width;
    const style = getComputedStyle(board);
    const gap = parseFloat(style.columnGap) || 0;
    if (cell > 0) this.ghostCell.set({ cell, gap });
  }

  /**
   * Démarre un drag: la pièce de la carte « Pièce actuelle » est masquée et le
   * fantôme part exactement de sa place et de sa taille, puis glisse vers le
   * pointeur (technique FLIP). La pièce se détache de la carte au lieu d'être dupliquée.
   */
  private startDrag(clientX: number, clientY: number, lift: number): void {
    const source = document.querySelector(
      '.tb-piece-cur .tb-piece-slot app-tile-preview .grid'
    ) as HTMLElement | null;
    const from = source?.getBoundingClientRect();
    this.measureGridCell();
    this.ghostLiftPx = lift;
    this.isDragging.set(true);
    this.ghostPosition.set({ x: clientX, y: clientY - lift });
    if (!from || from.width === 0) return;
    // Attendre le rendu du fantôme pour connaître sa position d'arrivée
    requestAnimationFrame(() => {
      const ghost = document.querySelector('.tb-drag-ghost app-tile-preview .grid') as HTMLElement | null;
      if (!ghost) return;
      const to = ghost.getBoundingClientRect();
      if (to.width === 0) return;
      const scale = from.width / to.width;
      ghost.animate(
        [
          { transformOrigin: '0 0', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scale})` },
          { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1)' },
        ],
        { duration: 160, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }
      );
    });
  }

  private endDrag(): void {
    this.isDragging.set(false);
    this.ghostPosition.set(null);
    this.ghostSnap.set(null);
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
      this.startDrag(event.clientX, event.clientY, 0);
    }
    if (this.isMouseDragActive) {
      this.ghostPosition.set({ x: event.clientX, y: event.clientY });
      this.updateGhostSnap(event.clientX, event.clientY);
      this.dispatchTileDrag('tile-drag-move', event.clientX, event.clientY);
    }
  };

  private onWindowMouseUp = (event: MouseEvent): void => {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    const wasDragging = this.isMouseDragActive;
    this.mouseStartPosition = null;
    this.isMouseDragActive = false;
    this.endDrag();
    if (!wasDragging) {
      // Simple clic sans déplacement: rotation (comportement historique)
      this.rotateTile();
      return;
    }
    this.dispatchTileDrag('tile-drag-end', event.clientX, event.clientY);
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
      // La pièce reste visible au-dessus du doigt (environ une case plus haut)
      this.startDrag(touch.clientX, touch.clientY, Math.round(this.ghostCell().cell * 1.1 + 12));
    }
    // La pièce se pose là où on la voit (au-dessus du doigt), pas sous le doigt
    const y = touch.clientY - this.ghostLiftPx;
    this.ghostPosition.set({ x: touch.clientX, y });
    this.updateGhostSnap(touch.clientX, y);
    this.dispatchTileDrag('tile-drag-move', touch.clientX, y);
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
    this.dispatchTileDrag('tile-drag-end', touch.clientX, touch.clientY - this.ghostLiftPx);
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