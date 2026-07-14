"use client";

import { useState, type FormEvent } from "react";

export default function GatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      // Full reload so middleware re-evaluates with the new cookie.
      window.location.href = "/";
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal text-2xl text-white">
          ↑
        </div>
        <h1 className="text-xl font-semibold">Back in the Game</h1>
        <p className="text-sm text-muted">Enter your passcode to continue.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-card border border-border bg-card p-5"
      >
        <input
          type="password"
          inputMode="text"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-teal"
        />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={submitting || code.length === 0}
          className="w-full rounded-lg bg-teal px-4 py-2 font-medium text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
