import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../services/i18n.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="w-10 h-10 transition-all duration-200 btn-3d flex items-center justify-center rounded-full bg-slate-500 dark:bg-slate-600"
        [style.--shadow-color]="'#475569'"
        aria-label="Select language"
        [attr.aria-expanded]="isOpen()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
          <path d="M7 7h10M7 17h10M12 2v20"/>
        </svg>
      </button>
      
      @if (isOpen()) {
        <div class="absolute top-12 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[200px] max-h-[400px] overflow-y-auto">
          @for (lang of i18n.availableLanguages; track lang) {
            <button
              (click)="selectLanguage(lang)"
              class="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
              [class.bg-cyan-100]="i18n.getLanguage() === lang"
              [class.dark:bg-cyan-900]="i18n.getLanguage() === lang">
              <span class="text-slate-700 dark:text-slate-300">{{ i18n.languageNames[lang] }}</span>
              @if (i18n.getLanguage() === lang) {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-cyan-600 dark:text-cyan-400">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LanguageSelectorComponent {
  protected i18n = inject(I18nService);
  isOpen = signal(false);

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectLanguage(language: Language): void {
    this.i18n.setLanguage(language);
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-language-selector')) {
      this.isOpen.set(false);
    }
  }
}
