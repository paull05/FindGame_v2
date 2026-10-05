import * as THREE from "three";

function hash(ix: number, iy: number) {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number) {
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

function fbm(x: number, y: number, oct = 5): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * valueNoise(x * f, y * f);
    a *= 0.5;
    f *= 2.03;
  }
  return v;
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  return { c, ctx, size };
}

function toTex(
  c: HTMLCanvasElement,
  opts: { repeat?: number; colorSpace?: THREE.ColorSpace; wrap?: boolean; filter?: THREE.MinificationTextureFilter } = {},
) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = opts.colorSpace ?? THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = opts.filter ?? THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (opts.wrap !== false) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    const r = opts.repeat ?? 1;
    tex.repeat.set(r, r);
  }
  tex.needsUpdate = true;
  return tex;
}

function paintNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  shade: (n: number, x: number, y: number) => [number, number, number, number?],
  scale = 6,
) {
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * scale, (y / size) * scale);
      const [r, g, b, a = 255] = shade(n, x, y);
      const i = (y * size + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
}

let cache: TextureSet | null = null;

export type TextureSet = {
  grass: THREE.CanvasTexture;
  dirt: THREE.CanvasTexture;
  stone: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  concrete: THREE.CanvasTexture;
  metal: THREE.CanvasTexture;
  detail: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
  grassBlade: THREE.CanvasTexture;
  leaf: THREE.CanvasTexture;
  cloud: THREE.CanvasTexture;
};

export function getTextures(): TextureSet {
  if (cache) return cache;
  cache = makeTextures();
  return cache;
}

function makeTextures(): TextureSet {
  const grass = canvas(256);
  paintNoise(grass.ctx, 256, (n, x, y) => {
    const n2 = fbm((x / 256) * 18, (y / 256) * 18, 3);
    const blade = Math.pow(n2, 1.4);
    const r = 38 + n * 28 + blade * 18;
    const g = 72 + n * 50 + blade * 22;
    const b = 28 + n * 18;
    return [r, g, b];
  });

  const dirt = canvas(256);
  paintNoise(dirt.ctx, 256, (n, x, y) => {
    const peb = fbm((x / 256) * 22, (y / 256) * 22, 2);
    const r = 92 + n * 40 + peb * 18;
    const g = 68 + n * 24 + peb * 10;
    const b = 38 + n * 16;
    return [r, g, b];
  });

  const stone = canvas(256);
  paintNoise(stone.ctx, 256, (n, x, y) => {
    const crack = Math.abs(fbm((x / 256) * 14, (y / 256) * 14, 4) - 0.5) * 2;
    const r = 98 + n * 36 - crack * 22;
    const g = 102 + n * 32 - crack * 18;
    const b = 94 + n * 28 - crack * 16;
    return [r, g, b];
  });

  const wood = canvas(256);
  paintNoise(wood.ctx, 256, (n, x, y) => {
    const grain = Math.sin((y / 256) * 28 + n * 6) * 0.5 + 0.5;
    const ring = Math.sin((x / 256) * 9 + grain * 3) * 0.5 + 0.5;
    const r = 78 + grain * 50 + ring * 18;
    const g = 52 + grain * 28 + ring * 10;
    const b = 32 + grain * 14;
    return [r, g, b];
  }, 4);

  const concrete = canvas(256);
  paintNoise(concrete.ctx, 256, (n) => {
    const r = 118 + n * 28;
    const g = 116 + n * 24;
    const b = 108 + n * 20;
    return [r, g, b];
  }, 10);

  const metal = canvas(128);
  paintNoise(metal.ctx, 128, (n, x, y) => {
    const scratch = Math.abs(Math.sin((y + x * 0.15) * 0.4)) * 30;
    const r = 70 + n * 40 + scratch * 0.4;
    const g = 76 + n * 36 + scratch * 0.35;
    const b = 72 + n * 32;
    return [r, g, b];
  }, 8);

  const detail = canvas(256);
  paintNoise(detail.ctx, 256, (n) => {
    const v = 140 + n * 90;
    return [v, v, v];
  }, 12);

  const rough = canvas(256);
  paintNoise(rough.ctx, 256, (n) => {
    const v = 160 + n * 80;
    return [v, v, v];
  }, 9);
  (rough.c as HTMLCanvasElement);

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
    detail: toTex(detail.c, { repeat: 40, colorSpace: THREE.NoColorSpace }),
    rough: toTex(rough.c, { repeat: 22, colorSpace: THREE.NoColorSpace }),
    grassBlade: toTex(blade, { wrap: false }),
    leaf: toTex(leaf, { wrap: false }),
    cloud: toTex(cloud, { wrap: false }),
  };
}

function makeGrassBlade() {
  const { c, ctx } = canvas(64);
  c.height = 128;
  ctx.clearRect(0, 0, 64, 128);
  const blades = [
    { x: 18, lean: -10, h: 118, w: 5, col: "#3c6a32" },
    { x: 32, lean: 6, h: 124, w: 6, col: "#4a7c3c" },
    { x: 46, lean: 12, h: 108, w: 5, col: "#355e2c" },
    { x: 26, lean: -4, h: 96, w: 4, col: "#5a8a44" },
    { x: 40, lean: 8, h: 90, w: 3.5, col: "#2f5528" },
  ];
  for (const b of blades) {
    ctx.beginPath();
    ctx.moveTo(b.x - b.w, 128);
    ctx.quadraticCurveTo(b.x + b.lean * 0.4, 128 - b.h * 0.45, b.x + b.lean, 128 - b.h);
    ctx.quadraticCurveTo(b.x + b.lean * 0.35 + 1, 128 - b.h * 0.45, b.x + b.w, 128);
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
  ctx.rotate(-0.4);
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
  g.addColorStop(0.45, "rgba(236,242,248,0.35)");
  g.addColorStop(1, "rgba(220,230,240,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: new THREE.Vector2(0.75, 0.28) },
};

export function applyWind(mat: THREE.MeshStandardMaterial, amount = 1, swayY = true) {
  mat.userData.windAmt = amount;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.uniforms.uAmt = { value: amount };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform vec2 uWind;
         uniform float uAmt;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
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
         }`,
      );
  };
  mat.customProgramCacheKey = () => `wind-${amount}-${swayY ? 1 : 0}`;
  mat.needsUpdate = true;
  return mat;
}

export function tickWind(t: number) {
  windUniforms.uTime.value = t;
  windUniforms.uWind.value.set(0.7 + Math.sin(t * 0.11) * 0.25, 0.28 + Math.cos(t * 0.09) * 0.12);
}

