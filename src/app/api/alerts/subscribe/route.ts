import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  try {
    const { id, endpoint, keys, memberName, phone, role } = body || {};

    if (!endpoint || !keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const recordId = id || `psub_${btoa(endpoint.slice(-32)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;

    const { error } = await supabase.from("office_rules").upsert({
      id: recordId,
      category: "Push_Subscription",
      title: memberName || "Push Subscriber",
      description: JSON.stringify({
        endpoint,
        keys,
        memberName: memberName || "Member",
        phone: phone || "",
        role: role || "member",
        updatedAt: new Date().toISOString(),
      }),
    });

    if (error) {
      console.error("Failed to store push subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: recordId });
  } catch (err: any) {
    console.error("Subscription API error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
