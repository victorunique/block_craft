type AC = AudioContext;
let ctx: AC | null = null;
let masterGain: GainNode | null = null;
let volume = 0.8;

function ensureCtx(): AC | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

export const audio = {
  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain && ctx) masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  },
  playTone(freq: number, durationMs: number, type: OscillatorType = 'square', volumeScale = 1) {
    const c = ensureCtx();
    if (!c || !masterGain) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.2 * volumeScale, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + durationMs / 1000);
  },
  playNoise(durationMs: number, volumeScale = 0.5) {
    const c = ensureCtx();
    if (!c || !masterGain) return;
    const bufferSize = Math.floor(c.sampleRate * (durationMs / 1000));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.value = 0.15 * volumeScale;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);
    src.connect(g);
    g.connect(masterGain);
    src.start();
  },
  playStep() { audio.playTone(180, 100, 'square', 0.3); },
  playBreak() { audio.playNoise(180, 0.7); audio.playTone(120, 120, 'sawtooth', 0.3); },
  playPlace() { audio.playTone(440, 80, 'sine', 0.5); },
  playPop() { audio.playTone(880, 80, 'triangle', 0.5); setTimeout(() => audio.playTone(1320, 80, 'triangle', 0.4), 60); },
  playHurt() { audio.playTone(180, 300, 'sawtooth', 0.7); },
  playMonster() { audio.playTone(80, 400, 'sawtooth', 0.4); },
};

if (typeof window !== 'undefined') {
  (window as any).__blockcraftAudio = audio;
}