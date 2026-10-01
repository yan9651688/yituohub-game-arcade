/* Original procedural score and effects. Audio starts only after unlock(). */
const THEMES = [
    { root: 38, bpm: 98, cutoff: 510, color: 'triangle', air: 0.28 },
    { root: 33, bpm: 94, cutoff: 370, color: 'sawtooth', air: 0.16 },
    { root: 41, bpm: 100, cutoff: 640, color: 'triangle', air: 0.38 },
    { root: 35, bpm: 96, cutoff: 420, color: 'square', air: 0.20 },
    { root: 36, bpm: 88, cutoff: 550, color: 'sine', air: 0.43 },
    { root: 31, bpm: 104, cutoff: 320, color: 'sawtooth', air: 0.13 },
    { root: 40, bpm: 102, cutoff: 620, color: 'triangle', air: 0.27 },
    { root: 30, bpm: 92, cutoff: 285, color: 'sawtooth', air: 0.20 },
];
const THEME_NAMES = ['jungle', 'base', 'waterfall', 'base2', 'snow', 'energy', 'hangar', 'alien'];
const LIMITS = { shoot: .055, spread: .11, laser: .09, flame: .12, jump: .12,
    land: .12, hit: .09, explode: .075, pickup: .14, death: .4, boss: .8,
    clear: .8, ui: .065 };
const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export class GameAudio {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.effects = null;
        this.music = null;
        this.compressor = null;
        this.noise = null;
        this.muted = false;
        this.paused = false;
        this.disposed = false;
        this.theme = 0;
        this.step = 0;
        this.nextStep = 0;
        this.intensity = 0;
        this.voices = new Set();
        this.lastSounds = new Map();
    }

    async unlock() {
        if (this.disposed) return false;
        try {
            if (!this.ctx) {
                const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
                if (!Context) return false;
                this.ctx = new Context({ latencyHint: 'interactive' });
                this.master = this.ctx.createGain();
                this.effects = this.ctx.createGain();
                this.music = this.ctx.createGain();
                this.compressor = this.ctx.createDynamicsCompressor();
                this.compressor.threshold.value = -16;
                this.compressor.knee.value = 18;
                this.compressor.ratio.value = 4;
                this.compressor.attack.value = .005;
                this.compressor.release.value = .16;
                this.master.gain.value = this.muted ? 0 : .5;
                this.effects.gain.value = .38;
                this.music.gain.value = this.paused ? 0 : .09;
                this.effects.connect(this.master);
                this.music.connect(this.master);
                this.master.connect(this.compressor);
                this.compressor.connect(this.ctx.destination);
                this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
                const samples = this.noise.getChannelData(0);
                // A deterministic noise buffer avoids repeated allocations while firing.
                let seed = 0x2b61;
                for (let i = 0; i < samples.length; i++) {
                    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
                    samples[i] = (seed >>> 0) / 2147483648 - 1;
                }
            }
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            this.nextStep = this.ctx.currentTime + .06;
            return this.ctx.state === 'running';
        } catch (_) {
            // Browsers without audio permission still have a fully playable game.
            return false;
        }
    }

    setMuted(value) {
        this.muted = Boolean(value);
        this.ramp(this.master, this.muted ? 0 : .5, .025);
        if (this.ctx) this.nextStep = this.ctx.currentTime + .06;
    }

    setPaused(value) {
        const paused = Boolean(value);
        if (paused === this.paused) return;
        this.paused = paused;
        this.ramp(this.music, paused ? 0 : .09, .045);
        if (paused) this.stopVoices('music');
        if (this.ctx) this.nextStep = this.ctx.currentTime + .06;
    }

    setTheme(value) {
        if (value && typeof value === 'object') value = value.theme ?? value.id ?? value.index ?? 0;
        let index = Number.isFinite(value) ? Math.floor(value) : THEME_NAMES.indexOf(String(value).toLowerCase());
        if (index < 0) {
            const name = String(value).toLowerCase();
            if (/ice|frost|snow/.test(name)) index = 4;
            else if (/lava|factory|energy/.test(name)) index = 5;
            else if (/water|fall/.test(name)) index = 2;
            else if (/core|alien/.test(name)) index = 7;
            else if (/hangar|fort/.test(name)) index = 6;
            else index = 0;
        }
        index = clamp(index, 0, THEMES.length - 1);
        if (index === this.theme) return;
        this.theme = index;
        this.step = 0;
        this.stopVoices('music');
        if (this.ctx) this.nextStep = this.ctx.currentTime + .06;
    }

    ramp(node, target, duration) {
        if (!node || !this.ctx) return;
        const now = this.ctx.currentTime;
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(target, now + duration);
    }

    ready() {
        return !this.disposed && !this.muted && this.ctx && this.ctx.state === 'running';
    }

    makeVoice(source, gain, filter, bus) {
        const voice = { source, nodes: [source, gain, ...(filter ? [filter] : [])], bus };
        this.voices.add(voice);
        source.onended = () => {
            for (const node of voice.nodes) {
                try { node.disconnect(); } catch (_) { /* Already detached. */ }
            }
            this.voices.delete(voice);
        };
        return voice;
    }

    tone(startHz, duration, type = 'sine', volume = .1, endHz = 0, delay = 0,
        bus = 'effects', cutoff = 0, attack = .006) {
        if (!this.ready() || this.voices.size >= 80) return;
        const ctx = this.ctx;
        const at = ctx.currentTime + Math.max(0, delay);
        const length = Math.max(.018, duration);
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(Math.max(20, startHz), at);
        if (endHz) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), at + length);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), at + Math.min(attack, length * .2));
        gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        let filter = null;
        if (cutoff) {
            filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = cutoff;
            filter.Q.value = .65;
            oscillator.connect(filter);
            filter.connect(gain);
        } else oscillator.connect(gain);
        gain.connect(bus === 'music' ? this.music : this.effects);
        this.makeVoice(oscillator, gain, filter, bus);
        oscillator.start(at);
        oscillator.stop(at + length + .025);
    }

    noiseBurst(duration, volume, cutoff, highpass = false, delay = 0, bus = 'effects') {
        if (!this.ready() || !this.noise || this.voices.size >= 80) return;
        const ctx = this.ctx;
        const at = ctx.currentTime + Math.max(0, delay);
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        source.buffer = this.noise;
        filter.type = highpass ? 'highpass' : 'lowpass';
        filter.frequency.setValueAtTime(cutoff, at);
        filter.Q.value = .55;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), at + .004);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(bus === 'music' ? this.music : this.effects);
        this.makeVoice(source, gain, filter, bus);
        source.start(at, (this.step * .071) % .4);
        source.stop(at + duration + .02);
    }

    play(name, amount = 1) {
        if (!this.ready()) return;
        if (this.paused && name !== 'ui' && name !== 'clear' && name !== 'death') return;
        const now = this.ctx.currentTime;
        if (now - (this.lastSounds.get(name) ?? -100) < (LIMITS[name] ?? .07)) return;
        this.lastSounds.set(name, now);
        const strength = Number.isFinite(amount) ? clamp(amount, .35, 2) : 1;
        switch (name) {
        case 'shoot':
            this.tone(620, .065, 'triangle', .13, 160);
            this.noiseBurst(.045, .08, 2200);
            break;
        case 'spread':
            this.tone(280, .12, 'sawtooth', .12, 75, 0, 'effects', 1900);
            this.noiseBurst(.1, .19, 2300);
            break;
        case 'laser':
            this.tone(1220, .15, 'sine', .11, 230);
            this.tone(610, .1, 'triangle', .07, 130);
            break;
        case 'flame':
            this.noiseBurst(.20, .17, 1100);
            this.tone(70, .17, 'triangle', .055, 45);
            break;
        case 'jump':
            this.tone(150, .13, 'triangle', .09, 330);
            break;
        case 'land':
            this.noiseBurst(.10, .07, 420);
            this.tone(82, .085, 'sine', .075, 45);
            break;
        case 'hit':
            this.noiseBurst(.09, .12, 3100);
            this.tone(230, .075, 'square', .06, 90, 0, 'effects', 1400);
            break;
        case 'explode':
            this.noiseBurst(.25 + strength * .12, .20 * strength, 950);
            this.tone(110, .30, 'sine', .19 * strength, 28);
            this.noiseBurst(.13, .075, 3200, false, .02);
            break;
        case 'pickup':
            [523.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, .18, 'sine', .10, 0, i * .075));
            break;
        case 'death':
            this.noiseBurst(.45, .24, 850);
            this.tone(190, .65, 'sawtooth', .14, 30, 0, 'effects', 800);
            this.tone(95, .75, 'sine', .17, 22);
            break;
        case 'boss':
            [0, .24, .48].forEach((delay, i) => {
                this.tone(110 + i * 10, .22, 'sawtooth', .10, 70, delay, 'effects', 550);
                this.tone(55, .3, 'sine', .17, 42, delay);
            });
            break;
        case 'clear':
            [0, 7, 12, 16].forEach((note, i) => this.tone(frequency(60 + note), .42,
                'triangle', .12, 0, i * .13, 'effects', 2300));
            this.tone(frequency(48), .8, 'sine', .09, 0, .05);
            break;
        case 'ui':
            this.tone(660, .045, 'sine', .07, 880);
            break;
        default:
            break;
        }
    }

    update(dt, state) {
        if (!this.ready() || this.paused) return;
        const now = this.ctx.currentTime;
        if (this.nextStep < now - .2 || this.nextStep > now + 1) this.nextStep = now + .025;
        const target = state && (state.boss || state.bossActive) ? 1 : 0;
        this.intensity += (target - this.intensity) * Math.min(1, Math.max(0, Number(dt) || 0) * 2);
        const theme = THEMES[this.theme];
        const stepLength = 60 / theme.bpm / 4;
        // Short lookahead keeps the score steady without background timers.
        for (let scheduled = 0; this.nextStep < now + .13 && scheduled < 4; scheduled++) {
            this.scheduleStep(this.step++, Math.max(0, this.nextStep - now), stepLength, theme);
            this.nextStep += stepLength;
        }
    }

    scheduleStep(step, delay, length, theme) {
        const beat = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const root = theme.root + [0, 0, -2, 3][bar];
        // An original sparse pulse, using intervals rather than a borrowed melody.
        const bassSteps = [0, 3, 6, 8, 11, 14];
        if (bassSteps.includes(beat)) {
            const fifth = beat === 6 || beat === 14;
            this.tone(frequency(root + (fifth ? 7 : 0)), length * 1.35,
                theme.color, .26, 0, delay, 'music', theme.cutoff);
        }
        if (beat === 0 || beat === 8 || (this.intensity > .6 && beat === 11)) {
            this.tone(118, .17, 'sine', .58, 38, delay, 'music');
            this.noiseBurst(.022, .09, 700, false, delay, 'music');
        }
        if (beat === 4 || beat === 12) {
            this.noiseBurst(.13, .20, 1550, true, delay, 'music');
            this.tone(165, .07, 'triangle', .15, 85, delay, 'music');
        }
        if (beat % 2 === 0) this.noiseBurst(.034, .045, 6200, true, delay, 'music');
        if (beat === 2 || beat === 10) {
            const note = root + 24 + (beat === 10 ? 7 : 2);
            this.tone(frequency(note), length * 2, 'sine', .075 + theme.air * .06,
                0, delay, 'music', 1500, .022);
        }
        if (beat === 0 && bar % 2 === 0) {
            for (const semitone of [12, 19]) this.tone(frequency(root + semitone), length * 7,
                'triangle', .055, 0, delay, 'music', 670, .12);
        }
    }

    stopVoices(bus) {
        for (const voice of [...this.voices]) {
            if (bus && voice.bus !== bus) continue;
            try { voice.source.stop(); } catch (_) { /* Voice may have ended. */ }
            for (const node of voice.nodes) {
                try { node.disconnect(); } catch (_) { /* Already detached. */ }
            }
            voice.source.onended = null;
            this.voices.delete(voice);
        }
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.stopVoices();
        for (const node of [this.effects, this.music, this.master, this.compressor]) {
            try { if (node) node.disconnect(); } catch (_) { /* Already detached. */ }
        }
        if (this.ctx && this.ctx.state !== 'closed') {
            try { const result = this.ctx.close(); if (result?.catch) result.catch(() => {}); } catch (_) { /* No audio device. */ }
        }
        this.lastSounds.clear();
        this.noise = null;
        this.ctx = null;
        this.effects = this.music = this.master = this.compressor = null;
    }
}
