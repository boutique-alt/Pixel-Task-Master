import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLqv0Sr2PPyu7ZJRq35gkqE0ba6XXnVvyRUH2UmnTcffwQITvz5SSCuHyHUTyqK9DdoQbl2B89eu1XrJjAF_H3A";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "P_jFh6-oiP4ZwNzIIUtrQZVh0wPremHbY-j90CzUohg";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  "mailto:admin@pixeltaskmaster.com";

// Initialize VAPID
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * Scheduled Cron Trigger Endpoint (called at 10:00 AM and 6:00 PM IST)
 * Can be triggered via external cron (e.g. cron-job.org / GitHub Actions / Vercel Cron)
 * GET or POST /api/cron/scheduled-reminders?type=morning | evening
 */
async function handleReminders(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let type = searchParams.get("type");

    // If type not explicitly provided, deduce from current Indian Standard Time (IST = UTC+5:30)
    if (!type) {
      const nowUtc = Date.now();
      const istDate = new Date(nowUtc + 5.5 * 60 * 60 * 1000);
      const istHour = istDate.getUTCHours();
      if (istHour >= 16) {
        type = "evening";
      } else {
        type = "morning";
      }
    }

    const isMorning = type === "morning";
    const title = isMorning ? "📋 10:00 AM Task Review" : "⏰ 6:00 PM Daily Task Update";
    const message = isMorning
      ? "Good morning! Please review your assigned tasks for today and start working on them."
      : "Daily Reminder: Please update your daily task status, add remarks, and submit your EOD report.";

    // 1. Fetch all registered Push Subscriptions from Supabase
    const { data, error } = await supabase
      .from("office_rules")
      .select("*")
      .eq("category", "Push_Subscription");

    if (error) {
      console.error("Failed to load push subscriptions for cron:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "No push subscriptions found in database.",
      });
    }

    // 2. Prepare payload
    const payload = JSON.stringify({
      id: `scheduled_${type}_${Date.now()}`,
      title,
      message,
      priority: "normal",
      url: "/member/tasks",
    });

    let sentCount = 0;
    const staleIds: string[] = [];

    // 3. Dispatch to all registered devices
    const pushPromises = data.map(async (row) => {
      try {
        const subData = JSON.parse(row.description);
        if (!subData.endpoint || !subData.keys) return;

        const pushSubscription = {
          endpoint: subData.endpoint,
          keys: {
            p256dh: subData.keys.p256dh,
            auth: subData.keys.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 60 * 60, // 1 hour validity
          urgency: "high",
        });
        sentCount++;
      } catch (err: any) {
        // Expired or unregistered subscription
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(row.id);
        }
      }
    });

    await Promise.all(pushPromises);

    // Clean up expired tokens
    if (staleIds.length > 0) {
      await supabase.from("office_rules").delete().in("id", staleIds);
    }

    return NextResponse.json({
      success: true,
      sentCount,
      type,
      title,
    });
  } catch (err: any) {
    console.error("Error in scheduled reminders cron:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}
