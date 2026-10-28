"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getSessionUser } from "@/lib/authService";
import { Lock } from "lucide-react";

interface PortalLayoutProps {
  children: React.ReactNode;
  role: "admin" | "member";
  defaultTitle?: string;
  defaultSubtitle?: string;
}

export default function PortalLayout({
  children,
  role,
  defaultTitle,
  defaultSubtitle,
}: PortalLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const pathname = usePathname();

  // Strict Authentication Guard
  useEffect(() => {
    const checkAuth = () => {
      const activeUser = getSessionUser();

      // 1. Not logged in at all
      if (!activeUser || !activeUser.role) {
        setAuthStatus("unauthorized");
        window.location.replace("/");
        return;
      }

      // 2. Member trying to access Admin portal
      if (role === "admin" && activeUser.role !== "admin") {
        setAuthStatus("unauthorized");
        window.location.replace("/member");
        return;
      }

      // 3. User with unknown role
      if (role === "member" && activeUser.role !== "member" && activeUser.role !== "admin") {
        setAuthStatus("unauthorized");
        window.location.replace("/");
        return;
      }

      setAuthStatus("authorized");
    };

    checkAuth();
  }, [role, pathname]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // If checking authentication, show a clean, branded loading spinner (prevents any data leak)
  if (authStatus === "checking") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F7FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#1677FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verifying Security Credentials...</p>
        </div>
      </div>
    );
  }

  // If unauthorized, show access restricted screen while redirecting
  if (authStatus === "unauthorized") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F7FC] p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-red-100 space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">Access Restricted</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              You must be logged in with authorized {role === "admin" ? "Admin" : "Member"} credentials to view this portal. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FC]">
      {/* Mobile Drawer & Desktop Fixed Sidebar */}
      <Sidebar
        role={role}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] ml-0 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          title={defaultTitle}
          subtitle={defaultSubtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
