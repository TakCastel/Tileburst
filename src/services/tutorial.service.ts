import { Injectable, signal, computed, inject } from '@angular/core';
import { I18nService } from './i18n.service';

export interface TutorialStep {
  id: 'welcome' | 'clearing' | 'validated' | 'shrinking' | 'goal';
  title: string;
  content: string;
}

const TUTORIAL_SEEN_KEY = 'tileburst_tutorial_seen';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  private i18n = inject(I18nService);
  activeStepIndex = signal<number | null>(null);

  readonly allSteps = computed(() => {
    const t = this.i18n.t();
    return [
      {
        id: 'welcome' as const,
        title: t.tutorial.welcome.title,
        content: t.tutorial.welcome.content,
      },
      {
        id: 'clearing' as const,
        title: t.tutorial.clearing.title,
        content: t.tutorial.clearing.content,
      },
      {
        id: 'validated' as const,
        title: t.tutorial.validated.title,
        content: t.tutorial.validated.content,
      },
      {
        id: 'shrinking' as const,
        title: t.tutorial.shrinking.title,
        content: t.tutorial.shrinking.content,
      },
      {
        id: 'goal' as const,
        title: t.tutorial.goal.title,
        content: t.tutorial.goal.content,
      },
    ];
  });

  isTutorialActive = computed(() => this.activeStepIndex() !== null);
  
  currentStep = computed(() => {
    const index = this.activeStepIndex();
    const steps = this.allSteps();
    return index !== null ? steps[index] : null;
  });

  isFirstStep = computed(() => this.activeStepIndex() === 0);
  isLastStep = computed(() => {
    const steps = this.allSteps();
    return this.activeStepIndex() === steps.length - 1;
  });

  constructor() {
    // Vérifier si le tutoriel a déjà été vu au démarrage
    this.hasSeenTutorial();
  }

  private hasSeenTutorial(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
  }

  private markTutorialAsSeen(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    }
  }

  public startTutorial(force: boolean = false): void {
    // Si on force (bouton "Comment Jouer"), toujours démarrer
    // Sinon, vérifier si déjà vu
    if (!force && this.hasSeenTutorial()) {
      return;
    }
    this.activeStepIndex.set(0);
  }

  public endTutorial(): void {
    this.activeStepIndex.set(null);
    // Marquer comme vu quand on ferme le tutoriel
    this.markTutorialAsSeen();
  }

  public goToNextStep(): void {
    this.activeStepIndex.update(index => {
      const steps = this.allSteps();
      return (index === null || index >= steps.length - 1) ? index : index + 1;
    });
  }

  public goToPreviousStep(): void {
    this.activeStepIndex.update(index => (index === null || index <= 0) ? index : index - 1);
  }
}