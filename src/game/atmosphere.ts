import * as THREE from "three";
import { getTextures } from "./textures.ts";
import type { Quality, TimeOfDay } from "./types.ts";
import { sampleSky, type SkyPreset } from "./sky.ts";

const _sunDir = new THREE.Vector3();

export function makeSkyDome(preset: SkyPreset): THREE.Mesh {
  const geo = new THREE.SphereGeometry(220, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uZenith: { value: new THREE.Color(preset.zenith) },
      uHorizon: { value: new THREE.Color(preset.horizon) },
      uGround: { value: new THREE.Color(preset.fog) },
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
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

export function applySkyPreset(sky: THREE.Mesh, preset: SkyPreset) {
  const mat = sky.material as THREE.ShaderMaterial;
  if (!mat.uniforms) return;
  (mat.uniforms.uZenith.value as THREE.Color).setHex(preset.zenith);
  (mat.uniforms.uHorizon.value as THREE.Color).setHex(preset.horizon);
  (mat.uniforms.uGround.value as THREE.Color).setHex(preset.fog);
}

export function makeClouds(tod: TimeOfDay, quality: Quality): THREE.Group {
  const g = new THREE.Group();
  g.name = "clouds";
  const tex = getTextures().cloud;
  const count = quality === "low" ? 6 : quality === "medium" ? 9 : 12;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: tod === "night" ? 0x8aa0b8 : 0xffffff,
    transparent: true,
    opacity: tod === "night" ? 0.18 : 0.42,
    depthWrite: false,
    depthTest: true,
    fog: true,
    side: THREE.DoubleSide,
  });
  const geo = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    const a = (i / count) * Math.PI * 2 + i * 0.37;
    const r = 48 + (i % 5) * 16;
    m.position.set(Math.cos(a) * r, 42 + (i % 4) * 7, Math.sin(a) * r - 10);
    const s = 14 + (i % 4) * 6;
    m.scale.set(s * 1.8, s * 0.7, 1);
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

export function updateClouds(group: THREE.Group, t: number, cam: THREE.Vector3) {
  for (const child of group.children) {
    const m = child as THREE.Mesh;
    const driftX = Math.sin(t * 0.02 + m.userData.phase) * 8;
    const driftZ = Math.cos(t * 0.016 + m.userData.phase) * 6;
    m.position.x = cam.x + m.userData.baseX + driftX;
    m.position.z = cam.z + m.userData.baseZ + driftZ;
    m.position.y = m.userData.baseY + Math.sin(t * 0.12 + m.userData.phase) * 0.6;
    m.lookAt(cam.x, m.position.y, cam.z);
  }
}

export function makeRain(quality: Quality): THREE.LineSegments {
  const count = quality === "low" ? 180 : quality === "medium" ? 320 : 460;
  const positions = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const offset = i * 6;
    const x = (Math.random() - 0.5) * 34;
    const y = Math.random() * 22 - 2;
    const z = (Math.random() - 0.5) * 34;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    positions[offset + 3] = x + 0.08;
    positions[offset + 4] = y - 0.48;
    positions[offset + 5] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0xb8c4c3, transparent: true, opacity: 0.32, depthWrite: false });
  const rain = new THREE.LineSegments(geo, material);
  rain.frustumCulled = false;
  rain.visible = false;
  return rain;
}

export function updateRain(rain: THREE.LineSegments, camera: THREE.Vector3, dt: number) {
  rain.position.copy(camera);
  const positions = rain.geometry.attributes.position as THREE.BufferAttribute;
  const speed = 24 * dt;
  for (let i = 0; i < positions.count; i += 2) {
    const y = positions.getY(i) - speed;
    if (y < -2.2) {
      const x = (Math.random() - 0.5) * 34;
      const z = (Math.random() - 0.5) * 34;
      const top = 12 + Math.random() * 11;
      positions.setXYZ(i, x, top, z);
      positions.setXYZ(i + 1, x + 0.08, top - 0.48, z);
    } else {
      positions.setY(i, y);
      positions.setY(i + 1, y - 0.48);
    }
  }
  positions.needsUpdate = true;
}

export function makeDust(quality: Quality, tod: TimeOfDay): THREE.Points {
  const n = quality === "low" ? 70 : quality === "medium" ? 110 : 140;
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 36;
    pos[i * 3 + 1] = 0.4 + Math.random() * 4.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    vel[i * 3] = 0.15 + Math.random() * 0.25;
    vel[i * 3 + 1] = 0.02 + Math.random() * 0.08;
    vel[i * 3 + 2] = 0.08 + Math.random() * 0.18;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const color = tod === "night" ? 0xb8c8d8 : tod === "sunset" ? 0xf0c8a0 : 0xe8e4c8;
  const mat = new THREE.PointsMaterial({
    color,
    size: tod === "night" ? 0.04 : 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: tod === "night" ? 0.18 : 0.24,
    depthWrite: false,
    fog: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData.vel = vel;
  pts.userData.count = n;
  pts.frustumCulled = false;
  pts.renderOrder = 2;
  return pts;
}

export function updateDust(pts: THREE.Points, origin: THREE.Vector3, dt: number, indoor: boolean) {
  const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
  const vel = pts.userData.vel as Float32Array;
  const n = pts.userData.count as number;
  const mat = pts.material as THREE.PointsMaterial;
  const target = indoor ? 0.04 : 0.22;
  mat.opacity += (target - mat.opacity) * Math.min(1, dt * 2.2);
  const ground = origin.y - 1.55;
  for (let i = 0; i < n; i++) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);
    let x = x0 + vel[i * 3] * dt;
    let y = y0 + Math.sin(x0 * 0.4 + y0) * vel[i * 3 + 1] * dt;
    let z = z0 + vel[i * 3 + 2] * dt;
    const dx = x - origin.x;
    const dz = z - origin.z;
    if (dx * dx + dz * dz > 22 * 22 || y > ground + 5.4 || y < ground + 0.2) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 12;
      x = origin.x + Math.cos(a) * r;
      z = origin.z + Math.sin(a) * r;
      y = ground + 0.35 + Math.random() * 2.8;
    }
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
}

export function makeSunGlow(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(11, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfff2c4,
    transparent: true,
    opacity: 0.16,
    fog: false,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -7;
  mesh.frustumCulled = false;
  return mesh;
}

export type LightRig = {
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  fog: THREE.Fog;
  renderer: THREE.WebGLRenderer;
  sky: THREE.Mesh;
  celestial: THREE.Mesh;
  glow: THREE.Mesh;
};

/** Colors, intensities, sky, sun disc. Does not move the shadow frustum. */
export function applyLighting(rig: LightRig, preset: SkyPreset, px: number, pz: number, night: boolean) {
  rig.sun.color.setHex(preset.sunColor);
  rig.sun.intensity = preset.sunInt;
  rig.fill.color.setHex(preset.hemiSky);
  rig.fill.intensity = night ? 0.06 : 0.16;
  rig.fill.position.set(-preset.sunPos[0] * 0.4, preset.sunPos[1] * 0.35, -preset.sunPos[2] * 0.4);
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
  (rig.glow.material as THREE.MeshBasicMaterial).color.setHex(preset.sunColor);
  (rig.glow.material as THREE.MeshBasicMaterial).opacity = night ? 0.08 : 0.14;
}

/**
 * Keep sun direction from the preset, but snap the shadow camera to a world
 * texel grid so the map does not swim/flicker as the player moves.
 */
export function placeSun(sun: THREE.DirectionalLight, preset: SkyPreset, px: number, pz: number) {
  const [ox, oy, oz] = preset.sunPos;
  const len = Math.hypot(ox, oy, oz) || 1;
  const alt = oy / len;
  sun.shadow.normalBias = 0.045 + (1 - Math.max(0.15, alt)) * 0.07;
  sun.shadow.bias = -0.0007 - (1 - Math.max(0.15, alt)) * 0.0006;
  if (!sun.castShadow) {
    sun.position.set(ox, oy, oz);
    sun.target.position.set(0, 0, 0);
    sun.target.updateMatrixWorld();
    return;
  }
  const cam = sun.shadow.camera;
  const extent = cam.right - cam.left;
  const texel = extent / Math.max(1, sun.shadow.mapSize.width);
  const sx = Math.round(px / texel) * texel;
  const sz = Math.round(pz / texel) * texel;
  sun.position.set(sx + ox, oy, sz + oz);
  sun.target.position.set(sx, 0, sz);
  sun.target.updateMatrixWorld();
}

export { sampleSky };
