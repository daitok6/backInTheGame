"use client";

interface IntensitySliderProps {
  pain: number;
  onChange: (value: number) => void;
}

export function IntensitySlider({ pain, onChange }: IntensitySliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Intensity today
        </span>
        <span className="text-lg font-semibold">{pain}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={pain}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-teal-mist accent-coral"
        aria-label="Pain intensity, 0 to 10"
      />
      <div className="flex justify-between text-[11px] text-muted">
        <span>0 — none</span>
        <span>10 — worst</span>
      </div>
    </div>
  );
}
