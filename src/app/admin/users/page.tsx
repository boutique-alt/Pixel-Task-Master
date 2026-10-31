"use client";

import { useState } from "react";
import { Search, Plus, X, Edit, Trash2, Phone, Mail, Building2, Briefcase } from "lucide-react";
import { useCRM, DirectoryClient, CATEGORY_OPTIONS } from "@/context/CRMContext";

export default function AdminClientsPage() {
  const { directoryClients, clients, addDirectoryClient, updateDirectoryClient, deleteDirectoryClient } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<DirectoryClient | null>(null);

  const displayedClients = directoryClients.filter((dc) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold text-[#10254F] tracking-tight">Client Directory (CRUD)</h1>
            <p className="text-[14px] text-[#64748B] font-medium">Create, view, edit, and delete client profiles synced with tasks.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add New Client
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] overflow-hidden">
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, phone, company, or category..."
              className="pl-10 pr-4 py-2.5 w-full bg-[#F4F7FC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#E3EBF5] text-[#64748B] text-[10px] uppercase tracking-wider font-bold bg-[#F8FAFC]">
                <th className="py-3.5 px-4">Client / Brand</th>
                <th className="py-3.5 px-3">Contact Info</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Total Tasks</th>
                <th className="py-3.5 px-3">Financial Summary</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBF5]">
              {displayedClients.map((dc) => {
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
                      <p className="text-[12px] font-bold text-[#10254F] flex items-center gap-1.5">
                        <Phone size={12} className="text-[#1677FF]" /> {dc.phone}
                      </p>
                      {dc.email && (
                        <p className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <Mail size={12} className="text-[#94A3B8]" /> {dc.email}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-2.5 py-1 bg-[#F4F7FC] text-[#10254F] text-[11px] rounded-lg font-bold border border-[#E3EBF5]">
                        {dc.category}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-[13px] font-extrabold text-[#10254F]">{clientTasks.length} Tasks</span>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-[12px] font-bold text-[#10254F]">Exp: ₹{expTotal.toLocaleString("en-US")}</p>
                      <p className="text-[11px] font-bold text-[#10B981]">Rec: ₹{recTotal.toLocaleString("en-US")}</p>
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        dc.status === "Inactive" ? "bg-gray-100 text-gray-600" : "bg-[#10B981]/10 text-[#10B981]"
                      }`}>
                        {dc.status || "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditingClient(dc)} className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-md transition-colors cursor-pointer" title="Edit Client">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteDirectoryClient(dc.id, "Admin")} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer" title="Delete Client">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <h2 className="text-[18px] font-extrabold text-[#10254F]">Add New Client</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#10254F]">
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
                    category: (formData.get("category") as string)?.trim() || "Website Creation",
                    status: (formData.get("status") as "Active" | "Inactive") || "Active",
                  },
                  "Admin"
                );
                setIsAddModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Full Name *</label>
                <input required name="name" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Company / Brand (Optional)</label>
                <input name="company" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number (Optional)</label>
                  <input name="phone" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email (Optional)</label>
                  <input name="email" type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
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
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateDirectoryClient(
                  editingClient.id,
                  {
                    name: (formData.get("name") as string)?.trim(),
                    company: (formData.get("company") as string)?.trim() || "",
                    phone: (formData.get("phone") as string)?.trim() || "",
                    email: (formData.get("email") as string)?.trim() || "",
                    category: editingClient.category || "Website Creation",
                    status: formData.get("status") as "Active" | "Inactive",
                  },
                  "Admin"
                );
                setEditingClient(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Client Full Name *</label>
                <input required name="name" defaultValue={editingClient.name} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Company / Brand (Optional)</label>
                <input name="company" defaultValue={editingClient.company || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Phone Number (Optional)</label>
                  <input name="phone" defaultValue={editingClient.phone || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email (Optional)</label>
                  <input name="email" defaultValue={editingClient.email || ""} type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue={editingClient.status || "Active"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none bg-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
