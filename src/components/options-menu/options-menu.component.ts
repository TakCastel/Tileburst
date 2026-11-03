import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionsService, ColorPalette } from '../../services/options.service';
import { I18nService, Language } from '../../services/i18n.service';
import { GameService } from '../../services/game.service';
import { SoundService } from '../../services/sound.service';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-options-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class OptionsMenuComponent {
  protected optionsService = inject(OptionsService);
  protected i18n = inject(I18nService);
  protected gameService = inject(GameService);
  protected soundService = inject(SoundService);
  protected tutorialService = inject(TutorialService);
  isOpen = signal(false);
  isClosing = signal(false);
  isLanguageDropdownOpen = signal(false);
  isResetBestScoreConfirmVisible = signal(false);
  colorPalette = this.optionsService.colorPalette;
  bestScore = this.gameService.bestScore;
  isSoundEnabled = this.soundService.isSoundEnabled;

  colorPalettes: { value: ColorPalette; label: string }[] = [
    { value: 'couleurs', label: 'Couleurs' },
    { value: 'daltonien', label: 'Daltonien' },
  ];

  toggleMenu(): void {
    if (this.isOpen()) {
      this.closeMenu();
    } else {
      this.isOpen.set(true);
      this.isClosing.set(false);
    }
  }

  closeMenu(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isOpen.set(false);
      this.isClosing.set(false);
    }, 300); // Durée de l'animation
  }

  setColorPalette(palette: ColorPalette): void {
    this.optionsService.setColorPalette(palette);
  }

  toggleSound(): void {
    this.soundService.toggleSound();
  }

  toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.update(v => !v);
  }

  setLanguage(language: Language): void {
    this.i18n.setLanguage(language);
    this.isLanguageDropdownOpen.set(false);
  }

  resetBestScore(): void {
    this.isResetBestScoreConfirmVisible.set(true);
  }

  hideResetBestScoreConfirm(): void {
    this.isResetBestScoreConfirmVisible.set(false);
  }

  confirmResetBestScore(): void {
    this.gameService.resetBestScore();
    this.isResetBestScoreConfirmVisible.set(false);
  }

  /** Demande au parent d'ouvrir la confirmation « Nouvelle partie ». */
  newGameRequested = output<void>();

  requestNewGame(): void {
    this.closeMenu();
    this.newGameRequested.emit();
  }

  openRules(): void {
    // Fermer le menu et lancer le tutoriel
    this.closeMenu();
    this.tutorialService.startTutorial(true);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-options-menu') && !target.closest('[data-options-trigger]')) {
      this.isOpen.set(false);
    }
    // Fermer le dropdown de langue si on clique en dehors
    if (!target.closest('[data-language-dropdown]')) {
      this.isLanguageDropdownOpen.set(false);
    }
  }
}
