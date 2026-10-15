"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/context/CRMContext";
import {
  Wifi,
  MapPin,
  Laptop,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  Send,
  Calendar,
  Navigation,
} from "lucide-react";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function MemberAttendancePage() {
  const {
    currentMember,
    attendanceConfig,
    authorizedDevices,
    attendanceRecords,
    currentDeviceId,
    currentNetworkIp,
    requestDeviceAuthorization,
    checkInMember,
    checkOutMember,
  } = useCRM();

  const activeMemberName = currentMember && currentMember !== "all" ? currentMember : "Rahim";

  const [todayStr, setTodayStr] = useState("");
  const [liveTimeStr, setLiveTimeStr] = useState("");
  const [liveDateDisplay, setLiveDateDisplay] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  const [gpsStatus, setGpsStatus] = useState<"idle" | "checking" | "matched" | "outside" | "error">("idle");
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setNowTimestamp(now.getTime());
      setTodayStr(now.toISOString().split("T")[0]);
      setLiveTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setLiveDateDisplay(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Laptop check
  const thisDeviceEntry = authorizedDevices.find((d) => d.deviceId === currentDeviceId);
  const isLaptopApproved =
    !attendanceConfig.requireAuthorizedLaptop ||
    Boolean(
      thisDeviceEntry &&
        thisDeviceEntry.status === "Approved" &&
        (thisDeviceEntry.assignedMember === "All (Office Laptop)" ||
          thisDeviceEntry.assignedMember.toLowerCase() === activeMemberName.toLowerCase())
    );

  // 2. Panda WiFi check
  const isWifiMatched =
    Boolean(attendanceConfig.registeredWifiIp) &&
    currentNetworkIp.trim() === attendanceConfig.registeredWifiIp.trim();

  // 3. GPS check
  const isGpsMatched = gpsStatus === "matched";
  const isPresenceVerified = !attendanceConfig.requireWifiOrGps || isWifiMatched || isGpsMatched;
  const canCheckInOrOut = isLaptopApproved && isPresenceVerified;

  const getVerificationLabel = () => {
    if (isWifiMatched) return `${attendanceConfig.wifiName || "Panda WiFi"} + Laptop`;
    if (isGpsMatched) return "Office GPS + Laptop";
    return "Office Verified";
  };

  const todayRecord = attendanceRecords.find(
    (r) => r.member.toLowerCase() === activeMemberName.toLowerCase() && r.date === todayStr
  );

  const myRecords = attendanceRecords.filter(
    (r) => r.member.toLowerCase() === activeMemberName.toLowerCase()
  );

  const handleVerifyGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    if (attendanceConfig.officeLat === null || attendanceConfig.officeLng === null) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistanceInMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          attendanceConfig.officeLat!,
          attendanceConfig.officeLng!
        );
        setGpsDistance(dist);
        if (dist <= (attendanceConfig.allowedRadiusMeters || 150)) {
          setGpsStatus("matched");
        } else {
          setGpsStatus("outside");
        }
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (attendanceConfig.officeLat !== null && attendanceConfig.officeLng !== null && gpsStatus === "idle") {
      handleVerifyGps();
    }
  }, [attendanceConfig.officeLat, attendanceConfig.officeLng]);

  // Auto Check-In on 1st connection of the day
  useEffect(() => {
    if (
      todayStr &&
      attendanceConfig.autoCheckInOnOpen !== false &&
      canCheckInOrOut &&
      !todayRecord
    ) {
      checkInMember(activeMemberName, getVerificationLabel());
    }
  }, [todayStr, attendanceConfig.autoCheckInOnOpen, canCheckInOrOut, isWifiMatched, isGpsMatched, Boolean(todayRecord), activeMemberName]);

  const getLiveElapsedDisplay = () => {
    if (!todayRecord) return { text: "0h 00m", percent: 0 };
    if (todayRecord.checkOutTime && todayRecord.workingMinutes !== undefined) {
      const h = Math.floor(todayRecord.workingMinutes / 60);
      const m = todayRecord.workingMinutes % 60;
      const pct = Math.min(100, Math.round((todayRecord.workingMinutes / ((attendanceConfig.targetHours || 8) * 60)) * 100));
      return { text: `${h}h ${m}m`, percent: pct };
    }
    if (!nowTimestamp) return { text: "0h 00m", percent: 0 };
    const diffMins = Math.max(0, Math.floor((nowTimestamp - todayRecord.checkInTimestamp) / 60000));
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const pct = Math.min(100, Math.round((diffMins / ((attendanceConfig.targetHours || 8) * 60)) * 100));
    return { text: `${h}h ${m < 10 ? `0${m}` : m}m`, percent: pct };
  };

  const liveProgress = getLiveElapsedDisplay();

  const formatMinutes = (mins?: number) => {
    if (mins === undefined) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* MAIN SIMPLE ATTENDANCE CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        {/* Top Row: Title + Live Clock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-xl font-black text-gray-900">Today&apos;s Attendance</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Shift: {attendanceConfig.officeStartTime} – {attendanceConfig.officeEndTime} • 1st WiFi/GPS connect auto-records Check-In
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200/80 self-start sm:self-auto">
            <Clock size={18} className="text-blue-600" />
            <div>
              <div className="text-base font-black text-gray-900 font-mono leading-none">
                {liveTimeStr || "--:--:--"}
              </div>
              <div className="text-[11px] font-semibold text-gray-500 mt-0.5">{liveDateDisplay}</div>
            </div>
          </div>
        </div>

        {/* Compact 3 Security Badges in One Simple Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-3.5 rounded-2xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pill 1: Office Laptop */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                isLaptopApproved
                  ? "bg-emerald-100/80 text-emerald-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <Laptop size={14} />
              {isLaptopApproved ? "Office Laptop Verified" : "Laptop Not Approved"}
            </span>

            {/* Pill 2: Panda WiFi */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                isWifiMatched
                  ? "bg-emerald-100/80 text-emerald-800"
                  : "bg-gray-200/70 text-gray-600"
              }`}
            >
              <Wifi size={14} />
              {isWifiMatched
                ? `${attendanceConfig.wifiName || "Panda WiFi"} Connected`
                : `${attendanceConfig.wifiName || "Panda WiFi"} Offline`}
            </span>

            {/* Pill 3: Office GPS */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                isGpsMatched
                  ? "bg-emerald-100/80 text-emerald-800"
                  : "bg-gray-200/70 text-gray-600"
              }`}
            >
              <MapPin size={14} />
              {isGpsMatched
                ? `Office GPS Verified (${gpsDistance ?? 0}m)`
                : gpsStatus === "checking"
                ? "Checking GPS..."
                : "GPS Standby"}
            </span>
          </div>

          {/* Right side quick action if needed */}
          <div className="flex items-center gap-2">
            {!isLaptopApproved && (
              <button
                onClick={() =>
                  requestDeviceAuthorization(activeMemberName, `${activeMemberName}'s Office Laptop`)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Send size={12} />
                {thisDeviceEntry?.status === "Pending" ? "Approval Pending" : "Approve This Laptop"}
              </button>
            )}
            {!isWifiMatched && !isGpsMatched && (
              <button
                onClick={handleVerifyGps}
                className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
              >
                <Navigation size={12} /> Check GPS
              </button>
            )}
          </div>
        </div>

        {/* 3 Clean Boxes - 2 in 1 row on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Box 1: Check-In Time */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase truncate">Check-In</span>
              {todayRecord && (
                <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                  {todayRecord.status}
                </span>
              )}
            </div>
            <div className="text-lg sm:text-2xl font-black text-gray-900 my-1 sm:my-2 truncate">
              {todayRecord ? todayRecord.checkInTime.replace(/:\d{2}\s/, " ") : "— : —"}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 truncate">
              {todayRecord ? "Auto 1st connect" : "Waiting for office"}
            </div>
          </div>

          {/* Box 2: Check-Out Time */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase truncate">Check-Out</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 my-1 sm:my-2 truncate">
              {todayRecord?.checkOutTime ? todayRecord.checkOutTime.replace(/:\d{2}\s/, " ") : "— : —"}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 truncate">
              {todayRecord?.checkOutTime
                ? "Shift completed"
                : todayRecord
                ? "In office"
                : "Not checked out"}
            </div>
          </div>

          {/* Box 3: Working Hours */}
          <div className="col-span-2 sm:col-span-1 bg-blue-50/40 border border-blue-100 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Working Hours</span>
              <span className="text-[11px] sm:text-xs font-bold text-blue-600">{liveProgress.percent}%</span>
            </div>
            <div className="text-lg sm:text-2xl font-black text-gray-900 my-1 sm:my-2">{liveProgress.text}</div>
            <div className="w-full h-1.5 sm:h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${liveProgress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Single Clean Action Button */}
        <div>
          {!canCheckInOrOut ? (
            <div className="w-full py-3.5 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2">
              <XCircle size={16} />
              Connect to Office &ldquo;{attendanceConfig.wifiName}&rdquo; or Office GPS from an Approved Laptop to Check In/Out
            </div>
          ) : !todayRecord ? (
            <button
              onClick={() => checkInMember(activeMemberName, getVerificationLabel())}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn size={18} />
              Check In Now ({liveTimeStr})
            </button>
          ) : !todayRecord.checkOutTime ? (
            <button
              onClick={() => checkOutMember(activeMemberName)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              Check Out Now ({liveTimeStr})
            </button>
          ) : (
            <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Today&apos;s Attendance Completed!
            </div>
          )}
        </div>
      </div>

      {/* SIMPLE ATTENDANCE HISTORY TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Attendance History ({activeMemberName})
          </h2>
          <span className="text-xs font-bold text-gray-500">Total: {myRecords.length} days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Verified By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                    No attendance records yet.
                  </td>
                </tr>
              ) : (
                myRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/70">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{rec.date}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      {rec.checkInTime.replace(/:\d{2}\s/, " ")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">
                      {rec.checkOutTime ? (
                        rec.checkOutTime.replace(/:\d{2}\s/, " ")
                      ) : (
                        <span className="text-blue-600 font-bold">Working...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {rec.workingMinutes !== undefined ? formatMinutes(rec.workingMinutes) : "Active"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">{rec.verifiedVia}</td>
                    <td className="py-3.5 px-4">
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
