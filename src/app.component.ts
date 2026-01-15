import { Component, ChangeDetectionStrategy, inject, signal, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('gameOverModal', { static: false }) gameOverModal!: ElementRef<HTMLElement>;

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

  swapTiles(): void {
    this.gameService.swapTiles();
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

  async shareScore(): Promise<void> {
    const score = this.score();
    const gameUrl = 'https://tileburst.netlify.app/';
    const shareText = `J'ai fait ${score.toLocaleString('fr-FR')} points sur Tileburst ! Tu penses que tu peux me battre ? 🎮`;
    const shareTextWithUrl = `${shareText}\n\n${gameUrl}`;
    
    try {
      // Générer un snapshot du modal
      const imageFile = await this.captureGameOverModal();
      
      if (!imageFile) {
        // Si la capture échoue, fallback simple
        this.fallbackShare(shareTextWithUrl);
        return;
      }
      
      // Utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        const shareData: ShareData = {
          title: `J'ai fait ${score.toLocaleString('fr-FR')} points sur Tileburst !`,
          text: shareText,
          url: gameUrl,
        };
        
        // Ajouter l'image si disponible et supporté (mobile natif)
        if ('files' in navigator.share) {
          try {
            await (navigator.share as any)({
              ...shareData,
              files: [imageFile],
            });
            return; // Succès avec image
          } catch (fileError) {
            // Si le partage avec fichier échoue, essayer sans fichier
            console.log('Partage avec fichier échoué, essai sans fichier:', fileError);
            try {
              await navigator.share(shareData);
              return;
            } catch (shareError) {
              // Si le partage échoue complètement, fallback
              await this.shareWithImage(imageFile, shareTextWithUrl);
            }
          }
        } else {
          // Partage sans fichier (certains navigateurs ne supportent pas files)
          try {
            await navigator.share(shareData);
          } catch (shareError) {
            await this.shareWithImage(imageFile, shareTextWithUrl);
          }
        }
      } else {
        // Fallback desktop : copier dans le presse-papiers avec l'image
        await this.shareWithImage(imageFile, shareTextWithUrl);
      }
    } catch (error) {
      // L'utilisateur a annulé ou une erreur s'est produite
      if ((error as Error).name !== 'AbortError') {
        console.log('Partage annulé:', error);
        this.fallbackShare(shareTextWithUrl);
      }
    }
  }

  private async captureGameOverModal(): Promise<File | null> {
    try {
      // Import dynamique de html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      if (!this.gameOverModal?.nativeElement) {
        console.warn('Modal de game over non trouvé');
        return null;
      }

      const modalElement = this.gameOverModal.nativeElement;
      
      // Attendre un peu pour s'assurer que le modal est bien rendu
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capturer uniquement le contenu du modal (pas le fond noir)
      const canvas = await html2canvas(modalElement, {
        backgroundColor: '#ffffff',
        scale: 3, // Qualité encore meilleure pour le partage
        logging: false,
        useCORS: true,
        allowTaint: false,
        removeContainer: false,
        width: modalElement.offsetWidth,
        height: modalElement.offsetHeight,
      });

      // Convertir le canvas en blob puis en File
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const score = this.score().toLocaleString('fr-FR').replace(/\s/g, '');
            const file = new File([blob], `tileburst-score-${score}.png`, { type: 'image/png' });
            resolve(file);
          } else {
            resolve(null);
          }
        }, 'image/png', 1.0); // Qualité maximale
      });
    } catch (error) {
      console.error('Erreur lors de la capture du modal:', error);
      return null;
    }
  }

  private async shareWithImage(imageFile: File, text: string): Promise<void> {
    try {
      // Essayer de partager avec l'image via l'API Clipboard
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const clipboardItem = new ClipboardItem({ 'image/png': imageFile });
          await navigator.clipboard.write([clipboardItem]);
          // Copier aussi le texte
          await navigator.clipboard.writeText(text);
          alert('Image et texte copiés dans le presse-papiers ! Vous pouvez maintenant les partager (collez l\'image dans WhatsApp, puis le texte).');
        } catch (clipboardError) {
          // Si l'image ne peut pas être copiée, au moins copier le texte et télécharger l'image
          await navigator.clipboard.writeText(text);
          this.downloadImage(imageFile);
          alert('Texte copié et image téléchargée ! Partagez l\'image manuellement avec le texte.');
        }
      } else {
        // Fallback : télécharger l'image et copier le texte
        this.downloadImage(imageFile);
        this.fallbackShare(text);
      }
    } catch (error) {
      console.error('Erreur lors du partage avec image:', error);
      this.downloadImage(imageFile);
      this.fallbackShare(text);
    }
  }

  private downloadImage(file: File): void {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tileburst-score.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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