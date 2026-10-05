import * as THREE from "three";
import { applyLighting, makeClouds, makeDust, makeRain, makeSkyDome, makeSunGlow, placeSun, sampleSky, updateClouds, updateDust, updateRain } from "./atmosphere.ts";
import { getSharedAudio } from "./audio.ts";
import { buildFlashlightHand, buildPlayerBody, makeFlashlight } from "./avatar.ts";
import {
  buildBushes,
  buildFlowers,
  buildGrass,
  buildLeafLitter,
  buildRocks,
  buildStoryDressing,
  buildTrees,
  buildTwigs,
  buildUtilityPoles,
} from "./dressing.ts";
import { createItemMesh, ITEM_GLOW } from "./items.ts";
import { beginWalk, collectItem, createSim, hudOf, remainingOf, stepSim, type Sim } from "./sim.ts";
import { makeCelestial, makeStars } from "./sky.ts";
import {
  buildBoat,
  buildClothesline,
  buildDetailed,
  buildJeepney,
  buildTableSet,
  buildWell,
  resetStructureMaterials,
} from "./structures.ts";
import { getTextures, tickWind } from "./textures.ts";
import type { CameraView, HudSnapshot, InputState, ItemId, LevelDef, Quality, TimeOfDay, WeatherMode } from "./types.ts";
import {
  biomeColor,
  buildingAabbs,
  extraAabbs,
  generateBenches,
  generateBuildings,
  generateFences,
  generateLamps,
  generateSigns,
  getHeight,
  WORLD_HALF,
  type Aabb,
} from "./world.ts";

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  getX: () => number;
  getZ: () => number;
  setSteer?: (v: number) => void;
  setKeys?: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
    __haven?: {
      sim: () => Sim | null;
      collect: (id: ItemId) => void;
      expire: () => void;
      win: () => void;
      focus: () => void;
      input: () => {
        f: number;
        r: number;
        keys: string[];
        pad: { f: number; r: number };
        started: boolean;
        paused: boolean;
        focused: boolean;
      };
      audio: () => {
        started: boolean;
        gameplay: boolean;
        ctx: string;
        paused: boolean;
        musicOn: boolean;
        track: string;
        buffers: number;
        pickupCount: number;
        footCount: number;
        lastPickupAt: number;
        lastFootAt: number;
        lastPickupId: string | null;
        duck: number;
        ambPlaying: boolean;
        musicPlaying: boolean;
      };
      visual?: () => {
        sun: number[];
        target: number[];
        instancedCulled: number;
        instanced: number;
        fog: number;
        exposure: number;
      };
      setPad?: (v: { f: number; r: number } | null) => void;
    };
  }
}

type Hooks = {
  onHud: (h: HudSnapshot, sim: Sim) => void;
  onEnd: (sim: Sim) => void;
  onPickup: (id: ItemId) => void;
};

const DETAILED = new Set(["house", "kubo", "store", "workshop", "greenhouse", "mill"]);

const GAME_CODES = new Set([
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
  "KeyF",
]);

function isTextEntry(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function radialDeadzone(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class HavenRuntime {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sim: Sim;
  input: InputState = { f: 0, r: 0, jump: false, sprint: false, crouch: false, lookX: 0, lookY: 0, interact: false };
  keys = new Set<string>();
  injected: string[] | null = null;
  touchAxis = { f: 0, r: 0 };
  padAxis = { f: 0, r: 0, lookX: 0, lookY: 0, jump: false, sprint: false, crouch: false };
  padPrev = { interact: false, lamp: false };
  qaPad: { f: number; r: number } | null = null;
  running = false;
  paused = false;
  raf = 0;
  acc = 0;
  last = 0;
  hudAcc = 0;
  hooks: Hooks;
  audio = getSharedAudio();
  buildings = generateBuildings();
  aabbs = [...buildingAabbs(this.buildings), ...extraAabbs()];
  itemGroups: THREE.Group[] = [];
  flashlight: THREE.SpotLight;
  flashFill: THREE.PointLight;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  bob = 0;
  pointerLocked = false;
  touchLook = { x: 0, y: 0 };
  disposed = false;
  tool: THREE.Group;
  body: THREE.Group;
  cameraView: CameraView = "first";
  handReach = 0;
  endedSent = false;
  fog: THREE.Fog;
  sky: THREE.Mesh;
  stars: THREE.Points | null = null;
  celestial: THREE.Mesh;
  glow: THREE.Mesh;
  clouds: THREE.Group | null = null;
  rain: THREE.LineSegments;
  dust: THREE.Points | null = null;
  itemHalo: THREE.PointLight | null = null;
  lastLookId: string | null = "__init__";
  waterMeshes: THREE.Mesh[] = [];
  doors: THREE.Mesh[] = [];
  houseInteriorLights: THREE.PointLight[] = [];
  houseExteriorLights: THREE.PointLight[] = [];
  houseBulbs: THREE.MeshStandardMaterial[] = [];
  houseInteriorBulbs: THREE.MeshStandardMaterial[] = [];
  houseWindows: THREE.MeshStandardMaterial[] = [];
  lampLights: THREE.PointLight[] = [];
  lampBulbs: THREE.MeshStandardMaterial[] = [];
  timeOfDay: TimeOfDay;
  weatherMode: WeatherMode;
  lastRemainBand = 4;
  _unbind: () => void = () => {};
  disposables: THREE.Object3D[] = [];
  level: LevelDef;
  quality: Quality;
  tmpColor = new THREE.Color();
  landDip = 0;
  wasGround = true;
  inspectedN = 0;
  camY = 0;
  camRoll = 0;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelDef,
    playerName: string,
    speak: boolean,
    quality: Quality,
    weatherMode: WeatherMode,
    hooks: Hooks,
  ) {
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
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== "low", powerPreference: "high-performance" });
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
    this.renderer.shadowMap.enabled = quality !== "low";
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = preset.exposure;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(preset.bg);
    this.fog = new THREE.Fog(preset.fog, preset.fogNear, preset.fogFar);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(72, 1, 0.12, 240);
    this.camera.rotation.order = "YXZ";

    this.hemi = new THREE.HemisphereLight(preset.hemiSky, preset.hemiGround, preset.hemiInt);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(preset.hemiSky, preset.ambient);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(preset.sunColor, preset.sunInt);
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
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.06;
    this.sun.shadow.radius = 1.75;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.fill = new THREE.DirectionalLight(preset.hemiSky, this.timeOfDay === "night" ? 0.06 : 0.16);
    this.fill.position.set(-preset.sunPos[0] * 0.4, preset.sunPos[1] * 0.35, -preset.sunPos[2] * 0.4);
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
    this.flashlight.position.set(0.18, -0.12, 0.04);
    this.flashFill.position.set(0.08, -0.62, -0.9);
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

  track(obj: THREE.Object3D) {
    this.disposables.push(obj);
    this.scene.add(obj);
    return obj;
  }

  buildTerrain() {
    const tex = getTextures();
    const seg = this.quality === "low" ? 72 : this.quality === "medium" ? 96 : 128;
    const geo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, seg, seg);
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
          if (px < bd.w * 0.5 && pz < bd.d * 0.5) {
            const padY = (bd.y ?? getHeight(bd.x, bd.z)) + 0.01;
            pos.setY(i, padY);
            const k = 0.55;
            r = r * (1 - k) + 0.32 * k;
            g = g * (1 - k) + 0.3 * k;
            b = b * (1 - k) + 0.24 * k;
          }
          continue;
        }
        const dx = Math.max(Math.abs(x - bd.x) - bd.w * 0.55, 0);
        const dz = Math.max(Math.abs(z - bd.z) - bd.d * 0.55, 0);
        const d = Math.hypot(dx, dz);
        if (d < 3.2) {
          const ao = 1 - (1 - d / 3.2) * 0.22;
          r *= ao;
          g *= ao;
          b *= ao;
        }
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      map: tex.grass,
      roughnessMap: tex.rough,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    this.track(mesh);
  }

  buildWater() {
    const make = (w: number, d: number, x: number, y: number, z: number, color: number, opacity: number, wave: number) => {
      const geo = new THREE.PlaneGeometry(w, d, 24, 20);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        roughness: 0.28,
        metalness: 0.12,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData.water = true;
      mesh.userData.baseY = y;
      mesh.userData.wave = wave;
      mesh.renderOrder = 1;
      this.waterMeshes.push(mesh);
      this.track(mesh);
    };
    make(52, 42, -72, 1.02, 58, 0x1a4a52, 0.55, 0.045);
    make(3.2, 3.2, 0, getHeight(0, -2) + 0.82, -2, 0x3a7080, 0.62, 0.018);
  }

  buildStructures() {
    for (const b of this.buildings) {
      if (b.kind === "pad") continue;
      if (DETAILED.has(b.kind)) {
        const group = buildDetailed(b, this.timeOfDay);
        group.traverse((ch) => {
          const m = ch as THREE.Mesh;
          if (m.isMesh && m.userData.door) this.doors.push(m);
          const light = ch as THREE.PointLight;
          if (light.isPointLight && light.userData.houseInteriorLight) this.houseInteriorLights.push(light);
          if (light.isPointLight && light.userData.houseExteriorLight) this.houseExteriorLights.push(light);
          if (m.isMesh && m.material) {
            const materials = Array.isArray(m.material) ? m.material : [m.material];
            for (const material of materials) {
              if (!(material instanceof THREE.MeshStandardMaterial)) continue;
              if (material.userData.houseWindow) this.houseWindows.push(material);
              if (material.userData.houseBulb) this.houseBulbs.push(material);
              if (material.userData.houseInteriorBulb) this.houseInteriorBulbs.push(material);
            }
          }
        });
        this.track(group);
        if (b.emissive && this.timeOfDay === "night") {
          const y0 = b.y ?? getHeight(b.x, b.z);
          const light = new THREE.PointLight(b.emissive, 1.15, 13);
          light.position.set(b.x, y0 + b.h * 0.65, b.z);
          light.castShadow = false;
          this.track(light);
        }
        continue;
      }
      const geo =
        b.kind === "dome"
          ? new THREE.SphereGeometry(Math.max(b.w, b.d) / 2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
          : new THREE.BoxGeometry(b.w, b.h, b.d);
      const tex = getTextures();
      const mat = new THREE.MeshStandardMaterial({
        map: b.kind === "tower" ? tex.concrete : tex.stone,
        color: b.color,
        roughness: 0.78,
        metalness: b.kind === "tower" ? 0.28 : 0.08,
        emissive: b.emissive ?? 0x000000,
        emissiveIntensity: b.emissive ? (this.timeOfDay === "night" ? 0.85 : 0.28) : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const y0 = b.y ?? getHeight(b.x, b.z);
      mesh.position.set(b.x, y0 + (b.kind === "dome" ? 0 : b.h / 2), b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.bid = b.id;
      this.track(mesh);
      if (b.emissive && this.timeOfDay === "night") {
        const light = new THREE.PointLight(b.emissive, 1.1, 12);
        light.position.set(b.x, y0 + b.h * 0.7, b.z);
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
    const wood = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x5a4634, roughness: 0.9 });
    const iron = new THREE.MeshStandardMaterial({ map: tex.metal, color: 0x2a2e2c, roughness: 0.5, metalness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({
      color: 0xf0d8a8,
      emissive: 0xf0d8a8,
      emissiveIntensity: night ? 1.1 : 0.15,
      roughness: 0.3,
    });

    const lamps = generateLamps();
    lamps.forEach((lamp, i) => {
      const y = getHeight(lamp.x, lamp.z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.1, 6), iron);
      pole.position.set(lamp.x, y + 1.55, lamp.z);
      pole.castShadow = true;
      this.track(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), glass);
      head.position.set(lamp.x, y + 3.2, lamp.z);
      this.track(head);
      const light = new THREE.PointLight(0xffcc88, 0, 26, 1.35);
      light.position.set(lamp.x, y + 3.15, lamp.z);
      light.castShadow = false;
      this.lampLights.push(light);
      this.track(light);
      head.userData.lampBulb = true;
      this.lampBulbs.push(glass);
    });

    for (const b of generateBenches()) {
      const y = getHeight(b.x, b.z);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.48), wood);
      seat.position.set(b.x, y + 0.42, b.z);
      seat.rotation.y = b.yaw;
      seat.castShadow = true;
      this.track(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.08), wood);
      back.position.set(b.x + Math.sin(b.yaw) * 0.2, y + 0.68, b.z + Math.cos(b.yaw) * 0.2);
      back.rotation.y = b.yaw;
      this.track(back);
    }

    const rail = new THREE.MeshStandardMaterial({ map: tex.wood, color: 0x6a5344, roughness: 0.85 });
    for (const f of generateFences()) {
      const y = getHeight(f.x, f.z);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(f.len, 0.08, 0.08), rail);
      bar.position.set(f.x, y + 0.7, f.z);
      bar.rotation.y = f.yaw;
      this.track(bar);
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(f.len, 0.08, 0.08), rail);
      bar2.position.set(f.x, y + 0.4, f.z);
      bar2.rotation.y = f.yaw;
      this.track(bar2);
    }

    for (const s of generateSigns()) {
      const y = getHeight(s.x, s.z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 5), wood);
      post.position.set(s.x, y + 0.7, s.z);
      this.track(post);
      const texSign = makeSignTexture(s.label);
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.42),
        new THREE.MeshStandardMaterial({ map: texSign, roughness: 0.8, side: THREE.DoubleSide }),
      );
      board.position.set(s.x, y + 1.35, s.z);
      board.rotation.y = s.yaw;
      this.track(board);
    }
  }

  buildSetDressing() {
    const jeep = buildJeepney();
    jeep.position.set(17.4, getHeight(17.4, -2.8), -2.8);
    jeep.rotation.y = 0.35;
    this.track(jeep);

    const well = buildWell();
    well.position.set(-7.6, getHeight(-7.6, 11.2), 11.2);
    this.track(well);

    const boat = buildBoat();
    boat.position.set(-62, 1.22, 56);
    boat.rotation.y = 0.4;
    this.track(boat);

    const line = buildClothesline();
    line.position.set(12.4, getHeight(12.4, 14.2), 14.2);
    line.rotation.y = 0.2;
    this.track(line);

    const table = buildTableSet();
    table.position.set(8.6, getHeight(8.6, 10.4), 10.4);
    this.track(table);

    this.track(buildStoryDressing(this.timeOfDay));
  }

  buildInteractables() {
    this.itemHalo = new THREE.PointLight(0xf0d8a8, 0, 5.5);
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

  setCameraView(mode: CameraView) {
    this.cameraView = mode;
    const third = mode === "third";
    this.tool.visible = !third;
    this.body.visible = third;
    this.camera.near = third ? 0.25 : 0.12;
    this.camera.updateProjectionMatrix();
  }

  setWeather(mode: WeatherMode) {
    this.weatherMode = mode;
    this.timeOfDay = timeForWeather(mode, this.level.timeOfDay);
    this.audio.setTime(this.timeOfDay);
    this.sun.castShadow = this.timeOfDay !== "night" && this.quality !== "low";
    this.rain.visible = mode === "rain";
    this.celestial.geometry.dispose();
    this.celestial.geometry = new THREE.SphereGeometry(this.timeOfDay === "night" ? 5.2 : 6.5, 16, 12);
    (this.celestial.material as THREE.MeshBasicMaterial).color.setHex(this.timeOfDay === "night" ? 0xe8eef8 : 0xfff2c4);
    this.glow.visible = this.timeOfDay !== "night";
    if (this.timeOfDay === "night" && !this.stars) {
      this.stars = makeStars();
      this.scene.add(this.stars);
    } else if (this.timeOfDay !== "night" && this.stars) {
      this.scene.remove(this.stars);
      this.stars.geometry.dispose();
      (this.stars.material as THREE.Material).dispose();
      this.stars = null;
    }
    const cloudTint = mode === "rain" ? 0x9aa8a8 : this.timeOfDay === "night" ? 0x8aa0b8 : 0xffffff;
    const cloudOpacity = mode === "rain" ? 0.68 : this.timeOfDay === "night" ? 0.18 : 0.42;
    this.clouds?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(cloudTint);
      material.opacity = cloudOpacity;
    });
    if (this.dust) {
      const material = this.dust.material as THREE.PointsMaterial;
      material.color.setHex(this.timeOfDay === "night" ? 0xb8c8d8 : this.timeOfDay === "sunset" ? 0xf0c8a0 : 0xe8e4c8);
    }
  }

  setKeys(codes: string[]) {
    this.injected = codes.length ? codes : null;
  }

  setTouchAxis(f: number, r: number) {
    this.touchAxis.f = f;
    this.touchAxis.r = r;
  }

  focusPlay() {
    try {
      this.canvas.tabIndex = 0;
      this.canvas.setAttribute("aria-label", "Game view");
      this.canvas.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
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

  isDown(code: string) {
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
      const left = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0, 0.18);
      this.padAxis.f += -left.y;
      this.padAxis.r += left.x;
      const right = radialDeadzone(p.axes[2] ?? 0, p.axes[3] ?? 0, 0.16);
      this.padAxis.lookX += right.x * 12;
      this.padAxis.lookY += right.y * 12;
      if (p.buttons[12]?.pressed) this.padAxis.f += 1;
      if (p.buttons[13]?.pressed) this.padAxis.f -= 1;
      if (p.buttons[14]?.pressed) this.padAxis.r -= 1;
      if (p.buttons[15]?.pressed) this.padAxis.r += 1;
      if (p.buttons[0]?.pressed) this.padAxis.jump = true;
      if (p.buttons[1]?.pressed || p.buttons[5]?.pressed || (p.buttons[7]?.value ?? 0) > 0.4) this.padAxis.sprint = true;
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
    const loop = (now: number) => {
      if (!this.running || this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const raw = Math.min(0.1, (now - this.last) / 1000);
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
          this.landDip = 0.07;
          this.audio.land(this.sim.surface);
        }
        this.audio.foot(this.sim.speed, step, this.sim.onGround && this.sim.started, this.sim.surface);
        this.audio.setIndoor(this.sim.indoor);
      }
      this.syncCamera(raw);
      this.syncWorld(now / 1000, raw);
      this.renderer.render(this.scene, this.camera);
      this.hudAcc += raw;
      if (this.hudAcc > 0.08) {
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
      setKeys: (codes) => this.setKeys(codes),
    };
    window.__haven = {
      sim: () => this.sim,
      collect: (id) => {
        if (collectItem(this.sim, id)) this.hooks.onPickup(id);
      },
      expire: () => {
        this.sim.t = this.sim.timeLimit;
        this.sim.started = true;
        this.sim.ended = { status: "lose", reason: "time" };
      },
      win: () => {
        for (const it of this.sim.level.items) collectItem(this.sim, it.id);
      },
      focus: () => this.focusPlay(),
      input: () => ({
        f: this.input.f,
        r: this.input.r,
        keys: [...this.keys],
        pad: { f: this.padAxis.f, r: this.padAxis.r },
        started: this.sim.started,
        paused: this.paused,
        focused: document.activeElement === this.canvas,
      }),
      audio: () => this.audio.state(),
      visual: () => {
        let instanced = 0;
        let instancedCulled = 0;
        this.scene.traverse((obj) => {
          const mesh = obj as THREE.InstancedMesh;
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
          exposure: this.renderer.toneMappingExposure,
        };
      },
      setPad: (v) => {
        this.qaPad = v;
      },
    };
  }

  syncCamera(dt: number) {
    const targetY = this.sim.y;
    this.camY += (targetY - this.camY) * (1 - Math.exp(-18 * dt));
    this.bob += this.sim.speed * dt * 1.35;
    let bobY = 0;
    let bobPitch = 0;
    if (this.sim.speed > 0.4 && this.sim.onGround) {
      bobY = Math.sin(this.bob) * 0.028;
      bobPitch = Math.cos(this.bob) * 0.006;
    }
    this.landDip += (0 - this.landDip) * (1 - Math.exp(-10 * dt));
    this.handReach += (0 - this.handReach) * (1 - Math.exp(-8 * dt));
    const night = this.timeOfDay === "night";
    const lit = this.sim.light;
    const flashInt = lit ? (night ? 28 : this.timeOfDay === "sunset" ? 7.5 : 3.5) : night ? 0.12 : 0;
    this.flashlight.intensity = flashInt;
    this.flashlight.distance = night ? 72 : this.timeOfDay === "sunset" ? 48 : 30;
    this.flashlight.angle = night ? 0.68 : 0.54;
    this.flashFill.intensity = lit ? (night ? 5.2 : this.timeOfDay === "sunset" ? 1.6 : 0.7) : 0;
    this.flashlight.target.position.set(0, -1.2, -10);
    const lensInt = lit ? 1.35 : 0.08;
    const handLens = this.tool.userData.lens as THREE.Mesh | undefined;
    if (handLens) (handLens.material as THREE.MeshStandardMaterial).emissiveIntensity = lensInt;
    const bodyLens = this.body.userData.lens as THREE.Mesh | undefined;
    if (bodyLens) (bodyLens.material as THREE.MeshStandardMaterial).emissiveIntensity = lensInt;

    if (this.cameraView === "third") this.syncThirdPerson(dt, bobY);
    else this.syncFirstPerson(dt, bobY, bobPitch);
  }

  syncFirstPerson(dt: number, bobY: number, bobPitch: number) {
    this.camera.position.x = this.sim.x;
    this.camera.position.z = this.sim.z;
    this.camera.position.y = this.camY + bobY - this.landDip;
    this.camera.rotation.y = this.sim.yaw;
    this.camera.rotation.x = this.sim.pitch + bobPitch;
    const wantRoll = this.input.r * -0.02;
    this.camRoll += (wantRoll - this.camRoll) * (1 - Math.exp(-8 * dt));
    this.camera.rotation.z = this.camRoll;
    const t = performance.now() / 1000;
    const idle = Math.sin(t * 1.15) * 0.006;
    const walk = this.sim.speed > 0.3 ? Math.sin(this.bob * 2) * (this.sim.speed > 8 ? 0.022 : 0.012) : 0;
    const aspect = Math.max(0.45, this.camera.aspect);
    const xHold = 0.1 + Math.min(0.16, Math.max(0, (aspect - 0.55) * 0.14));
    const yHold = aspect < 0.75 ? -0.26 : -0.3;
    this.tool.position.set(xHold, yHold + idle + walk - this.handReach * 0.04, -0.46 - this.handReach * 0.08);
    this.tool.rotation.set(-0.08 + this.handReach * 0.28, 0.14, 0.04 + Math.sin(this.bob) * 0.02);
    this.tool.scale.setScalar(aspect < 0.7 ? 0.82 : 1);
    this.body.visible = false;
    this.tool.visible = true;
  }

  syncThirdPerson(_dt: number, bobY: number) {
    this.tool.visible = false;
    this.body.visible = true;
    const ground = getHeight(this.sim.x, this.sim.z);
    this.body.position.set(this.sim.x, ground, this.sim.z);
    this.body.rotation.y = this.sim.yaw;
    const fx = -Math.sin(this.sim.yaw);
    const fz = -Math.cos(this.sim.yaw);
    const pitch = this.sim.pitch;
    const dist = 3.6 + Math.max(0, pitch) * 0.8;
    const height = 1.45 - pitch * 1.1;
    let cx = this.sim.x - fx * dist;
    let cy = ground + height;
    let cz = this.sim.z - fz * dist;
    const pulled = pullCam(this.sim.x, ground + 1.35, this.sim.z, cx, cy, cz, this.aabbs);
    this.camera.position.set(pulled.x, pulled.y, pulled.z);
    this.camera.lookAt(this.sim.x + fx * 0.4, this.camY + pitch * 0.4, this.sim.z + fz * 0.4);
    this.camera.rotation.z = 0;
  }

  syncWorld(t: number, dt: number) {
    tickWind(t);
    const lookId = this.sim.looking?.id ?? null;
    for (const g of this.itemGroups) {
      const id = g.userData.iid as ItemId;
      const taken = this.sim.found.has(id);
      g.visible = !taken;
      if (taken) continue;
      g.rotation.y = t * 0.9;
      const base = this.sim.interactables.find((i) => i.id === id);
      if (base) g.position.y = base.y + Math.sin(t * 2.1 + base.x) * 0.08;
      if (lookId !== this.lastLookId) {
        const look = lookId === id;
        g.traverse((ch) => {
          const m = ch as THREE.Mesh;
          if (m.isMesh && m.material && "emissiveIntensity" in (m.material as THREE.MeshStandardMaterial)) {
            (m.material as THREE.MeshStandardMaterial).emissiveIntensity = look ? 0.85 : 0.32;
          }
        });
      }
    }
    this.lastLookId = lookId;

    if (this.itemHalo) {
      const want = this.sim.looking && !this.sim.ended;
      if (want && this.sim.looking) {
        const g = this.itemGroups.find((it) => it.userData.iid === this.sim.looking!.id && it.visible);
        if (g) {
          this.itemHalo.position.copy(g.position);
          this.itemHalo.color.setHex(ITEM_GLOW[this.sim.looking.id]);
        }
        const target = this.timeOfDay === "night" ? 0.85 : 0.4;
        this.itemHalo.intensity += (target - this.itemHalo.intensity) * Math.min(1, dt * 6);
      } else {
        this.itemHalo.intensity += (0 - this.itemHalo.intensity) * Math.min(1, dt * 8);
      }
    }

    const progress = this.sim.started ? 1 - remainingOf(this.sim) / Math.max(1, this.sim.timeLimit) : 0;
    const sampledPreset = sampleSky(this.timeOfDay, progress);
    const preset = this.weatherMode === "rain"
      ? {
          ...sampledPreset,
          bg: 0x819091,
          fog: 0xa3b0ad,
          fogNear: 18,
          fogFar: Math.min(sampledPreset.fogFar, 92),
          hemiSky: 0xb8c1bd,
          sunColor: 0xd5dbd5,
          sunInt: sampledPreset.sunInt * 0.68,
          hemiInt: sampledPreset.hemiInt * 1.05,
          ambient: Math.max(0.34, sampledPreset.ambient * 0.95),
          exposure: Math.max(1.02, sampledPreset.exposure),
          zenith: 0x687b7e,
          horizon: 0xa2b0ae,
        }
      : sampledPreset;
    applyLighting(
      {
        sun: this.sun,
        fill: this.fill,
        hemi: this.hemi,
        ambient: this.ambient,
        fog: this.fog,
        renderer: this.renderer,
        sky: this.sky,
        celestial: this.celestial,
        glow: this.glow,
      },
      preset,
      this.sim.x,
      this.sim.z,
      this.timeOfDay === "night",
    );
    this.scene.background = this.fog.color;
    if (this.weatherMode === "rain") (this.glow.material as THREE.MeshBasicMaterial).opacity = 0.035;
    placeSun(this.sun, preset, this.sim.x, this.sim.z);

    this.sky.position.set(this.sim.x, 0, this.sim.z);
    if (this.stars) this.stars.position.set(this.sim.x, 0, this.sim.z);

    if (this.clouds) updateClouds(this.clouds, t, this.camera.position);
    if (this.rain.visible) updateRain(this.rain, this.camera.position, dt);
    if (this.dust) updateDust(this.dust, this.camera.position, dt, this.sim.indoor);

    for (const mesh of this.waterMeshes) {
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const wave = (mesh.userData.wave as number) ?? 0.05;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setY(i, Math.sin(t * 1.1 + x * 0.35 + z * 0.28) * wave + Math.sin(t * 0.7 + x * 0.12) * wave * 0.45);
      }
      pos.needsUpdate = true;
    }

    for (const door of this.doors) {
      const residence = door.userData.residence as { x: number; z: number; w: number; d: number; yaw: number; doorX: number; doorWidth: number } | undefined;
      if (!residence) continue;
      const dx = this.sim.x - residence.x;
      const dz = this.sim.z - residence.z;
      const localX = Math.cos(residence.yaw) * dx - Math.sin(residence.yaw) * dz;
      const localZ = Math.sin(residence.yaw) * dx + Math.cos(residence.yaw) * dz;
      const nearHouseDoor = Math.abs(localX - residence.doorX) < residence.doorWidth / 2 + 0.75 &&
        localZ > -residence.d / 2 - 1.35 && localZ < -residence.d / 2 + 1.3;
      const doorTarget = nearHouseDoor ? ((door.userData.openYaw as number | undefined) ?? -1.15) : 0;
      door.rotation.y += (doorTarget - door.rotation.y) * Math.min(1, dt * 3.2);
    }
    this.houseInteriorLights.forEach((light) => {
      const residence = light.userData.houseCenter as { x: number; z: number; w: number; d: number; yaw: number } | undefined;
      const dx = residence ? this.sim.x - residence.x : Infinity;
      const dz = residence ? this.sim.z - residence.z : Infinity;
      const localX = residence ? Math.cos(residence.yaw) * dx - Math.sin(residence.yaw) * dz : Infinity;
      const localZ = residence ? Math.sin(residence.yaw) * dx + Math.cos(residence.yaw) * dz : Infinity;
      const insideResidence = Boolean(residence && Math.abs(localX) < residence.w / 2 && Math.abs(localZ) < residence.d / 2);
      const interiorLit = this.timeOfDay === "night" || (this.sim.indoor && insideResidence);
      const nightIntensity = (light.userData.nightIntensity as number | undefined) ?? 38;
      light.intensity = interiorLit ? (this.timeOfDay === "night" ? nightIntensity : 34) : 0;
      light.distance = 19;
    });

    const remain = remainingOf(this.sim);
    const isNight = this.timeOfDay === "night";
    const isRain = this.weatherMode === "rain";
    const exteriorFactor = isNight ? 1 : isRain ? 0.58 : this.timeOfDay === "sunset" ? 0.76 : 0.34;
    this.houseExteriorLights.forEach((light) => {
      light.intensity = 10.5 * exteriorFactor;
    });
    this.houseBulbs.forEach((material) => {
      material.emissiveIntensity = isNight ? 1.75 : isRain ? 0.9 : this.timeOfDay === "sunset" ? 1.2 : 0.58;
    });
    this.houseWindows.forEach((material) => {
      material.emissiveIntensity = isNight ? 0.95 : isRain ? 0.46 : this.timeOfDay === "sunset" ? 0.56 : 0.2;
    });
    const indoorLightsOn = isNight || (this.sim.indoor && this.timeOfDay !== "day");
    this.houseInteriorBulbs.forEach((material) => {
      material.emissiveIntensity = indoorLightsOn ? 1.8 : this.sim.indoor ? 1.55 : 0.35;
    });
    this.lampLights.forEach((light) => {
      light.intensity = isNight ? 9.5 : isRain ? 3.8 : this.timeOfDay === "sunset" ? 5 : 0.8;
    });
    this.lampBulbs.forEach((material) => {
      material.emissiveIntensity = isNight ? 1.8 : isRain ? 1 : this.timeOfDay === "sunset" ? 1.4 : 0.42;
    });
    const band = remain < 20 ? 0 : remain < 60 ? 1 : 2;
    if (this.sim.started && band < this.lastRemainBand && band <= 1) {
      this.audio.tickLow();
      this.lastRemainBand = band;
    }
  }

  bind() {
    const down = (e: KeyboardEvent) => {
      if (isTextEntry(e.target)) return;
      this.keys.add(e.code);
      if (GAME_CODES.has(e.code) && this.shouldCaptureKeys() && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
      }
      if (e.repeat) return;
      if (e.code === "KeyE") this.input.interact = true;
      if (e.code === "KeyF") this.sim.light = !this.sim.light;
    };
    const up = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const move = (e: MouseEvent) => {
      if (!this.pointerLocked) return;
      this.input.lookX += e.movementX;
      this.input.lookY += e.movementY;
    };
    let lookId: number | null = null;
    let lastTx = 0;
    let lastTy = 0;
    const tStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX > this.canvas.clientWidth * 0.42) {
          lookId = t.identifier;
          lastTx = t.clientX;
          lastTy = t.clientY;
        }
      }
    };
    const tMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === lookId) {
          this.touchLook.x += (t.clientX - lastTx) * 1.6;
          this.touchLook.y += (t.clientY - lastTy) * 1.6;
          lastTx = t.clientX;
          lastTy = t.clientY;
        }
      }
    };
    const tEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === lookId) lookId = null;
      }
    };
    const blur = () => this.clearMoveInput();
    const opts = { capture: true } as const;
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
    const p = this.canvas.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions);
    if (p && typeof (p as Promise<void>).then === "function") {
      (p as Promise<void>).catch(() => this.canvas.requestPointerLock());
    }
  }

  pause(v: boolean) {
    this.paused = v;
    this.audio.setPaused(v);
    if (v) {
      this.clearMoveInput();
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      this.focusPlay();
    }
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
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer.dispose();
    resetStructureMaterials();
    window.__controlsTest = undefined;
    window.__haven = undefined;
  }
}

function timeForWeather(mode: WeatherMode, levelTime: TimeOfDay): TimeOfDay {
  if (mode === "auto") return levelTime;
  if (mode === "sunny" || mode === "rain") return "day";
  return mode;
}

function pullCam(px: number, py: number, pz: number, cx: number, cy: number, cz: number, aabbs: Aabb[]) {
  const dx = cx - px;
  const dy = cy - py;
  const dz = cz - pz;
  let tHit = 1;
  for (const b of aabbs) {
    const t = rayAabb(px, py, pz, dx, dy, dz, b.minX, b.maxX, b.minY, b.maxY, b.minZ, b.maxZ);
    if (t != null && t > 0.04 && t < tHit) tHit = t;
  }
  const t = Math.max(0.42, tHit - 0.22);
  return { x: px + dx * t, y: py + dy * t, z: pz + dz * t };
}

function rayAabb(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
) {
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

function makeSignTexture(label: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6a5344";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#e8e0d0";
  ctx.font = "600 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
