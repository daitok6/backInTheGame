"use client";

interface NoteFieldProps {
  note: string;
  onChange: (value: string) => void;
}

export function NoteField({ note, onChange }: NoteFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="daily-note" className="text-xs font-medium uppercase tracking-wide text-muted">
        Notes
      </label>
      <textarea
        id="daily-note"
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What did you do today, and what did the leg say about it?"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </div>
  );
}
