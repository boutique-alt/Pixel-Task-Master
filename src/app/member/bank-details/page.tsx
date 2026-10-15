"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/context/CRMContext";
import {
  Landmark,
  Smartphone,
  CheckCircle2,
  Clock,
  Save,
  QrCode,
  Upload,
  Eye,
  X,
  IndianRupee,
  Calendar,
} from "lucide-react";

export default function MemberBankDetailsPage() {
  const { currentMember, bankDetails, salaryPayments, saveMemberBankDetail } = useCRM();

  const activeMemberName = currentMember && currentMember !== "all" ? currentMember : "Rahim";

  const myBank = bankDetails.find(
    (b) => b.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase()
  );

  const myPayments = salaryPayments.filter(
    (p) => p.member.trim().toLowerCase() === activeMemberName.trim().toLowerCase()
  );

  const totalReceived = myPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiNumber, setUpiNumber] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Sync form inputs whenever activeMemberName or myBank changes
  useEffect(() => {
    if (myBank) {
      setAccountHolderName(myBank.accountHolderName || "");
      setBankName(myBank.bankName || "");
      setAccountNumber(myBank.accountNumber || "");
      setIfscCode(myBank.ifscCode || "");
      setBranchName(myBank.branchName || "");
      setUpiId(myBank.upiId || "");
      setUpiNumber(myBank.upiNumber || "");
      setQrCodeImage(myBank.qrCodeImage || "");
    } else {
      setAccountHolderName(activeMemberName.toUpperCase());
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setBranchName("");
      setUpiId("");
      setUpiNumber("");
      setQrCodeImage("");
    }
  }, [activeMemberName, myBank?.id]);

  // Handle QR Image file upload (converts to Base64 for localStorage sync)
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setQrCodeImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) return;

    saveMemberBankDetail({
      member: activeMemberName,
      accountHolderName: accountHolderName.trim() || activeMemberName.toUpperCase(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      branchName: branchName.trim(),
      upiId: upiId.trim(),
      upiNumber: upiNumber.trim(),
      qrCodeImage: qrCodeImage || undefined,
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* QR Code Full Preview Modal */}
      {showQrModal && (myBank?.qrCodeImage || qrCodeImage) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900">
                {activeMemberName}&apos;s Payment QR Code
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-center">
              <img
                src={myBank?.qrCodeImage || qrCodeImage}
                alt="Payment QR Code"
                className="max-h-72 w-auto object-contain rounded-xl"
              />
            </div>
            {myBank?.upiId && (
              <p className="text-xs font-bold text-gray-600">UPI ID: {myBank.upiId}</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Landmark size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              My Bank, QR &amp; Payment History ({activeMemberName})
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload your bank details &amp; UPI QR code and view all salary/payments received from Admin
            </p>
          </div>
        </div>

        {myBank && (
          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto ${
              myBank.status === "Verified"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {myBank.status === "Verified" ? (
              <>
                <CheckCircle2 size={15} /> Verified by Admin
              </>
            ) : (
              <>
                <Clock size={15} /> Pending Admin Verification
              </>
            )}
          </span>
        )}
      </div>

      {savedToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Your Bank, UPI &amp; QR Code details have been saved and synced with Admin!
        </div>
      )}

      {/* TOP SUMMARY CARDS: SAVED BANK + UPI & QR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bank Account Card */}
        <div className="bg-gradient-to-br from-[#10254F] to-[#1A365D] p-6 rounded-3xl shadow-md text-white flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                Primary Salary Bank Account
              </p>
              <h3 className="text-lg font-black text-white mt-0.5">
                {myBank?.bankName || "No Bank Saved Yet"}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Landmark size={18} className="text-white" />
            </div>
          </div>

          <div className="my-4">
            <div className="text-[10px] font-bold text-white/50 uppercase">Account Number</div>
            <div className="text-xl font-black tracking-widest font-mono text-white mt-0.5">
              {myBank?.accountNumber || "— — — —"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-white/50 uppercase block font-bold">Holder Name</span>
              <span className="font-bold text-white truncate block">
                {myBank?.accountHolderName || activeMemberName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/50 uppercase block font-bold">IFSC Code</span>
              <span className="font-mono font-bold text-white">{myBank?.ifscCode || "—"}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/50 uppercase block font-bold">Branch</span>
              <span className="font-bold text-white truncate block">{myBank?.branchName || "—"}</span>
            </div>
          </div>
        </div>

        {/* UPI & QR Code Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                UPI &amp; Payment QR Code
              </p>
              <h3 className="text-lg font-black text-gray-900 mt-0.5">
                {myBank?.upiId || "No UPI ID Added"}
              </h3>
              <p className="text-xs font-mono font-bold text-gray-500 mt-1">
                {myBank?.upiNumber ? `Number: ${myBank.upiNumber}` : "No mobile number added"}
              </p>
            </div>

            {/* QR Thumbnail or Icon */}
            {myBank?.qrCodeImage ? (
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <img
                  src={myBank.qrCodeImage}
                  alt="UPI QR"
                  onClick={() => setShowQrModal(true)}
                  className="w-20 h-20 object-contain rounded-xl border border-gray-200 p-1 bg-gray-50 cursor-pointer hover:scale-105 transition-transform"
                />
                <button
                  onClick={() => setShowQrModal(true)}
                  className="text-[11px] font-extrabold text-blue-600 flex items-center gap-1 hover:underline"
                >
                  <Eye size={12} /> View QR
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <QrCode size={22} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs mt-4">
            <span className="text-gray-400 font-semibold">
              Last Updated: <strong className="text-gray-700">{myBank?.updatedAt || "Never"}</strong>
            </span>
            <span className="text-xs font-extrabold text-emerald-700">
              Total Paid by Admin: ₹{totalReceived.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: MY PAYMENT HISTORY (WHEN ADMIN PAID ME) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <IndianRupee size={18} className="text-emerald-600" />
              Payment History (Paid by Admin)
            </h2>
            <p className="text-xs text-gray-500">
              Check when Admin paid your salary, bonus, or advance
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-black">
            Total Received: ₹{totalReceived.toLocaleString("en-US")} ({myPayments.length} Payments)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Purpose / Month</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">UTR / Ref Note</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {myPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-semibold">
                    No payment records found for {activeMemberName} yet.
                  </td>
                </tr>
              ) : (
                myPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar size={13} className="text-blue-600" />
                      {p.paymentDate}
                    </td>
                    <td className="py-3.5 px-4 font-black text-gray-900">{p.monthOrPurpose}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {p.transactionRef || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                      ₹{Number(p.amount || 0).toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: UPLOAD / UPDATE BANK, UPI & QR CODE FORM */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-base font-black text-gray-900 mb-1">
          {myBank ? "Update My Bank, UPI & QR Code" : "Add My Bank, UPI & QR Code"}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Fill in your bank details and upload your UPI QR Code image below so Admin can pay and verify easily.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="e.g. MD. RAHIM UDDIN"
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Bank Name *
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC Bank"
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Account Number *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter full account number"
                className="w-full text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                IFSC Code *
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                className="w-full text-xs font-bold font-mono uppercase bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Branch Name
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Salt Lake Sector V"
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. name@oksbi / name@ybl"
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                GPay / PhonePe Number (Optional)
              </label>
              <input
                type="text"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* QR CODE IMAGE UPLOAD */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Upload Payment QR Code Image (GPay / PhonePe / Paytm QR)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload size={15} />
                  {qrCodeImage ? "Change QR Image" : "Choose QR Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrImageUpload}
                    className="hidden"
                  />
                </label>

                {qrCodeImage && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                    <img
                      src={qrCodeImage}
                      alt="QR Preview"
                      className="w-9 h-9 object-contain rounded"
                    />
                    <span className="text-xs font-bold text-emerald-700">QR Ready</span>
                    <button
                      type="button"
                      onClick={() => setQrCodeImage("")}
                      className="text-xs font-bold text-red-500 hover:underline ml-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save size={16} />
            Save My Bank, UPI &amp; QR Details
          </button>
        </form>
      </div>
    </div>
  );
}
