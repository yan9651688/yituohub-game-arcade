/* A single, bounded burning ambience. The application owns the AudioContext,
   unlock gesture, mute and visibility policy. No timers or network assets. */
(function (root) {
  'use strict';
  const PROFILES = Object.freeze({
    cotton: { body: 1, cutoff: 1550, crackle: .65 },
    denim: { body: 1.06, cutoff: 1100, crackle: .4 },
    gauze: { body: .58, cutoff: 2050, crackle: .16 },
    stocking: { body: .5, cutoff: 1750, crackle: .1 },
    silk: { body: .62, cutoff: 1800, crackle: .12 },
    linen: { body: .93, cutoff: 1650, crackle: .85 },
    felt: { body: 1.05, cutoff: 850, crackle: .23 },
    fishing_net: { body: .54, cutoff: 1350, crackle: .28 },
    chain_mail: { body: 0, cutoff: 700, crackle: 0 },
    jelly: { body: 0, cutoff: 850, crackle: 0 },
    slime: { body: 0, cutoff: 750, crackle: 0 }
  });
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function smooth(param, value, time, seconds) {
    // Tiny test contexts can implement only AudioParam.value.
    if (param.setTargetAtTime) param.setTargetAtTime(value, time, seconds);
    else param.value = value;
  }
  function exact(param, value, time) {
    if (param.cancelScheduledValues) param.cancelScheduledValues(time);
    if (param.setValueAtTime) param.setValueAtTime(value, time);
    else param.value = value;
  }
  class ClothBurnAudio {
    constructor(context) {
      if (!context) throw new TypeError('ClothBurnAudio requires the application AudioContext');
      this.context = context;
      this.disposed = false;
      this.intensity = 0;
      this.graph = null;
      this.voices = new Set();
      this.nextCrackle = Infinity;
      this.createdBuffers = 0;
      this.cracklesStarted = 0;
      this.peakVoices = 0;
      this.lastTime = -Infinity;
      this.nextSwell = 0; this.swell = 1;
    }
    _init() {
      if (this.graph) return;
      const c = this.context;
      // Long, stationary broadband turbulence with continuously randomized gain
      // and filter drift. No pitched oscillators, explosion impulses or samples.
      // Reference: NPS Yellowstone Sound Library, Fire (sustained swell + crackle).
      const bed = c.createBuffer(1, Math.ceil(c.sampleRate * 13.7), c.sampleRate);
      const data = bed.getChannelData(0);
      let brown = 0, mid = 0;
      for (let i = 0; i < data.length; i++) {
        brown = (brown + (Math.random() * 2 - 1) * .045) / 1.045;
        mid = mid * .76 + (Math.random() * 2 - 1) * .24;
        data[i] = brown * 1.7 + mid * .24 + (Math.random() * 2 - 1) * .025;
      }
      // Blend the loop boundary to avoid even a quiet periodic click.
      const blend = Math.min(Math.floor(c.sampleRate * .08), data.length >> 2);
      for (let i = 0; i < blend; i++) {
        const t = i / Math.max(1, blend - 1);
        data[data.length - blend + i] = data[data.length - blend + i] * (1 - t) + data[0] * t;
      }
      const detail = c.createBuffer(1, Math.ceil(c.sampleRate * .32), c.sampleRate);
      const d = detail.getChannelData(0);
      let texture = 0;
      for (let i = 0; i < d.length; i++) {
        texture = texture * .7 + (Math.random() * 2 - 1) * .3;
        const t = i / Math.max(1, d.length - 1);
        // A rounded rustle, NOT a click/transient. The buffer itself is enveloped
        // so a voice remains click-free even without AudioParam automation.
        const envelope = Math.pow(Math.sin(Math.PI * t), 2) * Math.exp(-t * 2);
        d[i] = texture * envelope;
      }
      this.createdBuffers += 2;
      const source = c.createBufferSource(); source.buffer = bed; source.loop = true;
      const high = c.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 85; high.Q.value = .5;
      const low = c.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 1550; low.Q.value = .5;
      const gain = c.createGain(); gain.gain.value = 0;
      const master = c.createGain(); master.gain.value = 1;
      const pan = c.createStereoPanner ? c.createStereoPanner() : null;
      source.connect(high); high.connect(low); low.connect(gain); gain.connect(master); if (pan) { master.connect(pan); pan.connect(c.destination); } else master.connect(c.destination);
      source.start(0, Math.random() * 10);
      this.graph = { source, high, low, gain, master, detail, pan };
    }
    update(intensity, material, dt, position = 0) { // dt intentionally unnecessary: use the audio clock.
      if (this.disposed) return;
      intensity = clamp(finite(intensity, 0), 0, 1);
      if (this.context.state !== 'running') { this.silence(true); return; }
      const now = this.context.currentTime;
      if (!intensity) { if (this.intensity) this.silence(); return; }
      const wasSilent = this.intensity === 0;
      const base = typeof material === 'string' ? PROFILES[material] : material;
      const p = base || PROFILES.cotton;
      const body = clamp(finite(p.body, 1), 0, 1.3);
      if (!body) { this.silence(); return; }
      this._init();
      const cutoff = clamp(finite(p.cutoff, 1550), 500, 2600);
      const crackle = clamp(finite(p.crackle, .65), 0, 1);
      this.intensity = intensity;
      const g = this.graph;
      smooth(g.master.gain, 1, now, .08);
      // Conservatively quiet, with a continuous bed doing almost all the work.
      if (now >= this.nextSwell || now < this.lastTime) {
        this.swell = .76 + Math.random() * .44;
        this.air = .84 + Math.random() * .28;
        this.nextSwell = now + .19 + Math.random() * .74;
      }
      smooth(g.gain.gain, .21 * body * Math.pow(intensity, .65) * this.swell, now, .22);
      smooth(g.low.frequency, cutoff * (this.air || 1), now, .38);
      if (g.pan) smooth(g.pan.pan, clamp(finite(position, 0), -1, 1) * .65, now, .25);
      if (wasSilent || now < this.lastTime) this.nextCrackle = now + .8 + Math.random() * 1.3;
      this.lastTime = now;
      if (now >= this.nextCrackle) {
        // No accumulated backlog following a tab stall, and at most two voices.
        this.nextCrackle = now + .8 + Math.random() * 3.2;
        if (crackle > 0 && intensity > .035 && this.voices.size < 2) this._crackle(now, intensity, crackle, cutoff);
      }
    }
    _crackle(now, intensity, amount, cutoff) {
      const c = this.context, g = this.graph;
      const source = c.createBufferSource(); source.buffer = g.detail;
      if (source.playbackRate) source.playbackRate.value = .68 + Math.random() * .9;
      const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff * (.7 + Math.random() * .45); filter.Q.value = .5;
      const gain = c.createGain(); gain.gain.value = .028 * intensity * amount * (.6 + Math.random() * .7);
      source.connect(filter); filter.connect(gain); gain.connect(g.master);
      const voice = { source, filter, gain };
      this.voices.add(voice);
      source.onended = () => this._releaseVoice(voice, false);
      source.start(now);
      this.cracklesStarted++;
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
      this.nextCrackle = Infinity;
      if (!this.graph) return;
      const now = this.context.currentTime;
      if (immediate) {
        exact(this.graph.master.gain, 0, now);
        exact(this.graph.gain.gain, 0, now);
        for (const voice of Array.from(this.voices)) this._releaseVoice(voice, true);
      } else {
        // Reset/extinguish: 95% reduction in ~180 ms, including remaining detail.
        smooth(this.graph.master.gain, 0, now, .06);
        smooth(this.graph.gain.gain, 0, now, .06);
      }
    }
    stats() {
      return { disposed: this.disposed, initialized: !!this.graph, targetIntensity: this.intensity,
        activeCrackleVoices: this.voices.size, maxCrackleVoices: 2, peakCrackleVoices: this.peakVoices,
        buffersAllocated: this.createdBuffers, cracklesStarted: this.cracklesStarted,
        persistentSources: this.graph ? 1 : 0, persistentNodes: this.graph ? (this.graph.pan ? 6 : 5) : 0,
        spatialPan: this.graph?.pan ? this.graph.pan.pan.value : 0, swell: this.swell };
    }
    dispose() {
      if (this.disposed) return;
      this.silence(true);
      if (this.graph) {
        const g = this.graph;
        if (g.source.stop) { try { g.source.stop(); } catch (_) {} }
        for (const key of ['source', 'high', 'low', 'gain', 'master', 'pan']) if (g[key]) g[key].disconnect();
        this.graph = null;
      }
      this.disposed = true;
    }
  }
  ClothBurnAudio.profiles = PROFILES;
  root.ClothBurnAudio = ClothBurnAudio;
  if (typeof module === 'object' && module.exports) module.exports = { ClothBurnAudio };
})(typeof globalThis !== 'undefined' ? globalThis : this);
