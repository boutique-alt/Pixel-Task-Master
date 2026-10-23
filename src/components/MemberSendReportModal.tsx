"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  Send, 
  ExternalLink,
  Sparkles,
  User,
  ListTodo,
  CheckSquare,
  ShieldCheck
} from "lucide-react";
import { useCRM, parseTimeToMs } from "@/context/CRMContext";

interface MemberSendReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
}

export const ADMIN_REPORT_WHATSAPP_NUMBER = "8240017974"; // Sir / Admin WhatsApp Number

export default function MemberSendReportModal({
  isOpen,
  onClose,
  memberName,
}: MemberSendReportModalProps) {
  const { clients, attendanceRecords, currentMember, members, sessionUser } = useCRM();

  const [dateStr, setDateStr] = useState("");
  const [memberNote, setMemberNote] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const activeName = memberName || currentMember || sessionUser?.name || "Rahim";

  // Find member details
  const memberObj = members.find(
    (m) => m.name.trim().toLowerCase() === activeName.trim().toLowerCase()
  );

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDateStr(today);
  }, []);

  useEffect(() => {
    setMemberNote("");
    setIsCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Get today's attendance for this member
  const attendance = attendanceRecords.find(
    (r) =>
      r.date === dateStr &&
      r.member.trim().toLowerCase() === activeName.trim().toLowerCase()
  );

  let checkInDisplay = "Not Checked In";
  let checkOutDisplay = "—";
  let totalHoursDisplay = "—";
  let attendanceStatus = "Absent";

  if (attendance) {
    checkInDisplay = attendance.checkInTime
      ? attendance.checkInTime.replace(/:\d{2}\s/, " ")
      : "Not recorded";
    checkOutDisplay = attendance.checkOutTime
      ? attendance.checkOutTime.replace(/:\d{2}\s/, " ")
      : "Still Working (Active)";
    attendanceStatus = attendance.status || "On Time";

    if (attendance.workingMinutes !== undefined) {
      const h = Math.floor(attendance.workingMinutes / 60);
      const m = attendance.workingMinutes % 60;
      totalHoursDisplay = `${h} hrs ${m} mins`;
    } else if (attendance.checkInTime) {
      const inMs = parseTimeToMs(attendance.date, attendance.checkInTime) || attendance.checkInTimestamp;
      const outMs = attendance.checkOutTime
        ? (parseTimeToMs(attendance.date, attendance.checkOutTime) || attendance.checkOutTimestamp)
        : Date.now();
      if (inMs && outMs && outMs > inMs) {
        const diffMins = Math.round((outMs - inMs) / 60000);
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        totalHoursDisplay = `${h} hrs ${m} mins`;
      }
    }
  }

  // 2. Get assigned tasks for this member
  const memberTasks = clients.filter(
    (c) => (c.member || "").trim().toLowerCase() === activeName.trim().toLowerCase()
  );

  const doneTasks = memberTasks.filter((c) => c.status === "Done");
  const pendingTasks = memberTasks.filter(
    (c) => c.status === "Pending" || c.status === "In Progress"
  );
  const cantDoTasks = memberTasks.filter((c) => c.status === "Can't Do");

  // Format date display
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  // 3. Build WhatsApp Text to Sir/Admin
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];

    lines.push(`📋 *DAILY WORK & ATTENDANCE REPORT*`);
    lines.push(`🏢 *Pixel Task Master*`);
    lines.push(`📅 *Date:* ${formattedDate}`);
    lines.push(`👤 *Report From:* ${activeName} (${memberObj?.role || "Team Member"})`);
    if (memberObj?.phone) {
      lines.push(`📱 *Member Phone:* ${memberObj.phone}`);
    }
    lines.push(`------------------------------------------`);

    // Attendance Summary
    lines.push(`⏱️ *ATTENDANCE DETAILS:*`);
    lines.push(`• *Status:* ${attendance ? `Present (${attendanceStatus})` : "Absent / Not Checked In"}`);
    lines.push(`• *Check-In:* ${checkInDisplay}`);
    lines.push(`• *Check-Out:* ${checkOutDisplay}`);
    if (totalHoursDisplay !== "—") {
      lines.push(`• *Total Work:* ${totalHoursDisplay}`);
    }
    lines.push(``);

    // Done Tasks Section
    lines.push(`✅ *TASKS COMPLETED TODAY (${doneTasks.length}):*`);
    if (doneTasks.length === 0) {
      lines.push(`  _None recorded as completed today_`);
    } else {
      doneTasks.forEach((t, i) => {
        const detail = t.taskDetails ? ` - ${t.taskDetails}` : "";
        lines.push(`  ${i + 1}. *${t.name}* (${t.category})${detail}`);
      });
    }
    lines.push(``);

    // Remaining / Pending Tasks Section
    lines.push(`⏳ *REMAINING / PENDING TASKS (${pendingTasks.length}):*`);
    if (pendingTasks.length === 0) {
      lines.push(`  _All tasks finished for today! 🎉_`);
    } else {
      pendingTasks.forEach((t, i) => {
        const statusPill = t.status === "In Progress" ? "[In Progress]" : "[Pending]";
        const detail = t.taskDetails ? ` - ${t.taskDetails}` : "";
        lines.push(`  ${i + 1}. *${t.name}* ${statusPill}${detail}`);
      });
    }

    if (cantDoTasks.length > 0) {
      lines.push(``);
      lines.push(`⚠️ *CANNOT DO / ON HOLD (${cantDoTasks.length}):*`);
      cantDoTasks.forEach((t, i) => {
        const reason = t.reason ? ` (Reason: ${t.reason})` : "";
        lines.push(`  ${i + 1}. *${t.name}*${reason}`);
      });
    }

    // Member's Note to Sir
    if (memberNote.trim()) {
      lines.push(``);
      lines.push(`💬 *MEMBER REMARKS / NOTE TO SIR:*`);
      lines.push(`"${memberNote.trim()}"`);
    }

    lines.push(`------------------------------------------`);
    lines.push(`_Submitted directly to Admin (${ADMIN_REPORT_WHATSAPP_NUMBER}) via Pixel Task Master_`);

    return lines.join("\n");
  };

  const handleSendToAdmin = () => {
    const message = buildWhatsAppMessage();
    // India country code 91 + 8240017974
    const destinationPhone = `91${ADMIN_REPORT_WHATSAPP_NUMBER}`;
    const url = `https://wa.me/${destinationPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyReport = () => {
    const message = buildWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const memberPresets = [
    "Sir, I have finished all assigned tasks for today! 🎉",
    "Checked out for the day. Remaining tasks will be done tomorrow morning. ⏳",
    "Completed today's urgent client requests. Thank you sir! 🙏",
    "Updated client task remarks before checkout. 👍",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-[26px] shadow-2xl max-w-xl w-full overflow-hidden border border-[#E3EAF5] flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E3EAF5] bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#10254F] leading-tight">
                Send Daily Report to Sir
              </h3>
              <p className="text-[12px] text-[#64748B] font-medium flex items-center gap-1.5 mt-0.5">
                <span>Sending to WhatsApp:</span>
                <strong className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px] font-mono">
                  +91 {ADMIN_REPORT_WHATSAPP_NUMBER}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#10254F] p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-center gap-1">
                <Clock size={12} className="text-[#1677FF]" />
                <span>Attendance</span>
              </div>
              <div className="text-[13px] font-extrabold text-[#10254F] mt-0.5 truncate">
                {attendance ? attendanceStatus : "Absent"}
              </div>
              <div className="text-[10px] text-[#64748B] font-medium truncate">
                {totalHoursDisplay !== "—" ? totalHoursDisplay : checkInDisplay}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Tasks Done</span>
              </div>
              <div className="text-[16px] font-black text-emerald-700 mt-0.5">
                {doneTasks.length}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium truncate">
                Completed
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center justify-center gap-1">
                <ListTodo size={12} className="text-amber-600" />
                <span>Remaining</span>
              </div>
              <div className="text-[16px] font-black text-amber-700 mt-0.5">
                {pendingTasks.length}
              </div>
              <div className="text-[10px] text-amber-700 font-medium truncate">
                Pending
              </div>
            </div>
          </div>

          {/* Member's Personal Note to Sir */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-[#10254F] uppercase">
                Your Closing Remarks / Message to Sir (Optional)
              </label>
              <span className="text-[10px] text-[#64748B]">Included in WhatsApp report</span>
            </div>
            <textarea
              rows={2}
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
              placeholder="e.g. Sir, I finished all assigned client tasks today. Tomorrow I will start on new website assets."
              className="w-full p-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
            {/* Quick Member Presets */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {memberPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMemberNote(preset)}
                  className="text-[10px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-[#64748B] px-2 py-0.5 rounded-md font-medium border border-[#E3EAF5] transition-colors cursor-pointer text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Message Preview Box */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-[#10254F] uppercase flex items-center gap-1">
                <Sparkles size={13} className="text-emerald-600" />
                Preview: Report to {ADMIN_REPORT_WHATSAPP_NUMBER}
              </label>
              <button
                type="button"
                onClick={handleCopyReport}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 bg-[#0b141a]/95 text-[#e9edef] rounded-xl font-mono text-[11px] sm:text-[12px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all border border-[#222e35] shadow-inner">
              {buildWhatsAppMessage()}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E3EAF5] bg-[#F8FAFC] flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-[#E3EAF5] rounded-xl font-bold text-[13px] text-[#64748B] hover:bg-white transition-colors"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex-1 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            <span>{isCopied ? "Copied!" : "Copy Report"}</span>
          </button>

          <button
            type="button"
            onClick={handleSendToAdmin}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <MessageCircle size={17} />
            <span>Send to Sir (8240017974)</span>
            <ExternalLink size={14} className="opacity-80" />
          </button>
        </div>

      </div>
    </div>
  );
}