import { i as __toESM } from "../_runtime.mjs";
import { I as require_jsx_runtime, L as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as PlaneGeometry, B as SphereGeometry, C as LinearFilter, D as MeshStandardMaterial, E as MeshBasicMaterial, F as SRGBColorSpace, H as TorusGeometry, I as Scene, L as ShaderMaterial, M as Points, N as PointsMaterial, O as Object3D, P as RepeatWrapping, R as Shape, S as LineSegments, T as Mesh, U as Vector2, V as SpotLight, W as Vector3, _ as IcosahedronGeometry, a as BufferAttribute, b as Line, c as CapsuleGeometry, d as ConeGeometry, f as CylinderGeometry, g as HemisphereLight, h as Group, i as BoxGeometry, j as PointLight, k as PerspectiveCamera, l as CircleGeometry, m as Fog, n as WebGLRenderer, o as BufferGeometry, p as DirectionalLight, r as AmbientLight, s as CanvasTexture, t as mergeGeometries, u as Color, v as InstancedBufferAttribute, x as LineBasicMaterial, y as InstancedMesh, z as ShapeGeometry } from "../_libs/three.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { _ as Check, a as RotateCcw, c as Pause, d as Map$1, f as Flashlight, g as ChevronRight, h as CloudRain, i as Star, l as Moon, m as CloudSun, o as Plus, p as Crosshair, r as Sunset, s as Play, t as Volume2, u as Minus, v as ArrowUpRight } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/GameView-BwtLtSm-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MUSIC_TRACKS = [{
	id: "tambayan",
	name: "Lazy Afternoon Tambayan",
	file: "/audio/lazy-afternoon-tambayan.mp3"
}, {
	id: "paper-lanterns",
	name: "Paper Lanterns",
	file: "/audio/paper-lanterns.mp3"
}];
var SONG = MUSIC_TRACKS[0];
SONG.name, SONG.file, MUSIC_TRACKS[1].file;
var FOOT_FILES = [
	"/audio/foot-1.mp3",
	"/audio/foot-2.mp3",
	"/audio/foot-3.mp3",
	"/audio/foot-4.mp3"
];
var PICKUP_FILES = [
	"/audio/pickup.mp3",
	"/audio/pickup-b.mp3",
	"/audio/pickup-c.mp3"
];
var AMB_GAIN = .12;
var PICKUP_GAIN = .38;
/** Recorded song is quieter than oscillators — keep it clearly audible. */
var MUSIC_LEVEL = .78;
function curve(v) {
	return Math.max(0, Math.min(1, v)) ** 2;
}
function ramp(param, value, at, timeConst = .06) {
	param.setTargetAtTime(Math.max(1e-4, value), at, timeConst);
}
var SURFACE = {
	grass: {
		gain: .38,
		rate: .86,
		filter: "lowpass",
		freq: 1400,
		q: .7
	},
	dirt: {
		gain: .52,
		rate: 1,
		filter: "lowpass",
		freq: 2800,
		q: .5
	},
	stone: {
		gain: .64,
		rate: 1.12,
		filter: "highpass",
		freq: 220,
		q: .6
	},
	wood: {
		gain: .48,
		rate: .94,
		filter: "peaking",
		freq: 520,
		q: 1.1
	},
	water: {
		gain: .3,
		rate: .72,
		filter: "lowpass",
		freq: 900,
		q: .8
	}
};
var shared = null;
function getSharedAudio() {
	if (!shared) shared = new HavenAudio();
	return shared;
}
var HavenAudio = class {
	ctx = null;
	master = null;
	musicBus = null;
	musicFade = null;
	ambBus = null;
	ambFilter = null;
	sfxBus = null;
	uiBus = null;
	started = false;
	gameplay = false;
	stepDist = 0;
	wasMoving = false;
	musicOn = true;
	trackIndex = 0;
	musicTimer = null;
	vols = {
		master: .85,
		music: .55,
		sfx: .7,
		ambience: .22
	};
	paused = false;
	buffers = /* @__PURE__ */ new Map();
	musicSource = null;
	musicUrl = null;
	musicEl = null;
	ambSource = null;
	ambUrl = null;
	loading = null;
	pickupCount = 0;
	footCount = 0;
	lastPickupAt = 0;
	lastFootAt = 0;
	lastPickupId = null;
	footIndex = 0;
	pickupIndex = 0;
	indoor = false;
	timeOfDay = "day";
	pickupVoices = [];
	nightNodes = [];
	nightOn = false;
	listeners = /* @__PURE__ */ new Set();
	visBound = false;
	get track() {
		return MUSIC_TRACKS[this.trackIndex % MUSIC_TRACKS.length] ?? MUSIC_TRACKS[0];
	}
	onChange(fn) {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn);
		};
	}
	notify() {
		for (const fn of this.listeners) fn();
	}
	musicSnap() {
		return {
			name: this.track.name,
			musicOn: this.musicOn,
			playing: !!this.musicEl && !this.musicEl.paused && this.musicOn,
			volume: this.vols.music
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
			musicPlaying: this.musicSnap().playing
		};
	}
	unlock() {
		this.ensureMusicEl();
		if (this.started && this.ctx) {
			this.ctx.resume();
			this.bindVisibility();
			this.startMusic();
			return;
		}
		const AC = window.AudioContext || window.webkitAudioContext;
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
		this.ambFilter.frequency.value = 12e3;
		this.ambFilter.Q.value = .5;
		this.ambBus = this.ctx.createGain();
		this.ambBus.gain.value = curve(this.vols.ambience) * AMB_GAIN;
		this.ambBus.connect(this.ambFilter);
		this.ambFilter.connect(this.master);
		this.sfxBus = this.ctx.createGain();
		this.sfxBus.gain.value = curve(this.vols.sfx);
		this.sfxBus.connect(this.master);
		this.uiBus = this.ctx.createGain();
		this.uiBus.gain.value = curve(this.vols.sfx) * .85;
		this.uiBus.connect(this.master);
		this.started = true;
		this.ctx.resume();
		this.bindVisibility();
		this.startMusic();
		this.loading = this.loadAll().then(() => {
			if (this.gameplay && !this.paused) this.startAmbience();
		});
	}
	bindVisibility() {
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
	syncMusicSource() {
		if (!this.musicEl) return;
		const url = this.track.file;
		if (this.musicUrl === url) return;
		this.musicUrl = url;
		this.musicEl.src = url;
		this.musicEl.load();
	}
	ensureMusicEl() {
		if (typeof Audio === "undefined" || typeof document === "undefined") return null;
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
	elementVolume() {
		if (!this.musicOn) return 0;
		return Math.max(0, Math.min(1, this.vols.master * this.vols.music * MUSIC_LEVEL));
	}
	applyMusicElementVolume() {
		if (!this.musicEl) return;
		this.musicEl.volume = this.elementVolume();
	}
	tryPlayMusic() {
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
		if (play) play.then(() => this.notify()).catch(() => this.notify());
		else this.notify();
	}
	async loadAll() {
		const urls = [
			...FOOT_FILES,
			...PICKUP_FILES,
			"/audio/ambience-day.mp3",
			"/audio/ambience-sunset.mp3",
			"/audio/ambience-night.mp3"
		];
		const unique = [...new Set(urls)];
		await Promise.all(unique.map(async (url) => {
			if (this.buffers.has(url)) return;
			try {
				const res = await fetch(url);
				if (!res.ok || !this.ctx) return;
				const raw = await res.arrayBuffer();
				const buf = await this.ctx.decodeAudioData(raw.slice(0));
				this.buffers.set(url, buf);
			} catch {}
		}));
	}
	startMusic() {
		this.ensureMusicEl();
		this.tryPlayMusic();
	}
	stopMusic(_hard = false) {
		if (!this.musicEl) return;
		this.musicEl.pause();
		this.notify();
	}
	startAmbience() {
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
	stopAmbience() {
		if (!this.ambSource) return;
		try {
			this.ambSource.stop();
		} catch {}
		try {
			this.ambSource.disconnect();
		} catch {}
		this.ambSource = null;
		this.ambUrl = null;
	}
	resume() {
		this.ctx?.resume();
		if (this.musicOn) this.tryPlayMusic();
	}
	setPaused(v) {
		this.paused = v;
		if (v) {
			this.stepDist = 0;
			this.wasMoving = false;
		} else if (this.gameplay) this.startAmbience();
	}
	setIndoor(v) {
		if (this.indoor === v) return;
		this.indoor = v;
		if (!this.ambFilter || !this.ctx) return;
		ramp(this.ambFilter.frequency, v ? 900 : 12e3, this.ctx.currentTime, .12);
		if (this.ambBus) ramp(this.ambBus.gain, curve(this.vols.ambience) * AMB_GAIN * (v ? .55 : 1), this.ctx.currentTime, .1);
	}
	setVolumes(v, sfx) {
		if (typeof v === "number") this.vols = {
			...this.vols,
			music: v,
			...sfx !== void 0 ? { sfx } : {}
		};
		else this.vols = {
			...this.vols,
			...v
		};
		this.applyMusicElementVolume();
		if (!this.ctx) {
			this.notify();
			return;
		}
		if (this.master) ramp(this.master.gain, curve(this.vols.master), this.ctx.currentTime, .05);
		if (this.ambBus) ramp(this.ambBus.gain, curve(this.vols.ambience) * AMB_GAIN * (this.indoor ? .55 : 1), this.ctx.currentTime, .05);
		if (this.sfxBus) ramp(this.sfxBus.gain, curve(this.vols.sfx), this.ctx.currentTime, .04);
		if (this.uiBus) ramp(this.uiBus.gain, curve(this.vols.sfx) * .85, this.ctx.currentTime, .04);
		this.notify();
	}
	setTime(tod) {
		this.timeOfDay = tod;
		if (this.gameplay) this.startAmbience();
		this.syncNightBed();
	}
	playTrack(id) {
		const index = id ? MUSIC_TRACKS.findIndex((track) => track.id === id) : -1;
		if (index >= 0) this.trackIndex = index;
		else this.trackIndex = 0;
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
	playBuf(url, gain = .4, rate = 1, bus = this.sfxBus, surface) {
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
				} catch {}
			};
		} else {
			g.connect(bus);
			src.onended = () => {
				try {
					src.disconnect();
					g.disconnect();
				} catch {}
			};
		}
		src.start();
		return g;
	}
	blip(freq = 440, dur = .08, type = "sine", gain = .1) {
		if (!this.ctx || !this.uiBus) return;
		const o = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		o.type = type;
		o.frequency.value = freq;
		g.gain.value = gain;
		g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + dur);
		o.connect(g);
		g.connect(this.uiBus);
		o.start();
		o.stop(this.ctx.currentTime + dur);
	}
	noiseBurst(dur, gain) {
		if (!this.ctx || !this.sfxBus) return;
		const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
		const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
		const data = buf.getChannelData(0);
		let lpY = 0;
		let hpY = 0;
		let prev = 0;
		for (let i = 0; i < n; i++) {
			const white = Math.random() * 2 - 1;
			lpY += .35 * (white - lpY);
			hpY = .4 * (hpY + lpY - prev);
			prev = lpY;
			const env = Math.exp(-i / (n * .28));
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
		const now = this.ctx?.currentTime ?? performance.now() / 1e3;
		this.lastPickupAt = now;
		if (this.ctx) {
			for (const g of this.pickupVoices) try {
				ramp(g.gain, 1e-4, this.ctx.currentTime, .03);
			} catch {}
			this.pickupVoices = [];
		}
		const url = PICKUP_FILES[this.pickupIndex % PICKUP_FILES.length];
		this.pickupIndex += 1;
		const rate = .97 + Math.random() * .07;
		const g = this.playBuf(url, PICKUP_GAIN * (.9 + Math.random() * .12), rate);
		if (g) this.pickupVoices.push(g);
		else {
			this.blip(494, .09, "sine", .045);
			window.setTimeout(() => this.blip(659, .14, "sine", .035), 55);
		}
	}
	ui() {
		this.blip(480, .06, "sine", .045);
	}
	win() {
		this.blip(523, .12, "sine", .06);
		window.setTimeout(() => this.blip(659, .12, "sine", .05), 110);
		window.setTimeout(() => this.blip(784, .18, "sine", .05), 230);
	}
	lose() {
		this.blip(196, .28, "sine", .07);
		window.setTimeout(() => this.blip(147, .4, "triangle", .05), 180);
	}
	inspect() {
		this.blip(392, .08, "sine", .04);
	}
	land(surface = "dirt") {
		const spec = SURFACE[surface];
		const url = FOOT_FILES[this.footIndex % FOOT_FILES.length];
		this.playBuf(url, spec.gain * 1.15, spec.rate * .9, this.sfxBus, surface);
	}
	foot(speed, dt, onGround = true, surface = "dirt") {
		if (!(onGround && !this.paused && speed >= 1.2)) {
			this.stepDist = 0;
			this.wasMoving = false;
			return;
		}
		const stride = speed > 8.2 ? 4.4 : surface === "stone" ? 3.35 : 3.55;
		if (!this.wasMoving) {
			this.wasMoving = true;
			this.stepDist = stride * .88;
		}
		this.stepDist += speed * dt;
		if (this.stepDist < stride) return;
		this.stepDist -= stride;
		this.footCount += 1;
		this.lastFootAt = this.ctx?.currentTime ?? performance.now() / 1e3;
		const url = FOOT_FILES[this.footIndex % FOOT_FILES.length];
		this.footIndex += 1;
		const spec = SURFACE[surface];
		const rate = spec.rate * (.94 + Math.random() * .12);
		const vol = spec.gain + Math.random() * .08;
		if (this.playBuf(url, vol, rate, this.sfxBus, surface)) return;
		this.noiseBurst(.08, .08 + Math.random() * .03);
		this.blip(78 + Math.random() * 28, .06, "sine", .04);
	}
	tickLow() {
		this.blip(220, .05, "sine", .03);
	}
	syncNightBed() {
		const want = this.timeOfDay === "night" && this.gameplay && !this.paused;
		if (want === this.nightOn) return;
		this.clearNightBed();
		if (!want || !this.ctx || !this.ambBus) return;
		const ctx = this.ctx;
		const gain = ctx.createGain();
		gain.gain.value = .045;
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
		this.nightNodes = [
			src,
			bp,
			gain
		];
		this.nightOn = true;
	}
	clearNightBed() {
		for (const n of this.nightNodes) {
			try {
				if ("stop" in n) n.stop();
			} catch {}
			try {
				n.disconnect();
			} catch {}
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
			this.ctx?.close();
		} catch {}
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
};
function ambienceFile(tod) {
	if (tod === "night") return "/audio/ambience-night.mp3";
	if (tod === "sunset") return "/audio/ambience-sunset.mp3";
	return "/audio/ambience-day.mp3";
}
function hash(ix, iy) {
	const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
	return n - Math.floor(n);
}
function valueNoise(x, y) {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;
	const ux = fx * fx * (3 - 2 * fx);
	const uy = fy * fy * (3 - 2 * fy);
	const a = hash(x0, y0);
	const b = hash(x0 + 1, y0);
	const c = hash(x0, y0 + 1);
	const d = hash(x0 + 1, y0 + 1);
	return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y, oct = 5) {
	let v = 0;
	let a = .5;
	let f = 1;
	for (let i = 0; i < oct; i++) {
		v += a * valueNoise(x * f, y * f);
		a *= .5;
		f *= 2.03;
	}
	return v;
}
function canvas(size) {
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	return {
		c,
		ctx: c.getContext("2d", { willReadFrequently: true }),
		size
	};
}
function toTex(c, opts = {}) {
	const tex = new CanvasTexture(c);
	tex.colorSpace = opts.colorSpace ?? "srgb";
	tex.anisotropy = 4;
	tex.generateMipmaps = true;
	tex.minFilter = opts.filter ?? 1008;
	tex.magFilter = LinearFilter;
	if (opts.wrap !== false) {
		tex.wrapS = RepeatWrapping;
		tex.wrapT = RepeatWrapping;
		const r = opts.repeat ?? 1;
		tex.repeat.set(r, r);
	}
	tex.needsUpdate = true;
	return tex;
}
function paintNoise(ctx, size, shade, scale = 6) {
	const img = ctx.createImageData(size, size);
	const d = img.data;
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
		const [r, g, b, a = 255] = shade(fbm(x / size * scale, y / size * scale), x, y);
		const i = (y * size + x) * 4;
		d[i] = r;
		d[i + 1] = g;
		d[i + 2] = b;
		d[i + 3] = a;
	}
	ctx.putImageData(img, 0, 0);
}
var cache = null;
function getTextures() {
	if (cache) return cache;
	cache = makeTextures();
	return cache;
}
function makeTextures() {
	const grass = canvas(256);
	paintNoise(grass.ctx, 256, (n, x, y) => {
		const n2 = fbm(x / 256 * 18, y / 256 * 18, 3);
		const blade = Math.pow(n2, 1.4);
		return [
			38 + n * 28 + blade * 18,
			72 + n * 50 + blade * 22,
			28 + n * 18
		];
	});
	const dirt = canvas(256);
	paintNoise(dirt.ctx, 256, (n, x, y) => {
		const peb = fbm(x / 256 * 22, y / 256 * 22, 2);
		return [
			92 + n * 40 + peb * 18,
			68 + n * 24 + peb * 10,
			38 + n * 16
		];
	});
	const stone = canvas(256);
	paintNoise(stone.ctx, 256, (n, x, y) => {
		const crack = Math.abs(fbm(x / 256 * 14, y / 256 * 14, 4) - .5) * 2;
		return [
			98 + n * 36 - crack * 22,
			102 + n * 32 - crack * 18,
			94 + n * 28 - crack * 16
		];
	});
	const wood = canvas(256);
	paintNoise(wood.ctx, 256, (n, x, y) => {
		const grain = Math.sin(y / 256 * 28 + n * 6) * .5 + .5;
		const ring = Math.sin(x / 256 * 9 + grain * 3) * .5 + .5;
		return [
			78 + grain * 50 + ring * 18,
			52 + grain * 28 + ring * 10,
			32 + grain * 14
		];
	}, 4);
	const concrete = canvas(256);
	paintNoise(concrete.ctx, 256, (n) => {
		return [
			118 + n * 28,
			116 + n * 24,
			108 + n * 20
		];
	}, 10);
	const metal = canvas(128);
	paintNoise(metal.ctx, 128, (n, x, y) => {
		const scratch = Math.abs(Math.sin((y + x * .15) * .4)) * 30;
		return [
			70 + n * 40 + scratch * .4,
			76 + n * 36 + scratch * .35,
			72 + n * 32
		];
	}, 8);
	const detail = canvas(256);
	paintNoise(detail.ctx, 256, (n) => {
		const v = 140 + n * 90;
		return [
			v,
			v,
			v
		];
	}, 12);
	const rough = canvas(256);
	paintNoise(rough.ctx, 256, (n) => {
		const v = 160 + n * 80;
		return [
			v,
			v,
			v
		];
	}, 9);
	rough.c;
	const blade = makeGrassBlade();
	const leaf = makeLeaf();
	const cloud = makeCloud();
	return {
		grass: toTex(grass.c, { repeat: 28 }),
		dirt: toTex(dirt.c, { repeat: 18 }),
		stone: toTex(stone.c, { repeat: 12 }),
		wood: toTex(wood.c, { repeat: 4 }),
		concrete: toTex(concrete.c, { repeat: 8 }),
		metal: toTex(metal.c, { repeat: 4 }),
		detail: toTex(detail.c, {
			repeat: 40,
			colorSpace: ""
		}),
		rough: toTex(rough.c, {
			repeat: 22,
			colorSpace: ""
		}),
		grassBlade: toTex(blade, { wrap: false }),
		leaf: toTex(leaf, { wrap: false }),
		cloud: toTex(cloud, { wrap: false })
	};
}
function makeGrassBlade() {
	const { c, ctx } = canvas(64);
	c.height = 128;
	ctx.clearRect(0, 0, 64, 128);
	for (const b of [
		{
			x: 18,
			lean: -10,
			h: 118,
			w: 5,
			col: "#3c6a32"
		},
		{
			x: 32,
			lean: 6,
			h: 124,
			w: 6,
			col: "#4a7c3c"
		},
		{
			x: 46,
			lean: 12,
			h: 108,
			w: 5,
			col: "#355e2c"
		},
		{
			x: 26,
			lean: -4,
			h: 96,
			w: 4,
			col: "#5a8a44"
		},
		{
			x: 40,
			lean: 8,
			h: 90,
			w: 3.5,
			col: "#2f5528"
		}
	]) {
		ctx.beginPath();
		ctx.moveTo(b.x - b.w, 128);
		ctx.quadraticCurveTo(b.x + b.lean * .4, 128 - b.h * .45, b.x + b.lean, 128 - b.h);
		ctx.quadraticCurveTo(b.x + b.lean * .35 + 1, 128 - b.h * .45, b.x + b.w, 128);
		ctx.closePath();
		ctx.fillStyle = b.col;
		ctx.fill();
	}
	return c;
}
function makeLeaf() {
	const { c, ctx } = canvas(64);
	ctx.clearRect(0, 0, 64, 64);
	ctx.translate(32, 36);
	ctx.rotate(-.4);
	ctx.beginPath();
	ctx.moveTo(0, -22);
	ctx.bezierCurveTo(16, -10, 16, 12, 0, 22);
	ctx.bezierCurveTo(-16, 12, -16, -10, 0, -22);
	ctx.fillStyle = "#8a5a32";
	ctx.fill();
	ctx.strokeStyle = "#6a4020";
	ctx.lineWidth = 1.2;
	ctx.beginPath();
	ctx.moveTo(0, -20);
	ctx.lineTo(0, 20);
	ctx.stroke();
	return c;
}
function makeCloud() {
	const { c, ctx } = canvas(128);
	ctx.clearRect(0, 0, 128, 128);
	const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
	g.addColorStop(0, "rgba(255,255,255,0.7)");
	g.addColorStop(.45, "rgba(236,242,248,0.35)");
	g.addColorStop(1, "rgba(220,230,240,0)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 128, 128);
	return c;
}
var windUniforms = {
	uTime: { value: 0 },
	uWind: { value: new Vector2(.75, .28) }
};
function applyWind(mat, amount = 1, swayY = true) {
	mat.userData.windAmt = amount;
	mat.onBeforeCompile = (shader) => {
		shader.uniforms.uTime = windUniforms.uTime;
		shader.uniforms.uWind = windUniforms.uWind;
		shader.uniforms.uAmt = { value: amount };
		shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
         uniform float uTime;
         uniform vec2 uWind;
         uniform float uAmt;`).replace("#include <begin_vertex>", `#include <begin_vertex>
         {
           vec3 ip = vec3(0.0);
           #ifdef USE_INSTANCING
             ip = instanceMatrix[3].xyz;
           #endif
           float h = ${swayY ? "max(transformed.y, 0.0)" : "1.0"};
           float t = uTime + ip.x * 0.21 + ip.z * 0.17;
           float gust = sin(t * 0.35) * 0.35 + 0.65;
           transformed.x += sin(t * 1.15) * uWind.x * uAmt * 0.16 * h * gust;
           transformed.z += cos(t * 0.92) * uWind.y * uAmt * 0.12 * h * gust;
         }`);
	};
	mat.customProgramCacheKey = () => `wind-${amount}-${swayY ? 1 : 0}`;
	mat.needsUpdate = true;
	return mat;
}
function tickWind(t) {
	windUniforms.uTime.value = t;
	windUniforms.uWind.value.set(.7 + Math.sin(t * .11) * .25, .28 + Math.cos(t * .09) * .12);
}
var SKY = {
	day: {
		bg: 8894676,
		fog: 12046532,
		fogNear: 42,
		fogFar: 158,
		hemiSky: 14216948,
		hemiGround: 4021304,
		hemiInt: .82,
		sunColor: 16773844,
		sunInt: 1.22,
		sunPos: [
			52,
			78,
			28
		],
		exposure: 1.08,
		ambient: .28,
		zenith: 7254228,
		horizon: 14215896,
		flash: .55
	},
	sunset: {
		bg: 12872266,
		fog: 13666916,
		fogNear: 32,
		fogFar: 118,
		hemiSky: 15769712,
		hemiGround: 3811352,
		hemiInt: .68,
		sunColor: 16746564,
		sunInt: 1.05,
		sunPos: [
			86,
			16,
			-42
		],
		exposure: 1.02,
		ambient: .22,
		zenith: 4864632,
		horizon: 15768162,
		flash: .9
	},
	night: {
		bg: 1054762,
		fog: 1384498,
		fogNear: 22,
		fogFar: 96,
		hemiSky: 3822704,
		hemiGround: 1713180,
		hemiInt: .42,
		sunColor: 13688044,
		sunInt: .48,
		sunPos: [
			-36,
			62,
			22
		],
		exposure: .92,
		ambient: .16,
		zenith: 791588,
		horizon: 2372680,
		flash: 2.15
	}
};
var SKY_EXT = {
	morning: {
		bg: 12113120,
		fog: 13163720,
		fogNear: 38,
		fogFar: 150,
		hemiSky: 15788248,
		hemiGround: 3820082,
		hemiInt: .7,
		sunColor: 16769200,
		sunInt: .95,
		sunPos: [
			-48,
			28,
			40
		],
		exposure: .98,
		ambient: .24,
		zenith: 8038600,
		horizon: 15784120,
		flash: .45
	},
	lateAfternoon: {
		bg: 13936760,
		fog: 14203024,
		fogNear: 34,
		fogFar: 128,
		hemiSky: 1578e4,
		hemiGround: 3813408,
		hemiInt: .72,
		sunColor: 16760952,
		sunInt: 1.1,
		sunPos: [
			74,
			32,
			-20
		],
		exposure: 1.04,
		ambient: .24,
		zenith: 5929136,
		horizon: 15777936,
		flash: .7
	},
	evening: {
		bg: 9063e3,
		fog: 10510424,
		fogNear: 28,
		fogFar: 108,
		hemiSky: 13664368,
		hemiGround: 2758676,
		hemiInt: .5,
		sunColor: 16738874,
		sunInt: .72,
		sunPos: [
			96,
			8,
			-48
		],
		exposure: .94,
		ambient: .16,
		zenith: 2761816,
		horizon: 13660248,
		flash: 1.15
	}
};
var _ca = new Color();
var _cb = new Color();
function lerpHex(a, b, t) {
	return _ca.setHex(a).lerp(_cb.setHex(b), t).getHex();
}
function lerpPreset(a, b, t) {
	const k = Math.max(0, Math.min(1, t));
	const ease = k * k * (3 - 2 * k);
	return {
		bg: lerpHex(a.bg, b.bg, ease),
		fog: lerpHex(a.fog, b.fog, ease),
		fogNear: a.fogNear + (b.fogNear - a.fogNear) * ease,
		fogFar: a.fogFar + (b.fogFar - a.fogFar) * ease,
		hemiSky: lerpHex(a.hemiSky, b.hemiSky, ease),
		hemiGround: lerpHex(a.hemiGround, b.hemiGround, ease),
		hemiInt: a.hemiInt + (b.hemiInt - a.hemiInt) * ease,
		sunColor: lerpHex(a.sunColor, b.sunColor, ease),
		sunInt: a.sunInt + (b.sunInt - a.sunInt) * ease,
		sunPos: [
			a.sunPos[0] + (b.sunPos[0] - a.sunPos[0]) * ease,
			a.sunPos[1] + (b.sunPos[1] - a.sunPos[1]) * ease,
			a.sunPos[2] + (b.sunPos[2] - a.sunPos[2]) * ease
		],
		exposure: a.exposure + (b.exposure - a.exposure) * ease,
		ambient: a.ambient + (b.ambient - a.ambient) * ease,
		zenith: lerpHex(a.zenith, b.zenith, ease),
		horizon: lerpHex(a.horizon, b.horizon, ease),
		flash: a.flash + (b.flash - a.flash) * ease
	};
}
/** 0..1 progress through a level's timer. Day walks morning → afternoon → late. */
function sampleSky(tod, progress) {
	const u = Math.max(0, Math.min(1, progress));
	if (tod === "night") return SKY.night;
	if (tod === "sunset") return lerpPreset(SKY_EXT.lateAfternoon, lerpPreset(SKY.sunset, SKY_EXT.evening, .55), u);
	if (u < .5) return lerpPreset(SKY_EXT.morning, SKY.day, u / .5);
	return lerpPreset(SKY.day, SKY_EXT.lateAfternoon, (u - .5) / .5);
}
function makeStars() {
	const n = 700;
	const pos = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) {
		const u = Math.random();
		const v = Math.random();
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(2 * v - 1);
		const r = 190;
		const y = r * Math.cos(phi);
		if (y < 8) {
			i--;
			continue;
		}
		pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
		pos[i * 3 + 1] = y;
		pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	const mat = new PointsMaterial({
		color: 15265528,
		size: .85,
		sizeAttenuation: true,
		transparent: true,
		opacity: .9,
		depthWrite: false,
		fog: false
	});
	const pts = new Points(geo, mat);
	pts.renderOrder = -8;
	pts.frustumCulled = false;
	return pts;
}
function makeCelestial(kind) {
	const color = kind === "sun" ? 16773828 : 15265528;
	const geo = new SphereGeometry(kind === "sun" ? 6.5 : 5.2, 16, 12);
	const mat = new MeshBasicMaterial({
		color,
		fog: false,
		toneMapped: false,
		depthWrite: false,
		depthTest: false
	});
	const mesh = new Mesh(geo, mat);
	mesh.frustumCulled = false;
	return mesh;
}
var _sunDir = new Vector3();
function makeSkyDome(preset) {
	const geo = new SphereGeometry(220, 32, 20);
	const mat = new ShaderMaterial({
		side: 1,
		fog: false,
		depthWrite: false,
		depthTest: false,
		uniforms: {
			uZenith: { value: new Color(preset.zenith) },
			uHorizon: { value: new Color(preset.horizon) },
			uGround: { value: new Color(preset.fog) }
		},
		vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      varying vec3 vPos;
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      void main() {
        float y = normalize(vPos).y;
        float hMix = smoothstep(-0.05, 0.72, y);
        vec3 col = mix(uHorizon, uZenith, pow(hMix, 1.15));
        col = mix(uGround, col, smoothstep(-0.18, 0.08, y));
        float glow = smoothstep(0.02, 0.22, y) * (1.0 - smoothstep(0.22, 0.55, y));
        col += uHorizon * glow * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }
    `
	});
	const mesh = new Mesh(geo, mat);
	mesh.renderOrder = -10;
	mesh.frustumCulled = false;
	return mesh;
}
function applySkyPreset(sky, preset) {
	const mat = sky.material;
	if (!mat.uniforms) return;
	mat.uniforms.uZenith.value.setHex(preset.zenith);
	mat.uniforms.uHorizon.value.setHex(preset.horizon);
	mat.uniforms.uGround.value.setHex(preset.fog);
}
function makeClouds(tod, quality) {
	const g = new Group();
	g.name = "clouds";
	const tex = getTextures().cloud;
	const count = quality === "low" ? 6 : quality === "medium" ? 9 : 12;
	const mat = new MeshBasicMaterial({
		map: tex,
		color: tod === "night" ? 9085112 : 16777215,
		transparent: true,
		opacity: tod === "night" ? .18 : .42,
		depthWrite: false,
		depthTest: true,
		fog: true,
		side: 2
	});
	const geo = new PlaneGeometry(1, 1);
	for (let i = 0; i < count; i++) {
		const m = new Mesh(geo, mat);
		const a = i / count * Math.PI * 2 + i * .37;
		const r = 48 + i % 5 * 16;
		m.position.set(Math.cos(a) * r, 42 + i % 4 * 7, Math.sin(a) * r - 10);
		const s = 14 + i % 4 * 6;
		m.scale.set(s * 1.8, s * .7, 1);
		m.userData.baseY = m.position.y;
		m.userData.phase = i * 1.7;
		m.userData.baseX = m.position.x;
		m.userData.baseZ = m.position.z;
		m.renderOrder = -6;
		m.frustumCulled = false;
		g.add(m);
	}
	return g;
}
function updateClouds(group, t, cam) {
	for (const child of group.children) {
		const m = child;
		const driftX = Math.sin(t * .02 + m.userData.phase) * 8;
		const driftZ = Math.cos(t * .016 + m.userData.phase) * 6;
		m.position.x = cam.x + m.userData.baseX + driftX;
		m.position.z = cam.z + m.userData.baseZ + driftZ;
		m.position.y = m.userData.baseY + Math.sin(t * .12 + m.userData.phase) * .6;
		m.lookAt(cam.x, m.position.y, cam.z);
	}
}
function makeRain(quality) {
	const count = quality === "low" ? 180 : quality === "medium" ? 320 : 460;
	const positions = new Float32Array(count * 6);
	for (let i = 0; i < count; i++) {
		const offset = i * 6;
		const x = (Math.random() - .5) * 34;
		const y = Math.random() * 22 - 2;
		const z = (Math.random() - .5) * 34;
		positions[offset] = x;
		positions[offset + 1] = y;
		positions[offset + 2] = z;
		positions[offset + 3] = x + .08;
		positions[offset + 4] = y - .48;
		positions[offset + 5] = z;
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(positions, 3));
	const material = new LineBasicMaterial({
		color: 12108995,
		transparent: true,
		opacity: .32,
		depthWrite: false
	});
	const rain = new LineSegments(geo, material);
	rain.frustumCulled = false;
	rain.visible = false;
	return rain;
}
function updateRain(rain, camera, dt) {
	rain.position.copy(camera);
	const positions = rain.geometry.attributes.position;
	const speed = 24 * dt;
	for (let i = 0; i < positions.count; i += 2) {
		const y = positions.getY(i) - speed;
		if (y < -2.2) {
			const x = (Math.random() - .5) * 34;
			const z = (Math.random() - .5) * 34;
			const top = 12 + Math.random() * 11;
			positions.setXYZ(i, x, top, z);
			positions.setXYZ(i + 1, x + .08, top - .48, z);
		} else {
			positions.setY(i, y);
			positions.setY(i + 1, y - .48);
		}
	}
	positions.needsUpdate = true;
}
function makeDust(quality, tod) {
	const n = quality === "low" ? 70 : quality === "medium" ? 110 : 140;
	const pos = new Float32Array(n * 3);
	const vel = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) {
		pos[i * 3] = (Math.random() - .5) * 36;
		pos[i * 3 + 1] = .4 + Math.random() * 4.5;
		pos[i * 3 + 2] = (Math.random() - .5) * 36;
		vel[i * 3] = .15 + Math.random() * .25;
		vel[i * 3 + 1] = .02 + Math.random() * .08;
		vel[i * 3 + 2] = .08 + Math.random() * .18;
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	const mat = new PointsMaterial({
		color: tod === "night" ? 12110040 : tod === "sunset" ? 1578e4 : 15262920,
		size: tod === "night" ? .04 : .05,
		sizeAttenuation: true,
		transparent: true,
		opacity: tod === "night" ? .18 : .24,
		depthWrite: false,
		fog: true
	});
	const pts = new Points(geo, mat);
	pts.userData.vel = vel;
	pts.userData.count = n;
	pts.frustumCulled = false;
	pts.renderOrder = 2;
	return pts;
}
function updateDust(pts, origin, dt, indoor) {
	const pos = pts.geometry.attributes.position;
	const vel = pts.userData.vel;
	const n = pts.userData.count;
	const mat = pts.material;
	mat.opacity += ((indoor ? .04 : .22) - mat.opacity) * Math.min(1, dt * 2.2);
	const ground = origin.y - 1.55;
	for (let i = 0; i < n; i++) {
		const x0 = pos.getX(i);
		const y0 = pos.getY(i);
		const z0 = pos.getZ(i);
		let x = x0 + vel[i * 3] * dt;
		let y = y0 + Math.sin(x0 * .4 + y0) * vel[i * 3 + 1] * dt;
		let z = z0 + vel[i * 3 + 2] * dt;
		const dx = x - origin.x;
		const dz = z - origin.z;
		if (dx * dx + dz * dz > 484 || y > ground + 5.4 || y < ground + .2) {
			const a = Math.random() * Math.PI * 2;
			const r = 8 + Math.random() * 12;
			x = origin.x + Math.cos(a) * r;
			z = origin.z + Math.sin(a) * r;
			y = ground + .35 + Math.random() * 2.8;
		}
		pos.setXYZ(i, x, y, z);
	}
	pos.needsUpdate = true;
}
function makeSunGlow() {
	const geo = new SphereGeometry(11, 16, 12);
	const mat = new MeshBasicMaterial({
		color: 16773828,
		transparent: true,
		opacity: .16,
		fog: false,
		depthWrite: false,
		depthTest: false,
		toneMapped: false
	});
	const mesh = new Mesh(geo, mat);
	mesh.renderOrder = -7;
	mesh.frustumCulled = false;
	return mesh;
}
/** Colors, intensities, sky, sun disc. Does not move the shadow frustum. */
function applyLighting(rig, preset, px, pz, night) {
	rig.sun.color.setHex(preset.sunColor);
	rig.sun.intensity = preset.sunInt;
	rig.fill.color.setHex(preset.hemiSky);
	rig.fill.intensity = night ? .06 : .16;
	rig.fill.position.set(-preset.sunPos[0] * .4, preset.sunPos[1] * .35, -preset.sunPos[2] * .4);
	rig.hemi.color.setHex(preset.hemiSky);
	rig.hemi.groundColor.setHex(preset.hemiGround);
	rig.hemi.intensity = preset.hemiInt;
	rig.ambient.color.setHex(preset.hemiSky);
	rig.ambient.intensity = preset.ambient;
	rig.fog.color.setHex(preset.fog);
	rig.fog.near = preset.fogNear;
	rig.fog.far = preset.fogFar;
	rig.renderer.setClearColor(preset.fog, 1);
	rig.renderer.toneMappingExposure = preset.exposure;
	applySkyPreset(rig.sky, preset);
	_sunDir.set(preset.sunPos[0], preset.sunPos[1], preset.sunPos[2]).normalize().multiplyScalar(155);
	rig.celestial.position.set(px + _sunDir.x, _sunDir.y, pz + _sunDir.z);
	rig.glow.position.copy(rig.celestial.position);
	rig.glow.material.color.setHex(preset.sunColor);
	rig.glow.material.opacity = night ? .08 : .14;
}
/**
* Keep sun direction from the preset, but snap the shadow camera to a world
* texel grid so the map does not swim/flicker as the player moves.
*/
function placeSun(sun, preset, px, pz) {
	const [ox, oy, oz] = preset.sunPos;
	const alt = oy / (Math.hypot(ox, oy, oz) || 1);
	sun.shadow.normalBias = .045 + (1 - Math.max(.15, alt)) * .07;
	sun.shadow.bias = -7e-4 - (1 - Math.max(.15, alt)) * 6e-4;
	if (!sun.castShadow) {
		sun.position.set(ox, oy, oz);
		sun.target.position.set(0, 0, 0);
		sun.target.updateMatrixWorld();
		return;
	}
	const cam = sun.shadow.camera;
	const texel = (cam.right - cam.left) / Math.max(1, sun.shadow.mapSize.width);
	const sx = Math.round(px / texel) * texel;
	const sz = Math.round(pz / texel) * texel;
	sun.position.set(sx + ox, oy, sz + oz);
	sun.target.position.set(sx, 0, sz);
	sun.target.updateMatrixWorld();
}
var SKIN = 12884594;
var SHIRT = 15262936;
var SHORTS = 3820096;
var HAIR = 1709588;
var FLASH_BODY = 2765358;
var FLASH_BEZEL = 3818558;
var FLASH_LENS = 15784104;
function mat$2(color, extra = {}) {
	return new MeshStandardMaterial({
		color,
		roughness: .72,
		metalness: .04,
		...extra
	});
}
function add$1(g, geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
	const m = new Mesh(geo, material);
	m.position.set(x, y, z);
	m.rotation.set(rx, ry, rz);
	m.castShadow = false;
	m.receiveShadow = false;
	m.frustumCulled = false;
	g.add(m);
	return m;
}
function alongNegZ(geo) {
	geo.rotateX(-Math.PI / 2);
	return geo;
}
function buildFlashlightHand() {
	const g = new Group();
	const skin = mat$2(SKIN);
	const sleeve = mat$2(SHIRT, { roughness: .78 });
	const metal = mat$2(FLASH_BODY, {
		metalness: .58,
		roughness: .32
	});
	const bezelM = mat$2(FLASH_BEZEL, {
		metalness: .62,
		roughness: .28
	});
	const lens = mat$2(FLASH_LENS, {
		emissive: FLASH_LENS,
		emissiveIntensity: .15,
		roughness: .18,
		metalness: .2
	});
	const torch = new Group();
	torch.position.set(0, .008, -.02);
	add$1(torch, alongNegZ(new CylinderGeometry(.02, .024, .16, 12)), metal, 0, 0, 0);
	add$1(torch, alongNegZ(new CylinderGeometry(.028, .026, .028, 12)), bezelM, 0, 0, -.086);
	const glass = add$1(torch, alongNegZ(new CylinderGeometry(.022, .022, .012, 12)), lens, 0, 0, -.104);
	add$1(torch, new BoxGeometry(.012, .01, .018), bezelM, 0, .026, .02);
	g.add(torch);
	add$1(g, new SphereGeometry(.052, 12, 8), skin, .002, -.026, .018).scale.set(1.18, .62, 1.22);
	add$1(g, new CapsuleGeometry(.011, .045, 4, 8), skin, 0, .006, -.032, Math.PI / 2).scale.set(1, 1, .9);
	add$1(g, new CapsuleGeometry(.014, .035, 4, 8), skin, -.042, -.012, -.006, 1.18, .1, -.58);
	const cuff = add$1(g, new CylinderGeometry(.029, .036, .075, 10), sleeve, .035, -.077, .13, 1.12, .08, .32);
	cuff.scale.z = .9;
	const arm = add$1(g, new CylinderGeometry(.026, .034, .2, 10), sleeve, .064, -.13, .235, 1.12, .08, .32);
	arm.castShadow = false;
	g.userData.lens = glass;
	g.userData.torch = torch;
	g.position.set(.22, -.3, -.46);
	g.rotation.set(-.08, .16, .05);
	g.traverse((obj) => {
		obj.frustumCulled = false;
	});
	return g;
}
function buildPlayerBody() {
	const g = new Group();
	g.name = "player-body";
	const skin = mat$2(SKIN);
	const shirt = mat$2(SHIRT);
	const shorts = mat$2(SHORTS);
	const hair = mat$2(HAIR);
	const shoes = mat$2(2765356);
	add$1(g, new CylinderGeometry(.09, .1, .42, 8), shorts, 0, .72, 0);
	add$1(g, new CylinderGeometry(.12, .14, .48, 8), shirt, 0, 1.12, 0);
	add$1(g, new SphereGeometry(.13, 10, 8), skin, 0, 1.48, 0);
	add$1(g, new SphereGeometry(.135, 10, 8), hair, 0, 1.54, -.01);
	add$1(g, new CylinderGeometry(.045, .05, .46, 6), skin, -.18, 1.05, 0, 0, 0, .12);
	add$1(g, new CylinderGeometry(.045, .05, .46, 6), skin, .18, 1.05, 0, 0, 0, -.12);
	add$1(g, new CylinderGeometry(.048, .055, .52, 6), skin, -.07, .38, 0);
	add$1(g, new CylinderGeometry(.048, .055, .52, 6), skin, .07, .38, 0);
	add$1(g, new BoxGeometry(.09, .05, .16), shoes, -.07, .1, .02);
	add$1(g, new BoxGeometry(.09, .05, .16), shoes, .07, .1, .02);
	const torch = new Group();
	const metal = mat$2(FLASH_BODY, {
		metalness: .48,
		roughness: .38
	});
	const lens = mat$2(FLASH_LENS, {
		emissive: FLASH_LENS,
		emissiveIntensity: .2
	});
	add$1(torch, alongNegZ(new CylinderGeometry(.025, .03, .18, 8)), metal, 0, 0, 0);
	const glass = add$1(torch, alongNegZ(new CylinderGeometry(.022, .022, .02, 8)), lens, 0, 0, -.1);
	torch.position.set(.28, 1.02, -.16);
	torch.rotation.set(-.18, .05, .12);
	g.add(torch);
	g.userData.lens = glass;
	g.userData.torch = torch;
	g.visible = false;
	return g;
}
function makeFlashlight() {
	const light = new SpotLight(16770244, 0, 22, .68, .5, 1.05);
	light.castShadow = false;
	const fill = new PointLight(16771280, 0, 14, 1.35);
	fill.castShadow = false;
	return {
		light,
		fill
	};
}
var ZONES = [
	{
		id: "central",
		name: "Liwasan",
		tagalog: "Liwasan",
		blurb: "The courtyard. Fountain, jeepney, the old heart of the grounds.",
		x: 0,
		z: 0,
		radius: 32,
		color: "#9fb8a6"
	},
	{
		id: "research",
		name: "Greenhouse",
		tagalog: "Hardin ng Salamin",
		blurb: "Glass and soil. Lola used to catalogue the orchids here.",
		x: 8,
		z: -82,
		radius: 28,
		color: "#7a9e7e"
	},
	{
		id: "forest",
		name: "Kakahuyan",
		tagalog: "Kakahuyan",
		blurb: "A canopy over the service path. Watch the roots.",
		x: 86,
		z: 6,
		radius: 34,
		color: "#5f8a62"
	},
	{
		id: "maintenance",
		name: "Talyer",
		tagalog: "Talyer",
		blurb: "Warm timber, leftover tools, the smell of oil.",
		x: 18,
		z: 74,
		radius: 24,
		color: "#8a7a58"
	},
	{
		id: "flooded",
		name: "Linaw",
		tagalog: "Poso't Palayan",
		blurb: "Still water and a weathered dock.",
		x: -72,
		z: 58,
		radius: 30,
		color: "#4f7f8a"
	},
	{
		id: "energy",
		name: "Gilingan",
		tagalog: "Gilingan ng Ilaw",
		blurb: "The mill that used to keep the paths lit.",
		x: -88,
		z: -12,
		radius: 28,
		color: "#a09068"
	},
	{
		id: "mountain",
		name: "Burol",
		tagalog: "Hardin sa Burol",
		blurb: "Wind, thyme, a view of everything.",
		x: 74,
		z: -74,
		radius: 32,
		color: "#b8c4b0"
	},
	{
		id: "shelter",
		name: "Pahingahan",
		tagalog: "Pahingahan",
		blurb: "A dome for sitting out a shower.",
		x: 78,
		z: 72,
		radius: 24,
		color: "#8aa99a"
	},
	{
		id: "restricted",
		name: "Hardin na Bakod",
		tagalog: "Hardin na Nakapinid",
		blurb: "Hedges and a gate that no longer locks.",
		x: -52,
		z: -88,
		radius: 26,
		color: "#6a8a6e"
	},
	{
		id: "extraction",
		name: "Tanawan",
		tagalog: "Tanawan",
		blurb: "The northern pad. Best sunset on the grounds.",
		x: 0,
		z: -126,
		radius: 20,
		color: "#9fb8a6"
	}
];
var ITEM_INFO = {
	old_key: {
		name: "Old Key",
		blurb: "Warm brass, teeth worn smooth. Susi ni Lolo.",
		hint: "Pick up Old Key"
	},
	camera: {
		name: "Camera",
		blurb: "A compact film camera, still loaded.",
		hint: "Pick up Camera"
	},
	notebook: {
		name: "Notebook",
		blurb: "Pressed flowers between the pages.",
		hint: "Pick up Notebook"
	},
	battery: {
		name: "Battery",
		blurb: "Still has a little charge. For the lamp.",
		hint: "Pick up Battery"
	},
	backpack: {
		name: "Backpack",
		blurb: "Canvas, sun-faded, a trail of dust.",
		hint: "Pick up Backpack"
	},
	tsinelas: {
		name: "Tsinelas",
		blurb: "One pair, still warm from the porch.",
		hint: "Pick up Tsinelas"
	},
	payong: {
		name: "Payong",
		blurb: "Folded umbrella. Always raining somewhere.",
		hint: "Pick up Payong"
	},
	liham: {
		name: "Liham",
		blurb: "A letter, never sent. Don't open it.",
		hint: "Pick up Letter"
	},
	radio: {
		name: "Radio",
		blurb: "AM crackle. Someone left the volume low.",
		hint: "Pick up Radio"
	},
	lantern: {
		name: "Lantern",
		blurb: "Kerosene lamp. Glass still clear.",
		hint: "Pick up Lantern"
	},
	salamin: {
		name: "Salamin",
		blurb: "Reading glasses, slightly bent.",
		hint: "Pick up Glasses"
	},
	baon: {
		name: "Baon",
		blurb: "A tin lunchbox. Empty, thankfully.",
		hint: "Pick up Lunchbox"
	},
	abaniko: {
		name: "Abaniko",
		blurb: "A folding fan. Still smells like sampaguita.",
		hint: "Pick up Fan"
	},
	rosaryo: {
		name: "Rosaryo",
		blurb: "Wooden beads, a little worn.",
		hint: "Pick up Rosary"
	},
	tabo: {
		name: "Tabo",
		blurb: "Plastic dipper. Classic.",
		hint: "Pick up Tabo"
	},
	compass: {
		name: "Compass",
		blurb: "The needle still finds north.",
		hint: "Pick up Compass"
	},
	sombrero: {
		name: "Sombrero",
		blurb: "A wide hat for the hill garden.",
		hint: "Pick up Hat"
	},
	flashlight: {
		name: "Flashlight",
		blurb: "Heavy metal torch. Batteries sold separately.",
		hint: "Pick up Flashlight"
	}
};
var TIME_PRESETS = {
	day: {
		label: "Araw",
		line: "Clear light. Easy walking."
	},
	sunset: {
		label: "Takipsilim",
		line: "Warm sky. Paths glow."
	},
	night: {
		label: "Gabi",
		line: "Bring the lamp. Follow the lights."
	}
};
function zoneAt(x, z) {
	let best = ZONES[0];
	let bestD = Infinity;
	for (const zdef of ZONES) {
		const d = Math.hypot(x - zdef.x, z - zdef.z);
		if (d < zdef.radius * 1.15 && d < bestD) {
			best = zdef;
			bestD = d;
		}
	}
	if (bestD === Infinity) for (const zdef of ZONES) {
		const d = Math.hypot(x - zdef.x, z - zdef.z);
		if (d < bestD) {
			best = zdef;
			bestD = d;
		}
	}
	return best;
}
function dist2(ax, az, bx, bz) {
	return Math.hypot(ax - bx, az - bz);
}
function getHeight(x, z) {
	let h = Math.sin(x * .018) * 1.35 + Math.cos(z * .014) * 1.15 + Math.sin((x + z) * .011) * .7 + Math.sin(x * .33) * Math.cos(z * .29) * .16 + Math.sin(x * .9 + z * .6) * .05;
	const mountain = dist2(x, z, 74, -74);
	if (mountain < 58) {
		const t = 1 - mountain / 58;
		h += t * t * 26;
	}
	const flood = dist2(x, z, -72, 58);
	if (flood < 38) h -= (1 - flood / 38) * 3.6;
	const pit = dist2(x, z, 18, 74);
	if (pit < 18) h -= (1 - pit / 18) * 4.5;
	const central = dist2(x, z, 0, 0);
	if (central < 34) {
		const t = 1 - central / 34;
		h = h * (1 - t) + .18 * t;
	}
	const ext = dist2(x, z, 0, -126);
	if (ext < 20) h = 7.5 + (1 - ext / 20) * 3.5;
	if (dist2(x, z, 8, -82) < 22) h = h * .35 + .4;
	const pd = pathDist(x, z);
	if (pd < 2.4 && central > 18) h -= (1 - pd / 2.4) * .07;
	return h;
}
var PATHS = [
	[
		0,
		0,
		86,
		6
	],
	[
		0,
		0,
		8,
		-82
	],
	[
		0,
		0,
		-72,
		58
	],
	[
		0,
		0,
		-88,
		-12
	],
	[
		0,
		0,
		18,
		74
	],
	[
		0,
		0,
		78,
		72
	],
	[
		8,
		-82,
		74,
		-74
	],
	[
		8,
		-82,
		0,
		-126
	],
	[
		-88,
		-12,
		-52,
		-88
	],
	[
		86,
		6,
		78,
		72
	]
];
function distToSegment(px, pz, ax, az, bx, bz) {
	const abx = bx - ax;
	const abz = bz - az;
	const len2 = abx * abx + abz * abz || 1;
	let t = ((px - ax) * abx + (pz - az) * abz) / len2;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}
function pathDist(x, z) {
	let best = 99;
	for (const [ax, az, bx, bz] of PATHS) {
		const d = distToSegment(x, z, ax, az, bx, bz);
		if (d < best) best = d;
	}
	return best;
}
var residentialBuildingCache = null;
function residentialBuildings() {
	residentialBuildingCache ??= generateBuildings().filter((b) => b.kind === "house" || b.kind === "kubo");
	return residentialBuildingCache;
}
function indoorAt(x, z) {
	if (Math.abs(x - 0) < 5.5 && Math.abs(z - 18) < 4.6) return true;
	if (Math.abs(x - 0) < 8.2 && Math.abs(z + 82) < 4.4) return true;
	for (const b of residentialBuildings()) {
		const dx = x - b.x;
		const dz = z - b.z;
		const yaw = b.yaw ?? 0;
		const localX = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
		const localZ = Math.sin(yaw) * dx + Math.cos(yaw) * dz;
		if (Math.abs(localX) < b.w / 2 - .45 && Math.abs(localZ) < b.d / 2 - .45) return true;
	}
	return false;
}
function surfaceAt(x, z) {
	if (indoorAt(x, z)) return "wood";
	if (pathDist(x, z) < 2.05) return "dirt";
	if (dist2(x, z, 0, 0) < 15) return "stone";
	if (dist2(x, z, 0, -126) < 12) return "stone";
	const h = getHeight(x, z);
	if (h < 1.22 && dist2(x, z, -72, 58) < 30) return "water";
	if (h > 16.5) return "stone";
	return "grass";
}
function biomeColor(x, z, h) {
	const zone = ZONES.reduce((best, zdef) => {
		const d = dist2(x, z, zdef.x, zdef.z) / zdef.radius;
		return d < best.d ? {
			d,
			zdef
		} : best;
	}, {
		d: 99,
		zdef: ZONES[0]
	});
	const t = Math.max(0, 1 - zone.d);
	const pal = {
		central: [
			.3,
			.34,
			.26
		],
		forest: [
			.16,
			.34,
			.16
		],
		maintenance: [
			.32,
			.28,
			.18
		],
		flooded: [
			.16,
			.28,
			.24
		],
		energy: [
			.34,
			.3,
			.2
		],
		mountain: [
			.4,
			.44,
			.34
		],
		shelter: [
			.24,
			.34,
			.22
		],
		restricted: [
			.2,
			.28,
			.18
		],
		extraction: [
			.32,
			.34,
			.3
		]
	};
	let [r, g, b] = pal[zone.zdef.id] ?? pal.central;
	r = r * (.55 + .45 * t) + .07;
	g = g * (.55 + .45 * t) + .09;
	b = b * (.55 + .45 * t) + .06;
	const n = Math.sin(x * .21) * Math.cos(z * .17) * .045;
	const n2 = Math.sin((x + z) * .53) * .03;
	r += n + n2;
	g += n * .8 + n2 * .6;
	b += n * .5;
	const pd = pathDist(x, z);
	if (pd < 2.6) {
		const k = 1 - pd / 2.6;
		const dirtK = k * k;
		r = r * (1 - dirtK) + .38 * dirtK;
		g = g * (1 - dirtK) + .27 * dirtK;
		b = b * (1 - dirtK) + .16 * dirtK;
	}
	if (h < 1.3 && dist2(x, z, -72, 58) < 34) {
		const mud = Math.min(1, (1.3 - h) * .7);
		r = r * (1 - mud) + .22 * mud;
		g = g * (1 - mud) + .24 * mud;
		b = b * (1 - mud) + .18 * mud;
	}
	if (h > 16) {
		const snow = Math.min(1, (h - 16) / 12);
		r = r * (1 - snow) + .78 * snow;
		g = g * (1 - snow) + .82 * snow;
		b = b * (1 - snow) + .72 * snow;
	}
	return [
		r,
		g,
		b
	];
}
function rng$1(seed) {
	let s = seed >>> 0;
	return () => {
		s = s * 1664525 + 1013904223 >>> 0;
		return s / 4294967296;
	};
}
function generateTrees() {
	const rand = rng$1(90210);
	const out = [];
	for (let i = 0; i < 250; i++) {
		const x = (rand() * 2 - 1) * 138;
		const z = (rand() * 2 - 1) * 138;
		const dC = dist2(x, z, 0, 0);
		const dF = dist2(x, z, 86, 6);
		const dR = dist2(x, z, -52, -88);
		const forest = dF < 42 ? 1 : dR < 22 ? .55 : .14;
		if (dC < 22) continue;
		if (dist2(x, z, 0, -126) < 16) continue;
		if (pathDist(x, z) < 2.6) continue;
		if (rand() > forest) continue;
		if (getHeight(x, z) < .3) continue;
		out.push({
			x,
			z,
			s: .65 + rand() * 1.05,
			kind: rand() > .45 ? "oak" : "pine"
		});
	}
	return out;
}
function generateRocks() {
	const rand = rng$1(4242);
	const out = [];
	for (let i = 0; i < 110; i++) {
		const x = (rand() * 2 - 1) * 138;
		const z = (rand() * 2 - 1) * 138;
		if (dist2(x, z, 0, 0) < 18) continue;
		if (pathDist(x, z) < 1.6) continue;
		const mountain = dist2(x, z, 74, -74) < 40 ? 1.4 : 1;
		out.push({
			x,
			z,
			s: (.35 + rand() * 1.25) * mountain
		});
	}
	return out;
}
function generateBushes() {
	const rand = rng$1(777);
	const out = [];
	for (let i = 0; i < 110; i++) {
		const x = (rand() * 2 - 1) * 138 * .85;
		const z = (rand() * 2 - 1) * 138 * .85;
		if (dist2(x, z, 0, 0) < 12) continue;
		if (pathDist(x, z) < 2) continue;
		if (getHeight(x, z) < .2) continue;
		out.push({
			x,
			z,
			s: .5 + rand() * .85
		});
	}
	return out;
}
function generateGrass() {
	const rand = rng$1(3331);
	const out = [];
	for (let i = 0; i < 980; i++) {
		const x = (rand() * 2 - 1) * 138 * .9;
		const z = (rand() * 2 - 1) * 138 * .9;
		const pd = pathDist(x, z);
		if (pd < 1.35) continue;
		const h = getHeight(x, z);
		if (h < .25 || h > 18) continue;
		if (dist2(x, z, -72, 58) < 22) continue;
		if (dist2(x, z, 0, 0) < 10) continue;
		const nearPath = pd < 4.5 ? 1.15 : 1;
		const nearForest = dist2(x, z, 86, 6) < 40 ? 1.1 : .85;
		if (rand() > nearPath * nearForest * .92) continue;
		out.push({
			x,
			z,
			s: .55 + rand() * .85
		});
	}
	return out;
}
function generateFlowers() {
	const rand = rng$1(1919);
	const cols = [
		15918808,
		14263200,
		15258762,
		13227752,
		14206176
	];
	const beds = [
		[
			6,
			4,
			8
		],
		[
			-8,
			6,
			7
		],
		[
			4,
			-8,
			6
		],
		[
			78,
			68,
			10
		],
		[
			70,
			-70,
			9
		],
		[
			82,
			2,
			8
		],
		[
			-48,
			-84,
			8
		]
	];
	const out = [];
	for (const [cx, cz, rad] of beds) for (let i = 0; i < 26; i++) {
		const a = rand() * Math.PI * 2;
		const r = rand() * rad;
		const x = cx + Math.cos(a) * r;
		const z = cz + Math.sin(a) * r;
		if (pathDist(x, z) < 1.2) continue;
		out.push({
			x,
			z,
			s: .35 + rand() * .35,
			c: cols[rand() * cols.length | 0]
		});
	}
	return out;
}
function generatePoles() {
	return [
		{
			x: 14,
			z: -4
		},
		{
			x: -14,
			z: 6
		},
		{
			x: 22,
			z: 18
		},
		{
			x: -24,
			z: -8
		},
		{
			x: 6,
			z: 28
		},
		{
			x: 40,
			z: 8
		},
		{
			x: -36,
			z: 20
		},
		{
			x: 8,
			z: -28
		}
	];
}
function generateLamps() {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (x, z) => {
		const k = `${Math.round(x / 4)}_${Math.round(z / 4)}`;
		if (seen.has(k)) return;
		seen.add(k);
		if (dist2(x, z, 0, 0) < 6) return;
		out.push({
			x,
			z
		});
	};
	for (const [ax, az, bx, bz] of PATHS) {
		const d = Math.hypot(bx - ax, bz - az);
		const n = Math.max(2, Math.floor(d / 30));
		for (let i = 1; i < n; i++) {
			const t = i / n;
			add(ax + (bx - ax) * t, az + (bz - az) * t);
		}
	}
	add(8, 10);
	add(-10, -6);
	add(0, -126);
	return out.slice(0, 14);
}
function generateBenches() {
	return [
		{
			x: 10,
			z: 6,
			yaw: -.4
		},
		{
			x: -12,
			z: 4,
			yaw: .8
		},
		{
			x: 6,
			z: -10,
			yaw: .1
		},
		{
			x: 84,
			z: 68,
			yaw: .6
		},
		{
			x: -60,
			z: 50,
			yaw: 1.2
		},
		{
			x: 16,
			z: -78,
			yaw: 0
		},
		{
			x: 66,
			z: -66,
			yaw: -.5
		},
		{
			x: -8,
			z: -122,
			yaw: 0
		}
	];
}
function generateFences() {
	const out = [];
	const ring = [
		{
			x: 16,
			z: -16,
			yaw: 0,
			len: 10
		},
		{
			x: -16,
			z: -16,
			yaw: 0,
			len: 10
		},
		{
			x: 20,
			z: 0,
			yaw: Math.PI / 2,
			len: 12
		},
		{
			x: -20,
			z: 0,
			yaw: Math.PI / 2,
			len: 12
		}
	];
	out.push(...ring);
	out.push({
		x: 74,
		z: 64,
		yaw: .4,
		len: 8
	});
	out.push({
		x: -64,
		z: 44,
		yaw: 1.1,
		len: 7
	});
	return out;
}
function generateSigns() {
	return ZONES.map((z) => ({
		x: z.x + 6,
		z: z.z + 4,
		yaw: Math.atan2(-(z.x + 6), -(z.z + 4)),
		label: z.tagalog
	}));
}
function generateClues() {
	const at = (id, x, z, hint, line) => ({
		id,
		x,
		z,
		y: getHeight(x, z) + .9,
		hint,
		line
	});
	return [
		at("clue_jeep", 17.4, -2.8, "Look at the jeepney", "Lolo's jeepney. Chrome still catches the afternoon."),
		at("clue_well", -7.6, 11.2, "Look at the well", "The well still holds water. Someone kept the rope."),
		at("clue_fountain", 0, -2, "Look at the fountain", "Coins at the bottom. Nobody threw them recently."),
		at("clue_line", 12.4, 14.2, "Look at the clothesline", "Laundry left to dry. The wind has been kind."),
		at("clue_table", 8.6, 10.4, "Look at the table", "Two chairs. One cup ring in the wood."),
		at("clue_boat", -62, 56, "Look at the bangka", "A bangka tied to a dock that has seen better seasons."),
		at("clue_mill", -90, -10, "Look at the mill", "The mill that used to keep the paths lit. Quiet now."),
		at("clue_house", 0, 13.2, "Look at the doorway", "The ancestral house is open. Shoes still wait on the porch."),
		at("clue_gate", -52, -78, "Look at the gate", "A gate that no longer locks. The garden went on without it."),
		at("clue_stump", 90.8, 10.2, "Look at the stump", "A cut tree, older than the path. Moss taking its time.")
	];
}
function generateBuildings() {
	const B = [];
	const add = (b) => B.push(b);
	add({
		id: "hub_pad",
		x: 0,
		z: 0,
		w: 28,
		d: 28,
		h: .28,
		color: 4870728,
		kind: "pad",
		collides: false
	});
	add({
		id: "hub_house",
		x: 0,
		z: 18,
		w: 12,
		d: 10,
		h: 5.2,
		color: 6969924,
		roof: 9060400,
		kind: "house",
		collides: false,
		enterable: true,
		emissive: 10467494,
		roofStyle: "hip",
		porch: true,
		fixture: "hanging",
		lightIntensity: 4
	});
	add({
		id: "fountain",
		x: 0,
		z: -2,
		w: 4.2,
		d: 4.2,
		h: .7,
		color: 6976364,
		kind: "block"
	});
	add({
		id: "sari_sari",
		x: -18,
		z: 8,
		w: 6.4,
		d: 5.2,
		h: 3.6,
		color: 5917240,
		roof: 3828296,
		kind: "store",
		emissive: 12886362
	});
	[
		{
			id: "bakuran_a",
			x: 32.5,
			z: 18.5,
			w: 8.4,
			d: 7.2,
			h: 4.5,
			color: 9139804,
			roof: 6702906,
			kind: "house",
			collides: true,
			roofStyle: "gable",
			porch: true,
			fixture: "hanging",
			lightIntensity: 3.4,
			yaw: .08
		},
		{
			id: "bakuran_b",
			x: 47,
			z: -4,
			w: 7.4,
			d: 8.2,
			h: 4.1,
			color: 10128242,
			roof: 5398872,
			kind: "house",
			collides: true,
			roofStyle: "hip",
			porch: true,
			fixture: "lantern",
			yaw: -.18
		},
		{
			id: "bakuran_c",
			x: 65,
			z: 12,
			w: 10.2,
			d: 8.6,
			h: 5.1,
			color: 7830376,
			roof: 7358522,
			kind: "house",
			collides: true,
			roofStyle: "gable",
			porch: true,
			fixture: "wall",
			lightIntensity: 4.2,
			yaw: .12
		},
		{
			id: "bakuran_d",
			x: -36,
			z: -17,
			w: 8.8,
			d: 7.4,
			h: 4.7,
			color: 9270359,
			roof: 5593677,
			kind: "house",
			collides: true,
			roofStyle: "hip",
			porch: false,
			fixture: "covered",
			yaw: .2
		},
		{
			id: "bakuran_e",
			x: -57,
			z: 1,
			w: 7.2,
			d: 8.6,
			h: 4.2,
			color: 7830376,
			roof: 6899514,
			kind: "house",
			collides: true,
			roofStyle: "gable",
			porch: true,
			fixture: "lantern",
			yaw: -.12
		},
		{
			id: "bakuran_f",
			x: -29,
			z: 35.5,
			w: 9.6,
			d: 7.8,
			h: 4.9,
			color: 9864555,
			roof: 5464406,
			kind: "house",
			collides: true,
			roofStyle: "hip",
			porch: true,
			fixture: "hanging",
			lightIntensity: 3,
			yaw: .24
		},
		{
			id: "bakuran_g",
			x: 22,
			z: 47,
			w: 7.6,
			d: 7.1,
			h: 4,
			color: 8746079,
			roof: 7359293,
			kind: "house",
			collides: true,
			roofStyle: "gable",
			porch: false,
			fixture: "wall",
			yaw: -.16
		},
		{
			id: "bakuran_h",
			x: 50.5,
			z: 59.5,
			w: 10.4,
			d: 8,
			h: 5,
			color: 10128242,
			roof: 5857362,
			kind: "house",
			collides: true,
			roofStyle: "gable",
			porch: true,
			fixture: "covered",
			lightIntensity: 3.8,
			yaw: .14
		},
		{
			id: "bakuran_i",
			x: -70,
			z: -20,
			w: 7.8,
			d: 8.4,
			h: 4.3,
			color: 7695708,
			roof: 6506043,
			kind: "house",
			collides: true,
			roofStyle: "hip",
			porch: true,
			fixture: "lantern",
			yaw: -.22
		}
	].forEach(add);
	add({
		id: "lab_a",
		x: 0,
		z: -82,
		w: 18,
		d: 10,
		h: 5.4,
		color: 3820096,
		roof: 9087386,
		emissive: 7318906,
		kind: "greenhouse"
	});
	add({
		id: "lab_b",
		x: 14,
		z: -90,
		w: 8,
		d: 12,
		h: 6.5,
		color: 3293240,
		roof: 4872776,
		kind: "workshop"
	});
	add({
		id: "eng_a",
		x: -90,
		z: -10,
		w: 10,
		d: 14,
		h: 6,
		color: 4866096,
		roof: 5917752,
		emissive: 12886362,
		kind: "mill"
	});
	add({
		id: "flood_shed",
		x: -69.5,
		z: 48,
		w: 7,
		d: 5.5,
		h: 3.6,
		color: 3820100,
		roof: 4872776,
		kind: "kubo",
		fixture: "lantern",
		lightIntensity: 2.5
	});
	add({
		id: "flood_dock",
		x: -62,
		z: 56,
		w: 8,
		d: 2.4,
		h: .35,
		color: 5916212,
		kind: "pad",
		collides: false
	});
	add({
		id: "mnt_hut",
		x: 68,
		z: -68,
		w: 6,
		d: 6,
		h: 3.8,
		y: 18,
		color: 5919304,
		roof: 6968132,
		kind: "kubo",
		fixture: "covered",
		lightIntensity: 1.8
	});
	add({
		id: "sh_dome",
		x: 78,
		z: 72,
		w: 12,
		d: 12,
		h: 5.5,
		color: 4871244,
		emissive: 7318906,
		kind: "dome"
	});
	add({
		id: "sh_annex",
		x: 88,
		z: 68,
		w: 6,
		d: 7,
		h: 3.2,
		color: 4081726,
		roof: 4871244,
		kind: "workshop"
	});
	add({
		id: "rest_wall_a",
		x: -40,
		z: -78,
		w: 18,
		d: .7,
		h: 2.8,
		color: 3820092,
		kind: "wall"
	});
	add({
		id: "rest_wall_b",
		x: -62,
		z: -78,
		w: 18,
		d: .7,
		h: 2.8,
		color: 3820092,
		kind: "wall"
	});
	add({
		id: "rest_lab",
		x: -52,
		z: -96,
		w: 12,
		d: 9,
		h: 5.5,
		color: 3293236,
		roof: 4872768,
		emissive: 6982254,
		kind: "house",
		roofStyle: "gable",
		porch: true,
		fixture: "wall",
		lightIntensity: 1.8
	});
	add({
		id: "rest_gate",
		x: -52,
		z: -78,
		w: 6,
		d: .6,
		h: 3.2,
		color: 5917240,
		kind: "wall",
		collides: false
	});
	add({
		id: "ext_pad",
		x: 0,
		z: -126,
		w: 16,
		d: 16,
		h: .45,
		y: 8,
		color: 4871248,
		kind: "pad",
		collides: false
	});
	add({
		id: "maint_box",
		x: 26,
		z: 80,
		w: 6,
		d: 8,
		h: 4.4,
		color: 4866096,
		roof: 5917752,
		kind: "workshop"
	});
	add({
		id: "maint_shed",
		x: 12,
		z: 70.5,
		w: 5,
		d: 5,
		h: 3.2,
		color: 4077608,
		roof: 4866096,
		kind: "kubo",
		fixture: "hanging",
		lightIntensity: 2.4
	});
	add({
		id: "for_shack",
		x: 91,
		z: 3,
		w: 5,
		d: 5,
		h: 3.2,
		color: 3820084,
		roof: 4872760,
		kind: "kubo",
		fixture: "wall",
		lightIntensity: 2.1
	});
	return B;
}
function wallAabb(id, cx, cz, w, d, y0, h) {
	return {
		id,
		minX: cx - w / 2,
		maxX: cx + w / 2,
		minZ: cz - d / 2,
		maxZ: cz + d / 2,
		minY: y0,
		maxY: y0 + h
	};
}
function houseWallAabbs() {
	const out = [];
	const thickness = .45;
	for (const b of residentialBuildings()) {
		const yaw = b.yaw ?? 0;
		const cosine = Math.cos(yaw);
		const sine = Math.sin(yaw);
		const y0 = b.y ?? getHeight(b.x, b.z);
		const doorWidth = b.kind === "kubo" ? 1.3 : 1.8;
		const doorX = b.kind === "kubo" ? b.w * .18 : 0;
		const leftWidth = Math.max(.1, doorX - doorWidth / 2 + b.w / 2);
		const rightWidth = Math.max(.1, b.w / 2 - doorX - doorWidth / 2);
		const addWall = (id, localX, localZ, width, depth) => {
			const cx = b.x + cosine * localX + sine * localZ;
			const cz = b.z - sine * localX + cosine * localZ;
			const halfX = (Math.abs(cosine) * width + Math.abs(sine) * depth) / 2;
			const halfZ = (Math.abs(sine) * width + Math.abs(cosine) * depth) / 2;
			out.push(wallAabb(id, cx, cz, halfX * 2, halfZ * 2, y0, b.h));
		};
		addWall(`${b.id}_back`, 0, b.d / 2 - thickness / 2, b.w, thickness);
		addWall(`${b.id}_left`, -b.w / 2 + thickness / 2, 0, thickness, b.d);
		addWall(`${b.id}_right`, b.w / 2 - thickness / 2, 0, thickness, b.d);
		addWall(`${b.id}_front_left`, -b.w / 2 + leftWidth / 2, -b.d / 2 + thickness / 2, leftWidth, thickness);
		addWall(`${b.id}_front_right`, b.w / 2 - rightWidth / 2, -b.d / 2 + thickness / 2, rightWidth, thickness);
	}
	return out;
}
function buildingAabbs(buildings) {
	return buildings.filter((b) => b.collides !== false && b.kind !== "pad" && b.kind !== "house" && b.kind !== "kubo").map((b) => {
		const y0 = b.y ?? getHeight(b.x, b.z);
		const yaw = b.yaw ?? 0;
		const halfX = (Math.abs(Math.cos(yaw)) * b.w + Math.abs(Math.sin(yaw)) * b.d) / 2;
		const halfZ = (Math.abs(Math.sin(yaw)) * b.w + Math.abs(Math.cos(yaw)) * b.d) / 2;
		return {
			id: b.id,
			minX: b.x - halfX,
			maxX: b.x + halfX,
			minZ: b.z - halfZ,
			maxZ: b.z + halfZ,
			minY: y0,
			maxY: y0 + b.h
		};
	});
}
function extraAabbs() {
	const out = [...houseWallAabbs()];
	for (const b of generateBenches()) {
		const y0 = getHeight(b.x, b.z);
		out.push({
			id: `bench_${b.x}`,
			minX: b.x - .9,
			maxX: b.x + .9,
			minZ: b.z - .4,
			maxZ: b.z + .4,
			minY: y0,
			maxY: y0 + .7
		});
	}
	for (const l of generateLamps()) {
		const y0 = getHeight(l.x, l.z);
		out.push({
			id: `lamp_${l.x}_${l.z}`,
			minX: l.x - .22,
			maxX: l.x + .22,
			minZ: l.z - .22,
			maxZ: l.z + .22,
			minY: y0,
			maxY: y0 + 3.4
		});
	}
	out.push({
		id: "jeepney",
		minX: 14.2,
		maxX: 20.6,
		minZ: -4.4,
		maxZ: -1.2,
		minY: 0,
		maxY: 2.6
	});
	out.push({
		id: "well",
		minX: -8.6,
		maxX: -6.6,
		minZ: 10.2,
		maxZ: 12.2,
		minY: 0,
		maxY: 1.4
	});
	return out;
}
function generateInteractables(level) {
	return level.items.map((it) => ({
		id: it.id,
		name: it.name,
		x: it.x,
		z: it.z,
		y: getHeight(it.x, it.z) + .85,
		zone: it.zone,
		hint: it.hint
	}));
}
var PLAYER_R = .45;
function resolveCollision(x, z, y, aabbs) {
	let nx = x;
	let nz = z;
	for (const b of aabbs) {
		if (y + .4 < b.minY || y > b.maxY + .2) continue;
		const minX = b.minX - PLAYER_R;
		const maxX = b.maxX + PLAYER_R;
		const minZ = b.minZ - PLAYER_R;
		const maxZ = b.maxZ + PLAYER_R;
		if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
			const dxL = nx - minX;
			const dxR = maxX - nx;
			const dzB = nz - minZ;
			const dzF = maxZ - nz;
			const m = Math.min(dxL, dxR, dzB, dzF);
			if (m === dxL) nx = minX;
			else if (m === dxR) nx = maxX;
			else if (m === dzB) nz = minZ;
			else nz = maxZ;
		}
	}
	nx = Math.max(-138, Math.min(138, nx));
	nz = Math.max(-138, Math.min(138, nz));
	return {
		x: nx,
		z: nz
	};
}
var dummy = new Object3D();
var _col = new Color();
function rng(seed) {
	let s = seed >>> 0;
	return () => {
		s = s * 1664525 + 1013904223 >>> 0;
		return s / 4294967296;
	};
}
/** World-scale instancing must not frustum-cull against the local geometry at the origin. */
function finishInstanced(mesh) {
	mesh.instanceMatrix.needsUpdate = true;
	if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	mesh.computeBoundingSphere();
	mesh.frustumCulled = false;
	return mesh;
}
function buildTrees(quality) {
	const trees = generateTrees();
	const pines = trees.filter((t) => t.kind === "pine");
	const oaks = trees.filter((t) => t.kind === "oak");
	const tex = getTextures();
	const trunkGeo = new CylinderGeometry(.14, .22, 2.4, 6);
	const trunkMat = new MeshStandardMaterial({
		map: tex.wood,
		color: 5916212,
		roughness: .95,
		metalness: .02
	});
	const pineLeafGeo = new ConeGeometry(1.05, 2.6, 7);
	const oakLeafGeo = new SphereGeometry(1.18, 7, 6);
	const pineMat = applyWind(new MeshStandardMaterial({
		color: 3102264,
		roughness: .88,
		metalness: 0
	}), .4, false);
	const oakMat = applyWind(new MeshStandardMaterial({
		color: 3828288,
		roughness: .86,
		metalness: 0
	}), .5, false);
	const plant = (list, leafGeo, lmat, leafY, tint) => {
		const out = [];
		if (!list.length) return out;
		const trunks = new InstancedMesh(trunkGeo, trunkMat, list.length);
		const leaves = new InstancedMesh(leafGeo, lmat, list.length);
		leaves.instanceColor = new InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
		list.forEach((t, i) => {
			const y = getHeight(t.x, t.z);
			dummy.position.set(t.x, y + 1.15 * t.s, t.z);
			dummy.scale.set(t.s * (.92 + t.x % 1 * .08), t.s, t.s * (.92 + t.z % 1 * .08));
			dummy.rotation.set(t.z * .01 % .08, t.x * 1.7, t.x * .01 % .07);
			dummy.updateMatrix();
			trunks.setMatrixAt(i, dummy.matrix);
			dummy.position.set(t.x, y + leafY * t.s, t.z);
			dummy.updateMatrix();
			leaves.setMatrixAt(i, dummy.matrix);
			_col.setHex(tint);
			_col.offsetHSL(t.x * .02 % .06 - .03, 0, t.z * .03 % .16 - .08);
			leaves.setColorAt(i, _col);
		});
		trunks.castShadow = quality !== "low";
		leaves.castShadow = quality !== "low";
		trunks.receiveShadow = true;
		leaves.receiveShadow = true;
		finishInstanced(trunks);
		finishInstanced(leaves);
		out.push(trunks, leaves);
		return out;
	};
	return [...plant(pines, pineLeafGeo, pineMat, 2.6, 3102264), ...plant(oaks, oakLeafGeo, oakMat, 2.38, 3828288)];
}
function buildRocks() {
	const rocks = generateRocks();
	const tex = getTextures();
	const geo = new IcosahedronGeometry(.7, 0);
	const mat = new MeshStandardMaterial({
		map: tex.stone,
		color: 9080968,
		roughness: .96,
		metalness: .04,
		flatShading: true
	});
	const mesh = new InstancedMesh(geo, mat, rocks.length);
	mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(rocks.length * 3), 3);
	rocks.forEach((r, i) => {
		dummy.position.set(r.x, getHeight(r.x, r.z) + .16 * r.s, r.z);
		dummy.scale.set(r.s * (.8 + r.x % 1 * .4), r.s * (.55 + r.z % 1 * .5), r.s);
		dummy.rotation.set(r.s * 1.2, r.x * .4, r.z * .3);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
		_col.setHex(6976104);
		_col.offsetHSL(0, 0, r.x * 13 % 1 * .12 - .06);
		mesh.setColorAt(i, _col);
	});
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return finishInstanced(mesh);
}
function buildBushes() {
	const bushes = generateBushes();
	const geo = new SphereGeometry(.7, 6, 5);
	const mat = applyWind(new MeshStandardMaterial({
		color: 2771506,
		roughness: .94,
		metalness: 0
	}), .32, false);
	const mesh = new InstancedMesh(geo, mat, bushes.length);
	mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(bushes.length * 3), 3);
	bushes.forEach((b, i) => {
		dummy.position.set(b.x, getHeight(b.x, b.z) + .38 * b.s, b.z);
		dummy.scale.set(b.s * 1.05, b.s * .72, b.s * .95);
		dummy.rotation.set(.05, b.x * 2.1, -.04);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
		_col.setHex(2771506);
		_col.offsetHSL(0, 0, b.z * 9 % 1 * .14 - .07);
		mesh.setColorAt(i, _col);
	});
	mesh.castShadow = true;
	return finishInstanced(mesh);
}
function buildGrass(quality) {
	const count = quality === "low" ? 280 : quality === "medium" ? 620 : 900;
	const grass = generateGrass().slice(0, count);
	const tex = getTextures();
	const geo = new PlaneGeometry(.42, .58);
	geo.translate(0, .29, 0);
	const useA2c = quality !== "low";
	const mat = applyWind(new MeshStandardMaterial({
		map: tex.grassBlade,
		color: 13164720,
		roughness: .95,
		metalness: 0,
		alphaTest: useA2c ? .28 : .52,
		alphaToCoverage: useA2c,
		side: 2,
		depthWrite: true
	}), .7, true);
	const mesh = new InstancedMesh(geo, mat, grass.length);
	grass.forEach((g, i) => {
		dummy.position.set(g.x, getHeight(g.x, g.z) + .01, g.z);
		dummy.scale.set(g.s * .9, g.s * (.85 + g.x % 1 * .4), g.s);
		dummy.rotation.set(.04, g.x * 3.7 + g.z, .03);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	});
	return finishInstanced(mesh);
}
function buildFlowers() {
	const flowers = generateFlowers();
	const geo = new SphereGeometry(.09, 5, 4);
	const mat = new MeshStandardMaterial({
		roughness: .72,
		metalness: .04
	});
	const mesh = new InstancedMesh(geo, mat, flowers.length);
	mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(flowers.length * 3), 3);
	flowers.forEach((f, i) => {
		dummy.position.set(f.x, getHeight(f.x, f.z) + .16, f.z);
		dummy.scale.setScalar(f.s);
		dummy.rotation.set(0, f.x, 0);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
		_col.setHex(f.c);
		mesh.setColorAt(i, _col);
	});
	return finishInstanced(mesh);
}
function buildLeafLitter(quality) {
	const rand = rng(4401);
	const n = quality === "low" ? 180 : quality === "medium" ? 340 : 480;
	const tex = getTextures();
	const geo = new PlaneGeometry(.28, .18);
	geo.rotateX(-Math.PI / 2);
	const mat = new MeshStandardMaterial({
		map: tex.leaf,
		color: 12886128,
		roughness: .9,
		metalness: 0,
		alphaTest: .45,
		side: 2,
		polygonOffset: true,
		polygonOffsetFactor: -2,
		polygonOffsetUnits: -2
	});
	const mesh = new InstancedMesh(geo, mat, n);
	mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(n * 3), 3);
	const oaks = generateTrees().filter((t) => t.kind === "oak");
	for (let i = 0; i < n; i++) {
		const host = oaks[rand() * oaks.length | 0] ?? {
			x: 80,
			z: 4
		};
		const a = rand() * Math.PI * 2;
		const r = .8 + rand() * 4.2;
		const x = host.x + Math.cos(a) * r;
		const z = host.z + Math.sin(a) * r;
		dummy.position.set(x, getHeight(x, z) + .045, z);
		dummy.scale.set(.7 + rand() * .8, 1, .7 + rand() * .6);
		dummy.rotation.set(0, rand() * 6.28, (rand() - .5) * .3);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
		_col.setHex(rand() > .5 ? 9067058 : rand() > .5 ? 10514488 : 6965800);
		mesh.setColorAt(i, _col);
	}
	return finishInstanced(mesh);
}
function buildTwigs(quality) {
	const rand = rng(8821);
	const n = quality === "low" ? 40 : 80;
	const tex = getTextures();
	const geo = new CylinderGeometry(.018, .028, .55, 4);
	geo.rotateZ(Math.PI / 2);
	const mat = new MeshStandardMaterial({
		map: tex.wood,
		color: 5916212,
		roughness: 1
	});
	const mesh = new InstancedMesh(geo, mat, n);
	for (let i = 0; i < n; i++) {
		const x = (rand() * 2 - 1) * 138 * .82;
		const z = (rand() * 2 - 1) * 138 * .82;
		if (pathDist(x, z) < 1.2) {
			i--;
			continue;
		}
		dummy.position.set(x, getHeight(x, z) + .035, z);
		dummy.scale.set(.6 + rand() * 1.1, 1, .6 + rand());
		dummy.rotation.set(0, rand() * 6.2, (rand() - .5) * .25);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	return finishInstanced(mesh);
}
function buildUtilityPoles() {
	const g = new Group();
	g.name = "poles";
	const tex = getTextures();
	const concrete = new MeshStandardMaterial({
		map: tex.concrete,
		color: 9080454,
		roughness: .92
	});
	const wireM = new LineBasicMaterial({
		color: 2764332,
		transparent: true,
		opacity: .55
	});
	const poles = generatePoles();
	const tops = [];
	for (const p of poles) {
		const y = getHeight(p.x, p.z);
		const pole = new Mesh(new CylinderGeometry(.07, .1, 5.4, 6), concrete);
		pole.position.set(p.x, y + 2.7, p.z);
		pole.castShadow = true;
		g.add(pole);
		const arm = new Mesh(new BoxGeometry(1.1, .06, .06), concrete);
		arm.position.set(p.x + .35, y + 5.15, p.z);
		g.add(arm);
		tops.push(new Vector3(p.x + .7, y + 5.18, p.z));
	}
	for (let i = 0; i < tops.length - 1; i++) {
		const a = tops[i];
		const b = tops[i + 1];
		const geo = new BufferGeometry().setFromPoints([
			a,
			new Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - .35, (a.z + b.z) / 2),
			b
		]);
		g.add(new Line(geo, wireM));
	}
	return g;
}
function box$1(g, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
	const m = new Mesh(new BoxGeometry(w, h, d), mat);
	m.position.set(x, y, z);
	m.rotation.set(rx, ry, rz);
	m.castShadow = true;
	m.receiveShadow = true;
	g.add(m);
	return m;
}
function buildStoryDressing(tod) {
	const g = new Group();
	g.name = "story";
	const tex = getTextures();
	const wood = new MeshStandardMaterial({
		map: tex.wood,
		color: 9071176,
		roughness: .88,
		metalness: .02
	});
	const crateM = new MeshStandardMaterial({
		map: tex.wood,
		color: 6968132,
		roughness: .9
	});
	const rust = new MeshStandardMaterial({
		map: tex.metal,
		color: 6969928,
		roughness: .55,
		metalness: .45
	});
	const clay = new MeshStandardMaterial({
		color: 9067072,
		roughness: .92,
		metalness: .02
	});
	const sack = new MeshStandardMaterial({
		color: 12891274,
		roughness: .95
	});
	const night = tod === "night";
	const place = (fn, x, z) => fn(getHeight(x, z));
	place((y) => {
		box$1(g, .7, .55, .7, crateM, -16.4, y + .32, 10.6, 0, .18, 0);
		box$1(g, .55, .42, .55, crateM, -15.7, y + .24, 11.3, 0, -.4, 0);
		const p = new Mesh(new CylinderGeometry(.16, .2, .28, 8), clay);
		p.position.set(-17.2, y + .18, 9.8);
		g.add(p);
	}, -16.4, 10.6);
	place((y) => {
		const pot = new Mesh(new CylinderGeometry(.18, .22, .32, 8), clay);
		pot.position.set(4.6, y + .18, 16.4);
		pot.rotation.z = .08;
		g.add(pot);
		const pot2 = new Mesh(new CylinderGeometry(.14, .18, .26, 8), clay);
		pot2.position.set(5.3, y + .15, 16.1);
		g.add(pot2);
		box$1(g, .12, 1.1, .12, wood, 6.2, y + .55, 15.4, .15, .4, .05);
	}, 4.6, 16.4);
	place((y) => {
		const barrel = new Mesh(new CylinderGeometry(.38, .4, .85, 10), rust);
		barrel.position.set(-86.6, y + .45, -6.4);
		g.add(barrel);
		const barrel2 = new Mesh(new CylinderGeometry(.34, .36, .7, 10), rust);
		barrel2.position.set(-85.6, y + .38, -7.2);
		barrel2.rotation.z = 1.2;
		barrel2.rotation.y = .4;
		g.add(barrel2);
		box$1(g, .9, .5, .7, crateM, -88.4, y + .28, -8.2, 0, .3, 0);
	}, -86.6, -6.4);
	place((y) => {
		const log = new Mesh(new CylinderGeometry(.22, .26, 2.4, 8), wood);
		log.rotation.z = Math.PI / 2;
		log.rotation.y = .4;
		log.position.set(92.4, y + .22, 8.6);
		g.add(log);
		const stump = new Mesh(new CylinderGeometry(.28, .32, .45, 8), wood);
		stump.position.set(90.8, y + .22, 10.2);
		g.add(stump);
	}, 92.4, 8.6);
	place((y) => {
		box$1(g, .8, .55, .6, crateM, 22.4, y + .3, 78.6, 0, .5, 0);
		const tire = new Mesh(new TorusGeometry(.32, .1, 6, 12), new MeshStandardMaterial({
			color: 1711644,
			roughness: .95
		}));
		tire.position.set(24.2, y + .32, 79.4);
		tire.rotation.x = Math.PI / 2;
		tire.rotation.z = .3;
		g.add(tire);
	}, 22.4, 78.6);
	place((y) => {
		box$1(g, .5, .18, .7, wood, -64.2, y + .14, 54.4, 0, .6, 0);
		const coil = new Mesh(new TorusGeometry(.22, .05, 6, 10), wood);
		coil.position.set(-63.4, y + .08, 55.2);
		coil.rotation.x = Math.PI / 2;
		g.add(coil);
	}, -64.2, 54.4);
	place((y) => {
		const bag = new Mesh(new SphereGeometry(.28, 6, 5), sack);
		bag.scale.set(1, .75, .9);
		bag.position.set(-50.4, y + .18, -90.6);
		g.add(bag);
		const shard = new Mesh(new CylinderGeometry(.12, .16, .1, 7), clay);
		shard.position.set(-49.6, y + .06, -89.8);
		shard.rotation.z = 1.1;
		g.add(shard);
	}, -50.4, -90.6);
	const lamp = new MeshStandardMaterial({
		color: 15784104,
		emissive: 15784104,
		emissiveIntensity: night ? .45 : .08,
		roughness: .4
	});
	place((y) => {
		box$1(g, .08, .08, .08, lamp, .4, y + .92, 16.6);
	}, .4, 16.6);
	return g;
}
function mat$1(color, extra = {}) {
	return new MeshStandardMaterial({
		color,
		roughness: .55,
		metalness: .12,
		...extra
	});
}
function add(g, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
	const m = new Mesh(geo, material);
	m.position.set(x, y, z);
	m.rotation.set(rx, ry, rz);
	m.castShadow = true;
	g.add(m);
	return m;
}
function createItemMesh(id) {
	const g = new Group();
	g.userData.iid = id;
	if (id === "old_key") {
		const brass = mat$1(12886362, {
			metalness: .75,
			roughness: .32,
			emissive: 6965784,
			emissiveIntensity: .35
		});
		add(g, new TorusGeometry(.16, .045, 8, 16), brass, 0, .22, 0, Math.PI / 2);
		add(g, new CylinderGeometry(.035, .035, .42, 8), brass, 0, -.08, 0);
		add(g, new BoxGeometry(.12, .05, .04), brass, .06, -.24, 0);
		add(g, new BoxGeometry(.08, .04, .04), brass, .05, -.3, 0);
	} else if (id === "camera") {
		const body = mat$1(2765358, {
			metalness: .3,
			roughness: .45,
			emissive: 1713184,
			emissiveIntensity: .2
		});
		const glass = mat$1(9085112, {
			metalness: .6,
			roughness: .2,
			emissive: 4874360,
			emissiveIntensity: .45
		});
		add(g, new BoxGeometry(.42, .26, .22), body, 0, 0, 0);
		add(g, new CylinderGeometry(.1, .11, .16, 12), glass, 0, 0, -.16, Math.PI / 2);
		add(g, new BoxGeometry(.1, .08, .08), mat$1(12886362, {
			emissive: 9072672,
			emissiveIntensity: .4
		}), .16, .14, 0);
	} else if (id === "notebook") {
		const cover = mat$1(7293498, {
			roughness: .8,
			emissive: 3809304,
			emissiveIntensity: .25
		});
		const paper = mat$1(15261904, { roughness: .9 });
		add(g, new BoxGeometry(.34, .08, .46), cover);
		add(g, new BoxGeometry(.3, .06, .42), paper, .01, .01, 0);
	} else if (id === "compass") {
		const brass = mat$1(11569736, {
			metalness: .7,
			roughness: .3,
			emissive: 6965784,
			emissiveIntensity: .3
		});
		const face = mat$1(15262932, { roughness: .5 });
		const needle = mat$1(12868682, {
			emissive: 8396824,
			emissiveIntensity: .5
		});
		add(g, new CylinderGeometry(.2, .22, .08, 16), brass);
		add(g, new CylinderGeometry(.16, .16, .03, 16), face, 0, .05, 0);
		add(g, new BoxGeometry(.04, .02, .22), needle, 0, .07, 0);
	} else if (id === "backpack") {
		const canvas = mat$1(5925448, {
			roughness: .85,
			emissive: 2767392,
			emissiveIntensity: .25
		});
		const strap = mat$1(3813928, { roughness: .9 });
		add(g, new BoxGeometry(.42, .5, .28), canvas, 0, .05, 0);
		add(g, new BoxGeometry(.18, .16, .08), canvas, 0, .12, -.18);
		add(g, new TorusGeometry(.16, .025, 6, 12, Math.PI), strap, 0, .28, .02, Math.PI, 0, 0);
	} else if (id === "tsinelas") {
		const rub = mat$1(2771512, {
			roughness: .9,
			emissive: 1319964,
			emissiveIntensity: .2
		});
		add(g, new BoxGeometry(.18, .05, .42), rub, -.14, 0, 0);
		add(g, new BoxGeometry(.18, .05, .42), rub, .14, 0, 0);
		add(g, new TorusGeometry(.08, .015, 6, 10, Math.PI), rub, -.14, .04, .04, Math.PI / 2);
		add(g, new TorusGeometry(.08, .015, 6, 10, Math.PI), rub, .14, .04, .04, Math.PI / 2);
	} else if (id === "payong") {
		const cloth = mat$1(4876872, {
			roughness: .7,
			emissive: 2109472,
			emissiveIntensity: .25
		});
		const stick = mat$1(5916212, { roughness: .8 });
		add(g, new CylinderGeometry(.025, .025, .7, 6), stick, 0, 0, 0);
		add(g, new ConeGeometry(.18, .16, 8), cloth, 0, .28, 0);
	} else if (id === "liham") {
		const paper = mat$1(15261904, {
			roughness: .85,
			emissive: 9074784,
			emissiveIntensity: .2
		});
		add(g, new BoxGeometry(.28, .02, .2), paper);
		add(g, new BoxGeometry(.12, .01, .08), mat$1(12868682, { roughness: .7 }), .04, .015, 0);
	} else if (id === "radio") {
		const body = mat$1(3813928, {
			roughness: .55,
			metalness: .25,
			emissive: 2760728,
			emissiveIntensity: .2
		});
		add(g, new BoxGeometry(.42, .24, .18), body);
		add(g, new CylinderGeometry(.05, .05, .08, 10), mat$1(12886362, { metalness: .6 }), .14, .08, .1, Math.PI / 2);
		add(g, new CylinderGeometry(.01, .01, .36, 6), mat$1(8950408), -.16, .28, 0);
	} else if (id === "lantern") {
		const brass = mat$1(11569736, {
			metalness: .65,
			roughness: .35,
			emissive: 6965784,
			emissiveIntensity: .35
		});
		const glass = mat$1(15784104, {
			emissive: 15784104,
			emissiveIntensity: .7,
			transparent: true,
			opacity: .7
		});
		add(g, new CylinderGeometry(.12, .14, .06, 8), brass, 0, -.16, 0);
		add(g, new CylinderGeometry(.11, .11, .22, 8), glass, 0, 0, 0);
		add(g, new CylinderGeometry(.12, .1, .06, 8), brass, 0, .16, 0);
		add(g, new TorusGeometry(.08, .015, 6, 10), brass, 0, .24, 0, Math.PI / 2);
	} else if (id === "salamin") {
		const frame = mat$1(2764332, {
			metalness: .4,
			roughness: .4,
			emissive: 1711644,
			emissiveIntensity: .2
		});
		add(g, new TorusGeometry(.09, .015, 6, 12), frame, -.1, 0, 0);
		add(g, new TorusGeometry(.09, .015, 6, 12), frame, .1, 0, 0);
		add(g, new BoxGeometry(.06, .02, .02), frame, 0, 0, 0);
	} else if (id === "baon") {
		const tin = mat$1(9085112, {
			metalness: .55,
			roughness: .35,
			emissive: 4874352,
			emissiveIntensity: .25
		});
		add(g, new BoxGeometry(.36, .16, .26), tin);
		add(g, new BoxGeometry(.1, .04, .08), tin, 0, .1, 0);
	} else if (id === "abaniko") {
		const wood = mat$1(6968132, {
			roughness: .7,
			emissive: 3811872,
			emissiveIntensity: .2
		});
		add(g, new CylinderGeometry(.02, .02, .36, 6), wood, 0, 0, 0);
		add(g, new CircleGeometry(.22, 8, 0, Math.PI * .7), mat$1(14263200, { roughness: .8 }), 0, .08, 0, -.4, 0, 0);
	} else if (id === "rosaryo") {
		const wood = mat$1(5913128, {
			roughness: .7,
			emissive: 3809304,
			emissiveIntensity: .3
		});
		add(g, new TorusGeometry(.16, .018, 6, 16), wood);
		add(g, new BoxGeometry(.06, .1, .02), wood, 0, -.22, 0);
	} else if (id === "tabo") {
		const plas = mat$1(3828362, {
			roughness: .45,
			emissive: 1718864,
			emissiveIntensity: .25
		});
		add(g, new CylinderGeometry(.12, .1, .16, 10), plas);
		add(g, new TorusGeometry(.08, .015, 6, 10, Math.PI), plas, .12, .04, 0, 0, 0, Math.PI / 2);
	} else if (id === "sombrero") {
		const straw = mat$1(12886362, {
			roughness: .85,
			emissive: 6965784,
			emissiveIntensity: .2
		});
		add(g, new CylinderGeometry(.28, .28, .03, 12), straw, 0, 0, 0);
		add(g, new CylinderGeometry(.14, .16, .12, 10), straw, 0, .07, 0);
	} else if (id === "battery") {
		const body = mat$1(12868682, {
			roughness: .5,
			emissive: 6955032,
			emissiveIntensity: .3
		});
		add(g, new CylinderGeometry(.07, .07, .28, 10), body);
		add(g, new CylinderGeometry(.04, .04, .04, 8), mat$1(12886362, { metalness: .7 }), 0, .16, 0);
	} else {
		const metal = mat$1(4870728, {
			metalness: .55,
			roughness: .4,
			emissive: 2765356,
			emissiveIntensity: .25
		});
		add(g, new CylinderGeometry(.06, .07, .32, 8), metal);
		add(g, new CylinderGeometry(.08, .09, .08, 10), mat$1(15784104, {
			emissive: 15784104,
			emissiveIntensity: .6
		}), 0, .18, 0);
	}
	g.scale.setScalar(1.15);
	return g;
}
var ITEM_GLOW = {
	old_key: 12886362,
	camera: 9085112,
	notebook: 7293498,
	battery: 12868682,
	backpack: 7318906,
	tsinelas: 2771512,
	payong: 4876872,
	liham: 15261904,
	radio: 12886362,
	lantern: 15784104,
	salamin: 9085112,
	baon: 9085112,
	abaniko: 14263200,
	rosaryo: 5913128,
	tabo: 3828362,
	compass: 11569736,
	sombrero: 12886362,
	flashlight: 15784104
};
var withName = (name, a, b) => Math.random() < .38 ? a.replace("{n}", name) : b;
var LINES = {
	start: ({ name }) => [
		withName(name, "{n}, saan kaya natin naiwan 'to?", "Saan kaya natin naiwan 'to?"),
		withName(name, "{n}, dahan-dahan lang. Nandito lang 'yan.", "Dahan-dahan lang. Nandito lang 'yan."),
		"Sige, isa-isa. Huwag magmadali — pero 'wag din magtagal.",
		"Parang kahapon lang nandito lahat. Ngayon, hanapin natin."
	],
	item: ({ name, itemName }) => [
		withName(name, `{n}, ayan! ${itemName ?? "Ito"}.`, `Ayan! ${itemName ?? "Ito"}.`),
		"Finally. Akala ko wala na.",
		"Uy, eto pala. Kanina pa kita hinahanap.",
		withName(name, `{n}, isa pa. Bilisan mo konti.`, "Isa pa. Konti na lang."),
		"Grabe, saan ba 'to napunta. Anyway — nakuha na."
	],
	lowtime: ({ name }) => [
		withName(name, "{n}, bilisan mo! Mauubusan tayo ng oras!", "Bilis! Mauubusan tayo ng oras."),
		"Isa na lang 'tong oras. Focus.",
		withName(name, "{n}, focus tayo.", "Focus tayo. Huwag mag-ikot-ikot.")
	],
	urgent: ({ name }) => [
		withName(name, "{n} — konti na lang ang oras!", "Konti na lang ang oras!"),
		"Huwag naman sanang nasa kabilang dulo.",
		"Sige, last stretch. Kaya pa 'yan."
	],
	zone: ({ zoneName }) => [
		`${zoneName ?? "Dito"} pala 'to. Okay.`,
		"Parang dito ko nakita... o baka hindi.",
		"Okay, bagong sulok. Tingnan natin.",
		"May nakita ako... ah, hindi pala. Keep walking."
	],
	wander: ({ name }) => [
		"Nasaan na ba 'yon?",
		"Bakit parang ang layo ng nilalakad ko?",
		withName(name, "{n}... feeling ko mali na naman tayo ng pinuntahan.", "Feeling ko mali na naman tayo ng daan."),
		"Parang dito ko nakita... tapos nawala.",
		"Huwag naman sanang nasa kabilang dulo."
	],
	win: ({ name }) => [
		withName(name, "Ayos, {n}. Nakuha lahat.", "Nakuha lahat. Salamat sa paa."),
		"Tapos. Hindi pala ganoon kahirap — sabi ng pagod ko, kasinungalingan.",
		withName(name, "Great job, {n}. Uwi na tayo.", "Uwi na. May merienda pa ba?")
	],
	lose: ({ name }) => [
		withName(name, "{n}, next time. Hindi pa tapos 'to.", "Next time. Hindi pa tapos 'to."),
		"Naubos ang oras. Okay lang — alam na natin ang daan.",
		"Bumalik tayo. Konti na lang eh."
	],
	night: () => [
		"Gabi na. Buksan mo 'yung ilaw.",
		"Ang dilim. Follow the lamps.",
		"Keep the lamp on. Madaling mawala dito sa gabi."
	],
	miss: () => [
		"May nakita ako... ah, hindi pala.",
		"Akala ko item. Bato lang.",
		"Hindi pa 'to. Keep looking."
	]
};
function pick(arr) {
	return arr[Math.random() * arr.length | 0];
}
function lineFor(trigger, ctx) {
	const name = ctx.name || "Kaibigan";
	return pick(LINES[trigger]({
		...ctx,
		name
	}));
}
var SENS = .0022;
function remainingOf(sim) {
	if (!sim.started) return sim.timeLimit;
	return Math.max(0, sim.timeLimit - sim.t);
}
function createSim(level, aabbs, playerName, speak) {
	const spawn = level.spawn;
	return {
		t: 0,
		timeLimit: level.timeLimit,
		started: false,
		x: spawn.x,
		y: getHeight(spawn.x, spawn.z) + 1.68,
		z: spawn.z,
		yaw: spawn.yaw ?? .15,
		pitch: -.06,
		vy: 0,
		onGround: true,
		speed: 0,
		found: /* @__PURE__ */ new Set(),
		discovered: /* @__PURE__ */ new Set(["central"]),
		looking: null,
		lookingClue: null,
		interactables: generateInteractables(level),
		clues: generateClues(),
		inspected: /* @__PURE__ */ new Set(),
		aabbs,
		ended: null,
		light: level.timeOfDay === "night",
		timeOfDay: level.timeOfDay,
		notify: `Find ${level.items.length} belongings.`,
		notifyT: 0,
		lastFound: null,
		lastFoundT: -99,
		distance: 0,
		level,
		dialogue: "",
		dialogueT: -99,
		lastItemT: 0,
		lastWanderT: 0,
		playerName,
		speak,
		lastZone: "central",
		lowChimed: false,
		urgentChimed: false,
		nightChimed: false,
		indoor: indoorAt(spawn.x, spawn.z),
		surface: surfaceAt(spawn.x, spawn.z),
		doorOpen: false
	};
}
function say(sim, trigger, extra) {
	if (!sim.speak) return;
	sim.dialogue = lineFor(trigger, {
		name: sim.playerName,
		itemName: extra?.itemName,
		zoneName: extra?.zoneName
	});
	sim.dialogueT = sim.t;
}
function facingDot(sim, x, z) {
	const fx = -Math.sin(sim.yaw);
	const fz = -Math.cos(sim.yaw);
	const dx = x - sim.x;
	const dz = z - sim.z;
	const len = Math.hypot(dx, dz) || 1;
	return (fx * dx + fz * dz) / len;
}
function findLook(sim) {
	const current = sim.looking && !sim.found.has(sim.looking.id) ? sim.looking : null;
	let best = current;
	let bestScore = current ? .22 : .55;
	for (const it of sim.interactables) {
		if (sim.found.has(it.id)) continue;
		const d = Math.hypot(it.x - sim.x, it.z - sim.z);
		const held = it === current;
		if (d > (held ? 3.9 : 3.2)) continue;
		const dot = facingDot(sim, it.x, it.z);
		if (dot < (held ? .22 : .45)) continue;
		const score = dot - d * .08 + (held ? .2 : 0);
		if (score > bestScore) {
			bestScore = score;
			best = it;
		}
	}
	return best;
}
function findClue(sim) {
	const current = sim.lookingClue;
	let best = current;
	let bestScore = current ? .2 : .5;
	for (const c of sim.clues) {
		const d = Math.hypot(c.x - sim.x, c.z - sim.z);
		const held = c === current;
		if (d > (held ? 4 : 3.4)) continue;
		const dot = facingDot(sim, c.x, c.z);
		if (dot < (held ? .2 : .4)) continue;
		const score = dot - d * .1 + (held ? .18 : 0);
		if (score > bestScore) {
			bestScore = score;
			best = c;
		}
	}
	return best;
}
function collectItem(sim, id) {
	if (sim.ended || sim.found.has(id)) return false;
	const def = sim.level.items.find((i) => i.id === id);
	if (!def) return false;
	sim.found.add(id);
	sim.lastFound = id;
	sim.lastFoundT = sim.t;
	sim.lastItemT = sim.t;
	const left = sim.level.items.length - sim.found.size;
	sim.notify = left === 0 ? "Nakuha lahat." : `${def.name} — ${left} remaining`;
	sim.notifyT = sim.t;
	say(sim, "item", { itemName: def.name });
	if (left === 0) {
		sim.ended = {
			status: "win",
			reason: "complete"
		};
		say(sim, "win");
	}
	return true;
}
function inspectClue(sim, clue) {
	sim.notify = clue.line;
	sim.notifyT = sim.t;
	sim.dialogue = clue.line;
	sim.dialogueT = sim.t;
	sim.inspected.add(clue.id);
	if (clue.id === "clue_house") sim.doorOpen = true;
}
function beginWalk(sim) {
	sim.started = true;
	sim.t = 0;
	sim.notify = `${sim.level.items.length} belongings. Walk the grounds.`;
	sim.notifyT = 0;
	say(sim, "start");
	if (sim.timeOfDay === "night") {
		sim.nightChimed = true;
		if (typeof window !== "undefined") window.setTimeout(() => {
			if (sim.started && !sim.ended) say(sim, "night");
		}, 1600);
	}
}
function stepSim(sim, input, dt) {
	if (sim.ended) return;
	const d = Math.min(dt, .1);
	sim.yaw -= input.lookX * SENS;
	sim.pitch -= input.lookY * SENS;
	const lim = Math.PI / 2 - .02;
	if (sim.pitch > lim) sim.pitch = lim;
	if (sim.pitch < -lim) sim.pitch = lim * -1;
	input.lookX = 0;
	input.lookY = 0;
	if (!sim.started) {
		sim.yaw += d * .08;
		sim.looking = null;
		sim.lookingClue = null;
		return;
	}
	sim.t += d;
	const fx = -Math.sin(sim.yaw);
	const fz = -Math.cos(sim.yaw);
	const rx = Math.cos(sim.yaw);
	const rz = -Math.sin(sim.yaw);
	const base = 6.1 * (input.crouch ? .48 : input.sprint && input.f > 0 ? 1.72 : 1);
	const vx = (fx * input.f + rx * input.r) * base;
	const vz = (fz * input.f + rz * input.r) * base;
	let nx = sim.x + vx * d;
	let nz = sim.z + vz * d;
	const resolved = resolveCollision(nx, nz, sim.y, sim.aabbs);
	nx = resolved.x;
	nz = resolved.z;
	const ground = getHeight(nx, nz);
	const eye = input.crouch ? 1.05 : 1.68;
	if (input.jump && sim.onGround) {
		sim.vy = 6.1;
		sim.onGround = false;
	}
	sim.vy -= 18 * d;
	sim.y += sim.vy * d;
	if (sim.y <= ground + eye) {
		sim.y = ground + eye;
		sim.vy = 0;
		sim.onGround = true;
	} else sim.onGround = false;
	const step = Math.hypot(nx - sim.x, nz - sim.z);
	sim.distance += step;
	sim.speed = step / Math.max(d, 1e-4);
	sim.x = nx;
	sim.z = nz;
	sim.indoor = indoorAt(sim.x, sim.z);
	sim.surface = surfaceAt(sim.x, sim.z);
	const zdef = zoneAt(sim.x, sim.z);
	if (!sim.discovered.has(zdef.id)) {
		sim.discovered.add(zdef.id);
		sim.notify = zdef.tagalog;
		sim.notifyT = sim.t;
		say(sim, "zone", { zoneName: zdef.tagalog });
	} else if (zdef.id !== sim.lastZone && sim.t - sim.dialogueT > 10) sim.lastZone = zdef.id;
	sim.lastZone = zdef.id;
	sim.looking = findLook(sim);
	sim.lookingClue = sim.looking ? null : findClue(sim);
	if (input.interact && sim.looking) {
		collectItem(sim, sim.looking.id);
		input.interact = false;
	} else if (input.interact && sim.lookingClue) {
		inspectClue(sim, sim.lookingClue);
		input.interact = false;
	}
	const remain = remainingOf(sim);
	if (!sim.lowChimed && remain < 60 && remain > 21) {
		sim.lowChimed = true;
		say(sim, "lowtime");
	}
	if (!sim.urgentChimed && remain < 20) {
		sim.urgentChimed = true;
		say(sim, "urgent");
	}
	if (sim.t - sim.lastItemT > 42 && sim.t - sim.lastWanderT > 28 && sim.t - sim.dialogueT > 14) {
		sim.lastWanderT = sim.t;
		say(sim, "wander");
	}
	if (sim.notifyT && sim.t - sim.notifyT > 3.4) sim.notify = "";
	if (sim.t - sim.dialogueT > 4.2) sim.dialogue = "";
	if (!sim.ended && remain <= 0) {
		sim.t = sim.timeLimit;
		sim.ended = {
			status: "lose",
			reason: "time"
		};
		say(sim, "lose");
	}
}
function hudOf(sim, trackName = "") {
	const z = zoneAt(sim.x, sim.z);
	const last = sim.lastFound;
	const cluePrompt = sim.lookingClue ? `E  —  ${sim.lookingClue.hint}` : "";
	return {
		zoneId: z.id,
		zoneName: z.tagalog,
		zoneBlurb: z.blurb,
		remaining: remainingOf(sim),
		timeLimit: sim.timeLimit,
		found: sim.level.items.map((i) => i.id).filter((id) => sim.found.has(id)),
		total: sim.level.items.length,
		prompt: sim.looking ? `E  —  ${sim.looking.hint}` : cluePrompt,
		notif: sim.notify,
		lastFound: sim.t - sim.lastFoundT < 2.6 ? last : null,
		lastFoundName: last ? sim.level.items.find((i) => i.id === last)?.name ?? ITEM_INFO[last].name : "",
		light: sim.light,
		started: sim.started,
		ended: sim.ended ? { status: sim.ended.status } : null,
		lookingId: sim.looking?.id ?? sim.lookingClue?.id ?? null,
		levelId: sim.level.id,
		levelTitle: sim.level.tagalog,
		dialogue: sim.dialogue,
		trackName
	};
}
var matCache = /* @__PURE__ */ new Map();
function mat(key, params) {
	let m = matCache.get(key);
	if (!m) {
		m = new MeshStandardMaterial(params);
		matCache.set(key, m);
	}
	return m;
}
function maps() {
	return getTextures();
}
function box(g, w, h, d, material, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) {
	const m = new Mesh(new BoxGeometry(w, h, d), material);
	m.position.set(x, y, z);
	m.rotation.set(rx, ry, rz);
	m.castShadow = shadow;
	m.receiveShadow = true;
	g.add(m);
	return m;
}
function buildDetailed(b, tod) {
	const g = new Group();
	g.position.set(b.x, 0, b.z);
	g.rotation.y = b.yaw ?? 0;
	const y0 = b.y ?? getHeight(b.x, b.z);
	const night = tod === "night";
	if (b.kind === "house") buildHouse(g, b, y0, night);
	else if (b.kind === "kubo") buildKubo(g, b, y0, night);
	else if (b.kind === "store") buildStore(g, b, y0, night);
	else if (b.kind === "workshop") buildWorkshop(g, b, y0, night);
	else if (b.kind === "greenhouse") buildGreenhouse(g, b, y0, night);
	else if (b.kind === "mill") buildMill(g, b, y0, night);
	g.userData.bid = b.id;
	return g;
}
function glassMat(key, night, greenhouse = false, house = false) {
	if (greenhouse) return mat(key, {
		color: 9418922,
		roughness: .08,
		metalness: .22,
		transparent: true,
		opacity: .38,
		emissive: 7318906,
		emissiveIntensity: night ? .32 : .06,
		depthWrite: false
	});
	const material = mat(key, {
		color: night ? 13217914 : 9086900,
		roughness: .2,
		metalness: house ? .08 : .45,
		emissive: night ? 15255688 : 1976872,
		emissiveIntensity: night ? house ? .26 : .62 : .05,
		transparent: house,
		opacity: house ? .34 : 1,
		depthWrite: !house,
		side: house ? 2 : 0
	});
	if (house) material.userData.houseWindow = true;
	return material;
}
function roofMat(key, color = 4081730) {
	return mat(key, {
		map: maps().concrete,
		color,
		roughness: .68,
		metalness: .14
	});
}
function frameMat() {
	return mat("frame", {
		map: maps().metal,
		color: 3820096,
		roughness: .55,
		metalness: .25
	});
}
function addFlatRoof(g, b, y0, roofMat, parapet) {
	box(g, b.w + .28, .12, b.d + .28, roofMat, 0, y0 + b.h + .06, 0);
	const ph = .16;
	const py = y0 + b.h + .12 + ph / 2;
	const t = .08;
	const rw = b.w + .28;
	const rd = b.d + .28;
	box(g, rw, ph, t, parapet, 0, py, -rd / 2 + t / 2);
	box(g, rw, ph, t, parapet, 0, py, rd / 2 - t / 2);
	box(g, t, ph, rd, parapet, -rw / 2 + t / 2, py, 0);
	box(g, t, ph, rd, parapet, rw / 2 - t / 2, py, 0);
}
function addGlassGrid(g, glass, frame, spec) {
	const { cx, cy, cz, w, h, cols, rows, axis } = spec;
	const inset = .09;
	const ft = .055;
	const glassT = .04;
	const cellW = w / cols;
	const cellH = h / rows;
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const ox = (c + .5) * cellW - w / 2;
		const oy = (r + .5) * cellH - h / 2;
		if (axis === "z") box(g, Math.max(.12, cellW - inset), Math.max(.12, cellH - inset), glassT, glass, cx + ox, cy + oy, cz, 0, 0, 0, false);
		else box(g, glassT, Math.max(.12, cellH - inset), Math.max(.12, cellW - inset), glass, cx, cy + oy, cz + ox, 0, 0, 0, false);
	}
	if (axis === "z") {
		box(g, w + ft, ft, ft, frame, cx, cy + h / 2, cz);
		box(g, w + ft, ft, ft, frame, cx, cy - h / 2, cz);
		box(g, ft, h, ft, frame, cx - w / 2, cy, cz);
		box(g, ft, h, ft, frame, cx + w / 2, cy, cz);
		for (let c = 1; c < cols; c++) box(g, ft, h, ft, frame, cx - w / 2 + c * cellW, cy, cz);
		for (let r = 1; r < rows; r++) box(g, w, ft, ft, frame, cx, cy - h / 2 + r * cellH, cz);
	} else {
		box(g, ft, ft, w + ft, frame, cx, cy + h / 2, cz);
		box(g, ft, ft, w + ft, frame, cx, cy - h / 2, cz);
		box(g, ft, h, ft, frame, cx, cy, cz - w / 2);
		box(g, ft, h, ft, frame, cx, cy, cz + w / 2);
		for (let c = 1; c < cols; c++) box(g, ft, h, ft, frame, cx, cy, cz - w / 2 + c * cellW);
		for (let r = 1; r < rows; r++) box(g, ft, ft, w, frame, cx, cy - h / 2 + r * cellH, cz);
	}
}
function addWallWithOpenings(g, wall, axis, center, face, span, bottom, top, thickness, openings) {
	const horizontal = [
		-span / 2,
		span / 2,
		...openings.flatMap((opening) => [opening.min, opening.max])
	].filter((value) => value >= -span / 2 && value <= span / 2).sort((a, b) => a - b);
	const vertical = [
		bottom,
		top,
		...openings.flatMap((opening) => [opening.bottom, opening.top])
	].filter((value) => value >= bottom && value <= top).sort((a, b) => a - b);
	for (let xi = 0; xi < horizontal.length - 1; xi++) {
		const left = horizontal[xi];
		const right = horizontal[xi + 1];
		if (right - left < .02) continue;
		const middle = (left + right) / 2;
		for (let yi = 0; yi < vertical.length - 1; yi++) {
			const low = vertical[yi];
			const high = vertical[yi + 1];
			if (high - low < .02) continue;
			const y = (low + high) / 2;
			if (openings.some((opening) => middle > opening.min && middle < opening.max && y > opening.bottom && y < opening.top)) continue;
			if (axis === "z") box(g, right - left, high - low, thickness, wall, center + middle, y, face);
			else box(g, thickness, high - low, right - left, wall, face, y, center + middle);
		}
	}
}
function addPitchedRoof(g, b, y0, roof, gableWall, hip) {
	const rise = Math.min(1.2, b.h * .23);
	const overhang = .38;
	const halfWidth = b.w / 2 + overhang;
	const halfDepth = b.d / 2 + overhang;
	const eaveY = y0 + b.h;
	const ridgeY = eaveY + rise;
	const ridgeHalf = hip ? Math.max(0, halfWidth - rise * .9) : halfWidth;
	roof.side = 2;
	const face = (vertices) => {
		const geometry = new BufferGeometry();
		geometry.setFromPoints(vertices);
		geometry.setIndex(vertices.length === 3 ? [
			0,
			1,
			2
		] : [
			0,
			1,
			2,
			0,
			2,
			3
		]);
		geometry.computeVertexNormals();
		const mesh = new Mesh(geometry, roof);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData.keepSeparate = true;
		g.add(mesh);
	};
	[-1, 1].forEach((side) => {
		const near = side * halfDepth;
		const panel = [
			new Vector3(-halfWidth, eaveY, near),
			new Vector3(halfWidth, eaveY, near),
			new Vector3(ridgeHalf, ridgeY, 0),
			new Vector3(-ridgeHalf, ridgeY, 0)
		];
		face(side < 0 ? panel.reverse() : panel);
	});
	if (hip) {
		face([
			new Vector3(-halfWidth, eaveY, -halfDepth),
			new Vector3(-halfWidth, eaveY, halfDepth),
			new Vector3(-ridgeHalf, ridgeY, 0)
		]);
		face([
			new Vector3(halfWidth, eaveY, halfDepth),
			new Vector3(halfWidth, eaveY, -halfDepth),
			new Vector3(ridgeHalf, ridgeY, 0)
		]);
	} else {
		const gable = new Shape();
		gable.moveTo(-b.w / 2, 0);
		gable.lineTo(b.w / 2, 0);
		gable.lineTo(0, rise);
		gable.closePath();
		[-1, 1].forEach((side) => {
			const mesh = new Mesh(new ShapeGeometry(gable), gableWall);
			mesh.position.set(0, eaveY - .02, side * (b.d / 2 + .025));
			mesh.rotation.y = side < 0 ? Math.PI : 0;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.userData.keepSeparate = true;
			g.add(mesh);
		});
	}
	[-halfDepth, halfDepth].forEach((z) => {
		box(g, halfWidth * 2, .1, .1, roof, 0, eaveY + .025, z, 0, 0, 0, true);
	});
}
function addHouseFixture(g, b, y0, night, porch) {
	if (!b.fixture) return;
	const z = -b.d / 2 - .04;
	const x = b.fixture === "wall" ? -Math.min(1.05, b.w * .16) : 0;
	const mountY = y0 + b.h - (porch ? .9 : .45);
	const bulbY = b.fixture === "hanging" || b.fixture === "covered" ? mountY - .42 : mountY - .12;
	const iron = mat("house-fixture-iron", {
		color: 3421486,
		roughness: .64,
		metalness: .48
	});
	const brass = mat("house-fixture-brass", {
		color: 6706234,
		roughness: .6,
		metalness: .38
	});
	const bulb = mat("house-fixture-bulb", {
		color: 16765856,
		emissive: 16759151,
		emissiveIntensity: night ? 1.45 : .28,
		roughness: .26
	});
	bulb.userData.houseBulb = true;
	box(g, .18, .2, .09, iron, x, mountY - .03, z + .045, 0, 0, 0, false);
	if (b.fixture === "hanging" || b.fixture === "covered") {
		const cable = new Mesh(new CylinderGeometry(.012, .012, Math.max(.12, mountY - bulbY - .05), 5), iron);
		cable.position.set(x, (mountY + bulbY) / 2, z - .025);
		cable.castShadow = false;
		g.add(cable);
	} else box(g, .08, .07, .18, iron, x, mountY - .1, z - .07, 0, 0, 0, false);
	if (b.fixture === "lantern") {
		box(g, .22, .045, .22, brass, x, bulbY + .15, z - .06, 0, 0, 0, false);
		box(g, .19, .22, .15, iron, x, bulbY, z - .06, 0, 0, 0, false);
		box(g, .23, .045, .22, brass, x, bulbY - .13, z - .06, 0, 0, 0, false);
	} else if (b.fixture === "wall") {
		box(g, .24, .1, .12, brass, x, bulbY + .1, z - .04, 0, 0, 0, false);
		const shade = new Mesh(new CylinderGeometry(.15, .09, .12, 8), iron);
		shade.position.set(x, bulbY + .035, z - .1);
		shade.castShadow = false;
		g.add(shade);
	} else if (b.fixture === "covered") {
		const shade = new Mesh(new CylinderGeometry(.14, .075, .12, 8), iron);
		shade.position.set(x, bulbY + .06, z - .025);
		shade.castShadow = false;
		g.add(shade);
	}
	const glass = new Mesh(new SphereGeometry(.065, 8, 6), bulb);
	glass.position.set(x, bulbY, z - .07);
	glass.castShadow = false;
	g.add(glass);
	{
		const light = new PointLight(16760184, 0, 19, 1.35);
		light.position.copy(glass.position);
		light.castShadow = false;
		light.userData.houseExteriorLight = true;
		g.add(light);
	}
	const sconceY = y0 + b.h * .68;
	const sconceZ = -b.d / 2 - .13;
	const sconceX = Math.min(1.55, b.w * .27);
	[-sconceX, sconceX].forEach((sconceOffset) => {
		box(g, .2, .28, .07, iron, sconceOffset, sconceY, sconceZ + .035, 0, 0, 0, false);
		box(g, .12, .07, .2, brass, sconceOffset, sconceY - .06, sconceZ - .09, 0, 0, 0, false);
		const glassBulb = new Mesh(new SphereGeometry(.09, 10, 8), bulb);
		glassBulb.position.set(sconceOffset, sconceY - .1, sconceZ - .16);
		glassBulb.castShadow = false;
		glassBulb.userData.houseBulb = true;
		g.add(glassBulb);
		const sconceLight = new PointLight(16762239, 0, 24, 1.25);
		sconceLight.position.set(sconceOffset, sconceY - .1, sconceZ - .2);
		sconceLight.castShadow = false;
		sconceLight.userData.houseExteriorLight = true;
		g.add(sconceLight);
	});
}
function addPorch(g, b, y0, wood, roof, stone) {
	const width = Math.min(b.w * .72, 5.8);
	const depth = 1.65;
	const front = -b.d / 2 - depth;
	box(g, width, .16, depth, stone, 0, y0 + .2, -b.d / 2 - depth / 2);
	box(g, width + .28, .12, 1.9, roof, 0, y0 + b.h - .56, -b.d / 2 - depth / 2);
	const postHeight = Math.max(1.8, b.h - .82);
	[-width / 2 + .12, width / 2 - .12].forEach((x) => {
		box(g, .15, postHeight, .15, wood, x, y0 + postHeight / 2 + .2, front + .08);
	});
	box(g, width * .34, .12, .48, stone, 0, y0 + .09, front - .28);
}
function addResidentialInteriorLights(g, b, y0, night, frame, wood) {
	const bulbMaterial = mat("house-interior-bulb", {
		color: 16765856,
		emissive: 16759151,
		emissiveIntensity: night ? 1.65 : .16,
		roughness: .24
	});
	bulbMaterial.userData.houseInteriorBulb = true;
	[{
		x: -b.w * .22,
		z: b.d * .2
	}, {
		x: b.w * .2,
		z: -b.d * .18
	}].forEach(({ x, z }, index) => {
		box(g, .16, .08, .16, frame, x, y0 + b.h - .18, z, 0, 0, 0, false);
		const cable = new Mesh(new CylinderGeometry(.014, .014, .34, 5), wood);
		cable.position.set(x, y0 + b.h - .39, z);
		cable.castShadow = false;
		g.add(cable);
		const bulb = new Mesh(new SphereGeometry(.085, 10, 8), bulbMaterial);
		bulb.position.set(x, y0 + b.h - .61, z);
		bulb.castShadow = false;
		bulb.userData.houseInteriorBulb = true;
		g.add(bulb);
		const light = new PointLight(16761471, 0, 22, 1.25);
		light.position.set(x, y0 + b.h - .66, z);
		light.castShadow = false;
		light.userData.houseInteriorLight = true;
		light.userData.nightIntensity = index === 0 ? 38 : 30;
		light.userData.bulbMaterial = bulbMaterial;
		light.userData.houseCenter = {
			x: b.x,
			z: b.z,
			w: b.w,
			d: b.d,
			yaw: b.yaw ?? 0
		};
		g.add(light);
	});
}
function mergeHouseMeshes(g) {
	const buckets = /* @__PURE__ */ new Map();
	for (const child of [...g.children]) {
		const mesh = child;
		if (!mesh.isMesh || mesh.userData.door || mesh.userData.keepSeparate || Array.isArray(mesh.material)) continue;
		mesh.updateMatrix();
		const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = {
				material: mesh.material,
				castShadow: mesh.castShadow,
				receiveShadow: mesh.receiveShadow,
				geometries: []
			};
			buckets.set(key, bucket);
		}
		bucket.geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
		g.remove(mesh);
		mesh.geometry.dispose();
	}
	for (const bucket of buckets.values()) {
		const merged = mergeGeometries(bucket.geometries, false);
		const geometries = merged ? [merged] : bucket.geometries;
		if (merged) bucket.geometries.forEach((geometry) => geometry.dispose());
		geometries.forEach((geometry) => {
			geometry.computeBoundingSphere();
			const mesh = new Mesh(geometry, bucket.material);
			mesh.castShadow = bucket.castShadow;
			mesh.receiveShadow = bucket.receiveShadow;
			g.add(mesh);
		});
	}
}
function buildHouse(g, b, y0, night) {
	const t = maps();
	const wall = mat(`hw-${b.color}`, {
		map: t.wood,
		color: b.color,
		roughness: .86,
		roughnessMap: t.rough
	});
	const stone = mat("stone", {
		map: t.stone,
		color: 5922390,
		roughness: .95
	});
	const roof = roofMat(`hr-${b.roofStyle ?? "flat"}-${b.roof ?? b.color}`, b.roof);
	const frame = frameMat();
	const glass = glassMat(night ? "house-g-n" : "house-g-d", night, false, true);
	const wood = mat("wood", {
		map: t.wood,
		color: 5916212,
		roughness: .9
	});
	const ceiling = mat(`house-ceiling-${b.color}`, {
		map: t.wood,
		color: 7628111,
		roughness: .92
	});
	box(g, b.w + .22, .38, b.d + .22, stone, 0, y0 + .19, 0);
	const wallBottom = y0 + .3;
	const wallTop = y0 + b.h;
	const windowBottom = y0 + 2.55 - 2.15 / 2;
	const windowTop = y0 + 2.55 + 2.15 / 2;
	const frontWindowWidth = Math.max(1.6, b.w * .3);
	const frontWindowOffset = b.w * .28;
	const sideWindowWidth = b.d * .68;
	const backWindowWidth = b.w * .72;
	const backWindowBottom = y0 + 2.75 - 1.9 / 2;
	const backWindowTop = y0 + 2.75 + 1.9 / 2;
	const frontOpenings = [
		{
			min: -frontWindowOffset - frontWindowWidth / 2,
			max: -frontWindowOffset + frontWindowWidth / 2,
			bottom: windowBottom,
			top: windowTop
		},
		{
			min: frontWindowOffset - frontWindowWidth / 2,
			max: frontWindowOffset + frontWindowWidth / 2,
			bottom: windowBottom,
			top: windowTop
		},
		{
			min: -.8,
			max: .8,
			bottom: y0 + .2,
			top: y0 + 2.67
		}
	];
	addWallWithOpenings(g, wall, "z", 0, -b.d / 2, b.w, wallBottom, wallTop, .24, frontOpenings);
	addWallWithOpenings(g, wall, "z", 0, b.d / 2, b.w, wallBottom, wallTop, .24, [{
		min: -backWindowWidth / 2,
		max: backWindowWidth / 2,
		bottom: backWindowBottom,
		top: backWindowTop
	}]);
	addWallWithOpenings(g, wall, "x", 0, -b.w / 2, b.d, wallBottom, wallTop, .24, [{
		min: -sideWindowWidth / 2,
		max: sideWindowWidth / 2,
		bottom: windowBottom,
		top: windowTop
	}]);
	addWallWithOpenings(g, wall, "x", 0, b.w / 2, b.d, wallBottom, wallTop, .24, [{
		min: -sideWindowWidth / 2,
		max: sideWindowWidth / 2,
		bottom: windowBottom,
		top: windowTop
	}]);
	box(g, b.w - .3, .12, b.d - .3, ceiling, 0, y0 + b.h - .1, 0, 0, 0, 0, false);
	if (b.roofStyle === "gable" || b.roofStyle === "hip") addPitchedRoof(g, b, y0, roof, wall, b.roofStyle === "hip");
	else addFlatRoof(g, b, y0, roof, frame);
	const faceZ = -b.d / 2 - .03;
	addGlassGrid(g, glass, frame, {
		cx: -b.w * .28,
		cy: y0 + 2.55,
		cz: faceZ,
		w: Math.max(1.6, b.w * .3),
		h: 2.15,
		cols: 2,
		rows: 2,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: b.w * .28,
		cy: y0 + 2.55,
		cz: faceZ,
		w: Math.max(1.6, b.w * .3),
		h: 2.15,
		cols: 2,
		rows: 2,
		axis: "z"
	});
	const doorGeometry = new BoxGeometry(1.5, 2.45, .1);
	doorGeometry.translate(.75, 0, 0);
	const door = new Mesh(doorGeometry, wood);
	door.position.set(-.75, y0 + 1.42, -b.d / 2 - .02);
	door.castShadow = true;
	door.receiveShadow = true;
	g.add(door);
	door.userData.door = true;
	door.userData.buildingId = b.id;
	door.userData.residence = {
		x: b.x,
		z: b.z,
		w: b.w,
		d: b.d,
		yaw: b.yaw ?? 0,
		doorX: 0,
		doorWidth: 1.5
	};
	door.userData.closedYaw = 0;
	door.userData.openYaw = -1.32;
	box(g, 1.72, .08, .12, frame, 0, y0 + 2.7, -b.d / 2 - .02);
	box(g, .08, 2.5, .12, frame, -.8, y0 + 1.45, -b.d / 2 - .02);
	box(g, .08, 2.5, .12, frame, .8, y0 + 1.45, -b.d / 2 - .02);
	addGlassGrid(g, glass, frame, {
		cx: -b.w / 2 - .03,
		cy: y0 + 2.5,
		cz: 0,
		w: b.d * .68,
		h: 2.3,
		cols: 3,
		rows: 2,
		axis: "x"
	});
	addGlassGrid(g, glass, frame, {
		cx: b.w / 2 + .03,
		cy: y0 + 2.5,
		cz: 0,
		w: b.d * .68,
		h: 2.3,
		cols: 3,
		rows: 2,
		axis: "x"
	});
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + 2.75,
		cz: b.d / 2 + .03,
		w: b.w * .72,
		h: 1.9,
		cols: 4,
		rows: 2,
		axis: "z"
	});
	if (b.porch) addPorch(g, b, y0, wood, roof, stone);
	else box(g, 2.6, .14, 1.5, stone, 0, y0 + .12, -b.d / 2 - .75);
	addHouseFixture(g, b, y0, night, Boolean(b.porch));
	addResidentialInteriorLights(g, b, y0, night, frame, wood);
	if (b.enterable) {
		const tableX = -2.4;
		const tableZ = 1.2;
		box(g, 1.4, .08, 1.1, wood, tableX, y0 + .85, tableZ, 0, 0, 0, false);
		[-.58, .58].forEach((x) => {
			[-.43, .43].forEach((z) => {
				box(g, .08, .76, .08, wood, tableX + x, y0 + .43, tableZ + z);
			});
		});
	}
	mergeHouseMeshes(g);
}
function buildKubo(g, b, y0, night) {
	const t = maps();
	const wall = mat(`kw-${b.color}`, {
		map: t.wood,
		color: b.color,
		roughness: .9
	});
	const roof = roofMat(`kr-flat-${b.color}`);
	const frame = frameMat();
	const glass = glassMat(night ? "kglass-n" : "kglass-d", night);
	const wood = mat("wood", {
		map: t.wood,
		color: 5916212,
		roughness: .9
	});
	box(g, b.w + .18, .28, b.d + .18, wood, 0, y0 + .14, 0);
	const doorWidth = Math.min(1.25, b.w * .3);
	const doorX = b.w * .18;
	const windowWidth = Math.min(1.2, b.w * .28);
	const windowX = -b.w * .25;
	const bottom = y0 + .2;
	const top = y0 + b.h;
	const windowBottom = y0 + b.h * .55 - Math.max(1, b.h * .38) / 2;
	const windowTop = y0 + b.h * .55 + Math.max(1, b.h * .38) / 2;
	addWallWithOpenings(g, wall, "z", 0, -b.d / 2, b.w, bottom, top, .18, [{
		min: doorX - doorWidth / 2,
		max: doorX + doorWidth / 2,
		bottom: y0 + .1,
		top: y0 + 1.75
	}, {
		min: windowX - windowWidth / 2,
		max: windowX + windowWidth / 2,
		bottom: windowBottom,
		top: windowTop
	}]);
	addWallWithOpenings(g, wall, "z", 0, b.d / 2, b.w, bottom, top, .18, []);
	addWallWithOpenings(g, wall, "x", 0, -b.w / 2, b.d, bottom, top, .18, [{
		min: -b.d * .25,
		max: b.d * .25,
		bottom: windowBottom,
		top: windowTop
	}]);
	addWallWithOpenings(g, wall, "x", 0, b.w / 2, b.d, bottom, top, .18, []);
	addFlatRoof(g, b, y0, roof, frame);
	addGlassGrid(g, glass, frame, {
		cx: windowX,
		cy: y0 + b.h * .55,
		cz: -b.d / 2 - .03,
		w: windowWidth,
		h: Math.max(1.1, b.h * .38),
		cols: 2,
		rows: 1,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: -b.w / 2 - .03,
		cy: y0 + b.h * .55,
		cz: 0,
		w: Math.max(1.1, b.d * .5),
		h: Math.max(1, b.h * .38),
		cols: 2,
		rows: 1,
		axis: "x"
	});
	const doorGeometry = new BoxGeometry(doorWidth, 1.7, .08);
	doorGeometry.translate(doorWidth / 2, 0, 0);
	const door = new Mesh(doorGeometry, wood);
	door.position.set(doorX - doorWidth / 2, y0 + 1, -b.d / 2 - .02);
	door.castShadow = true;
	door.receiveShadow = true;
	door.userData.door = true;
	door.userData.buildingId = b.id;
	door.userData.residence = {
		x: b.x,
		z: b.z,
		w: b.w,
		d: b.d,
		yaw: b.yaw ?? 0,
		doorX,
		doorWidth
	};
	door.userData.doorX = doorX;
	door.userData.openYaw = -1.25;
	g.add(door);
	addHouseFixture(g, b, y0, night, false);
	addResidentialInteriorLights(g, b, y0, night, frame, wood);
}
function buildStore(g, b, y0, night) {
	const t = maps();
	const wall = mat(`sw-${b.color}`, {
		map: t.wood,
		color: b.color,
		roughness: .86
	});
	const roof = roofMat(`sr-flat-${b.color}`);
	const canopy = mat("awning", {
		color: 12868682,
		roughness: .7
	});
	const wood = mat("wood", {
		map: t.wood,
		color: 5916212,
		roughness: .9
	});
	const frame = frameMat();
	const glass = glassMat(night ? "store-n" : "store-d", night);
	box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
	addFlatRoof(g, b, y0, roof, frame);
	box(g, b.w + .2, .08, 1.5, canopy, 0, y0 + 2.55, -b.d / 2 - .7);
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + 1.45,
		cz: -b.d / 2 - .04,
		w: b.w - .7,
		h: 1.7,
		cols: 3,
		rows: 2,
		axis: "z"
	});
	box(g, b.w - .5, .1, .7, wood, 0, y0 + .5, -b.d / 2 - .35);
}
function buildWorkshop(g, b, y0, night) {
	const t = maps();
	const wall = mat(`ww-${b.color}`, {
		map: t.concrete,
		color: b.color,
		roughness: .88
	});
	const roof = roofMat(`wr-flat-${b.color}`);
	const metal = mat("iron", {
		map: t.metal,
		color: 2764332,
		roughness: .5,
		metalness: .4
	});
	const frame = frameMat();
	const glass = glassMat(night ? "win-n" : "win-d", night);
	box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
	addFlatRoof(g, b, y0, roof, frame);
	box(g, 1.8, 2.2, .1, metal, 0, y0 + 1.2, -b.d / 2 - .04);
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + b.h * .72,
		cz: -b.d / 2 - .04,
		w: b.w * .78,
		h: Math.max(.7, b.h * .22),
		cols: 4,
		rows: 1,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: b.w / 2 + .03,
		cy: y0 + b.h * .55,
		cz: 0,
		w: b.d * .55,
		h: Math.max(.9, b.h * .32),
		cols: 2,
		rows: 1,
		axis: "x"
	});
}
function buildGreenhouse(g, b, y0, night) {
	const frame = mat("gframe", {
		map: maps().metal,
		color: 3820096,
		roughness: .55,
		metalness: .25
	});
	const glass = glassMat(night ? "gglass-n" : "gglass-d", night, true);
	box(g, b.w, .28, b.d, frame, 0, y0 + .14, 0);
	box(g, b.w - .16, b.h - .4, b.d - .16, glass, 0, y0 + b.h / 2, 0, 0, 0, 0, false);
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + b.h / 2,
		cz: -b.d / 2 - .02,
		w: b.w - .3,
		h: b.h - .6,
		cols: 5,
		rows: 3,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + b.h / 2,
		cz: b.d / 2 + .02,
		w: b.w - .3,
		h: b.h - .6,
		cols: 5,
		rows: 3,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: -b.w / 2 - .02,
		cy: y0 + b.h / 2,
		cz: 0,
		w: b.d - .3,
		h: b.h - .6,
		cols: 4,
		rows: 3,
		axis: "x"
	});
	addGlassGrid(g, glass, frame, {
		cx: b.w / 2 + .02,
		cy: y0 + b.h / 2,
		cz: 0,
		w: b.d - .3,
		h: b.h - .6,
		cols: 4,
		rows: 3,
		axis: "x"
	});
	box(g, b.w + .2, .08, b.d + .2, frame, 0, y0 + b.h + .04, 0);
	box(g, b.w - .2, .05, b.d - .2, glass, 0, y0 + b.h + .08, 0, 0, 0, 0, false);
	for (let i = 1; i < 4; i++) box(g, .06, .08, b.d, frame, -b.w / 2 + b.w * i / 4, y0 + b.h + .08, 0);
	box(g, 1.4, 2.2, .1, frame, 0, y0 + 1.2, -b.d / 2 - .04);
}
function buildMill(g, b, y0, night) {
	const t = maps();
	const wall = mat(`mw-${b.color}`, {
		map: t.wood,
		color: b.color,
		roughness: .86
	});
	const roof = roofMat(`mr-flat-${b.color}`);
	const frame = frameMat();
	const glass = glassMat(night ? "mill-n" : "mill-d", night);
	const wood = mat("doorw", {
		map: t.wood,
		color: 3811868,
		roughness: .9
	});
	box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
	addFlatRoof(g, b, y0, roof, frame);
	addGlassGrid(g, glass, frame, {
		cx: 0,
		cy: y0 + b.h * .72,
		cz: -b.d / 2 - .04,
		w: b.w * .7,
		h: Math.max(.9, b.h * .22),
		cols: 3,
		rows: 1,
		axis: "z"
	});
	addGlassGrid(g, glass, frame, {
		cx: b.w / 2 + .03,
		cy: y0 + 2.2,
		cz: 0,
		w: b.d * .45,
		h: 1.4,
		cols: 2,
		rows: 2,
		axis: "x"
	});
	box(g, .9, 2, .12, wood, -b.w * .22, y0 + 1.1, -b.d / 2 - .04);
}
function buildJeepney() {
	const g = new Group();
	const t = maps();
	const body = mat("jeep", {
		color: 12868682,
		roughness: .55,
		metalness: .15,
		roughnessMap: t.rough
	});
	const chrome = mat("chrome", {
		map: t.metal,
		color: 12964036,
		roughness: .3,
		metalness: .7
	});
	const tire = mat("tire", {
		color: 1711644,
		roughness: .9
	});
	const roof = mat("jroof", {
		color: 12886362,
		roughness: .6
	});
	box(g, 5.6, 1.4, 2.1, body, 0, 1.05, 0);
	box(g, 2.2, 1.1, 2, body, -2.1, 1.55, 0);
	box(g, 5.8, .08, 2.3, roof, 0, 2.15, 0);
	box(g, .08, .7, 1.6, mat("jwin", {
		color: 9085112,
		roughness: .25,
		transparent: true,
		opacity: .55,
		depthWrite: false
	}), -3.15, 1.6, 0);
	for (const [x, z] of [
		[-1.8, 1.15],
		[1.6, 1.15],
		[-1.8, -1.15],
		[1.6, -1.15]
	]) {
		const w = new Mesh(new CylinderGeometry(.38, .38, .28, 10), tire);
		w.rotation.z = Math.PI / 2;
		w.position.set(x, .38, z);
		g.add(w);
	}
	box(g, .5, .16, .16, chrome, -3, .7, .7, 0, 0, 0, false);
	box(g, .5, .16, .16, chrome, -3, .7, -.7, 0, 0, 0, false);
	return g;
}
function buildWell() {
	const g = new Group();
	const t = maps();
	const stone = mat("stone", {
		map: t.stone,
		color: 5922390,
		roughness: .95
	});
	const wood = mat("wood", {
		map: t.wood,
		color: 5916212,
		roughness: .9
	});
	mat("hr-0x8a4030", {
		map: t.dirt,
		color: 9060400,
		roughness: .78
	});
	const ring = new Mesh(new CylinderGeometry(.9, 1.05, .9, 12), stone);
	ring.position.y = .45;
	g.add(ring);
	box(g, .12, 1.6, .12, wood, -.7, 1.3, 0);
	box(g, .12, 1.6, .12, wood, .7, 1.3, 0);
	box(g, 1.7, .1, .16, wood, 0, 2.12, 0);
	return g;
}
function buildBoat() {
	const g = new Group();
	const wood = mat("boat", {
		map: maps().wood,
		color: 5916212,
		roughness: .85
	});
	box(g, 3.4, .28, 1.05, wood, 0, .2, 0);
	box(g, 2.6, .22, .16, wood, 0, .4, .42);
	box(g, 2.6, .22, .16, wood, 0, .4, -.42);
	box(g, .12, 1.4, .12, wood, .4, .9, 0);
	return g;
}
function buildClothesline() {
	const g = new Group();
	const wood = mat("wood", {
		map: maps().wood,
		color: 5916212,
		roughness: .9
	});
	const cloths = [
		15261904,
		4876872,
		12868682,
		9085112
	];
	box(g, .1, 2, .1, wood, -2.2, 1, 0);
	box(g, .1, 2, .1, wood, 2.2, 1, 0);
	box(g, 4.4, .03, .03, wood, 0, 1.85, 0, 0, 0, 0, false);
	cloths.forEach((c, i) => {
		const cloth = box(g, .55, .7, .04, applyWind(mat(`cloth-${c}`, {
			color: c,
			roughness: .9,
			side: 2
		}), 1.4, true), -1.5 + i * 1.05, 1.5, 0, .08, 0, 0, false);
		cloth.userData.cloth = true;
	});
	return g;
}
function buildTableSet() {
	const g = new Group();
	const wood = mat("wood", {
		map: maps().wood,
		color: 5916212,
		roughness: .9
	});
	box(g, 1.4, .08, .8, wood, 0, .72, 0);
	box(g, .08, .72, .08, wood, -.55, .36, -.28);
	box(g, .08, .72, .08, wood, .55, .36, -.28);
	box(g, .08, .72, .08, wood, -.55, .36, .28);
	box(g, .08, .72, .08, wood, .55, .36, .28);
	box(g, .4, .08, .4, wood, 1.1, .45, .15);
	box(g, .4, .08, .4, wood, -1.1, .45, -.1);
	return g;
}
function resetStructureMaterials() {
	matCache.clear();
}
var DETAILED = /* @__PURE__ */ new Set([
	"house",
	"kubo",
	"store",
	"workshop",
	"greenhouse",
	"mill"
]);
var GAME_CODES = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Space",
	"ShiftLeft",
	"ShiftRight",
	"KeyC",
	"ControlLeft",
	"KeyE",
	"KeyF"
]);
function isTextEntry(target) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	return target.isContentEditable;
}
function radialDeadzone(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
var HavenRuntime = class {
	canvas;
	renderer;
	scene;
	camera;
	sim;
	input = {
		f: 0,
		r: 0,
		jump: false,
		sprint: false,
		crouch: false,
		lookX: 0,
		lookY: 0,
		interact: false
	};
	keys = /* @__PURE__ */ new Set();
	injected = null;
	touchAxis = {
		f: 0,
		r: 0
	};
	padAxis = {
		f: 0,
		r: 0,
		lookX: 0,
		lookY: 0,
		jump: false,
		sprint: false,
		crouch: false
	};
	padPrev = {
		interact: false,
		lamp: false
	};
	qaPad = null;
	running = false;
	paused = false;
	raf = 0;
	acc = 0;
	last = 0;
	hudAcc = 0;
	hooks;
	audio = getSharedAudio();
	buildings = generateBuildings();
	aabbs = [...buildingAabbs(this.buildings), ...extraAabbs()];
	itemGroups = [];
	flashlight;
	flashFill;
	sun;
	fill;
	hemi;
	ambient;
	bob = 0;
	pointerLocked = false;
	touchLook = {
		x: 0,
		y: 0
	};
	disposed = false;
	tool;
	body;
	cameraView = "first";
	handReach = 0;
	endedSent = false;
	fog;
	sky;
	stars = null;
	celestial;
	glow;
	clouds = null;
	rain;
	dust = null;
	itemHalo = null;
	lastLookId = "__init__";
	waterMeshes = [];
	doors = [];
	houseInteriorLights = [];
	houseExteriorLights = [];
	houseBulbs = [];
	houseInteriorBulbs = [];
	houseWindows = [];
	lampLights = [];
	lampBulbs = [];
	timeOfDay;
	weatherMode;
	lastRemainBand = 4;
	_unbind = () => {};
	disposables = [];
	level;
	quality;
	tmpColor = new Color();
	landDip = 0;
	wasGround = true;
	inspectedN = 0;
	camY = 0;
	camRoll = 0;
	constructor(canvas, level, playerName, speak, quality, weatherMode, hooks) {
		this.canvas = canvas;
		this.hooks = hooks;
		this.level = level;
		this.quality = quality;
		this.weatherMode = weatherMode;
		this.timeOfDay = timeForWeather(weatherMode, level.timeOfDay);
		this.canvas.tabIndex = 0;
		this.sim = createSim(level, this.aabbs, playerName, speak);
		const preset = sampleSky(this.timeOfDay, 0);
		const pr = quality === "low" ? 1 : quality === "medium" ? Math.min(devicePixelRatio, 1.35) : Math.min(devicePixelRatio, 1.75);
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: quality !== "low",
			powerPreference: "high-performance"
		});
		this.renderer.setPixelRatio(pr);
		this.renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
		this.renderer.shadowMap.enabled = quality !== "low";
		this.renderer.shadowMap.type = 1;
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = 4;
		this.renderer.toneMappingExposure = preset.exposure;
		this.scene = new Scene();
		this.scene.background = new Color(preset.bg);
		this.fog = new Fog(preset.fog, preset.fogNear, preset.fogFar);
		this.scene.fog = this.fog;
		this.camera = new PerspectiveCamera(72, 1, .12, 240);
		this.camera.rotation.order = "YXZ";
		this.hemi = new HemisphereLight(preset.hemiSky, preset.hemiGround, preset.hemiInt);
		this.scene.add(this.hemi);
		this.ambient = new AmbientLight(preset.hemiSky, preset.ambient);
		this.scene.add(this.ambient);
		this.sun = new DirectionalLight(preset.sunColor, preset.sunInt);
		this.sun.position.set(...preset.sunPos);
		this.sun.castShadow = this.timeOfDay !== "night" && quality !== "low";
		const map = quality === "high" ? 1024 : 512;
		this.sun.shadow.mapSize.set(map, map);
		this.sun.shadow.camera.near = 8;
		this.sun.shadow.camera.far = 160;
		this.sun.shadow.camera.left = -32;
		this.sun.shadow.camera.right = 32;
		this.sun.shadow.camera.top = 32;
		this.sun.shadow.camera.bottom = -32;
		this.sun.shadow.bias = -8e-4;
		this.sun.shadow.normalBias = .06;
		this.sun.shadow.radius = 1.75;
		this.sun.shadow.camera.updateProjectionMatrix();
		this.scene.add(this.sun);
		this.scene.add(this.sun.target);
		this.fill = new DirectionalLight(preset.hemiSky, this.timeOfDay === "night" ? .06 : .16);
		this.fill.position.set(-preset.sunPos[0] * .4, preset.sunPos[1] * .35, -preset.sunPos[2] * .4);
		this.fill.castShadow = false;
		this.scene.add(this.fill);
		this.sky = makeSkyDome(preset);
		this.scene.add(this.sky);
		this.celestial = makeCelestial(this.timeOfDay === "night" ? "moon" : "sun");
		this.celestial.position.copy(this.sun.position).normalize().multiplyScalar(160);
		this.celestial.frustumCulled = false;
		this.scene.add(this.celestial);
		this.glow = makeSunGlow();
		this.glow.position.copy(this.celestial.position);
		this.scene.add(this.glow);
		if (this.timeOfDay === "night") {
			this.stars = makeStars();
			this.scene.add(this.stars);
		}
		this.clouds = makeClouds(this.timeOfDay, quality);
		this.scene.add(this.clouds);
		this.rain = makeRain(quality);
		this.scene.add(this.rain);
		this.rain.visible = this.weatherMode === "rain";
		if (quality !== "low") {
			this.dust = makeDust(quality, this.timeOfDay);
			this.scene.add(this.dust);
		}
		const flash = makeFlashlight();
		this.flashlight = flash.light;
		this.flashFill = flash.fill;
		this.flashlight.position.set(.18, -.12, .04);
		this.flashFill.position.set(.08, -.62, -.9);
		this.camera.add(this.flashlight);
		this.camera.add(this.flashlight.target);
		this.camera.add(this.flashFill);
		this.flashlight.target.position.set(0, -1.05, -10);
		this.scene.add(this.camera);
		this.buildTerrain();
		this.buildWater();
		this.buildStructures();
		this.buildFlora();
		this.buildFurniture();
		this.buildSetDressing();
		this.buildInteractables();
		this.tool = buildFlashlightHand();
		this.camera.add(this.tool);
		this.body = buildPlayerBody();
		this.scene.add(this.body);
		this.disposables.push(this.body);
		this.camY = this.sim.y;
		this.audio.setTime(this.timeOfDay);
		this.onResize();
	}
	track(obj) {
		this.disposables.push(obj);
		this.scene.add(obj);
		return obj;
	}
	buildTerrain() {
		const tex = getTextures();
		const seg = this.quality === "low" ? 72 : this.quality === "medium" ? 96 : 128;
		const geo = new PlaneGeometry(276, 276, seg, seg);
		geo.rotateX(-Math.PI / 2);
		const pos = geo.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			const h = getHeight(x, z);
			pos.setY(i, h);
			let [r, g, b] = biomeColor(x, z, h);
			for (const bd of this.buildings) {
				if (bd.kind === "pad") {
					const px = Math.abs(x - bd.x);
					const pz = Math.abs(z - bd.z);
					if (px < bd.w * .5 && pz < bd.d * .5) {
						const padY = (bd.y ?? getHeight(bd.x, bd.z)) + .01;
						pos.setY(i, padY);
						const k = .55;
						r = r * .44999999999999996 + .32 * k;
						g = g * .44999999999999996 + .3 * k;
						b = b * .44999999999999996 + .24 * k;
					}
					continue;
				}
				const dx = Math.max(Math.abs(x - bd.x) - bd.w * .55, 0);
				const dz = Math.max(Math.abs(z - bd.z) - bd.d * .55, 0);
				const d = Math.hypot(dx, dz);
				if (d < 3.2) {
					const ao = 1 - (1 - d / 3.2) * .22;
					r *= ao;
					g *= ao;
					b *= ao;
				}
			}
			colors[i * 3] = r;
			colors[i * 3 + 1] = g;
			colors[i * 3 + 2] = b;
		}
		geo.setAttribute("color", new BufferAttribute(colors, 3));
		geo.computeVertexNormals();
		const mat = new MeshStandardMaterial({
			map: tex.grass,
			roughnessMap: tex.rough,
			vertexColors: true,
			roughness: .92,
			metalness: .02
		});
		const mesh = new Mesh(geo, mat);
		mesh.receiveShadow = true;
		mesh.castShadow = false;
		this.track(mesh);
	}
	buildWater() {
		const make = (w, d, x, y, z, color, opacity, wave) => {
			const geo = new PlaneGeometry(w, d, 24, 20);
			geo.rotateX(-Math.PI / 2);
			const mat = new MeshStandardMaterial({
				color,
				transparent: true,
				opacity,
				roughness: .28,
				metalness: .12,
				depthWrite: false,
				polygonOffset: true,
				polygonOffsetFactor: -1,
				polygonOffsetUnits: -1
			});
			const mesh = new Mesh(geo, mat);
			mesh.position.set(x, y, z);
			mesh.userData.water = true;
			mesh.userData.baseY = y;
			mesh.userData.wave = wave;
			mesh.renderOrder = 1;
			this.waterMeshes.push(mesh);
			this.track(mesh);
		};
		make(52, 42, -72, 1.02, 58, 1722962, .55, .045);
		make(3.2, 3.2, 0, getHeight(0, -2) + .82, -2, 3829888, .62, .018);
	}
	buildStructures() {
		for (const b of this.buildings) {
			if (b.kind === "pad") continue;
			if (DETAILED.has(b.kind)) {
				const group = buildDetailed(b, this.timeOfDay);
				group.traverse((ch) => {
					const m = ch;
					if (m.isMesh && m.userData.door) this.doors.push(m);
					const light = ch;
					if (light.isPointLight && light.userData.houseInteriorLight) this.houseInteriorLights.push(light);
					if (light.isPointLight && light.userData.houseExteriorLight) this.houseExteriorLights.push(light);
					if (m.isMesh && m.material) {
						const materials = Array.isArray(m.material) ? m.material : [m.material];
						for (const material of materials) {
							if (!(material instanceof MeshStandardMaterial)) continue;
							if (material.userData.houseWindow) this.houseWindows.push(material);
							if (material.userData.houseBulb) this.houseBulbs.push(material);
							if (material.userData.houseInteriorBulb) this.houseInteriorBulbs.push(material);
						}
					}
				});
				this.track(group);
				if (b.emissive && this.timeOfDay === "night") {
					const y0 = b.y ?? getHeight(b.x, b.z);
					const light = new PointLight(b.emissive, 1.15, 13);
					light.position.set(b.x, y0 + b.h * .65, b.z);
					light.castShadow = false;
					this.track(light);
				}
				continue;
			}
			const geo = b.kind === "dome" ? new SphereGeometry(Math.max(b.w, b.d) / 2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2) : new BoxGeometry(b.w, b.h, b.d);
			const tex = getTextures();
			const mat = new MeshStandardMaterial({
				map: b.kind === "tower" ? tex.concrete : tex.stone,
				color: b.color,
				roughness: .78,
				metalness: b.kind === "tower" ? .28 : .08,
				emissive: b.emissive ?? 0,
				emissiveIntensity: b.emissive ? this.timeOfDay === "night" ? .85 : .28 : 0
			});
			const mesh = new Mesh(geo, mat);
			const y0 = b.y ?? getHeight(b.x, b.z);
			mesh.position.set(b.x, y0 + (b.kind === "dome" ? 0 : b.h / 2), b.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.userData.bid = b.id;
			this.track(mesh);
			if (b.emissive && this.timeOfDay === "night") {
				const light = new PointLight(b.emissive, 1.1, 12);
				light.position.set(b.x, y0 + b.h * .7, b.z);
				light.castShadow = false;
				this.track(light);
			}
		}
	}
	buildFlora() {
		for (const obj of buildTrees(this.quality)) this.track(obj);
		this.track(buildRocks());
		this.track(buildBushes());
		this.track(buildGrass(this.quality));
		this.track(buildFlowers());
		this.track(buildLeafLitter(this.quality));
		this.track(buildTwigs(this.quality));
		this.track(buildUtilityPoles());
	}
	buildFurniture() {
		const night = this.timeOfDay === "night";
		const tex = getTextures();
		const wood = new MeshStandardMaterial({
			map: tex.wood,
			color: 5916212,
			roughness: .9
		});
		const iron = new MeshStandardMaterial({
			map: tex.metal,
			color: 2764332,
			roughness: .5,
			metalness: .4
		});
		const glass = new MeshStandardMaterial({
			color: 15784104,
			emissive: 15784104,
			emissiveIntensity: night ? 1.1 : .15,
			roughness: .3
		});
		generateLamps().forEach((lamp, i) => {
			const y = getHeight(lamp.x, lamp.z);
			const pole = new Mesh(new CylinderGeometry(.07, .09, 3.1, 6), iron);
			pole.position.set(lamp.x, y + 1.55, lamp.z);
			pole.castShadow = true;
			this.track(pole);
			const head = new Mesh(new SphereGeometry(.18, 8, 6), glass);
			head.position.set(lamp.x, y + 3.2, lamp.z);
			this.track(head);
			const light = new PointLight(16764040, 0, 26, 1.35);
			light.position.set(lamp.x, y + 3.15, lamp.z);
			light.castShadow = false;
			this.lampLights.push(light);
			this.track(light);
			head.userData.lampBulb = true;
			this.lampBulbs.push(glass);
		});
		for (const b of generateBenches()) {
			const y = getHeight(b.x, b.z);
			const seat = new Mesh(new BoxGeometry(1.6, .1, .48), wood);
			seat.position.set(b.x, y + .42, b.z);
			seat.rotation.y = b.yaw;
			seat.castShadow = true;
			this.track(seat);
			const back = new Mesh(new BoxGeometry(1.6, .42, .08), wood);
			back.position.set(b.x + Math.sin(b.yaw) * .2, y + .68, b.z + Math.cos(b.yaw) * .2);
			back.rotation.y = b.yaw;
			this.track(back);
		}
		const rail = new MeshStandardMaterial({
			map: tex.wood,
			color: 6968132,
			roughness: .85
		});
		for (const f of generateFences()) {
			const y = getHeight(f.x, f.z);
			const bar = new Mesh(new BoxGeometry(f.len, .08, .08), rail);
			bar.position.set(f.x, y + .7, f.z);
			bar.rotation.y = f.yaw;
			this.track(bar);
			const bar2 = new Mesh(new BoxGeometry(f.len, .08, .08), rail);
			bar2.position.set(f.x, y + .4, f.z);
			bar2.rotation.y = f.yaw;
			this.track(bar2);
		}
		for (const s of generateSigns()) {
			const y = getHeight(s.x, s.z);
			const post = new Mesh(new CylinderGeometry(.05, .06, 1.4, 5), wood);
			post.position.set(s.x, y + .7, s.z);
			this.track(post);
			const texSign = makeSignTexture(s.label);
			const board = new Mesh(new PlaneGeometry(1.6, .42), new MeshStandardMaterial({
				map: texSign,
				roughness: .8,
				side: 2
			}));
			board.position.set(s.x, y + 1.35, s.z);
			board.rotation.y = s.yaw;
			this.track(board);
		}
	}
	buildSetDressing() {
		const jeep = buildJeepney();
		jeep.position.set(17.4, getHeight(17.4, -2.8), -2.8);
		jeep.rotation.y = .35;
		this.track(jeep);
		const well = buildWell();
		well.position.set(-7.6, getHeight(-7.6, 11.2), 11.2);
		this.track(well);
		const boat = buildBoat();
		boat.position.set(-62, 1.22, 56);
		boat.rotation.y = .4;
		this.track(boat);
		const line = buildClothesline();
		line.position.set(12.4, getHeight(12.4, 14.2), 14.2);
		line.rotation.y = .2;
		this.track(line);
		const table = buildTableSet();
		table.position.set(8.6, getHeight(8.6, 10.4), 10.4);
		this.track(table);
		this.track(buildStoryDressing(this.timeOfDay));
	}
	buildInteractables() {
		this.itemHalo = new PointLight(15784104, 0, 5.5);
		this.itemHalo.castShadow = false;
		this.scene.add(this.itemHalo);
		this.disposables.push(this.itemHalo);
		for (const it of this.sim.interactables) {
			const g = createItemMesh(it.id);
			g.position.set(it.x, it.y, it.z);
			this.scene.add(g);
			this.itemGroups.push(g);
			this.disposables.push(g);
		}
	}
	setCameraView(mode) {
		this.cameraView = mode;
		const third = mode === "third";
		this.tool.visible = !third;
		this.body.visible = third;
		this.camera.near = third ? .25 : .12;
		this.camera.updateProjectionMatrix();
	}
	setWeather(mode) {
		this.weatherMode = mode;
		this.timeOfDay = timeForWeather(mode, this.level.timeOfDay);
		this.audio.setTime(this.timeOfDay);
		this.sun.castShadow = this.timeOfDay !== "night" && this.quality !== "low";
		this.rain.visible = mode === "rain";
		this.celestial.geometry.dispose();
		this.celestial.geometry = new SphereGeometry(this.timeOfDay === "night" ? 5.2 : 6.5, 16, 12);
		this.celestial.material.color.setHex(this.timeOfDay === "night" ? 15265528 : 16773828);
		this.glow.visible = this.timeOfDay !== "night";
		if (this.timeOfDay === "night" && !this.stars) {
			this.stars = makeStars();
			this.scene.add(this.stars);
		} else if (this.timeOfDay !== "night" && this.stars) {
			this.scene.remove(this.stars);
			this.stars.geometry.dispose();
			this.stars.material.dispose();
			this.stars = null;
		}
		const cloudTint = mode === "rain" ? 10135720 : this.timeOfDay === "night" ? 9085112 : 16777215;
		const cloudOpacity = mode === "rain" ? .68 : this.timeOfDay === "night" ? .18 : .42;
		this.clouds?.traverse((obj) => {
			const mesh = obj;
			if (!mesh.isMesh) return;
			const material = mesh.material;
			material.color.setHex(cloudTint);
			material.opacity = cloudOpacity;
		});
		if (this.dust) this.dust.material.color.setHex(this.timeOfDay === "night" ? 12110040 : this.timeOfDay === "sunset" ? 1578e4 : 15262920);
	}
	setKeys(codes) {
		this.injected = codes.length ? codes : null;
	}
	setTouchAxis(f, r) {
		this.touchAxis.f = f;
		this.touchAxis.r = r;
	}
	focusPlay() {
		try {
			this.canvas.tabIndex = 0;
			this.canvas.setAttribute("aria-label", "Game view");
			this.canvas.focus({ preventScroll: true });
		} catch {}
	}
	clearMoveInput() {
		this.keys.clear();
		this.input.f = 0;
		this.input.r = 0;
		this.input.jump = false;
		this.input.sprint = false;
		this.input.crouch = false;
		this.padAxis.f = 0;
		this.padAxis.r = 0;
		this.padAxis.lookX = 0;
		this.padAxis.lookY = 0;
		this.touchAxis.f = 0;
		this.touchAxis.r = 0;
	}
	isDown(code) {
		if (this.injected) return this.injected.includes(code);
		return this.keys.has(code);
	}
	shouldCaptureKeys() {
		return this.sim.started && !this.paused && !this.sim.ended;
	}
	pollGamepad() {
		this.padAxis.f = this.qaPad?.f ?? 0;
		this.padAxis.r = this.qaPad?.r ?? 0;
		this.padAxis.lookX = 0;
		this.padAxis.lookY = 0;
		this.padAxis.jump = false;
		this.padAxis.sprint = false;
		this.padAxis.crouch = false;
		let interact = false;
		let lamp = false;
		const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
		for (const p of pads) {
			if (!p) continue;
			const left = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0, .18);
			this.padAxis.f += -left.y;
			this.padAxis.r += left.x;
			const right = radialDeadzone(p.axes[2] ?? 0, p.axes[3] ?? 0, .16);
			this.padAxis.lookX += right.x * 12;
			this.padAxis.lookY += right.y * 12;
			if (p.buttons[12]?.pressed) this.padAxis.f += 1;
			if (p.buttons[13]?.pressed) this.padAxis.f -= 1;
			if (p.buttons[14]?.pressed) this.padAxis.r -= 1;
			if (p.buttons[15]?.pressed) this.padAxis.r += 1;
			if (p.buttons[0]?.pressed) this.padAxis.jump = true;
			if (p.buttons[1]?.pressed || p.buttons[5]?.pressed || (p.buttons[7]?.value ?? 0) > .4) this.padAxis.sprint = true;
			if (p.buttons[4]?.pressed) this.padAxis.crouch = true;
			if (p.buttons[2]?.pressed) interact = true;
			if (p.buttons[3]?.pressed) lamp = true;
		}
		if (interact && !this.padPrev.interact) this.input.interact = true;
		if (lamp && !this.padPrev.lamp) this.sim.light = !this.sim.light;
		this.padPrev.interact = interact;
		this.padPrev.lamp = lamp;
	}
	gatherInput() {
		this.pollGamepad();
		let f = this.touchAxis.f + this.padAxis.f;
		let r = this.touchAxis.r + this.padAxis.r;
		if (this.isDown("KeyW") || this.isDown("ArrowUp")) f += 1;
		if (this.isDown("KeyS") || this.isDown("ArrowDown")) f -= 1;
		if (this.isDown("KeyD") || this.isDown("ArrowRight")) r += 1;
		if (this.isDown("KeyA") || this.isDown("ArrowLeft")) r -= 1;
		const len = Math.hypot(f, r);
		if (len > 1) {
			f /= len;
			r /= len;
		}
		this.input.f = f;
		this.input.r = r;
		this.input.sprint = this.isDown("ShiftLeft") || this.isDown("ShiftRight") || this.padAxis.sprint;
		this.input.crouch = this.isDown("KeyC") || this.isDown("ControlLeft") || this.padAxis.crouch;
		this.input.jump = this.isDown("Space") || this.padAxis.jump;
		this.input.lookX += this.touchLook.x + this.padAxis.lookX;
		this.input.lookY += this.touchLook.y + this.padAxis.lookY;
		this.touchLook.x = 0;
		this.touchLook.y = 0;
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.last = performance.now();
		const loop = (now) => {
			if (!this.running || this.disposed) return;
			this.raf = requestAnimationFrame(loop);
			const raw = Math.min(.1, (now - this.last) / 1e3);
			this.last = now;
			if (this.paused) {
				this.renderer.render(this.scene, this.camera);
				return;
			}
			this.acc += raw;
			const step = 1 / 60;
			this.gatherInput();
			while (this.acc >= step) {
				const foundBefore = this.sim.found.size;
				const inspectedBefore = this.sim.inspected.size;
				const grounded = this.sim.onGround;
				stepSim(this.sim, this.input, step);
				this.input.jump = false;
				this.input.interact = false;
				this.acc -= step;
				if (this.sim.found.size > foundBefore && this.sim.lastFound) {
					this.handReach = 1;
					this.hooks.onPickup(this.sim.lastFound);
				}
				if (this.sim.inspected.size > inspectedBefore) this.audio.inspect();
				if (!grounded && this.sim.onGround) {
					this.landDip = .07;
					this.audio.land(this.sim.surface);
				}
				this.audio.foot(this.sim.speed, step, this.sim.onGround && this.sim.started, this.sim.surface);
				this.audio.setIndoor(this.sim.indoor);
			}
			this.syncCamera(raw);
			this.syncWorld(now / 1e3, raw);
			this.renderer.render(this.scene, this.camera);
			this.hudAcc += raw;
			if (this.hudAcc > .08) {
				this.hudAcc = 0;
				this.hooks.onHud(hudOf(this.sim, this.audio.track.name), this.sim);
			}
			if (this.sim.ended && !this.endedSent) {
				this.endedSent = true;
				this.hooks.onEnd(this.sim);
			}
		};
		this.raf = requestAnimationFrame(loop);
		this.bind();
		this.installProbe();
	}
	installProbe() {
		window.__controlsTest = {
			getYaw: () => this.sim.yaw,
			getSpeed: () => this.sim.speed,
			getX: () => this.sim.x,
			getZ: () => this.sim.z,
			setKeys: (codes) => this.setKeys(codes)
		};
		window.__haven = {
			sim: () => this.sim,
			collect: (id) => {
				if (collectItem(this.sim, id)) this.hooks.onPickup(id);
			},
			expire: () => {
				this.sim.t = this.sim.timeLimit;
				this.sim.started = true;
				this.sim.ended = {
					status: "lose",
					reason: "time"
				};
			},
			win: () => {
				for (const it of this.sim.level.items) collectItem(this.sim, it.id);
			},
			focus: () => this.focusPlay(),
			input: () => ({
				f: this.input.f,
				r: this.input.r,
				keys: [...this.keys],
				pad: {
					f: this.padAxis.f,
					r: this.padAxis.r
				},
				started: this.sim.started,
				paused: this.paused,
				focused: document.activeElement === this.canvas
			}),
			audio: () => this.audio.state(),
			visual: () => {
				let instanced = 0;
				let instancedCulled = 0;
				this.scene.traverse((obj) => {
					const mesh = obj;
					if (mesh.isInstancedMesh) {
						instanced += 1;
						if (mesh.frustumCulled) instancedCulled += 1;
					}
				});
				return {
					sun: this.sun.position.toArray(),
					target: this.sun.target.position.toArray(),
					instancedCulled,
					instanced,
					fog: this.fog.color.getHex(),
					exposure: this.renderer.toneMappingExposure
				};
			},
			setPad: (v) => {
				this.qaPad = v;
			}
		};
	}
	syncCamera(dt) {
		const targetY = this.sim.y;
		this.camY += (targetY - this.camY) * (1 - Math.exp(-18 * dt));
		this.bob += this.sim.speed * dt * 1.35;
		let bobY = 0;
		let bobPitch = 0;
		if (this.sim.speed > .4 && this.sim.onGround) {
			bobY = Math.sin(this.bob) * .028;
			bobPitch = Math.cos(this.bob) * .006;
		}
		this.landDip += (0 - this.landDip) * (1 - Math.exp(-10 * dt));
		this.handReach += (0 - this.handReach) * (1 - Math.exp(-8 * dt));
		const night = this.timeOfDay === "night";
		const lit = this.sim.light;
		const flashInt = lit ? night ? 28 : this.timeOfDay === "sunset" ? 7.5 : 3.5 : night ? .12 : 0;
		this.flashlight.intensity = flashInt;
		this.flashlight.distance = night ? 72 : this.timeOfDay === "sunset" ? 48 : 30;
		this.flashlight.angle = night ? .68 : .54;
		this.flashFill.intensity = lit ? night ? 5.2 : this.timeOfDay === "sunset" ? 1.6 : .7 : 0;
		this.flashlight.target.position.set(0, -1.2, -10);
		const lensInt = lit ? 1.35 : .08;
		const handLens = this.tool.userData.lens;
		if (handLens) handLens.material.emissiveIntensity = lensInt;
		const bodyLens = this.body.userData.lens;
		if (bodyLens) bodyLens.material.emissiveIntensity = lensInt;
		if (this.cameraView === "third") this.syncThirdPerson(dt, bobY);
		else this.syncFirstPerson(dt, bobY, bobPitch);
	}
	syncFirstPerson(dt, bobY, bobPitch) {
		this.camera.position.x = this.sim.x;
		this.camera.position.z = this.sim.z;
		this.camera.position.y = this.camY + bobY - this.landDip;
		this.camera.rotation.y = this.sim.yaw;
		this.camera.rotation.x = this.sim.pitch + bobPitch;
		const wantRoll = this.input.r * -.02;
		this.camRoll += (wantRoll - this.camRoll) * (1 - Math.exp(-8 * dt));
		this.camera.rotation.z = this.camRoll;
		const t = performance.now() / 1e3;
		const idle = Math.sin(t * 1.15) * .006;
		const walk = this.sim.speed > .3 ? Math.sin(this.bob * 2) * (this.sim.speed > 8 ? .022 : .012) : 0;
		const aspect = Math.max(.45, this.camera.aspect);
		const xHold = .1 + Math.min(.16, Math.max(0, (aspect - .55) * .14));
		const yHold = aspect < .75 ? -.26 : -.3;
		this.tool.position.set(xHold, yHold + idle + walk - this.handReach * .04, -.46 - this.handReach * .08);
		this.tool.rotation.set(-.08 + this.handReach * .28, .14, .04 + Math.sin(this.bob) * .02);
		this.tool.scale.setScalar(aspect < .7 ? .82 : 1);
		this.body.visible = false;
		this.tool.visible = true;
	}
	syncThirdPerson(_dt, bobY) {
		this.tool.visible = false;
		this.body.visible = true;
		const ground = getHeight(this.sim.x, this.sim.z);
		this.body.position.set(this.sim.x, ground, this.sim.z);
		this.body.rotation.y = this.sim.yaw;
		const fx = -Math.sin(this.sim.yaw);
		const fz = -Math.cos(this.sim.yaw);
		const pitch = this.sim.pitch;
		const dist = 3.6 + Math.max(0, pitch) * .8;
		const height = 1.45 - pitch * 1.1;
		let cx = this.sim.x - fx * dist;
		let cy = ground + height;
		let cz = this.sim.z - fz * dist;
		const pulled = pullCam(this.sim.x, ground + 1.35, this.sim.z, cx, cy, cz, this.aabbs);
		this.camera.position.set(pulled.x, pulled.y, pulled.z);
		this.camera.lookAt(this.sim.x + fx * .4, this.camY + pitch * .4, this.sim.z + fz * .4);
		this.camera.rotation.z = 0;
	}
	syncWorld(t, dt) {
		tickWind(t);
		const lookId = this.sim.looking?.id ?? null;
		for (const g of this.itemGroups) {
			const id = g.userData.iid;
			const taken = this.sim.found.has(id);
			g.visible = !taken;
			if (taken) continue;
			g.rotation.y = t * .9;
			const base = this.sim.interactables.find((i) => i.id === id);
			if (base) g.position.y = base.y + Math.sin(t * 2.1 + base.x) * .08;
			if (lookId !== this.lastLookId) {
				const look = lookId === id;
				g.traverse((ch) => {
					const m = ch;
					if (m.isMesh && m.material && "emissiveIntensity" in m.material) m.material.emissiveIntensity = look ? .85 : .32;
				});
			}
		}
		this.lastLookId = lookId;
		if (this.itemHalo) {
			if (this.sim.looking && !this.sim.ended && this.sim.looking) {
				const g = this.itemGroups.find((it) => it.userData.iid === this.sim.looking.id && it.visible);
				if (g) {
					this.itemHalo.position.copy(g.position);
					this.itemHalo.color.setHex(ITEM_GLOW[this.sim.looking.id]);
				}
				const target = this.timeOfDay === "night" ? .85 : .4;
				this.itemHalo.intensity += (target - this.itemHalo.intensity) * Math.min(1, dt * 6);
			} else this.itemHalo.intensity += (0 - this.itemHalo.intensity) * Math.min(1, dt * 8);
		}
		const progress = this.sim.started ? 1 - remainingOf(this.sim) / Math.max(1, this.sim.timeLimit) : 0;
		const sampledPreset = sampleSky(this.timeOfDay, progress);
		const preset = this.weatherMode === "rain" ? {
			...sampledPreset,
			bg: 8491153,
			fog: 10727597,
			fogNear: 18,
			fogFar: Math.min(sampledPreset.fogFar, 92),
			hemiSky: 12108221,
			sunColor: 14015445,
			sunInt: sampledPreset.sunInt * .68,
			hemiInt: sampledPreset.hemiInt * 1.05,
			ambient: Math.max(.34, sampledPreset.ambient * .95),
			exposure: Math.max(1.02, sampledPreset.exposure),
			zenith: 6847358,
			horizon: 10662062
		} : sampledPreset;
		applyLighting({
			sun: this.sun,
			fill: this.fill,
			hemi: this.hemi,
			ambient: this.ambient,
			fog: this.fog,
			renderer: this.renderer,
			sky: this.sky,
			celestial: this.celestial,
			glow: this.glow
		}, preset, this.sim.x, this.sim.z, this.timeOfDay === "night");
		this.scene.background = this.fog.color;
		if (this.weatherMode === "rain") this.glow.material.opacity = .035;
		placeSun(this.sun, preset, this.sim.x, this.sim.z);
		this.sky.position.set(this.sim.x, 0, this.sim.z);
		if (this.stars) this.stars.position.set(this.sim.x, 0, this.sim.z);
		if (this.clouds) updateClouds(this.clouds, t, this.camera.position);
		if (this.rain.visible) updateRain(this.rain, this.camera.position, dt);
		if (this.dust) updateDust(this.dust, this.camera.position, dt, this.sim.indoor);
		for (const mesh of this.waterMeshes) {
			const pos = mesh.geometry.attributes.position;
			const wave = mesh.userData.wave ?? .05;
			for (let i = 0; i < pos.count; i++) {
				const x = pos.getX(i);
				const z = pos.getZ(i);
				pos.setY(i, Math.sin(t * 1.1 + x * .35 + z * .28) * wave + Math.sin(t * .7 + x * .12) * wave * .45);
			}
			pos.needsUpdate = true;
		}
		for (const door of this.doors) {
			const residence = door.userData.residence;
			if (!residence) continue;
			const dx = this.sim.x - residence.x;
			const dz = this.sim.z - residence.z;
			const localX = Math.cos(residence.yaw) * dx - Math.sin(residence.yaw) * dz;
			const localZ = Math.sin(residence.yaw) * dx + Math.cos(residence.yaw) * dz;
			const doorTarget = Math.abs(localX - residence.doorX) < residence.doorWidth / 2 + .75 && localZ > -residence.d / 2 - 1.35 && localZ < -residence.d / 2 + 1.3 ? door.userData.openYaw ?? -1.15 : 0;
			door.rotation.y += (doorTarget - door.rotation.y) * Math.min(1, dt * 3.2);
		}
		this.houseInteriorLights.forEach((light) => {
			const residence = light.userData.houseCenter;
			const dx = residence ? this.sim.x - residence.x : Infinity;
			const dz = residence ? this.sim.z - residence.z : Infinity;
			const localX = residence ? Math.cos(residence.yaw) * dx - Math.sin(residence.yaw) * dz : Infinity;
			const localZ = residence ? Math.sin(residence.yaw) * dx + Math.cos(residence.yaw) * dz : Infinity;
			const insideResidence = Boolean(residence && Math.abs(localX) < residence.w / 2 && Math.abs(localZ) < residence.d / 2);
			const interiorLit = this.timeOfDay === "night" || this.sim.indoor && insideResidence;
			const nightIntensity = light.userData.nightIntensity ?? 38;
			light.intensity = interiorLit ? this.timeOfDay === "night" ? nightIntensity : 34 : 0;
			light.distance = 19;
		});
		const remain = remainingOf(this.sim);
		const isNight = this.timeOfDay === "night";
		const isRain = this.weatherMode === "rain";
		const exteriorFactor = isNight ? 1 : isRain ? .58 : this.timeOfDay === "sunset" ? .76 : .34;
		this.houseExteriorLights.forEach((light) => {
			light.intensity = 10.5 * exteriorFactor;
		});
		this.houseBulbs.forEach((material) => {
			material.emissiveIntensity = isNight ? 1.75 : isRain ? .9 : this.timeOfDay === "sunset" ? 1.2 : .58;
		});
		this.houseWindows.forEach((material) => {
			material.emissiveIntensity = isNight ? .95 : isRain ? .46 : this.timeOfDay === "sunset" ? .56 : .2;
		});
		const indoorLightsOn = isNight || this.sim.indoor && this.timeOfDay !== "day";
		this.houseInteriorBulbs.forEach((material) => {
			material.emissiveIntensity = indoorLightsOn ? 1.8 : this.sim.indoor ? 1.55 : .35;
		});
		this.lampLights.forEach((light) => {
			light.intensity = isNight ? 9.5 : isRain ? 3.8 : this.timeOfDay === "sunset" ? 5 : .8;
		});
		this.lampBulbs.forEach((material) => {
			material.emissiveIntensity = isNight ? 1.8 : isRain ? 1 : this.timeOfDay === "sunset" ? 1.4 : .42;
		});
		const band = remain < 20 ? 0 : remain < 60 ? 1 : 2;
		if (this.sim.started && band < this.lastRemainBand && band <= 1) {
			this.audio.tickLow();
			this.lastRemainBand = band;
		}
	}
	bind() {
		const down = (e) => {
			if (isTextEntry(e.target)) return;
			this.keys.add(e.code);
			if (GAME_CODES.has(e.code) && this.shouldCaptureKeys() && !e.metaKey && !e.ctrlKey && !e.altKey) e.preventDefault();
			if (e.repeat) return;
			if (e.code === "KeyE") this.input.interact = true;
			if (e.code === "KeyF") this.sim.light = !this.sim.light;
		};
		const up = (e) => {
			this.keys.delete(e.code);
		};
		const move = (e) => {
			if (!this.pointerLocked) return;
			this.input.lookX += e.movementX;
			this.input.lookY += e.movementY;
		};
		let lookId = null;
		let lastTx = 0;
		let lastTy = 0;
		const tStart = (e) => {
			for (const t of Array.from(e.changedTouches)) if (t.clientX > this.canvas.clientWidth * .42) {
				lookId = t.identifier;
				lastTx = t.clientX;
				lastTy = t.clientY;
			}
		};
		const tMove = (e) => {
			for (const t of Array.from(e.changedTouches)) if (t.identifier === lookId) {
				this.touchLook.x += (t.clientX - lastTx) * 1.6;
				this.touchLook.y += (t.clientY - lastTy) * 1.6;
				lastTx = t.clientX;
				lastTy = t.clientY;
			}
		};
		const tEnd = (e) => {
			for (const t of Array.from(e.changedTouches)) if (t.identifier === lookId) lookId = null;
		};
		const blur = () => this.clearMoveInput();
		const opts = { capture: true };
		window.addEventListener("keydown", down, opts);
		window.addEventListener("keyup", up, opts);
		window.addEventListener("mousemove", move);
		window.addEventListener("blur", blur);
		window.addEventListener("resize", this.onResize);
		this.canvas.addEventListener("touchstart", tStart, { passive: true });
		this.canvas.addEventListener("touchmove", tMove, { passive: true });
		this.canvas.addEventListener("touchend", tEnd);
		document.addEventListener("visibilitychange", this.onVis);
		document.addEventListener("pointerlockchange", this.onLock);
		this._unbind = () => {
			window.removeEventListener("keydown", down, opts);
			window.removeEventListener("keyup", up, opts);
			window.removeEventListener("mousemove", move);
			window.removeEventListener("blur", blur);
			window.removeEventListener("resize", this.onResize);
			this.canvas.removeEventListener("touchstart", tStart);
			this.canvas.removeEventListener("touchmove", tMove);
			this.canvas.removeEventListener("touchend", tEnd);
			document.removeEventListener("visibilitychange", this.onVis);
			document.removeEventListener("pointerlockchange", this.onLock);
		};
	}
	onVis = () => {
		if (document.hidden) this.clearMoveInput();
		else this.audio.resume();
	};
	onLock = () => {
		this.pointerLocked = document.pointerLockElement === this.canvas;
	};
	onResize = () => {
		const w = this.canvas.clientWidth || 1;
		const h = this.canvas.clientHeight || 1;
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(w, h, false);
	};
	requestLock() {
		this.audio.unlock();
		this.focusPlay();
		const p = this.canvas.requestPointerLock?.({ unadjustedMovement: true });
		if (p && typeof p.then === "function") p.catch(() => this.canvas.requestPointerLock());
	}
	pause(v) {
		this.paused = v;
		this.audio.setPaused(v);
		if (v) {
			this.clearMoveInput();
			if (document.pointerLockElement) document.exitPointerLock();
		} else this.focusPlay();
	}
	interactNow() {
		this.input.interact = true;
	}
	begin() {
		beginWalk(this.sim);
		this.audio.beginGameplay();
		this.focusPlay();
		this.requestLock();
	}
	dispose() {
		this.disposed = true;
		this.running = false;
		cancelAnimationFrame(this.raf);
		this._unbind();
		this.audio.release();
		this.scene.traverse((obj) => {
			const mesh = obj;
			if (mesh.geometry) mesh.geometry.dispose();
			const mat = mesh.material;
			if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
			else if (mat) mat.dispose();
		});
		this.renderer.dispose();
		resetStructureMaterials();
		window.__controlsTest = void 0;
		window.__haven = void 0;
	}
};
function timeForWeather(mode, levelTime) {
	if (mode === "auto") return levelTime;
	if (mode === "sunny" || mode === "rain") return "day";
	return mode;
}
function pullCam(px, py, pz, cx, cy, cz, aabbs) {
	const dx = cx - px;
	const dy = cy - py;
	const dz = cz - pz;
	let tHit = 1;
	for (const b of aabbs) {
		const t = rayAabb(px, py, pz, dx, dy, dz, b.minX, b.maxX, b.minY, b.maxY, b.minZ, b.maxZ);
		if (t != null && t > .04 && t < tHit) tHit = t;
	}
	const t = Math.max(.42, tHit - .22);
	return {
		x: px + dx * t,
		y: py + dy * t,
		z: pz + dz * t
	};
}
function rayAabb(ox, oy, oz, dx, dy, dz, minX, maxX, minY, maxY, minZ, maxZ) {
	const invX = 1 / (dx || 1e-8);
	const invY = 1 / (dy || 1e-8);
	const invZ = 1 / (dz || 1e-8);
	let t1 = (minX - ox) * invX;
	let t2 = (maxX - ox) * invX;
	let tmin = Math.min(t1, t2);
	let tmax = Math.max(t1, t2);
	t1 = (minY - oy) * invY;
	t2 = (maxY - oy) * invY;
	tmin = Math.max(tmin, Math.min(t1, t2));
	tmax = Math.min(tmax, Math.max(t1, t2));
	t1 = (minZ - oz) * invZ;
	t2 = (maxZ - oz) * invZ;
	tmin = Math.max(tmin, Math.min(t1, t2));
	tmax = Math.min(tmax, Math.max(t1, t2));
	if (tmax < tmin || tmax < 0) return null;
	return tmin > 0 ? tmin : tmax;
}
function makeSignTexture(label) {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 64;
	const ctx = c.getContext("2d");
	ctx.fillStyle = "#6a5344";
	ctx.fillRect(0, 0, 256, 64);
	ctx.fillStyle = "#e8e0d0";
	ctx.font = "600 22px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(label, 128, 34);
	const tex = new CanvasTexture(c);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}
function item(id, zone, x, z) {
	const info = ITEM_INFO[id];
	return {
		id,
		name: info.name,
		blurb: info.blurb,
		zone,
		x,
		z,
		hint: info.hint
	};
}
var LEVELS = [
	{
		id: 1,
		slug: "hapon",
		title: "The Lost Afternoon",
		tagalog: "Hapon sa Bakuran",
		blurb: "Find four things left in the courtyard.",
		timeOfDay: "day",
		timeLimit: 240,
		spawn: {
			x: 2,
			z: 8,
			yaw: .2
		},
		items: [
			item("tsinelas", "central", 10.2, 6.1),
			item("old_key", "central", 3.4, 14.6),
			item("notebook", "central", -12.1, 4.2),
			item("payong", "central", 8.4, -10.2)
		]
	},
	{
		id: 2,
		slug: "bahay",
		title: "The Old House",
		tagalog: "Ang Lumang Bahay",
		blurb: "The ancestral house is open. Look on the porch, then wander the yard.",
		timeOfDay: "day",
		timeLimit: 280,
		spawn: {
			x: 2,
			z: 8,
			yaw: 0
		},
		items: [
			item("rosaryo", "central", 1.2, 19.4),
			item("salamin", "central", -4.6, 16.8),
			item("liham", "central", 14.8, 8.4),
			item("abaniko", "central", -16.4, 7.2),
			item("baon", "maintenance", 16.2, 68.4)
		]
	},
	{
		id: 3,
		slug: "gubat",
		title: "The Quiet Grove",
		tagalog: "Tahimik na Gubat",
		blurb: "The service path leads into the trees. Five things, a little farther.",
		timeOfDay: "day",
		timeLimit: 300,
		spawn: {
			x: 2,
			z: 8,
			yaw: -1.2
		},
		items: [
			item("camera", "forest", 98, 16),
			item("backpack", "forest", 82.4, 8.6),
			item("sombrero", "forest", 90.2, 4.4),
			item("compass", "shelter", 84.2, 68.4),
			item("battery", "maintenance", 24.6, 78.2)
		]
	},
	{
		id: 4,
		slug: "hardin",
		title: "The Walled Garden",
		tagalog: "Hardin na Nakapinid",
		blurb: "The light is turning. The locked garden isn't locked anymore.",
		timeOfDay: "sunset",
		timeLimit: 300,
		spawn: {
			x: 2,
			z: 8,
			yaw: 2.4
		},
		items: [
			item("notebook", "research", 18, -74),
			item("abaniko", "restricted", -48.4, -84.2),
			item("liham", "restricted", -54.6, -94.4),
			item("payong", "research", 4.2, -78.6),
			item("old_key", "restricted", -40.8, -80.2)
		]
	},
	{
		id: 5,
		slug: "ilaw",
		title: "Lamp Light",
		tagalog: "Mga Ilaw sa Daan",
		blurb: "Follow the lamps. Six belongings along the paths as the sky goes warm.",
		timeOfDay: "sunset",
		timeLimit: 270,
		spawn: {
			x: 2,
			z: 8,
			yaw: .4
		},
		items: [
			item("lantern", "energy", -86.4, -8.2),
			item("flashlight", "energy", -92.2, -16.4),
			item("battery", "central", -10.2, -6.4),
			item("radio", "energy", -78.6, -20.2),
			item("tsinelas", "flooded", -60.4, 50.2),
			item("tabo", "flooded", -68.2, 52.6)
		]
	},
	{
		id: 6,
		slug: "tubig",
		title: "The Lily Pond",
		tagalog: "Sa Gilid ng Tubig",
		blurb: "Dock, mill, and the long way around the water.",
		timeOfDay: "day",
		timeLimit: 300,
		spawn: {
			x: -40,
			z: 30,
			yaw: 2.2
		},
		items: [
			item("backpack", "flooded", -58, 44),
			item("baon", "flooded", -62.4, 56.2),
			item("radio", "energy", -90, -10.4),
			item("camera", "central", 10.4, 6.2),
			item("compass", "maintenance", 14.2, 72.4),
			item("sombrero", "shelter", 88.2, 70.4)
		]
	},
	{
		id: 7,
		slug: "burol",
		title: "Hill Garden",
		tagalog: "Hardin sa Burol",
		blurb: "Up the hill before the light goes. Watch your step.",
		timeOfDay: "sunset",
		timeLimit: 320,
		spawn: {
			x: 8,
			z: -40,
			yaw: -.6
		},
		items: [
			item("compass", "mountain", 62, -58),
			item("sombrero", "mountain", 68.4, -70.2),
			item("lantern", "mountain", 80.2, -78.6),
			item("notebook", "research", 14.4, -88.2),
			item("salamin", "extraction", -6.4, -122.2),
			item("liham", "extraction", 4.2, -128.4)
		]
	},
	{
		id: 8,
		slug: "gabi",
		title: "Night Walk",
		tagalog: "Lakad sa Gabi",
		blurb: "First real night. Keep the lamp on. The grounds look different in the dark.",
		timeOfDay: "night",
		timeLimit: 360,
		spawn: {
			x: 2,
			z: 8,
			yaw: .15
		},
		items: [
			item("flashlight", "central", 16.4, 12.2),
			item("lantern", "shelter", 78.6, 74.2),
			item("battery", "forest", 88.4, 2.2),
			item("old_key", "restricted", -52.2, -90.4),
			item("radio", "energy", -84.2, -14.6),
			item("camera", "extraction", .4, -124.2),
			item("backpack", "flooded", -70.4, 48.6)
		]
	},
	{
		id: 9,
		slug: "buong",
		title: "The Whole Grounds",
		tagalog: "Buong Bakuran",
		blurb: "Seven things, every corner. The map helps. The lamp still helps more.",
		timeOfDay: "sunset",
		timeLimit: 330,
		spawn: {
			x: 2,
			z: 8,
			yaw: 0
		},
		items: [
			item("tsinelas", "central", -12.4, 4.6),
			item("payong", "research", .6, -80.4),
			item("baon", "maintenance", 26.2, 80.4),
			item("tabo", "flooded", -62, 56),
			item("rosaryo", "restricted", -62.4, -96.2),
			item("compass", "mountain", 74.2, -74.4),
			item("camera", "forest", 96.4, 10.2)
		]
	},
	{
		id: 10,
		slug: "huli",
		title: "The Final Search",
		tagalog: "Huling Hanap",
		blurb: "Night again. Eight belongings. This is the last walk — take your time, just not too much.",
		timeOfDay: "night",
		timeLimit: 360,
		spawn: {
			x: 2,
			z: 8,
			yaw: .15
		},
		items: [
			item("old_key", "shelter", 88, 78),
			item("camera", "forest", 98, 16),
			item("notebook", "research", 18, -74),
			item("compass", "mountain", 62, -58),
			item("backpack", "flooded", -58, 44),
			item("flashlight", "energy", -96.2, -18.4),
			item("liham", "extraction", .2, -126.4),
			item("rosaryo", "central", .6, 19.8)
		]
	}
];
var LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
function levelById(id) {
	return LEVEL_MAP[id] ?? LEVELS[0];
}
function isUnlocked(id, completed) {
	if (id <= 1) return true;
	return completed.includes(id - 1);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatClock(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
var BANNED = /\b(fuck|shit|bitch|asshole|bastard|cunt|nigger|nigga|faggot|retard|putangina|tangina|gago|bobo|tanga|ulol|inutil|puki|pussy|slut|whore)\b/i;
function sanitizeUsername(raw) {
	const cleaned = raw.replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N} .'\-ñÑ]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
	if (!cleaned || BANNED.test(cleaned)) return "Kaibigan";
	return cleaned;
}
function starsFromRatio(remaining, limit) {
	const ratio = limit <= 0 ? 0 : remaining / limit;
	if (ratio > .5) return 5;
	if (ratio > .35) return 4;
	if (ratio > .2) return 3;
	if (ratio > .08) return 2;
	return 1;
}
var SAVE_KEY = "bakuran-save-v1";
var defaultSettings = () => ({
	master: .85,
	music: .55,
	sfx: .7,
	ambience: .22,
	quality: "medium",
	minimap: true,
	dialogue: true,
	textScale: 1,
	cameraView: "first",
	weather: "auto"
});
var emptySave = () => ({
	version: 1,
	username: "",
	completed: [],
	bestTime: {},
	stars: {},
	itemsFound: 0,
	lastLevel: 1,
	tutorialSeen: false,
	settings: defaultSettings()
});
function migrate(raw) {
	const base = emptySave();
	return {
		...base,
		...raw,
		version: 1,
		username: sanitizeUsername(raw.username || ""),
		completed: Array.isArray(raw.completed) ? raw.completed.filter((n) => n >= 1 && n <= 10) : [],
		bestTime: raw.bestTime && typeof raw.bestTime === "object" ? raw.bestTime : {},
		stars: raw.stars && typeof raw.stars === "object" ? raw.stars : {},
		itemsFound: Number(raw.itemsFound) || 0,
		lastLevel: Math.min(10, Math.max(1, Number(raw.lastLevel) || 1)),
		tutorialSeen: Boolean(raw.tutorialSeen),
		settings: {
			...base.settings,
			...raw.settings ?? {}
		}
	};
}
function loadSave() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return emptySave();
		return migrate(JSON.parse(raw));
	} catch {
		return emptySave();
	}
}
function writeSave(data) {
	try {
		localStorage.setItem(SAVE_KEY, JSON.stringify({
			...data,
			version: 1
		}));
	} catch {}
}
var boot = emptySave();
var useGameUi = create((set, get) => ({
	save: boot,
	flow: "title",
	overlay: "none",
	levelId: 1,
	timeOfDay: "sunset",
	hud: null,
	sim: null,
	locked: false,
	dialogue: "",
	trackName: "Lazy Afternoon Tambayan",
	hydrated: false,
	setHud: (hud, sim) => set({
		hud,
		sim,
		dialogue: hud.dialogue,
		trackName: hud.trackName
	}),
	setOverlay: (overlay) => set({ overlay }),
	setFlow: (flow) => set({ flow }),
	setLevel: (id) => {
		const level = levelById(id);
		const save = {
			...get().save,
			lastLevel: level.id,
			tutorialSeen: true
		};
		writeSave(save);
		set({
			save,
			levelId: level.id,
			timeOfDay: level.timeOfDay,
			overlay: "briefing",
			flow: "game",
			locked: false,
			hud: null
		});
	},
	setLocked: (locked) => set({ locked }),
	setDialogue: (dialogue) => set({ dialogue }),
	setTrackName: (trackName) => set({ trackName }),
	hydrate: () => {
		if (get().hydrated) return;
		const save = loadSave();
		set({
			save,
			flow: "title",
			levelId: 1,
			hydrated: true
		});
		document.documentElement.style.fontSize = `${Math.round(16 * save.settings.textScale)}px`;
	},
	login: (name) => {
		const username = sanitizeUsername(name);
		const save = {
			...get().save,
			username
		};
		writeSave(save);
		set({
			save,
			flow: "menu"
		});
	},
	markTutorialSeen: () => {
		const save = {
			...get().save,
			tutorialSeen: true
		};
		writeSave(save);
		set({ save });
	},
	updateSettings: (partial) => {
		const settings = {
			...get().save.settings,
			...partial
		};
		const save = {
			...get().save,
			settings
		};
		writeSave(save);
		set({ save });
		if (partial.textScale) document.documentElement.style.fontSize = `${Math.round(16 * settings.textScale)}px`;
	},
	recordWin: (levelId, remaining, limit, items) => {
		const used = Math.max(1, Math.round(limit - remaining));
		const stars = starsFromRatio(remaining, limit);
		const prev = get().save;
		const prevBest = prev.bestTime[String(levelId)];
		const bestTime = { ...prev.bestTime };
		if (!prevBest || used < prevBest) bestTime[String(levelId)] = used;
		const prevStars = prev.stars[String(levelId)] ?? 0;
		const starMap = {
			...prev.stars,
			[String(levelId)]: Math.max(prevStars, stars)
		};
		const completed = prev.completed.includes(levelId) ? prev.completed : [...prev.completed, levelId];
		const save = {
			...prev,
			completed,
			bestTime,
			stars: starMap,
			itemsFound: prev.itemsFound + items,
			lastLevel: Math.min(LEVELS.length, levelId + 1)
		};
		writeSave(save);
		set({ save });
	},
	resetUi: () => set({
		overlay: "briefing",
		locked: false,
		sim: null,
		hud: null,
		dialogue: ""
	})
}));
var sharedButtonStyle = "rounded-[10px] border border-[#dfb66b]/40 bg-[#101715]/90 text-[#f4efe6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_22px_rgba(223,182,107,0.1)] hover:border-[#dfb66b]/70 hover:bg-[#151d1a]";
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,border-color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.98]", {
	variants: {
		variant: {
			primary: sharedButtonStyle,
			secondary: sharedButtonStyle,
			ghost: sharedButtonStyle,
			danger: sharedButtonStyle
		},
		size: {
			sm: "h-9 px-3 text-sm",
			md: "h-11 px-4 text-sm",
			lg: "h-12 px-5 text-base"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function FlowScreens({ onWeatherChange }) {
	const flow = useGameUi((s) => s.flow);
	if (flow === "game") return null;
	if (flow === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/50 p-4",
		children: [
			flow === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, {}),
			flow === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuScreen, {}),
			flow === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileScreen, {}),
			flow === "levels" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelScreen, {}),
			flow === "settings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsScreen, {
				onBack: () => useGameUi.getState().setFlow("menu"),
				onWeatherChange
			})
		]
	});
}
function Shell({ kicker, title, children, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("panel-in w-full rounded-[20px] border border-white/10 bg-[#0f1514]/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-[10px] sm:p-8", wide ? "max-w-2xl" : "max-w-lg"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-[11px] uppercase tracking-[0.28em] text-accent",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl tracking-tight",
				children: title
			}),
			children
		]
	});
}
function TitleScreen() {
	const setFlow = useGameUi((s) => s.setFlow);
	const username = useGameUi((s) => s.save.username);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "bakuran-title pointer-events-auto absolute inset-0 overflow-y-auto text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bakuran-title__frame",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "bakuran-title__masthead",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bakuran-title__brand",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "bakuran-title__brand-copy",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "BAKURAN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "MEMORY WALK · PHILIPPINES" })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bakuran-title__edition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "THE ANCESTRAL GROUNDS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "bakuran-title__seal",
							"aria-hidden": "true",
							children: "B"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "bakuran-title__hero",
					"aria-labelledby": "bakuran-title-heading",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bakuran-title__art",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bakuran-title__hero-shade" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bakuran-title__hero-top",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "bakuran-title__eyebrow",
								children: "Naiwan. Hanapin."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bakuran-title__hero-bottom",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bakuran-title__story",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									id: "bakuran-title-heading",
									children: [
										"Find the Lost",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"Things"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "bakuran-title__description",
									children: "A memory walk through the old yard."
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "bakuran-title__start",
								size: "lg",
								onClick: () => {
									getSharedAudio().unlock();
									setFlow(username ? "menu" : "login");
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 fill-current" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Simulan ang paglalakbay" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "bakuran-title__chapters",
					"aria-label": "Mga tagpo sa bakuran",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
							className: "bakuran-title__chapter bakuran-title__chapter--courtyard",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01 / LIWASAN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Ang lumang bakuran" })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
							className: "bakuran-title__chapter bakuran-title__chapter--house",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "02 / TAHANAN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Bukas ang pinto" })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
							className: "bakuran-title__chapter bakuran-title__chapter--night",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "03 / PAGGABI" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Ilaw sa daan" })] })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "bakuran-title__footer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ISANG PAGLALAKAD SA MGA BAGAY NA NAIWAN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "10 PAGHAHANAP\xA0 · \xA01 LUMANG TAHANAN" })]
				})
			]
		})
	});
}
function LoginScreen() {
	const login = useGameUi((s) => s.login);
	const existing = useGameUi((s) => s.save.username);
	const [name, setName] = (0, import_react.useState)(existing);
	const preview = sanitizeUsername(name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		kicker: "Sino ka?",
		title: "Your name",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "This is how the grounds will call you. Saved on this device."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "mt-5 block text-[11px] uppercase tracking-[0.16em] text-subtle",
				htmlFor: "player-name",
				children: "Enter your name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "player-name",
				autoFocus: true,
				maxLength: 16,
				value: name,
				onChange: (e) => setName(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter" && preview) login(name);
				},
				placeholder: "Juan",
				className: "mt-2 h-12 w-full rounded-[16px] border border-border bg-elevated px-4 text-base text-fg outline-none ring-accent/60 focus:ring-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-subtle",
				children: ["Shown as ", preview]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6 w-full",
				size: "lg",
				disabled: !name.trim(),
				onClick: () => login(name),
				children: "Continue"
			})
		]
	});
}
function MenuScreen() {
	const save = useGameUi((s) => s.save);
	const setFlow = useGameUi((s) => s.setFlow);
	const setLevel = useGameUi((s) => s.setLevel);
	const markTutorialSeen = useGameUi((s) => s.markTutorialSeen);
	const next = Math.min(10, (Math.max(0, ...save.completed) || 0) + 1);
	const continueId = isUnlocked(save.lastLevel, save.completed) ? save.lastLevel : next;
	const [showGuide, setShowGuide] = (0, import_react.useState)(!save.tutorialSeen);
	(0, import_react.useEffect)(() => {
		setShowGuide(!save.tutorialSeen);
	}, [save.tutorialSeen]);
	const startWalk = () => {
		markTutorialSeen();
		setLevel(continueId);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		kicker: `Kumusta, ${save.username}`,
		title: "Bakuran",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Walk the grounds. Ten searches. One ancestral yard."
			}),
			showGuide && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bakuran-quick-guide panel-in mt-5 rounded-[18px] border border-accent/30 bg-[#101916]/90 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-[11px] uppercase tracking-[0.18em] text-accent",
						children: "Quick guide"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2 text-sm text-fg/90",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: "WASD"
							}), " move through the yard."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: "E"
							}), " inspect or pick up what you find."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: "F"
							}), " switch the lantern on and off."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-accent",
								children: "Esc"
							}), " pause and return to the menu."] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							size: "sm",
							onClick: startWalk,
							children: "Start walk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							variant: "secondary",
							size: "sm",
							onClick: () => {
								markTutorialSeen();
								setShowGuide(false);
							},
							children: "I know it"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						size: "lg",
						onClick: startWalk,
						children: save.completed.length ? "Continue walk" : "Begin walk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						variant: "secondary",
						onClick: () => setFlow("levels"),
						children: "Level select"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						variant: "secondary",
						onClick: () => setFlow("profile"),
						children: "Player profile"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						variant: "ghost",
						onClick: () => setFlow("settings"),
						children: "Settings"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-center text-[11px] text-subtle",
				children: [
					save.completed.length,
					" / ",
					10,
					" complete"
				]
			})
		]
	});
}
function ProfileScreen() {
	const save = useGameUi((s) => s.save);
	const setFlow = useGameUi((s) => s.setFlow);
	const progress = Math.round(save.completed.length / 10 * 100);
	const best = Object.values(save.bestTime);
	const bestOverall = best.length ? Math.min(...best) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		kicker: "Player profile",
		title: save.username || "Kaibigan",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Level",
						value: `${Math.min(10, save.completed.length + 1)} / 10`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Items found",
						value: String(save.itemsFound)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Best time",
						value: bestOverall ? formatClock(bestOverall) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Walks done",
						value: String(save.completed.length)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-[11px] uppercase tracking-[0.16em] text-subtle",
				children: "Progress"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 h-2 overflow-hidden rounded-full bg-elevated",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-accent",
					style: { width: `${progress}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted",
				children: [progress, "%"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6 w-full",
				variant: "secondary",
				onClick: () => setFlow("menu"),
				children: "Back"
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[12px] border border-border bg-elevated px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] uppercase tracking-wider text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg tabular",
			children: value
		})]
	});
}
function LevelScreen() {
	const save = useGameUi((s) => s.save);
	const setFlow = useGameUi((s) => s.setFlow);
	const setLevel = useGameUi((s) => s.setLevel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		kicker: "Hanapin",
		title: "Level select",
		wide: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-5 max-h-[50dvh] space-y-2 overflow-auto pr-1",
			children: LEVELS.map((lv) => {
				const open = isUnlocked(lv.id, save.completed);
				const done = save.completed.includes(lv.id);
				const stars = save.stars[String(lv.id)] ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: !open,
					onClick: () => open && setLevel(lv.id),
					className: cn("flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition-opacity", open ? "border-border bg-elevated hover:border-accent" : "border-border/60 bg-bg opacity-50"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface font-display text-sm",
							children: lv.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate font-medium",
								children: lv.tagalog
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate text-xs text-muted",
								children: [
									lv.title,
									" · ",
									TIME_PRESETS[lv.timeOfDay].label
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex items-center gap-1 text-warn",
							children: done ? Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-3", i < stars ? "fill-warn" : "text-subtle") }, i)) : open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted" }) : null
						})
					]
				}) }, lv.id);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-5 w-full",
			variant: "ghost",
			onClick: () => setFlow("menu"),
			children: "Back"
		})]
	});
}
function SettingsScreen({ onBack, onWeatherChange }) {
	const settings = useGameUi((s) => s.save.settings);
	const update = useGameUi((s) => s.updateSettings);
	const weatherModes = [
		{
			id: "auto",
			label: "Ayon sa level",
			icon: Check
		},
		{
			id: "sunny",
			label: "Maaraw",
			icon: CloudSun
		},
		{
			id: "sunset",
			label: "Hapon",
			icon: Sunset
		},
		{
			id: "night",
			label: "Gabi",
			icon: Moon
		},
		{
			id: "rain",
			label: "Maulan",
			icon: CloudRain
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "panel-in w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[var(--shadow-panel)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-[11px] uppercase tracking-[0.28em] text-accent",
				children: "Settings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl",
				children: "Tune the walk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						label: "Music",
						value: settings.music,
						onChange: (v) => update({ music: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						label: "Sound",
						value: settings.sfx,
						onChange: (v) => update({ sfx: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-subtle",
						children: "Panahon"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: weatherModes.map(({ id, label, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": settings.weather === id,
							onClick: () => {
								update({ weather: id });
								onWeatherChange?.(id);
							},
							className: cn("flex min-h-10 items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-xs transition-colors", settings.weather === id ? "border-accent/60 bg-[#151d1a] text-fg" : "border-white/10 bg-[#101715]/70 text-muted hover:border-accent/35"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0 text-accent" }), label]
						}, id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.16em] text-subtle",
						children: "Quality"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-3 gap-2",
						children: [
							"low",
							"medium",
							"high"
						].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => update({ quality: q }),
							className: cn("rounded-[12px] border px-3 py-2 text-sm capitalize", settings.quality === q ? "border-accent bg-elevated text-fg" : "border-border text-muted"),
							children: q
						}, q))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Minimap",
						on: settings.minimap,
						onChange: (v) => update({ minimap: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "Dialogue",
						on: settings.dialogue,
						onChange: (v) => update({ dialogue: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						label: "Text size",
						value: (settings.textScale - .85) / .4,
						onChange: (v) => update({ textScale: .85 + v * .4 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6 w-full",
				variant: "secondary",
				onClick: onBack,
				children: "Back"
			})
		]
	});
}
function Slider({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] uppercase tracking-[0.16em] text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min: 0,
			max: 1,
			step: .01,
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "mt-2 w-full accent-[var(--color-accent)]"
		})]
	});
}
function Toggle({ label, on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onChange(!on),
		className: "flex w-full items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("grid size-8 place-items-center rounded-[8px] border", on ? "border-ok bg-ok/20 text-ok" : "border-border text-subtle"),
			children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : null
		})]
	});
}
function ResultPanel({ win, onNext, onRetry, onMenu }) {
	const hud = useGameUi((s) => s.hud);
	const save = useGameUi((s) => s.save);
	const levelId = useGameUi((s) => s.levelId);
	const used = hud ? Math.max(0, hud.timeLimit - hud.remaining) : 0;
	const stars = save.stars[String(levelId)] ?? 0;
	const next = levelId < 10 ? levelId + 1 : null;
	const name = save.username;
	const copy = (0, import_react.useMemo)(() => {
		if (!win) return {
			kicker: "Naubos ang oras",
			title: "Time's up",
			body: `${name}, next time. The path is still there.`
		};
		if (next) return {
			kicker: "Nakuha lahat",
			title: "Level complete",
			body: `Great job, ${name}.`
		};
		return {
			kicker: "Huling hanap",
			title: "The grounds are quiet",
			body: `${name}, you found everything that was left.`
		};
	}, [
		win,
		next,
		name
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/70 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel-in w-full max-w-md rounded-[28px] border border-border bg-surface p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("font-display text-[11px] uppercase tracking-[0.28em]", win ? "text-ok" : "text-danger"),
					children: copy.kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl tracking-tight",
					children: copy.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: copy.body
				}),
				hud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-3 gap-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Time",
							value: formatClock(used)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Items",
							value: `${hud.found.length}/${hud.total}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Left",
							value: formatClock(hud.remaining)
						})
					]
				}),
				win && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex justify-center gap-1 text-warn",
					children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-5", i < stars ? "fill-warn" : "text-subtle") }, i))
				}),
				win && next && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-accent",
					children: [
						"Level ",
						next,
						" unlocked"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-2",
					children: [
						win && next ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							size: "lg",
							onClick: onNext,
							children: "Next level"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							size: "lg",
							variant: win && next ? "secondary" : "primary",
							onClick: onRetry,
							children: win ? "Play again" : "Try again"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							variant: "ghost",
							onClick: onMenu,
							children: "Exit to menu"
						})
					]
				})
			]
		})
	});
}
function BriefingPanel({ onEnter }) {
	const level = LEVELS[useGameUi((s) => s.levelId) - 1] ?? LEVELS[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/55 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel-in w-full max-w-lg rounded-[20px] border border-[#dfb66b]/20 bg-[#0f1514]/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)] sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display text-[11px] uppercase tracking-[0.28em] text-accent",
					children: [
						"Level ",
						level.id,
						" · ",
						TIME_PRESETS[level.timeOfDay].label
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: level.tagalog
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: level.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-relaxed text-muted",
					children: level.blurb
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 border-y border-white/10 py-3 text-sm leading-relaxed text-[#f4efe6]",
					children: level.items.map((item) => item.name).join(" · ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-subtle",
					children: [
						formatClock(level.timeLimit),
						" · ",
						level.items.length,
						" items to find"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "bakuran-title__start",
						size: "lg",
						onClick: onEnter,
						children: "Begin walk"
					})
				})
			]
		})
	});
}
var BUILDINGS = generateBuildings().filter((b) => b.kind !== "pad");
function MiniMap({ simX, simZ, yaw, discovered, compact }) {
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const size = compact ? 104 : 280;
	const mapScale = compact ? 1 : zoom;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative overflow-hidden rounded-[10px] border border-white/10 bg-[#1b2922] shadow-[0_12px_30px_rgba(0,0,0,0.22)]", compact ? "size-[104px]" : "mx-auto aspect-square w-full max-w-sm"),
		style: compact ? void 0 : { minHeight: size },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "-140 -140 280 280",
				className: "size-full",
				role: "img",
				"aria-label": "Top-down map of the grounds",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "-140",
					y: "-140",
					width: "280",
					height: "280",
					fill: "#1b2922"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					transform: `scale(${mapScale})`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "-72",
							cy: "58",
							rx: "34",
							ry: "28",
							fill: "#29444a",
							opacity: ".88"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M -101 58 C -88 42 -69 38 -53 47 C -43 55 -48 72 -64 80 C -80 84 -96 75 -101 58 Z",
							fill: "#36545a",
							opacity: ".68"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M 35 -105 C 50 -123 84 -119 99 -94 C 109 -76 96 -49 77 -42 C 58 -37 35 -53 31 -73 C 28 -85 29 -96 35 -105 Z",
							fill: "#34463a",
							opacity: ".56"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M 42 43 C 59 35 88 41 101 58 C 111 71 100 91 82 99 C 61 108 41 94 35 77 C 31 64 33 49 42 43 Z",
							fill: "#34463a",
							opacity: ".46"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M -111 -112 C -93 -129 -62 -126 -47 -108 C -37 -96 -43 -77 -59 -68 C -78 -58 -105 -68 -114 -87 C -118 -96 -118 -105 -111 -112 Z",
							fill: "#34463a",
							opacity: ".48"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M -5 118 C -8 76 -20 52 -8 29 C 5 8 1 -20 12 -46 C 20 -66 28 -84 35 -116 M -90 8 C -55 2 -32 -7 -7 -2 C 20 3 48 17 96 15 M -72 58 C -42 55 -20 48 4 51 C 34 55 65 69 103 78",
							fill: "none",
							stroke: "#9b9b7d",
							strokeOpacity: ".22",
							strokeWidth: "3",
							strokeLinecap: "round"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "0",
							cy: "0",
							r: "22",
							fill: "#39453a",
							opacity: ".9"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "0",
							cy: "0",
							r: "13",
							fill: "#56604a",
							opacity: ".8"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "-2",
							cy: "2",
							r: "5",
							fill: "#cfb677",
							opacity: ".85"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: BUILDINGS.map((b) => {
							const known = ZONES.some((z) => discovered.has(z.id) && Math.hypot(b.x - z.x, b.z - z.z) < z.radius * 1.3);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
								opacity: known ? 1 : .62,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: b.x - b.w / 2,
									y: b.z - b.d / 2,
									width: b.w,
									height: b.d,
									rx: "1.5",
									fill: known ? "#cfb677" : "#879185",
									fillOpacity: known ? ".88" : ".38"
								})
							}, b.id);
						}) }),
						ZONES.map((z) => {
							const known = discovered.has(z.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								opacity: known ? .55 : .18,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: z.x,
									cy: z.z,
									r: z.radius,
									fill: "none",
									stroke: "#c9cfb0",
									strokeOpacity: known ? ".32" : ".14",
									strokeWidth: "1.5",
									strokeDasharray: "3 4"
								}), known && !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: z.x,
									y: z.z,
									textAnchor: "middle",
									dominantBaseline: "middle",
									fill: "#d7ddc7",
									fontSize: "7",
									fontWeight: "500",
									letterSpacing: ".25",
									children: z.tagalog
								})]
							}, z.id);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							transform: `translate(${simX} ${simZ}) rotate(${-yaw * 180 / Math.PI})`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								r: "5.5",
								fill: "#e8d79b",
								fillOpacity: ".3",
								stroke: "#f8e6a9",
								strokeWidth: "1"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M 0 -6 L 3.7 4 L 0 2.2 L -3.7 4 Z",
								fill: "#fff4bf",
								stroke: "#3b3020",
								strokeWidth: "1"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							transform: "translate(126 -124)",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M 0 8 L 0 -8 M 0 -8 L -2 -4 M 0 -8 L 2 -4",
								stroke: "#f4eac8",
								strokeWidth: "1.4",
								fill: "none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
								x: "0",
								y: "14",
								textAnchor: "middle",
								fill: "#f4eac8",
								fontSize: "5",
								fontWeight: "700",
								children: "N"
							})]
						})
					]
				})]
			}),
			!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[6px] border border-white/10 bg-[#142019]/85 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-[#f1e8c8]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-[#fff4bf]" }),
					" Ikaw",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-1 size-1.5 rounded-[1px] bg-[#cfb677]" }),
					" Landmark"
				]
			}),
			!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-white/15 bg-[#142019]/90 p-1 shadow-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10",
						"aria-label": "Zoom out",
						onClick: () => setZoom((value) => Math.max(1, value - .5)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-8 text-center text-[10px] font-semibold text-[#f1e8c8]",
						children: [zoom.toFixed(1), "x"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10",
						"aria-label": "Zoom in",
						onClick: () => setZoom((value) => Math.min(2.5, value + .5)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ml-1 grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10",
						"aria-label": "Reset map zoom",
						onClick: () => setZoom(1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" })
					})
				]
			})
		]
	});
}
function MusicPlayer({ compact = false }) {
	const flow = useGameUi((s) => s.flow);
	const overlay = useGameUi((s) => s.overlay);
	const musicVol = useGameUi((s) => s.save.settings.music);
	const update = useGameUi((s) => s.updateSettings);
	const [snap, setSnap] = (0, import_react.useState)(() => getSharedAudio().musicSnap());
	(0, import_react.useEffect)(() => {
		const audio = getSharedAudio();
		setSnap(audio.musicSnap());
		return audio.onChange(() => setSnap(audio.musicSnap()));
	}, []);
	(0, import_react.useEffect)(() => {
		getSharedAudio().setVolumes({ music: musicVol });
	}, [musicVol]);
	const playing = snap.musicOn;
	const inWalk = flow === "game" && overlay === "none";
	const toggleMusic = () => {
		getSharedAudio().toggleMusic();
		setSnap(getSharedAudio().musicSnap());
	};
	if (!compact && inWalk) return null;
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		tabIndex: -1,
		"aria-label": playing ? "Pause music" : "Play music",
		title: playing ? "P · Pause music" : "P · Play music",
		className: "pointer-events-auto grid size-10 place-items-center rounded-[10px] border border-white/10 bg-[#0f1514]/75 text-fg shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-colors hover:border-accent/60",
		onClick: toggleMusic,
		children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute z-30 left-3 bottom-4 flex w-52 items-center gap-2 rounded-lg border border-border bg-bg/80 px-2 py-1.5 sm:left-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			tabIndex: -1,
			"aria-label": playing ? "Pause music" : "Play music",
			className: "grid size-11 shrink-0 place-items-center rounded-md border border-border bg-elevated text-fg hover:border-accent",
			onClick: toggleMusic,
			children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5 translate-x-px" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate font-display text-xs leading-tight",
				children: SONG.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-1 flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-3 shrink-0 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 0,
					max: 1,
					step: .01,
					value: musicVol,
					onChange: (e) => update({ music: Number(e.target.value) }),
					className: "h-1 w-full accent-[var(--color-accent)]",
					"aria-label": "Music volume"
				})]
			})]
		})]
	});
}
function Hud({ runtime, overlay, locked, onEnter, onResume, onRestart, onToggleMap, onMenu, onNext, onWeatherChange }) {
	const hud = useGameUi((s) => s.hud);
	const sim = useGameUi((s) => s.sim);
	const setOverlay = useGameUi((s) => s.setOverlay);
	const settings = useGameUi((s) => s.save.settings);
	const dialogue = useGameUi((s) => s.dialogue);
	const level = levelById(useGameUi((s) => s.levelId));
	const left = hud ? hud.total - hud.found.length : level.items.length;
	const urgent = (hud?.remaining ?? 99) <= 20;
	const warn = (hud?.remaining ?? 99) <= 60;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 text-fg",
		children: [
			locked && hud && overlay === "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute left-3 top-3 w-[min(13rem,calc(100vw-11rem))] rounded-[10px] border border-white/10 bg-[#0f1514]/75 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:left-4 sm:top-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[10px] uppercase tracking-[0.16em] text-accent",
							children: level.tagalog
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [
								left,
								" ",
								left === 1 ? "item" : "items",
								" remaining"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1",
							children: level.items.map((it) => {
								const done = hud.found.includes(it.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("grid size-3.5 place-items-center rounded-[3px] border", done ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-subtle"),
										children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											className: "size-3",
											strokeWidth: 2.5
										}) : null
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn(done && "text-muted line-through"),
										children: it.name
									})]
								}, it.id);
							})
						}),
						hud.notif ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-muted",
							children: hud.notif
						}) : null,
						hud.prompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 border-t border-white/10 pt-2 text-[10px] font-medium tracking-wide text-accent",
							children: hud.prompt
						}) : null,
						settings.dialogue && dialogue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "dialogue-in mt-2 border-t border-white/10 pt-2 text-[10px] italic leading-relaxed text-[#e5dcc8]",
							children: dialogue
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-1/2 top-3 hidden w-[min(22rem,40vw)] -translate-x-1/2 text-center sm:top-4 md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-[11px] uppercase tracking-[0.22em] text-accent",
						children: hud.zoneName
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute right-3 top-3 flex w-28 flex-col items-end gap-2 sm:right-4 sm:top-4 sm:w-32",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full rounded-[10px] border border-white/10 bg-[#0f1514]/75 px-2.5 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("font-sans text-xl font-semibold tabular leading-none tracking-normal", urgent && "timer-urgent text-danger", !urgent && warn && "text-warn"),
							children: formatClock(hud.remaining)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[9px] uppercase tracking-wider text-subtle",
							children: "Time left"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MusicPlayer, { compact: true })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-fg/70",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, {
						className: "size-5",
						strokeWidth: 1.4
					})
				}),
				hud.lastFound ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "found-toast absolute left-1/2 top-[28%] -translate-x-1/2 rounded-[16px] border border-border bg-surface px-5 py-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-[11px] uppercase tracking-[0.2em] text-ok",
						children: "Item found"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-xl",
						children: hud.lastFoundName
					})]
				}) : null,
				settings.minimap && sim ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute bottom-4 left-4 hidden sm:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniMap, {
						simX: sim.x,
						simZ: sim.z,
						yaw: sim.yaw,
						discovered: sim.discovered,
						compact: true
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute bottom-4 left-4 hidden text-[9px] uppercase tracking-wider text-subtle lg:block sm:left-[8rem]",
					children: "WASD move · E find · F light · P music · Esc pause"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto absolute bottom-4 right-4 flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							onClick: () => {
								const rt = runtime.current;
								if (rt) rt.sim.light = !rt.sim.light;
							},
							label: "Flashlight",
							active: hud.light,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flashlight, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							onClick: onToggleMap,
							label: "Map",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							onClick: () => {
								setOverlay("pause");
								runtime.current?.pause(true);
							},
							label: "Pause",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchPad, { runtime })
			] }),
			overlay === "briefing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefingPanel, { onEnter }),
			overlay === "map" && sim && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Grounds map",
				onClose: () => {
					setOverlay("none");
					runtime.current?.pause(false);
					runtime.current?.focusPlay();
					runtime.current?.requestLock();
				},
				subtitle: "Landmarks, not belongings",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniMap, {
					simX: sim.x,
					simZ: sim.z,
					yaw: sim.yaw,
					discovered: sim.discovered
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 grid grid-cols-2 gap-1 text-xs text-muted",
					children: ZONES.map((z) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: sim.discovered.has(z.id) ? "text-fg" : "text-subtle",
						children: sim.discovered.has(z.id) ? z.tagalog : "Not yet visited"
					}, z.id))
				})]
			}),
			overlay === "pause" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/75 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-in w-full max-w-sm rounded-[24px] border border-border bg-surface p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Paused"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "The clock is waiting. Click resume, then the view, to look around again."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									onClick: onResume,
									children: "Resume"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									variant: "secondary",
									onClick: onToggleMap,
									children: "Map"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									variant: "secondary",
									onClick: () => setOverlay("settings"),
									children: "Settings"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									variant: "ghost",
									onClick: onRestart,
									children: "Restart level"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									variant: "ghost",
									onClick: onMenu,
									children: "Exit to menu"
								})
							]
						})
					]
				})
			}),
			overlay === "settings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/75 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsScreen, {
					onBack: () => setOverlay("pause"),
					onWeatherChange
				})
			}),
			(overlay === "win" || overlay === "lose") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultPanel, {
				win: overlay === "win",
				onNext,
				onRetry: onRestart,
				onMenu
			})
		]
	});
}
function IconBtn({ onClick, label, children, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		tabIndex: -1,
		onClick,
		"aria-label": label,
		className: cn("grid size-11 place-items-center rounded-[10px] border border-[#dfb66b]/40 bg-[#101715]/90 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_8px_18px_rgba(223,182,107,0.1)] transition-colors hover:border-[#dfb66b]/70 hover:bg-[#151d1a]", active && "border-accent text-accent"),
		children
	});
}
function Panel({ title, subtitle, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg/55 p-3 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[80dvh] w-full max-w-xl overflow-auto rounded-[24px] border border-border bg-surface p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: title
				}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: subtitle
				}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onClose,
					children: "Close"
				})]
			}), children]
		})
	});
}
function TouchPad({ runtime }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute bottom-20 left-4 right-4 flex items-end justify-between sm:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative grid size-28 place-items-center rounded-full border border-border bg-bg/50 text-[10px] uppercase tracking-wider text-muted",
			onTouchStart: (e) => applyStick(e, runtime),
			onTouchMove: (e) => applyStick(e, runtime),
			onTouchEnd: () => {
				runtime.current?.setTouchAxis(0, 0);
			},
			children: "Move"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: () => runtime.current?.interactNow(),
				children: "Pick up"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				onClick: () => {
					const rt = runtime.current;
					if (!rt) return;
					rt.input.jump = true;
				},
				children: "Jump"
			})]
		})]
	});
}
function applyStick(e, runtime) {
	const t = e.changedTouches[0];
	const r = e.currentTarget.getBoundingClientRect();
	const dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
	const dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
	const f = Math.max(-1, Math.min(1, -dy));
	const right = Math.max(-1, Math.min(1, dx));
	runtime.current?.setTouchAxis(f, right);
}
var MENU_LEVEL = LEVELS[3];
function GameView() {
	const canvasRef = (0, import_react.useRef)(null);
	const rtRef = (0, import_react.useRef)(null);
	const flow = useGameUi((s) => s.flow);
	const overlay = useGameUi((s) => s.overlay);
	const levelId = useGameUi((s) => s.levelId);
	const locked = useGameUi((s) => s.locked);
	const hydrate = useGameUi((s) => s.hydrate);
	const setHud = useGameUi((s) => s.setHud);
	const setOverlay = useGameUi((s) => s.setOverlay);
	const setLocked = useGameUi((s) => s.setLocked);
	const setFlow = useGameUi((s) => s.setFlow);
	const setLevel = useGameUi((s) => s.setLevel);
	const resetUi = useGameUi((s) => s.resetUi);
	const recordWin = useGameUi((s) => s.recordWin);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [runId, setRunId] = (0, import_react.useState)(0);
	const playerName = useGameUi((s) => s.save.username);
	const speak = useGameUi((s) => s.save.settings.dialogue);
	const music = useGameUi((s) => s.save.settings.music);
	const sfx = useGameUi((s) => s.save.settings.sfx);
	const master = useGameUi((s) => s.save.settings.master);
	const ambience = useGameUi((s) => s.save.settings.ambience);
	const playing = flow === "game";
	const activeLevel = playing ? levelById(levelId) : MENU_LEVEL;
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		const kick = () => getSharedAudio().unlock();
		window.addEventListener("pointerdown", kick, { once: true });
		window.addEventListener("keydown", kick, { once: true });
		return () => {
			window.removeEventListener("pointerdown", kick);
			window.removeEventListener("keydown", kick);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		setReady(false);
		const q = useGameUi.getState().save.settings.quality;
		const rt = new HavenRuntime(canvas, activeLevel, playerName || "Kaibigan", speak, q, useGameUi.getState().save.settings.weather, {
			onHud: (h, sim) => setHud(h, sim),
			onPickup: (id) => {
				rt.audio.lastPickupId = id;
				rt.audio.pickup();
			},
			onEnd: (sim) => {
				rt.pause(true);
				if (sim.ended?.status === "win") {
					rt.audio.win();
					recordWin(sim.level.id, Math.max(0, sim.timeLimit - sim.t), sim.timeLimit, sim.found.size);
					setOverlay("win");
				} else {
					rt.audio.lose();
					setOverlay("lose");
				}
			}
		});
		const s = useGameUi.getState().save.settings;
		rt.audio.setVolumes({
			music: s.music,
			sfx: s.sfx,
			master: s.master,
			ambience: s.ambience
		});
		rtRef.current = rt;
		rt.start();
		setReady(true);
		const onKey = (e) => {
			const state = useGameUi.getState();
			if (state.flow !== "game") return;
			const cur = state.overlay;
			if (cur === "briefing" || cur === "win" || cur === "lose") return;
			if (e.code === "KeyM") {
				const next = cur === "map" ? "none" : "map";
				state.setOverlay(next);
				rt.pause(next !== "none");
			}
			if (e.code === "Escape") {
				if (document.pointerLockElement) document.exitPointerLock();
				if (cur === "pause" || cur === "settings" || cur === "map") {
					state.setOverlay("none");
					rt.pause(false);
					rt.focusPlay();
					rt.requestLock();
				} else {
					state.setOverlay("pause");
					rt.pause(true);
				}
			}
			if (e.code === "KeyP") getSharedAudio().toggleMusic();
		};
		window.addEventListener("keydown", onKey);
		const onClick = () => {
			const state = useGameUi.getState();
			if (state.flow === "game" && state.overlay === "none") {
				rt.focusPlay();
				if (state.locked) rt.requestLock();
			}
		};
		canvas.addEventListener("click", onClick);
		return () => {
			window.removeEventListener("keydown", onKey);
			canvas.removeEventListener("click", onClick);
			rt.dispose();
			rtRef.current = null;
		};
	}, [
		runId,
		activeLevel,
		playing,
		playerName,
		speak,
		setHud,
		setOverlay,
		recordWin
	]);
	(0, import_react.useEffect)(() => {
		rtRef.current?.audio.setVolumes({
			music,
			sfx,
			master,
			ambience
		});
	}, [
		music,
		sfx,
		master,
		ambience
	]);
	function enter() {
		const rt = rtRef.current;
		if (!rt) return;
		rt.audio.ui();
		rt.audio.unlock();
		rt.begin();
		setOverlay("none");
		setLocked(true);
		requestAnimationFrame(() => {
			rt.focusPlay();
			requestAnimationFrame(() => rt.focusPlay());
		});
	}
	function restart() {
		resetUi();
		setRunId((n) => n + 1);
	}
	function toMenu() {
		rtRef.current?.audio.ui();
		setLocked(false);
		setOverlay("none");
		setFlow("menu");
		setRunId((n) => n + 1);
	}
	function nextLevel() {
		const next = Math.min(10, levelId + 1);
		resetUi();
		setLevel(next);
		setRunId((n) => n + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				tabIndex: 0,
				"aria-label": "Bakuran game view",
				className: "block h-full w-full touch-none outline-none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowScreens, { onWeatherChange: (mode) => rtRef.current?.setWeather(mode) }),
			flow !== "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MusicPlayer, {}),
			ready && playing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				runtime: rtRef,
				overlay,
				locked,
				onWeatherChange: (mode) => rtRef.current?.setWeather(mode),
				onEnter: enter,
				onResume: () => {
					setOverlay("none");
					rtRef.current?.pause(false);
					rtRef.current?.focusPlay();
					rtRef.current?.requestLock();
				},
				onRestart: restart,
				onToggleMap: () => {
					const next = useGameUi.getState().overlay === "map" ? "none" : "map";
					setOverlay(next);
					const rt = rtRef.current;
					rt?.pause(next !== "none");
					if (next === "none") {
						rt?.focusPlay();
						rt?.requestLock();
					}
				},
				onMenu: toMenu,
				onNext: nextLevel
			})
		]
	});
}
//#endregion
export { GameView };
