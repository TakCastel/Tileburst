import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LucideAngularModule, Play } from 'lucide-angular';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  protected i18n = inject(I18nService);

  readonly PlayIcon = Play;

  // URLs des stores (à remplacer par les vraies URLs quand les apps seront publiées)
  // Pour iOS: https://apps.apple.com/app/id[APP_ID]
  // Pour Android: https://play.google.com/store/apps/details?id=[PACKAGE_NAME]
  readonly appStoreUrl = 'https://apps.apple.com/app/tileburst'; // TODO: Remplacer par l'URL réelle de l'App Store
  readonly playStoreUrl = 'https://play.google.com/store/apps/details?id=com.tileburst.app'; // TODO: Remplacer par l'URL réelle de Google Play

  onPlayInBrowser(): void {
    // Émettre un événement pour indiquer qu'on veut lancer le jeu
    window.dispatchEvent(new CustomEvent('start-game'));
  }
}
