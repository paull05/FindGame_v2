import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const BANNED =
  /\b(fuck|shit|bitch|asshole|bastard|cunt|nigger|nigga|faggot|retard|putangina|tangina|gago|bobo|tanga|ulol|inutil|puki|pussy|slut|whore)\b/i;

export function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N} .'\-ñÑ]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  if (!cleaned || BANNED.test(cleaned)) return "Kaibigan";
  return cleaned;
}

export function starsFromRatio(remaining: number, limit: number): number {
  const ratio = limit <= 0 ? 0 : remaining / limit;
  if (ratio > 0.5) return 5;
  if (ratio > 0.35) return 4;
  if (ratio > 0.2) return 3;
  if (ratio > 0.08) return 2;
  return 1;
}
