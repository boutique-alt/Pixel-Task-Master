"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Users, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Client } from "@/components/ClientTable";
import { useCRM, getLocalDateString } from "@/context/CRMContext";

interface ExcelTaskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (importedCount: number) => void;
}

export default function ExcelTaskImportModal({ isOpen, onClose, onSuccess }: ExcelTaskImportModalProps) {
  const { members, addClient, sessionUser, currentMember } = useCRM();

  const [file, setFile] = useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = useState<Client[]>([]);
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>(() => {
    // Default to tomorrow or today
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return getLocalDateString(tmrw);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentUploaderName = sessionUser?.name || currentMember || "Admin";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processExcelFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processExcelFile(droppedFile);
    }
  };

  const processExcelFile = async (excelFile: File) => {
    setFile(excelFile);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length < 2) {
        throw new Error("The Excel sheet is empty or does not have a data row.");
      }

      // Find header indices
      const headerRow = rawRows[0].map((h) => String(h || "").trim().toLowerCase());
      
      const clientNameIdx = headerRow.findIndex(h => h.includes("client") || h.includes("name") || h.includes("task"));
      const scopeIdx = headerRow.findIndex(h => h.includes("scope") || h.includes("category") || h.includes("work"));
      const memberIdx = headerRow.findIndex(h => h.includes("member") || h.includes("assign") || h.includes("employee") || h.includes("person"));
      const updateIdx = headerRow.findIndex(h => h.includes("update") || h.includes("detail") || h.includes("instruction") || h.includes("desc"));
      const remarksIdx = headerRow.findIndex(h => h.includes("remark") || h.includes("comment") || h.includes("note"));

      const tasks: Client[] = [];
      const knownMembers = members.map(m => m.name);

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const rawClient = String(row[clientNameIdx !== -1 ? clientNameIdx : 1] || "").trim();
        const rawScope = String(row[scopeIdx !== -1 ? scopeIdx : 2] || "Other").trim();
        const rawMember = String(row[memberIdx !== -1 ? memberIdx : 3] || "").trim();
        const rawUpdate = String(row[updateIdx !== -1 ? updateIdx : 4] || "").trim();
        const rawRemarks = remarksIdx !== -1 && row[remarksIdx] ? String(row[remarksIdx]).trim() : "";

        // Skip completely empty rows
        if (!rawClient && !rawMember && !rawUpdate) continue;

        // Match member name case-insensitively with company member list
        let matchedMember = rawMember;
        if (rawMember) {
          const found = knownMembers.find(km => km.toLowerCase().includes(rawMember.toLowerCase()) || rawMember.toLowerCase().includes(km.toLowerCase()));
          if (found) {
            matchedMember = found;
          }
        }

        const task: Client = {
          id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 7)}_${i}`,
          name: rawClient || "General Task",
          phone: "",
          category: rawScope || "Website Creation",
          taskType: "Regular",
          taskDetails: rawUpdate || rawClient,
          startDate: selectedTargetDate,
          endDate: selectedTargetDate,
          member: matchedMember || "Unassigned",
          status: "Pending",
          expected: "0",
          received: "0",
          comments: rawRemarks !== "None" ? rawRemarks : "",
        };

        tasks.push(task);
      }

      if (tasks.length === 0) {
        throw new Error("Could not find any tasks in the sheet. Please make sure columns match: Client Name, Scope of Work, Member, Update.");
      }

      setParsedTasks(tasks);
      setStep("preview");
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setErrorMsg(err?.message || "Failed to parse Excel file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    try {
      // Re-apply the target date in case user changed it in the preview step
      for (const t of parsedTasks) {
        addClient({
          ...t,
          startDate: selectedTargetDate,
          endDate: selectedTargetDate,
        }, currentUploaderName);
      }

      if (onSuccess) {
        onSuccess(parsedTasks.length);
      }
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to save tasks.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Group summary for preview
  const memberCounts = parsedTasks.reduce((acc, t) => {
    const memKey = t.member || "Unassigned";
    acc[memKey] = (acc[memKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#E3EAF5] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E3EAF5] bg-[#F8FAFC] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-[#10254F]">Import Tasks from Excel</h3>
              <p className="text-[12px] text-[#64748B] font-medium">Upload sheet to auto-assign all tasks to respective members</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-[13px] text-red-700 font-bold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date Picker (Applies to all tasks in this batch) */}
          <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-[12px] font-black text-[#10254F] uppercase tracking-wider mb-0.5">
                Target Date for These Tasks *
              </label>
              <p className="text-[12px] text-[#64748B]">All tasks in this Excel file will be assigned for this date</p>
            </div>
            <input 
              type="date"
              value={selectedTargetDate}
              onChange={(e) => setSelectedTargetDate(e.target.value)}
              className="px-3.5 py-2 text-[13px] font-bold border border-[#CBD5E1] rounded-xl bg-white text-[#10254F] focus:ring-2 focus:ring-[#1677FF] outline-none shadow-sm cursor-pointer"
            />
          </div>

          {step === "upload" ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-[#1677FF] hover:bg-blue-50/20 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-[#1677FF]/10 text-[#1677FF] group-hover:scale-110 flex items-center justify-center transition-transform mb-3 shadow-sm">
                <Upload size={28} />
              </div>
              <p className="text-[15px] font-extrabold text-[#10254F]">
                Click to browse or drag &amp; drop Excel file here
              </p>
              <p className="text-[12px] text-[#64748B] mt-1 font-medium">
                Supports .xlsx, .xls, .csv (e.g. Task_List_29_Oct.xlsx)
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[11px] font-bold text-gray-600">
                <span>Columns: Client Name • Scope of Work • Member • Update</span>
              </div>
            </div>
          ) : (
            /* Preview Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-[14px] font-black text-[#10254F]">
                    {parsedTasks.length} Tasks Ready to Import
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="text-[12px] font-bold text-[#1677FF] hover:underline cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Members Distribution Summary Chips */}
              <div className="bg-[#F8FAFC] border border-[#E3EAF5] p-3.5 rounded-2xl space-y-2">
                <div className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                  Automatic Member Allocation:
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(memberCounts).map(([member, count]) => (
                    <div
                      key={member}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-xl text-[12px] font-bold text-[#10254F] shadow-sm"
                    >
                      <Users size={12} className="text-[#1677FF]" />
                      <span>{member}:</span>
                      <span className="text-[#1677FF] font-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Preview Table */}
              <div className="border border-[#E3EAF5] rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#F1F5F9] text-[#64748B] font-bold sticky top-0 border-b border-[#E3EAF5]">
                    <tr>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Scope</th>
                      <th className="p-2.5">Assigned To</th>
                      <th className="p-2.5">Instruction / Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAF5]">
                    {parsedTasks.map((t, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30">
                        <td className="p-2.5 font-bold text-[#10254F] max-w-[120px] truncate">{t.name}</td>
                        <td className="p-2.5 text-[#64748B]">{t.category}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-[#1677FF] border border-blue-100">
                            {t.member}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#334155] max-w-[220px] truncate" title={t.taskDetails}>
                          {t.taskDetails}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E3EAF5] bg-[#F8FAFC] flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] text-[#64748B] hover:bg-gray-200/60 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          {step === "preview" && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl text-[13px] font-black shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>Confirm &amp; Import All ({parsedTasks.length}) Tasks</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
