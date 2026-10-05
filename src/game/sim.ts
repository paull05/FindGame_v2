import { ITEM_INFO, zoneAt } from "./catalog.ts";
import { lineFor } from "./dialogue.ts";
import type { Clue, LevelDef, SurfaceKind } from "./types.ts";
import type { HudSnapshot, InputState, Interactable, ItemId, TimeOfDay } from "./types.ts";
import {
  generateClues,
  generateInteractables,
  getHeight,
  indoorAt,
  resolveCollision,
  surfaceAt,
  type Aabb,
} from "./world.ts";

export type Sim = {
  t: number;
  timeLimit: number;
  started: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  vy: number;
  onGround: boolean;
  speed: number;
  found: Set<ItemId>;
  discovered: Set<string>;
  looking: Interactable | null;
  lookingClue: Clue | null;
  interactables: Interactable[];
  clues: Clue[];
  inspected: Set<string>;
  aabbs: Aabb[];
  ended: null | { status: "win" | "lose"; reason: string };
  light: boolean;
  timeOfDay: TimeOfDay;
  notify: string;
  notifyT: number;
  lastFound: ItemId | null;
  lastFoundT: number;
  distance: number;
  level: LevelDef;
  dialogue: string;
  dialogueT: number;
  lastItemT: number;
  lastWanderT: number;
  playerName: string;
  speak: boolean;
  lastZone: string;
  lowChimed: boolean;
  urgentChimed: boolean;
  nightChimed: boolean;
  indoor: boolean;
  surface: SurfaceKind;
  doorOpen: boolean;
};

const SENS = 0.0022;

export function remainingOf(sim: Sim): number {
  if (!sim.started) return sim.timeLimit;
  return Math.max(0, sim.timeLimit - sim.t);
}

export function createSim(level: LevelDef, aabbs: Aabb[], playerName: string, speak: boolean): Sim {
  const spawn = level.spawn;
  return {
    t: 0,
    timeLimit: level.timeLimit,
    started: false,
    x: spawn.x,
    y: getHeight(spawn.x, spawn.z) + 1.68,
    z: spawn.z,
    yaw: spawn.yaw ?? 0.15,
    pitch: -0.06,
    vy: 0,
    onGround: true,
    speed: 0,
    found: new Set(),
    discovered: new Set(["central"]),
    looking: null,
    lookingClue: null,
    interactables: generateInteractables(level),
    clues: generateClues(),
    inspected: new Set(),
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
    doorOpen: false,
  };
}

function say(sim: Sim, trigger: Parameters<typeof lineFor>[0], extra?: { itemName?: string; zoneName?: string }) {
  if (!sim.speak) return;
  sim.dialogue = lineFor(trigger, {
    name: sim.playerName,
    itemName: extra?.itemName,
    zoneName: extra?.zoneName,
  });
  sim.dialogueT = sim.t;
}

function facingDot(sim: Sim, x: number, z: number) {
  const fx = -Math.sin(sim.yaw);
  const fz = -Math.cos(sim.yaw);
  const dx = x - sim.x;
  const dz = z - sim.z;
  const len = Math.hypot(dx, dz) || 1;
  return (fx * dx + fz * dz) / len;
}

function findLook(sim: Sim): Interactable | null {
  const current = sim.looking && !sim.found.has(sim.looking.id) ? sim.looking : null;
  let best: Interactable | null = current;
  let bestScore = current ? 0.22 : 0.55;
  for (const it of sim.interactables) {
    if (sim.found.has(it.id)) continue;
    const d = Math.hypot(it.x - sim.x, it.z - sim.z);
    const held = it === current;
    if (d > (held ? 3.9 : 3.2)) continue;
    const dot = facingDot(sim, it.x, it.z);
    if (dot < (held ? 0.22 : 0.45)) continue;
    const score = dot - d * 0.08 + (held ? 0.2 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}

function findClue(sim: Sim): Clue | null {
  const current = sim.lookingClue;
  let best: Clue | null = current;
  let bestScore = current ? 0.2 : 0.5;
  for (const c of sim.clues) {
    const d = Math.hypot(c.x - sim.x, c.z - sim.z);
    const held = c === current;
    if (d > (held ? 4.0 : 3.4)) continue;
    const dot = facingDot(sim, c.x, c.z);
    if (dot < (held ? 0.2 : 0.4)) continue;
    const score = dot - d * 0.1 + (held ? 0.18 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export function collectItem(sim: Sim, id: ItemId) {
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
    sim.ended = { status: "win", reason: "complete" };
    say(sim, "win");
  }
  return true;
}

function inspectClue(sim: Sim, clue: Clue) {
  sim.notify = clue.line;
  sim.notifyT = sim.t;
  sim.dialogue = clue.line;
  sim.dialogueT = sim.t;
  sim.inspected.add(clue.id);
  if (clue.id === "clue_house") sim.doorOpen = true;
}

export function beginWalk(sim: Sim) {
  sim.started = true;
  sim.t = 0;
  sim.notify = `${sim.level.items.length} belongings. Walk the grounds.`;
  sim.notifyT = 0;
  say(sim, "start");
  if (sim.timeOfDay === "night") {
    sim.nightChimed = true;
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (sim.started && !sim.ended) say(sim, "night");
      }, 1600);
    }
  }
}

export function stepSim(sim: Sim, input: InputState, dt: number) {
  if (sim.ended) return;
  const d = Math.min(dt, 0.1);

  sim.yaw -= input.lookX * SENS;
  sim.pitch -= input.lookY * SENS;
  const lim = Math.PI / 2 - 0.02;
  if (sim.pitch > lim) sim.pitch = lim;
  if (sim.pitch < -lim) sim.pitch = lim * -1;
  input.lookX = 0;
  input.lookY = 0;

  if (!sim.started) {
    sim.yaw += d * 0.08;
    sim.looking = null;
    sim.lookingClue = null;
    return;
  }

  sim.t += d;

  const fx = -Math.sin(sim.yaw);
  const fz = -Math.cos(sim.yaw);
  const rx = Math.cos(sim.yaw);
  const rz = -Math.sin(sim.yaw);

  const speedMul = input.crouch ? 0.48 : input.sprint && input.f > 0 ? 1.72 : 1;
  const base = 6.1 * speedMul;
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
  } else if (zdef.id !== sim.lastZone && sim.t - sim.dialogueT > 10) {
    sim.lastZone = zdef.id;
  }
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
    sim.ended = { status: "lose", reason: "time" };
    say(sim, "lose");
  }
}

export function hudOf(sim: Sim, trackName = ""): HudSnapshot {
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
    lastFoundName: last ? (sim.level.items.find((i) => i.id === last)?.name ?? ITEM_INFO[last].name) : "",
    light: sim.light,
    started: sim.started,
    ended: sim.ended ? { status: sim.ended.status } : null,
    lookingId: sim.looking?.id ?? sim.lookingClue?.id ?? null,
    levelId: sim.level.id,
    levelTitle: sim.level.tagalog,
    dialogue: sim.dialogue,
    trackName,
  };
}
