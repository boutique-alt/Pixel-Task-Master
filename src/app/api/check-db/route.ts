import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


const TABLES_TO_CHECK = [
  "members",
  "directory_clients",
  "tasks",
  "attendance_records",
  "authorized_devices",
  "leave_requests",
  "leave_type_options",
  "member_bank_details",
  "salary_payments",
  "hr_notices",
  "office_rules",
  "activities",
  "app_users",
];

export async function GET() {
  const results: Record<string, { status: "connected" | "error"; count?: number; error?: string }> = {};

  for (const table of TABLES_TO_CHECK) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        results[table] = {
          status: "error",
          error: error.message || String(error),
        };
      } else {
        results[table] = {
          status: "connected",
          count: count ?? (data ? data.length : 0),
        };
      }
    } catch (err: any) {
      results[table] = {
        status: "error",
        error: err.message || "Unknown error",
      };
    }
  }

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "default",
    timestamp: new Date().toISOString(),
    results,
  });
}
