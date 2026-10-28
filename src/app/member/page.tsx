"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, MessageCircle } from "lucide-react";
import ClientTable from "@/components/ClientTable";
import { useCRM, getLocalDateString, isTaskOnDate } from "@/context/CRMContext";
import MemberSendReportModal from "@/components/MemberSendReportModal";
import TaskDateFilterBar from "@/components/TaskDateFilterBar";

export default function MemberDashboard() {
  const { clients, currentMember, leaveTypes, leaveRequests, attendanceRecords, attendanceConfig, hrNotices, updateStatus, updateComment } = useCRM();
  
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "tomorrow" | "custom" | "all">("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("today");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const [today, setToday] = useState("");
  const [nowTs, setNowTs] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const todayStr = getLocalDateString();
    setToday(todayStr);
    setSelectedDate(todayStr);
    setNowTs(Date.now());
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks based on active date filter (defaults to today)
  const dateFilteredTasks = tasks.filter((t) => {
    if (dateFilterMode === "all") return true;
    const targetDate = dateFilterMode === "today" ? today : selectedDate;
    if (!targetDate) return true;
    return isTaskOnDate(t, targetDate);
  });

  const todayTasksCount = today
    ? tasks.filter((t) => isTaskOnDate(t, today)).length
    : 0;

  const totalTasks = dateFilteredTasks.length;
  const completedTasks = dateFilteredTasks.filter(t => t.status === "Done" || t.status === "Can't Do").length;
  const pendingTasks = dateFilteredTasks.filter(t => t.status === "Pending").length;
  const inProgressTasks = dateFilteredTasks.filter(t => t.status === "In Progress").length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Strictly tasks that are due TODAY (end_date === today) or overdue from past (end_date < today)
  const strictDueToday = tasks.filter(t => t.status === "Pending" && today && t.endDate <= today && (t.startDate ? t.startDate <= today : true));
  const dueTodayTasks = strictDueToday;

  useEffect(() => {
    if (today && strictDueToday.some(t => !t.comments?.trim())) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [today, strictDueToday.length]);

  const displayedTasks = dateFilteredTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 overflow-x-hidden">

      {/* Persistent Popup Warning */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-center">
            <div className="bg-[#FF6B00] p-6 flex justify-center">
              <AlertCircle size={48} className="text-white" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Action Required!</h2>
              <p className="text-gray-600 mb-6">
                You have <strong>{dueTodayTasks.filter(t => !t.comments?.trim()).length}</strong> pending task(s) due today without any updates. Please add a comment or update their status immediately.
              </p>
              <button 
                onClick={() => setShowWarning(false)} 
                className="bg-[#FF6B00] hover:bg-[#E65A00] text-white font-bold py-2.5 px-6 rounded-xl transition-colors w-full"
              >
                I Understand, Let me update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 5-COLUMN DASHBOARD ROW (2 per row on mobile, 5 on desktop) */}
      <div className="w-full pb-2">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4 items-stretch font-sans">
          
          {/* 1. Daily Task Progress */}
          <div className="col-span-2 md:col-span-1 bg-white p-3.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-2">
                 <div className="w-9 h-9 shrink-0 bg-[#F0F5FF] rounded-2xl flex items-center justify-center text-[#3B82F6]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                 </div>
                 <h3 className="font-extrabold text-[#111827] text-[13px] leading-[1.1] whitespace-nowrap">Daily Task<br/>Progress</h3>
               </div>
               <div className="relative flex items-center shrink-0">
                 <svg className="absolute left-1.5 text-[#4B5563] pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 <select 
                   value={progressFilter}
                   onChange={(e) => setProgressFilter(e.target.value)}
                   className="appearance-none bg-white border border-gray-200 text-[#4B5563] text-[10px] font-bold rounded-lg pl-5 pr-4 py-1 outline-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                 >
                   <option value="today">Today</option>
                   <option value="weekly">Weekly</option>
                   <option value="monthly">Monthly</option>
                 </select>
                 <svg className="absolute right-1 text-[#4B5563] pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
               </div>
             </div>
             
             <div className="flex-1 flex flex-row items-center justify-between gap-1 z-10">
                <div className="relative w-[90px] h-[90px] lg:w-[100px] lg:h-[100px] flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <path className="text-[#F3F4F6]" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <defs>
                      <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                    <path stroke="url(#blueGrad)" strokeDasharray={`${progressPercentage}, 100`} strokeWidth="4.5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <span className="text-[9px] font-bold text-[#4B5563]">{completedTasks} / {totalTasks}</span>
                    <span className="text-[22px] font-black text-[#111827] leading-tight">{progressPercentage}%</span>
                    <span className="text-[9px] font-bold text-[#6B7280]">Completed</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5 shrink-0 pl-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0"></div>
                    <div>
                      <div className="text-[12px] font-black text-[#111827] leading-none">{completedTasks}</div>
                      <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Completed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0"></div>
                    <div>
                      <div className="text-[12px] font-black text-[#111827] leading-none">{inProgressTasks}</div>
                      <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">In Progress</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0"></div>
                    <div>
                      <div className="text-[12px] font-black text-[#111827] leading-none">{pendingTasks}</div>
                      <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Pending</div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="mt-4 relative z-10 shrink-0">
                <div className="bg-[#F0F5FF]/80 rounded-2xl p-3 flex items-center justify-between border border-[#E0E7FF]">
                   <div className="flex items-center gap-2 overflow-hidden">
                     <div className="text-[#3B82F6] shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                     </div>
                     <div className="truncate">
                       <p className="text-[11px] font-black text-[#111827] leading-tight truncate">Good progress today!</p>
                       <p className="text-[9px] font-semibold text-[#6B7280] truncate">Keep going, you're doing great.</p>
                     </div>
                   </div>
                   <div className="w-6 h-6 shrink-0 rounded-full bg-white flex items-center justify-center text-[#3B82F6] shadow-sm ml-1">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                   </div>
                </div>
             </div>
             
             <svg className="absolute right-[-10px] bottom-[60px] text-[#F3F4F6] w-20 h-20 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M4 22V14h4v8H4zm6 0V8h4v14h-4zm6 0V2h4v20h-4z"/></svg>
          </div>

          {/* 2. Due Today Alert */}
          <div className="col-span-1 bg-[#FFF8ED] p-3.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#FFEDD5] flex flex-col relative overflow-hidden min-w-0">
            <div className="flex justify-between items-center mb-4 z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 shrink-0 bg-[#FFEDD5] rounded-2xl flex items-center justify-center text-[#F97316]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <h3 className="font-extrabold text-[#111827] text-[13px] whitespace-nowrap">Due Today</h3>
              </div>
              <Link href="/member/tasks" className="text-[10px] font-extrabold text-[#F97316] flex items-center gap-1 whitespace-nowrap">
                View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
            
            <div className="mb-3 z-10 shrink-0">
              <h2 className="text-[42px] font-black text-[#111827] leading-none mb-1">{dueTodayTasks.length}</h2>
              <p className="text-[11px] font-bold text-[#6B7280] flex items-center gap-1.5 mt-1">
                 <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-[#F97316]"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                 Pending Task{dueTodayTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="mt-auto z-10 flex flex-col flex-1">
              {dueTodayTasks.length > 0 ? (
                <div className="bg-white p-3.5 rounded-[20px] border border-white shadow-sm flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-[#E0E7FF] text-[#3B82F6] font-extrabold flex items-center justify-center text-xs shrink-0">
                        {dueTodayTasks[0].name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-black text-[12px] text-[#111827] truncate">{dueTodayTasks[0].name}</p>
                        <p className="text-[10px] font-bold text-[#3B82F6] flex items-center gap-1 mt-0.5 truncate">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0"></span>
                           {dueTodayTasks[0].category}
                        </p>
                      </div>
                    </div>
                    <div className="text-[#F97316] shrink-0 ml-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-medium text-[#4B5563] line-clamp-2 leading-snug flex-1">
                    {dueTodayTasks[0].taskDetails || "Set up the entire Shopify store and payment gateways"}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#111827] mt-1 shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span className="truncate">{dueTodayTasks[0].startDate}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-[20px] shadow-sm text-center flex items-center justify-center flex-1">
                  <span className="text-[12px] font-bold text-[#10B981]">All caught up!</span>
                </div>
              )}
              <Link href="/member/tasks" className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-[12px] font-bold rounded-[14px] mt-3 shadow-md flex justify-center items-center gap-1.5 shrink-0 transition-colors">
                Take Action <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
            
            <svg className="absolute right-[-20px] top-[90px] text-[#FFEDD5] w-40 h-40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>

          {/* 3. Attendance Widget */}
          <div className="col-span-1 bg-white p-3.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden min-w-0">
            <div className="absolute right-0 bottom-[60px] opacity-10 pointer-events-none">
               <div className="w-24 h-32 bg-[#3B82F6] rounded-xl transform rotate-12 absolute -right-2 -bottom-2"></div>
               <div className="w-20 h-20 bg-[#10B981] rounded-full absolute -right-2 bottom-4 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
               </div>
            </div>
            
            {(() => {
              const todayAtt = attendanceRecords.find(
                (r) => (activeMemberName === "all" || r.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase()) && r.date === today
              );
              const isCheckedIn = Boolean(todayAtt && !todayAtt.checkOutTime);
              const isCheckedOut = Boolean(todayAtt && todayAtt.checkOutTime);
              const badgeText = isCheckedOut ? "CHECKED OUT" : isCheckedIn ? "CHECKED IN" : "NOT CHECKED IN";
              const clockInDisplay = todayAtt
                ? todayAtt.checkInTime.replace(/:\d{2}\s/, " ")
                : "--:--";
              let workMins = 0;
              if (todayAtt) {
                if (todayAtt.workingMinutes !== undefined) {
                  workMins = todayAtt.workingMinutes;
                } else if (nowTs) {
                  workMins = Math.max(0, Math.round((nowTs - todayAtt.checkInTimestamp) / 60000));
                }
              }
              const workH = Math.floor(workMins / 60);
              const workM = workMins % 60;
              const workText = `${workH}h ${workM < 10 ? `0${workM}` : workM}m`;
              const workPct = Math.min(100, Math.round((workMins / ((attendanceConfig?.targetHours || 8) * 60)) * 100));

              return (
                <>
                  <div className="flex justify-between items-start mb-6 z-10">
                    <div className="w-9 h-9 shrink-0 bg-[#F0F5FF] rounded-2xl flex items-center justify-center text-[#3B82F6]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.37V7z"/></svg>
                    </div>
                    <div className={`${todayAtt ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FFEDD5] text-[#F97316]"} text-[9px] font-extrabold px-2 py-1 rounded-md flex items-center gap-1 shrink-0 whitespace-nowrap`}>
                       <div className={`w-1.5 h-1.5 ${todayAtt ? "bg-[#059669]" : "bg-[#F97316]"} rounded-full`}></div>
                       {badgeText}
                    </div>
                  </div>
                  
                  <div className="mb-6 z-10 shrink-0">
                    <h3 className="text-[14px] font-black text-[#111827] mb-2 truncate">Today's Attendance</h3>
                    <p className="text-[11px] font-medium text-[#6B7280] mb-0.5 truncate">
                      {todayAtt ? "You clocked in at" : "Office WiFi / GPS Required"}
                    </p>
                    <p className="text-[26px] font-black text-[#111827] leading-none truncate">{clockInDisplay}</p>
                  </div>
                  
                  <div className="mt-auto z-10 shrink-0">
                    <div className="flex items-center gap-1.5 mb-2.5">
                       <div className="w-5 h-5 rounded-full bg-[#F0F5FF] flex items-center justify-center text-[#3B82F6] shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                       </div>
                       <span className="text-[10px] font-bold text-[#6B7280] whitespace-nowrap">Working Hours</span>
                       <span className="text-[12px] font-black text-[#111827] ml-auto whitespace-nowrap">{workText}</span>
                    </div>
                    <div className="w-full bg-[#E0E7FF] h-[6px] rounded-full overflow-hidden mb-4">
                      <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${workPct}%` }}></div>
                    </div>
                    <Link href="/member/attendance" className={`w-full py-2.5 ${isCheckedIn ? "bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444]" : "bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669]"} text-[12px] font-bold rounded-[14px] flex items-center justify-center gap-1.5 transition-colors`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      {isCheckedIn ? "Check Out" : isCheckedOut ? "View Attendance" : "Check In"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-[14px] flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer shadow-2xs"
                      title="Send Daily Work & Attendance Report to Sir (8240017974)"
                    >
                      <MessageCircle size={13} className="text-emerald-600" />
                      <span>Send Report to Sir</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* 4. Leave Balance Widget */}
          <div className="col-span-1 bg-white p-3.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden min-w-0">
            <div className="absolute right-[-15px] top-[70px] opacity-15 pointer-events-none">
               <div className="w-24 h-24 bg-[#8B5CF6] rounded-xl transform rotate-6 relative">
                  <div className="absolute top-2 left-2 w-3 h-5 bg-white rounded-full"></div>
                  <div className="absolute top-2 right-2 w-3 h-5 bg-white rounded-full"></div>
               </div>
               <div className="w-12 h-12 bg-[#3B82F6] rounded-full absolute -right-2 -bottom-2 flex items-center justify-center transform -rotate-12">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
               </div>
            </div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div className="w-9 h-9 shrink-0 bg-[#F5F3FF] rounded-2xl flex items-center justify-center text-[#8B5CF6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"></line></svg>
              </div>
              <Link href="/member/leave" className="text-[10px] font-extrabold text-[#8B5CF6] flex items-center gap-1 mt-2 whitespace-nowrap">
                Apply Leave <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
            
            <div className="mb-4 z-10 shrink-0">
              <h3 className="text-[14px] font-black text-[#111827] mb-0.5 truncate">Leave Balances</h3>
              <p className="text-[11px] font-medium text-[#6B7280] truncate">Manage your leaves</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-auto z-10 shrink-0">
              {(() => {
                const activeTypes = leaveTypes.filter(lt => lt.active);
                const firstLeave = activeTypes[0] || { name: "Casual Leave", maxDays: 10 };
                const secondLeave = activeTypes[1] || { name: "Sick Leave", maxDays: 5 };
                const getRem = (tName: string, max: number) => {
                  const used = leaveRequests
                    .filter(lr => (activeMemberName === "all" || lr.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase()) && lr.leaveType === tName && lr.status === "Approved")
                    .reduce((s, lr) => s + lr.days, 0);
                  return max > 0 ? Math.max(0, max - used) : used;
                };
                const rem1 = getRem(firstLeave.name, firstLeave.maxDays);
                const rem2 = getRem(secondLeave.name, secondLeave.maxDays);
                return (
                  <>
                    <div className="flex items-center p-2.5 rounded-[16px] border border-gray-100 bg-[#FAFAFA] shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-[#D1FAE5] text-[#10B981] flex items-center justify-center mr-2 shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 22v-4.5l-3-2.5-3 2.5V22"></path><path d="M17 14c0-3.3-2.7-6-6-6s-6 2.7-6 6c0 1.5.6 2.9 1.5 4"></path><path d="M19 19l-2-2"></path><path d="M5 19l2-2"></path></svg>
                      </div>
                      <div className="truncate">
                         <p className="text-[11px] font-bold text-[#4B5563] mb-0.5 truncate">{firstLeave.name}</p>
                         <p className="text-[13px] font-black text-[#111827]">{rem1} <span className="text-[10px] font-bold text-[#6B7280]">days</span></p>
                      </div>
                      <div className="ml-auto text-gray-400 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-2.5 rounded-[16px] border border-gray-100 bg-[#FAFAFA] shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-[#FFEDD5] text-[#F97316] flex items-center justify-center mr-2 shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="15" rx="2" ry="2"></rect><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 1 2 2v2"></path><line x1="12" y1="10" x2="12" y2="16"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>
                      </div>
                      <div className="truncate">
                         <p className="text-[11px] font-bold text-[#4B5563] mb-0.5 truncate">{secondLeave.name}</p>
                         <p className="text-[13px] font-black text-[#111827]">{rem2} <span className="text-[10px] font-bold text-[#6B7280]">days</span></p>
                      </div>
                      <div className="ml-auto text-gray-400 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              <Link href="/member/leave" className="w-full py-2.5 bg-[#F0F5FF] hover:bg-[#E0E7FF] text-[#3B82F6] text-[12px] font-bold rounded-[14px] mt-2 flex items-center justify-center gap-1.5 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View Leave History <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
          </div>

          {/* 5. HR Notice Widget */}
          <div className="col-span-1 bg-white p-3.5 sm:p-4 rounded-[20px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative overflow-hidden min-w-0">
            <div className="absolute right-[-20px] top-[60px] opacity-15 pointer-events-none">
               <div className="w-28 h-20 bg-[#F97316] rounded-full transform -rotate-12 relative flex items-center justify-end">
                  <div className="w-6 h-10 bg-white rounded-full mr-1.5"></div>
               </div>
            </div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div className="w-9 h-9 shrink-0 bg-[#FFEDD5] rounded-2xl flex items-center justify-center text-[#F97316]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
              </div>
              <Link href="/member/hr-rules" className="text-[10px] font-extrabold text-[#F97316] flex items-center gap-1 mt-2 whitespace-nowrap">
                View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
            
            <div className="mb-4 z-10 shrink-0">
              <h3 className="text-[14px] font-black text-[#111827] mb-0.5 truncate">HR & Notices</h3>
              <p className="text-[10px] font-medium text-[#6B7280] leading-snug truncate pr-2">Stay updated with announcements</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-auto z-10 shrink-0">
              {(() => {
                const firstNotice = hrNotices[0] || {
                  title: "Eid-ul-Fitr Holidays",
                  description: "Office closed from Apr 10 to Apr 12.",
                };
                const secondNotice = hrNotices[1] || {
                  title: "New Timesheet Policy",
                  description: "Submit your timesheet by Friday 5 PM.",
                };
                return (
                  <>
                    <div className="flex items-center p-3 rounded-[16px] bg-[#FFF8ED] shadow-sm">
                      <div className="text-[#F97316] shrink-0 mr-3 self-start mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </div>
                      <div className="truncate">
                        <p className="text-[11px] font-black text-[#111827] mb-1 truncate">{firstNotice.title}</p>
                        <p className="text-[9px] font-medium text-[#6B7280] leading-snug truncate pr-1">{firstNotice.description}</p>
                      </div>
                      <div className="ml-auto text-[#F97316] shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 rounded-[16px] bg-[#F0F5FF] shadow-sm">
                       <div className="text-[#3B82F6] shrink-0 mr-3 self-start mt-0.5">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                       </div>
                       <div className="truncate">
                         <p className="text-[11px] font-black text-[#111827] mb-1 truncate">{secondNotice.title}</p>
                         <p className="text-[9px] font-medium text-[#6B7280] leading-snug truncate pr-1">{secondNotice.description}</p>
                       </div>
                       <div className="ml-auto text-[#3B82F6] shrink-0">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                       </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Task List */}
      <div className="bg-white rounded-[24px] border border-[#E3EAF5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden font-sans">
        <div className="p-6 border-b border-[#E3EAF5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[#1677FF] bg-[#1677FF]/10 p-2.5 rounded-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-[#10254F] text-[16px] tracking-tight">
                {dateFilterMode === "today" ? "Today's Task List" : dateFilterMode === "custom" ? `Task List for ${selectedDate}` : "All Assigned Tasks History"}
              </h3>
              <p className="text-[12px] text-[#64748B] mt-0.5">Update statuses and add comments directly in the table below.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-[#E3EAF5] text-[12px] font-bold text-[#10254F] pl-8 pr-8 py-2 rounded-lg outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Can't Do">Can't Do</option>
              </select>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="Send Today's Work Report to Sir (8240017974)"
            >
              <MessageCircle size={15} />
              <span>Send Report to Sir</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="px-5 py-3 border-b border-[#E3EAF5] bg-[#F8FAFC]">
          <TaskDateFilterBar
            dateFilterMode={dateFilterMode}
            onModeChange={setDateFilterMode}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            todayDate={today}
            todayTasksCount={todayTasksCount}
            totalAllTasksCount={tasks.length}
          />
        </div>
        <ClientTable 
          clients={displayedTasks} 
          isAdmin={false} 
          onStatusChange={handleStatusChange}
          onCommentChange={handleCommentChange}
        />
      </div>

      {/* Member Send Report to Sir Modal */}
      <MemberSendReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        memberName={activeMemberName}
      />
    </div>
  );
}
