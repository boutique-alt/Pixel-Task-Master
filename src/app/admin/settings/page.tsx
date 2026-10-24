"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Copy,
  Check,
  Key
} from "lucide-react";
import { 
  getAdminSecurityConfig, 
  updateAdminSecurityConfig, 
  AdminSecurityConfig 
} from "@/lib/authService";

export default function SettingsPage() {
  const [config, setConfig] = useState<AdminSecurityConfig>({
    name: "Pixel Solution",
    phone: "1234567890",
    email: "admin@company.com",
    pin: "123456",
    currentPassword: "admin",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Toggles for viewing credentials
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  // Copy state feedback
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [isPinCopied, setIsPinCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const conf = await getAdminSecurityConfig();
        setConfig(conf);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleCopyPassword = () => {
    const pass = config.currentPassword || "admin";
    navigator.clipboard.writeText(pass);
    setIsPasswordCopied(true);
    setTimeout(() => setIsPasswordCopied(false), 2500);
  };

  const handleCopyPin = () => {
    const pin = config.pin || "123456";
    navigator.clipboard.writeText(pin);
    setIsPinCopied(true);
    setTimeout(() => setIsPinCopied(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "idle", msg: "" });

    if (!config.name.trim()) {
      setStatus({ type: "error", msg: "Full Name is required." });
      return;
    }
    if (!config.phone.trim()) {
      setStatus({ type: "error", msg: "Phone Number is required." });
      return;
    }
    if (!config.pin || config.pin.trim().length < 4) {
      setStatus({ type: "error", msg: "Master Security PIN must be at least 4 digits (Recommended: 6 digits)." });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 3) {
        setStatus({ type: "error", msg: "New Password must be at least 3 characters long." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatus({ type: "error", msg: "New passwords do not match." });
        return;
      }
    }

    setIsLoading(true);
    setStatus({ type: "loading", msg: "Saving security settings..." });

    try {
      await updateAdminSecurityConfig({
        name: config.name.trim(),
        phone: config.phone.trim(),
        email: config.email.trim(),
        pin: config.pin.trim(),
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });

      if (newPassword.trim()) {
        setConfig((prev) => ({ ...prev, currentPassword: newPassword.trim() }));
      }

      setStatus({
        type: "success",
        msg: "Admin Profile, Master Security PIN & credentials saved successfully!",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.message || "Failed to save settings." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-extrabold text-[#10254F]">Profile & Master Security Settings</h1>
        <p className="text-[13px] text-[#64748B] font-medium mt-0.5">
          View your current login password, manage Master PIN, and update admin credentials
        </p>
      </div>

      {status.type === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-[13px] font-bold animate-in fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{status.msg}</span>
        </div>
      )}

      {status.type === "success" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-[13px] font-bold animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{status.msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Profile Information Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#E3EAF5] overflow-hidden">
          <div className="p-6 border-b border-[#E3EAF5] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-[#10254F]">Admin Profile Information</h2>
                <p className="text-[12px] text-[#64748B] font-medium">Your primary identity and portal credentials</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                  Full Name / Organization Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    required
                    placeholder="e.g. Pixel Solution or Admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                  Master Phone Number *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                  <input
                    type="text"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    required
                    placeholder="e.g. 1234567890"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 font-medium">
                  Used to sign in to the Admin panel and verify admin identity.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    required
                    placeholder="e.g. admin@pixelsolution.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 font-medium">
                  Used for official administrative communications and notifications.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                  Role Authority
                </label>
                <input
                  type="text"
                  value="Administrator (Super Admin Access)"
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#64748B] cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Admin Sign-In Password Card (VIEW CURRENT & CHANGE) */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#E3EAF5] overflow-hidden">
          <div className="p-6 border-b border-[#E3EAF5] bg-gradient-to-r from-blue-50/70 to-indigo-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/15 text-[#1677FF] flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-[#10254F]">Admin Sign-In Password</h2>
                <p className="text-[12px] text-[#64748B] font-medium">
                  Check your current login password or choose a new one
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-[#1677FF] text-[11px] font-bold rounded-full border border-blue-200">
              <ShieldCheck size={13} /> Active Password
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* CURRENT PASSWORD VIEWER */}
            <div className="max-w-md p-4 bg-[#F8FAFC] border border-[#E3EAF5] rounded-2xl">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[12px] font-bold text-[#10254F] uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-[#1677FF]" />
                  <span>Current Admin Password</span>
                </label>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Decrypted
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1677FF]" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={config.currentPassword || "admin"}
                  readOnly
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-[#E3EAF5] rounded-xl text-[15px] font-bold tracking-wider text-[#10254F] focus:outline-none select-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1.5 text-[#8292A6] hover:text-[#10254F] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1.5 text-[#8292A6] hover:text-[#1677FF] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Copy password to clipboard"
                  >
                    {isPasswordCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[#64748B] font-medium">
                  Click the eye icon to view or copy your current sign-in password.
                </p>
                {isPasswordCopied && (
                  <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* CHANGE PASSWORD FIELDS */}
            <div className="pt-2 border-t border-[#E3EAF5]">
              <h3 className="text-[13px] font-extrabold text-[#10254F] mb-3">Change Admin Password (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                    New Admin Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full pl-10 pr-12 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8292A6] hover:text-[#10254F] p-1.5 cursor-pointer"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8292A6]" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[13px] font-semibold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Master Security PIN Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#E3EAF5] overflow-hidden">
          <div className="p-6 border-b border-[#E3EAF5] bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="text-[16px] font-extrabold text-[#10254F]">Master Security Recovery PIN</h2>
                <p className="text-[12px] text-amber-900/70 font-medium">
                  Your private emergency PIN for instant password recovery
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-200">
              <ShieldCheck size={13} /> Highly Protected
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3">
              <HelpCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[12px] text-amber-900/90 leading-relaxed font-medium">
                <p className="font-bold">Why do I need a Master Recovery PIN?</p>
                <p className="mt-0.5">
                  Without this private PIN, an unauthorized person could try to reset your Admin account. <strong>Never share this PIN with anyone.</strong>
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-[12px] font-bold text-[#10254F] mb-1.5 uppercase">
                6-Digit Master Recovery PIN *
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
                <input
                  type={showPin ? "text" : "password"}
                  value={config.pin}
                  onChange={(e) => setConfig({ ...config, pin: e.target.value.replace(/[^0-9]/g, "").slice(0, 8) })}
                  maxLength={8}
                  required
                  placeholder="e.g. 123456"
                  className="w-full pl-10 pr-20 py-2.5 bg-[#F8FAFC] border border-[#E3EAF5] rounded-xl text-[16px] font-mono tracking-widest font-extrabold text-[#10254F] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="p-1.5 text-[#8292A6] hover:text-[#10254F] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="p-1.5 text-[#8292A6] hover:text-amber-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Copy PIN"
                  >
                    {isPinCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[#64748B] font-medium">
                  Default PIN is <span className="font-mono font-bold text-amber-700">123456</span>. You can change this PIN whenever you want.
                </p>
                {isPinCopied && (
                  <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#1677FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl text-[14px] font-bold transition-all shadow-[0_4px_14px_rgba(22,119,255,0.3)] disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            <span>{isLoading ? "Saving Settings..." : "Save Settings & Master PIN"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}