import type { ItemId, TimeOfDay, ZoneDef } from "./types.ts";

export const ZONES: ZoneDef[] = [
  {
    id: "central",
    name: "Liwasan",
    tagalog: "Liwasan",
    blurb: "The courtyard. Fountain, jeepney, the old heart of the grounds.",
    x: 0,
    z: 0,
    radius: 32,
    color: "#9fb8a6",
  },
  {
    id: "research",
    name: "Greenhouse",
    tagalog: "Hardin ng Salamin",
    blurb: "Glass and soil. Lola used to catalogue the orchids here.",
    x: 8,
    z: -82,
    radius: 28,
    color: "#7a9e7e",
  },
  {
    id: "forest",
    name: "Kakahuyan",
    tagalog: "Kakahuyan",
    blurb: "A canopy over the service path. Watch the roots.",
    x: 86,
    z: 6,
    radius: 34,
    color: "#5f8a62",
  },
  {
    id: "maintenance",
    name: "Talyer",
    tagalog: "Talyer",
    blurb: "Warm timber, leftover tools, the smell of oil.",
    x: 18,
    z: 74,
    radius: 24,
    color: "#8a7a58",
  },
  {
    id: "flooded",
    name: "Linaw",
    tagalog: "Poso't Palayan",
    blurb: "Still water and a weathered dock.",
    x: -72,
    z: 58,
    radius: 30,
    color: "#4f7f8a",
  },
  {
    id: "energy",
    name: "Gilingan",
    tagalog: "Gilingan ng Ilaw",
    blurb: "The mill that used to keep the paths lit.",
    x: -88,
    z: -12,
    radius: 28,
    color: "#a09068",
  },
  {
    id: "mountain",
    name: "Burol",
    tagalog: "Hardin sa Burol",
    blurb: "Wind, thyme, a view of everything.",
    x: 74,
    z: -74,
    radius: 32,
    color: "#b8c4b0",
  },
  {
    id: "shelter",
    name: "Pahingahan",
    tagalog: "Pahingahan",
    blurb: "A dome for sitting out a shower.",
    x: 78,
    z: 72,
    radius: 24,
    color: "#8aa99a",
  },
  {
    id: "restricted",
    name: "Hardin na Bakod",
    tagalog: "Hardin na Nakapinid",
    blurb: "Hedges and a gate that no longer locks.",
    x: -52,
    z: -88,
    radius: 26,
    color: "#6a8a6e",
  },
  {
    id: "extraction",
    name: "Tanawan",
    tagalog: "Tanawan",
    blurb: "The northern pad. Best sunset on the grounds.",
    x: 0,
    z: -126,
    radius: 20,
    color: "#9fb8a6",
  },
];

export const ITEM_INFO: Record<ItemId, { name: string; blurb: string; hint: string }> = {
  old_key: { name: "Old Key", blurb: "Warm brass, teeth worn smooth. Susi ni Lolo.", hint: "Pick up Old Key" },
  camera: { name: "Camera", blurb: "A compact film camera, still loaded.", hint: "Pick up Camera" },
  notebook: { name: "Notebook", blurb: "Pressed flowers between the pages.", hint: "Pick up Notebook" },
  battery: { name: "Battery", blurb: "Still has a little charge. For the lamp.", hint: "Pick up Battery" },
  backpack: { name: "Backpack", blurb: "Canvas, sun-faded, a trail of dust.", hint: "Pick up Backpack" },
  tsinelas: { name: "Tsinelas", blurb: "One pair, still warm from the porch.", hint: "Pick up Tsinelas" },
  payong: { name: "Payong", blurb: "Folded umbrella. Always raining somewhere.", hint: "Pick up Payong" },
  liham: { name: "Liham", blurb: "A letter, never sent. Don't open it.", hint: "Pick up Letter" },
  radio: { name: "Radio", blurb: "AM crackle. Someone left the volume low.", hint: "Pick up Radio" },
  lantern: { name: "Lantern", blurb: "Kerosene lamp. Glass still clear.", hint: "Pick up Lantern" },
  salamin: { name: "Salamin", blurb: "Reading glasses, slightly bent.", hint: "Pick up Glasses" },
  baon: { name: "Baon", blurb: "A tin lunchbox. Empty, thankfully.", hint: "Pick up Lunchbox" },
  abaniko: { name: "Abaniko", blurb: "A folding fan. Still smells like sampaguita.", hint: "Pick up Fan" },
  rosaryo: { name: "Rosaryo", blurb: "Wooden beads, a little worn.", hint: "Pick up Rosary" },
  tabo: { name: "Tabo", blurb: "Plastic dipper. Classic.", hint: "Pick up Tabo" },
  compass: { name: "Compass", blurb: "The needle still finds north.", hint: "Pick up Compass" },
  sombrero: { name: "Sombrero", blurb: "A wide hat for the hill garden.", hint: "Pick up Hat" },
  flashlight: { name: "Flashlight", blurb: "Heavy metal torch. Batteries sold separately.", hint: "Pick up Flashlight" },
};

export const TIME_PRESETS: Record<TimeOfDay, { label: string; line: string }> = {
  day: { label: "Araw", line: "Clear light. Easy walking." },
  sunset: { label: "Takipsilim", line: "Warm sky. Paths glow." },
  night: { label: "Gabi", line: "Bring the lamp. Follow the lights." },
};

export function zoneAt(x: number, z: number): ZoneDef {
  let best = ZONES[0];
  let bestD = Infinity;
  for (const zdef of ZONES) {
    const d = Math.hypot(x - zdef.x, z - zdef.z);
    if (d < zdef.radius * 1.15 && d < bestD) {
      best = zdef;
      bestD = d;
    }
  }
  if (bestD === Infinity) {
    for (const zdef of ZONES) {
      const d = Math.hypot(x - zdef.x, z - zdef.z);
      if (d < bestD) {
        best = zdef;
        bestD = d;
      }
    }
  }
  return best;
}

export const SPAWN = { x: 2, z: 8 };

export const TOTAL_LEVELS = 10;
