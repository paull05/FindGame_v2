import { useState } from "react";
import { ZONES } from "@/game/catalog.ts";
import { generateBuildings } from "@/game/world.ts";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw } from "lucide-react";

const BUILDINGS = generateBuildings().filter((b) => b.kind !== "pad");

export function MiniMap({
  simX,
  simZ,
  yaw,
  discovered,
  compact,
}: {
  simX: number;
  simZ: number;
  yaw: number;
  discovered: Set<string>;
  compact?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const size = compact ? 104 : 280;
  const mapScale = compact ? 1 : zoom;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-white/10 bg-[#1b2922] shadow-[0_12px_30px_rgba(0,0,0,0.22)]",
        compact ? "size-[104px]" : "mx-auto aspect-square w-full max-w-sm",
      )}
      style={compact ? undefined : { minHeight: size }}
    >
      <svg viewBox="-140 -140 280 280" className="size-full" role="img" aria-label="Top-down map of the grounds">
          <rect x="-140" y="-140" width="280" height="280" fill="#1b2922" />
        <g transform={`scale(${mapScale})`}>
          <ellipse cx="-72" cy="58" rx="34" ry="28" fill="#29444a" opacity=".88" />
          <path d="M -101 58 C -88 42 -69 38 -53 47 C -43 55 -48 72 -64 80 C -80 84 -96 75 -101 58 Z" fill="#36545a" opacity=".68" />
          <path d="M 35 -105 C 50 -123 84 -119 99 -94 C 109 -76 96 -49 77 -42 C 58 -37 35 -53 31 -73 C 28 -85 29 -96 35 -105 Z" fill="#34463a" opacity=".56" />
          <path d="M 42 43 C 59 35 88 41 101 58 C 111 71 100 91 82 99 C 61 108 41 94 35 77 C 31 64 33 49 42 43 Z" fill="#34463a" opacity=".46" />
          <path d="M -111 -112 C -93 -129 -62 -126 -47 -108 C -37 -96 -43 -77 -59 -68 C -78 -58 -105 -68 -114 -87 C -118 -96 -118 -105 -111 -112 Z" fill="#34463a" opacity=".48" />
          <path d="M -5 118 C -8 76 -20 52 -8 29 C 5 8 1 -20 12 -46 C 20 -66 28 -84 35 -116 M -90 8 C -55 2 -32 -7 -7 -2 C 20 3 48 17 96 15 M -72 58 C -42 55 -20 48 4 51 C 34 55 65 69 103 78" fill="none" stroke="#9b9b7d" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="0" r="22" fill="#39453a" opacity=".9" />
          <circle cx="0" cy="0" r="13" fill="#56604a" opacity=".8" />
          <circle cx="-2" cy="2" r="5" fill="#cfb677" opacity=".85" />
          <g>
          {BUILDINGS.map((b) => {
            const known = ZONES.some((z) => discovered.has(z.id) && Math.hypot(b.x - z.x, b.z - z.z) < z.radius * 1.3);
            return (
              <g key={b.id} opacity={known ? 1 : 0.62}>
                <rect x={b.x - b.w / 2} y={b.z - b.d / 2} width={b.w} height={b.d} rx="1.5" fill={known ? "#cfb677" : "#879185"} fillOpacity={known ? ".88" : ".38"} />
              </g>
            );
          })}
          </g>
          {ZONES.map((z) => {
          const known = discovered.has(z.id);
          return (
            <g key={z.id} opacity={known ? 0.55 : 0.18}>
              <circle cx={z.x} cy={z.z} r={z.radius} fill="none" stroke="#c9cfb0" strokeOpacity={known ? ".32" : ".14"} strokeWidth="1.5" strokeDasharray="3 4" />
              {known && !compact && (
                <text x={z.x} y={z.z} textAnchor="middle" dominantBaseline="middle" fill="#d7ddc7" fontSize="7" fontWeight="500" letterSpacing=".25">
                  {z.tagalog}
                </text>
              )}
            </g>
          );
          })}
          <g transform={`translate(${simX} ${simZ}) rotate(${(-yaw * 180) / Math.PI})`}>
            <circle r="5.5" fill="#e8d79b" fillOpacity=".3" stroke="#f8e6a9" strokeWidth="1" />
            <path d="M 0 -6 L 3.7 4 L 0 2.2 L -3.7 4 Z" fill="#fff4bf" stroke="#3b3020" strokeWidth="1" />
          </g>
          <g transform="translate(126 -124)">
            <path d="M 0 8 L 0 -8 M 0 -8 L -2 -4 M 0 -8 L 2 -4" stroke="#f4eac8" strokeWidth="1.4" fill="none" />
            <text x="0" y="14" textAnchor="middle" fill="#f4eac8" fontSize="5" fontWeight="700">N</text>
          </g>
        </g>
      </svg>
      {!compact && (
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[6px] border border-white/10 bg-[#142019]/85 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-[#f1e8c8]">
          <span className="size-1.5 rounded-full bg-[#fff4bf]" /> Ikaw
          <span className="ml-1 size-1.5 rounded-[1px] bg-[#cfb677]" /> Landmark
        </div>
      )}
      {!compact && (
        <div className="pointer-events-auto absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-white/15 bg-[#142019]/90 p-1 shadow-lg">
          <button type="button" className="grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.5))}>
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center text-[10px] font-semibold text-[#f1e8c8]">{zoom.toFixed(1)}x</span>
          <button type="button" className="grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.5, value + 0.5))}>
            <Plus className="size-4" />
          </button>
          <button type="button" className="ml-1 grid size-7 place-items-center rounded-md text-[#f1e8c8] hover:bg-white/10" aria-label="Reset map zoom" onClick={() => setZoom(1)}>
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
