import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // État du thème (light/dark) - persiste dans localStorage
  public readonly isDarkMode = signal<boolean>(this.loadThemePreference());

  constructor() {
    // Appliquer le thème au chargement
    this.applyTheme(this.isDarkMode());
    
    // Écouter les changements de thème et les appliquer
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  private loadThemePreference(): boolean {
    try {
      const saved = localStorage.getItem('tileburst_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
      // Par défaut, utiliser la préférence système
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }

  private saveThemePreference(isDark: boolean): void {
    try {
      localStorage.setItem('tileburst_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  public toggleTheme(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.saveThemePreference(newValue);
  }
}
