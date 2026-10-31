"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  CheckSquare, 
  ListTodo, 
  Plus, 
  Search, 
  AlertCircle, 
  X, 
  Activity as ActivityIcon,
  UserCheck,
  MessageSquare,
  RefreshCw,
  Users,
  Briefcase,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import ClientTable, { Client } from "@/components/ClientTable";
import { useCRM, Member, DirectoryClient, CATEGORY_OPTIONS, getLocalDateString, isTaskOnDate, getEffectiveTaskForDate } from "@/context/CRMContext";
import TaskDateFilterBar from "@/components/TaskDateFilterBar";
import ExcelTaskImportModal from "@/components/ExcelTaskImportModal";

export default function AdminTasksPage() {
  const { 
    clients, 
    directoryClients,
    members, 
    activities, 
    // Task CRUD
    addClient, 
    updateClient, 
    deleteClient, 
    assignMember, 
    updateStatus,
    // Member CRUD
    addMember,
    updateMember,
    deleteMember,
    // Client CRUD
    addDirectoryClient,
    updateDirectoryClient,
    deleteDirectoryClient
  } = useCRM();

  const [activeTab, setActiveTab] = useState<"tasks" | "clients" | "members">("tasks");

  const [dateFilterMode, setDateFilterMode] = useState<"today" | "tomorrow" | "custom" | "all">("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [today, setToday] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // Task Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  // Pre-fill state for Add Task modal when selecting an existing client
  const [taskClientName, setTaskClientName] = useState("");
  const [taskClientPhone, setTaskClientPhone] = useState("");
  const [taskClientCategory, setTaskClientCategory] = useState("Website Creation");

  // Client Directory CRUD Modals
  const [isAddDirectoryClientOpen, setIsAddDirectoryClientOpen] = useState(false);
  const [editingDirectoryClient, setEditingDirectoryClient] = useState<DirectoryClient | null>(null);

  // Member CRUD Modals
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    const todayStr = getLocalDateString();
    setToday(todayStr);
    setSelectedDate(todayStr);

    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = getLocalDateString(tmrw);
    setTomorrow(tmrwStr);
  }, []);

  const memberNames = members.map((m) => m.name);

  // Unique client names from active tasks and client directory for filter dropdown
  const uniqueClientNames = Array.from(
    new Set([
      ...directoryClients.map((dc) => dc.name.trim()),
      ...clients.map((c) => c.name.trim()),
    ])
  ).filter(Boolean).sort();

  // Filter tasks based on active date filter (defaults to today)
  const targetDate = dateFilterMode === "today" ? today : dateFilterMode === "tomorrow" ? tomorrow : selectedDate;
  const dateFilteredTasks = clients
    .filter((t) => {
      if (dateFilterMode === "all") return true;
      if (!targetDate) return true;
      return isTaskOnDate(t, targetDate);
    })
    .map((t) => {
      const activeDate = targetDate || today;
      return activeDate ? getEffectiveTaskForDate(t, activeDate) : t;
    });

  const todayTasksCount = today
    ? clients.filter((t) => isTaskOnDate(t, today)).length
    : 0;

  const tomorrowTasksCount = tomorrow
    ? clients.filter((t) => isTaskOnDate(t, tomorrow)).length
    : 0;

  // Filter tasks based on selected member for stats
  const scopedTasks = memberFilter === "all" 
    ? dateFilteredTasks 
    : dateFilteredTasks.filter((c) => c.member === memberFilter);

  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter((t) => t.status === "Done" || t.status === "Can't Do").length;
  const doneOnlyTasks = scopedTasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = scopedTasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = scopedTasks.filter((t) => t.status === "Pending").length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Overdue tasks: Pending or In Progress with endDate < today (yesterday or earlier), sorted oldest first
  const ignoredTasks = today
    ? clients
        .filter((c) => (c.status === "Pending" || c.status === "In Progress") && c.endDate < today)
        .sort((a, b) => (a.endDate || "").localeCompare(b.endDate || ""))
    : [];

  // Filtered tasks for the table
  const displayedTasks = dateFilteredTasks.filter((t) => {
    if (memberFilter !== "all" && t.member !== memberFilter) return false;
    if (clientFilter !== "all" && t.name.trim().toLowerCase() !== clientFilter.trim().toLowerCase()) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (viewFilter === "daily" && today) {
      if (!((t.status === "Pending" || t.status === "In Progress") && t.endDate < today)) return false;
    } else if (viewFilter === "overdue" && today) {
      if (!((t.status === "Pending" || t.status === "In Progress") && t.endDate < today)) return false;
    } else if (viewFilter === "regular") {
      if (t.taskType !== "Regular") return false;
    } else if (viewFilter === "onetime") {
      if (t.taskType !== "One-Time") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchPhone = t.phone?.toLowerCase().includes(q);
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchDetails = t.taskDetails?.toLowerCase().includes(q);
      const matchMember = t.member?.toLowerCase().includes(q);
      const matchComments = t.comments?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCategory && !matchDetails && !matchMember && !matchComments) {
        return false;
      }
    }

    return true;
  });

  // Filtered directory clients
  const displayedDirectoryClients = directoryClients.filter((dc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dc.name.toLowerCase().includes(q) ||
      (dc.phone || "").toLowerCase().includes(q) ||
      (dc.email || "").toLowerCase().includes(q) ||
      (dc.company || "").toLowerCase().includes(q) ||
      (dc.category || "").toLowerCase().includes(q)
    );
  });

  // Filtered members
  const displayedMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  const handleAssignChange = (id: string, memberName: string) => {
    assignMember(id, memberName, "Admin");
  };

  const handleAdminStatusChange = (id: string, newStatus: Client["status"]) => {
    updateStatus(id, newStatus, "Admin");
  };

  const openAddTaskModal = (prefillClient?: DirectoryClient) => {
    const targetClient = prefillClient || directoryClients[0];
    if (targetClient) {
      setTaskClientName(targetClient.name);
      setTaskClientPhone(targetClient.phone || "");
      setTaskClientCategory(targetClient.category || "Website Creation");
    } else {
      setTaskClientName("");
      setTaskClientPhone("");
      setTaskClientCategory("Website Creation");
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Primary CRUD Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[18px] sm:text-[20px] font-black text-[#10254F] tracking-tight">Admin Task, Client & Member Hub</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-[#64748B] font-medium mt-0.5">
            Complete CRUD operations for Tasks, Clients, and Team Members—all synced with the Member Portal.
          </p>
        </div>

        {/* Quick CRUD Buttons (Slim 1-Line - No Icons) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Import daily tasks directly from Excel"
          >
            <FileSpreadsheet size={15} /> Import Excel
          </button>
          <button
            type="button"
            onClick={() => setIsAddMemberModalOpen(true)}
            className="bg-white hover:bg-[#F0F5FF] text-[#10254F] border border-[#E3EAF5] px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-colors shadow-2xs cursor-pointer truncate"
          >
            + Add Member
          </button>
          <button
            type="button"
            onClick={() => setIsAddDirectoryClientOpen(true)}
            className="bg-white hover:bg-[#F0F5FF] text-[#10254F] border border-[#E3EAF5] px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-colors shadow-2xs cursor-pointer truncate"
          >
            + Add Client
          </button>
          <button
            type="button"
            onClick={() => openAddTaskModal()}
            className="bg-[#1677FF] hover:bg-[#0958D9] text-white px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-2xs cursor-pointer truncate"
          >
            Assign New Task
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
        totalAllTasksCount={clients.length}
      />

      {/* Slim 1-Line Stats Grid: Team Task Progress, Total Tasks, Total Clients, Team Members */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Team Task Progress */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">
              {memberFilter === "all" ? "Team Task Progress" : `${memberFilter}'s Progress`}
            </span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{progressPercentage}%</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Resolved</span>
              <span className="text-[#10254F]">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#10B981] transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* 2. Total Tasks */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Tasks</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{totalTasks}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-[#10254F]">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#1677FF] transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* 3. Total Clients */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Clients</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{directoryClients.length}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Active</span>
              <span className="text-[#10254F]">{directoryClients.filter((c) => c.status !== "Inactive").length}</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        {/* 4. Team Members */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Team Members</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{members.length}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Active Staff</span>
              <span className="text-[#10254F]">{members.length}</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#0EA5E9]" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue In-Progress & Pending Tasks Alert */}
      {ignoredTasks.length > 0 && (
        <div className="bg-[#FFF8ED] border border-[#FFEDD5] rounded-[24px] p-4 sm:p-5 shadow-sm transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFEDD5] text-[#F97316] flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-[#10254F] text-[15px]">
                    Attention Required: Overdue Tasks ({ignoredTasks.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                    Oldest pending from past dates
                  </span>
                </div>
                <p className="text-[12px] text-[#64748B] font-medium hidden sm:block">
                  These tasks had their deadline in past dates and are still pending or in progress.
                </p>
              </div>
            </div>

            {/* Dropdown toggle to expand/collapse all */}
            <button
              type="button"
              onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
              className="px-3.5 py-2 bg-white hover:bg-[#FFEDD5]/50 border border-[#FFEDD5] text-[#10254F] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <span>{isAlertsExpanded ? "Collapse" : `View All (${ignoredTasks.length})`}</span>
              {isAlertsExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* Cards display: 1 Row default (Oldest first), full grid when expanded */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3.5">
            {(isAlertsExpanded ? ignoredTasks : ignoredTasks.slice(0, 3)).map((t) => {
              const formattedDate = (() => {
                try {
                  if (!t.endDate) return "No date";
                  const parts = t.endDate.split("-");
                  if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  }
                  return t.endDate;
                } catch {
                  return t.endDate;
                }
              })();

              return (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-[#FFEDD5] shadow-sm flex items-center justify-between gap-3">
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-[13px] text-[#10254F] truncate">{t.name}</p>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border shrink-0 ${
                        t.status === "In Progress"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] font-medium mt-1 truncate">
                      Member: <strong className="text-[#1677FF]">{t.member || "Unassigned"}</strong>
                    </p>
                    <p className="text-[11px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                      <span>Deadline:</span>
                      <strong className="underline underline-offset-2">{formattedDate}</strong>
                    </p>
                    {t.comments && (
                      <p className="text-[10px] text-gray-500 italic mt-0.5 truncate">
                        Remark: &ldquo;{t.comments}&rdquo;
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingClient(t)}
                    className="px-3 py-1.5 bg-[#FFF8ED] hover:bg-[#FFEDD5] text-[#F97316] text-[11px] font-extrabold rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-TAB CRUD SWITCHER: TASKS | CLIENTS | MEMBERS */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Top Tab Navigation Bar */}
        <div className="px-6 pt-5 border-b border-[#E3EAF5] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-[13px] font-extrabold border-b-2 transition-all cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-white text-[#1677FF] border-[#1677FF] shadow-sm"
                  : "text-[#64748B] border-transparent hover:text-[#10254F]"
              }`}
            >
              <ListTodo size={16} />
              Tasks CRUD
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#1677FF]/10 text-[#1677FF]">
                {clients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-[13px] font-extrabold border-b-2 transition-all cursor-pointer ${
                activeTab === "clients"
                  ? "bg-white text-[#8B5CF6] border-[#8B5CF6] shadow-sm"
                  : "text-[#64748B] border-transparent hover:text-[#10254F]"
              }`}
            >
              <Briefcase size={16} />
              Clients CRUD
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#8B5CF6]/10 text-[#8B5CF6]">
                {directoryClients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-[13px] font-extrabold border-b-2 transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-white text-[#10B981] border-[#10B981] shadow-sm"
                  : "text-[#64748B] border-transparent hover:text-[#10254F]"
              }`}
            >
              <Users size={16} />
              Members CRUD
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#10B981]/10 text-[#10B981]">
                {members.length}
              </span>
            </button>
          </div>

          {/* Search Input (works across active tab) */}
          <div className="pb-3 md:pb-2 flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "tasks"
                    ? "Search tasks, client, member..."
                    : activeTab === "clients"
                    ? "Search client name, phone, company..."
                    : "Search member name, email, role..."
                }
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1677FF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= TAB 1: TASKS CRUD ================= */}
        {activeTab === "tasks" && (
          <div>
            <div className="p-4 sm:p-6 border-b border-[#E3EAF5] flex flex-col gap-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">Master Task List</h3>
                  <p className="text-[13px] text-[#64748B] mt-0.5">
                    Create, edit, delete, or reassign tasks. Changes sync live with the assigned member.
                  </p>
                </div>

                {/* Task Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Member Filter */}
                  <div className="relative">
                    <select
                      value={memberFilter}
                      onChange={(e) => setMemberFilter(e.target.value)}
                      className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <option value="all">All Members</option>
                      {memberNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1677FF]" size={15} />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {/* Client Filter */}
                  <div className="relative">
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer max-w-[200px]"
                    >
                      <option value="all">All Clients ({uniqueClientNames.length})</option>
                      {uniqueClientNames.map((cName) => (
                        <option key={cName} value={cName}>{cName}</option>
                      ))}
                    </select>
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B5CF6]" size={15} />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                      <option value="Can't Do">Can&apos;t Do</option>
                    </select>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              {/* Date Filter Bar for Admin */}
              <TaskDateFilterBar
                dateFilterMode={dateFilterMode}
                onModeChange={setDateFilterMode}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                todayDate={today}
                tomorrowDate={tomorrow}
                todayTasksCount={todayTasksCount}
                tomorrowTasksCount={tomorrowTasksCount}
                totalAllTasksCount={clients.length}
              />
            </div>

            <ClientTable
              clients={displayedTasks}
              isAdmin={true}
              members={memberNames}
              onAssignChange={handleAssignChange}
              onStatusChange={handleAdminStatusChange}
              onDelete={(id) => deleteClient(id, "Admin")}
              onEdit={(c) => setEditingClient(c)}
            />
          </div>
        )}

        {/* ================= TAB 2: CLIENTS CRUD ================= */}
        {activeTab === "clients" && (
          <div>
            <div className="p-6 border-b border-[#E3EAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">Client Directory (CRUD)</h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Add, edit, or remove clients. Updating a client automatically updates their linked tasks.
                </p>
              </div>
              <button
                onClick={() => setIsAddDirectoryClientOpen(true)}
                className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus size={16} /> Add New Client
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E3EBF5] text-[#64748B] text-[10px] uppercase tracking-wider font-bold bg-[#F8FAFC]">
                    <th className="py-3.5 px-4">Client / Brand</th>
                    <th className="py-3.5 px-3">Contact Info</th>
                    <th className="py-3.5 px-3">Linked Tasks</th>
                    <th className="py-3.5 px-3">Total Expected / Received</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBF5]">
                  {displayedDirectoryClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748B] text-sm font-medium">
                        No clients found. Click &quot;+ Add New Client&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    displayedDirectoryClients.map((dc) => {
                      const clientTasks = clients.filter((t) => t.name.toLowerCase() === dc.name.toLowerCase());
                      const expTotal = clientTasks.reduce((s, t) => s + parseInt(t.expected || "0"), 0);
                      const recTotal = clientTasks.reduce((s, t) => s + parseInt(t.received || "0"), 0);

                      return (
                        <tr key={dc.id} className="hover:bg-[#F4F7FC]/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] font-extrabold flex items-center justify-center text-[15px] shrink-0">
                                {dc.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-[14px] text-[#10254F]">{dc.name}</p>
                                <p className="text-[11px] font-medium text-[#64748B] flex items-center gap-1 mt-0.5">
                                  <Building2 size={12} className="text-[#94A3B8]" />
                                  {dc.company || "Individual Client"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="space-y-1">
                              <p className="text-[12px] font-bold text-[#10254F] flex items-center gap-1.5">
                                <Phone size={12} className="text-[#1677FF]" /> {dc.phone || "No phone"}
                              </p>
                              {dc.email && (
                                <p className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                                  <Mail size={12} className="text-[#94A3B8]" /> {dc.email}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-extrabold text-[#10254F]">{clientTasks.length} Tasks</span>
                              <button
                                onClick={() => openAddTaskModal(dc)}
                                className="text-[11px] font-bold text-[#1677FF] bg-[#F0F5FF] hover:bg-[#E0E7FF] px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                + Assign Task
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <p className="text-[12px] font-bold text-[#10254F]">
                              Exp: ₹{expTotal.toLocaleString("en-US")}
                            </p>
                            <p className="text-[11px] font-bold text-[#10B981]">
                              Rec: ₹{recTotal.toLocaleString("en-US")}
                            </p>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              dc.status === "Inactive"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-[#10B981]/10 text-[#10B981]"
                            }`}>
                              {dc.status || "Active"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingDirectoryClient(dc)}
                                className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-md transition-colors cursor-pointer"
                                title="Edit Client"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteDirectoryClient(dc.id, "Admin")}
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                                title="Delete Client"
                              >
                                <Trash2 size={16} />
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
        )}

        {/* ================= TAB 3: MEMBERS CRUD ================= */}
        {activeTab === "members" && (
          <div>
            <div className="p-6 border-b border-[#E3EAF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">Team Members (CRUD)</h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Add, update, or remove team members. Members added here can immediately be assigned tasks.
                </p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus size={16} /> Add New Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E3EBF5] text-[#64748B] text-[10px] uppercase tracking-wider font-bold bg-[#F8FAFC]">
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-3">Role / Designation</th>
                    <th className="py-3.5 px-3">Contact Info</th>
                    <th className="py-3.5 px-3">Assigned Tasks</th>
                    <th className="py-3.5 px-3">Completed / Pending</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBF5]">
                  {displayedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748B] text-sm font-medium">
                        No members found. Click &quot;+ Add New Member&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    displayedMembers.map((emp) => {
                      const empTasks = clients.filter((c) => c.member === emp.name);
                      const empDone = empTasks.filter((c) => c.status === "Done").length;
                      const empPending = empTasks.filter((c) => c.status === "Pending" || c.status === "In Progress").length;

                      return (
                        <tr key={emp.id} className="hover:bg-[#F4F7FC]/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#10B981]/10 text-[#10B981] font-extrabold flex items-center justify-center text-[15px] shrink-0">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-[14px] text-[#10254F]">{emp.name}</p>
                                <p className="text-[11px] font-medium text-[#64748B]">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <span className="px-2.5 py-1 bg-[#F4F7FC] text-[#10254F] text-[11px] rounded-lg font-bold border border-[#E3EBF5]">
                              {emp.role || "Team Member"}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <p className="text-[12px] font-bold text-[#10254F]">{emp.phone || "—"}</p>
                            <p className="text-[11px] text-[#64748B]">{emp.email}</p>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-extrabold text-[#10254F]">{empTasks.length} Total</span>
                              <button
                                onClick={() => {
                                  setMemberFilter(emp.name);
                                  setActiveTab("tasks");
                                }}
                                className="text-[11px] font-bold text-[#1677FF] bg-[#F0F5FF] hover:bg-[#E0E7FF] px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                View Tasks
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2 text-[12px] font-bold">
                              <span className="text-[#10B981]">{empDone} Done</span>
                              <span className="text-[#94A3B8]">•</span>
                              <span className="text-[#F97316]">{empPending} Active</span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              emp.status === "On Leave"
                                ? "bg-orange-100 text-orange-700"
                                : emp.status === "Inactive"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-[#10B981]/10 text-[#10B981]"
                            }`}>
                              {emp.status || "Active"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingMember(emp)}
                                className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-md transition-colors cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteMember(emp.id, "Admin")}
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                                title="Delete Member"
                              >
                                <Trash2 size={16} />
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
        )}
      </div>

      {/* ================= MODAL 1: ADD NEW TASK ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Assign New Task to Member</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Select an existing client or enter a new client below.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addClient(
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    name: formData.get("name") as string,
                    phone: formData.get("phone") as string,
                    category: formData.get("category") as string,
                    taskType: (formData.get("taskType") as "Regular" | "One-Time") || "Regular",
                    taskDetails: formData.get("taskDetails") as string,
                    startDate: (formData.get("startDate") as string) || selectedDate || today,
                    endDate: (formData.get("endDate") as string) || selectedDate || today,
                    expected: (formData.get("expected") as string) || "0",
                    received: (formData.get("received") as string) || "0",
                    status: "Pending",
                    member: formData.get("member") as string,
                    comments: (formData.get("comments") as string) || "",
                  },
                  "Admin"
                );
                setIsAddModalOpen(false);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Name *</label>
                  <select
                    required
                    name="name"
                    value={taskClientName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setTaskClientName(selectedName);
                      const found = directoryClients.find((c) => c.name === selectedName);
                      if (found) {
                        setTaskClientPhone(found.phone || "");
                        if (found.category) setTaskClientCategory(found.category);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-[13px] font-bold text-[#10254F] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white cursor-pointer"
                  >
                    <option value="" disabled>-- Select Client --</option>
                    {directoryClients.map((dc) => (
                      <option key={dc.id} value={dc.name}>
                        {dc.name} {dc.company ? `(${dc.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={taskClientPhone}
                    onChange={(e) => setTaskClientPhone(e.target.value)}
                    placeholder="Auto-filled from client"
                    type="text"
                    className="w-full px-3.5 py-2.5 text-[13px] font-medium text-[#475569] bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Category *</label>
                  <select
                    required
                    name="category"
                    value={taskClientCategory}
                    onChange={(e) => setTaskClientCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-medium"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                    {taskClientCategory && !CATEGORY_OPTIONS.some((o) => o.value === taskClientCategory) && (
                      <option value={taskClientCategory}>{taskClientCategory}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Type *</label>
                  <select required name="taskType" defaultValue="Regular" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white">
                    <option value="Regular">Regular</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Assign To Member *</label>
                  <select required name="member" defaultValue={memberNames[0] || "Rahim"} className="w-full px-3.5 py-2 text-[13px] font-bold text-[#1677FF] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-[#F0F5FF]">
                    {memberNames.map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Details / Instructions *</label>
                <input
                  required
                  name="taskDetails"
                  placeholder="Describe what the member needs to complete..."
                  type="text"
                  className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Start Date *</label>
                  <input required name="startDate" defaultValue={selectedDate || today} type="date" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Deadline (End Date) *</label>
                  <input required name="endDate" defaultValue={selectedDate || today} type="date" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Expected Amount (₹)</label>
                  <input required name="expected" defaultValue="50000" type="number" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Advance Received (₹)</label>
                  <input name="received" defaultValue="0" type="number" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Initial Admin Note / Comment (Optional)</label>
                <input name="comments" placeholder="Optional initial note for the member..." type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Assign Task Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT TASK ================= */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Task & Assignment</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Changes will immediately sync to the member&apos;s view.</p>
              </div>
              <button onClick={() => setEditingClient(null)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateClient(
                  editingClient.id,
                  {
                    name: formData.get("name") as string,
                    phone: formData.get("phone") as string,
                    category: formData.get("category") as string,
                    taskType: formData.get("taskType") as "Regular" | "One-Time",
                    taskDetails: formData.get("taskDetails") as string,
                    startDate: formData.get("startDate") as string,
                    endDate: formData.get("endDate") as string,
                    expected: formData.get("expected") as string,
                    received: formData.get("received") as string,
                    status: formData.get("status") as Client["status"],
                    member: formData.get("member") as string,
                    comments: formData.get("comments") as string,
                  },
                  "Admin"
                );
                setEditingClient(null);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Name</label>
                  <input required name="name" defaultValue={editingClient.name} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number</label>
                  <input required name="phone" defaultValue={editingClient.phone} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Category</label>
                  <select required name="category" defaultValue={editingClient.category} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-medium">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                    {editingClient.category && !CATEGORY_OPTIONS.some((o) => o.value === editingClient.category) && (
                      <option value={editingClient.category}>{editingClient.category}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Type</label>
                  <select required name="taskType" defaultValue={editingClient.taskType || "Regular"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white">
                    <option value="Regular">Regular</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Assigned Member</label>
                  <select required name="member" defaultValue={editingClient.member || ""} className="w-full px-3.5 py-2 text-[13px] font-bold text-[#1677FF] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-[#F0F5FF]">
                    {memberNames.map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Details / Instructions</label>
                <input
                  required
                  name="taskDetails"
                  defaultValue={editingClient.taskDetails || ""}
                  type="text"
                  className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Start Date</label>
                  <input required name="startDate" defaultValue={editingClient.startDate} type="date" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Deadline (End Date)</label>
                  <input required name="endDate" defaultValue={editingClient.endDate} type="date" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Expected Amount (₹)</label>
                  <input required name="expected" defaultValue={editingClient.expected} type="number" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Received Amount (₹)</label>
                  <input required name="received" defaultValue={editingClient.received} type="number" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                  <select required name="status" defaultValue={editingClient.status} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Can't Do">Can&apos;t Do</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Comments / Member Remarks</label>
                <input name="comments" defaultValue={editingClient.comments || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD CLIENT (CLIENT CRUD) ================= */}
      {isAddDirectoryClientOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Add New Client Profile</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Create a client record in your directory.</p>
              </div>
              <button onClick={() => setIsAddDirectoryClientOpen(false)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addDirectoryClient(
                  {
                    id: "c_" + Math.random().toString(36).substr(2, 9),
                    name: (formData.get("name") as string)?.trim(),
                    company: (formData.get("company") as string)?.trim() || "",
                    phone: (formData.get("phone") as string)?.trim() || "",
                    email: (formData.get("email") as string)?.trim() || "",
                    category: (formData.get("category") as string)?.trim() || "",
                    status: (formData.get("status") as "Active" | "Inactive") || "Active",
                  },
                  "Admin"
                );
                setIsAddDirectoryClientOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Full Name *</label>
                <input required name="name" placeholder="e.g. Tariq Mahmood" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Company / Brand Name (Optional)</label>
                <input name="company" placeholder="e.g. Mahmood Group" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number (Optional)</label>
                  <input name="phone" placeholder="+1 (555) 234-5678" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address (Optional)</label>
                  <input name="email" placeholder="client@company.com" type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue="Active" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddDirectoryClientOpen(false)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: EDIT CLIENT (CLIENT CRUD) ================= */}
      {editingDirectoryClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Client Profile</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Updates also sync to this client&apos;s tasks.</p>
              </div>
              <button onClick={() => setEditingDirectoryClient(null)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateDirectoryClient(
                  editingDirectoryClient.id,
                  {
                    name: (formData.get("name") as string)?.trim(),
                    company: (formData.get("company") as string)?.trim() || "",
                    phone: (formData.get("phone") as string)?.trim() || "",
                    email: (formData.get("email") as string)?.trim() || "",
                    category: editingDirectoryClient.category || "",
                    status: formData.get("status") as "Active" | "Inactive",
                  },
                  "Admin"
                );
                setEditingDirectoryClient(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Full Name *</label>
                <input required name="name" defaultValue={editingDirectoryClient.name} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Company / Brand Name (Optional)</label>
                <input name="company" defaultValue={editingDirectoryClient.company || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number (Optional)</label>
                  <input name="phone" defaultValue={editingDirectoryClient.phone || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address (Optional)</label>
                  <input name="email" defaultValue={editingDirectoryClient.email || ""} type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue={editingDirectoryClient.status || "Active"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setEditingDirectoryClient(null)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ADD MEMBER (MEMBER CRUD) ================= */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Add New Team Member</h2>
                <p className="text-[12px] text-[#64748B] font-medium">New members can immediately be assigned tasks.</p>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addMember(
                  {
                    id: "e_" + Math.random().toString(36).substr(2, 9),
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    role: formData.get("role") as string,
                    status: (formData.get("status") as "Active" | "On Leave" | "Inactive") || "Active",
                  },
                  "Admin"
                );
                setIsAddMemberModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Member Name *</label>
                <input required name="name" placeholder="e.g. Tanvir Hasan" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Role / Designation *</label>
                <input required name="role" placeholder="e.g. Full Stack Developer" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address *</label>
                  <input required name="email" placeholder="member@company.com" type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number</label>
                  <input name="phone" placeholder="+880 1700-000000" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue="Active" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-white">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: EDIT MEMBER (MEMBER CRUD) ================= */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Team Member</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Renaming a member automatically updates their assigned tasks.</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMember(
                  editingMember.id,
                  {
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    role: formData.get("role") as string,
                    status: formData.get("status") as "Active" | "On Leave" | "Inactive",
                  },
                  "Admin"
                );
                setEditingMember(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Member Name *</label>
                <input required name="name" defaultValue={editingMember.name} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Role / Designation *</label>
                <input required name="role" defaultValue={editingMember.role || "Team Member"} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address *</label>
                  <input required name="email" defaultValue={editingMember.email} type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number</label>
                  <input name="phone" defaultValue={editingMember.phone || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue={editingMember.status || "Active"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-white">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setEditingMember(null)} className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-[13px] bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold shadow-sm cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Excel Task Import Modal */}
      <ExcelTaskImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}
