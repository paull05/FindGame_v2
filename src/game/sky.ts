import * as THREE from "three";
import type { TimeOfDay } from "./types.ts";

export type SkyPreset = {
  bg: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
  sunColor: number;
  sunInt: number;
  sunPos: [number, number, number];
  exposure: number;
  ambient: number;
  zenith: number;
  horizon: number;
  flash: number;
};

export const SKY: Record<TimeOfDay, SkyPreset> = {
  day: {
    bg: 0x87b8d4,
    fog: 0xb7d0c4,
    fogNear: 42,
    fogFar: 158,
    hemiSky: 0xd8eef4,
    hemiGround: 0x3d5c38,
    hemiInt: 0.82,
    sunColor: 0xfff2d4,
    sunInt: 1.22,
    sunPos: [52, 78, 28],
    exposure: 1.08,
    ambient: 0.28,
    zenith: 0x6eb0d4,
    horizon: 0xd8ead8,
    flash: 0.55,
  },
  sunset: {
    bg: 0xc46a4a,
    fog: 0xd08a64,
    fogNear: 32,
    fogFar: 118,
    hemiSky: 0xf0a070,
    hemiGround: 0x3a2818,
    hemiInt: 0.68,
    sunColor: 0xff8844,
    sunInt: 1.05,
    sunPos: [86, 16, -42],
    exposure: 1.02,
    ambient: 0.22,
    zenith: 0x4a3a78,
    horizon: 0xf09a62,
    flash: 0.9,
  },
  night: {
    bg: 0x10182a,
    fog: 0x152032,
    fogNear: 22,
    fogFar: 96,
    hemiSky: 0x3a5470,
    hemiGround: 0x1a241c,
    hemiInt: 0.42,
    sunColor: 0xd0dcec,
    sunInt: 0.48,
    sunPos: [-36, 62, 22],
    exposure: 0.92,
    ambient: 0.16,
    zenith: 0x0c1424,
    horizon: 0x243448,
    flash: 2.15,
  },
};

export const SKY_EXT = {
  morning: {
    bg: 0xb8d4e0,
    fog: 0xc8dcc8,
    fogNear: 38,
    fogFar: 150,
    hemiSky: 0xf0e8d8,
    hemiGround: 0x3a4a32,
    hemiInt: 0.7,
    sunColor: 0xffe0b0,
    sunInt: 0.95,
    sunPos: [-48, 28, 40],
    exposure: 0.98,
    ambient: 0.24,
    zenith: 0x7aa8c8,
    horizon: 0xf0d8b8,
    flash: 0.45,
  } satisfies SkyPreset,
  lateAfternoon: {
    bg: 0xd4a878,
    fog: 0xd8b890,
    fogNear: 34,
    fogFar: 128,
    hemiSky: 0xf0c8a0,
    hemiGround: 0x3a3020,
    hemiInt: 0.72,
    sunColor: 0xffc078,
    sunInt: 1.1,
    sunPos: [74, 32, -20],
    exposure: 1.04,
    ambient: 0.24,
    zenith: 0x5a78b0,
    horizon: 0xf0c090,
    flash: 0.7,
  } satisfies SkyPreset,
  evening: {
    bg: 0x8a4a58,
    fog: 0xa06058,
    fogNear: 28,
    fogFar: 108,
    hemiSky: 0xd08070,
    hemiGround: 0x2a1814,
    hemiInt: 0.5,
    sunColor: 0xff6a3a,
    sunInt: 0.72,
    sunPos: [96, 8, -48],
    exposure: 0.94,
    ambient: 0.16,
    zenith: 0x2a2458,
    horizon: 0xd07058,
    flash: 1.15,
  } satisfies SkyPreset,
};

const _ca = new THREE.Color();
const _cb = new THREE.Color();

function lerpHex(a: number, b: number, t: number) {
  return _ca.setHex(a).lerp(_cb.setHex(b), t).getHex();
}

export function lerpPreset(a: SkyPreset, b: SkyPreset, t: number): SkyPreset {
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
      a.sunPos[2] + (b.sunPos[2] - a.sunPos[2]) * ease,
    ],
    exposure: a.exposure + (b.exposure - a.exposure) * ease,
    ambient: a.ambient + (b.ambient - a.ambient) * ease,
    zenith: lerpHex(a.zenith, b.zenith, ease),
    horizon: lerpHex(a.horizon, b.horizon, ease),
    flash: a.flash + (b.flash - a.flash) * ease,
  };
}

/** 0..1 progress through a level's timer. Day walks morning → afternoon → late. */
export function sampleSky(tod: TimeOfDay, progress: number): SkyPreset {
  const u = Math.max(0, Math.min(1, progress));
  if (tod === "night") return SKY.night;
  if (tod === "sunset") return lerpPreset(SKY_EXT.lateAfternoon, lerpPreset(SKY.sunset, SKY_EXT.evening, 0.55), u);
  if (u < 0.5) return lerpPreset(SKY_EXT.morning, SKY.day, u / 0.5);
  return lerpPreset(SKY.day, SKY_EXT.lateAfternoon, (u - 0.5) / 0.5);
}

export function makeStars(): THREE.Points {
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
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xe8eef8,
    size: 0.85,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    fog: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = -8;
  pts.frustumCulled = false;
  return pts;
}

export function makeCelestial(kind: "sun" | "moon"): THREE.Mesh {
  const color = kind === "sun" ? 0xfff2c4 : 0xe8eef8;
  const geo = new THREE.SphereGeometry(kind === "sun" ? 6.5 : 5.2, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color,
    fog: false,
    toneMapped: false,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}
