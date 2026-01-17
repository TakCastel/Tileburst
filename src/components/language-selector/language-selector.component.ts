import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../services/i18n.service';
import { LucideAngularModule, Languages } from 'lucide-angular';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative">
      <button
        (click)="toggleDropdown()"
        class="w-8 h-8 lg:w-10 lg:h-10 transition-all duration-200 btn-3d tb-header-icon flex items-center justify-center rounded-full"
        aria-label="Select language"
        [attr.aria-expanded]="isOpen()">
        <lucide-angular [img]="LanguagesIcon" class="w-3.5 h-3.5 lg:w-5 lg:h-5"></lucide-angular>
      </button>
      
      @if (isOpen()) {
        <div class="absolute top-10 lg:top-12 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 lg:py-2 z-50 min-w-[160px] lg:min-w-[200px] max-h-[300px] lg:max-h-[400px] overflow-y-auto">
          @for (lang of i18n.availableLanguages; track lang) {
            <button
              (click)="selectLanguage(lang)"
              class="w-full px-3 lg:px-4 py-1.5 lg:py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
              [class.bg-cyan-100]="i18n.getLanguage() === lang"
              [class.dark:bg-cyan-900]="i18n.getLanguage() === lang">
              <span class="text-sm lg:text-base text-slate-700 dark:text-slate-300">{{ i18n.languageNames[lang] }}</span>
              @if (i18n.getLanguage() === lang) {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 lg:w-4 lg:h-4 text-cyan-600 dark:text-cyan-400">
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
  readonly LanguagesIcon = Languages;

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
