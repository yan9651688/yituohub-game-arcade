export class AudioBus {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
    this.last = 0;
  }
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) this.ctx = new C();
    }
    this.ctx?.resume().catch(() => {});
  }
  play(kind = "click") {
    if (this.muted || !this.ctx || this.ctx.state !== "running") return;
    const now = this.ctx.currentTime;
    if (kind === "shot" && now - this.last < 0.11) return;
    if (kind === "shot") this.last = now;
    const oscillator = this.ctx.createOscillator(),
      gain = this.ctx.createGain();
    const tones = {
      click: [670, 410, 0.05, 0.025],
      select: [810, 530, 0.055, 0.018],
      command: [430, 590, 0.09, 0.025],
      complete: [580, 1000, 0.24, 0.04],
      error: [180, 100, 0.16, 0.04],
      alarm: [640, 320, 0.35, 0.035],
      shot: [130, 40, 0.08, 0.025],
      explosion: [90, 25, 0.27, 0.05],
    };
    const [start, end, duration, volume] = tones[kind] || tones.click;
    oscillator.type =
      kind === "shot" || kind === "explosion" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  setMuted(value) {
    this.muted = value;
  }
  dispose() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
