import { Injectable, signal } from '@angular/core';
import { GA_MEASUREMENT_ID, initFirebaseAnalytics } from '../firebase';

export type ConsentChoice = 'accepted' | 'refused';

const STORAGE_KEY = 'pavat_analytics_consent';

/**
 * Consentement à la mesure d'audience (Google Analytics via Firebase).
 * Rien n'est chargé ni déposé tant que le joueur n'a pas accepté.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  readonly choice = signal<ConsentChoice | null>(this.readChoice());

  constructor() {
    if (this.choice() === 'accepted') {
      void initFirebaseAnalytics();
    }
  }

  accept(): void {
    this.save('accepted');
    void initFirebaseAnalytics();
  }

  refuse(): void {
    this.save('refused');
  }

  /** Retire le choix pour réafficher le bandeau. Coupe Analytics s'il tournait. */
  reset(): void {
    const wasAccepted = this.choice() === 'accepted';
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // stockage indisponible : on garde juste l'état en mémoire
    }
    this.choice.set(null);
    if (wasAccepted) {
      this.stopAnalytics();
    }
  }

  private stopAnalytics(): void {
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    // Supprime les cookies _ga déjà déposés (domaine courant et domaine parent)
    const host = location.hostname;
    const domains = ['', host, '.' + host.split('.').slice(-2).join('.')];
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga')) {
        for (const domain of domains) {
          document.cookie = `${name}=; Max-Age=0; path=/${domain ? '; domain=' + domain : ''}`;
        }
      }
    }
  }

  private save(choice: ConsentChoice): void {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // stockage indisponible : le bandeau réapparaîtra à la prochaine visite
    }
    this.choice.set(choice);
  }

  private readChoice(): ConsentChoice | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'accepted' || saved === 'refused' ? saved : null;
    } catch {
      return null;
    }
  }
}
