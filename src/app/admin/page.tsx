"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, AlertCircle, Briefcase } from "lucide-react";
import ClientTable, { Client } from "@/components/ClientTable";
import { useCRM, CATEGORY_OPTIONS, getLocalDateString, isTaskOnDate } from "@/context/CRMContext";
import TaskDateFilterBar from "@/components/TaskDateFilterBar";

export default function AdminDashboard() {
  const { clients, directoryClients, members, assignMember, addClient, deleteClient, updateClient, updateStatus, dailyReports } = useCRM();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "tomorrow" | "custom" | "all">("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [today, setToday] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [addClientName, setAddClientName] = useState("");
  const [addClientPhone, setAddClientPhone] = useState("");
  const [addClientCategory, setAddClientCategory] = useState("Website Creation");

  const openAddModal = () => {
    const firstClient = directoryClients[0];
    if (firstClient) {
      setAddClientName(firstClient.name);
      setAddClientPhone(firstClient.phone || "");
      setAddClientCategory(firstClient.category || "Website Creation");
    } else {
      setAddClientName("");
      setAddClientPhone("");
      setAddClientCategory("Website Creation");
    }
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    const todayStr = getLocalDateString();
    setToday(todayStr);
    setSelectedDate(todayStr);
  }, []);

  // Filter tasks based on active date filter and client filter (defaults to today)
  const displayedTasks = clients.filter((t) => {
    if (clientFilter !== "all" && t.name.trim().toLowerCase() !== clientFilter.trim().toLowerCase()) return false;
    if (dateFilterMode === "all") return true;
    const targetDate = dateFilterMode === "today" ? today : selectedDate;
    if (!targetDate) return true;
    return isTaskOnDate(t, targetDate);
  });

  // Unique client names for filter dropdown
  const uniqueClientNames = Array.from(
    new Set([
      ...directoryClients.map((dc) => dc.name.trim()),
      ...clients.map((c) => c.name.trim()),
    ])
  ).filter(Boolean).sort();

  const todayTasksCount = today
    ? clients.filter((t) => isTaskOnDate(t, today)).length
    : 0;

  // Calculate dynamic stats
  const totalClients = clients.length;
  const totalExpected = clients.reduce((sum, c) => sum + parseInt(c.expected || "0"), 0);
  const totalReceived = clients.reduce((sum, c) => sum + parseInt(c.received || "0"), 0);
  
  // Progress calculations for the stat cards
  const revenueProgress = totalExpected === 0 ? 0 : Math.round((totalReceived / totalExpected) * 100);
  
  // Get unique member names for the dropdown
  const memberNames = members.map(e => e.name);

  const handleAssignChange = (id: string, empName: string) => {
    assignMember(id, empName, "Admin User");
  };

  const ignoredTasks = today
    ? clients.filter(
        c => (c.status === "Pending" || c.status === "In Progress") && c.endDate < today
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Slim 1-Line Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Clients */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Clients</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{totalClients.toLocaleString("en-US")}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-[#10254F]">100%</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#1677FF]" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Members</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">{members.length}</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-[#10254F]">100%</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#10B981]" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        {/* Total Expected */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Expected</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">₹ {(totalExpected / 1000).toFixed(1)}k</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-[#10254F]">100%</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-2xl p-3 sm:px-4 border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#10254F] truncate">Total Received</span>
            <span className="text-[16px] sm:text-[18px] font-black text-[#10254F]">₹ {(totalReceived / 1000).toFixed(1)}k</span>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-extrabold text-[#8292A6] mb-1">
              <span className="uppercase tracking-wider">Progress</span>
              <span className="text-[#10254F]">{revenueProgress}%</span>
            </div>
            <div className="w-full bg-[#F3F6FB] h-[5px] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-purple-600" style={{ width: `${revenueProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        {/* Main Content Area */}
        <div className="space-y-4 sm:space-y-5">
          
          {/* Quick Actions (Slim 1-Line - No Icons) */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-800">Quick Actions</h3>
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">Frequently used admin tasks</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={openAddModal}
                className="bg-[#1B64B1] hover:bg-[#15549A] text-white py-2.5 px-3 rounded-xl text-center font-bold text-xs sm:text-[13px] transition-colors shadow-2xs cursor-pointer truncate"
              >
                Add Client / Task
              </button>
              
              <Link
                href="/admin/tasks"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-center font-bold text-xs sm:text-[13px] transition-colors shadow-2xs truncate block"
              >
                Manage Tasklist
              </Link>
              
              <Link
                href="/admin/attendance"
                className="bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-3 rounded-xl text-center font-bold text-xs sm:text-[13px] transition-colors shadow-2xs truncate block"
              >
                Daily Reports ({dailyReports.filter(r => r.date === today).length}/{members.length})
              </Link>
              
              <Link
                href="/admin/settings"
                className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-3 rounded-xl text-center font-bold text-xs sm:text-[13px] transition-colors shadow-2xs truncate block"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Overdue In-Progress & Pending Tasks Alert */}
          {ignoredTasks.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-red-600 w-5 h-5" />
                <h3 className="font-bold text-red-900 text-lg">Overdue Tasks ({ignoredTasks.length}) — Pending / In Progress from Past Dates</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ignoredTasks.map(t => (
                  <div key={t.id} className="flex flex-col bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-gray-800 truncate">{t.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        t.status === "In Progress" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Assigned to: <strong className="text-gray-800">{t.member || "Unassigned"}</strong></p>
                    <div className="mt-2 text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded font-bold flex items-center justify-between">
                      <span>Deadline passed: {t.endDate}</span>
                      {t.comments ? <span className="text-gray-600 italic truncate max-w-[150px]">&ldquo;{t.comments}&rdquo;</span> : <span>No Remarks</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Master Table Area */}
          <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-[#10254F]">Master Client & Task List</h3>
                <p className="text-sm text-[#64748B]">Live view of member assignments, statuses, and comments</p>
              </div>
              <Link href="/admin/tasks" className="text-sm font-bold text-[#1677FF] hover:underline">
                Open Full Tasklist →
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TaskDateFilterBar
                dateFilterMode={dateFilterMode}
                onModeChange={setDateFilterMode}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                todayDate={today}
                todayTasksCount={todayTasksCount}
                totalAllTasksCount={clients.length}
                className="flex-1"
              />

              {/* Client Filter Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-9 pr-9 py-2.5 rounded-2xl outline-none hover:bg-gray-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  <option value="all">All Clients ({uniqueClientNames.length})</option>
                  {uniqueClientNames.map((cName) => (
                    <option key={cName} value={cName}>{cName}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B5CF6]" size={15} />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            <ClientTable 
              clients={displayedTasks} 
              isAdmin={true} 
              members={memberNames}
              onAssignChange={handleAssignChange}
              onStatusChange={(id, st) => updateStatus(id, st, "Admin")}
              onDelete={(id) => deleteClient(id, "Admin User")}
              onEdit={(c) => setEditingClient(c)}
            />
          </div>

        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Add New Client & Task</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addClient({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.get("name") as string,
                phone: formData.get("phone") as string,
                category: formData.get("category") as string,
                taskType: (formData.get("taskType") as "Regular" | "One-Time") || "Regular",
                taskDetails: formData.get("taskDetails") as string,
                startDate: (formData.get("startDate") as string) || selectedDate || today,
                endDate: (formData.get("endDate") as string) || selectedDate || today,
                expected: formData.get("expected") as string,
                received: "0",
                status: "Pending",
                member: formData.get("member") as string,
                comments: ""
              }, "Admin User");
              setIsAddModalOpen(false);
            }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <select
                    required
                    name="name"
                    value={addClientName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setAddClientName(selectedName);
                      const found = directoryClients.find((c) => c.name === selectedName);
                      if (found) {
                        setAddClientPhone(found.phone || "");
                        if (found.category) setAddClientCategory(found.category);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium cursor-pointer"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={addClientPhone}
                    onChange={(e) => setAddClientPhone(e.target.value)}
                    placeholder="Auto-filled from client"
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  name="category"
                  value={addClientCategory}
                  onChange={(e) => setAddClientCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                  {addClientCategory && !CATEGORY_OPTIONS.some((o) => o.value === addClientCategory) && (
                    <option value={addClientCategory}>{addClientCategory}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Details</label>
                <input required name="taskDetails" placeholder="What needs to be done?" type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select required name="taskType" defaultValue="Regular" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Regular">Regular</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input required name="startDate" defaultValue={selectedDate || today} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input required name="endDate" defaultValue={selectedDate || today} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Amount (₹)</label>
                  <input required name="expected" type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select required name="member" defaultValue={memberNames[0] || "Rahim"} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {memberNames.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#1B64B1] hover:bg-[#15549A] text-white rounded-lg font-medium">Save & Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Edit Client & Task</h2>
              <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateClient(editingClient.id, {
                name: formData.get("name") as string,
                phone: formData.get("phone") as string,
                category: formData.get("category") as string,
                taskDetails: formData.get("taskDetails") as string,
                expected: formData.get("expected") as string,
                received: formData.get("received") as string,
                status: formData.get("status") as Client["status"],
                member: formData.get("member") as string,
              }, "Admin User");
              setEditingClient(null);
            }} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input required name="name" defaultValue={editingClient.name} type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required name="phone" defaultValue={editingClient.phone} type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select required name="category" defaultValue={editingClient.category} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Details</label>
                <input name="taskDetails" defaultValue={editingClient.taskDetails || ""} type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Amount (₹)</label>
                  <input required name="expected" defaultValue={editingClient.expected} type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount (₹)</label>
                  <input required name="received" defaultValue={editingClient.received} type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select required name="status" defaultValue={editingClient.status} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Can't Do">Can&apos;t Do</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select required name="member" defaultValue={editingClient.member || ""} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {memberNames.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
