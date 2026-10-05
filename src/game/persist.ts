import { sanitizeUsername } from "@/lib/utils";
import type { Settings } from "./types.ts";

export const SAVE_KEY = "bakuran-save-v1";
export const SAVE_VERSION = 1;

export const defaultSettings = (): Settings => ({
  master: 0.85,
  music: 0.55,
  sfx: 0.7,
  ambience: 0.22,
  quality: "medium",
  minimap: true,
  dialogue: true,
  textScale: 1,
  cameraView: "first",
  weather: "auto",
});

export type SaveData = {
  version: number;
  username: string;
  completed: number[];
  bestTime: Record<string, number>;
  stars: Record<string, number>;
  itemsFound: number;
  lastLevel: number;
  tutorialSeen: boolean;
  settings: Settings;
};

export const emptySave = (): SaveData => ({
  version: SAVE_VERSION,
  username: "",
  completed: [],
  bestTime: {},
  stars: {},
  itemsFound: 0,
  lastLevel: 1,
  tutorialSeen: false,
  settings: defaultSettings(),
});

function migrate(raw: SaveData): SaveData {
  const base = emptySave();
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    username: sanitizeUsername(raw.username || ""),
    completed: Array.isArray(raw.completed) ? raw.completed.filter((n) => n >= 1 && n <= 10) : [],
    bestTime: raw.bestTime && typeof raw.bestTime === "object" ? raw.bestTime : {},
    stars: raw.stars && typeof raw.stars === "object" ? raw.stars : {},
    itemsFound: Number(raw.itemsFound) || 0,
    lastLevel: Math.min(10, Math.max(1, Number(raw.lastLevel) || 1)),
    tutorialSeen: Boolean(raw.tutorialSeen),
    settings: { ...base.settings, ...(raw.settings ?? {}) },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    /* private mode / quota */
  }
}
