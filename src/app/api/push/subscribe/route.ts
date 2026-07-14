import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.number().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const subscription = parsed.data;

  // Dedupe on endpoint — a single user may re-subscribe after clearing data.
  const existing = await db.query.pushSubscriptions.findMany();
  const alreadyStored = existing.some(
    (row) =>
      (row.subscription as { endpoint?: string } | null)?.endpoint === subscription.endpoint,
  );

  if (!alreadyStored) {
    await db.insert(pushSubscriptions).values({ subscription });
  }

  return NextResponse.json({ ok: true });
}
