// Web Audio API NES 8-bit Mario Chiptune BGM & Sound Synthesizer
import { getAudioContext, isSoundEnabled } from './audio';

// Note frequencies (Hz)
const N = {
  REST: 0,
  // Octave 3 (Bass)
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  FS3: 185.00,
  G3: 196.00,
  GS3: 207.65,
  A3: 220.00,
  AS3: 233.08,
  B3: 246.94,
  // Octave 4
  C4: 261.63,
  CS4: 277.18,
  D4: 293.66,
  DS4: 311.13,
  E4: 329.63,
  F4: 349.23,
  FS4: 369.99,
  G4: 392.00,
  GS4: 415.30,
  A4: 440.00,
  AS4: 466.16,
  B4: 493.88,
  // Octave 5
  C5: 523.25,
  CS5: 554.37,
  D5: 587.33,
  DS5: 622.25,
  E5: 659.25,
  F5: 698.46,
  FS5: 739.99,
  G5: 783.99,
  GS5: 830.61,
  A5: 880.00,
  AS5: 932.33,
  B5: 987.77,
  // Octave 6
  C6: 1046.50,
  D6: 1174.66,
  E6: 1318.51,
};

// 16th note unit duration in seconds at ~105 BPM
const TICK = 0.145;

// [melodyNote, bassNote, ticks]
type ScoreStep = [number, number, number];

// Super Mario Bros Overworld Main Theme Sequence
const MARIO_THEME: ScoreStep[] = [
  // --- INTRO ---
  [N.E5, N.D3, 1],
  [N.E5, N.D3, 1],
  [N.REST, N.REST, 1],
  [N.E5, N.D3, 1],
  [N.REST, N.REST, 1],
  [N.C5, N.D3, 1],
  [N.E5, N.D3, 1],
  [N.REST, N.REST, 1],
  [N.G5, N.G3, 2],
  [N.REST, N.REST, 2],
  [N.G4, N.G3, 2],
  [N.REST, N.REST, 2],

  // --- SECTION A (Part 1) ---
  [N.C5, N.G3, 2],
  [N.REST, N.REST, 1],
  [N.G4, N.E3, 2],
  [N.REST, N.REST, 1],
  [N.E4, N.C3, 2],
  [N.REST, N.REST, 1],
  [N.A4, N.F3, 2],
  [N.B4, N.G3, 1],
  [N.REST, N.REST, 1],
  [N.AS4, N.FS3, 1],
  [N.A4, N.F3, 2],
  
  [N.G4, N.E3, 1.33],
  [N.E5, N.C4, 1.33],
  [N.G5, N.E4, 1.34],
  [N.A5, N.F4, 2],
  [N.F5, N.D4, 1],
  [N.G5, N.E4, 1],
  [N.REST, N.REST, 1],
  [N.E5, N.C4, 2],
  [N.C5, N.A3, 1],
  [N.D5, N.B3, 1],
  [N.B4, N.G3, 2],
  [N.REST, N.REST, 2],

  // --- SECTION A (Repeat variation) ---
  [N.C5, N.G3, 2],
  [N.REST, N.REST, 1],
  [N.G4, N.E3, 2],
  [N.REST, N.REST, 1],
  [N.E4, N.C3, 2],
  [N.REST, N.REST, 1],
  [N.A4, N.F3, 2],
  [N.B4, N.G3, 1],
  [N.REST, N.REST, 1],
  [N.AS4, N.FS3, 1],
  [N.A4, N.F3, 2],

  [N.G4, N.E3, 1.33],
  [N.E5, N.C4, 1.33],
  [N.G5, N.E4, 1.34],
  [N.A5, N.F4, 2],
  [N.F5, N.D4, 1],
  [N.G5, N.E4, 1],
  [N.REST, N.REST, 1],
  [N.E5, N.C4, 2],
  [N.C5, N.A3, 1],
  [N.D5, N.B3, 1],
  [N.B4, N.G3, 2],
  [N.REST, N.REST, 2],

  // --- SECTION B (Bridge) ---
  [N.REST, N.C3, 1],
  [N.G5, N.E4, 1],
  [N.FS5, N.DS4, 1],
  [N.F5, N.D4, 1],
  [N.DS5, N.C4, 2],
  [N.E5, N.G3, 2],
  [N.REST, N.REST, 1],
  [N.GS4, N.C3, 1],
  [N.A4, N.C4, 1],
  [N.C5, N.E4, 1],
  [N.REST, N.REST, 1],
  [N.A4, N.F3, 1],
  [N.C5, N.A3, 1],
  [N.D5, N.C4, 1],
  [N.REST, N.REST, 2],

  [N.REST, N.C3, 1],
  [N.G5, N.E4, 1],
  [N.FS5, N.DS4, 1],
  [N.F5, N.D4, 1],
  [N.DS5, N.C4, 2],
  [N.E5, N.G3, 2],
  [N.REST, N.REST, 1],
  [N.C6, N.GS3, 1],
  [N.REST, N.REST, 1],
  [N.C6, N.GS3, 1],
  [N.C6, N.GS3, 2],
  [N.REST, N.REST, 3],
];

class MarioBGMPlayer {
  private isPlaying = false;
  private isPaused = false;
  private stepIndex = 0;
  private timer: number | null = null;
  private masterGain: GainNode | null = null;
  private currentVolume = 0.22;
  private isMuted = false;

  public init() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
  }

  public start() {
    if (this.isPlaying && !this.isPaused) return;
    if (!isSoundEnabled() || this.isMuted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.init();
    this.isPlaying = true;
    this.isPaused = false;
    this.scheduleNextStep();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.stepIndex = 0;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPaused = true;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public resume() {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.scheduleNextStep();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.pause();
    } else {
      if (this.isPlaying) {
        this.resume();
      } else {
        this.start();
      }
    }
    return !this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.pause();
    } else {
      if (this.isPlaying) {
        this.resume();
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isPaused && !this.isMuted;
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    const ctx = getAudioContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  private scheduleNextStep() {
    if (!this.isPlaying || this.isPaused || this.isMuted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const step = MARIO_THEME[this.stepIndex];
    const [melodyFreq, bassFreq, ticks] = step;
    const duration = ticks * TICK;

    const now = ctx.currentTime;

    // Play melody (NES Square wave)
    if (melodyFreq > 0 && this.masterGain) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(melodyFreq, now);

      // Chiptune pulse envelope
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.setValueAtTime(0.28, now + duration * 0.85);
      gain.gain.linearRampToValueAtTime(0.001, now + duration * 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration * 0.96);
    }

    // Play bass (NES Triangle wave)
    if (bassFreq > 0 && this.masterGain) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.setValueAtTime(0.35, now + duration * 0.9);
      gain.gain.linearRampToValueAtTime(0.001, now + duration * 0.98);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration * 0.98);
    }

    // Advance step index & loop seamlessly
    this.stepIndex = (this.stepIndex + 1) % MARIO_THEME.length;

    // Schedule next note
    this.timer = window.setTimeout(() => {
      this.scheduleNextStep();
    }, duration * 1000);
  }

  // Classic Mario Death Jingle
  public playDeath() {
    this.pause();
    const ctx = getAudioContext();
    if (!ctx || !isSoundEnabled()) return;

    const notes = [
      { freq: 493.88, dur: 0.12 }, // B4
      { freq: 698.46, dur: 0.12 }, // F5
      { freq: 0, dur: 0.05 },
      { freq: 698.46, dur: 0.12 },
      { freq: 698.46, dur: 0.12 },
      { freq: 659.25, dur: 0.12 }, // E5
      { freq: 587.33, dur: 0.12 }, // D5
      { freq: 523.25, dur: 0.28 }, // C5
    ];

    let t = ctx.currentTime;
    notes.forEach((n) => {
      if (n.freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + n.dur);
      }
      t += n.dur;
    });
  }

  // Stage Clear Flagpole Fanfare
  public playStageClear() {
    this.pause();
    const ctx = getAudioContext();
    if (!ctx || !isSoundEnabled()) return;

    const notes = [
      392, 523.25, 659.25, 783.99, 1046.5,
    ];
    notes.forEach((f, idx) => {
      const startTime = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }
}

export const marioBGM = new MarioBGMPlayer();
