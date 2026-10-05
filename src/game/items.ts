import * as THREE from "three";
import type { ItemId } from "./types.ts";

function mat(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.12,
    ...extra,
  });
}

function add(
  g: THREE.Group,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  g.add(m);
  return m;
}

export function createItemMesh(id: ItemId): THREE.Group {
  const g = new THREE.Group();
  g.userData.iid = id;

  if (id === "old_key") {
    const brass = mat(0xc4a15a, { metalness: 0.75, roughness: 0.32, emissive: 0x6a4a18, emissiveIntensity: 0.35 });
    add(g, new THREE.TorusGeometry(0.16, 0.045, 8, 16), brass, 0, 0.22, 0, Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), brass, 0, -0.08, 0);
    add(g, new THREE.BoxGeometry(0.12, 0.05, 0.04), brass, 0.06, -0.24, 0);
    add(g, new THREE.BoxGeometry(0.08, 0.04, 0.04), brass, 0.05, -0.3, 0);
  } else if (id === "camera") {
    const body = mat(0x2a322e, { metalness: 0.3, roughness: 0.45, emissive: 0x1a2420, emissiveIntensity: 0.2 });
    const glass = mat(0x8aa0b8, { metalness: 0.6, roughness: 0.2, emissive: 0x4a6078, emissiveIntensity: 0.45 });
    add(g, new THREE.BoxGeometry(0.42, 0.26, 0.22), body, 0, 0, 0);
    add(g, new THREE.CylinderGeometry(0.1, 0.11, 0.16, 12), glass, 0, 0, -0.16, Math.PI / 2);
    add(g, new THREE.BoxGeometry(0.1, 0.08, 0.08), mat(0xc4a15a, { emissive: 0x8a7020, emissiveIntensity: 0.4 }), 0.16, 0.14, 0);
  } else if (id === "notebook") {
    const cover = mat(0x6f4a3a, { roughness: 0.8, emissive: 0x3a2018, emissiveIntensity: 0.25 });
    const paper = mat(0xe8e0d0, { roughness: 0.9 });
    add(g, new THREE.BoxGeometry(0.34, 0.08, 0.46), cover);
    add(g, new THREE.BoxGeometry(0.3, 0.06, 0.42), paper, 0.01, 0.01, 0);
  } else if (id === "compass") {
    const brass = mat(0xb08a48, { metalness: 0.7, roughness: 0.3, emissive: 0x6a4a18, emissiveIntensity: 0.3 });
    const face = mat(0xe8e4d4, { roughness: 0.5 });
    const needle = mat(0xc45c4a, { emissive: 0x802018, emissiveIntensity: 0.5 });
    add(g, new THREE.CylinderGeometry(0.2, 0.22, 0.08, 16), brass);
    add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16), face, 0, 0.05, 0);
    add(g, new THREE.BoxGeometry(0.04, 0.02, 0.22), needle, 0, 0.07, 0);
  } else if (id === "backpack") {
    const canvas = mat(0x5a6a48, { roughness: 0.85, emissive: 0x2a3a20, emissiveIntensity: 0.25 });
    const strap = mat(0x3a3228, { roughness: 0.9 });
    add(g, new THREE.BoxGeometry(0.42, 0.5, 0.28), canvas, 0, 0.05, 0);
    add(g, new THREE.BoxGeometry(0.18, 0.16, 0.08), canvas, 0, 0.12, -0.18);
    add(g, new THREE.TorusGeometry(0.16, 0.025, 6, 12, Math.PI), strap, 0, 0.28, 0.02, Math.PI, 0, 0);
  } else if (id === "tsinelas") {
    const rub = mat(0x2a4a38, { roughness: 0.9, emissive: 0x14241c, emissiveIntensity: 0.2 });
    add(g, new THREE.BoxGeometry(0.18, 0.05, 0.42), rub, -0.14, 0, 0);
    add(g, new THREE.BoxGeometry(0.18, 0.05, 0.42), rub, 0.14, 0, 0);
    add(g, new THREE.TorusGeometry(0.08, 0.015, 6, 10, Math.PI), rub, -0.14, 0.04, 0.04, Math.PI / 2);
    add(g, new THREE.TorusGeometry(0.08, 0.015, 6, 10, Math.PI), rub, 0.14, 0.04, 0.04, Math.PI / 2);
  } else if (id === "payong") {
    const cloth = mat(0x4a6a48, { roughness: 0.7, emissive: 0x203020, emissiveIntensity: 0.25 });
    const stick = mat(0x5a4634, { roughness: 0.8 });
    add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), stick, 0, 0, 0);
    add(g, new THREE.ConeGeometry(0.18, 0.16, 8), cloth, 0, 0.28, 0);
  } else if (id === "liham") {
    const paper = mat(0xe8e0d0, { roughness: 0.85, emissive: 0x8a7860, emissiveIntensity: 0.2 });
    add(g, new THREE.BoxGeometry(0.28, 0.02, 0.2), paper);
    add(g, new THREE.BoxGeometry(0.12, 0.01, 0.08), mat(0xc45c4a, { roughness: 0.7 }), 0.04, 0.015, 0);
  } else if (id === "radio") {
    const body = mat(0x3a3228, { roughness: 0.55, metalness: 0.25, emissive: 0x2a2018, emissiveIntensity: 0.2 });
    add(g, new THREE.BoxGeometry(0.42, 0.24, 0.18), body);
    add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), mat(0xc4a15a, { metalness: 0.6 }), 0.14, 0.08, 0.1, Math.PI / 2);
    add(g, new THREE.CylinderGeometry(0.01, 0.01, 0.36, 6), mat(0x889288), -0.16, 0.28, 0);
  } else if (id === "lantern") {
    const brass = mat(0xb08a48, { metalness: 0.65, roughness: 0.35, emissive: 0x6a4a18, emissiveIntensity: 0.35 });
    const glass = mat(0xf0d8a8, { emissive: 0xf0d8a8, emissiveIntensity: 0.7, transparent: true, opacity: 0.7 });
    add(g, new THREE.CylinderGeometry(0.12, 0.14, 0.06, 8), brass, 0, -0.16, 0);
    add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.22, 8), glass, 0, 0, 0);
    add(g, new THREE.CylinderGeometry(0.12, 0.1, 0.06, 8), brass, 0, 0.16, 0);
    add(g, new THREE.TorusGeometry(0.08, 0.015, 6, 10), brass, 0, 0.24, 0, Math.PI / 2);
  } else if (id === "salamin") {
    const frame = mat(0x2a2e2c, { metalness: 0.4, roughness: 0.4, emissive: 0x1a1e1c, emissiveIntensity: 0.2 });
    add(g, new THREE.TorusGeometry(0.09, 0.015, 6, 12), frame, -0.1, 0, 0);
    add(g, new THREE.TorusGeometry(0.09, 0.015, 6, 12), frame, 0.1, 0, 0);
    add(g, new THREE.BoxGeometry(0.06, 0.02, 0.02), frame, 0, 0, 0);
  } else if (id === "baon") {
    const tin = mat(0x8aa0b8, { metalness: 0.55, roughness: 0.35, emissive: 0x4a6070, emissiveIntensity: 0.25 });
    add(g, new THREE.BoxGeometry(0.36, 0.16, 0.26), tin);
    add(g, new THREE.BoxGeometry(0.1, 0.04, 0.08), tin, 0, 0.1, 0);
  } else if (id === "abaniko") {
    const wood = mat(0x6a5344, { roughness: 0.7, emissive: 0x3a2a20, emissiveIntensity: 0.2 });
    add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), wood, 0, 0, 0);
    add(g, new THREE.CircleGeometry(0.22, 8, 0, Math.PI * 0.7), mat(0xd9a3a0, { roughness: 0.8 }), 0, 0.08, 0, -0.4, 0, 0);
  } else if (id === "rosaryo") {
    const wood = mat(0x5a3a28, { roughness: 0.7, emissive: 0x3a2018, emissiveIntensity: 0.3 });
    add(g, new THREE.TorusGeometry(0.16, 0.018, 6, 16), wood);
    add(g, new THREE.BoxGeometry(0.06, 0.1, 0.02), wood, 0, -0.22, 0);
  } else if (id === "tabo") {
    const plas = mat(0x3a6a8a, { roughness: 0.45, emissive: 0x1a3a50, emissiveIntensity: 0.25 });
    add(g, new THREE.CylinderGeometry(0.12, 0.1, 0.16, 10), plas);
    add(g, new THREE.TorusGeometry(0.08, 0.015, 6, 10, Math.PI), plas, 0.12, 0.04, 0, 0, 0, Math.PI / 2);
  } else if (id === "sombrero") {
    const straw = mat(0xc4a15a, { roughness: 0.85, emissive: 0x6a4a18, emissiveIntensity: 0.2 });
    add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), straw, 0, 0, 0);
    add(g, new THREE.CylinderGeometry(0.14, 0.16, 0.12, 10), straw, 0, 0.07, 0);
  } else if (id === "battery") {
    const body = mat(0xc45c4a, { roughness: 0.5, emissive: 0x6a2018, emissiveIntensity: 0.3 });
    add(g, new THREE.CylinderGeometry(0.07, 0.07, 0.28, 10), body);
    add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), mat(0xc4a15a, { metalness: 0.7 }), 0, 0.16, 0);
  } else {
    const metal = mat(0x4a5248, { metalness: 0.55, roughness: 0.4, emissive: 0x2a322c, emissiveIntensity: 0.25 });
    add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.32, 8), metal);
    add(g, new THREE.CylinderGeometry(0.08, 0.09, 0.08, 10), mat(0xf0d8a8, { emissive: 0xf0d8a8, emissiveIntensity: 0.6 }), 0, 0.18, 0);
  }

  g.scale.setScalar(1.15);
  return g;
}

export const ITEM_GLOW: Record<ItemId, number> = {
  old_key: 0xc4a15a,
  camera: 0x8aa0b8,
  notebook: 0x6f4a3a,
  battery: 0xc45c4a,
  backpack: 0x6fad7a,
  tsinelas: 0x2a4a38,
  payong: 0x4a6a48,
  liham: 0xe8e0d0,
  radio: 0xc4a15a,
  lantern: 0xf0d8a8,
  salamin: 0x8aa0b8,
  baon: 0x8aa0b8,
  abaniko: 0xd9a3a0,
  rosaryo: 0x5a3a28,
  tabo: 0x3a6a8a,
  compass: 0xb08a48,
  sombrero: 0xc4a15a,
  flashlight: 0xf0d8a8,
};
