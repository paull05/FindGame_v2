export type DialogueTrigger =
  | "start"
  | "item"
  | "lowtime"
  | "urgent"
  | "zone"
  | "wander"
  | "win"
  | "lose"
  | "night"
  | "miss";

type Ctx = {
  name: string;
  itemName?: string;
  zoneName?: string;
};

const withName = (name: string, a: string, b: string) => (Math.random() < 0.38 ? a.replace("{n}", name) : b);

const LINES: Record<DialogueTrigger, (ctx: Ctx) => string[]> = {
  start: ({ name }) => [
    withName(name, "{n}, saan kaya natin naiwan 'to?", "Saan kaya natin naiwan 'to?"),
    withName(name, "{n}, dahan-dahan lang. Nandito lang 'yan.", "Dahan-dahan lang. Nandito lang 'yan."),
    "Sige, isa-isa. Huwag magmadali — pero 'wag din magtagal.",
    "Parang kahapon lang nandito lahat. Ngayon, hanapin natin.",
  ],
  item: ({ name, itemName }) => [
    withName(name, `{n}, ayan! ${itemName ?? "Ito"}.`, `Ayan! ${itemName ?? "Ito"}.`),
    "Finally. Akala ko wala na.",
    "Uy, eto pala. Kanina pa kita hinahanap.",
    withName(name, `{n}, isa pa. Bilisan mo konti.`, "Isa pa. Konti na lang."),
    "Grabe, saan ba 'to napunta. Anyway — nakuha na.",
  ],
  lowtime: ({ name }) => [
    withName(name, "{n}, bilisan mo! Mauubusan tayo ng oras!", "Bilis! Mauubusan tayo ng oras."),
    "Isa na lang 'tong oras. Focus.",
    withName(name, "{n}, focus tayo.", "Focus tayo. Huwag mag-ikot-ikot."),
  ],
  urgent: ({ name }) => [
    withName(name, "{n} — konti na lang ang oras!", "Konti na lang ang oras!"),
    "Huwag naman sanang nasa kabilang dulo.",
    "Sige, last stretch. Kaya pa 'yan.",
  ],
  zone: ({ zoneName }) => [
    `${zoneName ?? "Dito"} pala 'to. Okay.`,
    "Parang dito ko nakita... o baka hindi.",
    "Okay, bagong sulok. Tingnan natin.",
    "May nakita ako... ah, hindi pala. Keep walking.",
  ],
  wander: ({ name }) => [
    "Nasaan na ba 'yon?",
    "Bakit parang ang layo ng nilalakad ko?",
    withName(name, "{n}... feeling ko mali na naman tayo ng pinuntahan.", "Feeling ko mali na naman tayo ng daan."),
    "Parang dito ko nakita... tapos nawala.",
    "Huwag naman sanang nasa kabilang dulo.",
  ],
  win: ({ name }) => [
    withName(name, "Ayos, {n}. Nakuha lahat.", "Nakuha lahat. Salamat sa paa."),
    "Tapos. Hindi pala ganoon kahirap — sabi ng pagod ko, kasinungalingan.",
    withName(name, "Great job, {n}. Uwi na tayo.", "Uwi na. May merienda pa ba?"),
  ],
  lose: ({ name }) => [
    withName(name, "{n}, next time. Hindi pa tapos 'to.", "Next time. Hindi pa tapos 'to."),
    "Naubos ang oras. Okay lang — alam na natin ang daan.",
    "Bumalik tayo. Konti na lang eh.",
  ],
  night: () => [
    "Gabi na. Buksan mo 'yung ilaw.",
    "Ang dilim. Follow the lamps.",
    "Keep the lamp on. Madaling mawala dito sa gabi.",
  ],
  miss: () => [
    "May nakita ako... ah, hindi pala.",
    "Akala ko item. Bato lang.",
    "Hindi pa 'to. Keep looking.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

export function lineFor(trigger: DialogueTrigger, ctx: Ctx): string {
  const name = ctx.name || "Kaibigan";
  return pick(LINES[trigger]({ ...ctx, name }));
}
