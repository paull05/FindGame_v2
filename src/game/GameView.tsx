import { useEffect, useRef, useState } from "react";
import { getSharedAudio } from "./audio.ts";
import { HavenRuntime } from "./runtime.ts";
import { useGameUi } from "./store.ts";
import { Hud } from "./hud/Hud.tsx";
import { FlowScreens } from "./hud/Flow.tsx";
import { MusicPlayer } from "./hud/MusicPlayer.tsx";
import { LEVELS, levelById } from "./levels.ts";
import type { ItemId, WeatherMode } from "./types.ts";

const MENU_LEVEL = LEVELS[3];

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rtRef = useRef<HavenRuntime | null>(null);
  const flow = useGameUi((s) => s.flow);
  const overlay = useGameUi((s) => s.overlay);
  const levelId = useGameUi((s) => s.levelId);
  const locked = useGameUi((s) => s.locked);
  const hydrate = useGameUi((s) => s.hydrate);
  const setHud = useGameUi((s) => s.setHud);
  const setOverlay = useGameUi((s) => s.setOverlay);
  const setLocked = useGameUi((s) => s.setLocked);
  const setFlow = useGameUi((s) => s.setFlow);
  const setLevel = useGameUi((s) => s.setLevel);
  const resetUi = useGameUi((s) => s.resetUi);
  const recordWin = useGameUi((s) => s.recordWin);
  const [ready, setReady] = useState(false);
  const [runId, setRunId] = useState(0);
  const playerName = useGameUi((s) => s.save.username);
  const speak = useGameUi((s) => s.save.settings.dialogue);
  const music = useGameUi((s) => s.save.settings.music);
  const sfx = useGameUi((s) => s.save.settings.sfx);
  const master = useGameUi((s) => s.save.settings.master);
  const ambience = useGameUi((s) => s.save.settings.ambience);
  const playing = flow === "game";
  const activeLevel = playing ? levelById(levelId) : MENU_LEVEL;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const kick = () => getSharedAudio().unlock();
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setReady(false);
    const q = useGameUi.getState().save.settings.quality;
    const rt = new HavenRuntime(canvas, activeLevel, playerName || "Kaibigan", speak, q, useGameUi.getState().save.settings.weather, {
      onHud: (h, sim) => setHud(h, sim),
      onPickup: (id: ItemId) => {
        rt.audio.lastPickupId = id;
        rt.audio.pickup();
      },
      onEnd: (sim) => {
        rt.pause(true);
        if (sim.ended?.status === "win") {
          rt.audio.win();
          recordWin(sim.level.id, Math.max(0, sim.timeLimit - sim.t), sim.timeLimit, sim.found.size);
          setOverlay("win");
        } else {
          rt.audio.lose();
          setOverlay("lose");
        }
      },
    });
    const s = useGameUi.getState().save.settings;
    rt.audio.setVolumes({ music: s.music, sfx: s.sfx, master: s.master, ambience: s.ambience });
    rtRef.current = rt;
    rt.start();
    setReady(true);
    const onKey = (e: KeyboardEvent) => {
      const state = useGameUi.getState();
      if (state.flow !== "game") return;
      const cur = state.overlay;
      if (cur === "briefing" || cur === "win" || cur === "lose") return;
      if (e.code === "KeyM") {
        const next = cur === "map" ? "none" : "map";
        state.setOverlay(next);
        rt.pause(next !== "none");
      }
      if (e.code === "Escape") {
        if (document.pointerLockElement) document.exitPointerLock();
        if (cur === "pause" || cur === "settings" || cur === "map") {
          state.setOverlay("none");
          rt.pause(false);
          rt.focusPlay();
          rt.requestLock();
        } else {
          state.setOverlay("pause");
          rt.pause(true);
        }
      }
      if (e.code === "KeyP") getSharedAudio().toggleMusic();
    };
    window.addEventListener("keydown", onKey);
    const onClick = () => {
      const state = useGameUi.getState();
      if (state.flow === "game" && state.overlay === "none") {
        rt.focusPlay();
        if (state.locked) rt.requestLock();
      }
    };
    canvas.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", onClick);
      rt.dispose();
      rtRef.current = null;
    };
  }, [runId, activeLevel, playing, playerName, speak, setHud, setOverlay, recordWin]);

  useEffect(() => {
    rtRef.current?.audio.setVolumes({ music, sfx, master, ambience });
  }, [music, sfx, master, ambience]);

  function enter() {
    const rt = rtRef.current;
    if (!rt) return;
    rt.audio.ui();
    rt.audio.unlock();
    rt.begin();
    setOverlay("none");
    setLocked(true);
    requestAnimationFrame(() => {
      rt.focusPlay();
      requestAnimationFrame(() => rt.focusPlay());
    });
  }

  function restart() {
    resetUi();
    setRunId((n) => n + 1);
  }

  function toMenu() {
    rtRef.current?.audio.ui();
    setLocked(false);
    setOverlay("none");
    setFlow("menu");
    setRunId((n) => n + 1);
  }

  function nextLevel() {
    const next = Math.min(10, levelId + 1);
    resetUi();
    setLevel(next);
    setRunId((n) => n + 1);
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Bakuran game view"
        className="block h-full w-full touch-none outline-none"
      />
      <FlowScreens onWeatherChange={(mode: WeatherMode) => rtRef.current?.setWeather(mode)} />
      {flow !== "title" && <MusicPlayer />}
      {ready && playing && (
        <Hud
          runtime={rtRef}
          overlay={overlay}
          locked={locked}
          onWeatherChange={(mode) => rtRef.current?.setWeather(mode)}
          onEnter={enter}
          onResume={() => {
            setOverlay("none");
            rtRef.current?.pause(false);
            rtRef.current?.focusPlay();
            rtRef.current?.requestLock();
          }}
          onRestart={restart}
          onToggleMap={() => {
            const cur = useGameUi.getState().overlay;
            const next = cur === "map" ? "none" : "map";
            setOverlay(next);
            const rt = rtRef.current;
            rt?.pause(next !== "none");
            if (next === "none") {
              rt?.focusPlay();
              rt?.requestLock();
            }
          }}
          onMenu={toMenu}
          onNext={nextLevel}
        />
      )}
    </div>
  );
}
