"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, MessageSquare, Phone, Star, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "../../config/api";
import { getAuthToken, isAuthenticated } from "../../utils/auth-utils";
import {
  getAllCachedAstrologers,
  appendAstrologers,
  type CachedAstrologer,
} from "../../utils/astrologer-cache";

interface OfflineAstrologerModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineAstrologerName: string;
  /**
   * `offline` — astrologer was not online (default).
   * `busy`    — astrologer was online but declined / is on another session.
   */
  reason?: "offline" | "busy";
}

interface OnlineAstrologer {
  _id: string;
  name: string;
  avatar?: string;
  profileImage?: string;
  rating?: number | { avg?: number };
  rpm?: number;
  status?: string;
}

const ONLINE_LIMIT = 5;

function extractList(payload: unknown): CachedAstrologer[] {
  const p = payload as Record<string, unknown> | null | undefined;
  if (!p) return [];
  const data = p.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray((data as Record<string, unknown>)?.list)) {
    return ((data as Record<string, unknown>).list as CachedAstrologer[]) || [];
  }
  if (Array.isArray(data)) return data as CachedAstrologer[];
  if (Array.isArray(p.users)) return p.users as CachedAstrologer[];
  return [];
}

function ratingValue(r: OnlineAstrologer["rating"]): number {
  if (typeof r === "number") return r;
  if (r && typeof r === "object" && typeof r.avg === "number") return r.avg;
  return 4.8;
}

function avatarSrc(a: OnlineAstrologer): string {
  if (a.avatar && a.avatar.startsWith("http")) return a.avatar;
  if (a.profileImage && a.profileImage.startsWith("http")) return a.profileImage;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    a.name || "Astrologer"
  )}&background=F7941D&color=fff&size=120`;
}

export default function OfflineAstrologerModal({
  isOpen,
  onClose,
  offlineAstrologerName,
  reason = "offline",
}: OfflineAstrologerModalProps) {
  const isBusy = reason === "busy";
  const heading = isBusy
    ? "Astrologer is busy right now"
    : "Astrologer is not available online";
  const subheading = isBusy
    ? " is currently busy with another session. Try one of these online astrologers instead:"
    : " was not available online. Try one of these online astrologers instead:";
  const emptyMessage = isBusy
    ? "All other astrologers are busy too. Please try again shortly."
    : "No astrologers are online right now. Please try again shortly.";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<OnlineAstrologer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen, onClose]);

  // Fetch online astrologers when opened.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    // 1. Try the in-memory cache first — populated by AstrologerList.
    const cached = getAllCachedAstrologers() as unknown as OnlineAstrologer[];
    const onlineFromCache = cached.filter(
      (a) => (a.status || "").toLowerCase() === "online"
    );
    if (onlineFromCache.length > 0) {
      setOnline(onlineFromCache.slice(0, ONLINE_LIMIT));
    }

    // 2. Always also hit the network for a fresh slice.
    setLoading(true);
    setError(null);

    const baseUrl = getApiBaseUrl();
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // The users-list endpoint returns mixed statuses; filter client-side.
    fetch(`${baseUrl}/user/api/users-list?skip=0&limit=50&asc=-1`, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => null);
        const list = extractList(json) as unknown as OnlineAstrologer[];
        appendAstrologers(list as unknown as CachedAstrologer[]);
        const onlineList = list.filter(
          (a) => (a.status || "").toLowerCase() === "online"
        );
        if (!cancelled) {
          if (onlineList.length === 0 && onlineFromCache.length === 0) {
            setError(emptyMessage);
          }
          setOnline(onlineList.slice(0, ONLINE_LIMIT));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[OfflineAstrologerModal] fetch failed", err);
        if (onlineFromCache.length === 0) {
          setError("Couldn't load online astrologers. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, emptyMessage]);

  const handleChat = (a: OnlineAstrologer) => {
    onClose();
    if (!isAuthenticated()) {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedAstrologerId", a._id);
        localStorage.setItem("chatIntent", "1");
      }
      router.push(`/calls/call1?astrologerId=${a._id}`);
      return;
    }
    // Navigate to the astrologer's profile so the existing chat flow can pick it up.
    router.push(`/astrologers/${a._id}`);
  };

  const handleCall = (a: OnlineAstrologer) => {
    onClose();
    if (!isAuthenticated()) {
      if (typeof window !== "undefined") {
        localStorage.setItem("callIntent", "audio");
        localStorage.setItem("selectedAstrologerId", a._id);
        localStorage.setItem("callSource", "offlineSuggestion");
      }
      router.push("/login");
      return;
    }
    router.push(`/call-with-astrologer/profile/${a._id}`);
  };

  const visible = useMemo(() => online.slice(0, ONLINE_LIMIT), [online]);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-astro-title"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-orange-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="min-w-0">
            <h2
              id="offline-astro-title"
              className="text-base sm:text-lg font-bold text-gray-900 leading-snug no-justify"
            >
              {heading}
            </h2>
            <p className="mt-1 text-xs text-gray-600 no-justify">
              <span className="font-semibold text-gray-800">{offlineAstrologerName}</span>
              {subheading}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-2" />
              <span className="text-sm no-justify">Finding online astrologers…</span>
            </div>
          )}

          {!loading && visible.length === 0 && error && (
            <div className="py-10 text-center text-sm text-gray-600 no-justify">
              {error}
            </div>
          )}

          {visible.length > 0 && (
            <ul className="divide-y divide-orange-50">
              {visible.map((a) => (
                <li
                  key={a._id}
                  className="flex items-center gap-3 py-3 px-2"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarSrc(a)}
                      alt={a.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-100"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-white">
                      <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                      {a.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {ratingValue(a.rating).toFixed(1)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-600 font-semibold">
                        ₹{a.rpm || 15}/min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleChat(a)}
                      className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg bg-white border border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-50 active:scale-95 transition-all"
                      aria-label={`Chat with ${a.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCall(a)}
                      className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-all"
                      aria-label={`Call ${a.name}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-orange-100 bg-orange-50/40">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/call-with-astrologer");
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 active:scale-95 transition-all"
          >
            Browse all astrologers
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
