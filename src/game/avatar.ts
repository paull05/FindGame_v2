import * as THREE from "three";

const SKIN = 0xc49a72;
const SHIRT = 0xe8e4d8;
const SHORTS = 0x3a4a40;
const HAIR = 0x1a1614;
const FLASH_BODY = 0x2a322e;
const FLASH_BEZEL = 0x3a443e;
const FLASH_LENS = 0xf0d8a8;

function mat(color: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04, ...extra });
}

function add(
  g: THREE.Group,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  g.add(m);
  return m;
}

function alongNegZ(geo: THREE.BufferGeometry) {
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function buildFlashlightHand(): THREE.Group {
  const g = new THREE.Group();
  const skin = mat(SKIN);
  const sleeve = mat(SHIRT, { roughness: 0.78 });
  const metal = mat(FLASH_BODY, { metalness: 0.58, roughness: 0.32 });
  const bezelM = mat(FLASH_BEZEL, { metalness: 0.62, roughness: 0.28 });
  const lens = mat(FLASH_LENS, { emissive: FLASH_LENS, emissiveIntensity: 0.15, roughness: 0.18, metalness: 0.2 });

  const torch = new THREE.Group();
  torch.position.set(0.0, 0.008, -0.02);
  add(torch, alongNegZ(new THREE.CylinderGeometry(0.02, 0.024, 0.16, 12)), metal, 0, 0, 0);
  add(torch, alongNegZ(new THREE.CylinderGeometry(0.028, 0.026, 0.028, 12)), bezelM, 0, 0, -0.086);
  const glass = add(torch, alongNegZ(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12)), lens, 0, 0, -0.104);
  add(torch, new THREE.BoxGeometry(0.012, 0.01, 0.018), bezelM, 0.0, 0.026, 0.02);
  g.add(torch);

  const palm = add(g, new THREE.SphereGeometry(0.052, 12, 8), skin, 0.002, -0.026, 0.018);
  palm.scale.set(1.18, 0.62, 1.22);
  const grip = add(g, new THREE.CapsuleGeometry(0.011, 0.045, 4, 8), skin, 0, 0.006, -0.032, Math.PI / 2);
  grip.scale.set(1, 1, 0.9);
  add(g, new THREE.CapsuleGeometry(0.014, 0.035, 4, 8), skin, -0.042, -0.012, -0.006, 1.18, 0.1, -0.58);

  const cuff = add(g, new THREE.CylinderGeometry(0.029, 0.036, 0.075, 10), sleeve, 0.035, -0.077, 0.13, 1.12, 0.08, 0.32);
  cuff.scale.z = 0.9;
  const arm = add(g, new THREE.CylinderGeometry(0.026, 0.034, 0.2, 10), sleeve, 0.064, -0.13, 0.235, 1.12, 0.08, 0.32);
  arm.castShadow = false;

  g.userData.lens = glass;
  g.userData.torch = torch;
  g.position.set(0.22, -0.3, -0.46);
  g.rotation.set(-0.08, 0.16, 0.05);
  g.traverse((obj) => {
    obj.frustumCulled = false;
  });
  return g;
}

export function buildPlayerBody(): THREE.Group {
  const g = new THREE.Group();
  g.name = "player-body";
  const skin = mat(SKIN);
  const shirt = mat(SHIRT);
  const shorts = mat(SHORTS);
  const hair = mat(HAIR);
  const shoes = mat(0x2a322c);

  add(g, new THREE.CylinderGeometry(0.09, 0.1, 0.42, 8), shorts, 0, 0.72, 0);
  add(g, new THREE.CylinderGeometry(0.12, 0.14, 0.48, 8), shirt, 0, 1.12, 0);
  add(g, new THREE.SphereGeometry(0.13, 10, 8), skin, 0, 1.48, 0);
  add(g, new THREE.SphereGeometry(0.135, 10, 8), hair, 0, 1.54, -0.01);
  add(g, new THREE.CylinderGeometry(0.045, 0.05, 0.46, 6), skin, -0.18, 1.05, 0, 0, 0, 0.12);
  add(g, new THREE.CylinderGeometry(0.045, 0.05, 0.46, 6), skin, 0.18, 1.05, 0, 0, 0, -0.12);
  add(g, new THREE.CylinderGeometry(0.048, 0.055, 0.52, 6), skin, -0.07, 0.38, 0);
  add(g, new THREE.CylinderGeometry(0.048, 0.055, 0.52, 6), skin, 0.07, 0.38, 0);
  add(g, new THREE.BoxGeometry(0.09, 0.05, 0.16), shoes, -0.07, 0.1, 0.02);
  add(g, new THREE.BoxGeometry(0.09, 0.05, 0.16), shoes, 0.07, 0.1, 0.02);

  const torch = new THREE.Group();
  const metal = mat(FLASH_BODY, { metalness: 0.48, roughness: 0.38 });
  const lens = mat(FLASH_LENS, { emissive: FLASH_LENS, emissiveIntensity: 0.2 });
  add(torch, alongNegZ(new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8)), metal, 0, 0, 0);
  const glass = add(torch, alongNegZ(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 8)), lens, 0, 0, -0.1);
  torch.position.set(0.28, 1.02, -0.16);
  torch.rotation.set(-0.18, 0.05, 0.12);
  g.add(torch);
  g.userData.lens = glass;
  g.userData.torch = torch;
  g.visible = false;
  return g;
}

export function makeFlashlight(): { light: THREE.SpotLight; fill: THREE.PointLight } {
  const light = new THREE.SpotLight(0xffe4c4, 0, 22, 0.68, 0.5, 1.05);
  light.castShadow = false;
  const fill = new THREE.PointLight(0xffe8d0, 0, 14, 1.35);
  fill.castShadow = false;
  return { light, fill };
}
