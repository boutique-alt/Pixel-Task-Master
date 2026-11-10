"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Cake,
  Heart,
  MessageCircle,
  Sparkles,
  Send,
  X,
  Gift,
  PartyPopper,
  Flame,
  Award,
  Calendar,
  Volume2,
} from "lucide-react";
import { useCRM, MemberProfileDetail } from "@/context/CRMContext";
import { playBirthdayCelebrationSound } from "@/lib/soundService";

export default function BirthdayCelebrationBanner() {
  const {
    members,
    memberDetailsList,
    birthdayInteractions,
    sessionUser,
    currentMember,
    toggleBirthdayLike,
    addBirthdayComment,
  } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeBirthdayIndex, setActiveBirthdayIndex] = useState(0);

  // Active user identity
  const currentUserName = sessionUser?.name || currentMember || "You";
  const currentUserRole =
    sessionUser?.role === "admin"
      ? "Admin"
      : sessionUser?.role === "coordinator"
      ? "Coordinator"
      : "Team Member";

  // Today's date in local time (MM-DD)
  const today = new Date();
  const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
  const todayDay = String(today.getDate()).padStart(2, "0");
  const todayMD = `${todayMonth}-${todayDay}`; // e.g. "11-10"
  const currentYear = today.getFullYear();

  // Find all members/coordinators whose DOB matches today's month & day
  const birthdayMembers = useMemo(() => {
    return memberDetailsList.filter((detail) => {
      if (!detail.dob) return false;
      // detail.dob can be YYYY-MM-DD
      const parts = detail.dob.split("-");
      if (parts.length >= 3) {
        const m = parts[1].padStart(2, "0");
        const d = parts[2].padStart(2, "0");
        return `${m}-${d}` === todayMD;
      }
      return false;
    });
  }, [memberDetailsList, todayMD]);

  // Current active birthday member
  const currentCelebrant = birthdayMembers[activeBirthdayIndex] || birthdayMembers[0];

  // Corresponding interaction state
  const currentInteraction = useMemo(() => {
    if (!currentCelebrant) return null;
    const id = `bday_${currentYear}_${currentCelebrant.memberName.trim().toLowerCase().replace(/\s+/g, "_")}`;
    return (
      birthdayInteractions.find((i) => i.id === id) || {
        id,
        birthdayMember: currentCelebrant.memberName,
        year: currentYear,
        likes: [],
        comments: [],
        updatedAt: "",
      }
    );
  }, [currentCelebrant, birthdayInteractions, currentYear]);

  // First time auto-popup on Birthday day + Play Birthday Celebration Music
  useEffect(() => {
    if (birthdayMembers.length === 0) return;

    // Check if auto-shown today for this user
    const seenKey = `ptm_bday_popup_seen_${todayMD}_${currentYear}`;
    const alreadySeen = typeof window !== "undefined" ? sessionStorage.getItem(seenKey) : null;

    if (!alreadySeen) {
      setIsOpen(true);
      try {
        sessionStorage.setItem(seenKey, "true");
      } catch {}

      // Play Birthday jingle & Voice announcement
      if (currentCelebrant) {
        setTimeout(() => {
          playBirthdayCelebrationSound(currentCelebrant.memberName);
        }, 600);
      }
    }
  }, [birthdayMembers, todayMD, currentYear, currentCelebrant]);

  if (birthdayMembers.length === 0) {
    return null;
  }

  const hasLiked = currentInteraction?.likes.includes(currentUserName);
  const likesCount = currentInteraction?.likes.length || 0;
  const comments = currentInteraction?.comments || [];

  // Corresponding member role
  const matchedMemberInfo = members.find(
    (m) => m.name.trim().toLowerCase() === currentCelebrant.memberName.trim().toLowerCase()
  );

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Current user photo if available
    const myProfile = memberDetailsList.find(
      (m) => m.memberName.trim().toLowerCase() === currentUserName.trim().toLowerCase()
    );

    addBirthdayComment(
      currentCelebrant.memberName,
      currentUserName,
      commentText,
      currentUserRole,
      myProfile?.profilePhoto
    );
    setCommentText("");
  };

  return (
    <>
      {/* 1. TOP HEADER / FLOATING BIRTHDAY CELEBRATION BUTTON */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative group px-3.5 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all animate-pulse hover:animate-none cursor-pointer border border-white/30"
          title="Click to view Birthday Celebration Card & Wishes"
        >
          <Cake size={16} className="text-yellow-300 animate-bounce" />
          <span className="tracking-wide">
            🎂 Today&apos;s Birthday: <strong>{currentCelebrant.memberName}</strong>
          </span>
          {birthdayMembers.length > 1 && (
            <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
              +{birthdayMembers.length - 1} more
            </span>
          )}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
          </span>
        </button>
      </div>

      {/* 2. CANVA-DESIGNED BIRTHDAY CELEBRATION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/40 my-auto flex flex-col max-h-[94vh]">
            
            {/* Action Buttons: Play Sound + Close */}
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => playBirthdayCelebrationSound(currentCelebrant.memberName)}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-yellow-300 flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                title="Play Birthday Jingle & Wish Announcement"
              >
                <Volume2 size={17} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                title="Close Celebration"
              >
                <X size={18} />
              </button>
            </div>

            {/* If multiple birthdays today: Switch tabs */}
            {birthdayMembers.length > 1 && (
              <div className="bg-[#0D2653] px-6 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-white/10 z-10">
                <span className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wider shrink-0">
                  Birthdays Today:
                </span>
                {birthdayMembers.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveBirthdayIndex(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      activeBirthdayIndex === idx
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    🎂 {m.memberName}
                  </button>
                ))}
              </div>
            )}

            {/* CANVA-STYLE FESTIVE CARD BANNER */}
            <div className="relative bg-gradient-to-br from-[#1A0B2E] via-[#2D124D] to-[#0E1E45] text-white p-6 sm:p-8 overflow-hidden text-center shrink-0">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25">
                <div className="absolute top-2 left-6 text-3xl animate-spin duration-1000">✨</div>
                <div className="absolute bottom-4 left-10 text-2xl">🎈</div>
                <div className="absolute top-6 right-8 text-3xl">🎉</div>
                <div className="absolute bottom-3 right-8 text-2xl">🍰</div>
                <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-pink-500/20 blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-500/20 blur-3xl"></div>
              </div>

              {/* Pixel Brand Logo Header */}
              <div className="relative z-10 flex items-center justify-center gap-2.5 mb-4">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-md border border-white/30 flex items-center gap-2">
                  <Image
                    src="/pixel-solution-logo.png"
                    alt="Pixel Solution"
                    width={180}
                    height={45}
                    className="object-contain h-8 sm:h-9 w-auto"
                    priority
                  />
                </div>
              </div>

              {/* Big Celebration Headline */}
              <div className="relative z-10 space-y-1 mb-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-300 bg-amber-400/15 px-3 py-1 rounded-full border border-amber-300/30">
                  <Sparkles size={13} className="text-amber-300" />
                  <span>Happy Birthday</span>
                  <Sparkles size={13} className="text-amber-300" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-300 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                  Wishing You a Blessed Year!
                </h2>
              </div>

              {/* Member Photo in Premium Gold/Rainbow Glowing Ring */}
              <div className="relative z-10 mx-auto w-28 h-28 sm:w-32 sm:h-32 mb-3">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 to-cyan-400 animate-spin duration-3000 blur-xs"></div>
                <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-yellow-300 via-pink-400 to-purple-500 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center">
                    {currentCelebrant.profilePhoto ? (
                      <img
                        src={currentCelebrant.profilePhoto}
                        alt={currentCelebrant.memberName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center">
                        {currentCelebrant.memberName[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 text-2xl filter drop-shadow">
                  👑
                </div>
              </div>

              {/* Member Name & Official Role */}
              <div className="relative z-10 space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {currentCelebrant.memberName}
                </h3>
                <p className="text-xs font-bold text-blue-200/90">
                  {matchedMemberInfo?.role || "Valued Team Member"} • Pixel Family
                </p>
              </div>

              {/* Canva Quote Strip */}
              <div className="relative z-10 mt-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 max-w-md mx-auto">
                <p className="text-[12px] italic font-medium text-pink-100">
                  &ldquo;May your day be filled with happiness, new achievements, and beautiful moments! Thank you for being an indispensable part of our team!&rdquo;
                </p>
              </div>
            </div>

            {/* LIKES & INTERACTION STRIP */}
            <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleBirthdayLike(currentCelebrant.memberName, currentUserName)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                    hasLiked
                      ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-rose-100 scale-105"
                      : "bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-600 border border-gray-200"
                  }`}
                  title={hasLiked ? "Unlike" : "Like"}
                >
                  <Heart
                    size={18}
                    className={`transition-transform duration-200 ${
                      hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                    }`}
                  />
                  <span className="font-black text-xs">
                    {likesCount}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                  <MessageCircle size={16} className="text-[#1677FF]" />
                  <span>{comments.length}</span>
                </div>
              </div>

              {/* Liked by names preview */}
              {currentInteraction && currentInteraction.likes.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-gray-500">
                  <span className="text-gray-800 font-extrabold truncate max-w-[200px]">
                    {currentInteraction.likes.slice(0, 2).join(", ")}
                    {currentInteraction.likes.length > 2
                      ? ` +${currentInteraction.likes.length - 2} others`
                      : ""}
                  </span>
                </div>
              )}
            </div>

            {/* WISHES & COMMENTS STREAM */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#FAFBFD] min-h-[160px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                  Birthday Wishes &amp; Messages ({comments.length})
                </span>
                <span className="text-[11px] text-[#1677FF] font-bold">
                  Send your wish below 👇
                </span>
              </div>

              {comments.length === 0 ? (
                <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-1">
                  <PartyPopper size={28} className="mx-auto text-amber-500" />
                  <p className="text-xs font-bold text-gray-700">Be the first to wish {currentCelebrant.memberName}!</p>
                  <p className="text-[11px] text-gray-400">Type your warm wishes below to celebrate together.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {cm.authorPhoto ? (
                          <img src={cm.authorPhoto} alt={cm.authorName} className="w-full h-full object-cover" />
                        ) : (
                          cm.authorName[0]
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-gray-900 truncate">
                            {cm.authorName}
                            <span className="ml-1.5 text-[10px] font-bold text-gray-400">
                              ({cm.authorRole || "Member"})
                            </span>
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                            {cm.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1 font-medium whitespace-pre-wrap leading-relaxed">
                          {cm.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEND WISH INPUT FOOTER */}
            <form onSubmit={handleSendComment} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Write a warm birthday wish for ${currentCelebrant.memberName}... 🎂`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs font-medium bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 transition-all text-gray-800"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-3 bg-gradient-to-r from-pink-500 to-[#1677FF] hover:from-pink-600 hover:to-blue-600 disabled:opacity-40 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
