"use client";

import React, { useState, useEffect } from "react";
import { useCRM, AttendanceRecord, parseTimeToMs } from "@/context/CRMContext";
import {
  Wifi,
  MapPin,
  Laptop,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Save,
  X,
  Calendar,
  Settings,
} from "lucide-react";

export default function AdminAttendancePage() {
  const {
    members,
    attendanceConfig,
    authorizedDevices,
    attendanceRecords,
    currentNetworkIp,
    updateAttendanceConfig,
    updateDeviceStatus,
    deleteAuthorizedDevice,
    adminUpdateAttendance,
    deleteAttendanceRecord,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<"logs" | "settings">("logs");
  const [todayStr, setTodayStr] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Edit row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});
  const [currentTimeMs, setCurrentTimeMs] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTimeMs(Date.now());
    setTodayStr(new Date().toISOString().split("T")[0]);
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleSetCurrentWifi = () => {
    if (!currentNetworkIp) return;
    updateAttendanceConfig({ registeredWifiIp: currentNetworkIp });
    showToast(`Panda WiFi IP updated to ${currentNetworkIp}`);
  };

  const handleCaptureOfficeGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      updateAttendanceConfig({
        officeLat: Number(pos.coords.latitude.toFixed(6)),
        officeLng: Number(pos.coords.longitude.toFixed(6)),
      });
      showToast("Office GPS location saved!");
    });
  };

  const seenMemberDates = new Set<string>();
  const filteredRecords = attendanceRecords.filter((r) => {
    if (filterMember !== "all" && r.member.toLowerCase() !== filterMember.toLowerCase()) return false;
    if (filterDate && r.date !== filterDate) return false;
    const key = `${(r.member || "").trim().toLowerCase()}_${r.date}`;
    if (seenMemberDates.has(key)) return false;
    seenMemberDates.add(key);
    return true;
  });

  const todayPresentCount = new Set(
    attendanceRecords
      .filter((r) => r.date === todayStr)
      .map((r) => (r.member || "").trim().toLowerCase())
  ).size;
  const pendingLaptopsCount = authorizedDevices.filter((d) => d.status === "Pending").length;

  const formatMinutes = (mins?: number) => {
    if (mins === undefined) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Top Header + 2 Simple Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Office Attendance &amp; Security</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Present Today: <strong>{todayPresentCount}</strong> / {members.length} Members • WiFi: <strong>{attendanceConfig.wifiName}</strong> ({attendanceConfig.registeredWifiIp})
          </p>
        </div>

        {/* Simple Tab Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "logs" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Calendar size={14} />
            Attendance Log ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Settings size={14} />
            WiFi, GPS &amp; Laptops
            {pendingLaptopsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingLaptopsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {statusMsg}
        </div>
      )}

      {/* TAB 1: SIMPLE ATTENDANCE LOG TABLE */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-black text-gray-900">Member Check-In / Check-Out Records</h2>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
              >
                <option value="all">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
              />

              {(filterMember !== "all" || filterDate) && (
                <button
                  onClick={() => {
                    setFilterMember("all");
                    setFilterDate("");
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline px-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In (1st Connect)</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Verified Via</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 font-semibold">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isEditing = editingId === rec.id;
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50/70">
                        <td className="py-3.5 px-4 font-black text-gray-900">{rec.member}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">{rec.date}</td>
                        <td className="py-3.5 px-4 font-black text-emerald-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.checkInTime || ""}
                              onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-28"
                            />
                          ) : (
                            (rec.checkInTime || "—").replace(/:\d{2}\s/, " ")
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.checkOutTime || ""}
                              onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                              placeholder="06:30:00 PM"
                              className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-28"
                            />
                          ) : rec.checkOutTime ? (
                            rec.checkOutTime.replace(/:\d{2}\s/, " ")
                          ) : (
                            <span className="text-blue-600 font-bold">Working...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          {(() => {
                            if (rec.checkOutTime) {
                              if (rec.workingMinutes !== undefined) return formatMinutes(rec.workingMinutes);
                              const inMs = parseTimeToMs(rec.date, rec.checkInTime) || rec.checkInTimestamp;
                              const outMs = parseTimeToMs(rec.date, rec.checkOutTime) || rec.checkOutTimestamp;
                              if (inMs && outMs && outMs > inMs) {
                                return formatMinutes(Math.round((outMs - inMs) / 60000));
                              }
                              return "—";
                            }
                            const inMs = parseTimeToMs(rec.date, rec.checkInTime) || rec.checkInTimestamp;
                            if (inMs) {
                              const nowMs = currentTimeMs ?? inMs;
                              const elapsedMins = Math.max(0, Math.floor((nowMs - inMs) / 60000));
                              return (
                                <span className="text-blue-600 flex items-center gap-1.5 font-mono">
                                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                  {formatMinutes(elapsedMins)}
                                </span>
                              );
                            }
                            return "—";
                          })()}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-semibold">{rec.verifiedVia}</td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <select
                              value={editForm.status || rec.status}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value as AttendanceRecord["status"],
                                })
                              }
                              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                            >
                              <option value="On Time">On Time</option>
                              <option value="Late">Late</option>
                              <option value="Checked Out">Checked Out</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                rec.status === "Late"
                                  ? "bg-amber-100 text-amber-800"
                                  : rec.status === "Checked Out"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {rec.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  adminUpdateAttendance(rec.id, editForm);
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
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(rec.id);
                                  setEditForm(rec);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteAttendanceRecord(rec.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
      )}

      {/* TAB 2: SIMPLE WIFI, GPS & LAPTOP SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* 3 Simple Setup Boxes in 1 Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Panda WiFi */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                  <Wifi size={18} className="text-blue-600" />
                  1. Office Panda WiFi
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">WiFi Name</label>
                    <input
                      type="text"
                      value={attendanceConfig.wifiName}
                      onChange={(e) => updateAttendanceConfig({ wifiName: e.target.value })}
                      className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Office WiFi IP</label>
                    <input
                      type="text"
                      value={attendanceConfig.registeredWifiIp}
                      onChange={(e) => updateAttendanceConfig({ registeredWifiIp: e.target.value })}
                      className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 mt-0.5 font-mono"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSetCurrentWifi}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Auto-Set Current WiFi IP ({currentNetworkIp || "..."})
              </button>
            </div>

            {/* 2. Office GPS */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                  <MapPin size={18} className="text-emerald-600" />
                  2. Office GPS Location
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={attendanceConfig.officeLat ?? ""}
                      onChange={(e) =>
                        updateAttendanceConfig({
                          officeLat: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={attendanceConfig.officeLng ?? ""}
                      onChange={(e) =>
                        updateAttendanceConfig({
                          officeLng: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Radius (m)</label>
                    <input
                      type="number"
                      value={attendanceConfig.allowedRadiusMeters}
                      onChange={(e) =>
                        updateAttendanceConfig({
                          allowedRadiusMeters: Number(e.target.value) || 150,
                        })
                      }
                      className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 mt-0.5"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleCaptureOfficeGps}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Auto-Set Current GPS as Office
              </button>
            </div>

            {/* 3. Shift & Auto Check-In */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                <Clock size={18} className="text-purple-600" />
                3. Shift &amp; Auto Check-In
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Grace Time</label>
                  <input
                    type="time"
                    value={attendanceConfig.graceTime}
                    onChange={(e) => updateAttendanceConfig({ graceTime: e.target.value })}
                    className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Target Hours</label>
                  <input
                    type="number"
                    value={attendanceConfig.targetHours}
                    onChange={(e) => updateAttendanceConfig({ targetHours: Number(e.target.value) || 8 })}
                    className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 mt-0.5"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between text-xs font-bold text-gray-700 pt-1 cursor-pointer">
                <span>Auto Check-In on 1st Connect</span>
                <input
                  type="checkbox"
                  checked={attendanceConfig.autoCheckInOnOpen}
                  onChange={(e) => updateAttendanceConfig({ autoCheckInOnOpen: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Office Laptops Approval List */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 mb-4">
              <Laptop size={18} className="text-blue-600" />
              Approved Office Laptops ({authorizedDevices.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                    <th className="py-3 px-4">Laptop ID</th>
                    <th className="py-3 px-4">Device Name</th>
                    <th className="py-3 px-4">Assigned Member</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {authorizedDevices.map((dev) => (
                    <tr key={dev.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{dev.deviceId}</td>
                      <td className="py-3 px-4 font-semibold text-gray-700">{dev.deviceName}</td>
                      <td className="py-3 px-4">
                        <select
                          value={dev.assignedMember}
                          onChange={(e) => updateDeviceStatus(dev.id, dev.status, e.target.value)}
                          className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1"
                        >
                          <option value="All (Office Laptop)">All (Office Laptop)</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            dev.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : dev.status === "Pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dev.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {dev.status !== "Approved" && (
                          <button
                            onClick={() => updateDeviceStatus(dev.id, "Approved")}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        {dev.status === "Approved" && (
                          <button
                            onClick={() => updateDeviceStatus(dev.id, "Revoked")}
                            className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] hover:bg-amber-200"
                          >
                            Block
                          </button>
                        )}
                        <button
                          onClick={() => deleteAuthorizedDevice(dev.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg align-middle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
