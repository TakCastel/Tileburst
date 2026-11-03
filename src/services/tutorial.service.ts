import { Injectable, signal, computed, inject } from '@angular/core';
import { I18nService } from './i18n.service';

export type TutorialStepId = 'place' | 'tools' | 'line' | 'group' | 'shrink' | 'finish';

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
}

const TUTORIAL_SEEN_KEY = 'pavat_tutorial_seen';
const STEP_IDS: TutorialStepId[] = ['place', 'tools', 'line', 'group', 'shrink', 'finish'];

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  private i18n = inject(I18nService);
  activeStepIndex = signal<number | null>(null);

  readonly allSteps = computed<TutorialStep[]>(() => {
    const t = this.i18n.t().tutorial;
    return STEP_IDS.map(id => ({ id, title: t[id].title }));
  });

  isTutorialActive = computed(() => this.activeStepIndex() !== null);

  currentStep = computed(() => {
    const index = this.activeStepIndex();
    return index !== null ? this.allSteps()[index] : null;
  });

  isFirstStep = computed(() => this.activeStepIndex() === 0);
  isLastStep = computed(() => this.activeStepIndex() === STEP_IDS.length - 1);

  private hasSeenTutorial(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private markTutorialAsSeen(): void {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // Stockage indisponible: le tuto se relancera, ce n'est pas grave
    }
  }

  /** `force` = lancé depuis "Comment jouer": toujours démarrer, même si déjà vu */
  public startTutorial(force: boolean = false): void {
    if (!force && this.hasSeenTutorial()) return;
    this.activeStepIndex.set(0);
  }

  public endTutorial(): void {
    this.activeStepIndex.set(null);
    this.markTutorialAsSeen();
  }

  public goToStep(index: number): void {
    if (index < 0 || index >= STEP_IDS.length) return;
    this.activeStepIndex.set(index);
  }

  public goToNextStep(): void {
    const index = this.activeStepIndex();
    if (index !== null) this.goToStep(index + 1);
  }

  public goToPreviousStep(): void {
    const index = this.activeStepIndex();
    if (index !== null) this.goToStep(index - 1);
  }
}
