import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { GridComponent } from './components/grid/grid.component';
import { TilePreviewComponent } from './components/tile-preview/tile-preview.component';
import { TutorialComponent } from './components/tutorial/tutorial.component';
import { TutorialService } from './services/tutorial.service';
import { SoundService } from './services/sound.service';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { LucideAngularModule, Volume2, VolumeX, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, GridComponent, TilePreviewComponent, TutorialComponent, LanguageSelectorComponent, OptionsMenuComponent, LandingPageComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.r)': 'rotateTile()',
    '(window:keydown.space)': 'rotateTile()',
    '(window:keydown.f)': 'onSwapKeyPress()',
  },
})
export class AppComponent implements OnInit {
  protected gameService = inject(GameService);
  protected tutorialService = inject(TutorialService);
  protected soundService = inject(SoundService);
  protected themeService = inject(ThemeService);
  protected i18n = inject(I18nService);

  // État de la landing page
  showLandingPage = signal(true);

  ngOnInit(): void {
    // Ne pas afficher la landing page dans les apps natives Capacitor
    // Les apps natives doivent lancer directement le jeu
    const isCapacitorApp = (window as any).Capacitor !== undefined;
    if (isCapacitorApp) {
      this.showLandingPage.set(false);
      this.gameService.startGame();
      return;
    }

    // Pour le site web uniquement : vérifier si l'utilisateur a déjà visité
    const hasVisited = localStorage.getItem('tileburst_has_visited');
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
    localStorage.setItem('tileburst_has_visited', 'true');
    this.gameService.startGame();
  }

  // Icônes Lucide
  readonly Volume2Icon = Volume2;
  readonly VolumeXIcon = VolumeX;
  readonly SunIcon = Sun;
  readonly MoonIcon = Moon;
  readonly SparklesIcon = Sparkles;
  readonly ShieldCheckIcon = ShieldCheck;

  score = this.gameService.score;
  bestScore = this.gameService.bestScore;
  previewLinePoints = this.gameService.previewLinePoints;
  shrinkPoints = this.gameService.shrinkPoints;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  nextTile = this.gameService.nextTile;
  isGameOver = this.gameService.isGameOver;
  minValidatedGroupSize = this.gameService.minValidatedGroupSize;
  isSoundEnabled = this.soundService.isSoundEnabled;
  isDarkMode = this.themeService.isDarkMode;

  isDragging = signal(false);
  isHintTooltipVisible = signal(false);
  isRestartConfirmVisible = signal(false);
  private touchStartPosition: { x: number; y: number } | null = null;
  protected isTouchDragging = signal(false);
  private touchDragElement: HTMLElement | null = null;
  private touchGhostOffset = { x: 0, y: 0 };
  private touchGhostAnchor = { x: 0, y: 0 }; // point touché dans l'élément source
  private ghostLiftPx = 0; // 0 au départ, >0 quand on commence réellement à déplacer
  private rafPending = false;
  private pendingTouchPoint: { x: number; y: number } | null = null;

  restartGame(): void {
    if (this.isGameOver()) {
      this.gameService.startGame();
      return;
    }
    this.showRestartConfirm();
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

  swapTiles(): void {
    this.gameService.swapTiles();
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }


  // Gestion des événements tactiles pour mobile
  onTileTouchStart(event: TouchEvent): void {
    if (!this.currentTile()) return;
    const touch = event.touches[0];
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.isTouchDragging.set(true);
    this.isDragging.set(true);
    this.touchDragElement = event.currentTarget as HTMLElement;
    const rect = this.touchDragElement.getBoundingClientRect();
    this.ghostLiftPx = 0; // au départ, pas de lift: le ghost "part" de la tuile
    this.touchGhostAnchor = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    this.touchGhostOffset = {
      x: this.touchGhostAnchor.x,
      y: this.touchGhostAnchor.y + this.ghostLiftPx,
    };
    // Empêcher le scroll et les actions par défaut pendant le drag
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchMove(event: TouchEvent): void {
    if (!this.isTouchDragging() || !this.touchStartPosition) return;
    // Empêcher le scroll pendant le drag
    event.preventDefault();
    event.stopPropagation();
    
    // Trouver l'élément sous le doigt (la grille) et mettre à jour la position
    const touch = event.touches[0];
    // Dès qu'on commence vraiment à bouger, on "lève" légèrement la tuile pour qu'elle reste visible
    const movedX = Math.abs(touch.clientX - this.touchStartPosition.x);
    const movedY = Math.abs(touch.clientY - this.touchStartPosition.y);
    if (this.ghostLiftPx === 0 && (movedX > 6 || movedY > 6)) {
      this.ghostLiftPx = 24;
      this.touchGhostOffset = {
        x: this.touchGhostAnchor.x,
        y: this.touchGhostAnchor.y + this.ghostLiftPx,
      };
    }
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Si on est sur la grille, créer un événement personnalisé pour mettre à jour la position
    if (elementBelow) {
      const gridElement = elementBelow.closest('app-grid')?.querySelector('.grid') as HTMLElement;
      if (gridElement) {
        // Créer un événement touchmove personnalisé avec les coordonnées
        const customEvent = new CustomEvent('tile-drag-move', {
          detail: {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: gridElement
          },
          bubbles: true
        });
        gridElement.dispatchEvent(customEvent);
      }
    }
  }

  onTileTouchEnd(event: TouchEvent): void {
    if (!this.isTouchDragging()) return;
    
    const touch = event.changedTouches[0];
    if (!this.touchStartPosition) {
      this.isTouchDragging.set(false);
      this.isDragging.set(false);
      this.touchStartPosition = null;
      this.touchDragElement = null;
      return;
    }
    
    const deltaX = Math.abs(touch.clientX - this.touchStartPosition.x);
    const deltaY = Math.abs(touch.clientY - this.touchStartPosition.y);
    
    // Si le mouvement est très petit, considérer comme un tap (rotation)
    if (deltaX < 15 && deltaY < 15) {
      // Petit délai pour éviter les conflits avec le drop
      setTimeout(() => {
        this.rotateTile();
      }, 50);
      this.isTouchDragging.set(false);
      this.isDragging.set(false);
      this.touchStartPosition = null;
      this.touchDragElement = null;
      return;
    }
    
    // Si on a dragué, vérifier si on est sur la grille et placer la tuile
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementBelow) {
      const gridElement = elementBelow.closest('app-grid')?.querySelector('.grid') as HTMLElement;
      if (gridElement) {
        // Créer un événement personnalisé pour déclencher le placement
        const customEvent = new CustomEvent('tile-drag-end', {
          detail: {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: gridElement
          },
          bubbles: true
        });
        gridElement.dispatchEvent(customEvent);
      }
    }
    
    this.isTouchDragging.set(false);
    this.isDragging.set(false);
    this.touchStartPosition = null;
    this.touchDragElement = null;
    this.pendingTouchPoint = null;
    this.ghostLiftPx = 0;
    this.touchGhostAnchor = { x: 0, y: 0 };
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchCancel(): void {
    this.isTouchDragging.set(false);
    this.isDragging.set(false);
    this.touchStartPosition = null;
    this.touchDragElement = null;
    this.pendingTouchPoint = null;
    this.ghostLiftPx = 0;
    this.touchGhostAnchor = { x: 0, y: 0 };
  }

  async shareScore(): Promise<void> {
    const score = this.score();
    const gameUrl = 'https://tileburst.netlify.app/';
    const locale = this.i18n.getLanguage() === 'fr' ? 'fr-FR' : this.i18n.getLanguage() === 'en' ? 'en-US' : 'en-US';
    const shareText = this.i18n.translateWithParams('shareScoreText', score.toLocaleString(locale));
    const shareTextWithUrl = `${shareText}\n\n${gameUrl}`;
    
    try {
      // Utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        const shareData: ShareData = {
          title: this.i18n.translateWithParams('shareScoreTitle', score.toLocaleString(locale)),
          text: shareText,
          url: gameUrl,
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
}