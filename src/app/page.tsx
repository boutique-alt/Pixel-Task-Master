"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ArrowLeft
} from "lucide-react";
import { 
  authenticateUser, 
  resetUserPassword, 
  isPhoneMatch, 
  getAllUsers,
  getAdminSecurityConfig,
  verifyAdminMasterPin,
  getSessionUser,
  AppUser
} from "@/lib/authService";
import { useCRM } from "@/context/CRMContext";
import InstallAppPrompt from "@/components/InstallAppPrompt";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentMember } = useCRM();

  // Auto-restore session state across device restarts
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Login form state (Only Phone & Password!)
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password modal state (Phone + PIN Verification)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotAccount, setForgotAccount] = useState<AppUser | null>(null);
  
  // Step 1: Phone & PIN inputs
  const [forgotPhone, setForgotPhone] = useState("");
  const [masterPinInput, setMasterPinInput] = useState("");
  const [showMasterPin, setShowMasterPin] = useState(false);
  
  // Step 2: New password inputs
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  
  const [forgotStatus, setForgotStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  // Automatically restore active session (survives phone restarts & browser reloads)
  useEffect(() => {
    try {
      const activeUser = getSessionUser();
      if (activeUser && activeUser.id && activeUser.role) {
        if (activeUser.role === "admin") {
          router.replace("/admin");
          return;
        } else if (activeUser.role === "coordinator") {
          if (activeUser.name) setCurrentMember(activeUser.name);
          router.replace("/coordinator");
          return;
        } else if (activeUser.role === "member") {
          if (activeUser.name) setCurrentMember(activeUser.name);
          router.replace("/member");
          return;
        }
      }
    } catch (e) {
      console.warn("Session auto-restore error:", e);
    }
    setIsCheckingSession(false);
  }, [router, setCurrentMember]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

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
      const result = await authenticateUser(phone.trim(), password.trim());
      if (result.error || !result.user) {
        setErrorMsg(result.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login
      if (result.user.role === "admin") {
        router.push("/admin");
      } else if (result.user.role === "coordinator") {
        setCurrentMember(result.user.name);
        router.push("/coordinator");
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

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotStep(1);
    setForgotAccount(null);
    setForgotPhone("");
    setMasterPinInput("");
    setShowMasterPin(false);
    setForgotNewPass("");
    setForgotConfirmPass("");
    setShowForgotPass(false);
    setShowForgotConfirm(false);
    setForgotStatus({ type: "idle", msg: "" });
  };

  const openForgotModal = () => {
    setIsForgotModalOpen(true);
    setForgotStep(1);
    setForgotPhone(phone || "");
    setMasterPinInput("");
    setForgotStatus({ type: "idle", msg: "" });
  };

  // Step 1: Verify Phone Number AND Master Security PIN
  const handleVerifyAccountAndPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone.trim()) {
      setForgotStatus({ type: "error", msg: "Please enter your registered Phone number." });
      return;
    }
    if (!masterPinInput.trim()) {
      setForgotStatus({ type: "error", msg: "Master Security PIN is required to reset password." });
      return;
    }

    setForgotStatus({ type: "loading", msg: "Verifying phone & Security PIN..." });

    try {
      const users = await getAllUsers();
      const adminConf = await getAdminSecurityConfig();
      const inputPhone = forgotPhone.trim();

      const isAdmin = 
        isPhoneMatch(adminConf.phone, inputPhone) ||
        isPhoneMatch("1234567890", inputPhone) ||
        isPhoneMatch("9876543210", inputPhone) ||
        inputPhone.toLowerCase() === "admin" ||
        inputPhone.toLowerCase().includes("pixel");

      let target: AppUser | null = null;
      if (isAdmin) {
        target = users.find(u => u.role === "admin") || {
          id: "usr_admin",
          name: adminConf.name || "Pixel Solution",
          phone: adminConf.phone || "1234567890",
          password: "admin",
          role: "admin",
          status: "Active"
        };
      } else {
        target = users.find(u => {
          if (u.role === "admin") return false;
          return isPhoneMatch(u.phone, inputPhone) || (inputPhone.length >= 3 && u.name.toLowerCase() === inputPhone.toLowerCase());
        }) || null;
      }

      if (!target) {
        setForgotStatus({
          type: "error",
          msg: "No registered account matches this Phone Number. Please check your number or contact Admin.",
        });
        return;
      }

      // Verify Master Security PIN
      const isPinValid = await verifyAdminMasterPin(masterPinInput.trim());
      if (!isPinValid) {
        setForgotStatus({
          type: "error",
          msg: "Incorrect Master Security PIN. Only users with the authorized PIN (set in Admin Settings) can reset passwords.",
        });
        return;
      }

      // Phone & PIN Verified! Move to Step 2
      setForgotAccount(target);
      setForgotStatus({ type: "idle", msg: "" });
      setForgotStep(2);
    } catch (err: any) {
      setForgotStatus({ type: "error", msg: err?.message || "Failed to verify details." });
    }
  };

  // Step 2: Set New Password
  const handleFinalPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPass || forgotNewPass.length < 3) {
      setForgotStatus({ type: "error", msg: "Password must be at least 3 characters long." });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotStatus({ type: "error", msg: "Passwords do not match. Please re-enter." });
      return;
    }

    setForgotStatus({ type: "loading", msg: "Updating your password..." });

    try {
      const targetPhone = forgotAccount?.phone || forgotPhone;
      const res = await resetUserPassword(targetPhone, forgotNewPass);
      if (res.success) {
        setForgotStatus({ type: "success", msg: res.message });
        setPhone(targetPhone);
        setPassword(forgotNewPass);
        setTimeout(() => {
          closeForgotModal();
        }, 1800);
      } else {
        setForgotStatus({ type: "error", msg: res.message });
      }
    } catch (err: any) {
      setForgotStatus({ type: "error", msg: err?.message || "Failed to reset password." });
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#F0F4FA] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#1677FF] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[#10254F] font-semibold text-sm">Restoring secure session...</p>
      </div>
    );
  }

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
            <p className="text-[13px] text-[#64748B] font-medium mt-1">
              Sign in with your registered phone number
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[13px] animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-semibold leading-tight">{errorMsg}</div>
            </div>
          )}

          {/* Login Form (Clean: Phone & Password Only!) */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-[12px] font-bold text-[#10254F] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8292A6]">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 1234567890 or +880 1711-223344"
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] placeholder:text-[#8292A6] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[12px] font-bold text-[#10254F] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-[12px] font-bold text-[#1677FF] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8292A6]">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-semibold text-[#10254F] placeholder:text-[#8292A6] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all shadow-sm"
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
              className="w-full mt-3 bg-[#1677FF] hover:bg-[#1260CC] text-white py-3.5 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(22,119,255,0.35)] cursor-pointer disabled:opacity-60"
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

      {/* PIN-Protected Forgot Password Modal (No Name Option!) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[26px] shadow-2xl max-w-md w-full overflow-hidden border border-[#E3EAF5]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E3EAF5] bg-[#F8FAFC] flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                {forgotStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStatus({ type: "idle", msg: "" });
                      setForgotStep(1);
                    }}
                    className="p-1.5 -ml-1 text-[#64748B] hover:text-[#10254F] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E3EAF5]"
                    title="Back to previous step"
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#10254F] leading-tight">
                    {forgotStep === 1 ? "Reset with Security PIN" : "Set New Password"}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    {forgotStep === 1 ? "Step 1 of 2: Verify Phone & Master PIN" : "Step 2 of 2: Enter new password"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-[#64748B] hover:text-[#10254F] p-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <X size={19} />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="px-6 pt-4 pb-1">
              <div className="grid grid-cols-2 gap-2">
                <div className={`h-1.5 rounded-full transition-all ${forgotStep >= 1 ? "bg-[#1677FF]" : "bg-[#E3EAF5]"}`} />
                <div className={`h-1.5 rounded-full transition-all ${forgotStep >= 2 ? "bg-[#1677FF]" : "bg-[#E3EAF5]"}`} />
              </div>
            </div>

            <div className="p-6 pt-3 space-y-4">
              {/* Alert Status */}
              {forgotStatus.type === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[12px] font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span className="leading-tight">{forgotStatus.msg}</span>
                </div>
              )}
              {forgotStatus.type === "success" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-[12px] font-bold">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-tight">{forgotStatus.msg}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 1: PHONE & MASTER PIN VERIFICATION (NO NAME)         */}
              {/* ========================================================= */}
              {forgotStep === 1 && (
                <form onSubmit={handleVerifyAccountAndPin} className="space-y-3.5">
                  {(isPhoneMatch("9876543210", forgotPhone) ||
                    isPhoneMatch("1234567890", forgotPhone) ||
                    forgotPhone.trim().toLowerCase() === "admin") && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[12px] font-semibold flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#1677FF] shrink-0" />
                      <span>Admin Account: Enter your Master PIN to authorize reset.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                      Registered Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8292A6]">
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="e.g. 1234567890 or +880 1711-223344"
                        required
                        autoFocus
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Master Security PIN Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-[#10254F] uppercase flex items-center gap-1.5">
                        <KeyRound size={13} className="text-[#1677FF]" />
                        Master Security PIN
                      </label>
                      <span className="text-[10px] text-[#64748B] font-medium">Set in Admin Settings</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8292A6]">
                        <ShieldCheck size={16} />
                      </div>
                      <input
                        type={showMasterPin ? "text" : "password"}
                        value={masterPinInput}
                        onChange={(e) => setMasterPinInput(e.target.value)}
                        placeholder="Enter 4-6 digit Master PIN"
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[14px] font-bold tracking-widest text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterPin(!showMasterPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] p-1"
                        aria-label={showMasterPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showMasterPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 font-medium leading-tight">
                      Default PIN is <code className="bg-[#E2E8F0] px-1 py-0.5 rounded font-mono font-bold text-[#10254F]">123456</code> (Configurable in Admin Settings).
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="flex-1 py-2.5 border border-[#E3EAF5] rounded-xl font-bold text-[13px] text-[#64748B] hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotStatus.type === "loading"}
                      className="flex-1 py-2.5 bg-[#1677FF] hover:bg-[#1260CC] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {forgotStatus.type === "loading" ? "Verifying..." : "Verify PIN →"}
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* STEP 2: SET NEW PASSWORD                                  */}
              {/* ========================================================= */}
              {forgotStep === 2 && (
                <form onSubmit={handleFinalPasswordReset} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 text-[12px] font-bold">
                      <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                      <span>PIN Verified for {forgotAccount?.name || forgotPhone}!</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Authorized
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8292A6]">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showForgotPass ? "text" : "password"}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="Enter new password"
                        required
                        autoFocus
                        className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPass(!showForgotPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] p-1"
                      >
                        {showForgotPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#10254F] uppercase mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8292A6]">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showForgotConfirm ? "text" : "password"}
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirm(!showForgotConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] p-1"
                      >
                        {showForgotConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="flex-1 py-2.5 border border-[#E3EAF5] rounded-xl font-bold text-[13px] text-[#64748B] hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotStatus.type === "loading"}
                      className="flex-1 py-2.5 bg-[#1677FF] hover:bg-[#1260CC] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm disabled:opacity-50"
                    >
                      {forgotStatus.type === "loading" ? "Saving..." : "Save & Sign In"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}