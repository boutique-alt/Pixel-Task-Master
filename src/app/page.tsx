"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles
} from "lucide-react";
import { authenticateUser, resetUserPassword, INITIAL_APP_USERS } from "@/lib/authService";
import { useCRM } from "@/context/CRMContext";
import InstallAppPrompt from "@/components/InstallAppPrompt";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentMember } = useCRM();

  // Login form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotName, setForgotName] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your registered Name");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your registered Phone Number");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your Password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateUser(name, phone, password);
      if (result.error || !result.user) {
        setErrorMsg(result.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login
      if (result.user.role === "admin") {
        router.push("/admin");
      } else {
        // Set member name so the member portal immediately displays their profile and tasks
        setCurrentMember(result.user.name);
        router.push("/member");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred during login.");
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotName.trim() || !forgotPhone.trim()) {
      setForgotStatus({ type: "error", msg: "Please provide both your registered Name and Phone number." });
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 3) {
      setForgotStatus({ type: "error", msg: "Password must be at least 3 characters long." });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotStatus({ type: "error", msg: "Passwords do not match. Please re-enter." });
      return;
    }

    setForgotStatus({ type: "loading", msg: "Verifying account details..." });

    try {
      const res = await resetUserPassword(forgotName, forgotPhone, forgotNewPass);
      if (res.success) {
        setForgotStatus({ type: "success", msg: res.message });
        // Auto-fill login fields with new password
        setName(forgotName);
        setPhone(forgotPhone);
        setPassword(forgotNewPass);
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setForgotStatus({ type: "idle", msg: "" });
        }, 1800);
      } else {
        setForgotStatus({ type: "error", msg: res.message });
      }
    } catch (err: any) {
      setForgotStatus({ type: "error", msg: err?.message || "Failed to reset password." });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1677FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-[28px] shadow-[0_12px_40px_rgba(16,37,79,0.08)] border border-[#E3EAF5] p-8 md:p-9 transition-all">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-white border border-[#E3EAF5] px-5 py-2.5 rounded-2xl shadow-sm inline-block">
                <Image
                  src="/brand-logo.png"
                  alt="Pixel Task Master"
                  width={220}
                  height={60}
                  className="object-contain h-14 w-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[13px] animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-semibold leading-tight">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Admin or Rahim"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] placeholder:text-[#8292A6] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or 01711223344"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] placeholder:text-[#8292A6] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[12px] font-bold text-[#10254F] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotName(name || "Admin");
                    setForgotPhone(phone || "");
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[12px] font-bold text-[#1677FF] hover:text-[#0D418D] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] placeholder:text-[#8292A6] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#1677FF] hover:bg-[#1260CC] text-white py-3.5 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(22,119,255,0.35)] cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Install App Banner on Login */}
        <InstallAppPrompt variant="banner" />
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[26px] shadow-2xl max-w-md w-full overflow-hidden border border-[#E3EAF5]">
            <div className="p-6 border-b border-[#E3EAF5] bg-[#F8FAFC] flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#10254F]">Reset Your Password</h3>
                  <p className="text-[11px] text-[#64748B] font-medium">Verify your registered Name & Phone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotStatus({ type: "idle", msg: "" });
                }}
                className="text-[#64748B] hover:text-[#10254F] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4">
              {forgotStatus.type === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-[12px] font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{forgotStatus.msg}</span>
                </div>
              )}
              {forgotStatus.type === "success" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[12px] font-bold">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{forgotStatus.msg}</span>
                </div>
              )}

              {forgotName.trim().toLowerCase() === "admin" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[12px] font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#1677FF] shrink-0" />
                  <span>Admin Mode: Enter any phone number to link it to your Admin account (Default phone: 9876543210).</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                  Registered Full Name
                </label>
                <input
                  type="text"
                  value={forgotName}
                  onChange={(e) => setForgotName(e.target.value)}
                  placeholder="e.g. Rahim or Admin"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                  Registered Phone Number
                </label>
                <input
                  type="text"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder="e.g. +880 1711-223344 or 9876543210"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={forgotConfirmPass}
                  onChange={(e) => setForgotConfirmPass(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E3EAF5] rounded-xl font-bold text-[13px] text-[#64748B] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.type === "loading"}
                  className="flex-1 py-2.5 bg-[#1677FF] hover:bg-[#1260CC] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50"
                >
                  {forgotStatus.type === "loading" ? "Saving..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
