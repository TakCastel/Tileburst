import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { GridComponent } from './components/grid/grid.component';
import { TilePreviewComponent } from './components/tile-preview/tile-preview.component';
import { TutorialComponent } from './components/tutorial/tutorial.component';
import { TutorialService } from './services/tutorial.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, GridComponent, TilePreviewComponent, TutorialComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.r)': 'rotateTile()',
    '(window:keydown.space)': 'rotateTile()',
  },
})
export class AppComponent {
  protected gameService = inject(GameService);
  protected tutorialService = inject(TutorialService);

  score = this.gameService.score;
  gridSize = this.gameService.gridSize;
  currentTile = this.gameService.currentTile;
  nextTile = this.gameService.nextTile;
  isGameOver = this.gameService.isGameOver;
  minValidatedGroupSize = this.gameService.minValidatedGroupSize;

  isDragging = signal(false);
  isHintTooltipVisible = signal(false);
  isRestartConfirmVisible = signal(false);
  private touchStartPosition: { x: number; y: number } | null = null;
  private isTouchDragging = signal(false);

  restartGame(): void {
    this.gameService.startGame();
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

  showTutorial(): void {
    // Forcer l'affichage du tutoriel même si déjà vu
    this.tutorialService.startTutorial(true);
  }

  toggleHintTooltip(): void {
    this.isHintTooltipVisible.update(v => !v);
  }

  onDragStart(event: DragEvent): void {
    this.isDragging.set(true);
    // Necessary for Firefox to initiate drag
    event.dataTransfer?.setData('text/plain', 'tile');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.isDragging.set(false);
  }

  // Gestion des événements tactiles pour mobile
  onTileTouchStart(event: TouchEvent): void {
    if (!this.currentTile()) return;
    const touch = event.touches[0];
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.isTouchDragging.set(true);
    this.isDragging.set(true);
    // Empêcher le scroll et les actions par défaut pendant le drag
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchMove(event: TouchEvent): void {
    if (!this.isTouchDragging() || !this.touchStartPosition) return;
    // Empêcher le scroll pendant le drag
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchEnd(event: TouchEvent): void {
    if (!this.isTouchDragging()) return;
    
    // Vérifier si c'était un tap (pas un drag)
    const touch = event.changedTouches[0];
    if (this.touchStartPosition) {
      const deltaX = Math.abs(touch.clientX - this.touchStartPosition.x);
      const deltaY = Math.abs(touch.clientY - this.touchStartPosition.y);
      
      // Si le mouvement est très petit, considérer comme un tap (rotation)
      // Augmenté le seuil à 15px pour être plus tolérant
      if (deltaX < 15 && deltaY < 15) {
        // Petit délai pour éviter les conflits avec le drop
        setTimeout(() => {
          this.rotateTile();
        }, 50);
      }
    }
    
    this.isTouchDragging.set(false);
    this.isDragging.set(false);
    this.touchStartPosition = null;
    event.preventDefault();
    event.stopPropagation();
  }

  onTileTouchCancel(): void {
    this.isTouchDragging.set(false);
    this.isDragging.set(false);
    this.touchStartPosition = null;
  }

  shareScore(): void {
    const score = this.score();
    const gameUrl = 'https://tileburst.netlify.app/';
    const shareText = `J'ai fait ${score.toLocaleString('fr-FR')} points sur Tileburst ! Tu penses que tu peux me battre ? 🎮\n\n${gameUrl}`;
    
    // Utiliser l'API Web Share si disponible (mobile)
    if (navigator.share) {
      navigator.share({
        title: `J'ai fait ${score.toLocaleString('fr-FR')} points sur Tileburst !`,
        text: shareText,
        url: gameUrl,
      }).catch((error) => {
        // L'utilisateur a annulé ou une erreur s'est produite
        console.log('Partage annulé:', error);
        this.fallbackShare(shareText);
      });
    } else {
      // Fallback : copier dans le presse-papiers
      this.fallbackShare(shareText);
    }
  }

  private fallbackShare(text: string): void {
    // Copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        // Afficher un message de confirmation (optionnel)
        alert('Score copié dans le presse-papiers ! Vous pouvez maintenant le partager.');
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
      alert('Score copié dans le presse-papiers ! Vous pouvez maintenant le partager.');
    } catch (err) {
      // Si tout échoue, afficher le texte
      prompt('Copiez ce texte pour partager votre score :', text);
    }
    document.body.removeChild(textarea);
  }
}