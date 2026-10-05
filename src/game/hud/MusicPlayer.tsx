import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSharedAudio, SONG, type MusicSnap } from "@/game/audio.ts";
import { useGameUi } from "@/game/store.ts";
import { cn } from "@/lib/utils";

export function MusicPlayer({ compact = false }: { compact?: boolean }) {
  const flow = useGameUi((s) => s.flow);
  const overlay = useGameUi((s) => s.overlay);
  const musicVol = useGameUi((s) => s.save.settings.music);
  const update = useGameUi((s) => s.updateSettings);
  const [snap, setSnap] = useState<MusicSnap>(() => getSharedAudio().musicSnap());

  useEffect(() => {
    const audio = getSharedAudio();
    setSnap(audio.musicSnap());
    return audio.onChange(() => setSnap(audio.musicSnap()));
  }, []);

  useEffect(() => {
    getSharedAudio().setVolumes({ music: musicVol });
  }, [musicVol]);

  const playing = snap.musicOn;
  const inWalk = flow === "game" && overlay === "none";
  const toggleMusic = () => {
    getSharedAudio().toggleMusic();
    setSnap(getSharedAudio().musicSnap());
  };

  if (!compact && inWalk) return null;

  if (compact) {
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={playing ? "Pause music" : "Play music"}
        title={playing ? "P · Pause music" : "P · Play music"}
        className="pointer-events-auto grid size-10 place-items-center rounded-[10px] border border-white/10 bg-[#0f1514]/75 text-fg shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-colors hover:border-accent/60"
        onClick={toggleMusic}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto absolute z-30 left-3 bottom-4 flex w-52 items-center gap-2 rounded-lg border border-border bg-bg/80 px-2 py-1.5 sm:left-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={playing ? "Pause music" : "Play music"}
        className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-elevated text-fg hover:border-accent"
        onClick={toggleMusic}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xs leading-tight">{SONG.name}</p>
        <label className="mt-1 flex items-center gap-1.5">
          <Volume2 className="size-3 shrink-0 text-subtle" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={musicVol}
            onChange={(e) => update({ music: Number(e.target.value) })}
            className="h-1 w-full accent-[var(--color-accent)]"
            aria-label="Music volume"
          />
        </label>
      </div>
    </div>
  );
}
