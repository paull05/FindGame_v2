import { create } from "zustand";
import { levelById, LEVELS } from "./levels.ts";
import { emptySave, loadSave, writeSave, type SaveData } from "./persist.ts";
import type { Flow, Overlay, Settings, TimeOfDay, HudSnapshot } from "./types.ts";
import type { Sim } from "./sim.ts";
import { sanitizeUsername, starsFromRatio } from "@/lib/utils";

export type GameUi = {
  save: SaveData;
  flow: Flow;
  overlay: Overlay;
  levelId: number;
  timeOfDay: TimeOfDay;
  hud: HudSnapshot | null;
  sim: Sim | null;
  locked: boolean;
  dialogue: string;
  trackName: string;
  hydrated: boolean;
  setHud: (h: HudSnapshot, sim: Sim) => void;
  setOverlay: (o: Overlay) => void;
  setFlow: (f: Flow) => void;
  setLevel: (id: number) => void;
  setLocked: (v: boolean) => void;
  setDialogue: (t: string) => void;
  setTrackName: (t: string) => void;
  hydrate: () => void;
  login: (name: string) => void;
  markTutorialSeen: () => void;
  updateSettings: (partial: Partial<Settings>) => void;
  recordWin: (levelId: number, remaining: number, limit: number, items: number) => void;
  resetUi: () => void;
};

const boot = emptySave();

export const useGameUi = create<GameUi>((set, get) => ({
  save: boot,
  flow: "title",
  overlay: "none",
  levelId: 1,
  timeOfDay: "sunset",
  hud: null,
  sim: null,
  locked: false,
  dialogue: "",
  trackName: "Lazy Afternoon Tambayan",
  hydrated: false,
  setHud: (hud, sim) => set({ hud, sim, dialogue: hud.dialogue, trackName: hud.trackName }),
  setOverlay: (overlay) => set({ overlay }),
  setFlow: (flow) => set({ flow }),
  setLevel: (id) => {
    const level = levelById(id);
    const save = { ...get().save, lastLevel: level.id, tutorialSeen: true };
    writeSave(save);
    set({
      save,
      levelId: level.id,
      timeOfDay: level.timeOfDay,
      overlay: "briefing",
      flow: "game",
      locked: false,
      hud: null,
    });
  },
  setLocked: (locked) => set({ locked }),
  setDialogue: (dialogue) => set({ dialogue }),
  setTrackName: (trackName) => set({ trackName }),
  hydrate: () => {
    if (get().hydrated) return;
    const save = loadSave();
    set({
      save,
      flow: "title",
      levelId: 1,
      hydrated: true,
    });
    document.documentElement.style.fontSize = `${Math.round(16 * save.settings.textScale)}px`;
  },
  login: (name) => {
    const username = sanitizeUsername(name);
    const save = { ...get().save, username };
    writeSave(save);
    set({ save, flow: "menu" });
  },
  markTutorialSeen: () => {
    const save = { ...get().save, tutorialSeen: true };
    writeSave(save);
    set({ save });
  },
  updateSettings: (partial) => {
    const settings = { ...get().save.settings, ...partial };
    const save = { ...get().save, settings };
    writeSave(save);
    set({ save });
    if (partial.textScale) {
      document.documentElement.style.fontSize = `${Math.round(16 * settings.textScale)}px`;
    }
  },
  recordWin: (levelId, remaining, limit, items) => {
    const used = Math.max(1, Math.round(limit - remaining));
    const stars = starsFromRatio(remaining, limit);
    const prev = get().save;
    const prevBest = prev.bestTime[String(levelId)];
    const bestTime = { ...prev.bestTime };
    if (!prevBest || used < prevBest) bestTime[String(levelId)] = used;
    const prevStars = prev.stars[String(levelId)] ?? 0;
    const starMap = { ...prev.stars, [String(levelId)]: Math.max(prevStars, stars) };
    const completed = prev.completed.includes(levelId) ? prev.completed : [...prev.completed, levelId];
    const save: SaveData = {
      ...prev,
      completed,
      bestTime,
      stars: starMap,
      itemsFound: prev.itemsFound + items,
      lastLevel: Math.min(LEVELS.length, levelId + 1),
    };
    writeSave(save);
    set({ save });
  },
  resetUi: () =>
    set({
      overlay: "briefing",
      locked: false,
      sim: null,
      hud: null,
      dialogue: "",
    }),
}));
