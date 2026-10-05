import type { SurfaceKind, TimeOfDay } from "./types.ts";

export type TrackId = "tambayan" | "paper-lanterns" | "araw" | "takipsilim" | "gabi" | "hanap" | "tapos";

export const MUSIC_TRACKS = [
  {
    id: "tambayan" as const,
    name: "Lazy Afternoon Tambayan",
    file: "/audio/lazy-afternoon-tambayan.mp3",
  },
  {
    id: "paper-lanterns" as const,
    name: "Paper Lanterns",
    file: "/audio/paper-lanterns.mp3",
  },
];

export const SONG = MUSIC_TRACKS[0];

export const TRACKS: { id: TrackId; name: string; tod?: TimeOfDay | "result"; file: string; kind: "music" | "ambience" }[] = [
  { id: "tambayan", name: SONG.name, file: SONG.file, kind: "music" },
  { id: "paper-lanterns", name: "Paper Lanterns", file: MUSIC_TRACKS[1].file, kind: "music" },
  { id: "araw", name: "Araw sa Bakuran", tod: "day", file: "/audio/ambience-day.mp3", kind: "ambience" },
  { id: "takipsilim", name: "Takipsilim", tod: "sunset", file: "/audio/ambience-sunset.mp3", kind: "ambience" },
  { id: "gabi", name: "Gabi-gabi", tod: "night", file: "/audio/ambience-night.mp3", kind: "ambience" },
  { id: "hanap", name: "Hanap-Buhay", tod: "day", file: "/audio/ambience-search.mp3", kind: "ambience" },
  { id: "tapos", name: "Tapos Na", tod: "result", file: "/audio/ambience-rest.mp3", kind: "ambience" },
];

const FOOT_FILES = ["/audio/foot-1.mp3", "/audio/foot-2.mp3", "/audio/foot-3.mp3", "/audio/foot-4.mp3"];
const PICKUP_FILES = ["/audio/pickup.mp3", "/audio/pickup-b.mp3", "/audio/pickup-c.mp3"];

const AMB_GAIN = 0.12;
const PICKUP_GAIN = 0.38;
/** Recorded song is quieter than oscillators — keep it clearly audible. */
const MUSIC_LEVEL = 0.78;

function curve(v: number) {
  return Math.max(0, Math.min(1, v)) ** 2;
}

function ramp(param: AudioParam, value: number, at: number, timeConst = 0.06) {
  param.setTargetAtTime(Math.max(0.0001, value), at, timeConst);
}

const SURFACE: Record<SurfaceKind, { gain: number; rate: number; filter: BiquadFilterType; freq: number; q: number }> = {
  grass: { gain: 0.38, rate: 0.86, filter: "lowpass", freq: 1400, q: 0.7 },
  dirt: { gain: 0.52, rate: 1.0, filter: "lowpass", freq: 2800, q: 0.5 },
  stone: { gain: 0.64, rate: 1.12, filter: "highpass", freq: 220, q: 0.6 },
  wood: { gain: 0.48, rate: 0.94, filter: "peaking", freq: 520, q: 1.1 },
  water: { gain: 0.3, rate: 0.72, filter: "lowpass", freq: 900, q: 0.8 },
};

export type VolumeState = {
  master: number;
  music: number;
  sfx: number;
  ambience: number;
};

export type MusicSnap = {
  name: string;
  musicOn: boolean;
  playing: boolean;
  volume: number;
};

let shared: HavenAudio | null = null;

export function getSharedAudio(): HavenAudio {
  if (!shared) shared = new HavenAudio();
  return shared;
}

export class HavenAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicBus: GainNode | null = null;
  musicFade: GainNode | null = null;
  ambBus: GainNode | null = null;
  ambFilter: BiquadFilterNode | null = null;
  sfxBus: GainNode | null = null;
  uiBus: GainNode | null = null;
  started = false;
  gameplay = false;
  stepDist = 0;
  wasMoving = false;
  musicOn = true;
  trackIndex = 0;
  musicTimer: number | null = null;
  vols: VolumeState = { master: 0.85, music: 0.55, sfx: 0.7, ambience: 0.22 };
  paused = false;
  buffers = new Map<string, AudioBuffer>();
  musicSource: AudioBufferSourceNode | null = null;
  musicUrl: string | null = null;
  musicEl: HTMLAudioElement | null = null;
  ambSource: AudioBufferSourceNode | null = null;
  ambUrl: string | null = null;
  loading: Promise<void> | null = null;
  pickupCount = 0;
  footCount = 0;
  lastPickupAt = 0;
  lastFootAt = 0;
  lastPickupId: string | null = null;
  footIndex = 0;
  pickupIndex = 0;
  indoor = false;
  timeOfDay: TimeOfDay = "day";
  pickupVoices: GainNode[] = [];
  nightNodes: AudioNode[] = [];
  nightOn = false;
  private listeners = new Set<() => void>();
  private visBound = false;

  get track() {
    return MUSIC_TRACKS[this.trackIndex % MUSIC_TRACKS.length] ?? MUSIC_TRACKS[0];
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  musicSnap(): MusicSnap {
    return {
      name: this.track.name,
      musicOn: this.musicOn,
      playing: !!this.musicEl && !this.musicEl.paused && this.musicOn,
      volume: this.vols.music,
    };
  }

  state() {
    return {
      started: this.started,
      gameplay: this.gameplay,
      ctx: this.ctx?.state ?? "none",
      paused: this.paused,
      musicOn: this.musicOn,
      track: this.track.id,
      buffers: this.buffers.size,
      pickupCount: this.pickupCount,
      footCount: this.footCount,
      lastPickupAt: this.lastPickupAt,
      lastFootAt: this.lastFootAt,
      lastPickupId: this.lastPickupId,
      duck: this.musicEl ? this.musicEl.volume : 0,
      ambPlaying: !!this.ambSource,
      musicPlaying: this.musicSnap().playing,
    };
  }

  unlock() {
    this.ensureMusicEl();
    if (this.started && this.ctx) {
      void this.ctx.resume();
      this.bindVisibility();
      this.startMusic();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC({ latencyHint: "interactive" });
    this.master = this.ctx.createGain();
    this.master.gain.value = curve(this.vols.master);
    this.master.connect(this.ctx.destination);

    this.musicFade = this.ctx.createGain();
    this.musicFade.gain.value = 1;

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 1;
    this.musicBus.connect(this.musicFade);
    this.musicFade.connect(this.master);

    this.ambFilter = this.ctx.createBiquadFilter();
    this.ambFilter.type = "lowpass";
    this.ambFilter.frequency.value = 12000;
    this.ambFilter.Q.value = 0.5;

    this.ambBus = this.ctx.createGain();
    this.ambBus.gain.value = curve(this.vols.ambience) * AMB_GAIN;
    this.ambBus.connect(this.ambFilter);
    this.ambFilter.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = curve(this.vols.sfx);
    this.sfxBus.connect(this.master);

    this.uiBus = this.ctx.createGain();
    this.uiBus.gain.value = curve(this.vols.sfx) * 0.85;
    this.uiBus.connect(this.master);

    this.started = true;
    void this.ctx.resume();
    this.bindVisibility();
    this.startMusic();
    this.loading = this.loadAll().then(() => {
      if (this.gameplay && !this.paused) this.startAmbience();
    });
  }

  private bindVisibility() {
    if (this.visBound) return;
    this.visBound = true;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.resume();
    });
  }

  beginGameplay() {
    this.gameplay = true;
    this.unlock();
    this.startMusic();
    if (!this.paused) this.startAmbience();
    this.syncNightBed();
  }

  private syncMusicSource() {
    if (!this.musicEl) return;
    const url = this.track.file;
    if (this.musicUrl === url) return;
    this.musicUrl = url;
    this.musicEl.src = url;
    this.musicEl.load();
  }

  private ensureMusicEl() {
    if (typeof Audio === "undefined" || typeof document === "undefined") {
      return null;
    }
    if (this.musicEl) {
      this.syncMusicSource();
      return this.musicEl;
    }
    const el = new Audio(this.track.file);
    el.loop = true;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("hidden", "");
    el.volume = this.elementVolume();
    this.musicUrl = this.track.file;
    document.body.appendChild(el);
    const bump = () => this.notify();
    el.addEventListener("play", bump);
    el.addEventListener("pause", bump);
    el.addEventListener("playing", bump);
    el.addEventListener("canplaythrough", () => {
      if (this.musicOn) this.tryPlayMusic();
    });
    el.addEventListener("error", () => this.notify());
    this.musicEl = el;
    return el;
  }

  private elementVolume() {
    if (!this.musicOn) return 0;
    return Math.max(0, Math.min(1, this.vols.master * this.vols.music * MUSIC_LEVEL));
  }

  private applyMusicElementVolume() {
    if (!this.musicEl) return;
    this.musicEl.volume = this.elementVolume();
  }

  private tryPlayMusic() {
    const el = this.ensureMusicEl();
    if (!el) {
      this.notify();
      return;
    }
    this.applyMusicElementVolume();
    if (!this.musicOn) {
      el.pause();
      this.notify();
      return;
    }
    const play = el.play();
    if (play) {
      void play
        .then(() => this.notify())
        .catch(() => this.notify());
    } else {
      this.notify();
    }
  }

  private async loadAll() {
    const urls = [...FOOT_FILES, ...PICKUP_FILES, "/audio/ambience-day.mp3", "/audio/ambience-sunset.mp3", "/audio/ambience-night.mp3"];
    const unique = [...new Set(urls)];
    await Promise.all(
      unique.map(async (url) => {
        if (this.buffers.has(url)) return;
        try {
          const res = await fetch(url);
          if (!res.ok || !this.ctx) return;
          const raw = await res.arrayBuffer();
          const buf = await this.ctx.decodeAudioData(raw.slice(0));
          this.buffers.set(url, buf);
        } catch {
          /* oscillator fallbacks remain for sfx */
        }
      }),
    );
  }

  private startMusic() {
    this.ensureMusicEl();
    this.tryPlayMusic();
  }

  private stopMusic(_hard = false) {
    if (!this.musicEl) return;
    this.musicEl.pause();
    this.notify();
  }

  private startAmbience() {
    if (!this.ctx || !this.ambBus || !this.gameplay) return;
    if (this.paused) return;
    const url = ambienceFile(this.timeOfDay);
    const buf = this.buffers.get(url);
    if (!buf) return;
    if (this.ambSource && this.ambUrl === url) return;
    this.stopAmbience();
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = buf.duration;
    src.connect(this.ambBus);
    src.start();
    this.ambSource = src;
    this.ambUrl = url;
  }

  private stopAmbience() {
    if (!this.ambSource) return;
    try {
      this.ambSource.stop();
    } catch {
      /* ignore */
    }
    try {
      this.ambSource.disconnect();
    } catch {
      /* ignore */
    }
    this.ambSource = null;
    this.ambUrl = null;
  }

  resume() {
    void this.ctx?.resume();
    if (this.musicOn) this.tryPlayMusic();
  }

  setPaused(v: boolean) {
    this.paused = v;
    if (v) {
      this.stepDist = 0;
      this.wasMoving = false;
    } else if (this.gameplay) {
      this.startAmbience();
    }
    /* BGM keeps looping through game pause — only the side control stops it. */
  }

  setIndoor(v: boolean) {
    if (this.indoor === v) return;
    this.indoor = v;
    if (!this.ambFilter || !this.ctx) return;
    ramp(this.ambFilter.frequency, v ? 900 : 12000, this.ctx.currentTime, 0.12);
    if (this.ambBus) ramp(this.ambBus.gain, curve(this.vols.ambience) * AMB_GAIN * (v ? 0.55 : 1), this.ctx.currentTime, 0.1);
  }

  setVolumes(v: Partial<VolumeState> | number, sfx?: number) {
    if (typeof v === "number") {
      this.vols = { ...this.vols, music: v, ...(sfx !== undefined ? { sfx } : {}) };
    } else {
      this.vols = { ...this.vols, ...v };
    }
    this.applyMusicElementVolume();
    if (!this.ctx) {
      this.notify();
      return;
    }
    if (this.master) ramp(this.master.gain, curve(this.vols.master), this.ctx.currentTime, 0.05);
    if (this.ambBus) ramp(this.ambBus.gain, curve(this.vols.ambience) * AMB_GAIN * (this.indoor ? 0.55 : 1), this.ctx.currentTime, 0.05);
    if (this.sfxBus) ramp(this.sfxBus.gain, curve(this.vols.sfx), this.ctx.currentTime, 0.04);
    if (this.uiBus) ramp(this.uiBus.gain, curve(this.vols.sfx) * 0.85, this.ctx.currentTime, 0.04);
    this.notify();
  }

  setTime(tod: TimeOfDay) {
    this.timeOfDay = tod;
    if (this.gameplay) this.startAmbience();
    this.syncNightBed();
  }

  playTrack(id?: TrackId) {
    const index = id ? MUSIC_TRACKS.findIndex((track) => track.id === id) : -1;
    if (index >= 0) {
      this.trackIndex = index;
    } else {
      this.trackIndex = 0;
    }
    this.syncMusicSource();
    if (this.musicOn) this.startMusic();
    this.notify();
  }

  next() {
    this.trackIndex = (this.trackIndex + 1) % MUSIC_TRACKS.length;
    this.syncMusicSource();
    if (this.musicOn) this.tryPlayMusic();
    this.notify();
  }

  prev() {
    this.trackIndex = (this.trackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    this.syncMusicSource();
    if (this.musicOn) this.tryPlayMusic();
    this.notify();
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (!this.musicOn) this.stopMusic(false);
    else {
      this.unlock();
      this.startMusic();
    }
    this.notify();
    return this.musicOn;
  }

  private playBuf(url: string, gain = 0.4, rate = 1, bus: GainNode | null = this.sfxBus, surface?: SurfaceKind) {
    if (!this.ctx || !bus) return false;
    const buf = this.buffers.get(url);
    if (!buf) return false;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = rate;
    g.gain.value = gain;
    src.connect(g);
    if (surface && this.ctx) {
      const spec = SURFACE[surface];
      const f = this.ctx.createBiquadFilter();
      f.type = spec.filter;
      f.frequency.value = spec.freq;
      f.Q.value = spec.q;
      g.connect(f);
      f.connect(bus);
      src.onended = () => {
        try {
          src.disconnect();
          g.disconnect();
          f.disconnect();
        } catch {
          /* ignore */
        }
      };
    } else {
      g.connect(bus);
      src.onended = () => {
        try {
          src.disconnect();
          g.disconnect();
        } catch {
          /* ignore */
        }
      };
    }
    src.start();
    return g;
  }

  blip(freq = 440, dur = 0.08, type: OscillatorType = "sine", gain = 0.1) {
    if (!this.ctx || !this.uiBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.uiBus);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  private noiseBurst(dur: number, gain: number) {
    if (!this.ctx || !this.sfxBus) return;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lpY = 0;
    let hpY = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      lpY += 0.35 * (white - lpY);
      hpY = 0.4 * (hpY + lpY - prev);
      prev = lpY;
      const env = Math.exp(-i / (n * 0.28));
      data[i] = hpY * env;
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.sfxBus);
    src.start();
  }

  pickup() {
    this.pickupCount += 1;
    const now = this.ctx?.currentTime ?? performance.now() / 1000;
    this.lastPickupAt = now;
    if (this.ctx) {
      for (const g of this.pickupVoices) {
        try {
          ramp(g.gain, 0.0001, this.ctx.currentTime, 0.03);
        } catch {
          /* ignore */
        }
      }
      this.pickupVoices = [];
    }
    const url = PICKUP_FILES[this.pickupIndex % PICKUP_FILES.length];
    this.pickupIndex += 1;
    const rate = 0.97 + Math.random() * 0.07;
    const g = this.playBuf(url, PICKUP_GAIN * (0.9 + Math.random() * 0.12), rate);
    if (g) this.pickupVoices.push(g);
    else {
      this.blip(494, 0.09, "sine", 0.045);
      window.setTimeout(() => this.blip(659, 0.14, "sine", 0.035), 55);
    }
  }

  ui() {
    this.blip(480, 0.06, "sine", 0.045);
  }

  win() {
    this.blip(523, 0.12, "sine", 0.06);
    window.setTimeout(() => this.blip(659, 0.12, "sine", 0.05), 110);
    window.setTimeout(() => this.blip(784, 0.18, "sine", 0.05), 230);
  }

  lose() {
    this.blip(196, 0.28, "sine", 0.07);
    window.setTimeout(() => this.blip(147, 0.4, "triangle", 0.05), 180);
  }

  inspect() {
    this.blip(392, 0.08, "sine", 0.04);
  }

  land(surface: SurfaceKind = "dirt") {
    const spec = SURFACE[surface];
    const url = FOOT_FILES[this.footIndex % FOOT_FILES.length];
    this.playBuf(url, spec.gain * 1.15, spec.rate * 0.9, this.sfxBus, surface);
  }

  foot(speed: number, dt: number, onGround = true, surface: SurfaceKind = "dirt") {
    const moving = onGround && !this.paused && speed >= 1.2;
    if (!moving) {
      this.stepDist = 0;
      this.wasMoving = false;
      return;
    }
    const stride = speed > 8.2 ? 4.4 : surface === "stone" ? 3.35 : 3.55;
    if (!this.wasMoving) {
      this.wasMoving = true;
      this.stepDist = stride * 0.88;
    }
    this.stepDist += speed * dt;
    if (this.stepDist < stride) return;
    this.stepDist -= stride;
    this.footCount += 1;
    this.lastFootAt = this.ctx?.currentTime ?? performance.now() / 1000;
    const url = FOOT_FILES[this.footIndex % FOOT_FILES.length];
    this.footIndex += 1;
    const spec = SURFACE[surface];
    const rate = spec.rate * (0.94 + Math.random() * 0.12);
    const vol = spec.gain + Math.random() * 0.08;
    if (this.playBuf(url, vol, rate, this.sfxBus, surface)) return;
    this.noiseBurst(0.08, 0.08 + Math.random() * 0.03);
    this.blip(78 + Math.random() * 28, 0.06, "sine", 0.04);
  }

  tickLow() {
    this.blip(220, 0.05, "sine", 0.03);
  }

  private syncNightBed() {
    const want = this.timeOfDay === "night" && this.gameplay && !this.paused;
    if (want === this.nightOn) return;
    this.clearNightBed();
    if (!want || !this.ctx || !this.ambBus) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 4200;
    bp.Q.value = 7;
    const n = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.ambBus);
    src.start();
    this.nightNodes = [src, bp, gain];
    this.nightOn = true;
  }

  private clearNightBed() {
    for (const n of this.nightNodes) {
      try {
        if ("stop" in n) (n as AudioBufferSourceNode).stop();
      } catch {
        /* ignore */
      }
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.nightNodes = [];
    this.nightOn = false;
  }

  /** Soft reset between levels — keep music running. */
  release() {
    this.stepDist = 0;
    this.wasMoving = false;
    this.gameplay = false;
    this.stopAmbience();
    this.clearNightBed();
  }

  stop() {
    try {
      this.stopMusic(true);
      this.stopAmbience();
      this.clearNightBed();
      if (this.musicTimer) window.clearTimeout(this.musicTimer);
      if (this.musicEl) {
        this.musicEl.pause();
        this.musicEl.remove();
        this.musicEl.src = "";
        this.musicEl = null;
      }
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.started = false;
    this.gameplay = false;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.musicFade = null;
    this.ambBus = null;
    this.sfxBus = null;
    this.uiBus = null;
    this.ambFilter = null;
    this.ambSource = null;
    this.ambUrl = null;
    this.musicSource = null;
    this.musicUrl = null;
    this.buffers.clear();
    this.stepDist = 0;
    this.wasMoving = false;
    this.listeners.clear();
    shared = null;
  }
}

function ambienceFile(tod: TimeOfDay) {
  if (tod === "night") return "/audio/ambience-night.mp3";
  if (tod === "sunset") return "/audio/ambience-sunset.mp3";
  return "/audio/ambience-day.mp3";
}
