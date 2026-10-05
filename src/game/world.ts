import { ZONES } from "./catalog.ts";
import type { Building, Clue, Interactable, LevelDef, SurfaceKind } from "./types.ts";

export const WORLD_HALF = 138;

export function dist2(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}

export function getHeight(x: number, z: number): number {
  let h =
    Math.sin(x * 0.018) * 1.35 +
    Math.cos(z * 0.014) * 1.15 +
    Math.sin((x + z) * 0.011) * 0.7 +
    Math.sin(x * 0.33) * Math.cos(z * 0.29) * 0.16 +
    Math.sin(x * 0.9 + z * 0.6) * 0.05;

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
    h = h * (1 - t) + 0.18 * t;
  }

  const ext = dist2(x, z, 0, -126);
  if (ext < 20) h = 7.5 + (1 - ext / 20) * 3.5;

  const research = dist2(x, z, 8, -82);
  if (research < 22) h = h * 0.35 + 0.4;

  const pd = pathDist(x, z);
  if (pd < 2.4 && central > 18) {
    h -= (1 - pd / 2.4) * 0.07;
  }

  return h;
}

export const PATHS: [number, number, number, number][] = [
  [0, 0, 86, 6],
  [0, 0, 8, -82],
  [0, 0, -72, 58],
  [0, 0, -88, -12],
  [0, 0, 18, 74],
  [0, 0, 78, 72],
  [8, -82, 74, -74],
  [8, -82, 0, -126],
  [-88, -12, -52, -88],
  [86, 6, 78, 72],
];

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz || 1;
  let t = ((px - ax) * abx + (pz - az) * abz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

export function pathDist(x: number, z: number): number {
  let best = 99;
  for (const [ax, az, bx, bz] of PATHS) {
    const d = distToSegment(x, z, ax, az, bx, bz);
    if (d < best) best = d;
  }
  return best;
}

let residentialBuildingCache: Building[] | null = null;

function residentialBuildings() {
  residentialBuildingCache ??= generateBuildings().filter((b) => b.kind === "house" || b.kind === "kubo");
  return residentialBuildingCache;
}

export function indoorAt(x: number, z: number): boolean {
  if (Math.abs(x - 0) < 5.5 && Math.abs(z - 18) < 4.6) return true;
  if (Math.abs(x - 0) < 8.2 && Math.abs(z + 82) < 4.4) return true;
  for (const b of residentialBuildings()) {
    const dx = x - b.x;
    const dz = z - b.z;
    const yaw = b.yaw ?? 0;
    const localX = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
    const localZ = Math.sin(yaw) * dx + Math.cos(yaw) * dz;
    if (Math.abs(localX) < b.w / 2 - 0.45 && Math.abs(localZ) < b.d / 2 - 0.45) return true;
  }
  return false;
}

export function surfaceAt(x: number, z: number): SurfaceKind {
  if (indoorAt(x, z)) return "wood";
  const pd = pathDist(x, z);
  if (pd < 2.05) return "dirt";
  if (dist2(x, z, 0, 0) < 15) return "stone";
  if (dist2(x, z, 0, -126) < 12) return "stone";
  const h = getHeight(x, z);
  if (h < 1.22 && dist2(x, z, -72, 58) < 30) return "water";
  if (h > 16.5) return "stone";
  return "grass";
}

export function biomeColor(x: number, z: number, h: number): [number, number, number] {
  const zone = ZONES.reduce(
    (best, zdef) => {
      const d = dist2(x, z, zdef.x, zdef.z) / zdef.radius;
      return d < best.d ? { d, zdef } : best;
    },
    { d: 99, zdef: ZONES[0] },
  );
  const t = Math.max(0, 1 - zone.d);
  const pal: Record<string, [number, number, number]> = {
    central: [0.3, 0.34, 0.26],
    forest: [0.16, 0.34, 0.16],
    maintenance: [0.32, 0.28, 0.18],
    flooded: [0.16, 0.28, 0.24],
    energy: [0.34, 0.3, 0.2],
    mountain: [0.4, 0.44, 0.34],
    shelter: [0.24, 0.34, 0.22],
    restricted: [0.2, 0.28, 0.18],
    extraction: [0.32, 0.34, 0.3],
  };
  let [r, g, b] = pal[zone.zdef.id] ?? pal.central;
  r = r * (0.55 + 0.45 * t) + 0.07;
  g = g * (0.55 + 0.45 * t) + 0.09;
  b = b * (0.55 + 0.45 * t) + 0.06;

  const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.045;
  const n2 = Math.sin((x + z) * 0.53) * 0.03;
  r += n + n2;
  g += n * 0.8 + n2 * 0.6;
  b += n * 0.5;

  const pd = pathDist(x, z);
  if (pd < 2.6) {
    const k = 1 - pd / 2.6;
    const dirtK = k * k;
    r = r * (1 - dirtK) + 0.38 * dirtK;
    g = g * (1 - dirtK) + 0.27 * dirtK;
    b = b * (1 - dirtK) + 0.16 * dirtK;
  }

  if (h < 1.3 && dist2(x, z, -72, 58) < 34) {
    const mud = Math.min(1, (1.3 - h) * 0.7);
    r = r * (1 - mud) + 0.22 * mud;
    g = g * (1 - mud) + 0.24 * mud;
    b = b * (1 - mud) + 0.18 * mud;
  }

  if (h > 16) {
    const snow = Math.min(1, (h - 16) / 12);
    r = r * (1 - snow) + 0.78 * snow;
    g = g * (1 - snow) + 0.82 * snow;
    b = b * (1 - snow) + 0.72 * snow;
  }
  return [r, g, b];
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function generateTrees(): { x: number; z: number; s: number; kind: "pine" | "oak" }[] {
  const rand = rng(90210);
  const out: { x: number; z: number; s: number; kind: "pine" | "oak" }[] = [];
  for (let i = 0; i < 250; i++) {
    const x = (rand() * 2 - 1) * WORLD_HALF;
    const z = (rand() * 2 - 1) * WORLD_HALF;
    const dC = dist2(x, z, 0, 0);
    const dF = dist2(x, z, 86, 6);
    const dR = dist2(x, z, -52, -88);
    const forest = dF < 42 ? 1 : dR < 22 ? 0.55 : 0.14;
    if (dC < 22) continue;
    if (dist2(x, z, 0, -126) < 16) continue;
    if (pathDist(x, z) < 2.6) continue;
    if (rand() > forest) continue;
    if (getHeight(x, z) < 0.3) continue;
    out.push({ x, z, s: 0.65 + rand() * 1.05, kind: rand() > 0.45 ? "oak" : "pine" });
  }
  return out;
}

export function generateRocks(): { x: number; z: number; s: number }[] {
  const rand = rng(4242);
  const out: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 110; i++) {
    const x = (rand() * 2 - 1) * WORLD_HALF;
    const z = (rand() * 2 - 1) * WORLD_HALF;
    if (dist2(x, z, 0, 0) < 18) continue;
    if (pathDist(x, z) < 1.6) continue;
    const mountain = dist2(x, z, 74, -74) < 40 ? 1.4 : 1;
    out.push({ x, z, s: (0.35 + rand() * 1.25) * mountain });
  }
  return out;
}

export function generateBushes(): { x: number; z: number; s: number }[] {
  const rand = rng(777);
  const out: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 110; i++) {
    const x = (rand() * 2 - 1) * WORLD_HALF * 0.85;
    const z = (rand() * 2 - 1) * WORLD_HALF * 0.85;
    if (dist2(x, z, 0, 0) < 12) continue;
    if (pathDist(x, z) < 2) continue;
    if (getHeight(x, z) < 0.2) continue;
    out.push({ x, z, s: 0.5 + rand() * 0.85 });
  }
  return out;
}

export function generateGrass(): { x: number; z: number; s: number }[] {
  const rand = rng(3331);
  const out: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 980; i++) {
    const x = (rand() * 2 - 1) * WORLD_HALF * 0.9;
    const z = (rand() * 2 - 1) * WORLD_HALF * 0.9;
    const pd = pathDist(x, z);
    if (pd < 1.35) continue;
    const h = getHeight(x, z);
    if (h < 0.25 || h > 18) continue;
    if (dist2(x, z, -72, 58) < 22) continue;
    if (dist2(x, z, 0, 0) < 10) continue;
    const nearPath = pd < 4.5 ? 1.15 : 1;
    const nearForest = dist2(x, z, 86, 6) < 40 ? 1.1 : 0.85;
    if (rand() > nearPath * nearForest * 0.92) continue;
    out.push({ x, z, s: 0.55 + rand() * 0.85 });
  }
  return out;
}

export function generateFlowers(): { x: number; z: number; s: number; c: number }[] {
  const rand = rng(1919);
  const cols = [0xf2e6d8, 0xd9a3a0, 0xe8d48a, 0xc9d6e8, 0xd8c4e0];
  const beds: [number, number, number][] = [
    [6, 4, 8],
    [-8, 6, 7],
    [4, -8, 6],
    [78, 68, 10],
    [70, -70, 9],
    [82, 2, 8],
    [-48, -84, 8],
  ];
  const out: { x: number; z: number; s: number; c: number }[] = [];
  for (const [cx, cz, rad] of beds) {
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * rad;
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (pathDist(x, z) < 1.2) continue;
      out.push({ x, z, s: 0.35 + rand() * 0.35, c: cols[(rand() * cols.length) | 0] });
    }
  }
  return out;
}

export function generatePoles(): { x: number; z: number }[] {
  return [
    { x: 14, z: -4 },
    { x: -14, z: 6 },
    { x: 22, z: 18 },
    { x: -24, z: -8 },
    { x: 6, z: 28 },
    { x: 40, z: 8 },
    { x: -36, z: 20 },
    { x: 8, z: -28 },
  ];
}

export function generateLamps(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const seen = new Set<string>();
  const add = (x: number, z: number) => {
    const k = `${Math.round(x / 4)}_${Math.round(z / 4)}`;
    if (seen.has(k)) return;
    seen.add(k);
    if (dist2(x, z, 0, 0) < 6) return;
    out.push({ x, z });
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

export function generateBenches(): { x: number; z: number; yaw: number }[] {
  return [
    { x: 10, z: 6, yaw: -0.4 },
    { x: -12, z: 4, yaw: 0.8 },
    { x: 6, z: -10, yaw: 0.1 },
    { x: 84, z: 68, yaw: 0.6 },
    { x: -60, z: 50, yaw: 1.2 },
    { x: 16, z: -78, yaw: 0 },
    { x: 66, z: -66, yaw: -0.5 },
    { x: -8, z: -122, yaw: 0 },
  ];
}

export function generateFences(): { x: number; z: number; yaw: number; len: number }[] {
  const out: { x: number; z: number; yaw: number; len: number }[] = [];
  const ring = [
    { x: 16, z: -16, yaw: 0, len: 10 },
    { x: -16, z: -16, yaw: 0, len: 10 },
    { x: 20, z: 0, yaw: Math.PI / 2, len: 12 },
    { x: -20, z: 0, yaw: Math.PI / 2, len: 12 },
  ];
  out.push(...ring);
  out.push({ x: 74, z: 64, yaw: 0.4, len: 8 });
  out.push({ x: -64, z: 44, yaw: 1.1, len: 7 });
  return out;
}

export function generateSigns(): { x: number; z: number; yaw: number; label: string }[] {
  return ZONES.map((z) => ({
    x: z.x + 6,
    z: z.z + 4,
    yaw: Math.atan2(-(z.x + 6), -(z.z + 4)),
    label: z.tagalog,
  }));
}

export function generateClues(): Clue[] {
  const at = (id: string, x: number, z: number, hint: string, line: string): Clue => ({
    id,
    x,
    z,
    y: getHeight(x, z) + 0.9,
    hint,
    line,
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
    at("clue_stump", 90.8, 10.2, "Look at the stump", "A cut tree, older than the path. Moss taking its time."),
  ];
}

export function generateBuildings(): Building[] {
  const B: Building[] = [];
  const add = (b: Building) => B.push(b);

  add({ id: "hub_pad", x: 0, z: 0, w: 28, d: 28, h: 0.28, color: 0x4a5248, kind: "pad", collides: false });
  add({
    id: "hub_house",
    x: 0,
    z: 18,
    w: 12,
    d: 10,
    h: 5.2,
    color: 0x6a5a44,
    roof: 0x8a4030,
    kind: "house",
    collides: false,
    enterable: true,
    emissive: 0x9fb8a6,
    roofStyle: "hip",
    porch: true,
    fixture: "hanging",
    lightIntensity: 4.0,
  });
  add({ id: "fountain", x: 0, z: -2, w: 4.2, d: 4.2, h: 0.7, color: 0x6a736c, kind: "block" });
  add({
    id: "sari_sari",
    x: -18,
    z: 8,
    w: 6.4,
    d: 5.2,
    h: 3.6,
    color: 0x5a4a38,
    roof: 0x3a6a48,
    kind: "store",
    emissive: 0xc4a15a,
  });

  const homes: Building[] = [
    { id: "bakuran_a", x: 32.5, z: 18.5, w: 8.4, d: 7.2, h: 4.5, color: 0x8b765c, roof: 0x66473a, kind: "house", collides: true, roofStyle: "gable", porch: true, fixture: "hanging", lightIntensity: 3.4, yaw: 0.08 },
    { id: "bakuran_b", x: 47, z: -4, w: 7.4, d: 8.2, h: 4.1, color: 0x9a8b72, roof: 0x526158, kind: "house", collides: true, roofStyle: "hip", porch: true, fixture: "lantern", yaw: -0.18 },
    { id: "bakuran_c", x: 65, z: 12, w: 10.2, d: 8.6, h: 5.1, color: 0x777b68, roof: 0x70483a, kind: "house", collides: true, roofStyle: "gable", porch: true, fixture: "wall", lightIntensity: 4.2, yaw: 0.12 },
    { id: "bakuran_d", x: -36, z: -17, w: 8.8, d: 7.4, h: 4.7, color: 0x8d7457, roof: 0x555a4d, kind: "house", collides: true, roofStyle: "hip", porch: false, fixture: "covered", yaw: 0.2 },
    { id: "bakuran_e", x: -57, z: 1, w: 7.2, d: 8.6, h: 4.2, color: 0x777b68, roof: 0x69473a, kind: "house", collides: true, roofStyle: "gable", porch: true, fixture: "lantern", yaw: -0.12 },
    { id: "bakuran_f", x: -29, z: 35.5, w: 9.6, d: 7.8, h: 4.9, color: 0x96856b, roof: 0x536156, kind: "house", collides: true, roofStyle: "hip", porch: true, fixture: "hanging", lightIntensity: 3.0, yaw: 0.24 },
    { id: "bakuran_g", x: 22, z: 47, w: 7.6, d: 7.1, h: 4.0, color: 0x85745f, roof: 0x704b3d, kind: "house", collides: true, roofStyle: "gable", porch: false, fixture: "wall", yaw: -0.16 },
    { id: "bakuran_h", x: 50.5, z: 59.5, w: 10.4, d: 8, h: 5.0, color: 0x9a8b72, roof: 0x596052, kind: "house", collides: true, roofStyle: "gable", porch: true, fixture: "covered", lightIntensity: 3.8, yaw: 0.14 },
    { id: "bakuran_i", x: -70, z: -20, w: 7.8, d: 8.4, h: 4.3, color: 0x756d5c, roof: 0x63463b, kind: "house", collides: true, roofStyle: "hip", porch: true, fixture: "lantern", yaw: -0.22 },
  ];
  homes.forEach(add);

  add({
    id: "lab_a",
    x: 0,
    z: -82,
    w: 18,
    d: 10,
    h: 5.4,
    color: 0x3a4a40,
    roof: 0x8aa99a,
    emissive: 0x6fad7a,
    kind: "greenhouse",
  });
  add({ id: "lab_b", x: 14, z: -90, w: 8, d: 12, h: 6.5, color: 0x324038, roof: 0x4a5a48, kind: "workshop" });

  add({
    id: "eng_a",
    x: -90,
    z: -10,
    w: 10,
    d: 14,
    h: 6,
    color: 0x4a4030,
    roof: 0x5a4c38,
    emissive: 0xc4a15a,
    kind: "mill",
  });

  add({ id: "flood_shed", x: -69.5, z: 48, w: 7, d: 5.5, h: 3.6, color: 0x3a4a44, roof: 0x4a5a48, kind: "kubo", fixture: "lantern", lightIntensity: 2.5 });
  add({ id: "flood_dock", x: -62, z: 56, w: 8, d: 2.4, h: 0.35, color: 0x5a4634, kind: "pad", collides: false });

  add({ id: "mnt_hut", x: 68, z: -68, w: 6, d: 6, h: 3.8, y: 18, color: 0x5a5248, roof: 0x6a5344, kind: "kubo", fixture: "covered", lightIntensity: 1.8 });

  add({ id: "sh_dome", x: 78, z: 72, w: 12, d: 12, h: 5.5, color: 0x4a544c, emissive: 0x6fad7a, kind: "dome" });
  add({ id: "sh_annex", x: 88, z: 68, w: 6, d: 7, h: 3.2, color: 0x3e483e, roof: 0x4a544c, kind: "workshop" });

  add({ id: "rest_wall_a", x: -40, z: -78, w: 18, d: 0.7, h: 2.8, color: 0x3a4a3c, kind: "wall" });
  add({ id: "rest_wall_b", x: -62, z: -78, w: 18, d: 0.7, h: 2.8, color: 0x3a4a3c, kind: "wall" });
  add({
    id: "rest_lab",
    x: -52,
    z: -96,
    w: 12,
    d: 9,
    h: 5.5,
    color: 0x324034,
    roof: 0x4a5a40,
    emissive: 0x6a8a6e,
    kind: "house",
    roofStyle: "gable",
    porch: true,
    fixture: "wall",
    lightIntensity: 1.8,
  });
  add({ id: "rest_gate", x: -52, z: -78, w: 6, d: 0.6, h: 3.2, color: 0x5a4a38, kind: "wall", collides: false });

  add({ id: "ext_pad", x: 0, z: -126, w: 16, d: 16, h: 0.45, y: 8, color: 0x4a5450, kind: "pad", collides: false });

  add({ id: "maint_box", x: 26, z: 80, w: 6, d: 8, h: 4.4, color: 0x4a4030, roof: 0x5a4c38, kind: "workshop" });
  add({ id: "maint_shed", x: 12, z: 70.5, w: 5, d: 5, h: 3.2, color: 0x3e3828, roof: 0x4a4030, kind: "kubo", fixture: "hanging", lightIntensity: 2.4 });

  add({ id: "for_shack", x: 91, z: 3, w: 5, d: 5, h: 3.2, color: 0x3a4a34, roof: 0x4a5a38, kind: "kubo", fixture: "wall", lightIntensity: 2.1 });

  return B;
}

export type Aabb = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  id: string;
};

function wallAabb(id: string, cx: number, cz: number, w: number, d: number, y0: number, h: number): Aabb {
  return {
    id,
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    minY: y0,
    maxY: y0 + h,
  };
}

export function houseWallAabbs(): Aabb[] {
  const out: Aabb[] = [];
  const thickness = 0.45;
  for (const b of residentialBuildings()) {
    const yaw = b.yaw ?? 0;
    const cosine = Math.cos(yaw);
    const sine = Math.sin(yaw);
    const y0 = b.y ?? getHeight(b.x, b.z);
    const doorWidth = b.kind === "kubo" ? 1.3 : 1.8;
    const doorX = b.kind === "kubo" ? b.w * 0.18 : 0;
    const leftWidth = Math.max(0.1, doorX - doorWidth / 2 + b.w / 2);
    const rightWidth = Math.max(0.1, b.w / 2 - doorX - doorWidth / 2);
    const addWall = (id: string, localX: number, localZ: number, width: number, depth: number) => {
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

export function buildingAabbs(buildings: Building[]): Aabb[] {
  return buildings
    .filter((b) => b.collides !== false && b.kind !== "pad" && b.kind !== "house" && b.kind !== "kubo")
    .map((b) => {
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
        maxY: y0 + b.h,
      };
    });
}

export function extraAabbs(): Aabb[] {
  const out: Aabb[] = [...houseWallAabbs()];
  for (const b of generateBenches()) {
    const y0 = getHeight(b.x, b.z);
    out.push({
      id: `bench_${b.x}`,
      minX: b.x - 0.9,
      maxX: b.x + 0.9,
      minZ: b.z - 0.4,
      maxZ: b.z + 0.4,
      minY: y0,
      maxY: y0 + 0.7,
    });
  }
  for (const l of generateLamps()) {
    const y0 = getHeight(l.x, l.z);
    out.push({
      id: `lamp_${l.x}_${l.z}`,
      minX: l.x - 0.22,
      maxX: l.x + 0.22,
      minZ: l.z - 0.22,
      maxZ: l.z + 0.22,
      minY: y0,
      maxY: y0 + 3.4,
    });
  }
  out.push({
    id: "jeepney",
    minX: 14.2,
    maxX: 20.6,
    minZ: -4.4,
    maxZ: -1.2,
    minY: 0,
    maxY: 2.6,
  });
  out.push({
    id: "well",
    minX: -8.6,
    maxX: -6.6,
    minZ: 10.2,
    maxZ: 12.2,
    minY: 0,
    maxY: 1.4,
  });
  return out;
}

export function generateInteractables(level: LevelDef): Interactable[] {
  return level.items.map((it) => ({
    id: it.id,
    name: it.name,
    x: it.x,
    z: it.z,
    y: getHeight(it.x, it.z) + 0.85,
    zone: it.zone,
    hint: it.hint,
  }));
}

const PLAYER_R = 0.45;

export function resolveCollision(x: number, z: number, y: number, aabbs: Aabb[]): { x: number; z: number } {
  let nx = x;
  let nz = z;
  for (const b of aabbs) {
    if (y + 0.4 < b.minY || y > b.maxY + 0.2) continue;
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
  nx = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, nx));
  nz = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, nz));
  return { x: nx, z: nz };
}

export function itemsFarFromSpawn(level: LevelDef, minDist = 8): boolean {
  return level.items.every((it) => dist2(it.x, it.z, level.spawn.x, level.spawn.z) >= minDist);
}
