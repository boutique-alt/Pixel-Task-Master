"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCRM } from "@/context/CRMContext";
import { 
  LayoutDashboard, 
  ListTodo, 
  Calendar, 
  Clock, 
  BookOpen, 
  Landmark,
  Users,
  Settings,
  FileText,
  Bell,
  X
} from "lucide-react";

interface SidebarProps {
  role?: "admin" | "member";
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role = "admin", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentMember, sessionUser, logout } = useCRM();
  const displayName = sessionUser?.name || (currentMember === "all" ? "All Members" : currentMember);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside 
        className={`w-[270px] sm:w-[280px] lg:w-[260px] bg-[#0A192F] text-white flex flex-col h-screen fixed left-0 top-0 overflow-hidden z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Decorative Pixel Background (Bottom Left) */}
        <div className="absolute bottom-10 left-0 w-32 h-64 z-0 pointer-events-none opacity-20 flex flex-wrap content-end">
          <div className="w-8 h-8 bg-[#1677FF] ml-0 mb-4 opacity-50"></div>
          <div className="w-8 h-8 bg-[#1677FF] ml-8 mb-8 opacity-70"></div>
          <div className="w-8 h-8 bg-[#1677FF] ml-16 mb-4 opacity-30"></div>
          <div className="w-8 h-8 bg-[#1677FF] ml-8 mb-16 opacity-40"></div>
          <div className="w-8 h-8 bg-[#1677FF] ml-0 mb-12 opacity-80"></div>
          <div className="w-8 h-8 bg-[#1677FF] ml-24 mb-10 opacity-60"></div>
        </div>

        {/* Header / Brand Logo */}
        <div className="px-5 pt-6 pb-3 relative z-10 flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center justify-center bg-white px-3.5 py-2.5 sm:py-3 rounded-2xl shadow-sm">
            <Image 
              src="/brand-logo.png" 
              alt="Pixel Task Master" 
              width={240} 
              height={60} 
              className="w-full h-auto object-contain max-h-[50px] sm:max-h-[56px]" 
              priority 
            />
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Close navigation"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 mt-3 relative z-10 overflow-y-auto">
          <Link 
            href={`/${role}`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname === `/${role}` ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            <LayoutDashboard size={20} className={pathname === `/${role}` ? '' : 'opacity-70'} />
            <span className="text-[14px]">Dashboard</span>
          </Link>
          <Link 
            href={`/${role}/tasks`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/tasks') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            <ListTodo size={20} className={pathname.includes('/tasks') ? '' : 'opacity-70'} />
            <span className="text-[14px]">Tasklist</span>
          </Link>
          <Link 
            href={`/${role}/leave`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/leave') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            <Calendar size={20} className={pathname.includes('/leave') ? '' : 'opacity-70'} />
            <span className="text-[14px]">Leave apply</span>
          </Link>
          <Link 
            href={`/${role}/attendance`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/attendance') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            {role === "admin" ? (
              <FileText size={20} className={pathname.includes('/attendance') ? '' : 'opacity-70'} />
            ) : (
              <Clock size={20} className={pathname.includes('/attendance') ? '' : 'opacity-70'} />
            )}
            <span className="text-[14px]">
              {role === "admin" ? "Daily Reports & Attendance" : "Check in / Out & Report"}
            </span>
          </Link>
          <Link 
            href={`/${role}/hr-rules`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/hr-rules') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            <BookOpen size={20} className={pathname.includes('/hr-rules') ? '' : 'opacity-70'} />
            <span className="text-[14px]">HR rules</span>
          </Link>
          <Link 
            href={`/${role}/bank-details`} 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/bank-details') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
          >
            <Landmark size={20} className={pathname.includes('/bank-details') ? '' : 'opacity-70'} />
            <span className="text-[14px]">Bank details</span>
          </Link>
          
          {/* Admin specific links */}
          {role === "admin" && (
            <>
              <div className="pt-4 pb-1 px-4 text-[10px] uppercase font-extrabold text-[#1677FF] tracking-wider">Admin Management</div>
              <Link 
                href="/admin/alerts" 
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/alerts') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
              >
                <Bell size={20} className={pathname.includes('/alerts') ? '' : 'opacity-70'} />
                <span className="text-[14px]">Alerts &amp; Broadcast</span>
              </Link>
              <Link 
                href={`/${role}/users`} 
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/users') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
              >
                <Landmark size={20} className={pathname.includes('/users') ? '' : 'opacity-70'} />
                <span className="text-[14px]">Clients (CRUD)</span>
              </Link>
              <Link 
                href={`/${role}/members`} 
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/members') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
              >
                <Users size={20} className={pathname.includes('/members') ? '' : 'opacity-70'} />
                <span className="text-[14px]">Members (CRUD)</span>
              </Link>
              <Link 
                href={`/${role}/settings`} 
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-semibold transition-colors ${pathname.includes('/settings') ? 'bg-[#1677FF] text-white font-bold' : 'text-[#A6C0E6] hover:bg-[#1C355E] hover:text-white'}`}
              >
                <Settings size={20} className={pathname.includes('/settings') ? '' : 'opacity-70'} />
                <span className="text-[14px]">Settings</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Footer / Sign Out */}
        <div className="p-4 mt-auto relative z-10 w-full">
          <button 
            onClick={logout} 
            className="flex items-center gap-3 px-4 py-3 bg-[#0D2653] hover:bg-[#123069] rounded-[16px] cursor-pointer transition-colors justify-between w-full text-left"
            title="Sign out from portal"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[#1677FF] flex items-center justify-center text-white font-extrabold shrink-0 text-sm">
                {role === "admin" ? "A" : (displayName ? displayName.charAt(0).toUpperCase() : "M")}
              </div>
              <div className="overflow-hidden">
                <p className="text-[14px] font-extrabold text-white truncate leading-tight">
                  {role === "admin" ? "Admin User" : displayName}
                </p>
                <p className="text-[11px] text-[#A6C0E6] font-medium truncate mt-0.5">Click to Log out</p>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6C0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </aside>
    </>
  );
}
