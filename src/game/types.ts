export type TimeOfDay = "day" | "sunset" | "night";
export type WeatherMode = "auto" | "sunny" | "sunset" | "night" | "rain";

export type SurfaceKind = "grass" | "dirt" | "stone" | "wood" | "water";

export type Flow =
  | "title"
  | "login"
  | "menu"
  | "profile"
  | "levels"
  | "settings"
  | "game";

export type Overlay = "briefing" | "none" | "map" | "pause" | "win" | "lose" | "settings";

export type CameraView = "first" | "third";

export type Quality = "low" | "medium" | "high";

export type ItemId =
  | "old_key"
  | "camera"
  | "notebook"
  | "battery"
  | "backpack"
  | "tsinelas"
  | "payong"
  | "liham"
  | "radio"
  | "lantern"
  | "salamin"
  | "baon"
  | "abaniko"
  | "rosaryo"
  | "tabo"
  | "compass"
  | "sombrero"
  | "flashlight";

export type ZoneDef = {
  id: string;
  name: string;
  tagalog: string;
  blurb: string;
  x: number;
  z: number;
  radius: number;
  color: string;
};

export type LostItemDef = {
  id: ItemId;
  name: string;
  blurb: string;
  zone: string;
  x: number;
  z: number;
  hint: string;
};

export type Interactable = {
  id: ItemId;
  name: string;
  x: number;
  y: number;
  z: number;
  zone: string;
  hint: string;
};

export type Clue = {
  id: string;
  x: number;
  y: number;
  z: number;
  hint: string;
  line: string;
};

export type BuildingKind =
  | "block"
  | "pad"
  | "tower"
  | "wall"
  | "dome"
  | "pipe"
  | "house"
  | "kubo"
  | "store"
  | "workshop"
  | "greenhouse"
  | "mill";

export type Building = {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  y?: number;
  color: number;
  roof?: number;
  emissive?: number;
  kind: BuildingKind;
  collides?: boolean;
  enterable?: boolean;
  yaw?: number;
  roofStyle?: "flat" | "gable" | "hip";
  porch?: boolean;
  fixture?: "hanging" | "lantern" | "wall" | "covered";
  lightIntensity?: number;
};

export type LevelDef = {
  id: number;
  slug: string;
  title: string;
  tagalog: string;
  blurb: string;
  timeOfDay: TimeOfDay;
  timeLimit: number;
  spawn: { x: number; z: number; yaw?: number };
  items: LostItemDef[];
};

export type HudSnapshot = {
  zoneId: string;
  zoneName: string;
  zoneBlurb: string;
  remaining: number;
  timeLimit: number;
  found: ItemId[];
  total: number;
  prompt: string;
  notif: string;
  lastFound: ItemId | null;
  lastFoundName: string;
  light: boolean;
  started: boolean;
  ended: null | { status: "win" | "lose" };
  lookingId: string | null;
  levelId: number;
  levelTitle: string;
  dialogue: string;
  trackName: string;
};

export type InputState = {
  f: number;
  r: number;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
  lookX: number;
  lookY: number;
  interact: boolean;
};

export type Settings = {
  master: number;
  music: number;
  sfx: number;
  ambience: number;
  quality: Quality;
  minimap: boolean;
  dialogue: boolean;
  textScale: number;
  cameraView: CameraView;
  weather: WeatherMode;
};
