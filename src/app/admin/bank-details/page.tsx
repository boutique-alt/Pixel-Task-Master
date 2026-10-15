"use client";

import React, { useState, useEffect } from "react";
import { useCRM, MemberBankDetail, SalaryPaymentRecord } from "@/context/CRMContext";
import {
  Landmark,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  QrCode,
  Eye,
  IndianRupee,
  Plus,
  Calendar,
} from "lucide-react";

export default function AdminBankDetailsPage() {
  const {
    members,
    bankDetails,
    salaryPayments,
    updateBankDetailStatus,
    adminUpdateBankDetail,
    deleteBankDetail,
    addSalaryPayment,
    deleteSalaryPayment,
  } = useCRM();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Verified" | "Pending">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit bank row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MemberBankDetail>>({});

  // Modal state for viewing a specific Member's QR Code + Individual Payment History
  const [selectedMemberModal, setSelectedMemberModal] = useState<string | null>(null);

  // Payment History Filter & Add Payment Form state
  const [selectedPaymentMember, setSelectedPaymentMember] = useState<string>("all");
  const [payMember, setPayMember] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>("");
  const [payPurpose, setPayPurpose] = useState<string>("");
  const [payMethod, setPayMethod] = useState<SalaryPaymentRecord["paymentMethod"]>("UPI / QR Scan");
  const [payRef, setPayRef] = useState<string>("");
  const [paySuccessMsg, setPaySuccessMsg] = useState<string>("");

  useEffect(() => {
    setPayDate(new Date().toISOString().split("T")[0]);
    if (members.length > 0 && !payMember) {
      setPayMember(members[0].name);
    }
  }, [members]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleRecordPayment = (e: React.FormEvent, targetMember?: string) => {
    e.preventDefault();
    const memberToPay = targetMember || payMember;
    if (!memberToPay || !payAmount.trim() || !payPurpose.trim()) return;

    addSalaryPayment({
      member: memberToPay,
      amount: payAmount.trim(),
      paymentDate: payDate || new Date().toISOString().split("T")[0],
      monthOrPurpose: payPurpose.trim(),
      paymentMethod: payMethod,
      transactionRef: payRef.trim() || undefined,
    });

    setPayAmount("");
    setPayPurpose("");
    setPayRef("");
    setPaySuccessMsg(`Payment recorded for ${memberToPay}!`);
    setTimeout(() => setPaySuccessMsg(""), 3000);
  };

  const filteredList = bankDetails.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.member.toLowerCase().includes(q) ||
      b.accountHolderName.toLowerCase().includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      b.accountNumber.toLowerCase().includes(q) ||
      (b.upiId && b.upiId.toLowerCase().includes(q))
    );
  });

  const filteredPayments = salaryPayments.filter((p) => {
    if (selectedPaymentMember === "all") return true;
    return p.member.trim().toLowerCase() === selectedPaymentMember.trim().toLowerCase();
  });

  const totalFilteredPaid = filteredPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  // Data for the currently opened Individual Member Modal
  const modalMemberBank = selectedMemberModal
    ? bankDetails.find(
        (b) => b.member.trim().toLowerCase() === selectedMemberModal.trim().toLowerCase()
      )
    : undefined;

  const modalMemberPayments = selectedMemberModal
    ? salaryPayments.filter(
        (p) => p.member.trim().toLowerCase() === selectedMemberModal.trim().toLowerCase()
      )
    : [];

  const modalMemberTotal = modalMemberPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* INDIVIDUAL MEMBER QR & PAYMENT HISTORY MODAL */}
      {selectedMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {selectedMemberModal} — QR Code, Bank &amp; Payment History
                </h2>
                <p className="text-xs text-gray-500">
                  Scan QR or copy bank details to pay, and view all past payments for {selectedMemberModal}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberModal(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Top Grid inside Modal: Left = QR Code, Right = Bank & Quick Pay Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* QR Code Box */}
              <div className="md:col-span-5 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
                {modalMemberBank?.qrCodeImage ? (
                  <>
                    <img
                      src={modalMemberBank.qrCodeImage}
                      alt={`${selectedMemberModal} QR`}
                      className="max-h-52 w-auto object-contain rounded-xl bg-white p-2 border border-gray-200 shadow-sm"
                    />
                    <span className="text-xs font-extrabold text-emerald-700 mt-2">
                      Scan QR to Pay {selectedMemberModal}
                    </span>
                  </>
                ) : (
                  <div className="py-10 text-gray-400 flex flex-col items-center gap-2">
                    <QrCode size={36} />
                    <span className="text-xs font-bold">No QR Image Uploaded Yet</span>
                  </div>
                )}
                {modalMemberBank?.upiId && (
                  <div className="mt-2 text-xs font-bold text-gray-700">
                    UPI: <span className="font-mono">{modalMemberBank.upiId}</span>
                  </div>
                )}
              </div>

              {/* Quick Record Payment Form for this Member */}
              <div className="md:col-span-7 bg-blue-50/40 rounded-2xl p-4 border border-blue-100 space-y-3">
                <div className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <IndianRupee size={14} className="text-blue-600" />
                  Record New Payment to {selectedMemberModal}
                </div>

                <form
                  onSubmit={(e) => handleRecordPayment(e, selectedMemberModal)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Amount (₹) *"
                    className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    required
                  />
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={payPurpose}
                    onChange={(e) => setPayPurpose(e.target.value)}
                    placeholder="Purpose (e.g. Oct Salary / Bonus) *"
                    className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    required
                  />
                  <select
                    value={payMethod}
                    onChange={(e) =>
                      setPayMethod(e.target.value as SalaryPaymentRecord["paymentMethod"])
                    }
                    className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="UPI / QR Scan">UPI / QR Scan</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="UTR / Ref Note (Optional)"
                    className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} /> Save Payment Record for {selectedMemberModal}
                  </button>
                </form>
              </div>
            </div>

            {/* Individual Member's Past Payments Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-800 uppercase">
                  All Payments Made to {selectedMemberModal} ({modalMemberPayments.length})
                </h3>
                <span className="text-xs font-black text-emerald-700">
                  Total Paid: ₹{modalMemberTotal.toLocaleString("en-US")}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Purpose / Month</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {modalMemberPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400 font-semibold">
                          No payments recorded for {selectedMemberModal} yet.
                        </td>
                      </tr>
                    ) : (
                      modalMemberPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3 font-bold text-gray-800">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">{p.monthOrPurpose}</td>
                          <td className="py-2.5 px-3 text-gray-600">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-400">
                            {p.transactionRef || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                            ₹{Number(p.amount || 0).toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Landmark size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Member Bank, QR Code &amp; Salary Payments (Admin)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View member bank/QR details and track when &amp; what you paid to each individual member
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member or bank..."
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "Verified" | "Pending")}
            className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">All ({bankDetails.length})</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {paySuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {paySuccessMsg}
        </div>
      )}

      {/* SECTION 1: MEMBER BANK ACCOUNTS & QR CODE TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-base font-black text-gray-900 mb-4">
          1. Member Uploaded Bank, UPI &amp; QR Codes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                <th className="py-3 px-4">Member / Holder Name</th>
                <th className="py-3 px-4">Bank &amp; Branch</th>
                <th className="py-3 px-4">Account No &amp; IFSC</th>
                <th className="py-3 px-4">UPI ID / Number</th>
                <th className="py-3 px-4">QR Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">
                    No bank details found.
                  </td>
                </tr>
              ) : (
                filteredList.map((b) => {
                  const isEditing = editingId === b.id;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/70">
                      <td className="py-4 px-4">
                        <div className="font-black text-gray-900">{b.member}</div>
                        <div className="text-[11px] font-semibold text-gray-500">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.accountHolderName || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, accountHolderName: e.target.value })
                              }
                              className="border border-gray-300 rounded px-2 py-1 mt-1 text-xs w-36"
                            />
                          ) : (
                            b.accountHolderName
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editForm.bankName || ""}
                              onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-36 block"
                            />
                            <input
                              type="text"
                              value={editForm.branchName || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, branchName: e.target.value })
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-36 block"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-gray-900">{b.bankName}</div>
                            <div className="text-[11px] text-gray-500">{b.branchName || "—"}</div>
                          </>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editForm.accountNumber || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, accountNumber: e.target.value })
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-xs font-mono w-36 block"
                            />
                            <input
                              type="text"
                              value={editForm.ifscCode || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  ifscCode: e.target.value.toUpperCase(),
                                })
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-xs font-mono w-28 block"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-gray-900">
                                {b.accountNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(b.accountNumber, `acc_${b.id}`)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Copy Account Number"
                              >
                                {copiedKey === `acc_${b.id}` ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {b.ifscCode}
                              </span>
                              <button
                                onClick={() => handleCopy(b.ifscCode, `ifsc_${b.id}`)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Copy IFSC"
                              >
                                {copiedKey === `ifsc_${b.id}` ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {b.upiId ? (
                          <div className="flex items-center gap-1 font-bold text-gray-800">
                            <span>{b.upiId}</span>
                            <button
                              onClick={() => handleCopy(b.upiId!, `upi_${b.id}`)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              {copiedKey === `upi_${b.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {b.upiNumber && (
                          <div className="text-[11px] font-mono text-gray-500">{b.upiNumber}</div>
                        )}
                      </td>

                      {/* QR Code Column */}
                      <td className="py-4 px-4">
                        {b.qrCodeImage ? (
                          <button
                            onClick={() => setSelectedMemberModal(b.member)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] cursor-pointer"
                          >
                            <QrCode size={14} /> View QR
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium">No QR</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === "Verified"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                adminUpdateBankDetail(b.id, editForm);
                                setEditingId(null);
                              }}
                              className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedMemberModal(b.member)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} /> Pay / History
                            </button>
                            {b.status !== "Verified" && (
                              <button
                                onClick={() => updateBankDetailStatus(b.id, "Verified")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 size={12} /> Verify
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingId(b.id);
                                setEditForm(b);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteBankDetail(b.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: RECORD PAYMENT & INDIVIDUAL MEMBER PAYMENT HISTORY */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <IndianRupee size={18} className="text-emerald-600" />
              2. Salary &amp; Payment History (Member-wise View)
            </h2>
            <p className="text-xs text-gray-500">
              Record a salary/bonus payment and filter by any member to see when and what you paid them
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">View Member:</span>
            <select
              value={selectedPaymentMember}
              onChange={(e) => setSelectedPaymentMember(e.target.value)}
              className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">All Members (Total: ₹{totalFilteredPaid.toLocaleString("en-US")})</option>
              {members.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Record Payment Bar */}
        <form
          onSubmit={(e) => handleRecordPayment(e)}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-100"
        >
          <select
            value={payMember}
            onChange={(e) => setPayMember(e.target.value)}
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Amount (₹) *"
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
            required
          />

          <input
            type="text"
            value={payPurpose}
            onChange={(e) => setPayPurpose(e.target.value)}
            placeholder="Purpose (e.g. Oct Salary / Bonus) *"
            className="sm:col-span-3 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
            required
          />

          <select
            value={payMethod}
            onChange={(e) =>
              setPayMethod(e.target.value as SalaryPaymentRecord["paymentMethod"])
            }
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-2.5 py-2.5 outline-none"
          >
            <option value="UPI / QR Scan">UPI / QR Scan</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </select>

          <input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-2.5 py-2.5 outline-none"
          />

          <button
            type="submit"
            className="sm:col-span-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={15} /> Pay
          </button>
        </form>

        {/* Payment History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Purpose / Month</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">UTR / Ref</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="py-3.5 px-4 font-black text-gray-900">{p.member}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-600" />
                        {p.paymentDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{p.monthOrPurpose}</td>
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => deleteSalaryPayment(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
