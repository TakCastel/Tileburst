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
    this.tutorialService.startTutorial();
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
}