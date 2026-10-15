"use client";

import React from "react";
import { useCRM } from "@/context/CRMContext";
import {
  BookOpen,
  Megaphone,
  Clock,
  CalendarDays,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function MemberHRRulesPage() {
  const { hrNotices, officeRules, attendanceConfig, leaveTypes } = useCRM();

  const activeLeaveTypes = leaveTypes.filter((lt) => lt.active);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Top Header + Quick Summary */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Rules in Our Office &amp; HR Notices</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Official office timings, leave policies, and latest announcements from Admin
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock size={14} />
            Shift: {attendanceConfig.officeStartTime} – {attendanceConfig.officeEndTime} (Grace: {attendanceConfig.graceTime})
          </span>
        </div>
      </div>

      {/* 1. LATEST NOTICES & HOLIDAYS */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Megaphone size={18} className="text-orange-500" />
            Announcements &amp; Holidays
          </h2>
          <span className="text-xs font-bold text-gray-400">{hrNotices.length} Updates</span>
        </div>

        {hrNotices.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center font-semibold">
            No announcements right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {hrNotices.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  n.type === "Holiday"
                    ? "bg-[#FFF8ED] border-orange-100"
                    : n.type === "Urgent"
                    ? "bg-red-50/60 border-red-100"
                    : "bg-[#F0F5FF] border-blue-100"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        n.type === "Holiday"
                          ? "bg-orange-200/70 text-orange-800"
                          : n.type === "Urgent"
                          ? "bg-red-200/70 text-red-800"
                          : "bg-blue-200/70 text-blue-800"
                      }`}
                    >
                      {n.type}
                    </span>
                    <h3 className="text-sm font-black text-gray-900">{n.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{n.description}</p>
                </div>
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 shrink-0">
                  <Calendar size={12} /> {n.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. OFFICE RULES LIST */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Office Rules &amp; Guidelines
          </h2>
          <span className="text-xs font-bold text-gray-400">{officeRules.length} Rules</span>
        </div>

        <div className="space-y-3">
          {officeRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-[10px] font-extrabold">
                    {rule.category}
                  </span>
                  <h3 className="text-sm font-black text-gray-900">{rule.title}</h3>
                </div>
                <p className="text-xs text-gray-600 font-medium">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. QUICK LEAVE POLICY SUMMARY (SYNCED FROM ADMIN LEAVE OPTIONS) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
          <CalendarDays size={18} className="text-purple-600" />
          Approved Leave Quotas (Per Year)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activeLeaveTypes.map((lt) => (
            <div key={lt.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-bold text-gray-500">{lt.name}</div>
              <div className="text-xl font-black text-gray-900 mt-1">
                {lt.maxDays > 0 ? `${lt.maxDays} Days` : "As Needed"}
              </div>
              <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                {lt.isPaid ? "Paid Leave" : "Unpaid Leave"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
