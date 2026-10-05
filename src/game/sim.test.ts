import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEVELS } from "./levels.ts";
import { beginWalk, collectItem, createSim, remainingOf, stepSim } from "./sim.ts";
import { generateBuildings, getHeight, houseWallAabbs, indoorAt, itemsFarFromSpawn, resolveCollision } from "./world.ts";
import { sanitizeUsername, starsFromRatio } from "../lib/utils.ts";
import { isUnlocked } from "./levels.ts";
import { HavenAudio } from "./audio.ts";
import type { InputState } from "./types.ts";
import { emptySave, loadSave, SAVE_KEY } from "./persist.ts";

const idle: InputState = {
  f: 0,
  r: 0,
  jump: false,
  sprint: false,
  crouch: false,
  lookX: 0,
  lookY: 0,
  interact: false,
};

describe("bakuran hunt", () => {
  it("does not populate standalone tower-box placeholders", () => {
    assert.equal(generateBuildings().some((building) => building.kind === "tower"), false);
  });

  it("keeps ten levels with growing item counts", () => {
    assert.equal(LEVELS.length, 10);
    assert.ok(LEVELS[0].items.length >= 4);
    assert.ok(LEVELS[9].items.length >= 7);
    assert.equal(LEVELS[7].timeOfDay, "night");
    assert.equal(LEVELS[9].timeOfDay, "night");
  });

  it("places items a walk away from spawn", () => {
    for (const level of LEVELS) {
      const min = level.id <= 2 ? 6 : 10;
      assert.equal(itemsFarFromSpawn(level, min), true, `level ${level.id}`);
    }
  });

  it("does not tick the clock until the walk begins", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    for (let i = 0; i < 60; i++) stepSim(sim, idle, 1 / 60);
    assert.equal(sim.started, false);
    assert.equal(remainingOf(sim), LEVELS[0].timeLimit);
  });

  it("wins when every item on the level is found", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    for (const it of LEVELS[0].items) collectItem(sim, it.id);
    assert.equal(sim.found.size, LEVELS[0].items.length);
    assert.equal(sim.ended?.status, "win");
  });

  it("will not collect the same item twice", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    const id = LEVELS[0].items[0].id;
    assert.equal(collectItem(sim, id), true);
    assert.equal(collectItem(sim, id), false);
    assert.equal(sim.found.size, 1);
  });

  it("fails at zero without going negative", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    sim.t = sim.timeLimit - 0.02;
    stepSim(sim, idle, 0.05);
    assert.equal(sim.ended?.status, "lose");
    assert.equal(remainingOf(sim), 0);
    stepSim(sim, idle, 1);
    assert.equal(remainingOf(sim), 0);
  });

  it("strafes with A to the left when facing -Z", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    sim.yaw = 0;
    const input: InputState = { ...idle, r: -1 };
    const x0 = sim.x;
    for (let i = 0; i < 30; i++) stepSim(sim, input, 1 / 60);
    assert.ok(sim.x < x0 - 0.4, `A should move toward -X, got ${sim.x - x0}`);
  });

  it("unlocks the next level only after completing the previous", () => {
    assert.equal(isUnlocked(1, []), true);
    assert.equal(isUnlocked(2, []), false);
    assert.equal(isUnlocked(2, [1]), true);
    assert.equal(isUnlocked(10, [1, 2, 3, 4, 5, 6, 7, 8, 9]), true);
  });

  it("sanitizes usernames", () => {
    assert.equal(sanitizeUsername("Juan"), "Juan");
    assert.equal(sanitizeUsername("<script>x</script>"), "x");
    assert.equal(sanitizeUsername("gago"), "Kaibigan");
    assert.equal(sanitizeUsername(""), "Kaibigan");
  });

  it("inspects environmental clues without collecting items", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    sim.x = 17.4;
    sim.z = -1.0;
    sim.yaw = 0;
    const input: InputState = { ...idle, interact: true };
    stepSim(sim, input, 1 / 60);
    assert.equal(sim.found.size, 0);
    assert.equal(sim.inspected.has("clue_jeep"), true);
    assert.ok(sim.notify.length > 8);
  });

  it("uses wood footsteps inside the house and dirt on paths", () => {
    const sim = createSim(LEVELS[0], [], "Juan", false);
    beginWalk(sim);
    sim.x = 0;
    sim.z = 18;
    stepSim(sim, { ...idle }, 1 / 60);
    assert.equal(sim.indoor, true);
    assert.equal(sim.surface, "wood");
  });

  it("opens residential doorways while keeping the rest of each wall solid", () => {
    const residences = generateBuildings().filter((building) => building.kind === "house" || building.kind === "kubo");
    const walls = houseWallAabbs();
    for (const building of residences) {
      const yaw = building.yaw ?? 0;
      const doorX = building.kind === "kubo" ? building.w * 0.18 : 0;
      const frontZ = -building.d / 2 + 0.6;
      const insideX = building.x + Math.cos(yaw) * doorX + Math.sin(yaw) * frontZ;
      const insideZ = building.z - Math.sin(yaw) * doorX + Math.cos(yaw) * frontZ;
      const y = (building.y ?? getHeight(building.x, building.z)) + 1.2;
      const throughDoor = resolveCollision(insideX, insideZ, y, walls);
      assert.ok(Math.hypot(throughDoor.x - insideX, throughDoor.z - insideZ) < 0.01, `${building.id} doorway should be open`);
      assert.equal(indoorAt(insideX, insideZ), true, `${building.id} interior should be recognized`);

      const wallX = building.x + Math.cos(yaw) * (-building.w / 2 + 0.1);
      const wallZ = building.z - Math.sin(yaw) * (-building.w / 2 + 0.1);
      const againstWall = resolveCollision(wallX, wallZ, y, walls);
      assert.ok(Math.hypot(againstWall.x - wallX, againstWall.z - wallZ) > 0.1, `${building.id} wall should block entry`);
    }
  });

  it("rates completion by remaining time", () => {
    assert.equal(starsFromRatio(200, 240), 5);
    assert.equal(starsFromRatio(10, 240), 1);
  });

  it("cycles through the available music tracks", () => {
    const audio = new HavenAudio();
    assert.equal(audio.track.name, "Lazy Afternoon Tambayan");
    audio.next();
    assert.equal(audio.track.name, "Paper Lanterns");
    audio.next();
    assert.equal(audio.track.name, "Lazy Afternoon Tambayan");
    audio.prev();
    assert.equal(audio.track.name, "Paper Lanterns");
  });

  it("tracks whether the quick tutorial has been seen", () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      configurable: true,
    });

    const fresh = emptySave();
    assert.equal(fresh.tutorialSeen, false);
    const saved = { ...fresh, tutorialSeen: true };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    const reloaded = loadSave();
    assert.equal(reloaded.tutorialSeen, true);
    localStorage.removeItem(SAVE_KEY);
  });
});

