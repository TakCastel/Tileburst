import { Component, ChangeDetectionStrategy, inject, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from '../../services/tutorial.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialComponent implements OnDestroy {
  protected tutorialService = inject(TutorialService);
  protected i18n = inject(I18nService);

  isTutorialActive = this.tutorialService.isTutorialActive;
  currentStep = this.tutorialService.currentStep;
  activeStepIndex = this.tutorialService.activeStepIndex;
  totalSteps = computed(() => this.tutorialService.allSteps().length);
  isFirstStep = this.tutorialService.isFirstStep;
  isLastStep = this.tutorialService.isLastStep;

  private scrollBlockEffect = effect(() => {
    const isActive = this.isTutorialActive();
    if (isActive) {
      // Sauvegarder la position de scroll actuelle
      const scrollY = window.scrollY;
      // Bloquer le scroll du body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurer le scroll du body
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  });

  ngOnDestroy(): void {
    // S'assurer de restaurer le scroll si le composant est détruit
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
  }

  close(): void {
    this.tutorialService.endTutorial();
  }

  next(): void {
    this.tutorialService.goToNextStep();
  }

  previous(): void {
    this.tutorialService.goToPreviousStep();
  }
}
