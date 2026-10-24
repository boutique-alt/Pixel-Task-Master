"use client";

import React, { useState } from "react";
import { useCRM, Member } from "@/context/CRMContext";
import { playAlertSound, stopAlertSound } from "@/lib/soundService";
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  AlertTriangle, 
  Megaphone, 
  Volume2, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Calendar,
  Sparkles,
  Info
} from "lucide-react";

export default function AdminAlertsPage() {
  const { members, broadcastAlerts, sendBroadcastAlert, deleteBroadcastAlert } = useCRM();

  // Form states - Simple: বিষয় & বিস্তারিত মেসেজ + Target
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "individual">("all");
  const [targetMember, setTargetMember] = useState<string>(members[0]?.name || "Rahim");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  const [isSending, setIsSending] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleTestRingtone = () => {
    if (isPlayingTest) {
      stopAlertSound();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      playAlertSound({ volume: priority === "urgent" ? 1.0 : 0.9 });
      setTimeout(() => setIsPlayingTest(false), 5000);
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("অনুগ্রহ করে বিষয় এবং বিস্তারিত মেসেজ লিখুন।");
      return;
    }

    setIsSending(true);
    try {
      await sendBroadcastAlert({
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetMember: targetType === "individual" ? targetMember : undefined,
        priority,
      });

      // Reset form
      setTitle("");
      setMessage("");
      showToast(
        targetType === "all"
          ? "📢 পুরো টিমের কাছে নোটিফিকেশন পাঠানো হয়েছে এবং তাদের ডিভাইসে রিংটোন বাজছে!"
          : `📢 ${targetMember}-এর কাছে নোটিফিকেশন পাঠানো হয়েছে এবং তার ডিভাইসে রিংটোন বাজছে!`
      );
    } catch (err) {
      console.error("Failed to send alert:", err);
      alert("অ্যালার্ট পাঠাতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E3EAF5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center font-black shadow-sm">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#10254F] tracking-tight">
              Alerts &amp; Announcements
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
              Send instant notices and alerts with ringtone to all team members or specific individuals.
            </p>
          </div>
        </div>

        {/* Ringtone Audio Preview */}
        <button
          type="button"
          onClick={handleTestRingtone}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isPlayingTest 
              ? "bg-amber-500 text-white shadow-md animate-pulse" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
          title="Play the custom ringtone"
        >
          <Volume2 size={16} />
          <span>{isPlayingTest ? "Playing Ringtone..." : "Test Ringtone"}</span>
        </button>
      </div>

      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simple Compose Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E3EAF5] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E3EAF5] pb-4">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-[#1677FF]" />
              <h2 className="text-base font-black text-[#10254F]">Create New Alert</h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🎵 Custom Ringtone Connected
            </span>
          </div>

          <form onSubmit={handleSendAlert} className="space-y-4">
            
            {/* 1. Target Audience (All Team or Specific Member) */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                কাকে পাঠাবেন (Target Audience) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType("all")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    targetType === "all"
                      ? "border-[#1677FF] bg-blue-50/70 text-[#1677FF] font-extrabold shadow-sm"
                      : "border-[#E3EAF5] bg-gray-50/50 text-[#64748B] hover:bg-gray-100 font-medium"
                  }`}
                >
                  <Users size={18} />
                  <div>
                    <p className="text-[12px] leading-none">পুরো টিম (All Team)</p>
                    <p className="text-[10px] opacity-75 mt-0.5">অফিসের সব সদস্য</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("individual")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    targetType === "individual"
                      ? "border-purple-500 bg-purple-50/70 text-purple-700 font-extrabold shadow-sm"
                      : "border-[#E3EAF5] bg-gray-50/50 text-[#64748B] hover:bg-gray-100 font-medium"
                  }`}
                >
                  <User size={18} />
                  <div>
                    <p className="text-[12px] leading-none">নির্দিষ্ট মেম্বার (Individual)</p>
                    <p className="text-[10px] opacity-75 mt-0.5">শুধু একজন সদস্য</p>
                  </div>
                </button>
              </div>

              {/* If Individual is selected, show member dropdown */}
              {targetType === "individual" && (
                <div className="mt-3 p-3 bg-purple-50/40 border border-purple-200 rounded-2xl space-y-1.5 animate-in fade-in">
                  <label className="text-[11px] font-bold text-purple-900 uppercase">
                    মেম্বার সিলেক্ট করুন (Select Member) *
                  </label>
                  <select
                    value={targetMember}
                    onChange={(e) => setTargetMember(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-400 outline-none text-[#10254F]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role || "Team Member"})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Alert Priority (Normal / Urgent) */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                অ্যালার্টের ধরন (Priority)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority("normal")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    priority === "normal"
                      ? "border-blue-400 bg-blue-50 text-blue-700 font-extrabold"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Megaphone size={14} />
                  <span>সাধারণ নোটিশ (Notice)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("urgent")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    priority === "urgent"
                      ? "border-red-400 bg-red-50 text-red-700 font-extrabold"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <AlertTriangle size={14} />
                  <span>জরুরি অ্যালার্ট (Urgent)</span>
                </button>
              </div>
            </div>

            {/* 3. বিষয় (Subject / Title) */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                বিষয় (Subject / Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: আজকের জরুরি মিটিং / ক্লায়েন্ট আপডেট..."
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-bold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
              />
            </div>

            {/* 4. বিস্তারিত মেসেজ (Detailed Message) */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                বিস্তারিত মেসেজ (Detailed Message) *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="বিস্তারিত বার্তা এখানে লিখুন..."
                className="w-full p-3.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className={`w-full py-3 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  priority === "urgent"
                    ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                    : "bg-[#1677FF] hover:bg-blue-700 shadow-blue-200"
                }`}
              >
                <Send size={17} />
                <span>
                  {isSending ? "Sending Alert..." : "Send Alert & Ring Devices"}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Sent Alerts History & Acknowledgment Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E3EAF5] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E3EAF5] pb-3 mb-4">
              <h3 className="text-sm font-black text-[#10254F] flex items-center gap-2">
                <Clock size={16} className="text-[#1677FF]" />
                <span>Recent Alerts History ({broadcastAlerts.length})</span>
              </h3>
            </div>

            {broadcastAlerts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Bell size={28} className="mx-auto opacity-30" />
                <p className="text-xs font-semibold">কোনো অ্যালার্ট হিস্ট্রি পাওয়া যায়নি।</p>
                <p className="text-[11px] text-gray-400">নতুন অ্যালার্ট তৈরি করতে বামপাশের ফর্ম ব্যবহার করুন।</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {broadcastAlerts.map((alert) => {
                  const ackCount = alert.acknowledgedBy ? alert.acknowledgedBy.length : 0;
                  const isUrgent = alert.priority === "urgent";

                  return (
                    <div
                      key={alert.id}
                      className="p-4 rounded-2xl border border-[#E3EAF5] bg-[#F8FAFC] hover:bg-white transition-colors space-y-2.5 relative group"
                    >
                      {/* Alert Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isUrgent ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {isUrgent ? "🚨 Urgent" : "📢 Notice"}
                          </span>

                          <span className="text-[10px] font-bold bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {alert.targetType === "all" ? "👥 All Team" : `👤 ${alert.targetMember}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete alert "${alert.title}"?`)) {
                              deleteBroadcastAlert(alert.id);
                              showToast("অ্যালার্ট ডিলিট করা হয়েছে।");
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"
                          title="Delete alert"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Title & Message */}
                      <div>
                        <h4 className="text-[13px] font-black text-[#10254F] leading-snug">
                          {alert.title}
                        </h4>
                        <p className="text-[12px] text-[#475569] font-medium mt-1 line-clamp-3 whitespace-pre-wrap">
                          {alert.message}
                        </p>
                      </div>

                      {/* Footer: Timestamp & Acknowledged status */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {alert.createdDate} • {alert.createdTimeDisplay}
                        </span>

                        <span className="font-bold flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Seen by: {ackCount}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
