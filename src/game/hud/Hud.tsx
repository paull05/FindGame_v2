import type { ReactNode, RefObject, TouchEvent } from "react";
import { Check, Crosshair, Flashlight, Map as MapIcon, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZONES } from "@/game/catalog.ts";
import { levelById } from "@/game/levels.ts";
import type { HavenRuntime } from "@/game/runtime.ts";
import { useGameUi } from "@/game/store.ts";
import type { Overlay, WeatherMode } from "@/game/types.ts";
import { cn, formatClock } from "@/lib/utils";
import { BriefingPanel, ResultPanel, SettingsScreen } from "./Flow.tsx";
import { MiniMap } from "./Minimap.tsx";
import { MusicPlayer } from "./MusicPlayer.tsx";

export function Hud({
  runtime,
  overlay,
  locked,
  onEnter,
  onResume,
  onRestart,
  onToggleMap,
  onMenu,
  onNext,
  onWeatherChange,
}: {
  runtime: RefObject<HavenRuntime | null>;
  overlay: Overlay;
  locked: boolean;
  onEnter: () => void;
  onResume: () => void;
  onRestart: () => void;
  onToggleMap: () => void;
  onMenu: () => void;
  onNext: () => void;
  onWeatherChange: (mode: WeatherMode) => void;
}) {
  const hud = useGameUi((s) => s.hud);
  const sim = useGameUi((s) => s.sim);
  const setOverlay = useGameUi((s) => s.setOverlay);
  const settings = useGameUi((s) => s.save.settings);
  const dialogue = useGameUi((s) => s.dialogue);
  const levelId = useGameUi((s) => s.levelId);
  const level = levelById(levelId);
  const left = hud ? hud.total - hud.found.length : level.items.length;
  const urgent = (hud?.remaining ?? 99) <= 20;
  const warn = (hud?.remaining ?? 99) <= 60;
  const playing = locked && hud && overlay === "none";

  return (
    <div className="pointer-events-none absolute inset-0 text-fg">
      {playing && (
        <>
          <div className="absolute left-3 top-3 w-[min(13rem,calc(100vw-11rem))] rounded-[10px] border border-white/10 bg-[#0f1514]/75 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:left-4 sm:top-4">
            <p className="font-display text-[10px] uppercase tracking-[0.16em] text-accent">{level.tagalog}</p>
            <p className="mt-1 text-xs text-muted">
              {left} {left === 1 ? "item" : "items"} remaining
            </p>
            <ul className="mt-2 space-y-1">
              {level.items.map((it) => {
                const done = hud.found.includes(it.id);
                return (
                  <li key={it.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "grid size-3.5 place-items-center rounded-[3px] border",
                        done ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-subtle",
                      )}
                    >
                      {done ? <Check className="size-3" strokeWidth={2.5} /> : null}
                    </span>
                    <span className={cn(done && "text-muted line-through")}>{it.name}</span>
                  </li>
                );
              })}
            </ul>
            {hud.notif ? <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-muted">{hud.notif}</p> : null}
            {hud.prompt ? <p className="mt-2 border-t border-white/10 pt-2 text-[10px] font-medium tracking-wide text-accent">{hud.prompt}</p> : null}
            {settings.dialogue && dialogue ? <p className="dialogue-in mt-2 border-t border-white/10 pt-2 text-[10px] italic leading-relaxed text-[#e5dcc8]">{dialogue}</p> : null}
          </div>

          <div className="absolute left-1/2 top-3 hidden w-[min(22rem,40vw)] -translate-x-1/2 text-center sm:top-4 md:block">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-accent">{hud.zoneName}</p>
          </div>

          <div className="absolute right-3 top-3 flex w-28 flex-col items-end gap-2 sm:right-4 sm:top-4 sm:w-32">
            <div className="w-full rounded-[10px] border border-white/10 bg-[#0f1514]/75 px-2.5 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <p
                className={cn(
                  "font-sans text-xl font-semibold tabular leading-none tracking-normal",
                  urgent && "timer-urgent text-danger",
                  !urgent && warn && "text-warn",
                )}
              >
                {formatClock(hud.remaining)}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-subtle">Time left</p>
            </div>
            <MusicPlayer compact />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-fg/70">
            <Crosshair className="size-5" strokeWidth={1.4} />
          </div>

          {hud.lastFound ? (
            <div className="found-toast absolute left-1/2 top-[28%] -translate-x-1/2 rounded-[16px] border border-border bg-surface px-5 py-3 text-center">
              <p className="font-display text-[11px] uppercase tracking-[0.2em] text-ok">Item found</p>
              <p className="mt-1 font-display text-xl">{hud.lastFoundName}</p>
            </div>
          ) : null}

          {settings.minimap && sim ? (
            <div className="absolute bottom-4 left-4 hidden sm:block">
              <MiniMap simX={sim.x} simZ={sim.z} yaw={sim.yaw} discovered={sim.discovered} compact />
            </div>
          ) : null}

          <div className="absolute bottom-4 left-4 hidden text-[9px] uppercase tracking-wider text-subtle lg:block sm:left-[8rem]">
            WASD move · E find · F light · P music · Esc pause
          </div>

          <div className="pointer-events-auto absolute bottom-4 right-4 flex gap-2">
            <IconBtn
              onClick={() => {
                const rt = runtime.current;
                if (rt) rt.sim.light = !rt.sim.light;
              }}
              label="Flashlight"
              active={hud.light}
            >
              <Flashlight className="size-4" />
            </IconBtn>
            <IconBtn onClick={onToggleMap} label="Map">
              <MapIcon className="size-4" />
            </IconBtn>
            <IconBtn
              onClick={() => {
                setOverlay("pause");
                runtime.current?.pause(true);
              }}
              label="Pause"
            >
              <Pause className="size-4" />
            </IconBtn>
          </div>

          <TouchPad runtime={runtime} />
        </>
      )}

      {overlay === "briefing" && <BriefingPanel onEnter={onEnter} />}

      {overlay === "map" && sim && (
        <Panel
          title="Grounds map"
          onClose={() => {
            setOverlay("none");
            runtime.current?.pause(false);
            runtime.current?.focusPlay();
            runtime.current?.requestLock();
          }}
          subtitle="Landmarks, not belongings"
        >
          <MiniMap simX={sim.x} simZ={sim.z} yaw={sim.yaw} discovered={sim.discovered} />
          <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted">
            {ZONES.map((z) => (
              <li key={z.id} className={sim.discovered.has(z.id) ? "text-fg" : "text-subtle"}>
                {sim.discovered.has(z.id) ? z.tagalog : "Not yet visited"}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {overlay === "pause" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/75 p-4">
          <div className="panel-in w-full max-w-sm rounded-[24px] border border-border bg-surface p-6">
            <h2 className="font-display text-2xl">Paused</h2>
            <p className="mt-2 text-sm text-muted">The clock is waiting. Click resume, then the view, to look around again.</p>
            <div className="mt-5 space-y-2">
              <Button className="w-full" onClick={onResume}>
                Resume
              </Button>
              <Button className="w-full" variant="secondary" onClick={onToggleMap}>
                Map
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setOverlay("settings")}
              >
                Settings
              </Button>
              <Button className="w-full" variant="ghost" onClick={onRestart}>
                Restart level
              </Button>
              <Button className="w-full" variant="ghost" onClick={onMenu}>
                Exit to menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {overlay === "settings" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/75 p-4">
          <SettingsScreen onBack={() => setOverlay("pause")} onWeatherChange={onWeatherChange} />
        </div>
      )}

      {(overlay === "win" || overlay === "lose") && (
        <ResultPanel win={overlay === "win"} onNext={onNext} onRetry={onRestart} onMenu={onMenu} />
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
  active,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-[10px] border border-[#dfb66b]/40 bg-[#101715]/90 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_8px_18px_rgba(223,182,107,0.1)] transition-colors hover:border-[#dfb66b]/70 hover:bg-[#151d1a]",
        active && "border-accent text-accent",
      )}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-bg/55 p-3 sm:items-center">
      <div className="max-h-[80dvh] w-full max-w-xl overflow-auto rounded-[24px] border border-border bg-surface p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">{title}</h2>
            {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TouchPad({ runtime }: { runtime: RefObject<HavenRuntime | null> }) {
  return (
    <div className="pointer-events-auto absolute bottom-20 left-4 right-4 flex items-end justify-between sm:hidden">
      <div
        className="relative grid size-28 place-items-center rounded-full border border-border bg-bg/50 text-[10px] uppercase tracking-wider text-muted"
        onTouchStart={(e) => applyStick(e, runtime)}
        onTouchMove={(e) => applyStick(e, runtime)}
        onTouchEnd={() => {
          runtime.current?.setTouchAxis(0, 0);
        }}
      >
        Move
      </div>
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={() => runtime.current?.interactNow()}>
          Pick up
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const rt = runtime.current;
            if (!rt) return;
            rt.input.jump = true;
          }}
        >
          Jump
        </Button>
      </div>
    </div>
  );
}

function applyStick(e: TouchEvent<HTMLDivElement>, runtime: RefObject<HavenRuntime | null>) {
  const t = e.changedTouches[0];
  const r = e.currentTarget.getBoundingClientRect();
  const dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
  const dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const f = Math.max(-1, Math.min(1, -dy));
  const right = Math.max(-1, Math.min(1, dx));
  runtime.current?.setTouchAxis(f, right);
}
