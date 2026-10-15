"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, CheckSquare, ListTodo, Users } from "lucide-react";
import StatCard from "@/components/StatCard";
import ClientTable from "@/components/ClientTable";
import { useCRM } from "@/context/CRMContext";

export default function MemberTasks() {
  const { clients, members, currentMember, setCurrentMember, updateStatus, updateComment } = useCRM();
  
  const [viewFilter, setViewFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  const activeMemberName = currentMember || "Rahim";
  const tasks = activeMemberName === "all"
    ? clients
    : clients.filter(c => c.member?.trim().toLowerCase() === activeMemberName.trim().toLowerCase());

  const handleStatusChange = (id: string, newStatus: "Pending" | "In Progress" | "Can't Do" | "Done") => {
    updateStatus(id, newStatus, activeMemberName === "all" ? "Member" : activeMemberName);
  };

  const handleCommentChange = (id: string, newComment: string) => {
    updateComment(id, newComment, activeMemberName === "all" ? "Member" : activeMemberName);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done" || t.status === "Can't Do").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending").length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const displayedTasks = tasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (viewFilter === "daily" && today) {
      return t.endDate <= today && t.status === "Pending"; 
    }
    if (viewFilter === "regular") {
      return t.taskType === "Regular";
    }
    if (viewFilter === "onetime") {
      return t.taskType === "One-Time";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
            <ListTodo size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[24px] font-extrabold text-[#10254F] tracking-tight">
              {activeMemberName === "all" ? "All Members' Tasks" : `${activeMemberName}'s Task Management`}
            </h2>
            <p className="text-[14px] text-[#64748B] font-medium">View and update your assigned tasks here.</p>
          </div>
        </div>

        {/* Active Member Badge */}
        <div className="flex items-center gap-2 bg-white border border-[#E3EAF5] rounded-xl px-3.5 py-2 shadow-sm self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <Users size={16} className="text-[#1677FF]" />
          <span className="text-[12px] font-bold text-[#64748B]">Assigned To:</span>
          <span className="text-[13px] font-extrabold text-[#10254F]">{activeMemberName}</span>
        </div>
      </div>

      {/* 1 Row for Stat Cards (Daily Progress) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_1fr] lg:grid-cols-2 gap-5">
        
        {/* Daily Progress Box (Donut Chart matching reference) */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col h-full relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="text-[#1677FF]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
              </div>
              <h3 className="font-extrabold text-[#10254F] text-[16px]">Daily Task Progress</h3>
            </div>
            <select className="text-[12px] font-bold text-[#64748B] bg-[#F3F6FB] border border-[#E3EAF5] rounded-lg px-2.5 py-1.5 outline-none hover:bg-gray-50 transition-colors cursor-pointer">
              <option>Today</option>
              <option>Week</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-center justify-between mb-4 mt-2">
            {/* Donut Chart */}
            <div className="relative w-[120px] h-[120px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path className="text-[#F3F6FB]" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-[#1677FF]" strokeDasharray={`${progressPercentage}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-extrabold text-[#10254F] leading-[1.1]">{progressPercentage}%</span>
                <span className="text-[9px] font-bold text-[#64748B] mt-0.5 text-center leading-tight tracking-wider">{completedTasks}/{totalTasks} <br/>Completed</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-3.5 ml-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm"></div>
                <div className="text-[12px] font-bold flex items-center gap-1.5">
                  <span className="text-[#10254F] w-3 text-right">{completedTasks}</span> 
                  <span className="text-[#64748B] font-medium">Completed</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1677FF] shadow-sm"></div>
                <div className="text-[12px] font-bold flex items-center gap-1.5">
                  <span className="text-[#10254F] w-3 text-right">{inProgressTasks}</span> 
                  <span className="text-[#64748B] font-medium">In Progress</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] shadow-sm"></div>
                <div className="text-[12px] font-bold flex items-center gap-1.5">
                  <span className="text-[#10254F] w-3 text-right">{pendingTasks}</span> 
                  <span className="text-[#64748B] font-medium">Pending</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-4 flex items-center gap-3 border-t border-transparent">
            <div className="text-[#1677FF]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-[#10254F] leading-tight mb-0.5">Good progress today!</p>
              <p className="text-[11px] font-medium text-[#64748B]">Keep going, you're doing great.</p>
            </div>
          </div>
        </div>

        {/* Task Stats Grid */}
        <StatCard 
          title="Total Assigned" 
          value={totalTasks.toString()} 
          subtitle={`Assigned to ${activeMemberName === "all" ? "team" : activeMemberName}`} 
          icon={<CheckSquare size={22} />} 
          theme="blue"
          progress={100}
        />
        <StatCard 
          title="Completed" 
          value={completedTasks.toString()} 
          subtitle="Done or Can't Do" 
          icon={<CheckCircle size={20} />} 
          theme="green"
          progress={progressPercentage}
        />
        <StatCard 
          title="Pending Actions" 
          value={pendingTasks.toString()} 
          subtitle="Requires follow-up" 
          icon={<Clock size={20} />} 
          theme="orange"
          progress={totalTasks === 0 ? 0 : Math.round((pendingTasks / totalTasks) * 100)}
        />
      </div>

      {/* Full Task List Table */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[#1677FF] bg-[#1677FF]/10 p-2.5 rounded-xl">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-[#10254F] text-[18px] tracking-tight">My Task List ({activeMemberName === "all" ? "All" : activeMemberName})</h3>
              <p className="text-[13px] text-[#64748B] mt-0.5">Update statuses and add comments directly in the table below.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={viewFilter}
                onChange={e => setViewFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-10 pr-10 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Assigned Tasks</option>
                <option value="daily">Due Today / Overdue</option>
                <option value="regular">Regular Tasks</option>
                <option value="onetime">One-Time Tasks</option>
              </select>
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[13px] font-bold text-[#10254F] pl-10 pr-10 py-2.5 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Can't Do">Can't Do</option>
              </select>
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
        <ClientTable 
          clients={displayedTasks} 
          isAdmin={false} 
          onStatusChange={handleStatusChange}
          onCommentChange={handleCommentChange}
        />
      </div>
    </div>
  );
}
