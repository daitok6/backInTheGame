"use client";

import { LEG_SEGMENTS, reachLabel } from "@/lib/content";

interface LegMapProps {
  reach: number;
  onChange: (level: number) => void;
}

const SEGMENT_HEIGHT = 48;
const GAP = 6;
const WIDTH = 132;

export function LegMap({ reach, onChange }: LegMapProps) {
  const totalHeight =
    LEG_SEGMENTS.length * SEGMENT_HEIGHT + (LEG_SEGMENTS.length - 1) * GAP;

  function handleTap(level: number) {
    if (level === reach && reach > 0) {
      onChange(reach - 1);
    } else {
      onChange(level);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${totalHeight}`}
        width={WIDTH}
        height={totalHeight}
        role="group"
        aria-label="Pain reach — tap a segment to set how far down the leg it reaches"
      >
        {LEG_SEGMENTS.map((seg, i) => {
          const lit = seg.level <= reach;
          const y = i * (SEGMENT_HEIGHT + GAP);
          // Taper width slightly toward the foot for a leg-like silhouette.
          const inset = i * 5;
          return (
            <g
              key={seg.level}
              onClick={() => handleTap(seg.level)}
              role="button"
              tabIndex={0}
              aria-pressed={lit}
              aria-label={`${seg.label}${lit ? ", selected" : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTap(seg.level);
                }
              }}
              className="cursor-pointer outline-none"
            >
              <rect
                x={inset}
                y={y}
                width={WIDTH - inset * 2}
                height={SEGMENT_HEIGHT}
                rx={14}
                fill={lit ? "var(--coral)" : "var(--teal-mist)"}
                opacity={lit ? 0.5 + (seg.level / 5) * 0.5 : 1}
                stroke="var(--border)"
                strokeWidth={1}
                className="transition-[opacity,fill] duration-150"
              />
              <text
                x={WIDTH / 2}
                y={y + SEGMENT_HEIGHT / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={lit ? "#ffffff" : "var(--ink)"}
                className="select-none text-[13px] font-medium"
              >
                {seg.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Reach
        </span>
        <span className="text-lg font-semibold">{reachLabel(reach)}</span>
        <p className="text-xs leading-snug text-muted">
          Tap a segment to set how far the pain reaches. Tap the lowest lit
          one again to bring it back up.
        </p>
      </div>
    </div>
  );
}
