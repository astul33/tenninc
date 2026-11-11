/**
 * Procedural Web Audio API Sound Engine & Speech Synthesizer
 * 100% reliable in all environments with zero external mp3 dependencies.
 */

import { ShotType } from '../types/tennis';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private step: number = 0;
  private footstepTimer: number = 0;

  constructor() {
    // Lazily initialized on first user gesture
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.75, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Realistic tennis racket string-bed impact sound:
   * Sweet spot thud, string ping, and acoustic ball compression.
   */
  public playHit(
    type: ShotType | 'opponent' = 'flat',
    power: number = 1.0,
    sweetSpotRatio: number = 1.0
  ) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (type === 'special') {
      // Explosive anime power punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      this.playWhiteNoise(0.25, 1400, 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.4);
      return;
    }

    if (type === 'slice' || type === 'dropshot') {
      // High-frequency brushing strings swish
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.14);

      gain.gain.setValueAtTime(0.4 * power, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.14);
      this.playWhiteNoise(0.09, 3200, 0.18 * power);
      return;
    }

    // Realistic ball compression pop
    const baseFreq = type === 'smash' || type === 'serve' ? 320 : type === 'opponent' ? 240 : 280;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * (0.8 + 0.3 * sweetSpotRatio), t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.11);

    const hitVolume = Math.min(0.85 * power, 1.0);
    gain.gain.setValueAtTime(hitVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);

    // Realistic metallic string vibration ping (sweet spot produces crystalline harmonic ping)
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(740 + sweetSpotRatio * 180, t);
    ping.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    pingGain.gain.setValueAtTime(0.35 * sweetSpotRatio, t);
    pingGain.gain.exponentialRampToValueAtTime(0.005, t + 0.08);

    ping.connect(pingGain);
    pingGain.connect(this.sfxGain);
    ping.start(t);
    ping.stop(t + 0.08);
  }

  /**
   * Court surface ball bounce sound (hollow felt thud)
   */
  public playBounce(volume: number = 1.0, isClay: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isClay ? 120 : 150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    const gainVal = Math.min(0.55 * volume, 0.65);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Tennis shoe rubber squeak / friction on sudden acceleration or direction change
   */
  public playShoeSqueak() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = Date.now();
    if (now - this.footstepTimer < 180) return;
    this.footstepTimer = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Net cord clip / rattle
   */
  public playNetHit() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Ball toss whoosh
   */
  public playToss() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.playWhiteNoise(0.12, 1800, 0.14);
  }

  /**
   * Umpire Whistle
   */
  public playWhistle() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2400, t);
    osc2.frequency.setValueAtTime(2440, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.setValueAtTime(0.28, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  /**
  /**
   * Massive, hilarious, long stadium "BOOOOOOOOOOO!" (بوووووووووووووووووووو!)
   * Multi-voice formant synthesis with pitch wobble, low rumble, and crowd disappointment.
   */
  public playCrowdBoo(duration: number = 3.6) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const masterBooGain = this.ctx.createGain();
    masterBooGain.gain.setValueAtTime(0.001, t);
    masterBooGain.gain.exponentialRampToValueAtTime(0.7, t + 0.35);
    masterBooGain.gain.setValueAtTime(0.65, t + duration - 0.9);
    masterBooGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    masterBooGain.connect(this.sfxGain);

    // Formant vocal filter for 'OOO' / 'UUU' sound
    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(360, t);
    formantFilter.frequency.linearRampToValueAtTime(310, t + duration);
    formantFilter.Q.setValueAtTime(3.2, t);
    formantFilter.connect(masterBooGain);

    // Multi-voice choir oscillators detuned across typical vocal registers
    const pitches = [105, 112, 119, 126, 134, 142, 150, 162, 215, 228];
    pitches.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';

      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 0.93, t + duration);

      // Micro-vibrato on each voice for natural chorus effect
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(3.8 + (idx * 0.3), t);
      lfoGain.gain.setValueAtTime(freq * 0.045, t);
      lfo.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + duration);

      const voiceVol = (0.07 + (idx % 3) * 0.025);
      gain.gain.setValueAtTime(voiceVol, t);
      osc.connect(gain);
      gain.connect(formantFilter);

      osc.start(t);
      osc.stop(t + duration);
    });

    this.playShapedNoise(duration, 380, 0.45, 'lowpass');
    this.playShapedNoise(duration * 0.85, 620, 0.28, 'bandpass');
  }

  /**
   * Huge, energetic stadium cheer & applause ("WAAAAAAAH / YEEEEEEES!")
   * Multi-layered vocal roar + randomized individual clapping transients + stadium whistles
   */
  public playCrowdCheer(isBig: boolean = true) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const duration = isBig ? 4.2 : 2.4;
    const t = this.ctx.currentTime;

    // 1. Massive vocal crowd roar (vocal formant sweep)
    const roarGain = this.ctx.createGain();
    roarGain.gain.setValueAtTime(0.001, t);
    roarGain.gain.exponentialRampToValueAtTime(isBig ? 0.85 : 0.45, t + 0.35);
    roarGain.gain.setValueAtTime(isBig ? 0.75 : 0.4, t + duration * 0.65);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    roarGain.connect(this.sfxGain);

    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'bandpass';
    roarFilter.frequency.setValueAtTime(650, t);
    roarFilter.frequency.exponentialRampToValueAtTime(1300, t + 0.45);
    roarFilter.frequency.exponentialRampToValueAtTime(750, t + duration);
    roarFilter.Q.setValueAtTime(1.8, t);
    roarFilter.connect(roarGain);

    // Multi-voice ecstatic roar
    [175, 220, 260, 330, 415, 520].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.12, t + 0.4);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, t + duration);

      const vGain = this.ctx!.createGain();
      vGain.gain.setValueAtTime(0.065, t);
      osc.connect(vGain);
      vGain.connect(roarFilter);
      osc.start(t);
      osc.stop(t + duration);
    });

    // 2. Realistic stadium applause (dense crackling noise burst with stereo-like feel)
    this.playShapedNoise(duration, 2400, isBig ? 0.45 : 0.25, 'bandpass');
    this.playShapedNoise(duration * 0.85, 1200, isBig ? 0.35 : 0.2, 'lowpass');

    // 3. Spontaneous enthusiastic spectator whistles for big moments!
    if (isBig) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playStadiumFanWhistle();
      }, 300);
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playStadiumFanWhistle();
      }, 950);
    }
  }

  /**
   * Realistic high-pitched spectator whistle from the stands
   */
  public playStadiumFanWhistle() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startF = 1800 + Math.random() * 600;
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.35, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(startF * 0.88, t + 0.35);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Dramatic crowd gasp / sigh ("أووووووه / Ohhhhh!")
   */
  public playCrowdGasp() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const duration = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    gain.connect(this.sfxGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(820, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + duration);
    filter.Q.setValueAtTime(2.2, t);
    filter.connect(gain);

    [130, 160, 200, 260].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 0.82, t + duration);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration);
    });

    this.playShapedNoise(duration * 0.75, 950, 0.32, 'bandpass');
  }

  /**
   * Stadium rhythmic chant: *Clap-Clap*, *Clap-Clap-Clap* with cheering crowd
   */
  public playCrowdChant() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const claps = [0, 0.3, 0.7, 0.95, 1.2];
    claps.forEach((offset) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playShapedNoise(0.12, 1600, 0.45, 'bandpass');
      }, offset * 1000);
    });

    // Sustained background hype cheer
    this.playCrowdCheer(false);
  }

  /**
   * Official Umpire Voice Announcement
   */
  public speakUmpireCall(callText: string, lang: 'ar' | 'en' = 'en') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(callText);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.pitch = 1.05;
      utterance.rate = 1.1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback handled gracefully
    }
  }

  public playPointChime(isWin: boolean) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = isWin ? [523.25, 659.25, 783.99, 1046.5] : [440, 392, 349.23];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.28, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.22);
    });
  }

  public playCharge() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.4);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playShapedNoise(
    duration: number,
    cutoff: number,
    volume: number,
    filterType: BiquadFilterType = 'bandpass'
  ) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  /**
   * Grand Slam Championship Final Victory Crowd Explosion!
   * Multi-layered stadium roar: "WOOOOOO!", "YAAAAAAY!", "LET'S GOOOOO!", "HEEEEEY!"
   */
  public playVictoryRoar() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Huge immediate cheer
    this.playCrowdCheer(true);

    // Staggered chants & whistles to mimic 15,000 screaming fans
    setTimeout(() => this.playStadiumFanWhistle(), 400);
    setTimeout(() => this.playStadiumFanWhistle(), 800);
    setTimeout(() => this.playCrowdChant(), 1200);
    setTimeout(() => this.playStadiumFanWhistle(), 2200);
    setTimeout(() => this.playCrowdCheer(true), 3000);
    setTimeout(() => this.playStadiumFanWhistle(), 4200);
  }

  private playWhiteNoise(duration: number, cutoff: number, volume: number) {
    this.playShapedNoise(duration, cutoff, volume, 'bandpass');
  }

  public startMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.step = 0;

    const bassline = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    const arpNotes = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
    const tickInterval = 135;

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const s = this.step % 8;
      const measure = Math.floor(this.step / 8) % 4;

      if (s % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        const root = bassline[s] * (measure === 2 ? 1.189 : 1);
        bassOsc.frequency.setValueAtTime(root, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, t);

        bassGain.gain.setValueAtTime(0.24, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.12);
      }

      if (s % 2 === 1) {
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = 'triangle';
        const note = arpNotes[(this.step * 3) % arpNotes.length];
        arpOsc.frequency.setValueAtTime(note, t);

        arpGain.gain.setValueAtTime(0.08, t);
        arpGain.gain.exponentialRampToValueAtTime(0.005, t + 0.1);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(t);
        arpOsc.stop(t + 0.1);
      }

      if (s === 0 || s === 4) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(120, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
        kickGain.gain.setValueAtTime(0.3, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.08);
      }

      this.step++;
    }, tickInterval);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundEngine();
