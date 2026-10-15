"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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
  const pathname = usePathname();

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
