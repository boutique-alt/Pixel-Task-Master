"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, MessageCircle } from "lucide-react";

export type Client = {
  id: string;
  name: string;
  phone: string;
  category: string;
  taskDetails?: string;
  member?: string;
  expected: string;
  received: string;
  status: "Pending" | "In Progress" | "Can't Do" | "Done";
  taskType: "One-Time" | "Regular";
  startDate: string;
  endDate: string;
  reason?: string;
  comments?: string;
};

interface ClientTableProps {
  clients: Client[];
  isAdmin: boolean;
  isCoordinator?: boolean;
  members?: string[];
  onStatusChange?: (id: string, status: "Pending" | "In Progress" | "Can't Do" | "Done") => void;
  onCommentChange?: (id: string, comment: string) => void;
  onAssignChange?: (id: string, memberName: string) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
}

export default function ClientTable({ clients, isAdmin, isCoordinator, members = [], onStatusChange, onCommentChange, onAssignChange, onEdit, onDelete }: ClientTableProps) {
  const [today, setToday] = useState("");
  const showAssignee = isAdmin || isCoordinator;
  const showFinancials = isAdmin; // Hide financial figures from coordinator

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  return (
    <div className="overflow-x-auto -mx-1 sm:mx-0">
      <table className="w-full text-left border-collapse min-w-[780px]">
        <thead>
          <tr className="border-b border-[#E3EBF5] text-[#64748B] text-[10px] uppercase tracking-wider font-bold">
            <th className="pb-4 pt-2 font-bold px-3">Client Name</th>
            <th className="pb-4 pt-2 font-bold px-2">Task Details</th>
            <th className="pb-4 pt-2 font-bold px-2 whitespace-nowrap">Assign Date</th>
            {showAssignee && <th className="pb-4 pt-2 font-bold px-2">Assigned To</th>}
            {showFinancials && <th className="pb-4 pt-2 font-bold px-2">Expected</th>}
            {showFinancials && <th className="pb-4 pt-2 font-bold px-2">Received</th>}
            <th className="pb-4 pt-2 font-bold px-2">Status</th>
            <th className="pb-4 pt-2 font-bold px-2">Comments/Remarks</th>
            {(isAdmin || isCoordinator) && <th className="pb-4 pt-2 font-bold px-3 text-center">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E3EBF5]">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={showFinancials ? 9 : 7} className="py-12 text-center text-[#64748B] text-sm font-medium">
                No tasks found matching the selected filters.
              </td>
            </tr>
          ) : (
            clients.map((c) => {
              const isOverdue = today && c.status === "Pending" && c.endDate < today;
              const isDueTodayNoUpdate = today && c.status === "Pending" && c.endDate <= today && !c.comments?.trim();

              return (
                <tr key={c.id} className="hover:bg-[#F4F7FC]/50 transition-colors group">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#1677FF]/10 text-[#1677FF] font-extrabold flex items-center justify-center text-[15px] shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-[14px] text-[#14233F]">{c.name}</p>
                        <p className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] inline-block"></span>
                          {c.category}
                          {isAdmin && c.phone && <span className="text-[#94A3B8] font-medium">• {c.phone}</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col gap-1 items-start min-w-[200px] max-w-[340px]">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider border ${c.taskType === 'One-Time' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-[#1677FF]/10 text-[#1677FF] border-[#1677FF]/20'}`}>
                          {c.taskType || "Regular"}
                        </span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]">
                            Overdue
                          </span>
                        )}
                      </div>
                      {c.taskDetails ? (
                        <p className="text-[13px] font-bold text-[#14233F] mt-1 break-words whitespace-normal leading-snug">
                          {c.taskDetails}
                        </p>
                      ) : (
                        <p className="text-[13px] font-bold text-[#14233F] mt-1">-</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-1.5 text-[#14233F] text-[12px] font-bold bg-[#F4F7FC] border border-[#E3EBF5] px-2 py-1.5 rounded-lg w-max">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {c.startDate} to {c.endDate}
                    </div>
                  </td>
                  
                  {/* Assignee Field */}
                  {showAssignee && (
                    <td className="py-4 px-2">
                      <select
                        value={c.member || ""}
                        onChange={(e) => onAssignChange?.(c.id, e.target.value)}
                        className="text-[12px] font-bold text-[#1677FF] bg-[#1677FF]/10 border border-[#1677FF]/20 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#1677FF] cursor-pointer"
                      >
                        <option value="" disabled>Assign...</option>
                        {members.map(emp => (
                          <option key={emp} value={emp}>{emp}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  {showFinancials && (
                    <td className="py-4 px-2">
                      <p className="text-[13px] font-bold text-[#14233F]">₹{parseInt(c.expected || "0").toLocaleString("en-US")}</p>
                    </td>
                  )}
                  {showFinancials && (
                    <td className="py-4 px-2">
                      <p className="text-[13px] font-bold text-[#08B981]">₹{parseInt(c.received || "0").toLocaleString("en-US")}</p>
                    </td>
                  )}

                  {/* Status Column */}
                  <td className="py-4 px-2">
                    {(isAdmin || isCoordinator) && !onStatusChange ? (
                      <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-full font-bold whitespace-nowrap ${
                        c.status === 'Done' ? 'bg-[#08B981]/10 text-[#08B981]' :
                        c.status === 'Can\'t Do' ? 'bg-red-100 text-red-700' :
                        c.status === 'In Progress' ? 'bg-[#1677FF]/10 text-[#1677FF]' :
                        'bg-[#FF7900]/10 text-[#FF7900]'
                      }`}>
                        {c.status}
                      </span>
                    ) : (
                      <div className="relative w-max">
                        <select
                          value={c.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as Client["status"];
                            if (!isAdmin && !isCoordinator && newStatus === "Pending" && !c.comments?.trim()) {
                              alert("⚠️ Action Blocked: You must add a comment explaining why this task is pending before changing its status.");
                              return;
                            }
                            onStatusChange?.(c.id, newStatus);
                          }}
                          className={`appearance-none text-[12px] font-bold rounded-lg pl-8 pr-7 py-1.5 border outline-none cursor-pointer whitespace-nowrap ${
                            c.status === 'Done' ? 'bg-[#08B981]/10 text-[#08B981] border-[#08B981]/20 focus:ring-1 focus:ring-[#08B981]' :
                            c.status === 'Can\'t Do' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-1 focus:ring-red-500' :
                            c.status === 'In Progress' ? 'bg-[#1677FF]/10 text-[#1677FF] border-[#1677FF]/20 focus:ring-1 focus:ring-[#1677FF]' :
                            'bg-[#FFF8ED] text-[#FF7900] border-[#FFEDD5] focus:ring-1 focus:ring-[#FF7900]'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          <option value="Can't Do">Can't Do</option>
                        </select>
                        {/* Fake Icon left */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {c.status === 'Done' ? (
                            <svg className="text-[#08B981]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : c.status === 'Pending' ? (
                            <svg className="text-[#FF7900]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-10h6"></path></svg>
                          ) : (
                            <svg className="text-[#1677FF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          )}
                        </div>
                        {/* Fake Arrow right */}
                        <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 ${
                          c.status === 'Done' ? 'text-[#08B981]' :
                          c.status === 'Pending' ? 'text-[#FF7900]' :
                          'text-[#1677FF]'
                        }`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    )}
                  </td>

                  {/* Comments Field */}
                  <td className="py-4 px-2 w-[230px]">
                    {isAdmin || isCoordinator ? (
                      <div className={`flex items-start gap-2 text-[12px] p-2 rounded-lg w-full border ${
                        isDueTodayNoUpdate
                          ? "bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]"
                          : c.comments?.trim()
                          ? "bg-[#F4F7FC] border-[#E3EBF5] text-[#14233F] font-semibold"
                          : "bg-[#F4F7FC] border-[#E3EBF5] text-[#64748B]"
                      }`}>
                        <MessageCircle size={14} className={`shrink-0 mt-0.5 ${isDueTodayNoUpdate ? "text-[#DC2626]" : "text-[#1677FF]"}`} />
                        <p className="truncate" title={c.comments}>
                          {c.comments?.trim() ? c.comments : isDueTodayNoUpdate ? "No member update yet!" : "No comments"}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A6C0E6]" />
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={c.comments || ""}
                          onChange={(e) => onCommentChange?.(c.id, e.target.value)}
                          className="w-full text-[12px] font-medium text-[#14233F] pl-8 pr-3 py-2 border border-[#E3EBF5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF] transition-all shadow-sm placeholder:text-[#A6C0E6]"
                        />
                      </div>
                    )}
                  </td>

                  {/* Actions (Admin & Coordinator) */}
                  {(isAdmin || isCoordinator) && (
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEdit?.(c)} className="p-1.5 text-[#1677FF] hover:bg-[#1677FF]/10 rounded-md transition-colors cursor-pointer" title="Edit Task">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => onDelete?.(c.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer" title="Delete Task">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
