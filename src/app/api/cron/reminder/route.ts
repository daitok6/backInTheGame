import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable, pushSubscriptions } from "@/db/schema";

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
const DEFAULT_REMINDER_TIME = "08:00";
const REMINDER_BODY = "Time for your check-in — sphinx, walk, and log the leg";

interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Current hour (00-23) in the given IANA timezone, as a zero-padded string. */
function currentHourInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const settingsRow = await db.query.settings.findFirst({
    where: eq(settingsTable.id, 1),
  });
  const timezone = settingsRow?.timezone ?? DEFAULT_TIMEZONE;
  const reminderTime = settingsRow?.reminderTime ?? DEFAULT_REMINDER_TIME;
  const reminderHour = reminderTime.split(":")[0];
  const nowHour = currentHourInTimezone(timezone);

  if (nowHour !== reminderHour) {
    return NextResponse.json({ sent: 0, reason: "not the reminder hour", nowHour, reminderHour });
  }

  webpush.setVapidDetails("mailto:daito.k631@gmail.com", vapidPublic, vapidPrivate);

  const subscriptions = await db.query.pushSubscriptions.findMany();
  const payload = JSON.stringify({
    title: "Back in the Game",
    body: REMINDER_BODY,
  });

  let sent = 0;
  const staleIds: number[] = [];

  await Promise.all(
    subscriptions.map(async (row) => {
      const sub = row.subscription as StoredSubscription;
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(row.id);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await Promise.all(
      staleIds.map((id) => db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))),
    );
  }

  return NextResponse.json({ sent, pruned: staleIds.length });
}
