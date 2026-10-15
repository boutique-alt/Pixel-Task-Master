"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  MessageSquare,
  Trash2
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";

export default function LeaveApply() {
  const {
    leaveTypes,
    leaveRequests,
    currentMember,
    setCurrentMember,
    members,
    applyLeave,
    deleteLeaveRequest,
  } = useCRM();

  const activeMemberName = currentMember === "all" ? (members[0]?.name || "Rahim") : (currentMember || "Rahim");
  const activeLeaveTypes = leaveTypes.filter((lt) => lt.active);

  const [leaveType, setLeaveType] = useState(activeLeaveTypes[0]?.name || "Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Keep selected leaveType valid when Admin adds/disables leave types
  useEffect(() => {
    if (activeLeaveTypes.length > 0 && !activeLeaveTypes.some((lt) => lt.name === leaveType)) {
      setLeaveType(activeLeaveTypes[0].name);
    }
  }, [activeLeaveTypes, leaveType]);

  // Calculate member's used & remaining days for a leave type
  const getBalanceForType = (typeName: string, maxDays: number) => {
    const used = leaveRequests
      .filter(
        (lr) =>
          lr.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase() &&
          lr.leaveType === typeName &&
          lr.status === "Approved"
      )
      .reduce((sum, lr) => sum + lr.days, 0);

    const pending = leaveRequests
      .filter(
        (lr) =>
          lr.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase() &&
          lr.leaveType === typeName &&
          lr.status === "Pending"
      )
      .reduce((sum, lr) => sum + lr.days, 0);

    const remaining = maxDays > 0 ? Math.max(0, maxDays - used) : null;
    return { used, pending, remaining, maxDays };
  };

  // Calculate requested days between startDate and endDate
  const calculateRequestedDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (leaveType.toLowerCase().includes("half") && diffDays === 1) {
      return 0.5;
    }
    return diffDays;
  };

  const requestedDays = calculateRequestedDays();
  const selectedTypeObj = activeLeaveTypes.find((lt) => lt.name === leaveType);
  const selectedBalance = selectedTypeObj
    ? getBalanceForType(selectedTypeObj.name, selectedTypeObj.maxDays)
    : { used: 0, pending: 0, remaining: null, maxDays: 0 };

  const isExceedingQuota =
    selectedBalance.remaining !== null && requestedDays > selectedBalance.remaining;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    if (requestedDays <= 0) {
      alert("End Date must be on or after the Start Date.");
      return;
    }
    if (isExceedingQuota) {
      alert(
        `Insufficient leave balance! You only have ${selectedBalance.remaining} day(s) of ${leaveType} remaining, but requested ${requestedDays} day(s).`
      );
      return;
    }

    applyLeave({
      member: activeMemberName,
      leaveType,
      startDate,
      endDate,
      days: requestedDays,
      reason: reason.trim(),
    });

    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const memberLeaveHistory = leaveRequests.filter((lr) => {
    const matchMember = lr.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase();
    if (!matchMember) return false;
    if (statusFilter !== "all" && lr.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
            <CalendarDays size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[24px] font-extrabold text-[#10254F] tracking-tight">
              Leave Management ({activeMemberName})
            </h2>
            <p className="text-[14px] text-[#64748B] font-medium">
              Select from Admin-approved leave options and track your real-time balance & approval status.
            </p>
          </div>
        </div>

        {/* Active Member Switcher */}
        <div className="flex items-center gap-2 bg-white border border-[#E3EAF5] rounded-xl px-3.5 py-2 shadow-sm self-start sm:self-auto">
          <Users size={16} className="text-[#8B5CF6]" />
          <span className="text-[12px] font-bold text-[#64748B]">Applying as:</span>
          <select
            value={activeMemberName}
            onChange={(e) => setCurrentMember(e.target.value)}
            className="text-[13px] font-extrabold text-[#8B5CF6] bg-transparent outline-none cursor-pointer"
          >
            {members.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Leave Balances Row - 2 per row on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        {activeLeaveTypes.map((lt) => {
          const bal = getBalanceForType(lt.name, lt.maxDays);
          const colorMap = {
            blue: { bg: "bg-[#1677FF]/10", text: "text-[#1677FF]" },
            orange: { bg: "bg-[#FF6B00]/10", text: "text-[#FF6B00]" },
            purple: { bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]" },
            green: { bg: "bg-[#10B981]/10", text: "text-[#10B981]" },
            gray: { bg: "bg-gray-100", text: "text-gray-600" },
          }[lt.color || "blue"];

          return (
            <div
              key={lt.id}
              className="bg-white rounded-[16px] sm:rounded-[20px] p-3.5 sm:p-5 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0"
            >
              <div className="min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[11px] sm:text-[13px] font-bold text-[#64748B] truncate">{lt.name}</p>
                  <span
                    className={`px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold uppercase shrink-0 ${
                      lt.isPaid ? "bg-[#10B981]/10 text-[#10B981]" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {lt.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>

                {lt.maxDays > 0 ? (
                  <>
                    <h3 className="text-[20px] sm:text-[28px] font-extrabold text-[#10254F] leading-none truncate">
                      {bal.remaining}{" "}
                      <span className="text-[11px] sm:text-[14px] font-semibold text-[#64748B]">/ {lt.maxDays}</span>
                    </h3>
                    <p className="text-[9px] sm:text-[11px] font-bold text-[#10B981] mt-1 sm:mt-1.5 flex items-center gap-1 truncate">
                      <CheckCircle size={11} className="shrink-0" /> {bal.remaining} left ({bal.used} used)
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-[20px] sm:text-[28px] font-extrabold text-[#10254F] leading-none truncate">
                      {bal.used} <span className="text-[11px] sm:text-[14px] font-semibold text-[#64748B]">days</span>
                    </h3>
                    <p className="text-[9px] sm:text-[11px] font-medium text-[#64748B] mt-1 sm:mt-1.5 flex items-center gap-1 truncate">
                      <Clock size={11} className="shrink-0" /> Total used
                    </p>
                  </>
                )}
              </div>

              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full ${colorMap.bg} ${colorMap.text} flex items-center justify-center shrink-0`}>
                <Calendar size={18} className="sm:w-[22px] sm:h-[22px]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[40%_58%] gap-6">
        {/* Application Form */}
        <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden h-max">
          <div className="p-6 border-b border-[#E3EAF5]">
            <h3 className="font-extrabold text-[#10254F] text-[18px]">Apply for Leave</h3>
            <p className="text-[12px] text-[#64748B] mt-1">
              Leave options below are dynamically managed by Admin.
            </p>
          </div>

          <form onSubmit={handleApply} className="p-6 space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-[#10254F] mb-2">
                Select Leave Type (Admin Options)
              </label>
              <div className="relative">
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full appearance-none bg-[#F3F6FB] border border-[#E3EAF5] text-[14px] font-bold text-[#10254F] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-colors cursor-pointer"
                >
                  {activeLeaveTypes.map((lt) => {
                    const b = getBalanceForType(lt.name, lt.maxDays);
                    return (
                      <option key={lt.id} value={lt.name}>
                        {lt.name}{" "}
                        {lt.maxDays > 0
                          ? `(${b.remaining} of ${lt.maxDays} days remaining)`
                          : `(Unlimited / Unpaid)`}
                      </option>
                    );
                  })}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#10254F] mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full bg-[#F3F6FB] border border-[#E3EAF5] text-[13px] font-semibold text-[#10254F] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#10254F] mb-2">End Date</label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#F3F6FB] border border-[#E3EAF5] text-[13px] font-semibold text-[#10254F] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-colors"
                />
              </div>
            </div>

            {/* Live Days & Quota Summary Pill */}
            {requestedDays > 0 && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-[12px] font-bold ${
                  isExceedingQuota
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-[#F3F6FB] border-[#E3EAF5] text-[#10254F]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isExceedingQuota ? <AlertCircle size={15} /> : <Calendar size={15} className="text-[#8B5CF6]" />}
                  Requested Duration: <strong>{requestedDays} {requestedDays === 1 ? "Day" : "Days"}</strong>
                </span>
                {selectedBalance.remaining !== null && (
                  <span>
                    {isExceedingQuota
                      ? `Exceeds remaining quota (${selectedBalance.remaining} left)!`
                      : `${selectedBalance.remaining - requestedDays} days will remain after approval`}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#10254F] mb-2">Reason for Leave</label>
              <textarea
                rows={4}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain the reason for your leave..."
                className="w-full bg-[#F3F6FB] border border-[#E3EAF5] text-[14px] font-medium text-[#10254F] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-colors resize-none placeholder:text-[#A6C0E6]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isExceedingQuota || activeLeaveTypes.length === 0}
              className={`w-full flex items-center justify-center gap-2 text-white text-[14px] font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_12px_rgba(139,92,246,0.3)] mt-2 cursor-pointer ${
                isExceedingQuota
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
              }`}
            >
              <Send size={18} /> Send Leave Request
            </button>
          </form>
        </div>

        {/* Leave History */}
        <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-6 border-b border-[#E3EAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-[#10254F] text-[18px]">
                {activeMemberName}&apos;s Leave History
              </h3>
              <p className="text-[12px] text-[#64748B] mt-1">
                Live status updates and remarks from Admin.
              </p>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[12px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-3 py-2 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Applications</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[#E3EAF5] text-[#64748B] text-[10px] uppercase tracking-wider font-extrabold bg-[#F3F6FB]/50">
                  <th className="p-4">Leave Type & Reason</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF5]">
                {memberLeaveHistory.map((leave) => (
                  <tr key={leave.id} className="hover:bg-[#F3F6FB]/30 transition-colors">
                    <td className="p-4">
                      <p className="font-extrabold text-[13px] text-[#10254F]">{leave.leaveType}</p>
                      <p className="text-[11px] font-medium text-[#64748B] mt-0.5 max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </p>
                      {leave.adminRemark && (
                        <p className="text-[11px] font-bold text-[#1677FF] mt-1 flex items-center gap-1">
                          <MessageSquare size={11} /> Admin: {leave.adminRemark}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[#14233F] text-[11px] font-bold whitespace-nowrap">
                        <Calendar size={12} className="text-[#64748B]" />
                        {leave.startDate} <span className="text-[#64748B] mx-0.5">to</span> {leave.endDate}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-[13px] text-[#10254F]">{leave.days}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md font-extrabold whitespace-nowrap ${
                          leave.status === "Approved"
                            ? "bg-[#10B981]/10 text-[#10B981]"
                            : leave.status === "Rejected"
                            ? "bg-red-50 text-red-600"
                            : "bg-[#FF6B00]/10 text-[#FF6B00]"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {leave.status === "Pending" ? (
                        <button
                          onClick={() => deleteLeaveRequest(leave.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Cancel Pending Request"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {memberLeaveHistory.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[13px] font-bold text-[#64748B]">No leave applications found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
