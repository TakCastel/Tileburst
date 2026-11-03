import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { ConsentService } from '../../services/consent.service';
import { LegalNoticeComponent } from '../legal-notice/legal-notice.component';

/** Bandeau de consentement aux cookies de mesure d'audience. Refuser est aussi simple qu'accepter. */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [LegalNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.choice() === null) {
      <div
        class="fixed inset-x-0 bottom-0 z-[65] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-center pointer-events-none"
        role="region"
        aria-live="polite"
        [attr.aria-label]="i18n.t().consentManage">
        <div class="tb-card pointer-events-auto w-full max-w-xl p-4 flex flex-col gap-3">
          <p class="text-sm leading-snug">
            {{ i18n.t().consentText }}
            <button type="button" class="underline font-semibold" (click)="showLegal = true">{{ i18n.t().legalNotice }}</button>
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="tb-btn tb-btn-cream h-11 text-base" (click)="consent.refuse()">{{ i18n.t().consentRefuse }}</button>
            <button type="button" class="tb-btn tb-btn-green h-11 text-base" (click)="consent.accept()">{{ i18n.t().consentAccept }}</button>
          </div>
        </div>
      </div>
    }
    @if (showLegal) {
      <app-legal-notice (closed)="showLegal = false" />
    }
  `,
})
export class CookieBannerComponent {
  protected i18n = inject(I18nService);
  protected consent = inject(ConsentService);
  protected showLegal = false;
}
