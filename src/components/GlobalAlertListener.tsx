"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCRM, BroadcastAlert } from "@/context/CRMContext";
import { playAlertSound, stopAlertSound, speakText } from "@/lib/soundService";
import { 
  subscribeToPushNotifications, 
  getNotificationPermissionStatus,
  isPushNotificationSupported 
} from "@/lib/pushNotificationService";
import { Bell, CheckCircle2, AlertTriangle, Megaphone, Volume2, X } from "lucide-react";

export default function GlobalAlertListener() {
  const { broadcastAlerts, sessionUser, currentMember, acknowledgeAlert } = useCRM();

  const [activeAlert, setActiveAlert] = useState<BroadcastAlert | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  // Determine active member name
  const activeName = (sessionUser?.name || currentMember || "").trim();

  // Register Service Worker and subscribe to Web Push
  useEffect(() => {
    // 1. Load locally seen alert IDs
    try {
      const stored = localStorage.getItem("ptm_acknowledged_alerts_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => seenAlertIdsRef.current.add(id));
        }
      }
    } catch {
      // ignore
    }

    // 2. Check notification support & permission
    if (isPushNotificationSupported()) {
      const status = getNotificationPermissionStatus();
      if (status === "granted") {
        // Auto-subscribe/refresh token in Supabase
        subscribeToPushNotifications({
          name: activeName || sessionUser?.name,
          phone: sessionUser?.phone,
          role: sessionUser?.role,
        }).catch(() => {});
      } else if (status === "default") {
        // Prompt user with a gentle banner
        const isDismissed = sessionStorage.getItem("ptm_dismiss_push_banner");
        if (!isDismissed) {
          setShowPermissionBanner(true);
        }
      }
    }
  }, [activeName, sessionUser]);

  const handleEnablePush = async () => {
    setShowPermissionBanner(false);
    await subscribeToPushNotifications({
      name: activeName || sessionUser?.name,
      phone: sessionUser?.phone,
      role: sessionUser?.role,
    });
  };

  const handleDismissBanner = () => {
    setShowPermissionBanner(false);
    sessionStorage.setItem("ptm_dismiss_push_banner", "true");
  };

  // Show native system desktop notification (works even if tab is in background/minimized)
  const triggerNativeDesktopNotification = (alert: BroadcastAlert) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const title = alert.priority === "urgent" ? "🚨 Urgent Alert from Admin" : "📢 Office Announcement";
      const options: NotificationOptions = {
        body: alert.message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: alert.id,
      };

      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn("Desktop notification error:", e);
    }
  };

  useEffect(() => {
    if (!broadcastAlerts || broadcastAlerts.length === 0 || !activeName) return;

    // Filter alerts meant for this user
    const userRole = sessionUser?.role || (activeName.toLowerCase() === "admin" ? "admin" : "member");
    const isAdminOrCoordinator = userRole === "admin" || userRole === "coordinator";

    const userAlerts = broadcastAlerts.filter((alert) => {
      // 1. NEVER notify the sender themselves (no self-notification music/popup)
      if (alert.sender && alert.sender.trim().toLowerCase() === activeName.toLowerCase()) {
        return false;
      }

      // 2. Target type check
      if (alert.targetType === "admin_coordinator") {
        return isAdminOrCoordinator;
      }
      if (alert.targetType === "all") return true;
      if (alert.targetType === "individual" && alert.targetMember) {
        return alert.targetMember.trim().toLowerCase() === activeName.toLowerCase();
      }
      return false;
    });

    // Find latest unacknowledged alert
    const pendingAlert = userAlerts.find((alert) => {
      if (alert.acknowledgedBy && alert.acknowledgedBy.some((m) => m.toLowerCase() === activeName.toLowerCase())) {
        return false;
      }
      if (seenAlertIdsRef.current.has(alert.id)) {
        return false;
      }
      return true;
    });

    if (pendingAlert && (!activeAlert || activeAlert.id !== pendingAlert.id)) {
      setActiveAlert(pendingAlert);
      // Play custom ringtone!
      playAlertSound({ volume: pendingAlert.priority === "urgent" ? 1.0 : 0.85 });
      // Trigger native system desktop notification
      triggerNativeDesktopNotification(pendingAlert);

      // If speech voice note is included
      if (pendingAlert.message && pendingAlert.title.toLowerCase().includes("reminder")) {
        speakText(pendingAlert.message);
      }
    }
  }, [broadcastAlerts, activeName, activeAlert]);

  // =========================================================================
  // SCHEDULED REMINDERS (Only 2 fixed times per user instruction):
  // 1. 11:00 AM: Ask members & coordinator to check assigned tasks for today
  // 2. 06:00 PM: Ask members & coordinator to update and complete their daily tasks
  // All other spontaneous notification music on status/comments/assignments have been removed.
  // =========================================================================
  useEffect(() => {
    if (!activeName) return;

    const checkScheduledDailyReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayKey = now.toISOString().split("T")[0];

      // 1. 11:00 AM Reminder (11:00 - 11:59)
      if (currentHour === 11) {
        const reminder11AmKey = `ptm_11am_task_review_${todayKey}`;
        const alreadyFired11Am = localStorage.getItem(reminder11AmKey);
        if (!alreadyFired11Am) {
          localStorage.setItem(reminder11AmKey, "true");
          // Play notification music!
          playAlertSound({ volume: 1.0 });

          const title = "📋 11:00 AM Task Review";
          const message = "Please review your assigned tasks for today and start working on them.";

          // Native system notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(title, {
                body: message,
                icon: "/icon-192.png",
              });
            } catch {}
          }

          // In-app side toast banner
          setActiveAlert({
            id: `alert_11am_${Date.now()}`,
            title,
            message,
            targetType: "all",
            priority: "normal",
            createdAt: now.toISOString(),
            createdTimeDisplay: "11:00 AM",
            createdDate: todayKey,
            acknowledgedBy: [],
          });
        }
      }

      // 2. 06:00 PM Reminder (18:00 - 18:59)
      if (currentHour === 18) {
        const reminder6PmKey = `ptm_6pm_task_update_${todayKey}`;
        const alreadyFired6Pm = localStorage.getItem(reminder6PmKey);
        if (!alreadyFired6Pm) {
          localStorage.setItem(reminder6PmKey, "true");
          // Play notification music!
          playAlertSound({ volume: 1.0 });

          const title = "⏰ 6:00 PM Daily Task Update";
          const message = "Please update your daily task status, add remarks, and submit your EOD report.";

          // Native system notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(title, {
                body: message,
                icon: "/icon-192.png",
              });
            } catch {}
          }

          // In-app side toast banner
          setActiveAlert({
            id: `alert_6pm_${Date.now()}`,
            title,
            message,
            targetType: "all",
            priority: "normal",
            createdAt: now.toISOString(),
            createdTimeDisplay: "06:00 PM",
            createdDate: todayKey,
            acknowledgedBy: [],
          });
        }
      }
    };

    checkScheduledDailyReminders();
    const interval = setInterval(checkScheduledDailyReminders, 30000);
    return () => clearInterval(interval);
  }, [activeName]);

  const handleAcknowledge = async () => {
    if (!activeAlert) return;

    stopAlertSound();

    const alertId = activeAlert.id;
    seenAlertIdsRef.current.add(alertId);

    try {
      const currentSeen = Array.from(seenAlertIdsRef.current);
      localStorage.setItem("ptm_acknowledged_alerts_v1", JSON.stringify(currentSeen));
    } catch {
      // ignore
    }

    if (activeName) {
      await acknowledgeAlert(alertId, activeName);
    }

    setActiveAlert(null);
  };

  const isUrgent = activeAlert?.priority === "urgent";

  return (
    <>
      {/* Background Push Permission Banner */}
      {showPermissionBanner && !activeAlert && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9990] w-[95%] max-w-xl bg-white border border-[#1677FF]/30 shadow-xl rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center shrink-0">
              <Bell size={18} className="animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#10254F] leading-tight">Enable Background Alerts</p>
              <p className="text-[11px] text-[#64748B] truncate">Receive admin alerts and ringtone even when CRM is closed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-3.5 py-1.5 bg-[#1677FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Enable Now
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Compact Side Toast / Notification Card (Non-blocking, top-right) */}
      {activeAlert && (
        <aside 
          aria-label="New Alert"
          className="fixed top-4 right-4 z-[9999] w-[92vw] max-w-sm sm:max-w-md pointer-events-auto animate-in slide-in-from-top-3 sm:slide-in-from-right-4 duration-300 drop-shadow-2xl"
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden border ${
              isUrgent ? "border-red-400 ring-2 ring-red-200" : "border-blue-300 ring-2 ring-blue-100"
            }`}
          >
            {/* Top Mini Header */}
            <div 
              className={`px-4 py-2.5 flex items-center justify-between text-white ${
                isUrgent 
                  ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600" 
                  : "bg-gradient-to-r from-[#1677FF] via-blue-600 to-indigo-600"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  {isUrgent ? <AlertTriangle size={14} /> : <Megaphone size={14} />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider truncate">
                  {isUrgent ? "🚨 Urgent Alert" : "📢 Notification"}
                </span>
                <span className="text-[10px] opacity-85 font-medium shrink-0">
                  • {activeAlert.createdTimeDisplay}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  <Volume2 size={12} className="animate-pulse" />
                  <span>Ringing</span>
                </span>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-extrabold text-[#10254F] leading-snug line-clamp-1">
                  {activeAlert.title || "New Message"}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  activeAlert.targetType === "all" 
                    ? "bg-blue-50 text-blue-700" 
                    : activeAlert.targetType === "admin_coordinator"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-purple-50 text-purple-700"
                }`}>
                  {activeAlert.targetType === "all" ? "Team" : activeAlert.targetType === "admin_coordinator" ? "Admin / Coord" : "Direct"}
                </span>
              </div>

              <p className="text-[12px] text-[#334155] font-medium leading-relaxed bg-[#F8FAFC] border border-[#E3EAF5] p-2.5 rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap">
                {activeAlert.message}
              </p>

              {/* Bottom Quick Action */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className={`w-full sm:w-auto px-4 py-1.5 rounded-xl font-bold text-[12px] text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    isUrgent 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-[#1677FF] hover:bg-blue-700"
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>OK / Dismiss</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
