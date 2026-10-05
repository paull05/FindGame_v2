import * as THREE from "three";
import { applyWind, getTextures } from "./textures.ts";
import type { Quality, TimeOfDay } from "./types.ts";
import {
  generateBushes,
  generateFlowers,
  generateGrass,
  generatePoles,
  generateRocks,
  generateTrees,
  getHeight,
  pathDist,
  WORLD_HALF,
} from "./world.ts";

const dummy = new THREE.Object3D();
const _col = new THREE.Color();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** World-scale instancing must not frustum-cull against the local geometry at the origin. */
function finishInstanced(mesh: THREE.InstancedMesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.frustumCulled = false;
  return mesh;
}

export function buildTrees(quality: Quality): THREE.Object3D[] {
  const trees = generateTrees();
  const pines = trees.filter((t) => t.kind === "pine");
  const oaks = trees.filter((t) => t.kind === "oak");
  const tex = getTextures();
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.4, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    map: tex.wood,
    color: 0x5a4634,
    roughness: 0.95,
    metalness: 0.02,
  });
  const pineLeafGeo = new THREE.ConeGeometry(1.05, 2.6, 7);
  const oakLeafGeo = new THREE.SphereGeometry(1.18, 7, 6);
  const pineMat = applyWind(
    new THREE.MeshStandardMaterial({ color: 0x2f5638, roughness: 0.88, metalness: 0.0 }),
    0.4,
    false,
  );
  const oakMat = applyWind(
    new THREE.MeshStandardMaterial({ color: 0x3a6a40, roughness: 0.86, metalness: 0.0 }),
    0.5,
    false,
  );

  const plant = (
    list: typeof trees,
    leafGeo: THREE.BufferGeometry,
    lmat: THREE.Material,
    leafY: number,
    tint: number,
  ) => {
    const out: THREE.Object3D[] = [];
    if (!list.length) return out;
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
    const leaves = new THREE.InstancedMesh(leafGeo, lmat, list.length);
    leaves.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    list.forEach((t, i) => {
      const y = getHeight(t.x, t.z);
      dummy.position.set(t.x, y + 1.15 * t.s, t.z);
      dummy.scale.set(t.s * (0.92 + (t.x % 1) * 0.08), t.s, t.s * (0.92 + (t.z % 1) * 0.08));
      dummy.rotation.set((t.z * 0.01) % 0.08, t.x * 1.7, (t.x * 0.01) % 0.07);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, y + leafY * t.s, t.z);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
      _col.setHex(tint);
      _col.offsetHSL((t.x * 0.02) % 0.06 - 0.03, 0, ((t.z * 0.03) % 0.16) - 0.08);
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

  return [...plant(pines, pineLeafGeo, pineMat, 2.6, 0x2f5638), ...plant(oaks, oakLeafGeo, oakMat, 2.38, 0x3a6a40)];
}

export function buildRocks(): THREE.InstancedMesh {
  const rocks = generateRocks();
  const tex = getTextures();
  const geo = new THREE.IcosahedronGeometry(0.7, 0);
  const mat = new THREE.MeshStandardMaterial({
    map: tex.stone,
    color: 0x8a9088,
    roughness: 0.96,
    metalness: 0.04,
    flatShading: true,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, rocks.length);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(rocks.length * 3), 3);
  rocks.forEach((r, i) => {
    dummy.position.set(r.x, getHeight(r.x, r.z) + 0.16 * r.s, r.z);
    dummy.scale.set(r.s * (0.8 + (r.x % 1) * 0.4), r.s * (0.55 + (r.z % 1) * 0.5), r.s);
    dummy.rotation.set(r.s * 1.2, r.x * 0.4, r.z * 0.3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    _col.setHex(0x6a7268);
    _col.offsetHSL(0, 0, ((r.x * 13) % 1) * 0.12 - 0.06);
    mesh.setColorAt(i, _col);
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return finishInstanced(mesh);
}

export function buildBushes(): THREE.InstancedMesh {
  const bushes = generateBushes();
  const geo = new THREE.SphereGeometry(0.7, 6, 5);
  const mat = applyWind(
    new THREE.MeshStandardMaterial({ color: 0x2a4a32, roughness: 0.94, metalness: 0 }),
    0.32,
    false,
  );
  const mesh = new THREE.InstancedMesh(geo, mat, bushes.length);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bushes.length * 3), 3);
  bushes.forEach((b, i) => {
    dummy.position.set(b.x, getHeight(b.x, b.z) + 0.38 * b.s, b.z);
    dummy.scale.set(b.s * 1.05, b.s * 0.72, b.s * 0.95);
    dummy.rotation.set(0.05, b.x * 2.1, -0.04);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    _col.setHex(0x2a4a32);
    _col.offsetHSL(0, 0, ((b.z * 9) % 1) * 0.14 - 0.07);
    mesh.setColorAt(i, _col);
  });
  mesh.castShadow = true;
  return finishInstanced(mesh);
}

export function buildGrass(quality: Quality): THREE.InstancedMesh {
  const count = quality === "low" ? 280 : quality === "medium" ? 620 : 900;
  const grass = generateGrass().slice(0, count);
  const tex = getTextures();
  const geo = new THREE.PlaneGeometry(0.42, 0.58);
  geo.translate(0, 0.29, 0);
  const useA2c = quality !== "low";
  const mat = applyWind(
    new THREE.MeshStandardMaterial({
      map: tex.grassBlade,
      color: 0xc8e0b0,
      roughness: 0.95,
      metalness: 0,
      alphaTest: useA2c ? 0.28 : 0.52,
      alphaToCoverage: useA2c,
      side: THREE.DoubleSide,
      depthWrite: true,
    }),
    0.7,
    true,
  );
  const mesh = new THREE.InstancedMesh(geo, mat, grass.length);
  grass.forEach((g, i) => {
    dummy.position.set(g.x, getHeight(g.x, g.z) + 0.01, g.z);
    dummy.scale.set(g.s * 0.9, g.s * (0.85 + (g.x % 1) * 0.4), g.s);
    dummy.rotation.set(0.04, g.x * 3.7 + g.z, 0.03);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  return finishInstanced(mesh);
}

export function buildFlowers(): THREE.InstancedMesh {
  const flowers = generateFlowers();
  const geo = new THREE.SphereGeometry(0.09, 5, 4);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.04 });
  const mesh = new THREE.InstancedMesh(geo, mat, flowers.length);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(flowers.length * 3), 3);
  flowers.forEach((f, i) => {
    dummy.position.set(f.x, getHeight(f.x, f.z) + 0.16, f.z);
    dummy.scale.setScalar(f.s);
    dummy.rotation.set(0, f.x, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    _col.setHex(f.c);
    mesh.setColorAt(i, _col);
  });
  return finishInstanced(mesh);
}

export function buildLeafLitter(quality: Quality): THREE.InstancedMesh {
  const rand = rng(4401);
  const n = quality === "low" ? 180 : quality === "medium" ? 340 : 480;
  const tex = getTextures();
  const geo = new THREE.PlaneGeometry(0.28, 0.18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    map: tex.leaf,
    color: 0xc4a070,
    roughness: 0.9,
    metalness: 0,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  const oaks = generateTrees().filter((t) => t.kind === "oak");
  for (let i = 0; i < n; i++) {
    const host = oaks[(rand() * oaks.length) | 0] ?? { x: 80, z: 4 };
    const a = rand() * Math.PI * 2;
    const r = 0.8 + rand() * 4.2;
    const x = host.x + Math.cos(a) * r;
    const z = host.z + Math.sin(a) * r;
    dummy.position.set(x, getHeight(x, z) + 0.045, z);
    dummy.scale.set(0.7 + rand() * 0.8, 1, 0.7 + rand() * 0.6);
    dummy.rotation.set(0, rand() * 6.28, (rand() - 0.5) * 0.3);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    _col.setHex(rand() > 0.5 ? 0x8a5a32 : rand() > 0.5 ? 0xa07038 : 0x6a4a28);
    mesh.setColorAt(i, _col);
  }
  return finishInstanced(mesh);
}

export function buildTwigs(quality: Quality): THREE.InstancedMesh {
  const rand = rng(8821);
  const n = quality === "low" ? 40 : 80;
  const tex = getTextures();
  const geo = new THREE.CylinderGeometry(0.018, 0.028, 0.55, 4);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x5a4634, roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  for (let i = 0; i < n; i++) {
    const x = (rand() * 2 - 1) * WORLD_HALF * 0.82;
    const z = (rand() * 2 - 1) * WORLD_HALF * 0.82;
    if (pathDist(x, z) < 1.2) {
      i--;
      continue;
    }
    dummy.position.set(x, getHeight(x, z) + 0.035, z);
    dummy.scale.set(0.6 + rand() * 1.1, 1, 0.6 + rand());
    dummy.rotation.set(0, rand() * 6.2, (rand() - 0.5) * 0.25);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  return finishInstanced(mesh);
}

export function buildUtilityPoles(): THREE.Group {
  const g = new THREE.Group();
  g.name = "poles";
  const tex = getTextures();
  const concrete = new THREE.MeshStandardMaterial({ map: tex.concrete, color: 0x8a8e86, roughness: 0.92 });
  const wireM = new THREE.LineBasicMaterial({ color: 0x2a2e2c, transparent: true, opacity: 0.55 });
  const poles = generatePoles();
  const tops: THREE.Vector3[] = [];
  for (const p of poles) {
    const y = getHeight(p.x, p.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.4, 6), concrete);
    pole.position.set(p.x, y + 2.7, p.z);
    pole.castShadow = true;
    g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), concrete);
    arm.position.set(p.x + 0.35, y + 5.15, p.z);
    g.add(arm);
    tops.push(new THREE.Vector3(p.x + 0.7, y + 5.18, p.z));
  }
  for (let i = 0; i < tops.length - 1; i++) {
    const a = tops[i];
    const b = tops[i + 1];
    const geo = new THREE.BufferGeometry().setFromPoints([
      a,
      new THREE.Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - 0.35, (a.z + b.z) / 2),
      b,
    ]);
    g.add(new THREE.Line(geo, wireM));
  }
  return g;
}

function box(
  g: THREE.Group,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

export function buildStoryDressing(tod: TimeOfDay): THREE.Group {
  const g = new THREE.Group();
  g.name = "story";
  const tex = getTextures();
  const wood = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x8a6a48, roughness: 0.88, metalness: 0.02 });
  const crateM = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x6a5344, roughness: 0.9 });
  const rust = new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x6a5a48, roughness: 0.55, metalness: 0.45 });
  const clay = new THREE.MeshStandardMaterial({ color: 0x8a5a40, roughness: 0.92, metalness: 0.02 });
  const sack = new THREE.MeshStandardMaterial({ color: 0xc4b48a, roughness: 0.95 });
  const night = tod === "night";

  const place = (fn: (y: number) => void, x: number, z: number) => fn(getHeight(x, z));

  place((y) => {
    box(g, 0.7, 0.55, 0.7, crateM, -16.4, y + 0.32, 10.6, 0, 0.18, 0);
    box(g, 0.55, 0.42, 0.55, crateM, -15.7, y + 0.24, 11.3, 0, -0.4, 0);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 8), clay);
    p.position.set(-17.2, y + 0.18, 9.8);
    g.add(p);
  }, -16.4, 10.6);

  place((y) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.32, 8), clay);
    pot.position.set(4.6, y + 0.18, 16.4);
    pot.rotation.z = 0.08;
    g.add(pot);
    const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.26, 8), clay);
    pot2.position.set(5.3, y + 0.15, 16.1);
    g.add(pot2);
    box(g, 0.12, 1.1, 0.12, wood, 6.2, y + 0.55, 15.4, 0.15, 0.4, 0.05);
  }, 4.6, 16.4);

  place((y) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.85, 10), rust);
    barrel.position.set(-86.6, y + 0.45, -6.4);
    g.add(barrel);
    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.7, 10), rust);
    barrel2.position.set(-85.6, y + 0.38, -7.2);
    barrel2.rotation.z = 1.2;
    barrel2.rotation.y = 0.4;
    g.add(barrel2);
    box(g, 0.9, 0.5, 0.7, crateM, -88.4, y + 0.28, -8.2, 0, 0.3, 0);
  }, -86.6, -6.4);

  place((y) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 8), wood);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = 0.4;
    log.position.set(92.4, y + 0.22, 8.6);
    g.add(log);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.45, 8), wood);
    stump.position.set(90.8, y + 0.22, 10.2);
    g.add(stump);
  }, 92.4, 8.6);

  place((y) => {
    box(g, 0.8, 0.55, 0.6, crateM, 22.4, y + 0.3, 78.6, 0, 0.5, 0);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 6, 12), new THREE.MeshStandardMaterial({ color: 0x1a1e1c, roughness: 0.95 }));
    tire.position.set(24.2, y + 0.32, 79.4);
    tire.rotation.x = Math.PI / 2;
    tire.rotation.z = 0.3;
    g.add(tire);
  }, 22.4, 78.6);

  place((y) => {
    box(g, 0.5, 0.18, 0.7, wood, -64.2, y + 0.14, 54.4, 0, 0.6, 0);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 10), wood);
    coil.position.set(-63.4, y + 0.08, 55.2);
    coil.rotation.x = Math.PI / 2;
    g.add(coil);
  }, -64.2, 54.4);

  place((y) => {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), sack);
    bag.scale.set(1, 0.75, 0.9);
    bag.position.set(-50.4, y + 0.18, -90.6);
    g.add(bag);
    const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.1, 7), clay);
    shard.position.set(-49.6, y + 0.06, -89.8);
    shard.rotation.z = 1.1;
    g.add(shard);
  }, -50.4, -90.6);

  const lamp = new THREE.MeshStandardMaterial({
    color: 0xf0d8a8,
    emissive: 0xf0d8a8,
    emissiveIntensity: night ? 0.45 : 0.08,
    roughness: 0.4,
  });
  place((y) => {
    box(g, 0.08, 0.08, 0.08, lamp, 0.4, y + 0.92, 16.6);
  }, 0.4, 16.6);

  return g;
}
