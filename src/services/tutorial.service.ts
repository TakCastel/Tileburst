import { Injectable, signal, computed } from '@angular/core';

export interface TutorialStep {
  id: 'welcome' | 'clearing' | 'validated' | 'shrinking' | 'goal';
  title: string;
  content: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans Tileburst !',
    content: 'Le but est simple : placez les tuiles qui apparaissent dans la grille. Faites glisser la "Tuile Actuelle" ou cliquez sur la grille pour la positionner.'
  },
  {
    id: 'clearing',
    title: 'Dégager des lignes',
    content: "Remplissez une ligne ou une colonne complète avec des blocs de la MÊME couleur pour l'effacer. Cela vous rapporte des points et agrandit la grille !"
  },
  {
    id: 'validated',
    title: 'Blocs Validés : Votre assurance-vie',
    content: 'Connectez un grand groupe de blocs de même couleur pour les "valider" (le nombre requis est indiqué dans le conseil stratégique). Ils obtiennent une coche et deviennent votre filet de sécurité.'
  },
  {
    id: 'shrinking',
    title: 'La grille se défend !',
    content: "Si vous ne pouvez plus placer de tuile, la grille rétrécit ! Les blocs validés sont alors effacés (vous donnant des points et de l'espace), mais les blocs non validés sur les bords sont détruits."
  },
    {
    id: 'goal',
    title: 'Score et Fin de Partie',
    content: 'Le jeu se termine si la grille rétrécit à sa taille minimale et que vous êtes toujours bloqué. Essayez de faire le meilleur score possible ! Bonne chance !'
  }
];

const TUTORIAL_SEEN_KEY = 'tileburst_tutorial_seen';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  activeStepIndex = signal<number | null>(null);

  readonly allSteps = TUTORIAL_STEPS;

  isTutorialActive = computed(() => this.activeStepIndex() !== null);
  
  currentStep = computed(() => {
    const index = this.activeStepIndex();
    return index !== null ? this.allSteps[index] : null;
  });

  isFirstStep = computed(() => this.activeStepIndex() === 0);
  isLastStep = computed(() => this.activeStepIndex() === this.allSteps.length - 1);

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
    this.activeStepIndex.update(index => (index === null || index >= this.allSteps.length - 1) ? index : index + 1);
  }

  public goToPreviousStep(): void {
    this.activeStepIndex.update(index => (index === null || index <= 0) ? index : index - 1);
  }
}