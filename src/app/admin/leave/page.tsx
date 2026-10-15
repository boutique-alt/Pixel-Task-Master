"use client";

import { useState } from "react";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Search,
  UserCheck,
  X,
  Settings2,
  Calendar,
  MessageSquare
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { useCRM, LeaveTypeOption, LeaveRequest } from "@/context/CRMContext";

export default function AdminLeavePage() {
  const {
    members,
    leaveTypes,
    leaveRequests,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    updateLeaveRequestStatus,
    deleteLeaveRequest,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals for Leave Type CRUD
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveTypeOption | null>(null);

  // Modal for reviewing / adding admin remark to a Leave Request
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);

  const memberNames = members.map((m) => m.name);

  // Stats
  const pendingCount = leaveRequests.filter((r) => r.status === "Pending").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "Approved").length;
  const activeTypesCount = leaveTypes.filter((t) => t.active).length;
  const totalApprovedDays = leaveRequests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + r.days, 0);

  // Helper to get a member's used and remaining days for a given leave type
  const getMemberBalance = (memberName: string, typeName: string) => {
    const typeObj = leaveTypes.find((lt) => lt.name === typeName);
    const used = leaveRequests
      .filter(
        (lr) =>
          lr.member.toLowerCase() === memberName.toLowerCase() &&
          lr.leaveType === typeName &&
          lr.status === "Approved"
      )
      .reduce((sum, lr) => sum + lr.days, 0);

    if (!typeObj || typeObj.maxDays === 0) {
      return { used, max: 0, remaining: null };
    }
    return {
      used,
      max: typeObj.maxDays,
      remaining: Math.max(0, typeObj.maxDays - used),
    };
  };

  const displayedRequests = leaveRequests.filter((r) => {
    if (memberFilter !== "all" && r.member !== memberFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.member.toLowerCase().includes(q) ||
        r.leaveType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        (r.adminRemark && r.adminRemark.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <CalendarDays size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-[24px] font-extrabold text-[#10254F] tracking-tight">
                Admin Leave Management & Policy
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                Synced with Member Leave Page
              </span>
            </div>
            <p className="text-[14px] text-[#64748B] font-medium">
              Configure available leave types & quotas for members, and approve or reject leave applications.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddTypeOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-3 rounded-xl text-[14px] font-bold transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] cursor-pointer shrink-0"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Leave Option
        </button>
      </div>

      {/* KPI Stat Cards - 2 per row on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        <StatCard
          title="Pending Requests"
          value={pendingCount.toString()}
          subtitle="Awaiting admin decision"
          icon={<Clock size={22} />}
          theme="orange"
          progress={leaveRequests.length === 0 ? 0 : Math.round((pendingCount / leaveRequests.length) * 100)}
        />
        <StatCard
          title="Approved Leaves"
          value={approvedCount.toString()}
          subtitle="Requests approved this year"
          icon={<CheckCircle2 size={22} />}
          theme="green"
          progress={leaveRequests.length === 0 ? 0 : Math.round((approvedCount / leaveRequests.length) * 100)}
        />
        <StatCard
          title="Active Leave Options"
          value={`${activeTypesCount} / ${leaveTypes.length}`}
          subtitle="Selectable by members"
          icon={<Settings2 size={22} />}
          theme="purple"
          progress={leaveTypes.length === 0 ? 0 : Math.round((activeTypesCount / leaveTypes.length) * 100)}
        />
        <StatCard
          title="Total Approved Days"
          value={`${totalApprovedDays} Days`}
          subtitle="Across all team members"
          icon={<Calendar size={22} />}
          theme="blue"
          progress={100}
        />
      </div>

      {/* SECTION 1: LEAVE OPTIONS & QUOTA SETTINGS (ADMIN CRUD) */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">
                Available Leave Types & Quotas (Member Dropdown Options)
              </h3>
              <p className="text-[13px] text-[#64748B]">
                Whatever leave types are Active here will appear as selectable options in the Member&apos;s Leave Apply page.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddTypeOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F3F6FB] text-[#8B5CF6] border border-[#E3EAF5] px-4 py-2 rounded-xl text-[13px] font-extrabold transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} /> Add New Option
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {leaveTypes.map((lt) => (
            <div
              key={lt.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                lt.active
                  ? "bg-white border-[#E3EAF5] shadow-sm"
                  : "bg-gray-50/70 border-gray-200 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        lt.color === "blue"
                          ? "bg-[#1677FF]"
                          : lt.color === "orange"
                          ? "bg-[#FF6B00]"
                          : lt.color === "purple"
                          ? "bg-[#8B5CF6]"
                          : lt.color === "green"
                          ? "bg-[#10B981]"
                          : "bg-gray-500"
                      }`}
                    />
                    <h4 className="font-extrabold text-[15px] text-[#10254F]">{lt.name}</h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      lt.isPaid
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lt.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>

                <div className="my-3">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Annual Member Quota</p>
                  <p className="text-[24px] font-extrabold text-[#10254F] mt-0.5">
                    {lt.maxDays > 0 ? (
                      <>
                        {lt.maxDays} <span className="text-[13px] font-semibold text-[#64748B]">Days / Year</span>
                      </>
                    ) : (
                      <span className="text-[18px] font-extrabold text-[#64748B]">Unlimited (As Approved)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-[#E3EAF5] flex items-center justify-between">
                <button
                  onClick={() => updateLeaveType(lt.id, { active: !lt.active })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                    lt.active
                      ? "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {lt.active ? "● Active for Members" : "○ Disabled"}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingType(lt)}
                    className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-lg transition-colors cursor-pointer"
                    title="Edit Leave Option"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => deleteLeaveType(lt.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Leave Option"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: MEMBER LEAVE APPLICATIONS TABLE */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1677FF]/10 text-[#1677FF]">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">
                Member Leave Applications
              </h3>
              <p className="text-[13px] text-[#64748B]">
                Approve or reject member requests. Approving automatically deducts from the member&apos;s balance.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, type, reason..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#F4F7FC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-xl outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Members</option>
                {memberNames.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1677FF]" size={15} />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-4 pr-9 py-2.5 rounded-xl outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E3EAF5] text-[#64748B] text-[10px] uppercase tracking-wider font-extrabold">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-3">Leave Type & Balance</th>
                <th className="py-3.5 px-3">Duration</th>
                <th className="py-3.5 px-3">Days</th>
                <th className="py-3.5 px-3">Reason & Admin Remark</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-center">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAF5]">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B] text-sm font-medium">
                    No leave applications found matching your filters.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const bal = getMemberBalance(req.member, req.leaveType);

                  return (
                    <tr key={req.id} className="hover:bg-[#F4F7FC]/60 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1677FF]/10 text-[#1677FF] font-extrabold flex items-center justify-center text-[14px] shrink-0">
                            {req.member.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-[14px] text-[#10254F]">{req.member}</p>
                            <p className="text-[11px] font-medium text-[#64748B]">Applied: {req.appliedAt}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <p className="font-extrabold text-[13px] text-[#10254F]">{req.leaveType}</p>
                        <p className="text-[11px] font-bold text-[#64748B] mt-0.5">
                          {bal.remaining !== null ? (
                            <span>
                              Balance: <strong className="text-[#1677FF]">{bal.remaining}</strong> / {bal.max} days left
                            </span>
                          ) : (
                            <span>Used: {bal.used} days (Unlimited)</span>
                          )}
                        </p>
                      </td>

                      <td className="py-4 px-3">
                        <div className="inline-flex items-center gap-1.5 text-[#10254F] text-[12px] font-bold bg-[#F4F7FC] border border-[#E3EAF5] px-2.5 py-1.5 rounded-lg">
                          <Calendar size={13} className="text-[#64748B]" />
                          {req.startDate} <span className="text-[#64748B]">to</span> {req.endDate}
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] font-extrabold text-[12px]">
                          {req.days} {req.days === 1 ? "Day" : "Days"}
                        </span>
                      </td>

                      <td className="py-4 px-3 max-w-[260px]">
                        <p className="text-[12px] font-bold text-[#10254F] truncate" title={req.reason}>
                          &ldquo;{req.reason}&rdquo;
                        </p>
                        {req.adminRemark ? (
                          <p className="text-[11px] font-semibold text-[#1677FF] mt-1 flex items-center gap-1 truncate" title={req.adminRemark}>
                            <MessageSquare size={11} /> Note: {req.adminRemark}
                          </p>
                        ) : (
                          <button
                            onClick={() => setReviewingRequest(req)}
                            className="text-[11px] font-bold text-[#64748B] hover:text-[#1677FF] mt-1 underline cursor-pointer"
                          >
                            + Add Admin Note
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-full font-extrabold whitespace-nowrap ${
                            req.status === "Approved"
                              ? "bg-[#10B981]/10 text-[#10B981]"
                              : req.status === "Rejected"
                              ? "bg-red-50 text-red-600"
                              : "bg-[#FF6B00]/10 text-[#FF6B00]"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateLeaveRequestStatus(req.id, "Approved")}
                            disabled={req.status === "Approved"}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              req.status === "Approved"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm"
                            }`}
                            title="Approve Leave"
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>

                          <button
                            onClick={() => updateLeaveRequestStatus(req.id, "Rejected")}
                            disabled={req.status === "Rejected"}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              req.status === "Rejected"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                            }`}
                            title="Reject Leave"
                          >
                            <XCircle size={13} /> Reject
                          </button>

                          <button
                            onClick={() => setReviewingRequest(req)}
                            className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-lg transition-colors cursor-pointer"
                            title="Add Remark / Edit Status"
                          >
                            <MessageSquare size={15} />
                          </button>

                          <button
                            onClick={() => deleteLeaveRequest(req.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Request"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW LEAVE TYPE OPTION */}
      {isAddTypeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Add New Leave Option</h2>
                <p className="text-[12px] text-[#64748B] font-medium">
                  Members will see this option in their Leave Apply dropdown.
                </p>
              </div>
              <button onClick={() => setIsAddTypeOpen(false)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addLeaveType({
                  id: "lt_" + Math.random().toString(36).substr(2, 9),
                  name: formData.get("name") as string,
                  maxDays: parseInt((formData.get("maxDays") as string) || "0", 10),
                  isPaid: formData.get("isPaid") === "true",
                  color: (formData.get("color") as LeaveTypeOption["color"]) || "blue",
                  active: true,
                });
                setIsAddTypeOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Leave Option Name *</label>
                <input
                  required
                  name="name"
                  placeholder="e.g. Festival Leave, Emergency Leave"
                  type="text"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                    Max Allowed Days / Yr *
                  </label>
                  <input
                    required
                    name="maxDays"
                    defaultValue="5"
                    min="0"
                    type="number"
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                  />
                  <span className="text-[10px] text-[#64748B] font-medium">Set 0 for Unlimited</span>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Pay Status</label>
                  <select
                    name="isPaid"
                    defaultValue="true"
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white"
                  >
                    <option value="true">Paid Leave</option>
                    <option value="false">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Card Theme Color</label>
                <select
                  name="color"
                  defaultValue="purple"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white"
                >
                  <option value="blue">Blue</option>
                  <option value="orange">Orange</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="gray">Gray</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTypeOpen(false)}
                  className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Leave Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT LEAVE TYPE OPTION */}
      {editingType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Leave Option</h2>
                <p className="text-[12px] text-[#64748B] font-medium">
                  Changes sync immediately with all members.
                </p>
              </div>
              <button onClick={() => setEditingType(null)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateLeaveType(editingType.id, {
                  name: formData.get("name") as string,
                  maxDays: parseInt((formData.get("maxDays") as string) || "0", 10),
                  isPaid: formData.get("isPaid") === "true",
                  color: formData.get("color") as LeaveTypeOption["color"],
                  active: formData.get("active") === "true",
                });
                setEditingType(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Leave Option Name *</label>
                <input
                  required
                  name="name"
                  defaultValue={editingType.name}
                  type="text"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                    Max Allowed Days / Yr *
                  </label>
                  <input
                    required
                    name="maxDays"
                    defaultValue={editingType.maxDays}
                    min="0"
                    type="number"
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                  />
                  <span className="text-[10px] text-[#64748B] font-medium">Set 0 for Unlimited</span>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Pay Status</label>
                  <select
                    name="isPaid"
                    defaultValue={editingType.isPaid ? "true" : "false"}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white"
                  >
                    <option value="true">Paid Leave</option>
                    <option value="false">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Theme Color</label>
                  <select
                    name="color"
                    defaultValue={editingType.color}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white"
                  >
                    <option value="blue">Blue</option>
                    <option value="orange">Orange</option>
                    <option value="purple">Purple</option>
                    <option value="green">Green</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Visibility for Members</label>
                  <select
                    name="active"
                    defaultValue={editingType.active ? "true" : "false"}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REVIEW REQUEST & ADD ADMIN REMARK */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Review Leave Application</h2>
                <p className="text-[12px] text-[#64748B] font-medium">
                  {reviewingRequest.member} • {reviewingRequest.leaveType} ({reviewingRequest.days} days)
                </p>
              </div>
              <button onClick={() => setReviewingRequest(null)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateLeaveRequestStatus(
                  reviewingRequest.id,
                  formData.get("status") as LeaveRequest["status"],
                  formData.get("adminRemark") as string
                );
                setReviewingRequest(null);
              }}
              className="p-6 space-y-4"
            >
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E3EAF5] text-[12px]">
                <p className="font-bold text-[#64748B]">Member&apos;s Reason:</p>
                <p className="font-extrabold text-[#10254F] mt-1">&ldquo;{reviewingRequest.reason}&rdquo;</p>
                <p className="text-[11px] text-[#64748B] mt-2">
                  Dates: <strong>{reviewingRequest.startDate}</strong> to <strong>{reviewingRequest.endDate}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Decision / Status</label>
                <select
                  name="status"
                  defaultValue={reviewingRequest.status}
                  className="w-full px-3.5 py-2.5 text-[13px] font-bold text-[#10254F] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                  Admin Note / Remark (Visible to Member)
                </label>
                <textarea
                  name="adminRemark"
                  rows={3}
                  defaultValue={reviewingRequest.adminRemark || ""}
                  placeholder="Optional note for the member (e.g., Approved, please hand over tasks to Karim)..."
                  className="w-full px-3.5 py-2.5 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none resize-none"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-[13px] bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Update Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
