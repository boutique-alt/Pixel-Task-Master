"use client";

import React, { useState, useEffect } from "react";
import { useCRM, parseTimeToMs, getLocalDateString } from "@/context/CRMContext";
import { isWifiIpMatched } from "@/lib/crmService";
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
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import MemberSendReportModal from "@/components/MemberSendReportModal";

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
    isCloudSynced,
    sessionUser,
    updateAttendanceConfig,
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
  const [liveDeviceLat, setLiveDeviceLat] = useState<number | null>(null);
  const [liveDeviceLng, setLiveDeviceLng] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingOfficeGps, setIsSettingOfficeGps] = useState(false);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);

  const handleConfirmCheckOut = () => {
    checkOutMember(activeMemberName);
    setShowCheckOutConfirm(false);
  };

  const handleSetLiveGpsAsOffice = async () => {
    if (liveDeviceLat === null || liveDeviceLng === null) {
      handleSaveCurrentAsOfficeGps();
      return;
    }
    setIsSettingOfficeGps(true);
    try {
      updateAttendanceConfig({
        officeLat: liveDeviceLat,
        officeLng: liveDeviceLng,
        allowedRadiusMeters: 100,
      });

      await fetch("/api/attendance/set-office-gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeLat: liveDeviceLat, officeLng: liveDeviceLng, allowedRadiusMeters: 100 }),
      });

      setGpsDistance(0);
      setGpsStatus("matched");
      alert(`Office GPS updated successfully!\nLatitude: ${liveDeviceLat}\nLongitude: ${liveDeviceLng}\nAllowed Radius: 100m`);
    } catch (e: any) {
      alert(`Error updating office location: ${e.message}`);
    } finally {
      setIsSettingOfficeGps(false);
    }
  };

  const handleSaveCurrentAsOfficeGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsSettingOfficeGps(true);

    const onSaveSuccess = (pos: GeolocationPosition) => {
      setIsSettingOfficeGps(false);
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy || 0);
      updateAttendanceConfig({
        officeLat: lat,
        officeLng: lng,
        allowedRadiusMeters: attendanceConfig.allowedRadiusMeters || 100,
      });
      setGpsDistance(0);
      setGpsStatus("matched");
      alert(`Office GPS updated successfully!\nLatitude: ${lat}\nLongitude: ${lng}\nAccuracy: ±${acc}m\nAllowed Radius: 100m`);
    };

    navigator.geolocation.getCurrentPosition(
      onSaveSuccess,
      (err) => {
        if (err.code !== 1) {
          navigator.geolocation.getCurrentPosition(
            onSaveSuccess,
            (err2) => {
              setIsSettingOfficeGps(false);
              alert(`Failed to detect GPS: ${err2.message}`);
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        } else {
          setIsSettingOfficeGps(false);
          alert("Location permission denied. Please allow location access in your browser address bar.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setNowTimestamp(now.getTime());
      setTodayStr(getLocalDateString(now));
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

  // 1. Device check: No admin device approval required! Any signed-in device can check in
  const isLaptopApproved = true;

  // 2. Panda WiFi check (matches exact, subnet, or multiple allowed IPs)
  const isWifiMatched = isWifiIpMatched(currentNetworkIp, attendanceConfig.registeredWifiIp);

  // 3. GPS check
  const isGpsMatched = gpsStatus === "matched";

  // 4. Presence verification (Must have either Panda WiFi OR Verified GPS)
  const isPresenceRequired = attendanceConfig.requireWifiOrGps !== false;
  const isPresenceVerified = isPresenceRequired ? (isWifiMatched || isGpsMatched) : true;

  // CAN CHECK IN OR OUT: Allowed whenever member is present at office (WiFi or GPS)
  const canCheckInOrOut = isPresenceVerified;

  const getVerificationLabel = () => {
    if (isWifiMatched) return `${attendanceConfig.wifiName || "Panda WiFi"}`;
    if (isGpsMatched) return "Office GPS";
    return "Office Verified";
  };

  const todayRecord = attendanceRecords.find(
    (r) => r.member.toLowerCase() === activeMemberName.toLowerCase() && r.date === todayStr
  );

  const seenMemberDates = new Set<string>();
  const myRecords = attendanceRecords.filter((r) => {
    if (r.member.toLowerCase() !== activeMemberName.toLowerCase()) return false;
    if (seenMemberDates.has(r.date)) return false;
    seenMemberDates.add(r.date);
    return true;
  });

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

    const onPosSuccess = (pos: GeolocationPosition) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      setLiveDeviceLat(lat);
      setLiveDeviceLng(lng);
      const dist = getDistanceInMeters(
        lat,
        lng,
        attendanceConfig.officeLat!,
        attendanceConfig.officeLng!
      );
      setGpsDistance(dist);
      const maxRadius = attendanceConfig.allowedRadiusMeters || 100;
      if (dist <= maxRadius) {
        setGpsStatus("matched");
      } else {
        setGpsStatus("outside");
      }
    };

    // Stage 1: Try high accuracy (satellite / fine)
    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (err) => {
        // Stage 2: Fallback to standard network accuracy if high accuracy timed out or unavailable
        if (err.code !== 1) {
          navigator.geolocation.getCurrentPosition(
            onPosSuccess,
            () => setGpsStatus("error"),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          setGpsStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (attendanceConfig.officeLat !== null && attendanceConfig.officeLng !== null && gpsStatus === "idle") {
      handleVerifyGps();
    }
  }, [attendanceConfig.officeLat, attendanceConfig.officeLng]);

  // Auto Check-In on 1st connection of the day
  // STRICT GUARD: Must wait for isCloudSynced, and only check in if no record exists for today!
  useEffect(() => {
    const isStrictPresenceOk = isWifiMatched || isGpsMatched || attendanceConfig.requireWifiOrGps === false;
    if (
      isCloudSynced &&
      todayStr &&
      attendanceConfig.autoCheckInOnOpen !== false &&
      canCheckInOrOut &&
      isStrictPresenceOk &&
      !todayRecord
    ) {
      checkInMember(activeMemberName, getVerificationLabel());
    }
  }, [
    isCloudSynced,
    todayStr,
    attendanceConfig.autoCheckInOnOpen,
    attendanceConfig.requireWifiOrGps,
    canCheckInOrOut,
    isWifiMatched,
    isGpsMatched,
    Boolean(todayRecord),
    activeMemberName,
  ]);

  const getLiveElapsedDisplay = () => {
    if (!todayRecord) return { text: "0h 00m", percent: 0 };
    const inMs = parseTimeToMs(todayRecord.date, todayRecord.checkInTime) || todayRecord.checkInTimestamp;
    if (todayRecord.checkOutTime) {
      const outMs = parseTimeToMs(todayRecord.date, todayRecord.checkOutTime) || todayRecord.checkOutTimestamp;
      const mins = todayRecord.workingMinutes !== undefined
        ? todayRecord.workingMinutes
        : (inMs && outMs && outMs > inMs ? Math.round((outMs - inMs) / 60000) : 0);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const pct = Math.min(100, Math.round((mins / ((attendanceConfig.targetHours || 8) * 60)) * 100));
      return { text: `${h}h ${m < 10 ? `0${m}` : m}m`, percent: pct };
    }
    if (!inMs) return { text: "0h 00m", percent: 0 };
    const nowMs = nowTimestamp || Date.now();
    const diffMins = Math.max(0, Math.floor((nowMs - inMs) / 60000));
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
              Shift: {attendanceConfig.officeStartTime} – {attendanceConfig.officeEndTime} <span className="text-amber-700 font-bold">(Grace: {attendanceConfig.graceTime})</span> • 1st WiFi/GPS connect auto-records Check-In
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
            {/* Pill 1: Account Verified */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100/80 text-emerald-800">
              <CheckCircle2 size={14} />
              Account: {activeMemberName}
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
                  : gpsStatus === "checking"
                  ? "bg-blue-100 text-blue-800"
                  : gpsStatus === "outside"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : gpsStatus === "error"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-gray-200/70 text-gray-600"
              }`}
            >
              <MapPin size={14} />
              {isGpsMatched
                ? `Office GPS Verified (${gpsDistance ?? 0}m)`
                : gpsStatus === "checking"
                ? "Checking GPS..."
                : gpsStatus === "outside"
                ? `GPS Outside (${gpsDistance ? `${gpsDistance}m away` : "too far"})`
                : gpsStatus === "error"
                ? "GPS / Location Blocked"
                : "GPS Standby"}
            </span>

            {/* Pill 4: Grace Time */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Clock size={14} className="text-amber-600" />
              Grace Time: {attendanceConfig.graceTime || "09:45"}
            </span>
          </div>

          {/* Right side quick action if needed */}
          <div className="flex items-center gap-2">
            {!isWifiMatched && !isGpsMatched && (
              <button
                onClick={handleVerifyGps}
                disabled={gpsStatus === "checking"}
                className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Navigation size={12} className={gpsStatus === "checking" ? "animate-spin" : ""} />
                {gpsStatus === "checking" ? "Checking..." : "Verify GPS"}
              </button>
            )}
            {sessionUser?.role === "admin" && (
              <button
                onClick={handleSetLiveGpsAsOffice}
                disabled={isSettingOfficeGps}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                title="Admin only: Save your current device location as the official Office GPS coordinates"
              >
                <MapPin size={12} /> {isSettingOfficeGps ? "Saving..." : "Set Current GPS as Office"}
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
              {todayRecord ? (todayRecord.checkInTime || "—").replace(/:\d{2}\s/, " ") : "— : —"}
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
            <div className="space-y-2">
              <div className="w-full py-3.5 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-red-800">
                  <XCircle size={17} className="shrink-0 text-red-600" />
                  <span>Connect to Office &ldquo;{attendanceConfig.wifiName || "Panda WiFi"}&rdquo; or Office GPS to Check In/Out</span>
                </div>
                {gpsStatus === "outside" && gpsDistance !== null && (
                  <div className="space-y-2 w-full pt-1">
                    <p className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                      Device GPS is <strong>{gpsDistance}m</strong> away from office (Allowed radius: {attendanceConfig.allowedRadiusMeters || 100}m). You must be within 100 meters of the office to check in.
                    </p>
                    {sessionUser?.role === "admin" && (
                      <button
                        type="button"
                        onClick={handleSetLiveGpsAsOffice}
                        disabled={isSettingOfficeGps}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <MapPin size={14} />
                        {isSettingOfficeGps ? "Saving Location to Office..." : "📍 Admin: Set Current Location as Office GPS"}
                      </button>
                    )}
                  </div>
                )}
                {gpsStatus === "error" && (
                  <p className="text-[11px] font-semibold text-red-800 bg-red-100/80 px-2.5 py-1 rounded-lg">
                    Location access was denied or unavailable. Please click the padlock / site settings icon in your browser address bar and choose &quot;Allow Location&quot;.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleVerifyGps}
                disabled={gpsStatus === "checking"}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Navigation size={14} className={gpsStatus === "checking" ? "animate-spin" : ""} />
                {gpsStatus === "checking" ? "Detecting Device GPS..." : "Re-Check Device GPS Location"}
              </button>
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
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCheckOutConfirm(true)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut size={18} />
                Check Out Now ({liveTimeStr})
              </button>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                title="Send Daily Work Report to Sir (8240017974)"
              >
                <MessageCircle size={15} className="text-emerald-600" />
                <span>Send Today&apos;s Work Report to Sir (WhatsApp)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Today&apos;s Attendance Completed!
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Send Daily Work Report to Sir (8240017974)"
              >
                <MessageCircle size={18} />
                <span>Send Today&apos;s Work Report to Sir (8240017974)</span>
              </button>
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Total: {myRecords.length} days</span>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-1"
              title="Send Daily Work Report to Sir (8240017974)"
            >
              <MessageCircle size={13} />
              <span>Report to Sir</span>
            </button>
          </div>
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
                      {(() => {
                        if (rec.checkOutTime) {
                          if (rec.workingMinutes !== undefined) return formatMinutes(rec.workingMinutes);
                          const inMs = rec.checkInTimestamp || parseTimeToMs(rec.date, rec.checkInTime);
                          const outMs = rec.checkOutTimestamp || parseTimeToMs(rec.date, rec.checkOutTime);
                          if (inMs && outMs && outMs > inMs) {
                            return formatMinutes(Math.round((outMs - inMs) / 60000));
                          }
                          return "—";
                        }
                        const inMs = rec.checkInTimestamp || parseTimeToMs(rec.date, rec.checkInTime);
                        if (inMs) {
                          const elapsedMins = Math.max(0, Math.floor(((nowTimestamp || Date.now()) - inMs) / 60000));
                          return (
                            <span className="text-blue-600 flex items-center gap-1 font-mono">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              {formatMinutes(elapsedMins)}
                            </span>
                          );
                        }
                        return "Active";
                      })()}
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
      {/* Member Send Report Modal */}
      <MemberSendReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        memberName={activeMemberName}
      />

      {/* Safety Confirmation Modal for Check-Out */}
      {showCheckOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <LogOut size={28} />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">Confirm Shift Check-Out?</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Are you sure you want to check out right now? Your shift will end and today&apos;s working hours ({liveProgress.text}) will be submitted.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckOutConfirm(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                No, Keep Working
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Yes, Check Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
