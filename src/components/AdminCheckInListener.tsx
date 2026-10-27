"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCRM, AttendanceRecord } from "@/context/CRMContext";
import { fetchAttendanceRecordsDb } from "@/lib/crmService";
import { supabase } from "@/lib/supabase";
import { playAlertSound } from "@/lib/soundService";
import { Users, CheckCircle2, X, ExternalLink, MessageCircle, Bell } from "lucide-react";
import Link from "next/link";

export default function AdminCheckInListener() {
  const { sessionUser, setAttendanceRecords } = useCRM();

  const [latestCheckIn, setLatestCheckIn] = useState<AttendanceRecord | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const seenCheckInIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Check if current user is Admin
  useEffect(() => {
    const checkAdmin = () => {
      const isRoleAdmin = sessionUser?.role === "admin";
      const isPathAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      setIsAdminUser(isRoleAdmin || isPathAdmin);
    };
    checkAdmin();
  }, [sessionUser]);

  // Request browser desktop notification permission if supported
  useEffect(() => {
    if (!isAdminUser) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Auto-unlock browser audio autoplay on first click or keypress
    const unlockAudio = () => {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.01;
        audio.play().then(() => audio.pause()).catch(() => {});
      } catch {}
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    // Test Sound & Alert Event Listener
    const handleTestSoundEvent = () => {
      playAlertSound({ volume: 1.0, loop: false });
      const testRec: AttendanceRecord = {
        id: "test_" + Date.now(),
        member: "Swagata Banerjee (Test Alert)",
        date: new Date().toISOString().split("T")[0],
        checkInTime: "09:58 AM",
        checkInTimestamp: Date.now(),
        status: "On Time",
        verifiedVia: "Office GPS (Sound Test)",
        deviceId: "OFFICE-LAPTOP-TEST",
      };
      setLatestCheckIn(testRec);

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🔔 Notification Music Test", {
            body: "Swagata Banerjee has checked in! (Office GPS)",
            icon: "/icon-192.png",
          });
        } catch {}
      }
    };
    window.addEventListener("trigger-admin-test-sound", handleTestSoundEvent);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("trigger-admin-test-sound", handleTestSoundEvent);
    };
  }, [isAdminUser]);

  // Real-time check-in listener
  useEffect(() => {
    if (!isAdminUser) return;

    const todayStr = new Date().toISOString().split("T")[0];

    const checkForNewCheckIns = async () => {
      try {
        const records = await fetchAttendanceRecordsDb();
        if (!records || records.length === 0) return;

        // Filter today's records with a valid checkInTime
        const todayRecords = records.filter(
          (r) => r.date === todayStr && Boolean(r.checkInTime)
        );

        if (isFirstLoadRef.current) {
          // On first load, record existing check-in IDs so we don't alert retroactively
          todayRecords.forEach((r) => seenCheckInIdsRef.current.add(r.id));
          isFirstLoadRef.current = false;
          return;
        }

        // Find any new check-in
        const newRecords = todayRecords.filter((r) => !seenCheckInIdsRef.current.has(r.id));

        if (newRecords.length > 0) {
          // We found new check-ins!
          for (const newRec of newRecords) {
            seenCheckInIdsRef.current.add(newRec.id);

            // 1. Play sound
            playAlertSound({ volume: 0.85, loop: false });

            // 2. Show on-screen popup
            setLatestCheckIn(newRec);

            // 3. Trigger native desktop notification (if tab is in background/minimized)
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(`👋 ${newRec.member} has arrived!`, {
                  body: `Checked in at ${newRec.checkInTime} (${newRec.verifiedVia || "Office"}) [${newRec.status}]`,
                  icon: "/icon-192.png",
                });
              } catch (e) {
                console.warn("Desktop notification trigger failed:", e);
              }
            }
          }

          // Update context records so tables refresh automatically
          setAttendanceRecords((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            newRecords.forEach((n) => map.set(n.id, n));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // silent fallback
      }
    };

    // Initial check
    checkForNewCheckIns();

    // 1. Periodic poll every 6 seconds as a guaranteed fallback
    const interval = setInterval(checkForNewCheckIns, 6000);

    // 2. Supabase Realtime channel for instant sub-second push
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("admin-checkin-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "attendance_records" },
          () => {
            checkForNewCheckIns();
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [isAdminUser, setAttendanceRecords]);

  // Auto-dismiss popup after 8 seconds
  useEffect(() => {
    if (!latestCheckIn) return;
    const timer = setTimeout(() => {
      setLatestCheckIn(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestCheckIn]);

  if (!isAdminUser || !latestCheckIn) return null;

  const isLate = latestCheckIn.status === "Late";

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-[calc(100vw-32px)] bg-white rounded-3xl p-4 shadow-2xl border border-gray-200/80 animate-in slide-in-from-top-3 fade-in duration-200">
      <div className="flex items-start gap-3">
        {/* Animated Icon Avatar */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
          isLate ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        }`}>
          <div className="relative">
            <Users size={22} />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${
              isLate ? "bg-amber-500" : "bg-emerald-500"
            }`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isLate ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isLate ? "⚠️ Member Late Check-In" : "🟢 Member Arrived"}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {latestCheckIn.checkInTime}
            </span>
          </div>

          <h4 className="text-sm font-black text-gray-900 mt-1 truncate">
            {latestCheckIn.member} has arrived!
          </h4>

          <p className="text-xs text-gray-500 mt-0.5">
            Verified via <span className="font-semibold text-gray-700">{latestCheckIn.verifiedVia || "Office"}</span>
          </p>

          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-100">
            <Link
              href="/admin/attendance"
              onClick={() => setLatestCheckIn(null)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View Attendance Log</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setLatestCheckIn(null)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
