"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/push";

type Status = "unsupported" | "idle" | "subscribing" | "enabled" | "error";

export function EnableReminders() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) setStatus("enabled");
      });
    });
  }, []);

  async function handleEnable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      return;
    }
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setStatus("enabled");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") return null;

  if (status === "enabled") {
    return <p className="text-xs text-muted">Daily reminders are on.</p>;
  }

  return (
    <button
      type="button"
      onClick={handleEnable}
      disabled={status === "subscribing"}
      className="w-fit rounded-full border border-teal px-3 py-1.5 text-xs font-medium text-teal-deep hover:bg-teal-mist disabled:opacity-50"
    >
      {status === "subscribing" ? "Enabling…" : "Enable reminders"}
      {status === "error" && " — try again"}
    </button>
  );
}
