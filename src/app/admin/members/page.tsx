"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Users, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Copy,
  Check
} from "lucide-react";
import { useCRM, Member } from "@/context/CRMContext";
import { 
  findUserByMember, 
  upsertAppUser, 
  adminResetUserPassword, 
  AppUser 
} from "@/lib/authService";

export default function AdminMembersPage() {
  const { members, clients, addMember, updateMember, deleteMember } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingPassword, setEditingPassword] = useState("123");

  // Password reset modal state
  const [passwordModalMember, setPasswordModalMember] = useState<Member | null>(null);
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

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

  const handleOpenEditModal = async (member: Member) => {
    setEditingMember(member);
    try {
      const u = await findUserByMember(member.name, member.phone);
      setEditingPassword(u?.password || "123");
    } catch {
      setEditingPassword("123");
    }
  };

  const handleOpenPasswordModal = async (member: Member) => {
    setPasswordModalMember(member);
    setNewPassword("");
    setShowPassword(false);
    setIsCopied(false);
    setPasswordStatus({ type: "loading", msg: "Loading member account details..." });

    try {
      const u = await findUserByMember(member.name, member.phone);
      setTargetUser(u);
      if (u) {
        setNewPassword(u.password);
        setPasswordStatus({ type: "idle", msg: "" });
      } else {
        setNewPassword("123");
        setPasswordStatus({ type: "idle", msg: "" });
      }
    } catch {
      setNewPassword("123");
      setPasswordStatus({ type: "idle", msg: "" });
    }
  };

  const handleCopyCredentials = () => {
    if (!passwordModalMember) return;
    const phone = passwordModalMember.phone || targetUser?.phone || "Not set";
    const text = `Pixel Task Master Login Details:\n👤 Name: ${passwordModalMember.name}\n📱 Phone: ${phone}\n🔑 Password: ${newPassword}\n🌐 Portal: ${typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalMember) return;
    if (!newPassword.trim()) {
      setPasswordStatus({ type: "error", msg: "Password cannot be empty" });
      return;
    }

    setPasswordStatus({ type: "loading", msg: "Saving new password..." });
    try {
      if (targetUser) {
        await adminResetUserPassword(targetUser.id, newPassword);
      } else {
        const newUser: AppUser = {
          id: "usr_" + passwordModalMember.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          name: passwordModalMember.name,
          phone: passwordModalMember.phone || "0000000000",
          password: newPassword.trim(),
          role: "member",
          status: "Active",
        };
        await upsertAppUser(newUser);
        setTargetUser(newUser);
      }

      setPasswordStatus({
        type: "success",
        msg: `Password updated successfully for ${passwordModalMember.name}!`,
      });
      setTimeout(() => {
        setPasswordModalMember(null);
        setPasswordStatus({ type: "idle", msg: "" });
      }, 1500);
    } catch (err: any) {
      setPasswordStatus({ type: "error", msg: err?.message || "Failed to update password." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold text-[#10254F] tracking-tight">Team Members & Login Accounts</h1>
            <p className="text-[14px] text-[#64748B] font-medium">Add members, define their sign-in credentials (Name, Phone & Password), and track tasks</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Member & Credentials
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] overflow-hidden">
        <div className="p-6 border-b border-[#E3EAF5]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, role, or phone..."
              className="pl-10 pr-4 py-2.5 w-full bg-[#F4F7FC] border border-[#E3EAF5] rounded-xl text-[13px] font-medium text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E3EBF5] text-[#64748B] text-[10px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Member (Login Name)</th>
                <th className="py-3.5 px-3">Role / Designation</th>
                <th className="py-3.5 px-3">Login Phone</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Assigned Tasks</th>
                <th className="py-3.5 px-3">Expected Target</th>
                <th className="py-3.5 px-3">Revenue Collected</th>
                <th className="py-3.5 px-3">Tasks Done</th>
                <th className="py-3.5 px-4 text-center">Credentials & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBF5]">
              {displayedMembers.map((emp) => {
                const empClients = clients.filter((c) => c.member === emp.name);
                const assignedCount = empClients.length;
                const expectedTotal = empClients.reduce((sum, c) => sum + parseInt(c.expected || "0"), 0);
                const receivedTotal = empClients.reduce((sum, c) => sum + parseInt(c.received || "0"), 0);
                const doneCount = empClients.filter((c) => c.status === "Done").length;

                return (
                  <tr key={emp.id} className="hover:bg-[#F4F7FC]/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-extrabold shrink-0">
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-[14px] text-[#10254F]">{emp.name}</p>
                          <p className="text-[11px] text-[#64748B]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-2.5 py-1 bg-[#F4F7FC] text-[#10254F] text-[11px] rounded-lg font-bold border border-[#E3EBF5]">
                        {emp.role || "Team Member"}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-[12px] font-bold text-[#10254F]">
                      {emp.phone || "—"}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-1 text-[11px] rounded-full font-bold ${
                        emp.status === "On Leave"
                          ? "bg-orange-100 text-orange-700"
                          : emp.status === "Inactive"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-[#10B981]/10 text-[#10B981]"
                      }`}>
                        {emp.status || "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-[13px] font-extrabold text-[#10254F]">{assignedCount}</p>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-[13px] font-bold text-[#64748B]">₹{expectedTotal.toLocaleString("en-US")}</p>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-[13px] font-extrabold text-[#10B981]">₹{receivedTotal.toLocaleString("en-US")}</p>
                    </td>
                    <td className="py-4 px-3">
                      <p className="text-[13px] font-bold text-[#1677FF]">{doneCount} Done</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenPasswordModal(emp)} 
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-amber-200" 
                          title="View / Reset Password & Credentials"
                        >
                          <KeyRound size={14} />
                          <span>Credentials</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(emp)} 
                          className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-md transition-colors cursor-pointer" 
                          title="Edit Member Details"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteMember(emp.id, "Admin")} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer" 
                          title="Delete Member"
                        >
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

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Add Member & Set Login</h2>
                <p className="text-[11px] text-[#64748B] font-medium">Admin sets how this member will sign in</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const memName = formData.get("name") as string;
                const memPhone = formData.get("phone") as string;
                const memEmail = formData.get("email") as string;
                const memRole = formData.get("role") as string;
                const memPass = (formData.get("password") as string) || "123";

                addMember(
                  {
                    id: "e_" + Math.random().toString(36).substr(2, 9),
                    name: memName,
                    email: memEmail,
                    phone: memPhone,
                    role: memRole,
                    status: (formData.get("status") as "Active" | "On Leave" | "Inactive") || "Active",
                  },
                  "Admin"
                );

                // Save login credentials
                try {
                  await upsertAppUser({
                    id: "usr_" + memName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
                    name: memName,
                    phone: memPhone,
                    password: memPass,
                    role: "member",
                    status: "Active",
                  });
                } catch (err) {
                  console.warn("Failed to create user login credentials:", err);
                }

                setIsAddModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                  Login Name * (Member will type this to sign in)
                </label>
                <input required name="name" type="text" placeholder="e.g. Zahid Hasan" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                  Login Phone Number * (Member will type this to sign in)
                </label>
                <input required name="phone" placeholder="e.g. 01711000000 or +8801711000000" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">
                  Login Password (Set by Admin, Default: 123)
                </label>
                <input name="password" defaultValue="123" placeholder="Default: 123" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-amber-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Role / Designation *</label>
                  <input required name="role" placeholder="e.g. Web Developer" type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address *</label>
                  <input required name="email" placeholder="zahid@pixel.com" type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue="Active" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-white">
                  <option value="Active">Active (Can Sign In)</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive (Sign In Blocked)</option>
                </select>
              </div>
              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 text-[13px] bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold">Save Member & Set Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#10254F]">Edit Member & Credentials</h2>
                <p className="text-[11px] text-[#64748B] font-medium">Update member details or change login credentials</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-[#64748B] hover:text-[#10254F]">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedName = formData.get("name") as string;
                const updatedPhone = formData.get("phone") as string;
                const updatedPass = (formData.get("password") as string) || editingPassword || "123";
                const updatedStatus = (formData.get("status") as "Active" | "On Leave" | "Inactive") || "Active";

                updateMember(
                  editingMember.id,
                  {
                    name: updatedName,
                    email: formData.get("email") as string,
                    phone: updatedPhone,
                    role: formData.get("role") as string,
                    status: updatedStatus,
                  },
                  "Admin"
                );

                upsertAppUser({
                  id: editingMember.id,
                  name: updatedName,
                  phone: updatedPhone,
                  password: updatedPass,
                  role: "member",
                  status: updatedStatus,
                });

                setEditingMember(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Login Name *</label>
                <input required name="name" defaultValue={editingMember.name} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Login Phone Number</label>
                <input name="phone" defaultValue={editingMember.phone || ""} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Login Password</label>
                <input name="password" defaultValue={editingPassword} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-amber-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Role / Designation *</label>
                  <input required name="role" defaultValue={editingMember.role || "Team Member"} type="text" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1">Email Address *</label>
                  <input required name="email" defaultValue={editingMember.email} type="email" className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1">Status</label>
                <select name="status" defaultValue={editingMember.status || "Active"} className="w-full px-3.5 py-2 text-[13px] border border-[#E3EAF5] rounded-xl focus:ring-2 focus:ring-[#10B981] outline-none bg-white">
                  <option value="Active">Active (Can Sign In)</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive (Sign In Blocked)</option>
                </select>
              </div>
              <div className="pt-4 mt-4 border-t border-[#E3EAF5] flex justify-end gap-3">
                <button type="button" onClick={() => setEditingMember(null)} className="px-5 py-2 text-[13px] text-[#64748B] hover:bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 text-[13px] bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password & Credentials Modal */}
      {passwordModalMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[26px] shadow-2xl max-w-md w-full overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] bg-[#F8FAFC] flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#10254F]">Member Login Credentials</h3>
                  <p className="text-[11px] text-[#64748B] font-medium">Manage and view credentials for {passwordModalMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalMember(null)}
                className="text-[#64748B] hover:text-[#10254F] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              {passwordStatus.type === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-[12px] font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{passwordStatus.msg}</span>
                </div>
              )}
              {passwordStatus.type === "success" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[12px] font-bold">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{passwordStatus.msg}</span>
                </div>
              )}

              {/* Login Credentials Summary Card */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E3EAF5] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-[#64748B]">Login Name:</span>
                  <span className="font-extrabold text-[#10254F]">{passwordModalMember.name}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-[#64748B]">Login Phone:</span>
                  <span className="font-extrabold text-[#10254F]">{passwordModalMember.phone || targetUser?.phone || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-[#64748B]">Current Password:</span>
                  <span className="font-extrabold text-amber-600 font-mono">{newPassword || "123"}</span>
                </div>

                <div className="pt-2 border-t border-[#E3EAF5] flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1677FF] rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied!" : "Copy Details for Member"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                  Change / Set New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full pl-3.5 pr-11 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8292A6] mt-1 font-medium">
                  Admin has master authority to change or reset any member's login password.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalMember(null)}
                  className="flex-1 py-2.5 border border-[#E3EAF5] rounded-xl font-bold text-[13px] text-[#64748B] hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={passwordStatus.type === "loading"}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {passwordStatus.type === "loading" ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
