import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { officeLat, officeLng, allowedRadiusMeters = 100 } = body;

    if (typeof officeLat !== "number" || typeof officeLng !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const { data: existingRule } = await supabase
      .from("office_rules")
      .select("description")
      .eq("id", "sys_attendance_config")
      .single();

    let currentConfig: any = {};
    if (existingRule && existingRule.description) {
      try {
        currentConfig = JSON.parse(existingRule.description);
      } catch (e) {
        // ignore
      }
    }

    const updatedConfig = {
      ...currentConfig,
      officeLat,
      officeLng,
      allowedRadiusMeters: Number(allowedRadiusMeters) || 100,
      requireAuthorizedLaptop: false,
      requireWifiOrGps: true,
    };

    const { error } = await supabase
      .from("office_rules")
      .upsert({
        id: "sys_attendance_config",
        category: "Timing & Attendance",
        title: "AttendanceConfig",
        description: JSON.stringify(updatedConfig),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      officeLat,
      officeLng,
      allowedRadiusMeters: updatedConfig.allowedRadiusMeters,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
  }
}
