import { Injectable, signal } from '@angular/core';

type Wave = OscillatorType;

interface ToneOptions {
  freq: number;
  /** Fréquence d'arrivée (glissando), optionnelle */
  toFreq?: number;
  type?: Wave;
  /** Décalage de départ en secondes */
  delay?: number;
  attack?: number;
  decay: number;
  gain: number;
  /** Part envoyée dans la réverbération (0 à 1) */
  reverb?: number;
  /** Filtre passe-bas optionnel, avec balayage possible */
  lowpass?: number;
  toLowpass?: number;
}

interface NoiseOptions {
  filter: BiquadFilterType;
  freq: number;
  toFreq?: number;
  q?: number;
  delay?: number;
  attack?: number;
  decay: number;
  gain: number;
  reverb?: number;
}

/** Une case (ou un groupe de cases) qui explose pendant la réduction */
export interface ShrinkPop {
  delayMs: number;
  count: number;
  /** La case contenait une tuile (explosion plus forte) */
  filled: boolean;
}

// Gamme pentatonique de Do : toujours harmonieuse, quelle que soit la combinaison
const PENTATONIC = [0, 2, 4, 7, 9];
const C4 = 261.63;

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isSupported = true;

  // État du son (activé/désactivé) - persiste dans localStorage
  public readonly isSoundEnabled = signal<boolean>(this.loadSoundPreference());

  private cycles = new Map<string, number>();
  private comboLevel = 0;
  private lastClearTime = 0;
  private lastPlayed = new Map<string, number>();

  private loadSoundPreference(): boolean {
    try {
      const saved = localStorage.getItem('pavat_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  }

  private saveSoundPreference(enabled: boolean): void {
    try {
      localStorage.setItem('pavat_sound_enabled', enabled.toString());
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }

  public toggleSound(): void {
    const newValue = !this.isSoundEnabled();
    this.isSoundEnabled.set(newValue);
    this.saveSoundPreference(newValue);
  }

  // ---------------------------------------------------------------------------
  // Chaîne audio
  // ---------------------------------------------------------------------------

  /**
   * Le contexte est créé au premier son (donc après un geste du joueur),
   * ce qui évite l'avertissement d'autoplay du navigateur.
   */
  private setup(): boolean {
    if (this.ctx || !this.isSupported) return this.isSupported;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();

      // Limiteur doux : évite la saturation quand plusieurs sons se superposent
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 12;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;
      compressor.connect(ctx.destination);

      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(compressor);

      // Petite réverbération synthétique pour donner de l'espace
      const convolver = ctx.createConvolver();
      convolver.buffer = this.createImpulse(ctx, 1.4, 3);
      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 1;
      reverbSend.connect(convolver);
      convolver.connect(master);

      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      this.ctx = ctx;
      this.master = master;
      this.reverbSend = reverbSend;
      this.noiseBuffer = noise;
      return true;
    } catch (e) {
      console.warn('AudioContext non disponible:', e);
      this.isSupported = false;
      return false;
    }
  }

  private createImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  /**
   * Prépare la lecture. `key` + `minGap` évitent d'empiler le même son
   * plusieurs fois au même instant.
   */
  private ready(key: string, minGap = 0.025): AudioContext | null {
    if (!this.isSoundEnabled() || !this.setup() || !this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const last = this.lastPlayed.get(key) ?? -1;
    if (now - last < minGap) return null;
    this.lastPlayed.set(key, now);
    return this.ctx;
  }

  /** Avance le compteur d'un son et renvoie la position dans un cycle de `length` */
  private nextStep(key: string, length = 4): number {
    const i = this.cycles.get(key) ?? 0;
    this.cycles.set(key, i + 1);
    return i % length;
  }

  /** Petite variation aléatoire autour de 1 (ex : 0.04 → ±4 %) */
  private vary(amount: number): number {
    return 1 + (Math.random() * 2 - 1) * amount;
  }

  private note(semitonesFromC4: number): number {
    return C4 * Math.pow(2, semitonesFromC4 / 12);
  }

  /** Degré n de la pentatonique, sur plusieurs octaves */
  private pentatonic(degree: number): number {
    const octave = Math.floor(degree / PENTATONIC.length);
    const step = ((degree % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length;
    return this.note(PENTATONIC[step] + octave * 12);
  }

  private connectOut(node: AudioNode, reverb = 0): void {
    node.connect(this.master!);
    if (reverb > 0) {
      const send = this.ctx!.createGain();
      send.gain.value = reverb;
      node.connect(send);
      send.connect(this.reverbSend!);
    }
  }

  private envelope(gain: GainNode, start: number, attack: number, decay: number, peak: number): void {
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  }

  private tone(o: ToneOptions): void {
    const ctx = this.ctx!;
    const start = ctx.currentTime + (o.delay ?? 0);
    const attack = o.attack ?? 0.004;
    const end = start + attack + o.decay;

    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, start);
    if (o.toFreq) osc.frequency.exponentialRampToValueAtTime(o.toFreq, end);

    const gain = ctx.createGain();
    this.envelope(gain, start, attack, o.decay, o.gain);

    let last: AudioNode = osc;
    if (o.lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(o.lowpass, start);
      if (o.toLowpass) filter.frequency.exponentialRampToValueAtTime(o.toLowpass, end);
      osc.connect(filter);
      last = filter;
    }
    last.connect(gain);
    this.connectOut(gain, o.reverb);

    osc.start(start);
    osc.stop(end + 0.02);
  }

  private noise(o: NoiseOptions): void {
    const ctx = this.ctx!;
    const start = ctx.currentTime + (o.delay ?? 0);
    const attack = o.attack ?? 0.002;
    const end = start + attack + o.decay;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = o.filter;
    filter.Q.value = o.q ?? 1;
    filter.frequency.setValueAtTime(o.freq, start);
    if (o.toFreq) filter.frequency.exponentialRampToValueAtTime(o.toFreq, end);

    const gain = ctx.createGain();
    this.envelope(gain, start, attack, o.decay, o.gain);

    src.connect(filter);
    filter.connect(gain);
    this.connectOut(gain, o.reverb);

    // Démarrer à un endroit aléatoire du buffer pour que chaque bruit soit différent
    src.start(start, Math.random() * 0.5);
    src.stop(end + 0.02);
  }

  // ---------------------------------------------------------------------------
  // Sons du jeu
  // ---------------------------------------------------------------------------

  /** Pose d'une tuile : un « tac » boisé + une note douce qui suit une petite mélodie */
  playPlaceSound(): void {
    if (!this.ready('place')) return;

    // Attaque : le contact de la tuile
    this.noise({ filter: 'bandpass', freq: 2200 * this.vary(0.1), q: 1.2, decay: 0.03, gain: 0.35 });
    // Corps : petit coup sourd
    this.tone({ freq: 190 * this.vary(0.05), toFreq: 95, type: 'sine', decay: 0.09, gain: 0.55 });

    // Note mélodique : cycle Do - Ré - Mi - Sol (octave 5)
    const degree = 5 + [0, 1, 2, 3][this.nextStep('place')];
    const freq = this.pentatonic(degree);
    this.tone({ freq, type: 'triangle', delay: 0.005, decay: 0.16, gain: 0.16, reverb: 0.25 });
    this.tone({ freq: freq * 2, type: 'sine', delay: 0.005, decay: 0.07, gain: 0.05 });
  }

  /**
   * Rotation : petit « tic » + note pincée. Un tour complet (4 rotations)
   * joue la mélodie Mi - Sol - La - Do.
   */
  playRotateSound(): void {
    if (!this.ready('rotate', 0.03)) return;

    const melody = [this.note(28), this.note(31), this.note(33), this.note(36)]; // Mi6 Sol6 La6 Do7
    const freq = melody[this.nextStep('rotate')];

    this.noise({ filter: 'highpass', freq: 4200 * this.vary(0.05), q: 0.8, decay: 0.014, gain: 0.22 });
    this.tone({ freq: freq / 4, type: 'sine', decay: 0.03, gain: 0.14 });
    this.tone({ freq, type: 'triangle', delay: 0.003, decay: 0.09, gain: 0.07, reverb: 0.2 });
  }

  /** Échange de tuiles : un souffle rapide et deux notes qui s'inversent */
  playSwapSound(): void {
    if (!this.ready('swap', 0.04)) return;

    this.noise({ filter: 'bandpass', freq: 700, toFreq: 3200, q: 2, attack: 0.03, decay: 0.08, gain: 0.18 });
    // Cycle de 4 paires de notes qui s'inversent (haute puis basse)
    const pairs = [[16, 12], [19, 14], [21, 16], [24, 19]];
    const [high, low] = pairs[this.nextStep('swap')];
    this.tone({ freq: this.note(high), type: 'triangle', decay: 0.07, gain: 0.13, reverb: 0.15 });
    this.tone({ freq: this.note(low), type: 'triangle', delay: 0.06, decay: 0.1, gain: 0.13, reverb: 0.2 });
  }

  /**
   * Suppression de lignes : arpège montant avec scintillement.
   * Plus il y a de lignes, plus l'arpège est long. Les suppressions
   * enchaînées (combo) montent d'un cran à chaque fois.
   */
  playClearSound(linesCleared: number = 1): void {
    if (!this.ready('clear', 0.06)) return;

    const nowMs = performance.now();
    this.comboLevel = nowMs - this.lastClearTime < 2500 ? Math.min(this.comboLevel + 1, 6) : 0;
    this.lastClearTime = nowMs;

    const lines = Math.max(1, linesCleared);
    const steps = Math.min(3 + lines, 8);
    // Point de départ en cycle de 4 (Do, Ré, Mi, Ré), puis plus haut à chaque combo
    const baseDegree = 5 + [0, 1, 2, 1][this.nextStep('clear')] + this.comboLevel;
    const level = Math.min(0.75 + lines * 0.1, 1.1);

    for (let i = 0; i < steps; i++) {
      const freq = this.pentatonic(baseDegree + i);
      const delay = i * 0.045;
      const isLast = i === steps - 1;
      this.tone({
        freq,
        type: 'triangle',
        delay,
        decay: isLast ? 0.5 : 0.18,
        gain: 0.17 * level,
        reverb: 0.4,
      });
      this.tone({ freq: freq * 2, type: 'sine', delay, decay: 0.09, gain: 0.05 * level, reverb: 0.3 });
    }

    // Accord tenu sous l'arpège
    const root = this.pentatonic(baseDegree - 5);
    [1, 1.25, 1.5].forEach((ratio) => {
      this.tone({
        freq: root * ratio,
        type: 'sine',
        attack: 0.02,
        decay: 0.45,
        gain: 0.09 * level,
        reverb: 0.35,
      });
    });

    // Scintillement
    this.noise({
      filter: 'highpass',
      freq: 5000,
      toFreq: 9000,
      attack: 0.05,
      decay: 0.35,
      gain: 0.07 * level,
      reverb: 0.5,
    });
  }

  /** Groupe validé : un « ding » de clochette, avec une quinte en plus si plusieurs groupes */
  playVictorySound(groupCount: number = 1): void {
    if (!this.ready('victory', 0.08)) return;

    // Sol - La - Do - Ré, comme avant, une octave au-dessus
    const melody = [this.note(19), this.note(21), this.note(24), this.note(26)];
    const freq = melody[this.nextStep('victory')];

    const level = Math.min(0.8 + groupCount * 0.15, 1.2);
    this.bell(freq, 0, 0.16 * level);
    if (groupCount > 1) {
      this.bell(freq * 1.5, 0.07, 0.1 * level);
    }
  }

  /** Clochette : fondamentale + partiels inharmoniques qui s'éteignent plus vite */
  private bell(freq: number, delay: number, gain: number): void {
    this.tone({ freq, type: 'sine', delay, decay: 0.7, gain, reverb: 0.45 });
    this.tone({ freq: freq * 2.76, type: 'sine', delay, decay: 0.25, gain: gain * 0.35, reverb: 0.3 });
    this.tone({ freq: freq * 5.4, type: 'sine', delay, decay: 0.08, gain: gain * 0.2 });
  }

  /**
   * Réduction de la grille : un impact grave, puis une petite explosion par case
   * détruite, calée sur l'animation. Les explosions descendent dans la gamme
   * pour former une petite cascade.
   * Sans `pops` (animations désactivées), on simule une cascade de 6 cases.
   */
  playShrinkSound(pops?: ShrinkPop[]): void {
    if (!this.ready('shrink', 0.15)) return;

    const pitch = [1, 0.89, 0.94, 0.84][this.nextStep('shrink')];
    const list = pops && pops.length
      ? [...pops].sort((a, b) => a.delayMs - b.delayMs)
      : Array.from({ length: 6 }, (_, i) => ({ delayMs: i * 28, count: 1, filled: true }));

    // Impact : coup de basse et souffle, au moment où la grille tremble
    this.tone({ freq: 120 * pitch, toFreq: 32, type: 'sine', attack: 0.004, decay: 0.55, gain: 0.6 });
    this.noise({ filter: 'lowpass', freq: 2500 * pitch, toFreq: 100, q: 0.7, attack: 0.004, decay: 0.6, gain: 0.35, reverb: 0.4 });

    // Plus il y a d'explosions, plus chacune est discrète : le total reste
    // à peu près constant au lieu de s'additionner. Jusqu'à 4, rien ne change.
    const n = list.length;
    const density = Math.min(1, Math.sqrt(4 / n));
    // Les basses s'additionnent le plus vite : on les réduit davantage
    const bassScale = density * density;
    // Budget global d'environ 8 crépitements de débris
    const debrisEvery = Math.max(1, Math.ceil(n / 4));

    const topDegree = 9 + [0, 1, 0, -1][this.nextStep('shrinkMelody')];
    list.forEach((pop, i) =>
      this.cellPop(pop, topDegree - i, pitch, density, bassScale, i % debrisEvery === 0 ? 2 : 0)
    );
  }

  /** Explosion d'une case (ou de plusieurs cases qui sautent au même instant) */
  private cellPop(
    pop: ShrinkPop,
    degree: number,
    pitch: number,
    scale: number,
    bassScale: number,
    debris: number
  ): void {
    const delay = pop.delayMs / 1000;
    const level = (pop.filled ? 1 : 0.4) * Math.min(1 + (pop.count - 1) * 0.15, 1.3) * scale;
    const bass = level * (bassScale / scale);
    const v = this.vary(0.08);

    // Claquement
    this.noise({ filter: 'bandpass', freq: 2000 * pitch * v, q: 1, delay, attack: 0.001, decay: 0.06, gain: 0.32 * level });
    // Petit boum
    this.tone({ freq: 170 * pitch * v, toFreq: 50, type: 'sine', delay, attack: 0.002, decay: 0.12, gain: 0.3 * bass });
    // Note de la cascade
    this.tone({
      freq: this.pentatonic(Math.max(degree, 2)) * pitch,
      type: 'triangle',
      delay,
      decay: 0.14,
      gain: 0.09 * level,
      reverb: 0.3,
    });

    if (!pop.filled) return;
    // Débris : quelques crépitements quand les éclats retombent
    for (let k = 0; k < debris; k++) {
      this.noise({
        filter: 'bandpass',
        freq: 3000 + Math.random() * 3500,
        q: 5,
        delay: delay + 0.06 + Math.random() * 0.3,
        attack: 0.001,
        decay: 0.015 + Math.random() * 0.02,
        gain: 0.08 + Math.random() * 0.06,
        reverb: 0.25,
      });
    }
  }

  /**
   * Game over : mélodie descendante (Sol - Mi - Do - La), dernière note qui
   * s'affaisse comme une machine qui s'éteint, sur un bourdon grave.
   */
  playGameOverSound(): void {
    if (!this.ready('gameover', 1)) return;

    const notes = [19, 16, 12, 9]; // Sol5 Mi5 Do5 La4
    const step = 0.22;
    notes.forEach((semi, i) => {
      const isLast = i === notes.length - 1;
      const freq = this.note(semi);
      const delay = i * step;
      // Deux oscillateurs un peu désaccordés pour un son plus chaud et mélancolique
      [1, 1.006].forEach((detune) => {
        this.tone({
          freq: freq * detune,
          toFreq: isLast ? freq * detune * 0.7 : undefined,
          type: 'triangle',
          delay,
          attack: 0.01,
          decay: isLast ? 1.3 : 0.3,
          gain: 0.12,
          lowpass: 2400,
          toLowpass: isLast ? 500 : undefined,
          reverb: 0.5,
        });
      });
      this.tone({ freq: freq / 2, type: 'sine', delay, attack: 0.01, decay: isLast ? 1.2 : 0.25, gain: 0.08 });
    });

    // Bourdon grave sous la mélodie
    this.tone({
      freq: this.note(-15), // La2
      toFreq: this.note(-20),
      type: 'sawtooth',
      attack: 0.15,
      decay: 1.8,
      gain: 0.07,
      lowpass: 400,
      toLowpass: 120,
      reverb: 0.4,
    });

    // Dernier souffle
    this.noise({
      filter: 'lowpass',
      freq: 1200,
      toFreq: 150,
      delay: notes.length * step - 0.1,
      attack: 0.1,
      decay: 1,
      gain: 0.08,
      reverb: 0.5,
    });
  }

  /** Agrandissement de la grille : montée aérienne qui finit sur une note claire */
  playExpandSound(): void {
    if (!this.ready('expand', 0.15)) return;

    this.noise({ filter: 'bandpass', freq: 400, toFreq: 4000, q: 1.5, attack: 0.12, decay: 0.15, gain: 0.15, reverb: 0.3 });
    this.tone({ freq: 262, toFreq: 523, type: 'triangle', attack: 0.05, decay: 0.25, gain: 0.14, reverb: 0.3 });
    // Note d'arrivée en cycle de 4 (Sol, La, Do, Ré) + sa quarte au-dessus
    const top = [19, 21, 24, 26][this.nextStep('expand')];
    this.tone({ freq: this.note(top), type: 'sine', delay: 0.22, decay: 0.4, gain: 0.12, reverb: 0.4 });
    this.tone({ freq: this.note(top + 5), type: 'sine', delay: 0.26, decay: 0.45, gain: 0.1, reverb: 0.45 });
  }

  /** Alerte avant réduction : deux pulsations douces, comme un battement */
  playShrinkWarningSound(): void {
    if (!this.ready('warning', 0.3)) return;

    // Cycle de 4 : Fa#4, Sol4, Fa#4, Mi4 (tension qui oscille)
    const freq = this.note([6, 7, 6, 4][this.nextStep('warning')]);
    [0, 0.14].forEach((delay, i) => {
      this.tone({ freq: freq * (i === 0 ? 1 : 0.94), type: 'triangle', delay, decay: 0.12, gain: 0.2, lowpass: 1800 });
      this.tone({ freq: freq / 2, type: 'sine', delay, decay: 0.12, gain: 0.2 });
    });
  }
}
