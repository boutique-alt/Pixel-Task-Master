"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, DollarSign, Activity, PieChart, PackagePlus, UserCheck, BarChart2, Settings, X, AlertCircle } from "lucide-react";
import StatCard from "@/components/StatCard";
import ClientTable, { Client } from "@/components/ClientTable";
import { useCRM } from "@/context/CRMContext";

export default function AdminDashboard() {
  const { clients, directoryClients, members, assignMember, addClient, deleteClient, updateClient, updateStatus } = useCRM();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [today, setToday] = useState("");
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
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

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
    ? clients.filter(c => c.status === "Pending" && c.endDate <= today && !c.comments?.trim())
    : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid - 2 per row on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
        <StatCard 
          title="Total Clients" 
          value={totalClients.toLocaleString("en-US")} 
          subtitle="Active clients this year" 
          icon={<Users size={20} />} 
          theme="blue"
          progress={100}
        />
        <StatCard 
          title="Total Members" 
          value={members.length.toString()} 
          subtitle="Active staff members" 
          icon={<Activity size={20} />} 
          theme="green"
          progress={100}
        />
        <StatCard 
          title="Total Expected" 
          value={`₹ ${(totalExpected / 1000).toFixed(1)}k`} 
          subtitle="Pipeline target" 
          icon={<PieChart size={20} />} 
          theme="orange"
          progress={100}
        />
        <StatCard 
          title="Total Received" 
          value={`₹ ${(totalReceived / 1000).toFixed(1)}k`} 
          subtitle="Revenue collected" 
          icon={<DollarSign size={20} />} 
          theme="purple"
          progress={revenueProgress}
        />
      </div>

      <div className="mt-6 sm:mt-8">
        {/* Main Content Area */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Quick Actions (Full Color Blocks - 2 per row on mobile) */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5 sm:mb-1">Quick Actions</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Frequently used admin tasks</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <button onClick={openAddModal} className="bg-[#1B64B1] hover:bg-[#15549A] text-white p-3 sm:p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-24 sm:h-28 shadow-sm cursor-pointer">
                <PackagePlus size={18} className="mb-1 sm:mb-2 sm:w-5 sm:h-5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Add Client / Task</p>
                </div>
              </button>
              
              <Link href="/admin/tasks" className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 sm:p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-24 sm:h-28 shadow-sm">
                <UserCheck size={18} className="mb-1 sm:mb-2 sm:w-5 sm:h-5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Manage Tasklist</p>
                </div>
              </Link>
              
              <Link href="/admin/analytics" className="bg-orange-500 hover:bg-orange-600 text-white p-3 sm:p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-24 sm:h-28 shadow-sm">
                <BarChart2 size={18} className="mb-1 sm:mb-2 sm:w-5 sm:h-5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">View Reports</p>
                </div>
              </Link>
              
              <Link href="/admin/settings" className="bg-purple-500 hover:bg-purple-600 text-white p-3 sm:p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-24 sm:h-28 shadow-sm">
                <Settings size={18} className="mb-1 sm:mb-2 sm:w-5 sm:h-5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Settings</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Ignored/Overdue Tasks Alert */}
          {ignoredTasks.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-red-600 w-5 h-5" />
                <h3 className="font-bold text-red-900 text-lg">Ignored by Members (Overdue or Due Today without Updates)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ignoredTasks.map(t => (
                  <div key={t.id} className="flex flex-col bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <p className="font-bold text-sm text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Assigned to: <strong className="text-gray-800">{t.member}</strong></p>
                    <div className="mt-2 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold self-start">
                      No Comment / Action Taken
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Master Table Area */}
          <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden p-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#10254F]">Master Client & Task List</h3>
                <p className="text-sm text-[#64748B]">Live view of member assignments, statuses, and comments</p>
              </div>
              <Link href="/admin/tasks" className="text-sm font-bold text-[#1677FF] hover:underline">
                Open Full Tasklist →
              </Link>
            </div>
            <ClientTable 
              clients={clients} 
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
                startDate: (formData.get("startDate") as string) || today,
                endDate: (formData.get("endDate") as string) || today,
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Website Creation">Website Creation</option>
                  <option value="Website Revamp">Website Revamp</option>
                  <option value="Landing Page">Landing Page</option>
                  <option value="Logo Design">Logo Design</option>
                  <option value="GBP">GBP</option>
                  <option value="Other">Other</option>
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
                  <input required name="startDate" defaultValue={today} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input required name="endDate" defaultValue={today} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
                  <select required name="category" defaultValue={editingClient.category} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Website Creation">Website Creation</option>
                    <option value="Website Revamp">Website Revamp</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Logo Design">Logo Design</option>
                    <option value="GBP">GBP</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Crafts">Crafts</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Other">Other</option>
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
