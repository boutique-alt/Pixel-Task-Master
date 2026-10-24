"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCRM, BroadcastAlert } from "@/context/CRMContext";
import { playAlertSound, stopAlertSound } from "@/lib/soundService";
import { Bell, CheckCircle2, AlertTriangle, Megaphone, Volume2, X } from "lucide-react";

export default function GlobalAlertListener() {
  const { broadcastAlerts, sessionUser, currentMember, acknowledgeAlert } = useCRM();

  const [activeAlert, setActiveAlert] = useState<BroadcastAlert | null>(null);
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  // Determine active member identity
  const activeName = (sessionUser?.name || currentMember || "").trim();

  useEffect(() => {
    // Load local acknowledged alert IDs
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
  }, []);

  useEffect(() => {
    if (!broadcastAlerts || broadcastAlerts.length === 0 || !activeName) return;

    // Filter alerts meant for this user
    const userAlerts = broadcastAlerts.filter((alert) => {
      if (alert.targetType === "all") return true;
      if (alert.targetType === "individual" && alert.targetMember) {
        return alert.targetMember.trim().toLowerCase() === activeName.toLowerCase();
      }
      return false;
    });

    // Find the latest unacknowledged alert that hasn't been closed/seen yet
    const pendingAlert = userAlerts.find((alert) => {
      // Already recorded in backend DB
      if (alert.acknowledgedBy && alert.acknowledgedBy.some((m) => m.toLowerCase() === activeName.toLowerCase())) {
        return false;
      }
      // Already seen in this browser session
      if (seenAlertIdsRef.current.has(alert.id)) {
        return false;
      }
      return true;
    });

    if (pendingAlert && (!activeAlert || activeAlert.id !== pendingAlert.id)) {
      setActiveAlert(pendingAlert);
      // Play user's provided ringtone!
      playAlertSound({ volume: pendingAlert.priority === "urgent" ? 1.0 : 0.85 });
    }
  }, [broadcastAlerts, activeName, activeAlert]);

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

  if (!activeAlert) return null;

  const isUrgent = activeAlert.priority === "urgent";

  return (
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
                  {isUrgent ? "🚨 Urgent Alert" : "📢 Office Announcement"}
                </span>
                <span className="text-[11px] opacity-90 font-medium">
                  • {activeAlert.createdTimeDisplay}
                </span>
              </div>
              <h2 className="text-[17px] font-extrabold leading-tight mt-0.5">
                New Alert from Admin
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
          {/* Target audience pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-gray-400">Target:</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              activeAlert.targetType === "all" 
                ? "bg-blue-50 text-blue-700 border border-blue-200" 
                : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}>
              {activeAlert.targetType === "all" ? "👥 Entire Team" : `👤 Direct to ${activeAlert.targetMember}`}
            </span>
          </div>

          {/* Subject / বিষয় */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
              বিষয় (Subject)
            </label>
            <h3 className="text-[19px] font-black text-[#10254F] leading-snug">
              {activeAlert.title}
            </h3>
          </div>

          {/* Detailed Message / বিস্তারিত মেসেজ */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E3EAF5] rounded-2xl">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
              বিস্তারিত মেসেজ (Details)
            </label>
            <p className="text-[14px] text-[#334155] font-medium leading-relaxed whitespace-pre-wrap">
              {activeAlert.message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-[#E3EAF5] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
            <Bell size={13} className="text-[#1677FF]" />
            <span>Clicking "ঠিক আছে" acknowledges this alert</span>
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
            <span>ঠিক আছে / Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
