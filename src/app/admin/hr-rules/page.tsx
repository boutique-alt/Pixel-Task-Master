"use client";

import React, { useState, useEffect } from "react";
import { useCRM, HRNotice, OfficeRule } from "@/context/CRMContext";
import {
  BookOpen,
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function AdminHRRulesPage() {
  const {
    hrNotices,
    officeRules,
    addHRNotice,
    updateHRNotice,
    deleteHRNotice,
    addOfficeRule,
    updateOfficeRule,
    deleteOfficeRule,
  } = useCRM();

  // New Notice Form
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticeType, setNoticeType] = useState<HRNotice["type"]>("Notice");
  const [noticeDate, setNoticeDate] = useState("");

  // Edit Notice State
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editNoticeForm, setEditNoticeForm] = useState<Partial<HRNotice>>({});

  // New Rule Form
  const [ruleCategory, setRuleCategory] = useState<OfficeRule["category"]>("Timing & Attendance");
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");

  // Edit Rule State
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleForm, setEditRuleForm] = useState<Partial<OfficeRule>>({});

  useEffect(() => {
    setNoticeDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDesc.trim()) return;
    addHRNotice({
      title: noticeTitle.trim(),
      description: noticeDesc.trim(),
      type: noticeType,
      date: noticeDate || new Date().toISOString().split("T")[0],
    });
    setNoticeTitle("");
    setNoticeDesc("");
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim() || !ruleDesc.trim()) return;
    addOfficeRule({
      category: ruleCategory,
      title: ruleTitle.trim(),
      description: ruleDesc.trim(),
    });
    setRuleTitle("");
    setRuleDesc("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Office Rules &amp; HR Notices (Admin)</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Whatever you add here syncs live to Member Dashboard &amp; Member HR Rules page
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: HR NOTICES & HOLIDAYS (Shows on Member Dashboard Card #5) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Megaphone size={18} className="text-orange-500" />
              1. Notices &amp; Upcoming Holidays
            </h2>
            <p className="text-xs text-gray-500">
              Top 2 notices appear directly on the Member Dashboard &ldquo;HR &amp; Notices&rdquo; card
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">{hrNotices.length} Active</span>
        </div>

        {/* Simple Add Notice Form */}
        <form
          onSubmit={handleAddNotice}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100"
        >
          <input
            type="text"
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            placeholder="Notice / Holiday Title (e.g. Puja Holidays)"
            className="sm:col-span-3 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            value={noticeDesc}
            onChange={(e) => setNoticeDesc(e.target.value)}
            placeholder="Short Details (e.g. Office closed from Oct 20 to Oct 24)"
            className="sm:col-span-4 text-xs font-medium bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
          <select
            value={noticeType}
            onChange={(e) => setNoticeType(e.target.value as HRNotice["type"])}
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="Notice">Notice</option>
            <option value="Holiday">Holiday</option>
            <option value="Urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
            className="sm:col-span-2 text-xs font-bold bg-white border border-gray-200 rounded-xl px-2.5 py-2.5 outline-none"
          />
          <button
            type="submit"
            className="sm:col-span-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={15} /> Add
          </button>
        </form>

        {/* Notices List */}
        <div className="space-y-2.5">
          {hrNotices.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-4 font-semibold">
              No active notices or holidays.
            </p>
          ) : (
            hrNotices.map((n) => {
              const isEditing = editingNoticeId === n.id;
              return (
                <div
                  key={n.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50/60 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={editNoticeForm.title || ""}
                        onChange={(e) => setEditNoticeForm({ ...editNoticeForm, title: e.target.value })}
                        className="text-xs font-bold border border-gray-300 rounded-xl px-3 py-1.5"
                      />
                      <input
                        type="text"
                        value={editNoticeForm.description || ""}
                        onChange={(e) =>
                          setEditNoticeForm({ ...editNoticeForm, description: e.target.value })
                        }
                        className="sm:col-span-2 text-xs border border-gray-300 rounded-xl px-3 py-1.5"
                      />
                      <select
                        value={editNoticeForm.type || n.type}
                        onChange={(e) =>
                          setEditNoticeForm({
                            ...editNoticeForm,
                            type: e.target.value as HRNotice["type"],
                          })
                        }
                        className="text-xs font-bold border border-gray-300 rounded-xl px-2.5 py-1.5"
                      >
                        <option value="Notice">Notice</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase shrink-0 ${
                          n.type === "Holiday"
                            ? "bg-orange-100 text-orange-700"
                            : n.type === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {n.type}
                      </span>
                      <div>
                        <div className="text-xs font-black text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{n.description}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mr-2">
                      <Calendar size={12} /> {n.date}
                    </span>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            updateHRNotice(n.id, editNoticeForm);
                            setEditingNoticeId(null);
                          }}
                          className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingNoticeId(null)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingNoticeId(n.id);
                            setEditNoticeForm(n);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteHRNotice(n.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: OFFICE RULES CRUD */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              2. Rules in Our Office
            </h2>
            <p className="text-xs text-gray-500">
              Simple point-by-point office rules visible to all members
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">{officeRules.length} Rules</span>
        </div>

        {/* Simple Add Rule Form */}
        <form
          onSubmit={handleAddRule}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100"
        >
          <select
            value={ruleCategory}
            onChange={(e) => setRuleCategory(e.target.value as OfficeRule["category"])}
            className="sm:col-span-3 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="Timing & Attendance">Timing &amp; Attendance</option>
            <option value="Leave Policy">Leave Policy</option>
            <option value="Office Discipline">Office Discipline</option>
          </select>
          <input
            type="text"
            value={ruleTitle}
            onChange={(e) => setRuleTitle(e.target.value)}
            placeholder="Rule Title (e.g. Mandatory Task Update)"
            className="sm:col-span-3 text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            value={ruleDesc}
            onChange={(e) => setRuleDesc(e.target.value)}
            placeholder="Rule Description..."
            className="sm:col-span-5 text-xs font-medium bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="sm:col-span-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={15} /> Add
          </button>
        </form>

        {/* Office Rules List */}
        <div className="space-y-2.5">
          {officeRules.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-4 font-semibold">
              No office rules added yet.
            </p>
          ) : (
            officeRules.map((rule) => {
              const isEditing = editingRuleId === rule.id;
              return (
                <div
                  key={rule.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50/60 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <select
                        value={editRuleForm.category || rule.category}
                        onChange={(e) =>
                          setEditRuleForm({
                            ...editRuleForm,
                            category: e.target.value as OfficeRule["category"],
                          })
                        }
                        className="text-xs font-bold border border-gray-300 rounded-xl px-2.5 py-1.5"
                      >
                        <option value="Timing & Attendance">Timing &amp; Attendance</option>
                        <option value="Leave Policy">Leave Policy</option>
                        <option value="Office Discipline">Office Discipline</option>
                      </select>
                      <input
                        type="text"
                        value={editRuleForm.title || ""}
                        onChange={(e) => setEditRuleForm({ ...editRuleForm, title: e.target.value })}
                        className="text-xs font-bold border border-gray-300 rounded-xl px-3 py-1.5"
                      />
                      <input
                        type="text"
                        value={editRuleForm.description || ""}
                        onChange={(e) =>
                          setEditRuleForm({ ...editRuleForm, description: e.target.value })
                        }
                        className="sm:col-span-2 text-xs border border-gray-300 rounded-xl px-3 py-1.5"
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-extrabold shrink-0">
                        {rule.category}
                      </span>
                      <div>
                        <div className="text-xs font-black text-gray-900">{rule.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{rule.description}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            updateOfficeRule(rule.id, editRuleForm);
                            setEditingRuleId(null);
                          }}
                          className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingRuleId(null)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setEditRuleForm(rule);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteOfficeRule(rule.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
