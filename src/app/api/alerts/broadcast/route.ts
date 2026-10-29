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

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (parseErr) {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  try {
    const { id, title, message, priority, targetType, targetMember, sender, url } = body || {};

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Fetch all registered Push Subscriptions from Supabase
    const { data, error } = await supabase
      .from("office_rules")
      .select("*")
      .eq("category", "Push_Subscription");

    if (error) {
      console.error("Failed to load push subscriptions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "No push subscriptions registered yet.",
      });
    }

    // 2. Prepare payload
    const finalTitle = title || (priority === "urgent" ? "🚨 Urgent Office Alert" : "📢 Announcement from Admin");
    const payload = JSON.stringify({
      id: id || `alert_${Date.now()}`,
      title: finalTitle,
      message,
      priority: priority || "normal",
      url: url || (targetType === "individual" ? "/member" : "/"),
    });

    let sentCount = 0;
    const staleIds: string[] = [];

    // 3. Send Web Push to matching devices
    const pushPromises = data.map(async (row) => {
      try {
        const subData = JSON.parse(row.description);
        if (!subData.endpoint || !subData.keys) return;

        const subMemberName = (subData.memberName || "").trim().toLowerCase();
        const subRole = (subData.role || "").trim().toLowerCase();

        // Rule A: Do NOT send push to the sender themselves
        if (sender && subMemberName && subMemberName === sender.trim().toLowerCase()) {
          return;
        }

        // Rule B: Target filtering
        if (targetType === "admin_coordinator") {
          const isAdminOrCoordinator = subRole === "admin" || subRole === "coordinator" || subMemberName === "admin";
          if (!isAdminOrCoordinator) {
            return;
          }
        } else if (
          targetType === "individual" &&
          targetMember &&
          subMemberName !== targetMember.trim().toLowerCase()
        ) {
          return;
        }

        const pushSubscription = {
          endpoint: subData.endpoint,
          keys: subData.keys,
        };

        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 86400, // Deliver within 24 hours even if device is momentarily offline
          urgency: priority === "urgent" ? "high" : "normal",
        });

        sentCount++;
      } catch (err: any) {
        // HTTP 404 or 410 means subscription has expired or user uninstalled app
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(row.id);
        } else {
          console.warn("Push delivery error for subscription:", row.id, err.message);
        }
      }
    });

    await Promise.all(pushPromises);

    // 4. Clean up stale/uninstalled subscriptions in background
    if (staleIds.length > 0) {
      supabase.from("office_rules").delete().in("id", staleIds).then();
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalSubscribers: data.length,
    });
  } catch (err: any) {
    console.error("Broadcast push API error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
