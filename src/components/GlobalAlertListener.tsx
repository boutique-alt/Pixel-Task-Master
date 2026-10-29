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

  // 6:00 PM Daily Reminder for Coordinator (and Admin): Remind Pixelians to update daily tasks
  useEffect(() => {
    // Target Coordinator and Admin so coordinator directly gets notified to instruct members
    const isTargetUser = sessionUser?.role === "coordinator" || sessionUser?.role === "admin" || !sessionUser;
    if (!isTargetUser) return;

    const checkDaily6PmReminder = () => {
      const now = new Date();
      const todayKey = now.toISOString().split("T")[0];
      const reminderDoneKey = `ptm_6pm_task_reminder_${todayKey}`;

      // Check if it's 6:00 PM (18:00 to 18:59)
      if (now.getHours() === 18) {
        const alreadyFired = localStorage.getItem(reminderDoneKey);
        if (!alreadyFired) {
          localStorage.setItem(reminderDoneKey, "true");
          // Play ringtone
          playAlertSound({ volume: 1.0 });
          // Native system notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("⏰ 6:00 PM Task Reminder", {
                body: "Please tell your Pixelians to update their daily tasks.",
                icon: "/icon-192.png",
              });
            } catch {}
          }
          // English voice announcement
          setTimeout(() => {
            speakText("Please tell your Pixelians to update their daily tasks.");
          }, 1200);
        }
      }
    };

    // Run immediately and every 30 seconds
    checkDaily6PmReminder();
    const interval = setInterval(checkDaily6PmReminder, 30000);
    return () => clearInterval(interval);
  }, [sessionUser]);

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

      {/* In-App Alert Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className={`bg-white rounded-[26px] shadow-2xl max-w-lg w-full overflow-hidden border-2 ${
              isUrgent ? "border-red-400 ring-4 ring-red-100" : "border-blue-300 ring-4 ring-blue-50"
            } animate-in zoom-in-95 duration-200`}
          >
            {/* Top Header Banner */}
            <div 
              className={`p-5 flex items-center justify-between text-white ${
                isUrgent 
                  ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600" 
                  : "bg-gradient-to-r from-[#1677FF] via-blue-600 to-indigo-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-sm animate-bounce">
                  {isUrgent ? <AlertTriangle size={24} /> : <Megaphone size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                      {isUrgent ? "Urgent Alert" : "Announcement"}
                    </span>
                    <span className="text-[11px] opacity-90 font-medium">
                      • {activeAlert.createdTimeDisplay}
                    </span>
                  </div>
                  <h2 className="text-[17px] font-extrabold leading-tight mt-0.5">
                    New Message from Admin
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                <Volume2 size={14} className="animate-pulse" />
                <span>Ringing</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Target pill */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-gray-400">Target:</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  activeAlert.targetType === "all" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}>
                  {activeAlert.targetType === "all" ? "Entire Team" : `Direct to ${activeAlert.targetMember}`}
                </span>
              </div>

              {/* Single Message Display */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E3EAF5] rounded-2xl">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Message from Admin
                </label>
                <p className="text-[15px] text-[#1E293B] font-semibold leading-relaxed whitespace-pre-wrap">
                  {activeAlert.message}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-gray-50 border-t border-[#E3EAF5] flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
                <Bell size={13} className="text-[#1677FF]" />
                <span>Click Acknowledge to confirm and stop ringtone</span>
              </p>

              <button
                type="button"
                onClick={handleAcknowledge}
                className={`px-6 py-2.5 rounded-xl font-extrabold text-[13px] text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  isUrgent 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                    : "bg-[#1677FF] hover:bg-blue-700 shadow-blue-200"
                }`}
              >
                <CheckCircle2 size={16} />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
