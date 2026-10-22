"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppPrompt({ variant = "header" }: { variant?: "header" | "sidebar" | "banner" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);

      // 2. Check if iOS device
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isAppleMobile);

      // 3. Listen for browser PWA install event
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsStandalone(true);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      // Fallback instruction if browser hasn't fired prompt yet
      alert(
        "To install this app:\n1. Click the 3 dots (⋮) or Install icon in your browser menu.\n2. Select 'Install Pixel Task Master' or 'Add to Home screen'."
      );
    }
  };

  // If already installed in standalone mode or user dismissed, don't show
  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* 1. Header Pill Variant */}
      {variant === "header" && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 text-[#1677FF] border border-[#1677FF]/20 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Install Pixel Task Master App"
        >
          <Download size={14} className="shrink-0 animate-bounce" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {/* 2. Sidebar Card Variant */}
      {variant === "sidebar" && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-[#1677FF]/25 to-[#0D2653] border border-[#1677FF]/35 rounded-[18px] flex items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#1677FF] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-black text-white leading-tight truncate">Install App</p>
              <p className="text-[10px] text-[#A6C0E6] font-medium truncate">Home screen &amp; Desktop</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-[#1677FF] hover:bg-[#1260CC] text-white text-[11px] font-extrabold rounded-xl shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            Install
          </button>
        </div>
      )}

      {/* 3. Login Page Banner Variant */}
      {variant === "banner" && (
        <div className="mt-4 p-3.5 bg-white/90 backdrop-blur-md border border-[#E3EAF5] rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center shrink-0">
              <Smartphone size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#10254F]">Get the Mobile &amp; Desktop App</p>
              <p className="text-[11px] text-[#8292A6]">Install on home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-[#1677FF] hover:bg-[#1260CC] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Install
          </button>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-gray-900 text-base">
                <Smartphone size={18} className="text-[#1677FF]" />
                Install on iPhone / iPad
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Safari on iOS does not support one-click installation, but you can install it in 2 simple steps:
            </p>

            <div className="space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-800 font-semibold">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <span>
                  Tap the <Share size={14} className="inline text-blue-600 mx-1" /> <strong>Share</strong> button at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#1677FF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#1677FF] text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
