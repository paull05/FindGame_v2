import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { applyWind, getTextures } from "./textures.ts";
import type { Building, TimeOfDay } from "./types.ts";
import { getHeight } from "./world.ts";

const matCache = new Map<string, THREE.MeshStandardMaterial>();

function mat(key: string, params: THREE.MeshStandardMaterialParameters) {
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial(params);
    matCache.set(key, m);
  }
  return m;
}

function maps() {
  return getTextures();
}

function box(
  g: THREE.Group,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  shadow = true,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = shadow;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

export function buildDetailed(b: Building, tod: TimeOfDay): THREE.Group {
  const g = new THREE.Group();
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

function glassMat(key: string, night: boolean, greenhouse = false, house = false) {
  if (greenhouse) {
    return mat(key, {
      color: 0x8fb8aa,
      roughness: 0.08,
      metalness: 0.22,
      transparent: true,
      opacity: 0.38,
      emissive: 0x6fad7a,
      emissiveIntensity: night ? 0.32 : 0.06,
      depthWrite: false,
    });
  }
  const material = mat(key, {
    color: night ? 0xc9b07a : 0x8aa7b4,
    roughness: 0.2,
    metalness: house ? 0.08 : 0.45,
    emissive: night ? 0xe8c888 : 0x1e2a28,
    emissiveIntensity: night ? (house ? 0.26 : 0.62) : 0.05,
    transparent: house,
    opacity: house ? 0.34 : 1,
    depthWrite: !house,
    side: house ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (house) material.userData.houseWindow = true;
  return material;
}

function roofMat(key: string, color = 0x3e4842) {
  return mat(key, { map: maps().concrete, color, roughness: 0.68, metalness: 0.14 });
}

function frameMat() {
  const t = maps();
  return mat("frame", { map: t.metal, color: 0x3a4a40, roughness: 0.55, metalness: 0.25 });
}

function addFlatRoof(g: THREE.Group, b: Building, y0: number, roofMat: THREE.Material, parapet: THREE.Material) {
  box(g, b.w + 0.28, 0.12, b.d + 0.28, roofMat, 0, y0 + b.h + 0.06, 0);
  const ph = 0.16;
  const py = y0 + b.h + 0.12 + ph / 2;
  const t = 0.08;
  const rw = b.w + 0.28;
  const rd = b.d + 0.28;
  box(g, rw, ph, t, parapet, 0, py, -rd / 2 + t / 2);
  box(g, rw, ph, t, parapet, 0, py, rd / 2 - t / 2);
  box(g, t, ph, rd, parapet, -rw / 2 + t / 2, py, 0);
  box(g, t, ph, rd, parapet, rw / 2 - t / 2, py, 0);
}

function addGlassGrid(
  g: THREE.Group,
  glass: THREE.Material,
  frame: THREE.Material,
  spec: {
    cx: number;
    cy: number;
    cz: number;
    w: number;
    h: number;
    cols: number;
    rows: number;
    axis: "z" | "x";
  },
) {
  const { cx, cy, cz, w, h, cols, rows, axis } = spec;
  const inset = 0.09;
  const ft = 0.055;
  const glassT = 0.04;
  const cellW = w / cols;
  const cellH = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = (c + 0.5) * cellW - w / 2;
      const oy = (r + 0.5) * cellH - h / 2;
      if (axis === "z") {
        box(g, Math.max(0.12, cellW - inset), Math.max(0.12, cellH - inset), glassT, glass, cx + ox, cy + oy, cz, 0, 0, 0, false);
      } else {
        box(g, glassT, Math.max(0.12, cellH - inset), Math.max(0.12, cellW - inset), glass, cx, cy + oy, cz + ox, 0, 0, 0, false);
      }
    }
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

function addWallWithOpenings(
  g: THREE.Group,
  wall: THREE.Material,
  axis: "x" | "z",
  center: number,
  face: number,
  span: number,
  bottom: number,
  top: number,
  thickness: number,
  openings: { min: number; max: number; bottom: number; top: number }[],
) {
  const horizontal = [-span / 2, span / 2, ...openings.flatMap((opening) => [opening.min, opening.max])]
    .filter((value) => value >= -span / 2 && value <= span / 2)
    .sort((a, b) => a - b);
  const vertical = [bottom, top, ...openings.flatMap((opening) => [opening.bottom, opening.top])]
    .filter((value) => value >= bottom && value <= top)
    .sort((a, b) => a - b);

  for (let xi = 0; xi < horizontal.length - 1; xi++) {
    const left = horizontal[xi];
    const right = horizontal[xi + 1];
    if (right - left < 0.02) continue;
    const middle = (left + right) / 2;
    for (let yi = 0; yi < vertical.length - 1; yi++) {
      const low = vertical[yi];
      const high = vertical[yi + 1];
      if (high - low < 0.02) continue;
      const y = (low + high) / 2;
      if (openings.some((opening) => middle > opening.min && middle < opening.max && y > opening.bottom && y < opening.top)) {
        continue;
      }
      if (axis === "z") {
        box(g, right - left, high - low, thickness, wall, center + middle, y, face);
      } else {
        box(g, thickness, high - low, right - left, wall, face, y, center + middle);
      }
    }
  }
}

function addPitchedRoof(
  g: THREE.Group,
  b: Building,
  y0: number,
  roof: THREE.Material,
  gableWall: THREE.Material,
  hip: boolean,
) {
  const rise = Math.min(1.2, b.h * 0.23);
  const overhang = 0.38;
  const halfWidth = b.w / 2 + overhang;
  const halfDepth = b.d / 2 + overhang;
  const eaveY = y0 + b.h;
  const ridgeY = eaveY + rise;
  const ridgeHalf = hip ? Math.max(0, halfWidth - rise * 0.9) : halfWidth;
  roof.side = THREE.DoubleSide;

  const face = (vertices: THREE.Vector3[]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vertices);
    geometry.setIndex(vertices.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, roof);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.keepSeparate = true;
    g.add(mesh);
  };

  [-1, 1].forEach((side) => {
    const near = side * halfDepth;
    const panel = [
      new THREE.Vector3(-halfWidth, eaveY, near),
      new THREE.Vector3(halfWidth, eaveY, near),
      new THREE.Vector3(ridgeHalf, ridgeY, 0),
      new THREE.Vector3(-ridgeHalf, ridgeY, 0),
    ];
    face(side < 0 ? panel.reverse() : panel);
  });

  if (hip) {
    face([
      new THREE.Vector3(-halfWidth, eaveY, -halfDepth),
      new THREE.Vector3(-halfWidth, eaveY, halfDepth),
      new THREE.Vector3(-ridgeHalf, ridgeY, 0),
    ]);
    face([
      new THREE.Vector3(halfWidth, eaveY, halfDepth),
      new THREE.Vector3(halfWidth, eaveY, -halfDepth),
      new THREE.Vector3(ridgeHalf, ridgeY, 0),
    ]);
  } else {
    const gable = new THREE.Shape();
    gable.moveTo(-b.w / 2, 0);
    gable.lineTo(b.w / 2, 0);
    gable.lineTo(0, rise);
    gable.closePath();
    [-1, 1].forEach((side) => {
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(gable), gableWall);
      mesh.position.set(0, eaveY - 0.02, side * (b.d / 2 + 0.025));
      mesh.rotation.y = side < 0 ? Math.PI : 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.keepSeparate = true;
      g.add(mesh);
    });
  }

  [-halfDepth, halfDepth].forEach((z) => {
    box(g, halfWidth * 2, 0.1, 0.1, roof, 0, eaveY + 0.025, z, 0, 0, 0, true);
  });
}

function addHouseFixture(g: THREE.Group, b: Building, y0: number, night: boolean, porch: boolean) {
  if (!b.fixture) return;
  const z = -b.d / 2 - 0.04;
  const x = b.fixture === "wall" ? -Math.min(1.05, b.w * 0.16) : 0;
  const mountY = y0 + b.h - (porch ? 0.9 : 0.45);
  const bulbY = b.fixture === "hanging" || b.fixture === "covered" ? mountY - 0.42 : mountY - 0.12;
  const iron = mat("house-fixture-iron", { color: 0x34352e, roughness: 0.64, metalness: 0.48 });
  const brass = mat("house-fixture-brass", { color: 0x66543a, roughness: 0.6, metalness: 0.38 });
  const bulb = mat("house-fixture-bulb", {
    color: 0xffd3a0,
    emissive: 0xffb96f,
    emissiveIntensity: night ? 1.45 : 0.28,
    roughness: 0.26,
  });
  bulb.userData.houseBulb = true;

  box(g, 0.18, 0.2, 0.09, iron, x, mountY - 0.03, z + 0.045, 0, 0, 0, false);
  if (b.fixture === "hanging" || b.fixture === "covered") {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, Math.max(0.12, mountY - bulbY - 0.05), 5), iron);
    cable.position.set(x, (mountY + bulbY) / 2, z - 0.025);
    cable.castShadow = false;
    g.add(cable);
  } else {
    box(g, 0.08, 0.07, 0.18, iron, x, mountY - 0.1, z - 0.07, 0, 0, 0, false);
  }
  if (b.fixture === "lantern") {
    box(g, 0.22, 0.045, 0.22, brass, x, bulbY + 0.15, z - 0.06, 0, 0, 0, false);
    box(g, 0.19, 0.22, 0.15, iron, x, bulbY, z - 0.06, 0, 0, 0, false);
    box(g, 0.23, 0.045, 0.22, brass, x, bulbY - 0.13, z - 0.06, 0, 0, 0, false);
  } else if (b.fixture === "wall") {
    box(g, 0.24, 0.1, 0.12, brass, x, bulbY + 0.1, z - 0.04, 0, 0, 0, false);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 0.12, 8), iron);
    shade.position.set(x, bulbY + 0.035, z - 0.1);
    shade.castShadow = false;
    g.add(shade);
  } else if (b.fixture === "covered") {
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.075, 0.12, 8), iron);
    shade.position.set(x, bulbY + 0.06, z - 0.025);
    shade.castShadow = false;
    g.add(shade);
  }
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), bulb);
  glass.position.set(x, bulbY, z - 0.07);
  glass.castShadow = false;
  g.add(glass);

  {
    const light = new THREE.PointLight(0xffbd78, 0, 19, 1.35);
    light.position.copy(glass.position);
    light.castShadow = false;
    light.userData.houseExteriorLight = true;
    g.add(light);
  }

  const sconceY = y0 + b.h * 0.68;
  const sconceZ = -b.d / 2 - 0.13;
  const sconceX = Math.min(1.55, b.w * 0.27);
  [-sconceX, sconceX].forEach((sconceOffset) => {
    box(g, 0.2, 0.28, 0.07, iron, sconceOffset, sconceY, sconceZ + 0.035, 0, 0, 0, false);
    box(g, 0.12, 0.07, 0.2, brass, sconceOffset, sconceY - 0.06, sconceZ - 0.09, 0, 0, 0, false);
    const glassBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bulb);
    glassBulb.position.set(sconceOffset, sconceY - 0.1, sconceZ - 0.16);
    glassBulb.castShadow = false;
    glassBulb.userData.houseBulb = true;
    g.add(glassBulb);
    const sconceLight = new THREE.PointLight(0xffc57f, 0, 24, 1.25);
    sconceLight.position.set(sconceOffset, sconceY - 0.1, sconceZ - 0.2);
    sconceLight.castShadow = false;
    sconceLight.userData.houseExteriorLight = true;
    g.add(sconceLight);
  });
}

function addPorch(g: THREE.Group, b: Building, y0: number, wood: THREE.Material, roof: THREE.Material, stone: THREE.Material) {
  const width = Math.min(b.w * 0.72, 5.8);
  const depth = 1.65;
  const front = -b.d / 2 - depth;
  box(g, width, 0.16, depth, stone, 0, y0 + 0.2, -b.d / 2 - depth / 2);
  box(g, width + 0.28, 0.12, depth + 0.25, roof, 0, y0 + b.h - 0.56, -b.d / 2 - depth / 2);
  const postHeight = Math.max(1.8, b.h - 0.82);
  [-width / 2 + 0.12, width / 2 - 0.12].forEach((x) => {
    box(g, 0.15, postHeight, 0.15, wood, x, y0 + postHeight / 2 + 0.2, front + 0.08);
  });
  box(g, width * 0.34, 0.12, 0.48, stone, 0, y0 + 0.09, front - 0.28);
}

function addResidentialInteriorLights(g: THREE.Group, b: Building, y0: number, night: boolean, frame: THREE.Material, wood: THREE.Material) {
  const bulbMaterial = mat("house-interior-bulb", {
    color: 0xffd3a0,
    emissive: 0xffb96f,
    emissiveIntensity: night ? 1.65 : 0.16,
    roughness: 0.24,
  });
  bulbMaterial.userData.houseInteriorBulb = true;
  const positions = [{ x: -b.w * 0.22, z: b.d * 0.2 }, { x: b.w * 0.2, z: -b.d * 0.18 }];
  positions.forEach(({ x, z }, index) => {
    box(g, 0.16, 0.08, 0.16, frame, x, y0 + b.h - 0.18, z, 0, 0, 0, false);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 5), wood);
    cable.position.set(x, y0 + b.h - 0.39, z);
    cable.castShadow = false;
    g.add(cable);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), bulbMaterial);
    bulb.position.set(x, y0 + b.h - 0.61, z);
    bulb.castShadow = false;
    bulb.userData.houseInteriorBulb = true;
    g.add(bulb);
    const light = new THREE.PointLight(0xffc27f, 0, 22, 1.25);
    light.position.set(x, y0 + b.h - 0.66, z);
    light.castShadow = false;
    light.userData.houseInteriorLight = true;
    light.userData.nightIntensity = index === 0 ? 38 : 30;
    light.userData.bulbMaterial = bulbMaterial;
    light.userData.houseCenter = { x: b.x, z: b.z, w: b.w, d: b.d, yaw: b.yaw ?? 0 };
    g.add(light);
  });
}

function mergeHouseMeshes(g: THREE.Group) {
  const buckets = new Map<
    string,
    { material: THREE.Material; castShadow: boolean; receiveShadow: boolean; geometries: THREE.BufferGeometry[] }
  >();
  for (const child of [...g.children]) {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.door || mesh.userData.keepSeparate || Array.isArray(mesh.material)) continue;
    mesh.updateMatrix();
    const key = `${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material: mesh.material, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, geometries: [] };
      buckets.set(key, bucket);
    }
    bucket.geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
    g.remove(mesh);
    mesh.geometry.dispose();
  }

  for (const bucket of buckets.values()) {
    const merged = BufferGeometryUtils.mergeGeometries(bucket.geometries, false);
    const geometries = merged ? [merged] : bucket.geometries;
    if (merged) bucket.geometries.forEach((geometry) => geometry.dispose());
    geometries.forEach((geometry) => {
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, bucket.material);
      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;
      g.add(mesh);
    });
  }
}

function buildHouse(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const wall = mat(`hw-${b.color}`, { map: t.wood, color: b.color, roughness: 0.86, roughnessMap: t.rough });
  const stone = mat("stone", { map: t.stone, color: 0x5a5e56, roughness: 0.95 });
  const roof = roofMat(`hr-${b.roofStyle ?? "flat"}-${b.roof ?? b.color}`, b.roof);
  const frame = frameMat();
  const glass = glassMat(night ? "house-g-n" : "house-g-d", night, false, true);
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });
  const ceiling = mat(`house-ceiling-${b.color}`, { map: t.wood, color: 0x74654f, roughness: 0.92 });

  box(g, b.w + 0.22, 0.38, b.d + 0.22, stone, 0, y0 + 0.19, 0);
  const wallBottom = y0 + 0.3;
  const wallTop = y0 + b.h;
  const windowBottom = y0 + 2.55 - 2.15 / 2;
  const windowTop = y0 + 2.55 + 2.15 / 2;
  const frontWindowWidth = Math.max(1.6, b.w * 0.3);
  const frontWindowOffset = b.w * 0.28;
  const sideWindowWidth = b.d * 0.68;
  const backWindowWidth = b.w * 0.72;
  const backWindowBottom = y0 + 2.75 - 1.9 / 2;
  const backWindowTop = y0 + 2.75 + 1.9 / 2;
  const frontOpenings = [
    { min: -frontWindowOffset - frontWindowWidth / 2, max: -frontWindowOffset + frontWindowWidth / 2, bottom: windowBottom, top: windowTop },
    { min: frontWindowOffset - frontWindowWidth / 2, max: frontWindowOffset + frontWindowWidth / 2, bottom: windowBottom, top: windowTop },
    { min: -0.8, max: 0.8, bottom: y0 + 0.2, top: y0 + 2.67 },
  ];
  addWallWithOpenings(g, wall, "z", 0, -b.d / 2, b.w, wallBottom, wallTop, 0.24, frontOpenings);
  addWallWithOpenings(g, wall, "z", 0, b.d / 2, b.w, wallBottom, wallTop, 0.24, [
    { min: -backWindowWidth / 2, max: backWindowWidth / 2, bottom: backWindowBottom, top: backWindowTop },
  ]);
  addWallWithOpenings(g, wall, "x", 0, -b.w / 2, b.d, wallBottom, wallTop, 0.24, [
    { min: -sideWindowWidth / 2, max: sideWindowWidth / 2, bottom: windowBottom, top: windowTop },
  ]);
  addWallWithOpenings(g, wall, "x", 0, b.w / 2, b.d, wallBottom, wallTop, 0.24, [
    { min: -sideWindowWidth / 2, max: sideWindowWidth / 2, bottom: windowBottom, top: windowTop },
  ]);
  box(g, b.w - 0.3, 0.12, b.d - 0.3, ceiling, 0, y0 + b.h - 0.1, 0, 0, 0, 0, false);
  if (b.roofStyle === "gable" || b.roofStyle === "hip") {
    addPitchedRoof(g, b, y0, roof, wall, b.roofStyle === "hip");
  } else {
    addFlatRoof(g, b, y0, roof, frame);
  }

  const faceZ = -b.d / 2 - 0.03;
  addGlassGrid(g, glass, frame, {
    cx: -b.w * 0.28,
    cy: y0 + 2.55,
    cz: faceZ,
    w: Math.max(1.6, b.w * 0.3),
    h: 2.15,
    cols: 2,
    rows: 2,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: b.w * 0.28,
    cy: y0 + 2.55,
    cz: faceZ,
    w: Math.max(1.6, b.w * 0.3),
    h: 2.15,
    cols: 2,
    rows: 2,
    axis: "z",
  });

  const doorGeometry = new THREE.BoxGeometry(1.5, 2.45, 0.1);
  doorGeometry.translate(0.75, 0, 0);
  const door = new THREE.Mesh(doorGeometry, wood);
  door.position.set(-0.75, y0 + 1.42, -b.d / 2 - 0.02);
  door.castShadow = true;
  door.receiveShadow = true;
  g.add(door);
  door.userData.door = true;
  door.userData.buildingId = b.id;
  door.userData.residence = { x: b.x, z: b.z, w: b.w, d: b.d, yaw: b.yaw ?? 0, doorX: 0, doorWidth: 1.5 };
  door.userData.closedYaw = 0;
  door.userData.openYaw = -1.32;
  box(g, 1.72, 0.08, 0.12, frame, 0, y0 + 2.7, -b.d / 2 - 0.02);
  box(g, 0.08, 2.5, 0.12, frame, -0.8, y0 + 1.45, -b.d / 2 - 0.02);
  box(g, 0.08, 2.5, 0.12, frame, 0.8, y0 + 1.45, -b.d / 2 - 0.02);

  addGlassGrid(g, glass, frame, {
    cx: -b.w / 2 - 0.03,
    cy: y0 + 2.5,
    cz: 0,
    w: b.d * 0.68,
    h: 2.3,
    cols: 3,
    rows: 2,
    axis: "x",
  });
  addGlassGrid(g, glass, frame, {
    cx: b.w / 2 + 0.03,
    cy: y0 + 2.5,
    cz: 0,
    w: b.d * 0.68,
    h: 2.3,
    cols: 3,
    rows: 2,
    axis: "x",
  });
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + 2.75,
    cz: b.d / 2 + 0.03,
    w: b.w * 0.72,
    h: 1.9,
    cols: 4,
    rows: 2,
    axis: "z",
  });

  if (b.porch) addPorch(g, b, y0, wood, roof, stone);
  else box(g, 2.6, 0.14, 1.5, stone, 0, y0 + 0.12, -b.d / 2 - 0.75);
  addHouseFixture(g, b, y0, night, Boolean(b.porch));

  addResidentialInteriorLights(g, b, y0, night, frame, wood);

  if (b.enterable) {
    const tableX = -2.4;
    const tableZ = 1.2;
    box(g, 1.4, 0.08, 1.1, wood, tableX, y0 + 0.85, tableZ, 0, 0, 0, false);
    [-0.58, 0.58].forEach((x) => {
      [-0.43, 0.43].forEach((z) => {
        box(g, 0.08, 0.76, 0.08, wood, tableX + x, y0 + 0.43, tableZ + z);
      });
    });
  }
  mergeHouseMeshes(g);
}

function buildKubo(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const wall = mat(`kw-${b.color}`, { map: t.wood, color: b.color, roughness: 0.9 });
  const roof = roofMat(`kr-flat-${b.color}`);
  const frame = frameMat();
  const glass = glassMat(night ? "kglass-n" : "kglass-d", night);
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });

  box(g, b.w + 0.18, 0.28, b.d + 0.18, wood, 0, y0 + 0.14, 0);
  const doorWidth = Math.min(1.25, b.w * 0.3);
  const doorX = b.w * 0.18;
  const windowWidth = Math.min(1.2, b.w * 0.28);
  const windowX = -b.w * 0.25;
  const bottom = y0 + 0.2;
  const top = y0 + b.h;
  const windowBottom = y0 + b.h * 0.55 - Math.max(1.0, b.h * 0.38) / 2;
  const windowTop = y0 + b.h * 0.55 + Math.max(1.0, b.h * 0.38) / 2;
  addWallWithOpenings(g, wall, "z", 0, -b.d / 2, b.w, bottom, top, 0.18, [
    { min: doorX - doorWidth / 2, max: doorX + doorWidth / 2, bottom: y0 + 0.1, top: y0 + 1.75 },
    { min: windowX - windowWidth / 2, max: windowX + windowWidth / 2, bottom: windowBottom, top: windowTop },
  ]);
  addWallWithOpenings(g, wall, "z", 0, b.d / 2, b.w, bottom, top, 0.18, []);
  addWallWithOpenings(g, wall, "x", 0, -b.w / 2, b.d, bottom, top, 0.18, [
    { min: -b.d * 0.25, max: b.d * 0.25, bottom: windowBottom, top: windowTop },
  ]);
  addWallWithOpenings(g, wall, "x", 0, b.w / 2, b.d, bottom, top, 0.18, []);
  addFlatRoof(g, b, y0, roof, frame);

  addGlassGrid(g, glass, frame, {
    cx: windowX,
    cy: y0 + b.h * 0.55,
    cz: -b.d / 2 - 0.03,
    w: windowWidth,
    h: Math.max(1.1, b.h * 0.38),
    cols: 2,
    rows: 1,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: -b.w / 2 - 0.03,
    cy: y0 + b.h * 0.55,
    cz: 0,
    w: Math.max(1.1, b.d * 0.5),
    h: Math.max(1.0, b.h * 0.38),
    cols: 2,
    rows: 1,
    axis: "x",
  });
  const doorGeometry = new THREE.BoxGeometry(doorWidth, 1.7, 0.08);
  doorGeometry.translate(doorWidth / 2, 0, 0);
  const door = new THREE.Mesh(doorGeometry, wood);
  door.position.set(doorX - doorWidth / 2, y0 + 1.0, -b.d / 2 - 0.02);
  door.castShadow = true;
  door.receiveShadow = true;
  door.userData.door = true;
  door.userData.buildingId = b.id;
  door.userData.residence = { x: b.x, z: b.z, w: b.w, d: b.d, yaw: b.yaw ?? 0, doorX, doorWidth };
  door.userData.doorX = doorX;
  door.userData.openYaw = -1.25;
  g.add(door);
  addHouseFixture(g, b, y0, night, false);
  addResidentialInteriorLights(g, b, y0, night, frame, wood);
}

function buildStore(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const wall = mat(`sw-${b.color}`, { map: t.wood, color: b.color, roughness: 0.86 });
  const roof = roofMat(`sr-flat-${b.color}`);
  const canopy = mat("awning", { color: 0xc45c4a, roughness: 0.7 });
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });
  const frame = frameMat();
  const glass = glassMat(night ? "store-n" : "store-d", night);

  box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
  addFlatRoof(g, b, y0, roof, frame);
  box(g, b.w + 0.2, 0.08, 1.5, canopy, 0, y0 + 2.55, -b.d / 2 - 0.7);
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + 1.45,
    cz: -b.d / 2 - 0.04,
    w: b.w - 0.7,
    h: 1.7,
    cols: 3,
    rows: 2,
    axis: "z",
  });
  box(g, b.w - 0.5, 0.1, 0.7, wood, 0, y0 + 0.5, -b.d / 2 - 0.35);
}

function buildWorkshop(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const wall = mat(`ww-${b.color}`, { map: t.concrete, color: b.color, roughness: 0.88 });
  const roof = roofMat(`wr-flat-${b.color}`);
  const metal = mat("iron", { map: t.metal, color: 0x2a2e2c, roughness: 0.5, metalness: 0.4 });
  const frame = frameMat();
  const glass = glassMat(night ? "win-n" : "win-d", night);

  box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
  addFlatRoof(g, b, y0, roof, frame);
  box(g, 1.8, 2.2, 0.1, metal, 0, y0 + 1.2, -b.d / 2 - 0.04);
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + b.h * 0.72,
    cz: -b.d / 2 - 0.04,
    w: b.w * 0.78,
    h: Math.max(0.7, b.h * 0.22),
    cols: 4,
    rows: 1,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: b.w / 2 + 0.03,
    cy: y0 + b.h * 0.55,
    cz: 0,
    w: b.d * 0.55,
    h: Math.max(0.9, b.h * 0.32),
    cols: 2,
    rows: 1,
    axis: "x",
  });
}

function buildGreenhouse(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const frame = mat("gframe", { map: t.metal, color: 0x3a4a40, roughness: 0.55, metalness: 0.25 });
  const glass = glassMat(night ? "gglass-n" : "gglass-d", night, true);

  box(g, b.w, 0.28, b.d, frame, 0, y0 + 0.14, 0);
  box(g, b.w - 0.16, b.h - 0.4, b.d - 0.16, glass, 0, y0 + b.h / 2, 0, 0, 0, 0, false);
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + b.h / 2,
    cz: -b.d / 2 - 0.02,
    w: b.w - 0.3,
    h: b.h - 0.6,
    cols: 5,
    rows: 3,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + b.h / 2,
    cz: b.d / 2 + 0.02,
    w: b.w - 0.3,
    h: b.h - 0.6,
    cols: 5,
    rows: 3,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: -b.w / 2 - 0.02,
    cy: y0 + b.h / 2,
    cz: 0,
    w: b.d - 0.3,
    h: b.h - 0.6,
    cols: 4,
    rows: 3,
    axis: "x",
  });
  addGlassGrid(g, glass, frame, {
    cx: b.w / 2 + 0.02,
    cy: y0 + b.h / 2,
    cz: 0,
    w: b.d - 0.3,
    h: b.h - 0.6,
    cols: 4,
    rows: 3,
    axis: "x",
  });
  box(g, b.w + 0.2, 0.08, b.d + 0.2, frame, 0, y0 + b.h + 0.04, 0);
  box(g, b.w - 0.2, 0.05, b.d - 0.2, glass, 0, y0 + b.h + 0.08, 0, 0, 0, 0, false);
  for (let i = 1; i < 4; i++) {
    box(g, 0.06, 0.08, b.d, frame, -b.w / 2 + (b.w * i) / 4, y0 + b.h + 0.08, 0);
  }
  box(g, 1.4, 2.2, 0.1, frame, 0, y0 + 1.2, -b.d / 2 - 0.04);
}

function buildMill(g: THREE.Group, b: Building, y0: number, night: boolean) {
  const t = maps();
  const wall = mat(`mw-${b.color}`, { map: t.wood, color: b.color, roughness: 0.86 });
  const roof = roofMat(`mr-flat-${b.color}`);
  const frame = frameMat();
  const glass = glassMat(night ? "mill-n" : "mill-d", night);
  const wood = mat("doorw", { map: t.wood, color: 0x3a2a1c, roughness: 0.9 });

  box(g, b.w, b.h, b.d, wall, 0, y0 + b.h / 2, 0);
  addFlatRoof(g, b, y0, roof, frame);
  addGlassGrid(g, glass, frame, {
    cx: 0,
    cy: y0 + b.h * 0.72,
    cz: -b.d / 2 - 0.04,
    w: b.w * 0.7,
    h: Math.max(0.9, b.h * 0.22),
    cols: 3,
    rows: 1,
    axis: "z",
  });
  addGlassGrid(g, glass, frame, {
    cx: b.w / 2 + 0.03,
    cy: y0 + 2.2,
    cz: 0,
    w: b.d * 0.45,
    h: 1.4,
    cols: 2,
    rows: 2,
    axis: "x",
  });
  box(g, 0.9, 2.0, 0.12, wood, -b.w * 0.22, y0 + 1.1, -b.d / 2 - 0.04);
}


export function buildJeepney(): THREE.Group {
  const g = new THREE.Group();
  const t = maps();
  const body = mat("jeep", { color: 0xc45c4a, roughness: 0.55, metalness: 0.15, roughnessMap: t.rough });
  const chrome = mat("chrome", { map: t.metal, color: 0xc5d0c4, roughness: 0.3, metalness: 0.7 });
  const tire = mat("tire", { color: 0x1a1e1c, roughness: 0.9 });
  const roof = mat("jroof", { color: 0xc4a15a, roughness: 0.6 });
  box(g, 5.6, 1.4, 2.1, body, 0, 1.05, 0);
  box(g, 2.2, 1.1, 2.0, body, -2.1, 1.55, 0);
  box(g, 5.8, 0.08, 2.3, roof, 0, 2.15, 0);
  box(g, 0.08, 0.7, 1.6, mat("jwin", { color: 0x8aa0b8, roughness: 0.25, transparent: true, opacity: 0.55, depthWrite: false }), -3.15, 1.6, 0);
  for (const [x, z] of [
    [-1.8, 1.15],
    [1.6, 1.15],
    [-1.8, -1.15],
    [1.6, -1.15],
  ] as [number, number][]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10), tire);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.38, z);
    g.add(w);
  }
  box(g, 0.5, 0.16, 0.16, chrome, -3.0, 0.7, 0.7, 0, 0, 0, false);
  box(g, 0.5, 0.16, 0.16, chrome, -3.0, 0.7, -0.7, 0, 0, 0, false);
  return g;
}

export function buildWell(): THREE.Group {
  const g = new THREE.Group();
  const t = maps();
  const stone = mat("stone", { map: t.stone, color: 0x5a5e56, roughness: 0.95 });
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });
  const roof = mat("hr-0x8a4030", { map: t.dirt, color: 0x8a4030, roughness: 0.78 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.9, 12), stone);
  ring.position.y = 0.45;
  g.add(ring);
  box(g, 0.12, 1.6, 0.12, wood, -0.7, 1.3, 0);
  box(g, 0.12, 1.6, 0.12, wood, 0.7, 1.3, 0);
  box(g, 1.7, 0.1, 0.16, wood, 0, 2.12, 0);
  return g;
}

export function buildBoat(): THREE.Group {
  const g = new THREE.Group();
  const t = maps();
  const wood = mat("boat", { map: t.wood, color: 0x5a4634, roughness: 0.85 });
  box(g, 3.4, 0.28, 1.05, wood, 0, 0.2, 0);
  box(g, 2.6, 0.22, 0.16, wood, 0, 0.4, 0.42);
  box(g, 2.6, 0.22, 0.16, wood, 0, 0.4, -0.42);
  box(g, 0.12, 1.4, 0.12, wood, 0.4, 0.9, 0);
  return g;
}

export function buildClothesline(): THREE.Group {
  const g = new THREE.Group();
  const t = maps();
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });
  const cloths = [0xe8e0d0, 0x4a6a48, 0xc45c4a, 0x8aa0b8];
  box(g, 0.1, 2.0, 0.1, wood, -2.2, 1.0, 0);
  box(g, 0.1, 2.0, 0.1, wood, 2.2, 1.0, 0);
  box(g, 4.4, 0.03, 0.03, wood, 0, 1.85, 0, 0, 0, 0, false);
  cloths.forEach((c, i) => {
    const cloth = box(
      g,
      0.55,
      0.7,
      0.04,
      applyWind(mat(`cloth-${c}`, { color: c, roughness: 0.9, side: THREE.DoubleSide }), 1.4, true),
      -1.5 + i * 1.05,
      1.5,
      0,
      0.08,
      0,
      0,
      false,
    );
    cloth.userData.cloth = true;
  });
  return g;
}

export function buildTableSet(): THREE.Group {
  const g = new THREE.Group();
  const t = maps();
  const wood = mat("wood", { map: t.wood, color: 0x5a4634, roughness: 0.9 });
  box(g, 1.4, 0.08, 0.8, wood, 0, 0.72, 0);
  box(g, 0.08, 0.72, 0.08, wood, -0.55, 0.36, -0.28);
  box(g, 0.08, 0.72, 0.08, wood, 0.55, 0.36, -0.28);
  box(g, 0.08, 0.72, 0.08, wood, -0.55, 0.36, 0.28);
  box(g, 0.08, 0.72, 0.08, wood, 0.55, 0.36, 0.28);
  box(g, 0.4, 0.08, 0.4, wood, 1.1, 0.45, 0.15);
  box(g, 0.4, 0.08, 0.4, wood, -1.1, 0.45, -0.1);
  return g;
}

export function resetStructureMaterials() {
  matCache.clear();
}
