import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
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
export class TutorialComponent {
  protected tutorialService = inject(TutorialService);
  protected i18n = inject(I18nService);

  isTutorialActive = this.tutorialService.isTutorialActive;
  currentStep = this.tutorialService.currentStep;
  activeStepIndex = this.tutorialService.activeStepIndex;
  totalSteps = computed(() => this.tutorialService.allSteps().length);
  isFirstStep = this.tutorialService.isFirstStep;
  isLastStep = this.tutorialService.isLastStep;

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
