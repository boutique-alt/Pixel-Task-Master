"use client";

import React, { useState, useEffect } from "react";
import { useCRM, MemberProfileDetail } from "@/context/CRMContext";
import {
  User,
  CreditCard,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Save,
  CheckCircle2,
  Upload,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  Clock,
  Download,
  Building,
} from "lucide-react";

export default function MemberDetailsPage() {
  const { currentMember, sessionUser, memberDetailsList, saveMemberProfileDetail, isHydrated } = useCRM();

  // Active member identification
  const activeMemberName =
    sessionUser?.name || (currentMember && currentMember !== "all" ? currentMember : "Rahim");

  const existingDetail = memberDetailsList.find(
    (m) => m.memberName.trim().toLowerCase() === activeMemberName.trim().toLowerCase()
  );

  // Form states
  const [profilePhoto, setProfilePhoto] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [panImage, setPanImage] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharImage, setAadharImage] = useState("");
  const [alternateNumber, setAlternateNumber] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [offerLetterSignedPdf, setOfferLetterSignedPdf] = useState("");
  const [offerLetterFileName, setOfferLetterFileName] = useState("");

  const [savedToast, setSavedToast] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ title: string; src: string; isPdf?: boolean } | null>(null);

  // Sync inputs on existingDetail or activeMember change only after hydration to prevent wiping
  useEffect(() => {
    if (!isHydrated) return;

    if (existingDetail) {
      setProfilePhoto(existingDetail.profilePhoto || "");
      setPanNumber(existingDetail.panNumber || "");
      setPanImage(existingDetail.panImage || "");
      setAadharNumber(existingDetail.aadharNumber || "");
      setAadharImage(existingDetail.aadharImage || "");
      setAlternateNumber(existingDetail.alternateNumber || "");
      setDob(existingDetail.dob || "");
      setAddress(existingDetail.address || "");
      setOfferLetterSignedPdf(existingDetail.offerLetterSignedPdf || "");
      setOfferLetterFileName(existingDetail.offerLetterFileName || "");
    }
  }, [existingDetail, activeMemberName, isHydrated]);

  // Image compressor: downscales image to max 640px and 0.65 quality (typically 30-50KB)
  // This ensures lightning fast Supabase upload without timeouts or localStorage quota issues.
  const compressImage = (file: File, maxWidth = 640, maxHeight = 640, quality = 0.65): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Generic file upload to base64 with auto-compression for photos
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    nameSetter?: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (nameSetter) {
      nameSetter(file.name);
    }

    if (file.type.startsWith("image/")) {
      try {
        const compressedBase64 = await compressImage(file, 640, 640, 0.65);
        setter(compressedBase64);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") setter(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check completeness
    const isComplete = Boolean(
      profilePhoto &&
      panImage &&
      aadharImage &&
      alternateNumber.trim() &&
      dob.trim() &&
      address.trim() &&
      offerLetterSignedPdf
    );

    saveMemberProfileDetail({
      memberName: activeMemberName,
      profilePhoto: profilePhoto || undefined,
      panNumber: panNumber.trim().toUpperCase(),
      panImage: panImage || undefined,
      aadharNumber: aadharNumber.trim(),
      aadharImage: aadharImage || undefined,
      alternateNumber: alternateNumber.trim(),
      dob: dob.trim(),
      address: address.trim(),
      offerLetterSignedPdf: offerLetterSignedPdf || undefined,
      offerLetterFileName: offerLetterFileName || undefined,
      status: isComplete ? "Verified" : "Pending",
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const isFormFilled = Boolean(
    panImage || aadharImage || alternateNumber || dob || address || offerLetterSignedPdf
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>Member details and KYC documents saved successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D2653] to-[#1677FF] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider backdrop-blur-sm">
            <User size={13} />
            <span>Official Employee Identity &amp; KYC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Member Profile &amp; KYC Details</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Please submit your PAN Card, Aadhaar Card, Alternate Phone, Date of Birth, Address, and Signed Offer Letter for company record verification.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Logged in: <strong>{activeMemberName}</strong>
            </span>

            {existingDetail?.status && (
              <span
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  existingDetail.status === "Verified"
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-200 border-amber-400/30"
                }`}
              >
                {existingDetail.status === "Verified" ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                Status: {existingDetail.status}
              </span>
            )}
          </div>
        </div>

        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <FileCheck size={200} />
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E3EAF5] shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Section 0: Member / Coordinator Photo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#10254F]">1. Member / Coordinator Photo</h2>
              <p className="text-xs text-gray-500">Upload your clear passport-size or portrait photo for your official company ID profile.</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1677FF]/10 text-[#1677FF] flex flex-col items-center justify-center font-black text-2xl">
                    {activeMemberName[0]}
                  </div>
                )}
              </div>

              {profilePhoto && (
                <button
                  type="button"
                  onClick={() => setPreviewModal({ title: `${activeMemberName}'s Photo`, src: profilePhoto })}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
                >
                  <Eye size={14} /> View
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-dashed border-[#1677FF]/60 hover:border-[#1677FF] text-[#1677FF] rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                  <Upload size={14} />
                  <span>{profilePhoto ? "Change Photo" : "Upload Profile Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setProfilePhoto)}
                    className="hidden"
                  />
                </label>

                {profilePhoto && (
                  <button
                    type="button"
                    onClick={() => setProfilePhoto("")}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                JPG, PNG or WebP format. Make sure your face is clearly visible.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Personal & Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
              <Phone size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#10254F]">2. Basic Details &amp; Alternate Contact</h2>
              <p className="text-xs text-gray-500">Your date of birth, emergency alternate number, and residence address.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={activeMemberName}
                disabled
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Alternate Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={alternateNumber}
                  onChange={(e) => setAlternateNumber(e.target.value)}
                  required
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-gray-800 outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of Birth (DOB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-3 text-gray-800 outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Residential Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <textarea
                  rows={2}
                  placeholder="House/Flat No, Street, Landmark, City, State, PIN code..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-white border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-gray-800 outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Identity Documents (PAN & Aadhaar) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#10254F]">3. Government ID Proofs (PAN &amp; Aadhaar)</h2>
              <p className="text-xs text-gray-500">Upload clear images or photo scans of your PAN card and Aadhaar card.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PAN Card Box */}
            <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#10254F] flex items-center gap-1.5 uppercase">
                  <CreditCard size={14} className="text-[#1677FF]" />
                  PAN Card Details
                </span>
                {panImage && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Image Uploaded
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  PAN Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#1677FF] uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  PAN Card Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-[#1677FF] rounded-xl text-xs font-bold text-gray-700 cursor-pointer transition-colors shadow-2xs">
                    <Upload size={14} className="text-[#1677FF]" />
                    <span>{panImage ? "Change PAN Image" : "Upload PAN Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setPanImage)}
                      className="hidden"
                    />
                  </label>

                  {panImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ title: `${activeMemberName}'s PAN Card`, src: panImage })}
                      className="p-2 bg-blue-50 text-[#1677FF] border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                      title="Preview PAN Card"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>

              {panImage && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-white group">
                  <img
                    src={panImage}
                    alt="PAN Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ title: `${activeMemberName}'s PAN Card`, src: panImage })}
                      className="px-3 py-1 bg-white text-gray-800 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Aadhaar Card Box */}
            <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#10254F] flex items-center gap-1.5 uppercase">
                  <CreditCard size={14} className="text-purple-600" />
                  Aadhaar Card Details
                </span>
                {aadharImage && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Image Uploaded
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Aadhaar Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234 5678 9012"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Aadhaar Card Image / Scan <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-purple-600 rounded-xl text-xs font-bold text-gray-700 cursor-pointer transition-colors shadow-2xs">
                    <Upload size={14} className="text-purple-600" />
                    <span>{aadharImage ? "Change Aadhaar Image" : "Upload Aadhaar Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setAadharImage)}
                      className="hidden"
                    />
                  </label>

                  {aadharImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ title: `${activeMemberName}'s Aadhaar Card`, src: aadharImage })}
                      className="p-2 bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                      title="Preview Aadhaar Card"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>

              {aadharImage && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-white group">
                  <img
                    src={aadharImage}
                    alt="Aadhaar Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModal({ title: `${activeMemberName}'s Aadhaar Card`, src: aadharImage })}
                      className="px-3 py-1 bg-white text-gray-800 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Signed Offer Letter PDF */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#10254F]">4. Offer Letter Signed PDF</h2>
              <p className="text-xs text-gray-500">Upload your signed appointment/offer letter document in PDF or image format.</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-amber-950 block">Signed Offer Letter Attachment</span>
                <span className="text-[11px] text-amber-700">Accepts PDF, PNG, JPG, or Scanned Document</span>
              </div>

              {offerLetterSignedPdf && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                  <CheckCircle2 size={12} /> File Attached
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-amber-300 hover:border-amber-600 rounded-xl text-xs font-bold text-amber-900 cursor-pointer transition-colors shadow-2xs">
                <Upload size={15} className="text-amber-600" />
                <span>{offerLetterSignedPdf ? "Replace Signed File" : "Choose Signed Offer Letter PDF"}</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => handleFileUpload(e, setOfferLetterSignedPdf, setOfferLetterFileName)}
                  className="hidden"
                />
              </label>

              {offerLetterFileName && (
                <span className="text-xs font-semibold text-gray-700 bg-white px-3 py-2 rounded-xl border border-gray-200 truncate max-w-xs">
                  📄 {offerLetterFileName}
                </span>
              )}

              {offerLetterSignedPdf && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: `${activeMemberName}'s Signed Offer Letter`,
                      src: offerLetterSignedPdf,
                      isPdf: offerLetterSignedPdf.startsWith("data:application/pdf"),
                    })
                  }
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Preview / Open Document</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            🔒 All KYC documents are protected and verified only by authorized Admin.
          </p>

          <button
            type="submit"
            className="px-6 py-3 bg-[#1677FF] hover:bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Save size={16} />
            <span>Save Member Details</span>
          </button>
        </div>
      </form>

      {/* Full Preview Modal for Image/PDF */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-black text-gray-900">{previewModal.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewModal.src}
                  download="document"
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  title="Download File"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100/50">
              {previewModal.isPdf ? (
                <iframe
                  src={previewModal.src}
                  title={previewModal.title}
                  className="w-full h-[65vh] rounded-xl border border-gray-200"
                />
              ) : (
                <img
                  src={previewModal.src}
                  alt={previewModal.title}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-sm border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
