import { ITEM_INFO } from "./catalog.ts";
import type { ItemId, LevelDef, LostItemDef } from "./types.ts";

function item(id: ItemId, zone: string, x: number, z: number): LostItemDef {
  const info = ITEM_INFO[id];
  return { id, name: info.name, blurb: info.blurb, zone, x, z, hint: info.hint };
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    slug: "hapon",
    title: "The Lost Afternoon",
    tagalog: "Hapon sa Bakuran",
    blurb: "Find four things left in the courtyard.",
    timeOfDay: "day",
    timeLimit: 240,
    spawn: { x: 2, z: 8, yaw: 0.2 },
    items: [
      item("tsinelas", "central", 10.2, 6.1),
      item("old_key", "central", 3.4, 14.6),
      item("notebook", "central", -12.1, 4.2),
      item("payong", "central", 8.4, -10.2),
    ],
  },
  {
    id: 2,
    slug: "bahay",
    title: "The Old House",
    tagalog: "Ang Lumang Bahay",
    blurb: "The ancestral house is open. Look on the porch, then wander the yard.",
    timeOfDay: "day",
    timeLimit: 280,
    spawn: { x: 2, z: 8, yaw: 0 },
    items: [
      item("rosaryo", "central", 1.2, 19.4),
      item("salamin", "central", -4.6, 16.8),
      item("liham", "central", 14.8, 8.4),
      item("abaniko", "central", -16.4, 7.2),
      item("baon", "maintenance", 16.2, 68.4),
    ],
  },
  {
    id: 3,
    slug: "gubat",
    title: "The Quiet Grove",
    tagalog: "Tahimik na Gubat",
    blurb: "The service path leads into the trees. Five things, a little farther.",
    timeOfDay: "day",
    timeLimit: 300,
    spawn: { x: 2, z: 8, yaw: -1.2 },
    items: [
      item("camera", "forest", 98, 16),
      item("backpack", "forest", 82.4, 8.6),
      item("sombrero", "forest", 90.2, 4.4),
      item("compass", "shelter", 84.2, 68.4),
      item("battery", "maintenance", 24.6, 78.2),
    ],
  },
  {
    id: 4,
    slug: "hardin",
    title: "The Walled Garden",
    tagalog: "Hardin na Nakapinid",
    blurb: "The light is turning. The locked garden isn't locked anymore.",
    timeOfDay: "sunset",
    timeLimit: 300,
    spawn: { x: 2, z: 8, yaw: 2.4 },
    items: [
      item("notebook", "research", 18, -74),
      item("abaniko", "restricted", -48.4, -84.2),
      item("liham", "restricted", -54.6, -94.4),
      item("payong", "research", 4.2, -78.6),
      item("old_key", "restricted", -40.8, -80.2),
    ],
  },
  {
    id: 5,
    slug: "ilaw",
    title: "Lamp Light",
    tagalog: "Mga Ilaw sa Daan",
    blurb: "Follow the lamps. Six belongings along the paths as the sky goes warm.",
    timeOfDay: "sunset",
    timeLimit: 270,
    spawn: { x: 2, z: 8, yaw: 0.4 },
    items: [
      item("lantern", "energy", -86.4, -8.2),
      item("flashlight", "energy", -92.2, -16.4),
      item("battery", "central", -10.2, -6.4),
      item("radio", "energy", -78.6, -20.2),
      item("tsinelas", "flooded", -60.4, 50.2),
      item("tabo", "flooded", -68.2, 52.6),
    ],
  },
  {
    id: 6,
    slug: "tubig",
    title: "The Lily Pond",
    tagalog: "Sa Gilid ng Tubig",
    blurb: "Dock, mill, and the long way around the water.",
    timeOfDay: "day",
    timeLimit: 300,
    spawn: { x: -40, z: 30, yaw: 2.2 },
    items: [
      item("backpack", "flooded", -58, 44),
      item("baon", "flooded", -62.4, 56.2),
      item("radio", "energy", -90, -10.4),
      item("camera", "central", 10.4, 6.2),
      item("compass", "maintenance", 14.2, 72.4),
      item("sombrero", "shelter", 88.2, 70.4),
    ],
  },
  {
    id: 7,
    slug: "burol",
    title: "Hill Garden",
    tagalog: "Hardin sa Burol",
    blurb: "Up the hill before the light goes. Watch your step.",
    timeOfDay: "sunset",
    timeLimit: 320,
    spawn: { x: 8, z: -40, yaw: -0.6 },
    items: [
      item("compass", "mountain", 62, -58),
      item("sombrero", "mountain", 68.4, -70.2),
      item("lantern", "mountain", 80.2, -78.6),
      item("notebook", "research", 14.4, -88.2),
      item("salamin", "extraction", -6.4, -122.2),
      item("liham", "extraction", 4.2, -128.4),
    ],
  },
  {
    id: 8,
    slug: "gabi",
    title: "Night Walk",
    tagalog: "Lakad sa Gabi",
    blurb: "First real night. Keep the lamp on. The grounds look different in the dark.",
    timeOfDay: "night",
    timeLimit: 360,
    spawn: { x: 2, z: 8, yaw: 0.15 },
    items: [
      item("flashlight", "central", 16.4, 12.2),
      item("lantern", "shelter", 78.6, 74.2),
      item("battery", "forest", 88.4, 2.2),
      item("old_key", "restricted", -52.2, -90.4),
      item("radio", "energy", -84.2, -14.6),
      item("camera", "extraction", 0.4, -124.2),
      item("backpack", "flooded", -70.4, 48.6),
    ],
  },
  {
    id: 9,
    slug: "buong",
    title: "The Whole Grounds",
    tagalog: "Buong Bakuran",
    blurb: "Seven things, every corner. The map helps. The lamp still helps more.",
    timeOfDay: "sunset",
    timeLimit: 330,
    spawn: { x: 2, z: 8, yaw: 0 },
    items: [
      item("tsinelas", "central", -12.4, 4.6),
      item("payong", "research", 0.6, -80.4),
      item("baon", "maintenance", 26.2, 80.4),
      item("tabo", "flooded", -62, 56),
      item("rosaryo", "restricted", -62.4, -96.2),
      item("compass", "mountain", 74.2, -74.4),
      item("camera", "forest", 96.4, 10.2),
    ],
  },
  {
    id: 10,
    slug: "huli",
    title: "The Final Search",
    tagalog: "Huling Hanap",
    blurb: "Night again. Eight belongings. This is the last walk — take your time, just not too much.",
    timeOfDay: "night",
    timeLimit: 360,
    spawn: { x: 2, z: 8, yaw: 0.15 },
    items: [
      item("old_key", "shelter", 88, 78),
      item("camera", "forest", 98, 16),
      item("notebook", "research", 18, -74),
      item("compass", "mountain", 62, -58),
      item("backpack", "flooded", -58, 44),
      item("flashlight", "energy", -96.2, -18.4),
      item("liham", "extraction", 0.2, -126.4),
      item("rosaryo", "central", 0.6, 19.8),
    ],
  },
];

export const LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.id, l])) as Record<number, LevelDef>;

export function levelById(id: number): LevelDef {
  return LEVEL_MAP[id] ?? LEVELS[0];
}

export function isUnlocked(id: number, completed: number[]): boolean {
  if (id <= 1) return true;
  return completed.includes(id - 1);
}
