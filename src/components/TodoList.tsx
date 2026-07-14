"use client";

export interface TodoItemView {
  itemId: string;
  label: string;
  done: boolean;
}

interface TodoListProps {
  items: TodoItemView[];
  onToggle: (itemId: string, done: boolean) => void;
}

export function TodoList({ items, onToggle }: TodoListProps) {
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">To-dos</h2>
        <span className="text-sm text-muted">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.itemId}
            className="flex items-start gap-3 rounded-card border border-border bg-card p-3"
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) => onToggle(item.itemId, e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
              aria-label={item.label}
            />
            <span
              className={`text-sm font-medium ${item.done ? "text-muted line-through" : "text-ink"}`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
