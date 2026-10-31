/* Resonant, motion-driven gel audio. The application owns unlock, context and lifecycle.
   Two reusable accent buffers; no looping texture or continuous motion bed. */
(function (root) {
  'use strict';
  const PROFILES = Object.freeze({
    jelly: Object.freeze({ cutoff: 780, detail: .19, pitch: 185, duration: .58, bend: .75, damping: 5.6 }),
    slime: Object.freeze({ cutoff: 390, detail: .22, pitch: 86, duration: .79, bend: .52, damping: 4.7 })
  });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function target(param, value, now, time) {
    if (param.setTargetAtTime) param.setTargetAtTime(value, now, time);
    else param.value = value;
  }
  function exact(param, value, now) {
    if (param.cancelScheduledValues) param.cancelScheduledValues(now);
    if (param.setValueAtTime) param.setValueAtTime(value, now);
    else param.value = value;
  }
  // Deterministic and portable: the same PCM generator is used for playback and
  // offline previews. No assets, timers, oscillators or per-gesture buffers.
  function synthesize(material, sampleRate) {
    const p = PROFILES[material];
    if (!p || !(sampleRate > 0)) throw new TypeError('Invalid gel synthesis profile');
    const data = new Float32Array(Math.ceil(sampleRate * p.duration));
    let phase = 0, texture = 0, seed = 17423;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate, u = i / (data.length - 1);
      const wet = material === 'slime';
      // Falling pitch with damped elastic overshoot makes a round duang, not a
      // repeated chirp. Slime has lower, slower, irregular bubbly resonances.
      const hz = p.pitch * (1 + p.bend * Math.exp(-t * 15)
        + (wet ? .14 : .24) * Math.exp(-t * 5) * Math.sin(t * (wet ? 25 : 40)));
      phase += 2 * Math.PI * hz / sampleRate;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      texture = texture * .92 + (seed / 4294967296 * 2 - 1) * .08;
      const attack = Math.min(1, t / .014); // no impulsive click
      const envelope = Math.sin(attack * Math.PI / 2) ** 2 * Math.exp(-p.damping * t)
        * Math.min(1, (1 - u) / .12) ** 2;
      data[i] = envelope * (.64 * Math.sin(phase) + (wet ? .17 : .21)
        * Math.sin(phase * (wet ? 1.49 : 2.02)) * Math.exp(-t * 5)
        + texture * (wet ? .7 : .12));
    }
    return data;
  }
  class GelAudio {
    constructor(context) {
      if (!context) throw new TypeError('GelAudio requires the application AudioContext');
      this.context = context;
      this.graph = null;
      this.voices = new Set();
      this.muted = false;
      this.disposed = false;
      this.intensity = 0;
      this.contactIntensity = 0;
      this.lastContact = -Infinity;
      this.nextDetail = 0;
      this.material = null;
      this.kind = 'drag';
      this.createdBuffers = 0;
      this.detailsStarted = 0;
      this.peakVoices = 0;
      this.reboundsStarted = 0;
      this.motionSource = null;
      this.motion = null;
      this.gesture = null;
      this.released = false;
    }
    _init() {
      if (this.graph) return;
      const c = this.context;
      const details = {};
      for (const material of ['jelly', 'slime']) {
        const samples = synthesize(material, c.sampleRate);
        const buffer = c.createBuffer(1, samples.length, c.sampleRate);
        buffer.getChannelData(0).set(samples);
        details[material] = buffer;
      }
      this.createdBuffers += 2;
      const master = c.createGain(); master.gain.value = 0;
      master.connect(c.destination);
      this.graph = { master, details };
    }
    // A pointer-down is one meaningful gesture. No input or solver reversal can
    // re-arm its accent; only a new gesture can, and the shared cooldown survives.
    beginGesture(kind, x = 0, y = 0) {
      if (this.disposed) return;
      this.releaseContact();
      this.released = false;
      this.gesture = { kind, x, y, lastX: x, lastY: y, lastTime: this.context.currentTime,
        intentTime: -Infinity, excursion: 0, speed: 0, segment: 0, fastTravel: 0, accented: false, source: null, samples: [] };
    }
    captureSource(source) {
      const g = this.gesture;
      if (!g || !source || !source.grab || g.source) return;
      g.source = source;
      g.samples = source.grab.items.map(it => {
        const n = source.nodes[it.i];
        return { i: it.i, x: n.x, y: n.y, z: n.z || 0 };
      });
      this.motionSource = source;
    }
    moveGesture(x, y) {
      const g = this.gesture;
      if (!g || !Number.isFinite(x) || !Number.isFinite(y)) return;
      const now = this.context.currentTime, elapsed = now - g.lastTime;
      g.segment = Math.hypot(x - g.lastX, y - g.lastY);
      // A stalled tab / stale input must not qualify as a quick stroke.
      g.speed = elapsed >= 0 && elapsed <= .18 ? g.segment / Math.max(.001, elapsed) : 0;
      g.fastTravel = g.speed >= 620 ? g.fastTravel + g.segment : g.speed < 320 ? 0 : g.fastTravel;
      g.excursion = Math.max(g.excursion, Math.hypot(x - g.x, y - g.y));
      if (g.segment >= 1.5) g.intentTime = now;
      g.lastX = x; g.lastY = y; g.lastTime = now;
    }
    _accent(intensity) {
      const g = this.gesture, now = this.context.currentTime;
      if (!g || g.accented || now < this.nextDetail || this.voices.size >= 2) return;
      g.accented = true;
      this._init();
      this._detail(now, Math.max(.2, intensity), PROFILES[this.material]);
      // Longer than the longest voice: even repeated new gestures cannot
      // overlap into a machine-gun sequence.
      this.nextDetail = now + .9;
    }
    contact(event, source = null) {
      if (this.disposed || this.muted || this.context.state !== 'running' || !event || !PROFILES[event.material]) return;
      const intensity = clamp(Number.isFinite(event.intensity) ? event.intensity : 0, 0, 1);
      if (intensity <= .015) return;
      const now = this.context.currentTime;
      if (this.material !== event.material) {
        // First material selection must not destroy the just-started gesture.
        if (this.material !== null) {
          const gesture = this.gesture;
          this.silence(true);
          this.gesture = gesture;
          this.motionSource = gesture?.source || null;
        }
        this.material = event.material;
      }
      const previous = this.contactIntensity * Math.exp(-Math.max(0, now - this.lastContact) / .045);
      this.contactIntensity = Math.max(intensity, previous);
      this.lastContact = now;
      this.kind = event.kind || 'drag';
      const g = this.gesture;
      if (!g) return; // Contact alone is silent; only a deliberate gesture may accent.
      if (this.kind === 'cut' && g.kind === 'knife' && g.fastTravel >= 12 && g.speed >= 620
          && now - g.intentTime <= .08) this._accent(clamp(g.speed / 1600, .3, 1));
    }
    // Read actual grabbed-node movement after a solver step, not pointer speed,
    // free-fall, release oscillation, or repeated edge callbacks.
    observeMotion(source) {
      if (this.disposed || this.muted || this.context.state !== 'running') return;
      const g = this.gesture, now = this.context.currentTime;
      if (!g || g.accented || g.source !== source || !source.grab
          || !['hand', 'hook'].includes(g.kind) || now - g.intentTime > .18
          || now - this.lastContact > .16 || !PROFILES[this.material]) return;
      const spacing = Math.max(1, source.spacing);
      if (g.excursion < Math.max(36, spacing * 2.2)) return;
      let distance = 0, count = 0;
      for (const initial of g.samples) {
        const n = source.nodes[initial.i];
        if (!n || !n.active || n.pin) continue;
        distance += Math.hypot(n.x - initial.x, n.y - initial.y, (n.z || 0) - initial.z); count++;
      }
      distance /= Math.max(1, count);
      if (!Number.isFinite(distance) || distance < Math.max(26, spacing * 1.6)) return;
      this.motion = { displacement: distance };
      this._accent(clamp(distance / (spacing * 5), .25, 1));
    }
    releaseContact() {
      this.released = true;
      this.gesture = null;
      this.motionSource = this.motion = null;
      this.intensity = this.contactIntensity = 0;
      this.lastContact = -Infinity;
    }
    update(dt) { // Audio time, not frame count, governs envelopes and contact expiry.
      if (this.disposed) return;
      if (this.muted || this.context.state !== 'running') { this.silence(true); return; }
      const now = this.context.currentTime, age = now - this.lastContact;
      const intensity = age >= 0 && age <= .16
        ? this.contactIntensity * Math.exp(-Math.max(0, age - .025) / .045) : 0;
      this.intensity = intensity >= .015 ? intensity : 0;
      // Contact intensity remains available for gesture diagnostics, but it no
      // longer drives sound. Only _accent creates the graph and a finite voice.
    }
    _detail(now, intensity, profile) {
      if (this.voices.size >= 2) return;
      const c = this.context, g = this.graph;
      const source = c.createBufferSource(); source.buffer = g.details[this.material];
      if (source.playbackRate) source.playbackRate.value = .82 + intensity * .4;
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = profile.cutoff; filter.Q.value = .6;
      const gain = c.createGain(); gain.gain.value = profile.detail * Math.sqrt(intensity);
      source.connect(filter); filter.connect(gain); gain.connect(g.master);
      const voice = { source, filter, gain };
      this.voices.add(voice);
      source.onended = () => this._releaseVoice(voice, false);
      target(g.master.gain, 1, now, .012);
      source.start(now);
      this.detailsStarted++;
      this.peakVoices = Math.max(this.peakVoices, this.voices.size);
    }
    _releaseVoice(voice, stop) {
      if (!this.voices.delete(voice)) return;
      voice.source.onended = null;
      if (stop && voice.source.stop) { try { voice.source.stop(); } catch (_) {} }
      voice.source.disconnect(); voice.filter.disconnect(); voice.gain.disconnect();
    }
    silence(immediate = false) {
      if (this.disposed) return;
      this.intensity = 0;
      this.contactIntensity = 0;
      this.lastContact = -Infinity;
      this.gesture = null;
      this.motionSource = this.motion = null;
      this.released = false;
      // Do not reset the detail rate gate: short repeated taps must not spam it.
      if (!this.graph) return;
      const now = this.context.currentTime;
      if (immediate) {
        exact(this.graph.master.gain, 0, now);
        for (const voice of Array.from(this.voices)) this._releaseVoice(voice, true);
      } else {
        target(this.graph.master.gain, 0, now, .025);
      }
    }
    stop() { this.silence(true); }
    setMuted(muted) { this.muted = !!muted; if (this.muted) this.stop(); }
    stats() {
      return { disposed: this.disposed, muted: this.muted, initialized: !!this.graph,
        material: this.material, targetIntensity: this.intensity, activeVoices: this.voices.size,
        maxVoices: 2, peakVoices: this.peakVoices, buffersAllocated: this.createdBuffers,
        detailsStarted: this.detailsStarted, reboundsStarted: this.reboundsStarted, released: this.released, armed: !!this.gesture && !this.gesture.accented, gestureAccented: !!this.gesture?.accented, persistentSources: 0,
        persistentNodes: this.graph ? 1 : 0 };
    }
    dispose() {
      if (this.disposed) return;
      this.stop();
      if (this.graph) {
        this.graph.master.disconnect();
        this.graph = null;
      }
      this.disposed = true;
    }
  }
  GelAudio.profiles = PROFILES;
  GelAudio.synthesize = synthesize;
  root.GelAudio = GelAudio;
  if (typeof module === 'object' && module.exports) module.exports = { GelAudio };
})(typeof globalThis !== 'undefined' ? globalThis : this);
