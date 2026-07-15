"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createFood,
  deleteEntry,
  getNutritionDay,
  logFood,
  updateEntry,
  updateNutritionTargets,
  type FoodOption,
  type NutritionEntryView,
} from "@/app/nutrition-actions";
import { dayTotals, progressFraction } from "@/lib/nutrition";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
type Meal = (typeof MEALS)[number];

interface NutritionLogProps {
  today: string;
  initialEntries: NutritionEntryView[];
  initialFoods: FoodOption[];
  calorieTarget: number | null;
  proteinTarget: number | null;
}

export function NutritionLog({
  today,
  initialEntries,
  initialFoods,
  calorieTarget,
  proteinTarget,
}: NutritionLogProps) {
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<NutritionEntryView[]>(initialEntries);
  const [foodsList, setFoodsList] = useState<FoodOption[]>(initialFoods);
  const [loading, setLoading] = useState(false);

  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(initialFoods[0]?.id ?? null);
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [servings, setServings] = useState("1");
  const [logging, setLogging] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [creating, setCreating] = useState(false);

  const [targets, setTargets] = useState({
    calories: calorieTarget !== null ? String(calorieTarget) : "",
    protein: proteinTarget !== null ? String(proteinTarget) : "",
  });
  const [savingTargets, setSavingTargets] = useState(false);

  useEffect(() => {
    if (date === today) {
      setEntries(initialEntries);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getNutritionDay(date)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // initialEntries/today are stable for the lifetime of this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const totals = useMemo(() => dayTotals(entries), [entries]);
  const caloriesFraction = progressFraction(
    totals.calories,
    targets.calories === "" ? null : Number(targets.calories),
  );
  const proteinFraction = progressFraction(
    totals.proteinG,
    targets.protein === "" ? null : Number(targets.protein),
  );

  const grouped = useMemo(() => {
    return MEALS.map((m) => ({ meal: m, entries: entries.filter((e) => e.meal === m) }));
  }, [entries]);

  async function handleCreateFood() {
    const name = newName.trim();
    if (!name || newCalories === "") return;
    setCreating(true);
    try {
      const row = await createFood({
        name,
        caloriesPerServing: Number(newCalories),
        proteinG: newProtein === "" ? 0 : Number(newProtein),
      });
      const option: FoodOption = {
        id: row.id,
        name: row.name,
        caloriesPerServing: row.caloriesPerServing,
        proteinG: row.proteinG,
        servingLabel: row.servingLabel ?? "serving",
      };
      setFoodsList((prev) => [...prev, option]);
      setSelectedFoodId(row.id);
      setNewName("");
      setNewCalories("");
      setNewProtein("");
      setAdding(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleLog() {
    if (!selectedFoodId || servings === "") return;
    const servingsNum = Number(servings);
    if (!Number.isFinite(servingsNum) || servingsNum <= 0) return;

    setLogging(true);
    try {
      const row = await logFood({ date, meal, foodId: selectedFoodId, servings: servingsNum });
      const food = foodsList.find((f) => f.id === selectedFoodId);
      setEntries((prev) => [
        ...prev,
        {
          id: row.id,
          date: row.date,
          meal,
          name: food?.name ?? "Unknown",
          servings: row.servings,
          caloriesPerServing: food?.caloriesPerServing ?? 0,
          proteinG: food?.proteinG ?? 0,
          carbsG: null,
          fatG: null,
          servingLabel: food?.servingLabel ?? "serving",
        },
      ]);
      setServings("1");
    } finally {
      setLogging(false);
    }
  }

  async function handleDelete(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteEntry({ id });
  }

  async function handleUpdateServings(id: number, newServings: number) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, servings: newServings } : e)));
    await updateEntry({ id, servings: newServings });
  }

  async function handleSaveTargets() {
    setSavingTargets(true);
    try {
      await updateNutritionTargets({
        calorieTarget: targets.calories === "" ? undefined : Number(targets.calories),
        proteinTarget: targets.protein === "" ? undefined : Number(targets.protein),
      });
    } finally {
      setSavingTargets(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Log food</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Calories</span>
          <span>
            {Math.round(totals.calories)}
            {targets.calories !== "" ? ` / ${targets.calories}` : ""}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-mist">
          <div
            className="h-full rounded-full bg-teal transition-[width] duration-200"
            style={{ width: `${caloriesFraction * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Protein</span>
          <span>
            {Math.round(totals.proteinG)}g{targets.protein !== "" ? ` / ${targets.protein}g` : ""}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-mist">
          <div
            className="h-full rounded-full bg-coral transition-[width] duration-200"
            style={{ width: `${proteinFraction * 100}%` }}
          />
        </div>
        <div className="flex gap-2 border-t border-border pt-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted">Calorie target</label>
            <input
              type="number"
              value={targets.calories}
              onChange={(e) => setTargets((t) => ({ ...t, calories: e.target.value }))}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted">Protein target (g)</label>
            <input
              type="number"
              value={targets.protein}
              onChange={(e) => setTargets((t) => ({ ...t, protein: e.target.value }))}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveTargets}
            disabled={savingTargets}
            className="self-end rounded-lg border border-teal px-3 py-1.5 text-xs font-medium text-teal-deep hover:bg-teal-mist disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4">
        <div className="flex gap-2">
          <select
            value={selectedFoodId ?? ""}
            onChange={(e) => setSelectedFoodId(Number(e.target.value))}
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="" disabled>
              Select a food…
            </option>
            {foodsList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({Math.round(f.caloriesPerServing)} cal/{f.servingLabel})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="shrink-0 rounded-lg border border-teal px-3 py-2 text-sm font-medium text-teal-deep hover:bg-teal-mist"
          >
            {adding ? "Cancel" : "+ New"}
          </button>
        </div>

        {adding && (
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Food name"
              className="col-span-3 rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
            <input
              type="number"
              value={newCalories}
              onChange={(e) => setNewCalories(e.target.value)}
              placeholder="Calories"
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
            <input
              type="number"
              value={newProtein}
              onChange={(e) => setNewProtein(e.target.value)}
              placeholder="Protein (g)"
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-teal"
            />
            <button
              type="button"
              onClick={handleCreateFood}
              disabled={creating || !newName.trim() || newCalories === ""}
              className="rounded-lg bg-teal px-2 py-1.5 text-xs font-medium text-white hover:bg-teal-deep disabled:opacity-50"
            >
              Add food
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value as Meal)}
            className="rounded-lg border border-border bg-white px-2 py-2 text-sm capitalize outline-none focus:border-teal"
          >
            {MEALS.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="decimal"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="Servings"
            className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={handleLog}
            disabled={logging || !selectedFoodId || servings === ""}
            className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-50"
          >
            {logging ? "Logging…" : "Log"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          {date === today ? "Today's food" : `Food on ${date}`}
        </h2>
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {!loading &&
          grouped.map(({ meal: m, entries: mealEntries }) => (
            <div key={m} className="flex flex-col gap-2 rounded-card border border-border bg-card p-3">
              <h3 className="text-sm font-semibold capitalize">{m}</h3>
              {mealEntries.length === 0 ? (
                <p className="text-xs text-muted">Nothing logged.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {mealEntries.map((e) => (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      onUpdateServings={(servings) => handleUpdateServings(e.id, servings)}
                      onDelete={() => handleDelete(e.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onUpdateServings,
  onDelete,
}: {
  entry: NutritionEntryView;
  onUpdateServings: (servings: number) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [servings, setServings] = useState(String(entry.servings));

  function handleSave() {
    const value = Number(servings);
    if (Number.isFinite(value) && value > 0) onUpdateServings(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 text-sm">
        <span className="flex-1">{entry.name}</span>
        <input
          type="number"
          inputMode="decimal"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="w-16 rounded border border-border px-1.5 py-1 text-sm"
        />
        <span className="text-xs text-muted">× {entry.servingLabel}</span>
        <button type="button" onClick={handleSave} className="text-xs font-medium text-teal-deep">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted">
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between text-sm">
      <span>
        {entry.name}{" "}
        <span className="text-muted">
          ({entry.servings}× {entry.servingLabel},{" "}
          {Math.round(entry.caloriesPerServing * entry.servings)} cal)
        </span>
      </span>
      <span className="flex gap-2">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-teal-deep">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-coral">
          Delete
        </button>
      </span>
    </li>
  );
}
