"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface TaskDateFilterBarProps {
  dateFilterMode: "today" | "custom" | "all";
  onModeChange: (mode: "today" | "custom" | "all") => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  todayDate: string;
  todayTasksCount?: number;
  totalAllTasksCount?: number;
  className?: string;
}

export default function TaskDateFilterBar({
  dateFilterMode,
  onModeChange,
  selectedDate,
  onDateChange,
  todayDate,
  todayTasksCount,
  totalAllTasksCount,
  className = ""
}: TaskDateFilterBarProps) {
  return (
    <div className={`bg-white p-2.5 sm:px-4 rounded-2xl border border-[#E3EAF5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-2.5 ${className}`}>
      {/* Buttons & Date Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-bold text-[#64748B] flex items-center gap-1.5 mr-0.5">
          <Calendar size={15} className="text-[#1677FF]" />
          <span className="hidden sm:inline">Filter by Date:</span>
        </span>

        {/* 1. Today's Tasks Button */}
        <button
          type="button"
          onClick={() => {
            onModeChange("today");
            onDateChange(todayDate);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
            dateFilterMode === "today"
              ? "bg-[#1677FF] text-white shadow-sm"
              : "bg-[#F4F7FC] text-[#64748B] hover:text-[#10254F] hover:bg-slate-200"
          }`}
        >
          <span>📌 Today&apos;s Tasks</span>
          {typeof todayTasksCount === "number" && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                dateFilterMode === "today"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {todayTasksCount}
            </span>
          )}
        </button>

        {/* 2. Custom Date Picker */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
            dateFilterMode === "custom"
              ? "border-[#1677FF] bg-blue-50/70 text-[#1677FF]"
              : "border-[#E2E8F0] bg-[#F4F7FC] text-[#64748B] hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 hidden xs:inline">Pick Date:</span>
          <input
            type="date"
            value={selectedDate || todayDate}
            onChange={(e) => {
              const val = e.target.value;
              onDateChange(val);
              if (val === todayDate) {
                onModeChange("today");
              } else if (val) {
                onModeChange("custom");
              }
            }}
            className="bg-transparent text-xs font-bold text-[#10254F] outline-none cursor-pointer"
          />
        </div>

        {/* 3. All Tasks History Button */}
        <button
          type="button"
          onClick={() => onModeChange("all")}
          className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
            dateFilterMode === "all"
              ? "bg-[#10254F] text-white shadow-sm"
              : "bg-[#F4F7FC] text-[#64748B] hover:text-[#10254F] hover:bg-slate-200"
          }`}
        >
          📂 All Tasks History
          {typeof totalAllTasksCount === "number" && (
            <span
              className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                dateFilterMode === "all"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {totalAllTasksCount}
            </span>
          )}
        </button>
      </div>

      {/* Right side: Active View Pill */}
      <div className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1.5 ml-auto">
        <span className="hidden md:inline">Showing:</span>
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1677FF] font-bold text-[11px] border border-blue-100">
          {dateFilterMode === "today"
            ? `Today (${todayDate})`
            : dateFilterMode === "custom"
            ? `Date: ${selectedDate}`
            : "All Tasks (All Dates)"}
        </span>
      </div>
    </div>
  );
}
