// Web Audio API Retro Sound Effects Engine

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playBeep(freq: number, type: OscillatorType, duration: number, vol = 0.15, delay = 0) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

export const soundEffects = {
  click: () => {
    playBeep(480, 'sine', 0.04, 0.08);
  },
  placeStone: () => {
    playBeep(260, 'triangle', 0.06, 0.2);
  },
  strike: () => {
    // Baseball strike: heavy sound
    playBeep(220, 'sawtooth', 0.1, 0.15);
    playBeep(440, 'sine', 0.12, 0.15, 0.05);
  },
  ball: () => {
    playBeep(520, 'sine', 0.08, 0.12);
  },
  out: () => {
    playBeep(180, 'sawtooth', 0.2, 0.15);
  },
  homerun: () => {
    [440, 554, 659, 880].forEach((freq, i) => {
      playBeep(freq, 'triangle', 0.2, 0.15, i * 0.08);
    });
  },
  jump: () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },
  coin: () => {
    playBeep(987.77, 'sine', 0.08, 0.15, 0);
    playBeep(1318.51, 'sine', 0.25, 0.15, 0.08);
  },
  stomp: () => {
    playBeep(140, 'triangle', 0.1, 0.2);
  },
  powerup: () => {
    [330, 392, 659, 523, 587, 784].forEach((f, idx) => {
      playBeep(f, 'square', 0.08, 0.1, idx * 0.06);
    });
  },
  chessMove: () => {
    playBeep(320, 'sine', 0.06, 0.15);
  },
  chessCapture: () => {
    playBeep(180, 'triangle', 0.05, 0.2);
    playBeep(360, 'sine', 0.09, 0.15, 0.04);
  },
  check: () => {
    playBeep(700, 'sawtooth', 0.12, 0.15);
    playBeep(880, 'sine', 0.15, 0.15, 0.08);
  },
  takeStones: () => {
    playBeep(400, 'triangle', 0.05, 0.12);
  },
  win: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5];
    notes.forEach((note, i) => {
      playBeep(note, 'sine', 0.22, 0.18, i * 0.12);
    });
  },
  lose: () => {
    const notes = [440, 415, 392, 349];
    notes.forEach((note, i) => {
      playBeep(note, 'sawtooth', 0.25, 0.15, i * 0.16);
    });
  }
};
