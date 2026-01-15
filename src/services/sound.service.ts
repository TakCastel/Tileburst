import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  private masterVolume = 1.0; // Volume général à 100% pour être bien audible
  private isEnabled = true;
  
  // État du son (activé/désactivé) - persiste dans localStorage
  public readonly isSoundEnabled = signal<boolean>(this.loadSoundPreference());

  constructor() {
    // Initialiser le contexte audio au premier appel
    this.initAudioContext();
  }

  private loadSoundPreference(): boolean {
    try {
      const saved = localStorage.getItem('tileburst_sound_enabled');
      return saved !== null ? saved === 'true' : true; // Activé par défaut
    } catch {
      return true;
    }
  }

  private saveSoundPreference(enabled: boolean): void {
    try {
      localStorage.setItem('tileburst_sound_enabled', enabled.toString());
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }

  public toggleSound(): void {
    const newValue = !this.isSoundEnabled();
    this.isSoundEnabled.set(newValue);
    this.saveSoundPreference(newValue);
  }

  private initAudioContext(): void {
    try {
      // Créer le contexte audio de manière lazy
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (e) {
      console.warn('AudioContext non disponible:', e);
      this.isEnabled = false;
    }
  }

  private ensureAudioContext(): boolean {
    // Vérifier d'abord si le son est activé
    if (!this.isSoundEnabled()) {
      return false;
    }
    
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.initAudioContext();
    }
    
    // Si le contexte est suspendu (souvent à cause de l'autoplay policy), le reprendre
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.isEnabled && this.audioContext !== null;
  }

  private placeSoundIndex = 0;
  private victorySoundIndex = 0;

  /**
   * Génère un click musical lors du placement - cycle de 4 notes harmonieuses (Do-Ré-Mi-Sol)
   */
  playPlaceSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    // Cycle de 4 notes harmonieuses : Do-Ré-Mi-Sol
    const melody = [
      523.25, // Do5
      587.33, // Ré5
      659.25, // Mi5
      783.99, // Sol5
    ];
    
    // Sélectionner la note selon le cycle
    const noteIndex = this.placeSoundIndex % 4;
    this.placeSoundIndex++;
    const freq = melody[noteIndex];
    
    const now = this.audioContext.currentTime;
    
    // Créer un click avec la tonalité de la note
    const bufferSize = this.audioContext.sampleRate * 0.01; // 10ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Générer un click avec la tonalité de la note mélodique
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      // Mélange de tonalité et de bruit pour un click musical mais discret
      const noise = (Math.random() * 2 - 1) * 0.2;
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.6;
      // Enveloppe exponentielle pour un click net
      data[i] = (tone + noise) * Math.exp(-t * 200);
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const volume = this.masterVolume * 0.22;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    
    source.start(now);
    source.stop(now + 0.01);
  }

  /**
   * Génère un son de rotation - click discret avec légère variation
   */
  playRotateSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    // Click très court et discret, légèrement différent du placement
    const bufferSize = this.audioContext.sampleRate * 0.006; // 6ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Click avec tonalité légèrement plus aiguë
    const baseFreq = 1000;
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.2;
      const tone = Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
      data[i] = (tone + noise) * Math.exp(-t * 200);
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.006);
    
    source.start(now);
    source.stop(now + 0.006);
  }

  /**
   * Génère un son de suppression de blocs - satisfaisant et harmonieux
   */
  playClearSound(linesCleared: number = 1): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const baseFreq = 330; // Mi4

    // Créer un accord harmonieux pour les suppressions
    const frequencies = [
      baseFreq,
      baseFreq * 1.25, // Quarte
      baseFreq * 1.5,  // Quinte
    ];

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.type = 'sine';

      // Délai légèrement décalé pour créer un effet de cascade
      const delay = index * 0.02;
      const volume = this.masterVolume * (0.6 - index * 0.15) * Math.min(linesCleared / 3, 1);

      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.2);
    });
  }

  /**
   * Génère un ding discret lors de la validation - oscillateur pur avec cycle de 4 notes
   */
  playVictorySound(groupCount: number = 1): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    // Cycle de 4 notes harmonieuses pour la validation : Sol-La-Do-Ré
    const melody = [
      392.00, // Sol4
      440.00, // La4
      523.25, // Do5
      587.33, // Ré5
    ];
    
    // Sélectionner la note selon le cycle
    const noteIndex = this.victorySoundIndex % 4;
    this.victorySoundIndex++;
    const freq = melody[noteIndex];
    
    const now = this.audioContext.currentTime;
    
    // Utiliser un oscillateur pur (pas de buffer) pour un son vraiment différent
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.type = 'sine'; // Son pur et doux
    
    // Enveloppe douce et plus longue pour un ding agréable
    const volume = this.masterVolume * 0.3 * Math.min(groupCount / 2, 1);
    const duration = 0.08; // Plus long qu'un click pour un vrai "ding"
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Génère un son d'échange de tuiles - click discret
   */
  playSwapSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    // Click similaire au placement mais légèrement différent
    const bufferSize = this.audioContext.sampleRate * 0.009; // 9ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Click avec tonalité moyenne
    const baseFreq = 700;
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.25;
      const tone = Math.sin(2 * Math.PI * baseFreq * t) * 0.6;
      data[i] = (tone + noise) * Math.exp(-t * 180);
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.009);
    
    source.start(now);
    source.stop(now + 0.009);
  }

  /**
   * Génère un son de réduction de grille - avertissement doux
   */
  playShrinkSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Son descendant pour indiquer une réduction
    const startFreq = 440;
    const endFreq = 330;
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sine';

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  /**
   * Génère un son d'expansion de grille - montant et positif
   */
  playExpandSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Son montant pour indiquer une expansion
    const startFreq = 330;
    const endFreq = 440;
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + 0.2);
    oscillator.type = 'sine';

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  /**
   * Génère un son d'avertissement de réduction imminente
   */
  playShrinkWarningSound(): void {
    if (!this.ensureAudioContext() || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Son d'avertissement discret
    oscillator.frequency.setValueAtTime(370, this.audioContext.currentTime); // Fa#4
    oscillator.type = 'sine';

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }
}
