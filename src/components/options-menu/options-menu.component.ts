import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionsService, ColorPalette } from '../../services/options.service';
import { I18nService, Language } from '../../services/i18n.service';
import { GameService } from '../../services/game.service';
import { SoundService } from '../../services/sound.service';
import { ThemeService } from '../../services/theme.service';
import { LucideAngularModule, Settings } from 'lucide-angular';
import { marked } from 'marked';
import { RULES_MARKDOWN_BY_LANGUAGE } from '../../content/rules-markdown';

@Component({
  selector: 'app-options-menu',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
  protected themeService = inject(ThemeService);
  isOpen = signal(false);
  isClosing = signal(false);
  isLanguageDropdownOpen = signal(false);
  isResetBestScoreConfirmVisible = signal(false);
  isRulesOpen = signal(false);
  isRulesLoading = signal(false);
  rulesLoadError = signal<string | null>(null);
  rulesHtml = signal('');
  readonly SettingsIcon = Settings;
  colorPalette = this.optionsService.colorPalette;
  bestScore = this.gameService.bestScore;
  isSoundEnabled = this.soundService.isSoundEnabled;
  isDarkMode = this.themeService.isDarkMode;

  colorPalettes: { value: ColorPalette; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'highContrast', label: 'Hyper contraste' },
  ];

  constructor() {
    effect(() => {
      const isOpen = this.isRulesOpen();
      const language = this.i18n.getLanguage();
      if (!isOpen) {
        return;
      }
      const markdown = RULES_MARKDOWN_BY_LANGUAGE[language] ?? RULES_MARKDOWN_BY_LANGUAGE.fr;
      this.rulesHtml.set(String(marked.parse(markdown)));
    });
  }

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

  toggleTheme(): void {
    this.themeService.toggleTheme();
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

  openRules(): void {
    this.isRulesOpen.set(true);
    this.isRulesLoading.set(false);
    this.rulesLoadError.set(null);
    const language = this.i18n.getLanguage();
    const markdown = RULES_MARKDOWN_BY_LANGUAGE[language] ?? RULES_MARKDOWN_BY_LANGUAGE.fr;
    this.rulesHtml.set(String(marked.parse(markdown)));
  }

  closeRules(): void {
    this.isRulesOpen.set(false);
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
