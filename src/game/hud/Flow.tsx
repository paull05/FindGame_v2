import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, ChevronRight, CloudRain, CloudSun, Moon, Play, Star, Sunset, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSharedAudio } from "@/game/audio.ts";
import { LEVELS, isUnlocked } from "@/game/levels.ts";
import { TIME_PRESETS, TOTAL_LEVELS } from "@/game/catalog.ts";
import { useGameUi } from "@/game/store.ts";
import { cn, formatClock, sanitizeUsername } from "@/lib/utils";
import type { Quality, WeatherMode } from "@/game/types.ts";

export function FlowScreens({ onWeatherChange }: { onWeatherChange?: (mode: WeatherMode) => void }) {
  const flow = useGameUi((s) => s.flow);
  if (flow === "game") return null;
  if (flow === "title") return <TitleScreen />;
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/50 p-4">
      {flow === "login" && <LoginScreen />}
      {flow === "menu" && <MenuScreen />}
      {flow === "profile" && <ProfileScreen />}
      {flow === "levels" && <LevelScreen />}
      {flow === "settings" && <SettingsScreen onBack={() => useGameUi.getState().setFlow("menu")} onWeatherChange={onWeatherChange} />}
    </div>
  );
}

function Shell({
  kicker,
  title,
  children,
  wide,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel-in w-full rounded-[20px] border border-white/10 bg-[#0f1514]/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-[10px] sm:p-8",
        wide ? "max-w-2xl" : "max-w-lg",
      )}
    >
      <p className="font-display text-[11px] uppercase tracking-[0.28em] text-accent">{kicker}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

function TitleScreen() {
  const setFlow = useGameUi((s) => s.setFlow);
  const username = useGameUi((s) => s.save.username);
  return (
    <main className="bakuran-title pointer-events-auto absolute inset-0 overflow-y-auto text-fg">
      <div className="bakuran-title__frame">
        <header className="bakuran-title__masthead">
          <div className="bakuran-title__brand">
            <span className="bakuran-title__brand-copy">
              <strong>BAKURAN</strong>
              <small>MEMORY WALK · PHILIPPINES</small>
            </span>
          </div>
          <div className="bakuran-title__edition">
            <span>THE ANCESTRAL GROUNDS</span>
            <span className="bakuran-title__seal" aria-hidden="true">B</span>
          </div>
        </header>

        <section className="bakuran-title__hero" aria-labelledby="bakuran-title-heading">
          <div className="bakuran-title__art" aria-hidden="true" />
          <div className="bakuran-title__hero-shade" />
          <div className="bakuran-title__hero-top">
            <span className="bakuran-title__eyebrow">Naiwan. Hanapin.</span>
          </div>
          <div className="bakuran-title__hero-bottom">
            <div className="bakuran-title__story">
              <h1 id="bakuran-title-heading">Find the Lost<br />Things</h1>
              <p className="bakuran-title__description">A memory walk through the old yard.</p>
            </div>

            <Button
              className="bakuran-title__start"
              size="lg"
              onClick={() => {
                getSharedAudio().unlock();
                setFlow(username ? "menu" : "login");
              }}
            >
              <Play className="size-4 fill-current" />
              <span>Simulan ang paglalakbay</span>
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </section>

        <section className="bakuran-title__chapters" aria-label="Mga tagpo sa bakuran">
          <article className="bakuran-title__chapter bakuran-title__chapter--courtyard">
            <div><span>01 / LIWASAN</span><strong>Ang lumang bakuran</strong></div>
          </article>
          <article className="bakuran-title__chapter bakuran-title__chapter--house">
            <div><span>02 / TAHANAN</span><strong>Bukas ang pinto</strong></div>
          </article>
          <article className="bakuran-title__chapter bakuran-title__chapter--night">
            <div><span>03 / PAGGABI</span><strong>Ilaw sa daan</strong></div>
          </article>
        </section>

        <footer className="bakuran-title__footer">
          <span>ISANG PAGLALAKAD SA MGA BAGAY NA NAIWAN</span>
          <span>10 PAGHAHANAP&nbsp; · &nbsp;1 LUMANG TAHANAN</span>
        </footer>
      </div>
    </main>
  );
}

function LoginScreen() {
  const login = useGameUi((s) => s.login);
  const existing = useGameUi((s) => s.save.username);
  const [name, setName] = useState(existing);
  const preview = sanitizeUsername(name);
  return (
    <Shell kicker="Sino ka?" title="Your name">
      <p className="mt-3 text-sm text-muted">This is how the grounds will call you. Saved on this device.</p>
      <label className="mt-5 block text-[11px] uppercase tracking-[0.16em] text-subtle" htmlFor="player-name">
        Enter your name
      </label>
      <input
        id="player-name"
        autoFocus
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && preview) login(name);
        }}
        placeholder="Juan"
        className="mt-2 h-12 w-full rounded-[16px] border border-border bg-elevated px-4 text-base text-fg outline-none ring-accent/60 focus:ring-2"
      />
      <p className="mt-2 text-xs text-subtle">Shown as {preview}</p>
      <Button className="mt-6 w-full" size="lg" disabled={!name.trim()} onClick={() => login(name)}>
        Continue
      </Button>
    </Shell>
  );
}

function MenuScreen() {
  const save = useGameUi((s) => s.save);
  const setFlow = useGameUi((s) => s.setFlow);
  const setLevel = useGameUi((s) => s.setLevel);
  const markTutorialSeen = useGameUi((s) => s.markTutorialSeen);
  const next = Math.min(TOTAL_LEVELS, (Math.max(0, ...save.completed) || 0) + 1);
  const continueId = isUnlocked(save.lastLevel, save.completed) ? save.lastLevel : next;
  const [showGuide, setShowGuide] = useState(!save.tutorialSeen);

  useEffect(() => {
    setShowGuide(!save.tutorialSeen);
  }, [save.tutorialSeen]);

  const startWalk = () => {
    markTutorialSeen();
    setLevel(continueId);
  };

  return (
    <Shell kicker={`Kumusta, ${save.username}`} title="Bakuran">
      <p className="mt-3 text-sm text-muted">Walk the grounds. Ten searches. One ancestral yard.</p>

      {showGuide && (
        <div className="bakuran-quick-guide panel-in mt-5 rounded-[18px] border border-accent/30 bg-[#101916]/90 p-4">
          <p className="font-display text-[11px] uppercase tracking-[0.18em] text-accent">Quick guide</p>
          <ul className="mt-3 space-y-2 text-sm text-fg/90">
            <li><span className="text-accent">WASD</span> move through the yard.</li>
            <li><span className="text-accent">E</span> inspect or pick up what you find.</li>
            <li><span className="text-accent">F</span> switch the lantern on and off.</li>
            <li><span className="text-accent">Esc</span> pause and return to the menu.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" size="sm" onClick={startWalk}>Start walk</Button>
            <Button className="flex-1" variant="secondary" size="sm" onClick={() => { markTutorialSeen(); setShowGuide(false); }}>
              I know it
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <Button className="w-full" size="lg" onClick={startWalk}>
          {save.completed.length ? "Continue walk" : "Begin walk"}
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => setFlow("levels")}>
          Level select
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => setFlow("profile")}>
          Player profile
        </Button>
        <Button className="w-full" variant="ghost" onClick={() => setFlow("settings")}>
          Settings
        </Button>
      </div>
      <p className="mt-4 text-center text-[11px] text-subtle">
        {save.completed.length} / {TOTAL_LEVELS} complete
      </p>
    </Shell>
  );
}

function ProfileScreen() {
  const save = useGameUi((s) => s.save);
  const setFlow = useGameUi((s) => s.setFlow);
  const progress = Math.round((save.completed.length / TOTAL_LEVELS) * 100);
  const best = Object.values(save.bestTime);
  const bestOverall = best.length ? Math.min(...best) : null;
  return (
    <Shell kicker="Player profile" title={save.username || "Kaibigan"}>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Stat label="Level" value={`${Math.min(TOTAL_LEVELS, save.completed.length + 1)} / ${TOTAL_LEVELS}`} />
        <Stat label="Items found" value={String(save.itemsFound)} />
        <Stat label="Best time" value={bestOverall ? formatClock(bestOverall) : "—"} />
        <Stat label="Walks done" value={String(save.completed.length)} />
      </div>
      <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-subtle">Progress</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
        <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{progress}%</p>
      <Button className="mt-6 w-full" variant="secondary" onClick={() => setFlow("menu")}>
        Back
      </Button>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-elevated px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-subtle">{label}</p>
      <p className="font-display text-lg tabular">{value}</p>
    </div>
  );
}

function LevelScreen() {
  const save = useGameUi((s) => s.save);
  const setFlow = useGameUi((s) => s.setFlow);
  const setLevel = useGameUi((s) => s.setLevel);
  return (
    <Shell kicker="Hanapin" title="Level select" wide>
      <ul className="mt-5 max-h-[50dvh] space-y-2 overflow-auto pr-1">
        {LEVELS.map((lv) => {
          const open = isUnlocked(lv.id, save.completed);
          const done = save.completed.includes(lv.id);
          const stars = save.stars[String(lv.id)] ?? 0;
          return (
            <li key={lv.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => open && setLevel(lv.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition-opacity",
                  open ? "border-border bg-elevated hover:border-accent" : "border-border/60 bg-bg opacity-50",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface font-display text-sm">
                  {lv.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{lv.tagalog}</span>
                  <span className="block truncate text-xs text-muted">
                    {lv.title} · {TIME_PRESETS[lv.timeOfDay].label}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-warn">
                  {done
                    ? Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn("size-3", i < stars ? "fill-warn" : "text-subtle")} />
                      ))
                    : open
                      ? <ChevronRight className="size-4 text-muted" />
                      : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button className="mt-5 w-full" variant="ghost" onClick={() => setFlow("menu")}>
        Back
      </Button>
    </Shell>
  );
}

export function SettingsScreen({
  onBack,
  onWeatherChange,
}: {
  onBack: () => void;
  onWeatherChange?: (mode: WeatherMode) => void;
}) {
  const settings = useGameUi((s) => s.save.settings);
  const update = useGameUi((s) => s.updateSettings);
  const weatherModes: { id: WeatherMode; label: string; icon: typeof CloudSun }[] = [
    { id: "auto", label: "Ayon sa level", icon: Check },
    { id: "sunny", label: "Maaraw", icon: CloudSun },
    { id: "sunset", label: "Hapon", icon: Sunset },
    { id: "night", label: "Gabi", icon: Moon },
    { id: "rain", label: "Maulan", icon: CloudRain },
  ];
  return (
    <div className="panel-in w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[var(--shadow-panel)]">
      <p className="font-display text-[11px] uppercase tracking-[0.28em] text-accent">Settings</p>
      <h2 className="mt-2 font-display text-3xl">Tune the walk</h2>
      <div className="mt-5 space-y-5">
        <Slider label="Music" value={settings.music} onChange={(v) => update({ music: v })} />
        <Slider label="Sound" value={settings.sfx} onChange={(v) => update({ sfx: v })} />
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Panahon</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {weatherModes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={settings.weather === id}
                onClick={() => {
                  update({ weather: id });
                  onWeatherChange?.(id);
                }}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-xs transition-colors",
                  settings.weather === id ? "border-accent/60 bg-[#151d1a] text-fg" : "border-white/10 bg-[#101715]/70 text-muted hover:border-accent/35",
                )}
              >
                <Icon className="size-3.5 shrink-0 text-accent" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Quality</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as Quality[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => update({ quality: q })}
                className={cn(
                  "rounded-[12px] border px-3 py-2 text-sm capitalize",
                  settings.quality === q ? "border-accent bg-elevated text-fg" : "border-border text-muted",
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="Minimap"
          on={settings.minimap}
          onChange={(v) => update({ minimap: v })}
        />
        <Toggle
          label="Dialogue"
          on={settings.dialogue}
          onChange={(v) => update({ dialogue: v })}
        />
        <Slider
          label="Text size"
          value={(settings.textScale - 0.85) / 0.4}
          onChange={(v) => update({ textScale: 0.85 + v * 0.4 })}
        />
      </div>
      <Button className="mt-6 w-full" variant="secondary" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.16em] text-subtle">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-accent)]"
      />
    </label>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center justify-between">
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-[8px] border",
          on ? "border-ok bg-ok/20 text-ok" : "border-border text-subtle",
        )}
      >
        {on ? <Check className="size-4" /> : null}
      </span>
    </button>
  );
}

export function ResultPanel({
  win,
  onNext,
  onRetry,
  onMenu,
}: {
  win: boolean;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
}) {
  const hud = useGameUi((s) => s.hud);
  const save = useGameUi((s) => s.save);
  const levelId = useGameUi((s) => s.levelId);
  const used = hud ? Math.max(0, hud.timeLimit - hud.remaining) : 0;
  const stars = save.stars[String(levelId)] ?? 0;
  const next = levelId < TOTAL_LEVELS ? levelId + 1 : null;
  const name = save.username;

  const copy = useMemo(() => {
    if (!win) return { kicker: "Naubos ang oras", title: "Time's up", body: `${name}, next time. The path is still there.` };
    if (next) return { kicker: "Nakuha lahat", title: "Level complete", body: `Great job, ${name}.` };
    return { kicker: "Huling hanap", title: "The grounds are quiet", body: `${name}, you found everything that was left.` };
  }, [win, next, name]);

  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/70 p-4">
      <div className="panel-in w-full max-w-md rounded-[28px] border border-border bg-surface p-8 text-center">
        <p className={cn("font-display text-[11px] uppercase tracking-[0.28em]", win ? "text-ok" : "text-danger")}>
          {copy.kicker}
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">{copy.title}</h2>
        <p className="mt-3 text-sm text-muted">{copy.body}</p>
        {hud && (
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Time" value={formatClock(used)} />
            <Stat label="Items" value={`${hud.found.length}/${hud.total}`} />
            <Stat label="Left" value={formatClock(hud.remaining)} />
          </div>
        )}
        {win && (
          <div className="mt-4 flex justify-center gap-1 text-warn">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-5", i < stars ? "fill-warn" : "text-subtle")} />
            ))}
          </div>
        )}
        {win && next && <p className="mt-3 text-xs text-accent">Level {next} unlocked</p>}
        <div className="mt-6 space-y-2">
          {win && next ? (
            <Button className="w-full" size="lg" onClick={onNext}>
              Next level
            </Button>
          ) : null}
          <Button className="w-full" size="lg" variant={win && next ? "secondary" : "primary"} onClick={onRetry}>
            {win ? "Play again" : "Try again"}
          </Button>
          <Button className="w-full" variant="ghost" onClick={onMenu}>
            Exit to menu
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BriefingPanel({ onEnter }: { onEnter: () => void }) {
  const levelId = useGameUi((s) => s.levelId);
  const level = LEVELS[levelId - 1] ?? LEVELS[0];
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/55 p-4">
      <div className="panel-in w-full max-w-lg rounded-[20px] border border-[#dfb66b]/20 bg-[#0f1514]/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)] sm:p-8">
        <p className="font-display text-[11px] uppercase tracking-[0.28em] text-accent">
          Level {level.id} · {TIME_PRESETS[level.timeOfDay].label}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{level.tagalog}</h1>
        <p className="mt-1 text-sm text-muted">{level.title}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{level.blurb}</p>
        <p className="mt-5 border-y border-white/10 py-3 text-sm leading-relaxed text-[#f4efe6]">
          {level.items.map((item) => item.name).join(" · ")}
        </p>
        <p className="mt-3 text-xs text-subtle">{formatClock(level.timeLimit)} · {level.items.length} items to find</p>
        <div className="mt-6 flex justify-center">
          <Button className="bakuran-title__start" size="lg" onClick={onEnter}>
            Begin walk
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IdentityChip() {
  const name = useGameUi((s) => s.save.username);
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-subtle">
      <User className="size-3" />
      {name}
    </span>
  );
}
