import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { LucideAngularModule, Smartphone, Brain, Heart, MonitorDown } from 'lucide-angular';

// Événement non standard (Chrome/Edge) pour l'installation PWA
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit, OnDestroy {
  protected i18n = inject(I18nService);

  readonly SmartphoneIcon = Smartphone;
  readonly BrainIcon = Brain;
  readonly HeartIcon = Heart;
  readonly InstallIcon = MonitorDown;

  // Prompt d'installation PWA (Chrome/Edge sur desktop et Android)
  protected canInstall = signal(false);
  protected showIOSInstallHint = signal(false);
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  private onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    this.canInstall.set(true);
  };

  // URLs des stores (à remplacer par les vraies URLs quand les apps seront publiées)
  // Pour iOS: https://apps.apple.com/app/id[APP_ID]
  // Pour Android: https://play.google.com/store/apps/details?id=[PACKAGE_NAME]
  readonly appStoreUrl = 'https://apps.apple.com/app/pavat'; // TODO: Remplacer par l'URL réelle de l'App Store
  readonly playStoreUrl = 'https://play.google.com/store/apps/details?id=com.pavat.app'; // TODO: Remplacer par l'URL réelle de Google Play

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);

    // iOS Safari ne supporte pas beforeinstallprompt: afficher une astuce
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS se présente comme macOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    this.showIOSInstallHint.set(isIOS && !isStandalone);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  async onInstallApp(): Promise<void> {
    if (!this.deferredInstallPrompt) return;
    await this.deferredInstallPrompt.prompt();
    const choice = await this.deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      this.canInstall.set(false);
    }
    this.deferredInstallPrompt = null;
  }

  onPlayInBrowser(): void {
    // Émettre un événement pour indiquer qu'on veut lancer le jeu
    window.dispatchEvent(new CustomEvent('start-game'));
  }
}
