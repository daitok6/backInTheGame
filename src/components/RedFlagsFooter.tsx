import { RED_FLAGS } from "@/lib/content";

export function RedFlagsFooter() {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-coral bg-coral-soft p-4">
      <p className="text-sm font-semibold text-ink">
        See a doctor the same day if:
      </p>
      <ul className="flex flex-col gap-1 text-sm text-ink">
        {RED_FLAGS.map((flag) => (
          <li key={flag} className="flex gap-2">
            <span className="text-coral">•</span>
            <span>{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
