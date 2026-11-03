import { Component, ChangeDetectionStrategy, inject, output, computed } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { ConsentService } from '../../services/consent.service';

/**
 * Mentions légales et politique de confidentialité.
 * Texte en français (version de référence) et en anglais pour les autres langues.
 */
@Component({
  selector: 'app-legal-notice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closed.emit()',
  },
  template: `
    <div class="fixed inset-0 tb-backdrop flex items-center justify-center z-[70] p-4" (click)="closed.emit()">
      <div
        class="tb-card w-full max-w-lg max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-3 p-5 pb-3">
          <h2 id="legal-title" class="text-xl sm:text-2xl font-bold">{{ i18n.t().legalNotice }}</h2>
          <button
            (click)="closed.emit()"
            class="tb-btn tb-btn-cream w-10 h-10 !rounded-full shrink-0"
            [attr.aria-label]="i18n.t().close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="w-5 h-5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="legal-body overflow-y-auto px-5 pb-5 text-sm leading-relaxed text-left" [attr.lang]="isFrench() ? 'fr' : 'en'" dir="ltr">
          @if (isFrench()) {
            <h3>Éditeur</h3>
            <p>
              Pavat est un jeu gratuit édité à titre non professionnel par &#64;tkstl, particulier.<br>
              GitHub : <a href="https://github.com/TakCastel" target="_blank" rel="noopener noreferrer">github.com/TakCastel</a><br>
              Directeur de la publication : &#64;tkstl.<br>
              Contact : <a href="mailto:takcastel&#64;gmail.com">takcastel&#64;gmail.com</a>
            </p>

            <h3>Hébergeur</h3>
            <p>
              Firebase Hosting, service fourni par Google Ireland Limited,
              Gordon House, Barrow Street, Dublin 4, Irlande.
            </p>

            <h3>Cookies et mesure d'audience</h3>
            <p>
              Pavat n'affiche aucune publicité et aucun compte n'est nécessaire pour jouer.
            </p>
            <p>
              Avec votre accord uniquement, le jeu utilise Google Analytics (via Firebase,
              Google Ireland Limited) pour compter les visites et comprendre comment le jeu est utilisé.
              Il dépose alors les cookies <code>_ga</code> et <code>_ga_*</code>, conservés 13 mois au maximum.
              Les données sont statistiques et peuvent être traitées par Google aux États-Unis,
              dans le cadre du Data Privacy Framework UE–États-Unis. Si vous refusez, aucun cookie
              n'est déposé et le jeu fonctionne exactement de la même façon.
            </p>
            <p>
              Vous pouvez changer d'avis à tout moment :
              <button type="button" class="underline font-semibold" (click)="manageCookies()">{{ i18n.t().consentManage }}</button>.
            </p>

            <h3>Données enregistrées sur votre appareil</h3>
            <p>
              Pour fonctionner, le jeu enregistre dans le stockage local de votre navigateur
              (ou de l'application) : la langue, le réglage du son, la palette de couleurs,
              le fait d'avoir vu le tutoriel, la partie en cours et votre meilleur score.
              Ces informations restent sur votre appareil et ne nous sont jamais transmises (ainsi que votre choix concernant les cookies).
              Le jeu garde aussi une copie de ses fichiers pour fonctionner hors ligne.
            </p>
            <p>
              Vous pouvez les effacer à tout moment en supprimant les données du site
              dans les réglages de votre navigateur, ou en désinstallant l'application.
            </p>

            <h3>Journaux techniques de l'hébergeur</h3>
            <p>
              Comme tout hébergeur, Google peut enregistrer des données techniques
              (adresse IP, navigateur, date de la requête) pour assurer la sécurité et le
              bon fonctionnement du service. Ce traitement repose sur l'intérêt légitime à
              fournir un site fiable et sécurisé. Voir la
              <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">politique de confidentialité de Google</a>.
            </p>

            <h3>Vos droits</h3>
            <p>
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit
              d'accès, de rectification, d'effacement et d'opposition. Pour l'exercer, écrivez à
              <a href="mailto:takcastel&#64;gmail.com">takcastel&#64;gmail.com</a>.
              Vous pouvez aussi adresser une réclamation à la
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
            </p>

            <h3>Propriété intellectuelle</h3>
            <p>
              Le jeu, ses graphismes et ses textes sont la propriété de &#64;tkstl.
              La police Fredoka est distribuée sous licence SIL Open Font License 1.1.
            </p>

            <p class="opacity-60 mt-4">Dernière mise à jour : 3 novembre 2026</p>
          } @else {
            <h3>Publisher</h3>
            <p>
              Pavat is a free game published on a non-professional basis by &#64;tkstl, private individual.<br>
              GitHub: <a href="https://github.com/TakCastel" target="_blank" rel="noopener noreferrer">github.com/TakCastel</a><br>
              Publication director: &#64;tkstl.<br>
              Contact: <a href="mailto:takcastel&#64;gmail.com">takcastel&#64;gmail.com</a>
            </p>

            <h3>Hosting</h3>
            <p>
              Firebase Hosting, provided by Google Ireland Limited,
              Gordon House, Barrow Street, Dublin 4, Ireland.
            </p>

            <h3>Cookies and analytics</h3>
            <p>
              Pavat shows no ads and no account is needed to play.
            </p>
            <p>
              Only with your consent, the game uses Google Analytics (via Firebase,
              Google Ireland Limited) to count visits and understand how the game is played.
              It then sets the <code>_ga</code> and <code>_ga_*</code> cookies, kept for up to 13 months.
              The data is statistical and may be processed by Google in the United States under the
              EU–US Data Privacy Framework. If you refuse, no cookie is set and the game works exactly the same.
            </p>
            <p>
              You can change your mind at any time:
              <button type="button" class="underline font-semibold" (click)="manageCookies()">{{ i18n.t().consentManage }}</button>.
            </p>

            <h3>Data stored on your device</h3>
            <p>
              To work, the game stores in your browser's (or the app's) local storage:
              your language, sound setting, colour palette, whether you have seen the tutorial,
              the current game and your best score. This data (including your cookie choice) stays on your device and is never
              sent to us. The game also keeps a copy of its files so it can work offline.
            </p>
            <p>
              You can delete it at any time by clearing this site's data in your browser settings,
              or by uninstalling the app.
            </p>

            <h3>Hosting provider logs</h3>
            <p>
              Like any host, Google may log technical data (IP address, browser, request time)
              to keep the service secure and running. This relies on the legitimate interest of
              providing a reliable and secure website. See
              <a href="https://policies.google.com/privacy?hl=en" target="_blank" rel="noopener noreferrer">Google's privacy policy</a>.
            </p>

            <h3>Your rights</h3>
            <p>
              Under the GDPR you have the right to access, rectify, erase and object to the
              processing of your data. To exercise these rights, write to
              <a href="mailto:takcastel&#64;gmail.com">takcastel&#64;gmail.com</a>.
              You may also lodge a complaint with the French data protection authority,
              the <a href="https://www.cnil.fr/en" target="_blank" rel="noopener noreferrer">CNIL</a>.
            </p>

            <h3>Intellectual property</h3>
            <p>
              The game, its artwork and texts are the property of &#64;tkstl.
              The Fredoka font is distributed under the SIL Open Font License 1.1.
            </p>

            <p class="opacity-60 mt-4">Last updated: 3 November 2026. The French version prevails.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-body h3 { font-weight: 700; font-size: 1rem; margin: 1rem 0 0.25rem; }
    .legal-body h3:first-child { margin-top: 0; }
    .legal-body p { margin: 0 0 0.5rem; }
      .legal-body code { font-size: 0.85em; }
    .legal-body a { text-decoration: underline; font-weight: 600; word-break: break-word; }
  `],
})
export class LegalNoticeComponent {
  protected i18n = inject(I18nService);
  readonly closed = output<void>();
  private consent = inject(ConsentService);
  protected isFrench = computed(() => this.i18n.getLanguage() === 'fr');

  /** Réaffiche le bandeau de consentement pour changer de choix. */
  protected manageCookies(): void {
    this.consent.reset();
    this.closed.emit();
  }
}
