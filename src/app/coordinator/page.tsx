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
  UserCheck,
  RefreshCw,
  Building2,
  Phone,
  FileSpreadsheet
} from "lucide-react";
import ClientTable, { Client } from "@/components/ClientTable";
import { useCRM, CATEGORY_OPTIONS, getLocalDateString, isTaskOnDate } from "@/context/CRMContext";
import TaskDateFilterBar from "@/components/TaskDateFilterBar";
import ExcelTaskImportModal from "@/components/ExcelTaskImportModal";

export default function CoordinatorTasksPage() {
  const { 
    clients, 
    directoryClients,
    members, 
    addClient, 
    updateClient, 
    assignMember, 
    updateStatus,
    currentMember,
    sessionUser
  } = useCRM();

  const [dateFilterMode, setDateFilterMode] = useState<"today" | "tomorrow" | "custom" | "all">("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [today, setToday] = useState("");

  // Add / Edit Task Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Pre-fill state for Add Task modal
  const [taskClientName, setTaskClientName] = useState("");
  const [taskClientPhone, setTaskClientPhone] = useState("");
  const [taskClientCategory, setTaskClientCategory] = useState("Website Creation");

  const coordinatorName = sessionUser?.name || currentMember || "Coordinator";

  useEffect(() => {
    const todayStr = getLocalDateString();
    setToday(todayStr);
    setSelectedDate(todayStr);
  }, []);

  // Coordinator can assign to team members AND to herself
  const assignableMembers = members;
  const memberNames = assignableMembers.map((m) => m.name);
  if (coordinatorName && !memberNames.some((n) => n.toLowerCase() === coordinatorName.toLowerCase())) {
    memberNames.unshift(coordinatorName);
  }

  // Filter tasks based on active date filter (defaults to today)
  const dateFilteredTasks = clients.filter((t) => {
    if (dateFilterMode === "all") return true;
    const targetDate = dateFilterMode === "today" ? today : selectedDate;
    if (!targetDate) return true;
    return isTaskOnDate(t, targetDate);
  });

  const todayTasksCount = today
    ? clients.filter((t) => isTaskOnDate(t, today)).length
    : 0;

  // Stats scoped by member filter
  const scopedTasks = memberFilter === "all" 
    ? dateFilteredTasks 
    : dateFilteredTasks.filter((c) => c.member === memberFilter);

  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter((t) => t.status === "Done" || t.status === "Can't Do").length;
  const doneOnlyTasks = scopedTasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = scopedTasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = scopedTasks.filter((t) => t.status === "Pending").length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Filtered tasks for the table
  const displayedTasks = dateFilteredTasks.filter((t) => {
    if (memberFilter !== "all" && t.member !== memberFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (viewFilter === "daily" && today) {
      if (!(t.endDate <= today && t.status === "Pending")) return false;
    } else if (viewFilter === "overdue" && today) {
      if (!(t.endDate < today && t.status === "Pending")) return false;
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

  return (
    <div className="space-y-6">
      {/* Date Switcher Bar */}
      <TaskDateFilterBar
        dateFilterMode={dateFilterMode}
        onModeChange={(mode) => setDateFilterMode(mode)}
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date)}
        todayDate={today}
        todayTasksCount={todayTasksCount}
        totalAllTasksCount={clients.length}
      />

      {/* Header Banner & Assign Task CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#8B5CF6]/10 text-[#8B5CF6] uppercase tracking-wider">
              Coordinator Portal
            </span>
            <span className="text-[12px] font-bold text-[#64748B]">Signed in as {coordinatorName}</span>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#10254F] tracking-tight mt-1">
            Task Assignment & Member Updates
          </h1>
          <p className="text-[13px] text-[#64748B] font-medium mt-0.5">
            Assign client tasks to team members and monitor real-time member comments and completion status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-3 rounded-xl text-[13px] font-bold transition-all shadow-sm cursor-pointer"
            title="Upload daily Excel sheet to automatically assign tasks"
          >
            <FileSpreadsheet size={16} /> Import Excel
          </button>

          <button
            onClick={() => {
              setTaskClientName("");
              setTaskClientPhone("");
              setTaskClientCategory("Website Creation");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#1677FF] hover:bg-[#0958D9] text-white px-5 py-3 rounded-xl text-[13px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Assign New Task
          </button>
        </div>
      </div>

      {/* Quick Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E3EAF5]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Tasks</p>
            <ListTodo size={16} className="text-[#1677FF]" />
          </div>
          <p className="text-[24px] font-black text-[#10254F] mt-1">{totalTasks}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">{progressPercentage}% completion rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3EAF5]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Completed (Done)</p>
            <CheckCircle size={16} className="text-[#08B981]" />
          </div>
          <p className="text-[24px] font-black text-[#08B981] mt-1">{doneOnlyTasks}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Verified completed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3EAF5]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">In Progress</p>
            <Clock size={16} className="text-[#1677FF]" />
          </div>
          <p className="text-[24px] font-black text-[#1677FF] mt-1">{inProgressTasks}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Being worked on now</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E3EAF5]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Pending</p>
            <AlertCircle size={16} className="text-[#FF7900]" />
          </div>
          <p className="text-[24px] font-black text-[#FF7900] mt-1">{pendingTasks}</p>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Awaiting action</p>
        </div>
      </div>

      {/* Main Task List Card */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] overflow-hidden">
        {/* Controls & Filters Bar */}
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, member, instructions, remarks..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
            />
          </div>

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

            {/* View / Type Filter */}
            <div className="relative">
              <select
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="daily">Due Today / Overdue</option>
                <option value="overdue">Overdue Only</option>
                <option value="regular">Regular Tasks</option>
                <option value="onetime">One-Time Tasks</option>
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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

        {/* Task Table */}
        <ClientTable
          clients={displayedTasks}
          isAdmin={false}
          isCoordinator={true}
          members={memberNames}
          onAssignChange={(id, newMember) => assignMember(id, newMember, `${coordinatorName} (Coordinator)`)}
          onStatusChange={(id, newStatus) => updateStatus(id, newStatus, `${coordinatorName} (Coordinator)`)}
          onEdit={(task) => setEditingClient(task)}
        />
      </div>

      {/* ================= MODAL: ADD TASK ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Assign New Task to Member</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Task will appear immediately on the assigned member&apos;s portal.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#10254F] p-1">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const assignedMemberName = formData.get("member") as string;

                addClient(
                  {
                    id: "t_" + Math.random().toString(36).substr(2, 9),
                    name: formData.get("name") as string,
                    phone: formData.get("phone") as string,
                    category: formData.get("category") as string,
                    taskType: formData.get("taskType") as "Regular" | "One-Time",
                    taskDetails: formData.get("taskDetails") as string,
                    startDate: formData.get("startDate") as string,
                    endDate: formData.get("endDate") as string,
                    expected: "0",
                    received: "0",
                    status: (formData.get("status") as Client["status"]) || "Pending",
                    member: assignedMemberName,
                    comments: formData.get("comments") as string,
                  },
                  `${coordinatorName} (Coordinator)`
                );

                setIsAddModalOpen(false);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Optional Quick Pick From Registered Clients */}
              {directoryClients.length > 0 && (
                <div className="p-3 bg-[#F4F7FC] rounded-xl border border-[#E3EAF5]">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#1677FF]" />
                    <span>Quick Select From Saved Clients:</span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const found = directoryClients.find((dc) => dc.name === e.target.value);
                      if (found) {
                        setTaskClientName(found.name);
                        setTaskClientPhone(found.phone || "");
                        setTaskClientCategory(found.category || "Website Creation");
                      }
                    }}
                    className="w-full px-3 py-1.5 text-[12px] bg-white border border-[#E3EAF5] rounded-lg font-bold text-[#10254F] outline-none"
                  >
                    <option value="" disabled>-- Choose saved client (auto fills name &amp; phone) --</option>
                    {directoryClients.map((dc) => (
                      <option key={dc.id} value={dc.name}>
                        {dc.name} ({dc.category} • {dc.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Name *</label>
                  <input
                    required
                    name="name"
                    value={taskClientName}
                    onChange={(e) => setTaskClientName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    type="text"
                    className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Phone Number *</label>
                  <input
                    required
                    name="phone"
                    value={taskClientPhone}
                    onChange={(e) => setTaskClientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    type="text"
                    className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Type *</label>
                  <select required name="taskType" defaultValue="Regular" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-medium">
                    <option value="Regular">Regular</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Assign To Team Member *</label>
                <div className="relative">
                  <select
                    required
                    name="member"
                    defaultValue={memberNames[0] || ""}
                    className="w-full px-3.5 py-2.5 text-[13px] font-bold border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-blue-50/40 text-[#1677FF]"
                  >
                    <option value="" disabled>-- Select member to assign --</option>
                    {memberNames.map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Details / Instructions *</label>
                <textarea
                  required
                  name="taskDetails"
                  rows={3}
                  placeholder="Describe what the member needs to do (e.g. Design 3 banner creatives by 4 PM)..."
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

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Initial Instructions / Remarks (Optional)</label>
                <input name="comments" placeholder="e.g. Priority task, please update once initial draft is ready..." type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
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

      {/* ================= MODAL: EDIT TASK ================= */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-xl overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Task &amp; Assignment</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Changes will immediately reflect on the member&apos;s view.</p>
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
                    status: formData.get("status") as Client["status"],
                    member: formData.get("member") as string,
                    comments: formData.get("comments") as string,
                  },
                  `${coordinatorName} (Coordinator)`
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <select required name="taskType" defaultValue={editingClient.taskType || "Regular"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-medium">
                    <option value="Regular">Regular</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Assigned Member</label>
                  <select required name="member" defaultValue={editingClient.member || ""} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-bold text-[#1677FF]">
                    <option value="" disabled>-- Assign Member --</option>
                    {memberNames.map((emp) => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                  <select required name="status" defaultValue={editingClient.status} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none bg-white font-medium">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Can't Do">Can&apos;t Do</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Task Details / Instructions</label>
                <textarea rows={3} required name="taskDetails" defaultValue={editingClient.taskDetails || ""} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
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

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Member Remarks / Comments</label>
                <input name="comments" defaultValue={editingClient.comments || ""} placeholder="Update remarks..." type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#1677FF] outline-none" />
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
      {/* Excel Task Import Modal */}
      <ExcelTaskImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}
