"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  ListTodo, 
  Users, 
  Sparkles, 
  Flame, 
  Copy, 
  Check, 
  Search, 
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Send,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  Info
} from "lucide-react";
import { useCRM, getLocalDateString, isTaskOnDate } from "@/context/CRMContext";
import { Client } from "@/components/ClientTable";
import TaskDateFilterBar from "@/components/TaskDateFilterBar";

// Motivational quotes & cheers
const CHEERS = [
  "You're crushing it today! Keep up the momentum! 🔥",
  "Great pace! Every completed task is a win! 🚀",
  "Laser focus mode activated! You've got this! ⚡",
  "Consistent efforts bring extraordinary results! 🌟",
  "Fantastic job! You're making real progress! 🎯"
];

// Quick preset chips for remarks
const PRESET_REMARKS = [
  "Done for today ✓",
  "Working on this now...",
  "Client follow-up sent",
  "Waiting for client confirmation",
  "Review pending with coordinator",
  "Need help on this"
];

export default function MemberTasks() {
  const { clients, currentMember, updateStatus, updateComment } = useCRM();
  
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "custom" | "all">("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [today, setToday] = useState("");
  const [copiedEOD, setCopiedEOD] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved" | null>>({});
  const [confettiActive, setConfettiActive] = useState(false);
  const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const todayStr = getLocalDateString();
    setToday(todayStr);
    setSelectedDate(todayStr);
  }, []);

  const activeMemberName = currentMember || "Hasibul Pailan";

  // Filter tasks belonging to current logged-in member
  const myTasks = useMemo(() => {
    if (!clients) return [];
    if (activeMemberName === "all") return clients;
    return clients.filter(c => 
      c.member?.trim().toLowerCase() === activeMemberName.trim().toLowerCase() ||
      c.member?.trim().toLowerCase() === "hasibul" ||
      c.member?.trim().toLowerCase() === "hasibul pailan"
    );
  }, [clients, activeMemberName]);

  // Tasks filtered by active date filter (defaults to today)
  const dateFilteredTasks = useMemo(() => {
    if (dateFilterMode === "all") return myTasks;
    const targetDate = dateFilterMode === "today" ? today : selectedDate;
    if (!targetDate) return myTasks;
    return myTasks.filter(t => isTaskOnDate(t, targetDate));
  }, [myTasks, dateFilterMode, today, selectedDate]);

  // Today-only count for badge
  const todayTasksCount = useMemo(() => {
    if (!today) return 0;
    return myTasks.filter(t => isTaskOnDate(t, today)).length;
  }, [myTasks, today]);

  // Keep local remarks synced with incoming tasks
  useEffect(() => {
    const initial: Record<string, string> = {};
    myTasks.forEach(t => {
      initial[t.id] = t.comments || "";
    });
    setLocalRemarks(prev => ({ ...initial, ...prev }));
  }, [myTasks]);

  // Status Metrics (scoped to the active date filter by default)
  const totalTasks = dateFilteredTasks.length;
  const completedTasks = dateFilteredTasks.filter(t => t.status === "Done" || t.status === "Can't Do").length;
  const inProgressTasks = dateFilteredTasks.filter(t => t.status === "In Progress").length;
  const pendingTasks = dateFilteredTasks.filter(t => t.status === "Pending").length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Status change handler with celebration animation
  const handleStatusChange = (id: string, newStatus: Client["status"]) => {
    updateStatus(id, newStatus, activeMemberName === "all" ? "Member" : activeMemberName);
    
    if (newStatus === "Done") {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 2400);
    }
  };

  // Remark change handler with auto-save feedback
  const handleRemarkInput = (id: string, text: string) => {
    setLocalRemarks(prev => ({ ...prev, [id]: text }));
    setSaveStatus(prev => ({ ...prev, [id]: "saving" }));

    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    debounceTimers.current[id] = setTimeout(() => {
      updateComment(id, text, activeMemberName === "all" ? "Member" : activeMemberName);
      setSaveStatus(prev => ({ ...prev, [id]: "saved" }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [id]: null }));
      }, 2000);
    }, 600);
  };

  const applyPresetRemark = (id: string, preset: string) => {
    const current = localRemarks[id] || "";
    const updated = current ? `${current} | ${preset}` : preset;
    handleRemarkInput(id, updated);
  };

  // 1-Click Copy EOD WhatsApp / Group Report
  const copyEODReport = () => {
    const activeDateFormatted = dateFilterMode === "today" 
      ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : (dateFilterMode === "custom" ? selectedDate : "All History");
    let report = `📌 *Daily Work Report - ${activeMemberName}* (${activeDateFormatted})\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (dateFilteredTasks.length === 0) {
      report += `No tasks assigned for this date.`;
    } else {
      dateFilteredTasks.forEach((t, i) => {
        const statusEmoji = t.status === 'Done' ? '✅' : t.status === 'In Progress' ? '⏳' : t.status === "Can't Do" ? '❌' : '📋';
        report += `${i + 1}. *${t.name}* [${t.category || 'General'}]\n`;
        if (t.taskDetails) report += `   └ Instruction: ${t.taskDetails}\n`;
        report += `   └ Status: ${statusEmoji} ${t.status}\n`;
        const remark = localRemarks[t.id] || t.comments || "No remarks";
        report += `   └ Remarks: ${remark}\n\n`;
      });
    }
    
    report += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total: ${totalTasks} | Completed: ${completedTasks} | In Progress: ${inProgressTasks} | Pending: ${pendingTasks}`;

    navigator.clipboard.writeText(report);
    setCopiedEOD(true);
    setTimeout(() => setCopiedEOD(false), 2500);
  };

  // Filtered Tasks for display
  const displayedTasks = useMemo(() => {
    return dateFilteredTasks.filter(t => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesCategory = (t.category || "").toLowerCase().includes(q);
        const matchesDetail = (t.taskDetails || "").toLowerCase().includes(q);
        const matchesComment = (t.comments || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDetail && !matchesComment) return false;
      }

      // Status Filter
      if (statusFilter === "pending") {
        return t.status === "Pending" || t.status === "In Progress";
      }
      if (statusFilter === "done") {
        return t.status === "Done" || t.status === "Can't Do";
      }

      return true;
    });
  }, [dateFilteredTasks, searchQuery, statusFilter]);

  // Motivational sentence based on progress
  const motivationalMessage = useMemo(() => {
    if (totalTasks === 0) return "No tasks assigned right now. Enjoy your day! ☕";
    if (progressPercentage === 100) return "Outstanding! You completed 100% of your tasks today! 🎉";
    if (progressPercentage >= 60) return "Awesome pace! You're more than halfway through today's goals! 🚀";
    if (progressPercentage > 0) return "Good momentum! Keep checking off those tasks! 💪";
    return "Ready to roll! Let's conquer today's tasks one by one! ⚡";
  }, [totalTasks, progressPercentage]);

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Confetti Celebration Overlay */}
      {confettiActive && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-[#10B981] text-white font-extrabold text-[15px] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transform -translate-y-8 animate-bounce">
            <Sparkles size={20} className="text-yellow-300" />
            Task Marked as Completed! Awesome work! 🎉
          </div>
        </div>
      )}

      {/* Header with Member Info & EOD Generator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1677FF] to-[#3B82F6] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ListTodo size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[22px] sm:text-[24px] font-black text-[#10254F] tracking-tight">
                {activeMemberName === "all" ? "All Member Tasks" : `${activeMemberName}'s Workspace`}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] font-medium mt-0.5">
              Live Interactive Task Board • Excel simplicity with real-time updates
            </p>
          </div>
        </div>

        {/* Action Buttons: EOD Copy + Member Tag */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={copyEODReport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-sm transition-all active:scale-95 ${
              copiedEOD 
                ? "bg-[#10B981] text-white shadow-emerald-500/20" 
                : "bg-gradient-to-r from-[#10254F] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white shadow-blue-900/20"
            }`}
            title="Generate formatted text summary for WhatsApp / Telegram group"
          >
            {copiedEOD ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy EOD WhatsApp Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Switcher Bar */}
      <TaskDateFilterBar
        dateFilterMode={dateFilterMode}
        onModeChange={setDateFilterMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        todayDate={today}
        todayTasksCount={todayTasksCount}
        totalAllTasksCount={myTasks.length}
      />

      {/* Progress & Stat Cards Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr_1fr_1fr] lg:grid-cols-2 gap-5">
        
        {/* Daily Progress Donut Card */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                <Flame size={18} className="text-[#1677FF]" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#10254F] text-[15px]">Daily Productivity</h3>
                <p className="text-[11px] font-semibold text-[#64748B]">{today || "Today"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-[#F3F6FB] px-2.5 py-1 rounded-lg border border-[#E3EAF5]">
              <TrendingUp size={13} className="text-[#10B981]" />
              <span className="text-[11px] font-black text-[#10254F]">{progressPercentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between my-2">
            {/* Donut Chart */}
            <div className="relative w-[110px] h-[110px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path className="text-[#F3F6FB]" strokeWidth="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path 
                  className="text-[#1677FF] transition-all duration-700 ease-out" 
                  strokeDasharray={`${progressPercentage}, 100`} 
                  strokeWidth="3.8" 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-black text-[#10254F] leading-none">{progressPercentage}%</span>
                <span className="text-[9px] font-bold text-[#64748B] mt-1 text-center tracking-wider">{completedTasks}/{totalTasks} Done</span>
              </div>
            </div>
            
            {/* Status Breakdown */}
            <div className="flex flex-col gap-2.5 pr-2">
              <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span className="text-[#64748B]">Completed</span>
                </div>
                <span className="text-[#10254F] font-black">{completedTasks}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]"></span>
                  <span className="text-[#64748B]">In Progress</span>
                </div>
                <span className="text-[#10254F] font-black">{inProgressTasks}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7900]"></span>
                  <span className="text-[#64748B]">Pending</span>
                </div>
                <span className="text-[#10254F] font-black">{pendingTasks}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 pt-3 border-t border-[#F1F5F9] flex items-center gap-2">
            <Sparkles size={15} className="text-[#1677FF] shrink-0" />
            <p className="text-[12px] font-bold text-[#10254F] truncate">{motivationalMessage}</p>
          </div>
        </div>

        {/* Total Assigned StatCard */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-[#64748B]">Total Assigned</p>
              <h4 className="text-[32px] font-black text-[#10254F] mt-1 leading-none">{totalTasks}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-[#F3F6FB] h-2 rounded-full overflow-hidden">
              <div className="bg-[#1677FF] h-full rounded-full w-full"></div>
            </div>
            <p className="text-[11px] font-semibold text-[#64748B] mt-2">Active tasks in your queue</p>
          </div>
        </div>

        {/* Completed StatCard */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-[#64748B]">Completed</p>
              <h4 className="text-[32px] font-black text-[#10B981] mt-1 leading-none">{completedTasks}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-[#F3F6FB] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#10B981] h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] font-semibold text-[#64748B] mt-2">{progressPercentage}% completion rate</p>
          </div>
        </div>

        {/* Pending Actions StatCard */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-[#64748B]">Pending Actions</p>
              <h4 className="text-[32px] font-black text-[#FF7900] mt-1 leading-none">{pendingTasks}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF7900] flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-[#F3F6FB] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#FF7900] h-full rounded-full transition-all duration-500" 
                style={{ width: totalTasks > 0 ? `${(pendingTasks / totalTasks) * 100}%` : '0%' }}
              ></div>
            </div>
            <p className="text-[11px] font-semibold text-[#64748B] mt-2">Requires today's attention</p>
          </div>
        </div>

      </div>

      {/* Main Excel-Inspired Interactive Task Board */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Table Top Controls & Filter Bar */}
        <div className="p-5 border-b border-[#E3EAF5] bg-gradient-to-r from-white via-[#FAFBFD] to-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-[#10254F] text-[18px] tracking-tight">
                {dateFilterMode === "today" 
                  ? "Today's Task Sheet" 
                  : dateFilterMode === "custom" 
                  ? `Task Sheet for ${selectedDate}` 
                  : "All Assigned Tasks History"}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#1677FF] border border-blue-100">
                {displayedTasks.length} {displayedTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-[12px] text-[#64748B] font-medium mt-0.5">
              Type your remarks directly — changes are saved instantly to the coordinator
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Search client or task..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[12px] font-bold text-[#10254F] bg-white border border-[#E3EAF5] rounded-xl outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 transition-all placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Status Filter Pill Tabs */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
              <button 
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${
                  statusFilter === "all" ? "bg-white text-[#10254F] shadow-sm" : "text-[#64748B] hover:text-[#10254F]"
                }`}
              >
                All Status
              </button>
              <button 
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${
                  statusFilter === "pending" ? "bg-white text-[#FF7900] shadow-sm" : "text-[#64748B] hover:text-[#10254F]"
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setStatusFilter("done")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${
                  statusFilter === "done" ? "bg-white text-[#10B981] shadow-sm" : "text-[#64748B] hover:text-[#10254F]"
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>

        {/* Quick Remarks Presets Bar */}
        <div className="bg-[#F8FAFC] px-5 py-2.5 border-b border-[#E3EAF5] flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="font-extrabold text-[#64748B] shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-[#1677FF]" /> Quick Preset Notes:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {PRESET_REMARKS.map((preset) => (
              <span
                key={preset}
                className="bg-white border border-[#CBD5E1] text-[#475569] font-bold px-2 py-0.5 rounded-md text-[11px] shadow-2xs select-none"
              >
                {preset}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Excel-Style Table matching user image */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-[#0F1E36] text-white text-[11px] font-black uppercase tracking-wider">
                <th className="py-3.5 px-4 w-[50px] text-center">#</th>
                <th className="py-3.5 px-4 w-[180px]">Client Name</th>
                <th className="py-3.5 px-4 w-[130px]">Scope of Work</th>
                <th className="py-3.5 px-4 w-[280px]">Coordinator Update / Instruction</th>
                <th className="py-3.5 px-4 w-[140px] text-center">Status</th>
                <th className="py-3.5 px-4">Member Remarks (Live Edit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAF5] bg-white">
              {displayedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="text-[15px] font-extrabold text-[#10254F]">No tasks in this view</p>
                      <p className="text-[12px] text-[#64748B] mt-1 font-medium">
                        {searchQuery ? "Try searching with a different client or task name." : "You have no active tasks matching the current filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTasks.map((t, index) => {
                  const isDone = t.status === "Done";
                  const isCurrentSave = saveStatus[t.id];

                  return (
                    <tr 
                      key={t.id} 
                      className={`group hover:bg-[#F8FAFC] transition-colors ${
                        isDone ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      {/* # (Sl No) */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-black ${
                          isDone 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-[#F1F5F9] text-[#475569] group-hover:bg-[#E2E8F0]"
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Client Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 ${
                            isDone 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-[#1677FF]/10 text-[#1677FF]"
                          }`}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-[14px] font-extrabold ${isDone ? "text-emerald-900 line-through opacity-85" : "text-[#10254F]"}`}>
                              {t.name}
                            </p>
                            {t.phone && (
                              <p className="text-[11px] font-semibold text-[#64748B]">{t.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Scope of Work */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                          (t.category || "").toLowerCase().includes("seo") 
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : (t.category || "").toLowerCase().includes("web")
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : (t.category || "").toLowerCase().includes("payment")
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {t.category || "General"}
                        </span>
                      </td>

                      {/* Coordinator Update / Instruction */}
                      <td className="py-4 px-4">
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl group-hover:border-[#CBD5E1] transition-colors">
                          <div className="flex items-start gap-2">
                            <MessageCircle size={14} className="text-[#1677FF] shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[12px] font-bold text-[#1E293B] leading-relaxed">
                                {t.taskDetails || "No specific instructions provided yet."}
                              </p>
                              {t.endDate && (
                                <p className="text-[10px] font-extrabold text-[#64748B] mt-1 flex items-center gap-1">
                                  <Calendar size={11} /> Deadline: {t.endDate}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown with 1-Click Fast Toggle */}
                      <td className="py-4 px-4 text-center">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value as Client["status"])}
                          className={`text-[12px] font-black rounded-xl px-3 py-1.5 border outline-none cursor-pointer shadow-xs transition-all ${
                            t.status === "Done"
                              ? "bg-emerald-500 text-white border-emerald-600 focus:ring-2 focus:ring-emerald-300"
                              : t.status === "In Progress"
                              ? "bg-blue-500 text-white border-blue-600 focus:ring-2 focus:ring-blue-300"
                              : t.status === "Can't Do"
                              ? "bg-rose-500 text-white border-rose-600 focus:ring-2 focus:ring-rose-300"
                              : "bg-amber-100 text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-200"
                          }`}
                        >
                          <option value="Pending" className="bg-white text-gray-900">⏳ Pending</option>
                          <option value="In Progress" className="bg-white text-gray-900">⚡ In Progress</option>
                          <option value="Done" className="bg-white text-gray-900">✅ Done</option>
                          <option value="Can't Do" className="bg-white text-gray-900">❌ Can't Do</option>
                        </select>
                      </td>

                      {/* Remarks Field (Live Interactive Editor + Presets) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Type your work remarks here (e.g. SEO done, send msg in grp)..."
                              value={localRemarks[t.id] ?? t.comments ?? ""}
                              onChange={(e) => handleRemarkInput(t.id, e.target.value)}
                              className={`w-full text-[12px] font-semibold text-[#0F172A] pl-3 pr-20 py-2 border rounded-xl bg-white focus:outline-none transition-all shadow-xs ${
                                isDone
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                  : "border-[#CBD5E1] focus:border-[#1677FF] focus:ring-2 focus:ring-blue-100"
                              }`}
                            />
                            
                            {/* Live Save Badge */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isCurrentSave === "saving" && (
                                <span className="text-[10px] font-extrabold text-[#1677FF] animate-pulse">
                                  Saving...
                                </span>
                              )}
                              {isCurrentSave === "saved" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Check size={10} strokeWidth={3} /> Saved
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick clickable chips right under input */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => applyPresetRemark(t.id, "Done for today")}
                              className="text-[10px] font-bold text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 px-1.5 py-0.5 rounded border border-gray-200 transition-colors"
                            >
                              + Done
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetRemark(t.id, "Working on it")}
                              className="text-[10px] font-bold text-gray-500 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-gray-200 transition-colors"
                            >
                              + In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetRemark(t.id, "Client response pending")}
                              className="text-[10px] font-bold text-gray-500 hover:text-amber-700 hover:bg-amber-50 px-1.5 py-0.5 rounded border border-gray-200 transition-colors"
                            >
                              + Follow-up
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar: Summary Count */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E3EAF5] flex flex-col sm:flex-row sm:items-center justify-between text-[12px] font-bold text-[#64748B] gap-2">
          <span>
            Showing <strong className="text-[#10254F]">{displayedTasks.length}</strong> of {totalTasks} assigned tasks
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> {completedTasks} Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF7900]"></span> {pendingTasks} Pending
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
