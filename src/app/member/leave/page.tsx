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
  Trash2,
  Sparkles,
  Check,
  Search,
  CheckSquare,
  Square
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { MAX_MEMBER_HOLIDAYS_QUOTA, formatHolidayDate } from "@/lib/holidayData";

export default function LeaveApply() {
  const {
    leaveTypes,
    leaveRequests,
    currentMember,
    setCurrentMember,
    members,
    applyLeave,
    deleteLeaveRequest,
    companyHolidays,
    memberHolidaySelections,
    saveMemberHolidaySelection,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<"holidays" | "regular">("holidays");

  const activeMemberName = currentMember === "all" ? (members[0]?.name || "Rahim") : (currentMember || "Rahim");
  const activeLeaveTypes = leaveTypes.filter((lt) => lt.active);

  // Regular Leave form state
  const [leaveType, setLeaveType] = useState(activeLeaveTypes[0]?.name || "Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Holiday Selection State for current member
  const memberSelection = memberHolidaySelections.find(
    (s) => s.member.toLowerCase() === activeMemberName.trim().toLowerCase()
  );

  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [holidaySearch, setHolidaySearch] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Sync selected holiday ids when active member or saved selection changes
  useEffect(() => {
    if (memberSelection) {
      setSelectedHolidayIds(memberSelection.selectedHolidayIds || []);
    } else {
      setSelectedHolidayIds([]);
    }
    setSaveSuccessMsg("");
  }, [activeMemberName, memberSelection]);

  // Keep selected leaveType valid when Admin adds/disables leave types
  useEffect(() => {
    if (activeLeaveTypes.length > 0 && !activeLeaveTypes.some((lt) => lt.name === leaveType)) {
      setLeaveType(activeLeaveTypes[0].name);
    }
  }, [activeLeaveTypes, leaveType]);

  const toggleHoliday = (id: string) => {
    setSaveSuccessMsg("");
    if (selectedHolidayIds.includes(id)) {
      setSelectedHolidayIds(selectedHolidayIds.filter((item) => item !== id));
    } else {
      if (selectedHolidayIds.length >= MAX_MEMBER_HOLIDAYS_QUOTA) {
        alert(`You can select at most ${MAX_MEMBER_HOLIDAYS_QUOTA} holidays in total! Deselect one to add another.`);
        return;
      }
      setSelectedHolidayIds([...selectedHolidayIds, id]);
    }
  };

  const handleSaveHolidays = () => {
    saveMemberHolidaySelection(activeMemberName, selectedHolidayIds);
    setSaveSuccessMsg("Your holiday choices have been submitted for Admin approval!");
    setTimeout(() => setSaveSuccessMsg(""), 5000);
  };

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

  const handleApplyRegular = (e: React.FormEvent) => {
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

  const filteredHolidays = companyHolidays.filter((h) => {
    if (!holidaySearch.trim()) return true;
    const q = holidaySearch.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.date.includes(q) || h.day.toLowerCase().includes(q);
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
              Holiday & Leave Selection ({activeMemberName})
            </h2>
            <p className="text-[14px] text-[#64748B] font-medium">
              Choose your allowed holidays (up to {MAX_MEMBER_HOLIDAYS_QUOTA} days), modify anytime, or apply for regular leaves.
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

      {/* Main Tabs: Holiday Selection vs Other Regular Leave */}
      <div className="flex items-center gap-3 border-b border-[#E3EAF5] pb-2">
        <button
          onClick={() => setActiveTab("holidays")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-extrabold transition-all cursor-pointer ${
            activeTab === "holidays"
              ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20"
              : "bg-white text-[#64748B] hover:bg-[#F8FAFC] border border-[#E3EAF5]"
          }`}
        >
          <Sparkles size={16} />
          <span>My Chosen Holidays ({selectedHolidayIds.length}/{MAX_MEMBER_HOLIDAYS_QUOTA})</span>
        </button>

        <button
          onClick={() => setActiveTab("regular")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-extrabold transition-all cursor-pointer ${
            activeTab === "regular"
              ? "bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20"
              : "bg-white text-[#64748B] hover:bg-[#F8FAFC] border border-[#E3EAF5]"
          }`}
        >
          <Calendar size={16} />
          <span>Other Leave Application (Casual / Sick)</span>
        </button>
      </div>

      {/* TAB 1: HOLIDAY SELECTION */}
      {activeTab === "holidays" && (
        <div className="space-y-5">
          {/* Status & Quota Banner */}
          <div className="bg-gradient-to-r from-[#10254F] to-[#1E3A8A] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[18px] font-extrabold">Total Quota: {MAX_MEMBER_HOLIDAYS_QUOTA} Days</span>
                {memberSelection && (
                  <span
                    className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      memberSelection.status === "Approved"
                        ? "bg-emerald-500 text-white"
                        : memberSelection.status === "Rejected"
                        ? "bg-red-500 text-white"
                        : "bg-amber-400 text-slate-900"
                    }`}
                  >
                    Status: {memberSelection.status}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-blue-100 font-medium">
                You can select which holidays to take off. If you skip a festival holiday, you can pick another one anytime.
              </p>
              {memberSelection?.adminRemark && (
                <p className="text-[12px] bg-white/10 px-3 py-1 rounded-lg text-amber-200 mt-2 font-semibold">
                  Admin Remark: {memberSelection.adminRemark}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl border border-white/15">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Selected</p>
                <p className="text-[22px] font-extrabold leading-tight text-white">{selectedHolidayIds.length}</p>
              </div>
              <div className="h-8 w-[1px] bg-white/20" />
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Remaining</p>
                <p className="text-[22px] font-extrabold leading-tight text-amber-300">
                  {Math.max(0, MAX_MEMBER_HOLIDAYS_QUOTA - selectedHolidayIds.length)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAF5] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={holidaySearch}
                onChange={(e) => setHolidaySearch(e.target.value)}
                placeholder="Search holiday name, date, day..."
                className="w-full pl-10 pr-4 py-2 border border-[#E3EAF5] rounded-xl text-[13px] outline-none focus:border-[#1677FF] font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {saveSuccessMsg && (
                <span className="text-[12px] font-extrabold text-emerald-600 flex items-center gap-1.5">
                  <Check size={16} /> {saveSuccessMsg}
                </span>
              )}
              <button
                onClick={handleSaveHolidays}
                className="bg-[#1677FF] hover:bg-[#1260cc] text-white px-5 py-2.5 rounded-xl font-extrabold text-[13px] shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Send size={15} />
                <span>Submit / Update ({selectedHolidayIds.length} Selected)</span>
              </button>
            </div>
          </div>

          {/* Holiday Checklist Table */}
          <div className="bg-white rounded-2xl border border-[#E3EAF5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3EAF5] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                    <th className="p-4 w-14 text-center">Select</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Day</th>
                    <th className="p-4">Holiday Name</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF5]">
                  {filteredHolidays.map((h) => {
                    const isSelected = selectedHolidayIds.includes(h.id);
                    return (
                      <tr
                        key={h.id}
                        onClick={() => toggleHoliday(h.id)}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected ? "bg-blue-50/70 hover:bg-blue-50" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleHoliday(h.id)}
                            className="cursor-pointer text-[#1677FF] transition-transform active:scale-90"
                          >
                            {isSelected ? (
                              <CheckSquare size={20} className="text-[#1677FF]" />
                            ) : (
                              <Square size={20} className="text-[#94A3B8]" />
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-[13px] text-[#10254F] font-medium">
                            {formatHolidayDate(h.date)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[12px] font-bold text-[#64748B]">
                            {h.day}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[13px] font-extrabold ${isSelected ? "text-[#1677FF]" : "text-[#1E293B]"}`}>
                            {h.name}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#1677FF]/10 text-[#1677FF]">
                              <Check size={12} strokeWidth={3} /> Chosen
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8] font-semibold">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHolidays.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#64748B] text-[13px] font-bold">
                        No holidays found matching &ldquo;{holidaySearch}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGULAR LEAVE APPLICATION (Casual, Sick, etc.) */}
      {activeTab === "regular" && (
        <div className="space-y-6">
          {/* Leave Quota Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeLeaveTypes.map((type) => {
              const balance = getBalanceForType(type.name, type.maxDays);
              const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
                blue: { bg: "bg-blue-50/50", text: "text-[#1677FF]", badge: "bg-blue-100 text-[#1677FF]" },
                orange: { bg: "bg-orange-50/50", text: "text-[#FF6B00]", badge: "bg-orange-100 text-[#FF6B00]" },
                purple: { bg: "bg-purple-50/50", text: "text-[#8B5CF6]", badge: "bg-purple-100 text-[#8B5CF6]" },
                green: { bg: "bg-emerald-50/50", text: "text-[#10B981]", badge: "bg-emerald-100 text-[#10B981]" },
                gray: { bg: "bg-gray-50/50", text: "text-[#64748B]", badge: "bg-gray-100 text-[#64748B]" },
              };
              const style = colorMap[type.color] || colorMap.blue;

              return (
                <div
                  key={type.id}
                  className={`p-4 rounded-2xl border border-[#E3EAF5] ${style.bg} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[#64748B]">{type.name}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {type.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[26px] font-extrabold ${style.text}`}>
                      {balance.remaining !== null ? balance.remaining : "∞"}
                    </span>
                    <span className="text-[12px] font-bold text-[#64748B]">
                      {type.maxDays > 0 ? `/ ${type.maxDays} left` : "unlimited"}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E3EAF5]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Used: {balance.used}d</span>
                    {balance.pending > 0 && (
                      <span className="text-[#FF6B00] font-bold">Pending: {balance.pending}d</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Apply Leave Form */}
            <div className="bg-white p-5 rounded-2xl border border-[#E3EAF5] shadow-sm lg:col-span-1">
              <h3 className="text-[16px] font-extrabold text-[#10254F] mb-4 flex items-center gap-2">
                <Send size={16} className="text-[#8B5CF6]" />
                Submit Leave Application
              </h3>

              <form onSubmit={handleApplyRegular} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E3EAF5] rounded-xl text-[13px] font-bold text-[#10254F] outline-none focus:border-[#8B5CF6] transition-colors"
                  >
                    {activeLeaveTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.maxDays > 0 ? `(${t.maxDays} days/yr)` : "(Unpaid)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E3EAF5] rounded-xl text-[12px] font-bold text-[#10254F] outline-none focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E3EAF5] rounded-xl text-[12px] font-bold text-[#10254F] outline-none focus:border-[#8B5CF6] transition-colors"
                    />
                  </div>
                </div>

                {startDate && endDate && (
                  <div
                    className={`p-3 rounded-xl border text-[12px] font-bold flex items-center justify-between ${
                      isExceedingQuota
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-blue-50 border-blue-200 text-[#1677FF]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> Total Duration:
                    </span>
                    <span>
                      {requestedDays} day{requestedDays > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1">Reason / Note</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly state reason for leave..."
                    className="w-full px-3 py-2 border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] outline-none focus:border-[#8B5CF6] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isExceedingQuota}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-[13px] text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                    isExceedingQuota
                      ? "bg-[#94A3B8] cursor-not-allowed"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] cursor-pointer"
                  }`}
                >
                  <Send size={15} />
                  Submit for Approval
                </button>
              </form>
            </div>

            {/* Leave History Table */}
            <div className="bg-white p-5 rounded-2xl border border-[#E3EAF5] shadow-sm lg:col-span-2 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-[16px] font-extrabold text-[#10254F] flex items-center gap-2">
                  <Clock size={16} className="text-[#1677FF]" />
                  My Regular Leave Requests
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#64748B]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[12px] font-extrabold text-[#1677FF] bg-[#1677FF]/10 px-2.5 py-1 rounded-lg outline-none cursor-pointer border-0"
                  >
                    <option value="all">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E3EAF5] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                      <th className="p-3">Type & Reason</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAF5]">
                    {memberLeaveHistory.map((leave) => (
                      <tr key={leave.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3">
                          <span className="font-extrabold text-[13px] text-[#10254F] block">
                            {leave.leaveType}
                          </span>
                          <p className="text-[11px] text-[#64748B] font-medium line-clamp-1">
                            {leave.reason}
                          </p>
                          {leave.adminRemark && (
                            <p className="text-[10px] font-bold text-[#1677FF] mt-0.5 flex items-center gap-1">
                              <MessageSquare size={10} /> Admin: {leave.adminRemark}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-[#14233F] text-[11px] font-bold whitespace-nowrap">
                            <Calendar size={11} className="text-[#64748B]" />
                            {leave.startDate} to {leave.endDate}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-[12px] text-[#10254F]">{leave.days}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md font-extrabold whitespace-nowrap ${
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
                        <td className="p-3 text-center">
                          {leave.status === "Pending" ? (
                            <button
                              onClick={() => deleteLeaveRequest(leave.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Request"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {memberLeaveHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#64748B] text-[12px] font-bold">
                          No regular leave applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
