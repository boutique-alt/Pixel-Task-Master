"use client";

import React, { useState, useEffect } from "react";
import { MapPin, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCRM } from "@/context/CRMContext";

export default function SetOfficeGpsPage() {
  const { updateAttendanceConfig, sessionUser } = useCRM();
  const [status, setStatus] = useState<"detecting" | "saving" | "success" | "error" | "unauthorized">("detecting");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const captureAndSave = () => {
    if (sessionUser && sessionUser.role !== "admin") {
      setStatus("unauthorized");
      return;
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("detecting");
    setErrorMsg("");

    const handlePos = async (pos: GeolocationPosition) => {
      setStatus("saving");
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy || 0);
      setCoords({ lat, lng, accuracy: acc });

      try {
        // 1. Update in local CRM Context
        updateAttendanceConfig({
          officeLat: lat,
          officeLng: lng,
          allowedRadiusMeters: 100,
        });

        // 2. Direct server save to Supabase
        const res = await fetch("/api/attendance/set-office-gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ officeLat: lat, officeLng: lng, allowedRadiusMeters: 100 }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to save to cloud");
        }

        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Failed to save coordinates.");
      }
    };

    navigator.geolocation.getCurrentPosition(
      handlePos,
      (err) => {
        if (err.code !== 1) {
          navigator.geolocation.getCurrentPosition(
            handlePos,
            (err2) => {
              setStatus("error");
              setErrorMsg(err2.message || "Failed to detect location.");
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        } else {
          setStatus("error");
          setErrorMsg("Location access denied. Please click the lock icon in your browser address bar and allow Location access.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    captureAndSave();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <MapPin size={32} />
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900">Office GPS Calibration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture current live coordinates and save them as the official Office GPS location (100m radius).
          </p>
        </div>

        {status === "detecting" && (
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl flex flex-col items-center gap-2">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
            <span className="text-xs font-bold text-blue-800">Detecting exact device coordinates...</span>
            <span className="text-[11px] text-blue-600">Please click &quot;Allow&quot; if browser asks for location.</span>
          </div>
        )}

        {status === "saving" && (
          <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl flex flex-col items-center gap-2">
            <RefreshCw size={24} className="text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-purple-800">Saving to Supabase Cloud Database...</span>
          </div>
        )}

        {status === "success" && coords && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>Office Location Successfully Saved!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Latitude</span>
                  {coords.lat}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Longitude</span>
                  {coords.lng}
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between font-sans">
                  <span className="text-[11px] text-slate-500">Allowed Radius: <strong>100 Meters</strong></span>
                  <span className="text-[11px] text-emerald-600 font-bold">Accuracy: ±{coords.accuracy}m</span>
                </div>
              </div>
            </div>

            <Link
              href="/member/attendance"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer block"
            >
              <ArrowLeft size={16} /> Return to Attendance Page
            </Link>
          </div>
        )}

        {status === "unauthorized" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <span>Admin Permission Required</span>
              </div>
              <p className="text-xs text-amber-800">Only Admins can calibrate or change the office location.</p>
            </div>
            <Link
              href="/member/attendance"
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer block"
            >
              <ArrowLeft size={16} /> Return to Attendance
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-left space-y-1.5">
              <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <span>Detection Failed</span>
              </div>
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>

            <button
              onClick={captureAndSave}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Retry Location Detection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
