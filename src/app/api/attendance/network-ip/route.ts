import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Extract client IP from various proxy and server headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  let ip = "";
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  } else if (cfConnectingIp) {
    ip = cfConnectingIp.trim();
  }

  // Fallback to Next.js native IP if available
  if (!ip) {
    ip = (req as any).ip || "127.0.0.1";
  }

  // Normalize IPv6 mapped IPv4 (e.g., ::ffff:49.37.8.225)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return NextResponse.json({
    ip,
    timestamp: Date.now(),
  });
}
