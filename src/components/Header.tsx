"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Users, LogOut, ShieldCheck, UserCheck, Menu } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import InstallAppPrompt from "@/components/InstallAppPrompt";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onToggleMobileMenu?: () => void;
}

const ROUTE_INFO: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Manage your company overview and activities" },
  "/admin/tasks": { title: "Tasklist", subtitle: "Manage and assign client tasks" },
  "/admin/leave": { title: "Leave Apply", subtitle: "Review and approve employee leave requests" },
  "/admin/attendance": { title: "Daily Reports & Attendance", subtitle: "Member daily work reports, live attendance & office security" },
  "/admin/alerts": { title: "Alerts & Announcements", subtitle: "Broadcast notifications and alerts with ringtone to members" },
  "/admin/hr-rules": { title: "HR Rules", subtitle: "Office policies, rules & company notices" },
  "/admin/bank-details": { title: "Bank Details", subtitle: "Member accounts & salary payment records" },
  "/admin/users": { title: "Client Directory", subtitle: "Create and manage company client records" },
  "/admin/members": { title: "Members Management", subtitle: "Employee accounts, roles & credentials" },
  "/admin/settings": { title: "Settings", subtitle: "System preferences and configurations" },
  "/coordinator": { title: "Task Assignment & Updates", subtitle: "Assign tasks to members and monitor progress" },
  "/coordinator/tasks": { title: "Task Assignment & Updates", subtitle: "Assign tasks to members and monitor progress" },
  "/coordinator/attendance": { title: "Check in / Out & Report", subtitle: "Daily punch in, punch out & working hours" },
  "/coordinator/leave": { title: "Apply for Leave", subtitle: "Submit and track your leave requests & chosen holidays" },
  "/coordinator/hr-rules": { title: "Office Rules & HR", subtitle: "Company guidelines and announcements" },
  "/coordinator/bank-details": { title: "My Bank Details", subtitle: "Your bank account and payment info" },
  "/member/tasks": { title: "My Tasklist", subtitle: "View and update your assigned tasks" },
  "/member/leave": { title: "Apply for Leave", subtitle: "Submit and track your leave requests" },
  "/member/attendance": { title: "My Attendance", subtitle: "Daily punch in, punch out & working hours" },
  "/member/hr-rules": { title: "Office Rules & HR", subtitle: "Company guidelines and announcements" },
  "/member/bank-details": { title: "My Bank Details", subtitle: "Your bank account and payment info" },
};

export default function Header({
  title,
  subtitle,
  onToggleMobileMenu,
}: HeaderProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lastReadCount, setLastReadCount] = useState<number>(0);
  const { activities, currentMember, sessionUser, logout } = useCRM();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isMemberRoute = pathname?.startsWith("/member");

  // Load last read activities count from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ptm_notifications_read_count");
      if (stored) {
        setLastReadCount(parseInt(stored, 10) || 0);
      }
    } catch {}
  }, []);

  const unreadCount = Math.max(0, activities.length - lastReadCount);

  const handleOpenNotifications = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      // Mark as read
      setLastReadCount(activities.length);
      try {
        localStorage.setItem("ptm_notifications_read_count", activities.length.toString());
      } catch {}
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine title and subtitle
  const routeMeta = pathname ? ROUTE_INFO[pathname] : undefined;
  
  let displayTitle = title;
  let displaySubtitle = subtitle;

  if (isMemberRoute && pathname === "/member") {
    displayTitle = `Hello, ${currentMember === "all" ? "Member" : (currentMember || "Member")} 👋`;
    displaySubtitle = "Here are your daily task assignments. Keep pushing!";
  } else if (routeMeta) {
    if (!title || title === "Dashboard") {
      displayTitle = routeMeta.title;
      displaySubtitle = routeMeta.subtitle;
    }
  } else if (!displayTitle) {
    displayTitle = isMemberRoute
      ? `Hello, ${currentMember === "all" ? "Member" : (currentMember || "Member")} 👋`
      : "Dashboard";
    displaySubtitle = "Manage your dashboard here";
  }

  const isCoordinatorRoute = pathname?.startsWith("/coordinator");
  const currentRole = sessionUser?.role || (isCoordinatorRoute ? "coordinator" : isMemberRoute ? "member" : "admin");
  const displayName = sessionUser?.name || (isCoordinatorRoute ? (currentMember || "Coordinator") : isMemberRoute ? (currentMember || "Member") : "Admin");

  return (
    <header className="flex justify-between items-center bg-transparent px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-7 pb-3 sm:pb-4 z-30 relative gap-3">
      {/* Left Area: Mobile Hamburger + Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Hamburger Menu Button (Mobile & Tablet) */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-[#10254F] hover:text-[#1677FF] bg-white hover:bg-[#F4F7FC] rounded-xl border border-[#E3EAF5] shadow-sm transition-colors cursor-pointer shrink-0"
          title="Open menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h2 className="text-[18px] sm:text-[22px] lg:text-[28px] font-extrabold text-[#10254F] tracking-tight truncate leading-tight">
            {displayTitle}
          </h2>
          <p className="text-[11px] sm:text-[13px] lg:text-[15px] text-[#64748B] mt-0.5 font-medium truncate hidden xs:block sm:block">
            {displaySubtitle}
          </p>
        </div>
      </div>

      {/* Right Area: Search, Account Badge, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Locked Active Member Badge on Member Portal (hidden on small phones) */}
        {isMemberRoute && (
          <div className="hidden sm:flex items-center gap-2 bg-white border border-[#E3EAF5] rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <Users size={14} className="text-[#1677FF] shrink-0" />
            <span className="text-[11px] font-bold text-[#64748B] whitespace-nowrap">My Account:</span>
            <span className="text-[12px] sm:text-[13px] font-extrabold text-[#10254F] max-w-[100px] truncate">{currentMember || "Member"}</span>
          </div>
        )}

        {/* Search Bar (Desktop only) */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8292A6]" />
          <input
            type="text"
            placeholder="Search tasks, clients..."
            className="pl-11 pr-4 py-2.5 bg-white border border-[#E3EAF5] rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1677FF] transition-all w-[220px] lg:w-[280px] shadow-sm font-semibold text-[#10254F] placeholder:text-[#8292A6]"
          />
        </div>
        
        {/* Install App Button */}
        <InstallAppPrompt variant="header" />

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleOpenNotifications}
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#64748B] hover:text-[#10254F] transition-colors bg-white rounded-full border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] max-w-xs sm:w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E3EAF5] overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 sm:p-4 border-b border-[#E3EAF5] bg-[#F3F6FB] flex justify-between items-center">
                <h3 className="font-bold text-[#10254F] text-sm">Notifications</h3>
                <span className="text-xs font-bold bg-[#1677FF]/10 text-[#1677FF] px-2.5 py-1 rounded-full">
                  {activities.length} Total
                </span>
              </div>
              <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-6 text-center text-[#64748B] text-sm font-medium">No new notifications</div>
                ) : (
                  <div className="divide-y divide-[#E3EAF5]">
                    {activities.map((act) => (
                      <div key={act.id} className="p-3.5 sm:p-4 hover:bg-[#F3F6FB] transition-colors cursor-pointer">
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            act.type === 'status' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            act.type === 'assign' ? 'bg-[#1677FF]/10 text-[#1677FF]' :
                            act.type === 'comment' ? 'bg-[#FF6B00]/10 text-[#FF6B00]' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <Bell size={14} />
                          </div>
                          <div>
                            <p className="text-[12px] sm:text-[13px] text-[#10254F] font-semibold leading-snug">{act.text}</p>
                            <p className="text-[10px] sm:text-[11px] text-[#64748B] mt-1 font-medium">{act.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {activities.length > 0 && (
                <div className="p-2.5 sm:p-3 border-t border-[#E3EAF5] bg-[#F3F6FB] text-center">
                  <button className="text-[12px] sm:text-[13px] font-bold text-[#1677FF] hover:text-[#0D418D]">View all activities</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar & Logout Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1677FF] hover:bg-[#1260CC] flex items-center justify-center text-white font-extrabold cursor-pointer shadow-[0_2px_8px_rgba(22,119,255,0.3)] text-[14px] sm:text-[15px] transition-all"
            title="User Profile & Sign Out"
            aria-label="User Profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] max-w-[260px] sm:w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E3EAF5] overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 sm:p-4 border-b border-[#E3EAF5] bg-[#F8FAFC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center font-extrabold text-[16px] shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[14px] font-extrabold text-[#10254F] truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {currentRole === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1677FF]/10 text-[#1677FF]">
                          <ShieldCheck size={11} /> Admin
                        </span>
                      ) : currentRole === "coordinator" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6]/10 text-[#8B5CF6]">
                          <UserCheck size={11} /> Coordinator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981]">
                          <UserCheck size={11} /> Team Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-[13px] font-bold transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
