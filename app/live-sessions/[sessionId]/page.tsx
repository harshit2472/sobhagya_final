'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useLiveSocket, ChatMessage, QueueItem } from '../../hooks/useLiveSocket';
import { isAuthenticated, getUserDetails, getAuthToken } from '../../utils/auth-utils';
import { fetchWalletBalance as simpleFetchWalletBalance } from '../../utils/production-api';
import GiftConfirmationDialog from '../../components/ui/GiftConfirmationDialog';
import DakshinaModal from '../../components/calling/ui/DakshinaModal';
import {
  ArrowLeft, Heart, Lock, Globe, X, Send,
  Phone, Loader2, AlertCircle, Eye, Gift,
  Wallet, Mic, MicOff, PhoneOff, Users, UserPlus, StopCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveKitRoom, VideoTrack, useTracks, RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';

/* ────────────────────────────────────────────────────────────────────── */
/*  Types                                                                */
/* ────────────────────────────────────────────────────────────────────── */
interface GiftItem {
  _id: string;
  name: string;
  icon: string;
  price: number;
  description?: string;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Floating Hearts — Instagram/YouTube-Live style burst                 */
/* ────────────────────────────────────────────────────────────────────── */
type FloatingHeart = {
  id: number;
  x: number;        // px offset from center (-px, +px)
  rotation: number; // deg
  size: number;     // px
  color: string;
  duration: number; // s
  delay: number;    // ms
  drift: number;    // px lateral drift while floating
};

const HEART_COLORS = ['#ef4444', '#ec4899', '#f97316', '#fb923c', '#f43f5e', '#e11d48'];

function FloatingHearts({ trigger }: { trigger: number }) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    // Burst of 2–4 hearts per tap with varied attributes
    const burstSize = 2 + Math.floor(Math.random() * 3);
    const newHearts: FloatingHeart[] = [];
    for (let i = 0; i < burstSize; i++) {
      newHearts.push({
        id: Date.now() + Math.random(),
        x: Math.random() * 50 - 25,
        rotation: Math.random() * 50 - 25,
        size: 18 + Math.random() * 14,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        duration: 2.4 + Math.random() * 1.4,
        delay: i * 70,
        drift: Math.random() * 40 - 20,
      });
    }

    setHearts(prev => [...prev.slice(-40), ...newHearts]);

    const longestMs = Math.max(...newHearts.map(h => h.duration * 1000 + h.delay)) + 1500;
    const timer = setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.some(n => n.id === h.id)));
    }, longestMs);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-72 pointer-events-none overflow-visible z-[30]">
      {hearts.map(h => (
        <div
          key={h.id}
          className="absolute bottom-0 left-1/2 animate-burst-heart"
          style={{
            ['--burst-x' as any]: `${h.x}px`,
            ['--burst-drift' as any]: `${h.drift}px`,
            ['--burst-rot' as any]: `${h.rotation}deg`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}ms`,
          }}
        >
          <Heart
            style={{ color: h.color, fill: h.color, width: `${h.size}px`, height: `${h.size}px` }}
            className="drop-shadow-[0_3px_10px_rgba(239,68,68,0.55)] opacity-90 will-change-transform"
          />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Gift Toast                                                           */
/* ────────────────────────────────────────────────────────────────────── */
function GiftToast({ gift, senderName, onDone }: { gift: GiftItem; senderName: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -100, opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 12, stiffness: 100 }}
      className="flex items-center gap-3 premium-glass rounded-2xl pl-2 pr-5 py-2.5 shadow-2xl border-orange-200/50"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-50/50 flex items-center justify-center border border-orange-100 p-1">
        <img 
          src={gift.icon} 
          alt={gift.name} 
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://img.icons8.com/fluency/48/gift.png';
          }}
        />
      </div>
      <div>
        <p className="text-gray-900 text-xs font-extrabold">{senderName}</p>
        <p className="text-orange-600 text-[11px] font-bold">offered {gift.name} <span className="text-gray-400">&#8226; ₹{formatRupees(gift.price)}</span></p>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Audio Playback Unlocker                                              */
/*  Browsers block autoplay audio until user interaction; after a page   */
/*  refresh mid-session the LiveKit room cannot render audio until we    */
/*  call room.startAudio() from a user gesture.                          */
/* ────────────────────────────────────────────────────────────────────── */
function AudioPlaybackUnlocker() {
  const room = useRoomContext();
  const [blocked, setBlocked] = useState(false);

  // Watch playback state on every relevant event. After a page refresh the
  // room reconnects with existing subscriptions, but the browser's autoplay
  // policy keeps audio paused until a user gesture — `canPlaybackAudio`
  // flips to false at that moment, sometimes only once the first remote
  // track actually subscribes, so we also refresh on `trackSubscribed`
  // and `connected`.
  useEffect(() => {
    if (!room) return;
    const update = async () => {
      // Try to auto-unblock audio without waiting for a gesture — this
      // succeeds whenever the browser still considers the page "activated"
      // (e.g. the refresh happened on a tab that was just interacted with).
      if (!room.canPlaybackAudio) {
        try { await room.startAudio(); } catch {}
      }
      setBlocked(!room.canPlaybackAudio);
    };
    update();
    room.on('audioPlaybackChanged' as any, update);
    room.on('connected' as any, update);
    room.on('reconnected' as any, update);
    room.on('trackSubscribed' as any, update);
    return () => {
      room.off('audioPlaybackChanged' as any, update);
      room.off('connected' as any, update);
      room.off('reconnected' as any, update);
      room.off('trackSubscribed' as any, update);
    };
  }, [room]);

  // Always-on gesture unlock: attach a persistent capturing listener that
  // calls `room.startAudio()` on every user interaction until playback is
  // no longer blocked. The previous implementation only attached this when
  // `blocked===true` had already fired, which missed the race where audio
  // became blocked between render passes after a refresh.
  useEffect(() => {
    if (!room) return;
    const tryStart = async () => {
      if (!room.canPlaybackAudio) {
        try { await room.startAudio(); } catch {}
      }
    };
    const handler = () => { tryStart(); };
    window.addEventListener('pointerdown', handler, true);
    window.addEventListener('touchstart', handler, true);
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('touchstart', handler, true);
      window.removeEventListener('keydown', handler, true);
    };
  }, [room]);

  if (!blocked) return null;
  return (
    <button
      onClick={async () => { try { await room?.startAudio(); } catch {} }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all animate-pulse flex items-center gap-2 border border-white/30"
    >
      <span className="text-sm">🔊</span> Tap to enable audio
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Call Room Controller                                                 */
/*  Ensures the local microphone is reliably published/muted when the    */
/*  LiveKit token switches from viewer -> in-call and back.              */
/* ────────────────────────────────────────────────────────────────────── */
function CallRoomController({ isInCall, isMuted, onConnected }: { isInCall: boolean; isMuted: boolean; onConnected?: () => void }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const lastAppliedRef = useRef<{ inCall: boolean; muted: boolean } | null>(null);
  const connectedFiredRef = useRef(false);

  useEffect(() => {
    if (!room || !localParticipant) return;
    if (room.state !== ConnectionState.Connected) return;

    const desiredMicOn = isInCall && !isMuted;
    const last = lastAppliedRef.current;
    if (last && last.inCall === isInCall && last.muted === isMuted) return;

    (async () => {
      try {
        await localParticipant.setMicrophoneEnabled(desiredMicOn);
        lastAppliedRef.current = { inCall: isInCall, muted: isMuted };
        dlog('CallRoomController: mic set to', desiredMicOn);
      } catch (err) {
        console.warn('[LiveCall] Failed to toggle microphone:', err);
      }
    })();

    // Fire onConnected once per mount once we're connected in a call phase.
    if (isInCall && !connectedFiredRef.current) {
      connectedFiredRef.current = true;
      try { onConnected?.(); } catch (err) { console.warn('[LiveCall] onConnected handler threw:', err); }
    }
  }, [room, localParticipant, isInCall, isMuted, room?.state, onConnected]);

  // Also react to (re)connect events (key-flip triggers a fresh connect).
  useEffect(() => {
    if (!room) return;
    const handleConnected = async () => {
      try {
        const desiredMicOn = isInCall && !isMuted;
        await localParticipant?.setMicrophoneEnabled(desiredMicOn);
        lastAppliedRef.current = { inCall: isInCall, muted: isMuted };
        dlog('CallRoomController: post-connect mic set to', desiredMicOn);
        if (isInCall && !connectedFiredRef.current) {
          connectedFiredRef.current = true;
          try { onConnected?.(); } catch (err) { console.warn('[LiveCall] onConnected handler threw:', err); }
        }
      } catch (err) {
        console.warn('[LiveCall] setMicrophoneEnabled on connect failed:', err);
      }
    };
    room.on('connected' as any, handleConnected);
    room.on('reconnected' as any, handleConnected);
    return () => {
      room.off('connected' as any, handleConnected);
      room.off('reconnected' as any, handleConnected);
    };
  }, [room, localParticipant, isInCall, isMuted, onConnected]);

  return null;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Broadcaster Publish Controller                                       */
/*  Ensures the broadcaster's camera + microphone are published once     */
/*  the LiveKit room is connected. Reacts to mute/unmute toggles and to  */
/*  reconnect events (e.g. after a refresh).                             */
/* ────────────────────────────────────────────────────────────────────── */
function BroadcasterPublishController({
  isMuted,
  onConnected,
  onRemoteParticipantConnected,
  onRemoteParticipantDisconnected,
}: {
  isMuted: boolean;
  onConnected?: () => void;
  onRemoteParticipantConnected?: (identity: string) => void;
  onRemoteParticipantDisconnected?: (identity: string) => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const lastAppliedRef = useRef<{ muted: boolean } | null>(null);
  const connectedFiredRef = useRef(false);

  // Fallback signal for "user accepted my invite": LiveKit room sees the
  // viewer connect even when the backend's `call_started` socket broadcast
  // never fires (which happens when activeCall isn't persisted with a
  // channelId). The broadcaster needs *some* trigger to flip into in-call UI.
  useEffect(() => {
    if (!room) return;
    const handleConnected = (p: any) => {
      const identity = p?.identity || '';
      if (!identity) return;
      console.log('[Broadcaster] LiveKit ParticipantConnected:', identity);
      try { onRemoteParticipantConnected?.(identity); } catch (err) { console.warn('[Broadcaster] onRemoteParticipantConnected threw:', err); }
    };
    const handleDisconnected = (p: any) => {
      const identity = p?.identity || '';
      if (!identity) return;
      console.log('[Broadcaster] LiveKit ParticipantDisconnected:', identity);
      try { onRemoteParticipantDisconnected?.(identity); } catch (err) { console.warn('[Broadcaster] onRemoteParticipantDisconnected threw:', err); }
    };
    room.on('participantConnected' as any, handleConnected);
    room.on('participantDisconnected' as any, handleDisconnected);
    return () => {
      room.off('participantConnected' as any, handleConnected);
      room.off('participantDisconnected' as any, handleDisconnected);
    };
  }, [room, onRemoteParticipantConnected, onRemoteParticipantDisconnected]);

  // Request and publish camera + mic once the room is connected.
  useEffect(() => {
    if (!room || !localParticipant) return;
    if (room.state !== ConnectionState.Connected) return;

    const last = lastAppliedRef.current;
    if (last && last.muted === isMuted) return;

    (async () => {
      try {
        await Promise.all([
          localParticipant.setCameraEnabled(true),
          localParticipant.setMicrophoneEnabled(!isMuted),
        ]);
        lastAppliedRef.current = { muted: isMuted };
        console.log('[Broadcaster] Camera+mic published, mic muted =', isMuted);
      } catch (err) {
        console.warn('[Broadcaster] Failed to publish camera/mic:', err);
      }
    })();

    if (!connectedFiredRef.current) {
      connectedFiredRef.current = true;
      try { onConnected?.(); } catch (err) { console.warn('[Broadcaster] onConnected handler threw:', err); }
    }
  }, [room, localParticipant, isMuted, room?.state, onConnected]);

  // Re-publish on (re)connect events.
  useEffect(() => {
    if (!room) return;
    const handleConnected = async () => {
      try {
        await Promise.all([
          localParticipant?.setCameraEnabled(true),
          localParticipant?.setMicrophoneEnabled(!isMuted),
        ]);
        lastAppliedRef.current = { muted: isMuted };
        console.log('[Broadcaster] Re-published camera+mic after (re)connect.');
        if (!connectedFiredRef.current) {
          connectedFiredRef.current = true;
          try { onConnected?.(); } catch (err) { console.warn('[Broadcaster] onConnected handler threw:', err); }
        }
      } catch (err) {
        console.warn('[Broadcaster] (re)connect publish failed:', err);
      }
    };
    room.on('connected' as any, handleConnected);
    room.on('reconnected' as any, handleConnected);
    return () => {
      room.off('connected' as any, handleConnected);
      room.off('reconnected' as any, handleConnected);
    };
  }, [room, localParticipant, isMuted, onConnected]);

  return null;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Broadcaster Self-Preview                                             */
/*  Used when the current user IS the broadcaster — shows the local      */
/*  camera publication (mirrored, like a selfie cam).                    */
/* ────────────────────────────────────────────────────────────────────── */
function BroadcasterSelfPreview({ broadcasterName, broadcasterAvatar }: { broadcasterName: string; broadcasterAvatar: string }) {
  // Don't pass `onlySubscribed: true` — we want local camera publications
  // (which are not "subscribed" — they are published by us locally).
  const tracks = useTracks([Track.Source.Camera]);
  const localVideoTrack = tracks.find(t => t.publication?.kind === 'video' && t.participant?.isLocal);
  const [imgError, setImgError] = useState(false);

  if (!localVideoTrack) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 via-white to-amber-50/40 stars-bg">
        <div className="relative">
          {!imgError && broadcasterAvatar ? (
            <img
              src={broadcasterAvatar}
              alt={broadcasterName}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-orange-200/60 shadow-2xl animate-breathe"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-white shadow-2xl animate-breathe">
              <span className="text-5xl sm:text-6xl font-bold text-white uppercase">{broadcasterName?.charAt(0)}</span>
              <div className="absolute inset-0 rounded-full border-2 border-orange-300/40 animate-sacred-glow" />
            </div>
          )}
          <div className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full border-2 border-orange-300/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <div className="mt-8 text-center px-6">
          <p className="text-orange-600 text-base font-bold tracking-wider animate-pulse uppercase">Starting your live stream...</p>
          <p className="text-gray-400 text-xs mt-2 font-medium italic">Camera is warming up. Make sure permissions are granted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {/* Mirror the broadcaster's preview so it feels like a selfie cam. */}
      <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover scale-x-[-1]" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Broadcaster Video                                                    */
/* ────────────────────────────────────────────────────────────────────── */
function BroadcasterVideo({ broadcasterName, broadcasterAvatar }: { broadcasterName: string; broadcasterAvatar: string }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const videoTrack = tracks.find(t => t.publication?.kind === 'video');
  const [imgError, setImgError] = useState(false);

  if (!videoTrack) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 via-white to-amber-50/40 stars-bg">
        <div className="relative">
          {!imgError && broadcasterAvatar ? (
            <img 
              src={broadcasterAvatar} 
              alt={broadcasterName} 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-orange-200/60 shadow-2xl animate-breathe" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-white shadow-2xl animate-breathe">
              <span className="text-5xl sm:text-6xl font-bold text-white uppercase">{broadcasterName?.charAt(0)}</span>
              <div className="absolute inset-0 rounded-full border-2 border-orange-300/40 animate-sacred-glow" />
            </div>
          )}
          {/* Pulse ring */}
          <div className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full border-2 border-orange-300/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <div className="mt-8 text-center px-6">
          <p className="text-orange-600 text-base font-bold tracking-wider animate-pulse uppercase">Connecting to Cosmic Energy...</p>
          <p className="text-gray-400 text-xs mt-2 font-medium italic">Establishing spiritual connection with {broadcasterName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Call Timer helper                                                    */
/* ────────────────────────────────────────────────────────────────────── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Rupee formatting — force whole-rupee display with Indian separators.  */
/*  Backend sometimes returns floats like 11.00, 251.50 which render as   */
/*  "251.5" without locale formatting and confuse users.                  */
/* ────────────────────────────────────────────────────────────────────── */
function formatRupees(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

const DEBUG_LIVE_CALL = process.env.NEXT_PUBLIC_DEBUG_LIVE_CALL === '1';
const dlog = (...args: any[]) => { if (DEBUG_LIVE_CALL) console.log('[LiveCall]', ...args); };

// Mirrors queue-join id derivation in useLiveSocket (userId > _id > id), lowercased + trimmed.
function getMyId(): string {
  const ud = getUserDetails();
  if (!ud) return '';
  const raw = ud.userId ?? ud._id ?? ud.id ?? '';
  return String(raw).trim().toLowerCase();
}

function sameId(a: any, b: string): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === b;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Broadcaster cache                                                   */
/*  StatusToggle stores the publisher token + URL in sessionStorage     */
/*  before redirecting here with `?role=broadcaster`. Reading it lets   */
/*  the broadcaster connect to LiveKit as a *publisher* without ever    */
/*  hitting `fetchSessionToken` (which mints viewer tokens).            */
/* ────────────────────────────────────────────────────────────────────── */
interface BroadcasterCache {
  token: string;
  livekitSocketURL: string;
  broadcasterId: string;
  broadcasterName: string;
  broadcasterProfilePicture: string;
  startedAt: number;
}

function readBroadcasterCache(sessionId: string): BroadcasterCache | null {
  if (typeof window === 'undefined' || !sessionId) return null;
  try {
    const raw = sessionStorage.getItem(`liveBroadcaster:${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BroadcasterCache;
    // Stale guard: a 6-hour-old cache means the page was reopened long after
    // the session ended. Better to fall back to viewer mode than connect with
    // a likely-expired token.
    if (Date.now() - (parsed.startedAt || 0) > 6 * 3600 * 1000) {
      sessionStorage.removeItem(`liveBroadcaster:${sessionId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                            */
/* ────────────────────────────────────────────────────────────────────── */
export default function LiveSessionViewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.sessionId as string;

  /* ── broadcaster detection (URL ?role + sessionStorage cache) ── */
  const isBroadcasterRole = searchParams?.get('role') === 'broadcaster';
  // Memoize the cache read so we don't re-parse JSON on every render. We
  // intentionally key on sessionId only — the cache itself doesn't change
  // mid-session; if it's gone we fall back to viewer mode.
  const broadcasterCache = useMemo(
    () => (isBroadcasterRole ? readBroadcasterCache(sessionId) : null),
    [isBroadcasterRole, sessionId]
  );
  const isBroadcaster = !!broadcasterCache;

  const {
    isConnected, joinSession, leaveSession, fetchSessionToken,
    getChats, sendChat, joinQueue, leaveQueue, getQueue,
    getActiveCall, addLike, getLikes, joinRoomParticipant, acceptInvite, endCall,
    endSessionBroadcaster, emitSendInvite,
    emitConnectedWithLivekit,
    onChatUpdate, onViewerUpdate, onViewerLeft, onSessionEnded, onSessionStarted,
    onCallStarted, onCallEnd, onQueueJoined, onLikeUpdate, onGiftReceived, onGiftRequest, onSendInvite, emitSendGift,
    fetchGifts: fetchGiftsSocket,
  } = useLiveSocket(isBroadcaster ? { sessionId } : undefined);

  /* ── core state ── */
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  /* ── livekit ── */
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);

  /* ── chat ── */
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── queue ── */
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [queueType, setQueueType] = useState<'private' | 'public' | null>(null);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [leavingQueue, setLeavingQueue] = useState(false);

  /* ── active call ── */
  const [activeCall, setActiveCall] = useState<any>(null);

  /* ── ui ── */
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimCount, setLikeAnimCount] = useState(0);
  const [giftNotification, setGiftNotification] = useState<{ type: 'received' | 'request'; giftName?: string; fromName?: string; price?: number } | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCallTypeModal, setShowCallTypeModal] = useState(false);

  /* ── dakshina ── */
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [showGiftConfirm, setShowGiftConfirm] = useState(false);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [giftToast, setGiftToast] = useState<{ gift: GiftItem; senderName: string } | null>(null);

  /* ── call invite & in-call state ── */
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCallData, setInviteCallData] = useState<any>(null);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [inviteCallType, setInviteCallType] = useState<'private' | 'public'>('public');
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callToken, setCallToken] = useState<string | null>(null);
  const [callWsUrl, setCallWsUrl] = useState<string | null>(null);
  const [callChannelId, setCallChannelId] = useState<string | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callBalance, setCallBalance] = useState(0);
  const [callSessionTime, setCallSessionTime] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const acceptRef = useRef<(t: 'private' | 'public') => void>(() => {});
  // Track whether MY queue entry was present in the last poll. Used to detect
  // the astrologer's invite via the queue-entry-disappears signal (backend
  // changes queue item status `waiting` → `notified`, and getQueue only
  // returns `waiting` entries, so my entry vanishes from the list).
  const myQueuePresenceRef = useRef<boolean>(false);
  // Timestamp (ms) when we entered `isInCall`. Used to ignore the backend's
  // delayed `call_end` with reason `RING_TIMEOUT` that can still fire if we
  // had to bypass `accept_invite` (e.g. channelId was never surfaced to us).
  const inCallSinceRef = useRef<number>(0);
  
  // Predictable channelId fallback: stores the user's current queue item ID
  // so we can reconstruct the broadcaster's channelId perfectly if the backend
  // fails to broadcast it.
  const myQueueItemIdRef = useRef<string | null>(null);

  // Host invite tracking — set when the broadcaster emits send_invite, cleared
  // on matching call_started / call_end. Mirrors Swift's invitedQueueUserId +
  // invitedUserName so we can show "<name> declined your call invitation."
  const invitedQueueUserIdRef = useRef<string | null>(null);
  const invitedUserNameRef = useRef<string | null>(null);

  // Viewer-side: mute remote audio while another viewer is in a *private*
  // call with the host. Mirrors Swift's unSubscribeAudioForSelf branch.
  const [mutedRemoteAudio, setMutedRemoteAudio] = useState(false);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Data fetchers                                                      */
  /* ════════════════════════════════════════════════════════════════════ */
  // Mirrors the audio/video-call flow which uses the socket `get_gifts` event
  // via useCallSocket. The REST endpoint used to be wired here but was failing
  // silently; the socket path is the source of truth the backend supports.
  const fetchGifts = useCallback(async () => {
    try {
      const list = await fetchGiftsSocket();
      const normalized: GiftItem[] = (Array.isArray(list) ? list : [])
        .map((g: any) => ({ ...g, price: Math.round(Number(g.price) || 0) }))
        .sort((a: GiftItem, b: GiftItem) => a.price - b.price);
      setGifts(normalized);
    } catch (err) { console.error('[Dakshina] Error fetching gifts:', err); }
  }, [fetchGiftsSocket]);

  const fetchBalance = useCallback(async () => {
    try {
      if (!getAuthToken()) return;
      const b = await simpleFetchWalletBalance();
      setWalletBalance(b);
    } catch (err) { console.error('Error fetching wallet:', err); }
  }, []);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Gift handling                                                      */
  /* ════════════════════════════════════════════════════════════════════ */
  // Mirrors the audio/video call flow in AudioCallView / VideoCallView.
  // Those views call `sendGift` from useCallSocket which is a single socket
  // `send_gift` emit — the backend handles wallet deduction + persistence +
  // broadcast in one handler. We intentionally do NOT hit the REST
  // `/calling/api/gift/send-gift` endpoint any more; it was failing and the
  // socket path is what the backend actually supports.
  const handleSendGift = async (gift: GiftItem) => {
    if (!gift) { return; }

    if (typeof gift._id === 'string' && gift._id.startsWith('preset_')) {
      console.warn('[Dakshina] preset_* id leaked into send. Refetching.');
      fetchGifts();
      throw new Error('Offerings not loaded yet.');
    }

    const price = Number(gift.price) || 0;
    if (walletBalance < price) {
      throw new Error('Insufficient wallet balance. Please add funds to your wallet.');
    }

    const userDetails = getUserDetails();
    if (!userDetails?.id) {
      throw new Error('Authentication required');
    }

    // Broadcaster id can arrive under several keys depending on whether the
    // session came from getSessions vs. joinSession.
    const receiverUserId: string | undefined =
      sessionData?.broadcasterId ||
      sessionData?.broadcasterUserId ||
      sessionData?.broadcaster?._id ||
      sessionData?.broadcaster?.id ||
      sessionData?.userId;

    if (!receiverUserId) {
      throw new Error('Astrologer details unavailable. Please refresh and try again.');
    }

    setIsSendingGift(true);
    try {
      await emitSendGift(sessionId, gift, receiverUserId);

      // Optimistic UI — balance/notification update immediately, then a
      // server-side balance refresh reconciles in the background.
      setWalletBalance(prev => Math.max(0, prev - price));
      setGiftNotification({ type: 'received', giftName: gift.name, price: gift.price, fromName: 'You' });
      setTimeout(() => setGiftNotification(null), 3000);
      fetchBalance();
      return true;
    } catch (error: any) {
      console.error('[Dakshina] send failed:', error);
      throw error instanceof Error ? error : new Error('Failed to send dakshina');
    } finally {
      setIsSendingGift(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Call invite detection & handlers                                    */
  /* ════════════════════════════════════════════════════════════════════ */
  const handleAcceptInvite = useCallback(async (callType: 'private' | 'public') => {
    if (isJoiningCall || isInCall) return;
    setIsJoiningCall(true);

    try {
      // 1. Request mic permission up front so the browser prompt fires while
      //    the spinner is visible and not after the LiveKit room tries to
      //    publish. If the user blocks it, bail cleanly.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediately — LiveKit will reacquire the mic via its own API
        // once the room connects. Holding this stream would contend with it.
        stream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        console.error('Mic permission denied:', permErr);
        alert('Microphone permission is required to join the call.');
        return;
      }

      // Try hard to recover a real channelId. Order of preference:
      //   1. activeCall we saw in the most recent poll (most reliable)
      //   2. inviteCallData populated from send_invite socket event / poll
      //   3. One more fresh get_active_call in case the previous poll was
      //      stale (this typically closes the gap between queue-disappearance
      //      detection and activeCall being written in Redis)
      const ac = Array.isArray(activeCall) ? activeCall : [activeCall].filter(Boolean);
      const myId = getMyId();
      const myCall = ac.find(c =>
        sameId(c?.userId, myId) ||
        sameId(c?.user?._id, myId) ||
        sameId(c?.callerId, myId) ||
        sameId(c?.receiverId, myId) ||
        sameId(c?.receiverUserId, myId)
      ) || ac[0];

      let channelId: string | null = myCall?.channelId || inviteCallData?.channelId || null;

      // We no longer poll getActiveCall here if channelId is missing. The backend
      // sometimes fails to save activeCall to Redis in time, leading to a useless
      // 2-second UX delay. We now rely on the 'onSendInvite' socket listener to
      // get the channelId instantly, or the broadcaster's own accept_invite
      // fallback when we connect to the LiveKit room.
      dlog('accept: channelId=', channelId, 'callType=', callType, 'myCall=', myCall);

      // Always emit accept_invite. If channelId is still empty, the backend
      // can't bind the call and `call_started` won't broadcast — the call
      // still works at the LiveKit layer (audio publishes both ways) but the
      // broadcaster's in-call UI relies on the broadcast and may stay stale.
      // Logged loudly so this is visible in server diagnostics.
      const ackAccept = await acceptInvite(sessionId, channelId || '');
      dlog('accept_invite ack:', ackAccept);
      if (!channelId) {
        dlog('No channelId locally. Emitting with empty id; broadcaster fallback will handle call_started when we join the room.');
      }

      const isPrivateAudio = callType === 'private';
      const rate = isPrivateAudio ? (sessionData?.privateAudioRpm || 5) : (sessionData?.publicAudioRpm || 11);

      const resp = await joinRoomParticipant(sessionId, rate, isPrivateAudio);
      dlog('joinRoomParticipant resp:', resp);

      if (resp?.error) {
        const rawMsg = resp?.data?.message || resp?.message || '';
        const upper = String(rawMsg).toUpperCase();
        const msg = upper.includes('TIMEOUT')
          ? 'The call server took too long to respond. Please check your connection and tap Accept again.'
          : upper.includes('LOW_BALANCE') || upper.includes('INSUFFICIENT')
            ? `Insufficient balance for ${isPrivateAudio ? 'private' : 'public'} call (₹${rate}/min). Please recharge your wallet.`
            : rawMsg || 'Failed to join call. Please try again.';
        alert(msg);
        return;
      }

      const newToken = resp?.data?.token || resp?.data?.livekitToken || resp?.data?.currentSessionToken || resp?.data?.joinToken;
      if (!newToken || typeof newToken !== 'string') {
        console.error('joinRoomParticipant returned no token:', resp);
        alert('Could not start the call — no audio token from server. Please try again.');
        return;
      }

      // Atomic commit: all call state flips together so the LiveKitRoom `key`
      // prop switches from `view-*` to `call-*` in a single render.
      setCallToken(newToken);
      setCallWsUrl(resp.data?.livekitSocketURL || livekitUrl);
      setCallBalance(resp.data?.balance || 0);
      setCallSessionTime(resp.data?.sessionTime || 0);
      setCallChannelId(channelId);
      inCallSinceRef.current = Date.now();
      setIsInCall(true);
      setInQueue(false);
      setIsWaitlisted(false);
      myQueuePresenceRef.current = false;
      setCallTimer(0);
      setShowInviteModal(false);
      setInviteCallData(null);
      setIsMuted(false);

      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accepting invite:', err);
      alert('Failed to join call.');
    } finally {
      setIsJoiningCall(false);
    }
  }, [isJoiningCall, isInCall, sessionData, sessionId, livekitUrl, joinRoomParticipant, acceptInvite, getActiveCall, activeCall, inviteCallData]);

  useEffect(() => {
    if (isInCall || isJoiningCall || showInviteModal) return;
    if (!activeCall) return;
    const myId = getMyId();
    const ud = getUserDetails();
    const myName = String(ud?.name || ud?.displayName || '').trim().toLowerCase();

    const ac = Array.isArray(activeCall) ? activeCall : [activeCall].filter(Boolean);

    // Strict: id match across every field name the backend has used.
    let myEntry = ac.find(c => c && (
      sameId(c.userId, myId) ||
      sameId(c.user?._id, myId) ||
      sameId(c.user?.id, myId) ||
      sameId(c.callerId, myId) ||
      sameId(c.receiverId, myId) ||
      sameId(c.receiverUserId, myId) ||
      sameId(c.participantId, myId) ||
      sameId(c.invitedUserId, myId)
    ));

    // Widened: I'm waiting + activeCall exists + name matches OR no name set
    if (!myEntry && (isWaitlisted || inQueue)) {
      myEntry = ac.find(c => {
        if (!c) return false;
        const n = String(c.userName || '').trim().toLowerCase();
        return !n || (!!myName && n === myName);
      });
    }

    // Last resort: we're in this session's queue AND the server reports an
    // activeCall exists with a channelId — whoever it is must be us, because
    // the backend only opens activeCall for one waiting user at a time and
    // the `call_end` with RING_TIMEOUT we see in logs confirms this ring is
    // targeted at the queued user.
    if (!myEntry && (isWaitlisted || inQueue)) {
      myEntry = ac.find(c => !!c?.channelId) || ac[0];
    }

    if (!myEntry) {
      console.log('[LiveCall] activeCall present but did not match this user', { ac, myId, myName });
      return;
    }
    console.log('[LiveCall] activeCall matched this user -> showing invite modal', myEntry);

    // INSTEAD of handleAcceptInvite, show the modal
    const isPrivate = typeof myEntry.isPrivate === 'string'
      ? myEntry.isPrivate === 'true'
      : !!myEntry.isPrivate;
    const cType: 'private' | 'public' = (isPrivate || queueType === 'private') ? 'private' : 'public';
    
    dlog('Invitation detected via polling/activeCall match:', myEntry);
    setInviteCallData(myEntry);
    setInviteCallType(cType);
    setShowInviteModal(true);
  }, [activeCall, isInCall, isJoiningCall, isWaitlisted, inQueue, queueType, showInviteModal]);

  const handleDeclineInvite = async () => {
    setShowInviteModal(false);
    setInviteCallData(null);
    myQueuePresenceRef.current = false;
    dlog('User declined invite. Leaving queue...');
    await handleLeaveQueue();
    setIsWaitlisted(false);
  };

  const handleEndCall = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (callChannelId) {
      await endCall(sessionId, callChannelId);
    }
    setIsInCall(false);
    inCallSinceRef.current = 0;
    setCallToken(null);
    setCallWsUrl(null);
    setCallChannelId(null);
    setCallTimer(0);
    inCallWithRef.current = null;
    // Don't reset mute on the broadcaster — their mute applies to the live
    // stream itself, not just the call. Viewer-side mute is in-call only.
    if (!isBroadcaster) setIsMuted(false);
    setInQueue(false);
    setQueueType(null);

    // Refresh queue & active call
    const q = await getQueue(sessionId);
    setQueue(Array.isArray(q) ? q : []);
    const ac = await getActiveCall(sessionId);
    setActiveCall(ac);
    fetchBalance();
  };

  // cleanup timer on unmount
  useEffect(() => {
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, []);

  // Keep acceptRef pointing at the latest handleAcceptInvite so socket listeners
  // (registered with narrower deps) always call the current closure.
  useEffect(() => { acceptRef.current = handleAcceptInvite; }, [handleAcceptInvite]);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Queue polling — detects astrologer's invite                         */
  /*                                                                      */
  /*  The backend broadcasts `send_invite` over the socket room, but in   */
  /*  practice the event sometimes never reaches this client (only FCM    */
  /*  push is reliable on Android). We use two backend-free fallbacks:    */
  /*                                                                      */
  /*    (a) Poll `get_active_call` and match my userId to `activeCall`.   */
  /*    (b) Poll `getQueue` and watch for my queue entry to disappear —   */
  /*        when the astrologer picks me, backend updates my queue entry  */
  /*        to `notified`, and `getQueue` only returns `waiting` entries, */
  /*        so my entry vanishes. That disappearance IS the invite.       */
  /*                                                                      */
  /*  (b) is the most reliable trigger, since updateQueue is a MongoDB    */
  /*  write that happens unconditionally on astrologer pick.              */
  /* ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (isInCall || isJoiningCall) return;
    if (!inQueue && !isWaitlisted) return;
    if (!isConnected || !sessionId) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const [ac, q] = await Promise.all([
          getActiveCall(sessionId),
          getQueue(sessionId),
        ]);
        if (cancelled) return;
        dlog('poll tick: activeCall=', ac, 'queueLen=', Array.isArray(q) ? q.length : null);
        setActiveCall(ac); // null when no call; object only when channelId present
        if (Array.isArray(q)) setQueue(q);

        // === Queue-disappearance invite detection (backend-free fallback) ===
        if (Array.isArray(q) && !isInCall && !isJoiningCall) {
          const myId = getMyId();
          const mineNow = q.find((it: QueueItem) => sameId(it.userId, myId));
          const wasPresent = myQueuePresenceRef.current;
          const isPresentNow = !!mineNow;

          if (wasPresent && !isPresentNow) {
            // My entry disappeared → astrologer picked me. Trigger the invite
            // UI even if `activeCall` is still empty; handleAcceptInvite has a
            // fallback that joins via joinRoomParticipant without channelId.
            console.log('[LiveCall] Invite detected via queue-disappearance. activeCall=', ac);
            setShowInviteModal(prevShown => {
              if (prevShown) return prevShown; // already open from socket path
              const detectedIsPrivate = typeof ac?.isPrivate === 'string'
                ? ac.isPrivate === 'true'
                : !!ac?.isPrivate;
              const cType: 'private' | 'public' =
                (detectedIsPrivate || queueType === 'private') ? 'private' : 'public';
              
              // Construct the highly-predictable channelId since we know the broadcaster
              // used our queue item's ID to build it.
              const predictedChannelId = myQueueItemIdRef.current 
                ? `live-call-${sessionId}-${myQueueItemIdRef.current}`
                : null;
                
              setInviteCallData({
                channelId: ac?.channelId || predictedChannelId,
                sessionId,
                userId: myId,
                isPrivate: detectedIsPrivate || queueType === 'private',
                _source: 'queue-disappearance',
              });
              setInviteCallType(cType);
              return true;
            });
          }
          myQueuePresenceRef.current = isPresentNow;
          if (isPresentNow) myQueueItemIdRef.current = mineNow._id;
        }
      } catch (err) {
        console.error('[LiveSession] Queue poll failed:', err);
      }
    };

    tick();
    // Tight interval: keeps invite detection latency under 1s. The payloads
    // are small (a few hundred bytes) so this is cheap on the server too.
    const id = setInterval(tick, 800);
    return () => { cancelled = true; clearInterval(id); };
  }, [isConnected, sessionId, inQueue, isWaitlisted, isInCall, isJoiningCall, queueType, getActiveCall, getQueue]);

  // Expose a manual retry hook for diagnostics: window.__joinLiveCall()
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__joinLiveCall = (type: 'private' | 'public' = 'public') => {
      console.log('[LiveCall] manual __joinLiveCall invoked with', type);
      handleAcceptInvite(type);
    };
    // Also expose a simulator for the astrologer-accepts step so we can test
    // the whole "invite modal -> Accept -> audio publish" path without needing
    // a working astrologer-side send_invite. It fakes an activeCall that
    // matches this viewer, which trips the existing match logic.
    (window as any).__simulateInvite = (isPrivate: boolean = false) => {
      const ud = getUserDetails();
      const fake = {
        channelId: `sim-${Date.now()}`,
        userId: ud?.id || ud?._id || ud?.userId,
        userName: ud?.name || ud?.displayName || 'Me',
        isPrivate,
        _simulated: true,
      };
      console.log('[LiveCall] Simulating invite:', fake);
      setActiveCall(fake);
    };
    // Direct audio-publish test: bypasses send_invite / accept_invite entirely
    // and calls joinRoomParticipant (which the backend accepts as long as
    // balance is sufficient). Confirms that the LiveKit remount + mic publish
    // side of the feature works, isolating backend invite flow as the only
    // remaining dependency.
    (window as any).__testAudioJoin = async (isPrivate: boolean = false) => {
      console.log('[LiveCall] __testAudioJoin: requesting mic + token...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        console.error('[LiveCall] __testAudioJoin: mic permission denied', err);
        alert('Microphone permission denied.');
        return;
      }
      const rate = isPrivate ? (sessionData?.privateAudioRpm || 5) : (sessionData?.publicAudioRpm || 11);
      const resp = await joinRoomParticipant(sessionId, rate, isPrivate);
      console.log('[LiveCall] __testAudioJoin: joinRoomParticipant resp:', resp);
      if (resp?.error) {
        alert('joinRoomParticipant error: ' + (resp?.data?.message || 'unknown'));
        return;
      }
      const newToken = resp?.data?.token || resp?.data?.livekitToken;
      if (!newToken) { alert('No token in response'); return; }
      setCallToken(newToken);
      setCallWsUrl(resp.data?.livekitSocketURL || livekitUrl);
      setCallChannelId(`test-${Date.now()}`);
      setCallBalance(resp.data?.balance || 0);
      setCallSessionTime(resp.data?.sessionTime || 0);
      setInviteCallType(isPrivate ? 'private' : 'public');
      setIsMuted(false);
      setIsInCall(true);
      setCallTimer(0);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
      console.log('[LiveCall] __testAudioJoin: isInCall=true, LiveKitRoom should remount and publish mic');
    };
    return () => {
      delete (window as any).__joinLiveCall;
      delete (window as any).__simulateInvite;
      delete (window as any).__testAudioJoin;
    };
  }, [handleAcceptInvite, joinRoomParticipant, sessionData, sessionId, livekitUrl]);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Session init                                                       */
  /* ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isConnected || !sessionId) return;

    const init = async () => {
      setLoading(true);
      try {
        if (isBroadcaster && broadcasterCache) {
          /* ── Broadcaster path ──
             We're already inside the session room (joined by the backend in
             `startSession`). Reuse the publisher token from sessionStorage —
             do NOT call `fetchSessionToken` here, which mints a viewer
             token without publish permissions. */
          setSessionData({
            sessionId,
            broadcasterId: broadcasterCache.broadcasterId,
            broadcasterName: broadcasterCache.broadcasterName,
            broadcasterProfilePicture: broadcasterCache.broadcasterProfilePicture,
            status: 'live',
          });
          setLivekitToken(broadcasterCache.token);
          setLivekitUrl(broadcasterCache.livekitSocketURL);
        } else {
          /* ── Viewer path ── */
          const resp = await joinSession(sessionId);
          if (resp?.error) {
            // joinSession now returns `{error:true, code:'SESSION_ENDED'}` for
            // the ended-session shape and `{error:true, code:'JOIN_FAILED'}`
            // otherwise. Fall back to the legacy `status==='ended'` check for
            // any direct error responses.
            const ended = resp.code === 'SESSION_ENDED' || resp.status === 'ended' || resp.raw?.status === 'ended';
            setError(ended ? 'This session has ended.' : 'Session not found or has ended.');
            setLoading(false);
            return;
          }
          if (resp?.data) {
            setSessionData(resp.data);
            if (resp.data.maxViewers) setViewers(Number(resp.data.maxViewers) || 0);
          }

          const tokenResp = await fetchSessionToken(sessionId);
          if (tokenResp && !tokenResp.error && tokenResp.data) {
            setLivekitToken(tokenResp.data.currentSessionToken);
            setLivekitUrl(tokenResp.data.livekitSocketURL);
          }
        }

        const [chatData, queueData, activeCallData, likesData] = await Promise.all([
          getChats(sessionId), getQueue(sessionId), getActiveCall(sessionId), getLikes(sessionId),
        ]);

        if (Array.isArray(chatData)) setChats(chatData);
        if (Array.isArray(queueData)) {
          setQueue(queueData);
          const ud = getUserDetails();
          const uid = String(ud?.id || ud?._id || ud?.userId);
          const mine = queueData.find((q: QueueItem) => String(q.userId) === uid && q.status !== 'completed');
          if (mine) { setInQueue(true); setQueueType(mine.isPrivate ? 'private' : 'public'); }
        }
        if (activeCallData) setActiveCall(activeCallData);
        if (likesData?.data) {
          setLikes(likesData.data.totalLikes || 0);
          setIsLiked(likesData.data.isLikedByUser || false);
        }
        fetchGifts();
        fetchBalance();
      } catch (err) {
        console.error('[LiveSession] Init error:', err);
        setError('Failed to join session.');
      } finally { setLoading(false); }
    };

    init();
    return () => {
      // Viewers explicitly leave the session so backend updates the viewer
      // count immediately. Broadcasters don't call leaveSession — they own
      // the session and end it via the explicit "End Session" control or
      // by socket disconnect (backend's 30s timer fires `endSession`).
      if (!isBroadcaster) {
        leaveSession(sessionId);
      }
      // Refresh header wallet now that the live session is ending.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-balance-refresh'));
      }
    };
  }, [isConnected, sessionId, isBroadcaster]);

  /* ── real-time listeners ── */
  useEffect(() => {
    if (!isConnected) return;
    const unsubs = [
      onSessionStarted((d: any) => {
        // Confirmation that the backend has fully provisioned the session.
        // Useful for the broadcaster to know they're truly live, and for
        // viewers who hit the page during the brief "starting" window.
        console.log('[LiveSession] sessionStarted:', d);
        setSessionData((prev: any) => ({ ...(prev || {}), status: 'live' }));
      }),
      onChatUpdate((msg: ChatMessage) => setChats(prev => [...prev, msg])),
      onViewerUpdate((d: any) => {
        // Backends vary in the field name used for live viewer counts. Accept
        // every shape we've seen so the counter never stalls at 0.
        const next =
          d?.viewers ??
          d?.viewersCount ??
          d?.viewerCount ??
          d?.count ??
          d?.total ??
          d?.online ??
          d?.participants ??
          d?.data?.viewers ??
          d?.data?.count ??
          (Array.isArray(d?.list) ? d.list.length : undefined) ??
          (Array.isArray(d) ? d.length : undefined);
        if (next !== undefined && next !== null && !Number.isNaN(Number(next))) {
          setViewers(Math.max(0, Number(next)));
        }
      }),
      onViewerLeft(() => {}),
      onSessionEnded(() => setSessionEnded(true)),
      onCallStarted((d: any) => {
        const callData = d.sessionCall || d;
        dlog('onCallStarted:', callData);
        setActiveCall(callData);
        const myId = getMyId();

        const isPrivate = typeof callData?.isPrivate === 'string'
          ? callData.isPrivate === 'true'
          : !!callData?.isPrivate;

        // Broadcaster path: backend confirmed the user accepted. Flip into
        // in-call mode so the top-bar timer + End-Call button render. The
        // user-side branch below stays gated on the modal because viewers
        // need to opt in (mic permission, balance check) before joining.
        const isMineAsBroadcaster = !!callData && isBroadcaster && (
          sameId(callData.broadcasterId, myId) ||
          sameId(callData.partnerId, myId) ||
          callData.sessionId === sessionId
        );
        if (isMineAsBroadcaster) {
          // The user we just invited has accepted. Clear the queueId ref so a
          // later `call_end` is read as a normal hang-up (not a decline). Keep
          // invitedUserNameRef populated so the in-call banner can display
          // "with <name>" even when call_started's payload omits userName.
          invitedQueueUserIdRef.current = null;
          if (callData?.userName) invitedUserNameRef.current = callData.userName;
          setCallChannelId(callData.channelId || null);
          setInviteCallType(isPrivate ? 'private' : 'public');
          inCallSinceRef.current = Date.now();
          setIsInCall(true);
          setCallTimer(0);
          if (callTimerRef.current) clearInterval(callTimerRef.current);
          callTimerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
          return;
        }

        const isForMe = !!callData && (
          sameId(callData.userId, myId) ||
          sameId(callData.callerId, myId) ||
          sameId(callData.user?._id, myId) ||
          sameId(callData.receiverId, myId) ||
          sameId(callData.receiverUserId, myId)
        );

        if (isForMe) {
          setCallChannelId(callData.channelId || null);

          // INSTEAD of auto-accepting, show modal
          setInviteCallData(callData);
          setInviteCallType(isPrivate ? 'private' : 'public');
          setShowInviteModal(true);
          return;
        }

        // Match Swift: someone *else* is in a call with the host.
        //   - private → mute remote audio so other viewers can't eavesdrop.
        //   - public  → keep audio (anyone watching can hear the conversation).
        if (!isBroadcaster) {
          if (isPrivate) {
            setMutedRemoteAudio(true);
          } else {
            setMutedRemoteAudio(false);
          }
        }
      }),
      onCallEnd((d: any) => {
        dlog('onCallEnd payload:', d);
        const eventSessionId = d?.data?.sessionId || d?.session?.sessionId || d?.sessionId;
        // Ignore call_end events meant for a different session. The socket
        // can remain subscribed to stale session rooms after navigation and
        // the backend broadcasts call_end to whoever is in that room.
        if (eventSessionId && eventSessionId !== sessionId) {
          console.warn(`[LiveCall] Ignoring call_end for different session. event=${eventSessionId} current=${sessionId}`);
          return;
        }
        const reason = d?.reason || d?.data?.reason;

        // Grace: if we had to bypass accept_invite (no channelId surfaced), the
        // server's ring timer will eventually fire and emit RING_TIMEOUT even
        // though we are talking to the astrologer in LiveKit right now. Ignore
        // it for the first 75s of the call (MAX_CALL_RING_DURATION is 60s).
        if (isInCall && reason === 'RING_TIMEOUT') {
          const elapsedMs = Date.now() - (inCallSinceRef.current || 0);
          if (inCallSinceRef.current && elapsedMs < 75000) {
            console.warn(`[LiveCall] Ignoring stale RING_TIMEOUT while in-call (joined ${Math.round(elapsedMs / 1000)}s ago).`);
            return;
          }
        }

        if (reason === 'RING_TIMEOUT' && (inQueue || isWaitlisted) && !isInCall) {
          // Astrologer invited us but we missed the ring — tell the user clearly.
          console.warn('[LiveCall] Missed invite (RING_TIMEOUT). Rejoining queue state.');
          alert('You missed the astrologer\'s call invitation. Please rejoin the queue to try again.');
        }
        setActiveCall(null);
        // Restore remote audio for any viewer who had it muted because someone
        // else was in a private call with the host (matches Swift's
        // resubscribeAudioForSelf path on the rejection branch).
        setMutedRemoteAudio(false);

        // Host-side decline branch (Swift: onCallRejected → invitedQueueUserId).
        // If we (host) are still idle and were waiting on a specific invitee
        // to accept, this `call_end` means they declined. Show a targeted toast
        // and remove that queue entry.
        if (isBroadcaster && !isInCall && invitedQueueUserIdRef.current) {
          const declinedQueueId = invitedQueueUserIdRef.current;
          const declinedName = invitedUserNameRef.current || 'User';
          invitedQueueUserIdRef.current = null;
          invitedUserNameRef.current = null;
          setQueue(prev => prev.filter(q => q._id !== declinedQueueId));
          setGiftNotification({
            type: 'request',
            giftName: `${declinedName} declined your call invitation.`,
            fromName: declinedName,
          });
          setTimeout(() => setGiftNotification(null), 3500);
        } else if (isBroadcaster && !isInCall) {
          // Generic "Call Ended" (Swift else-branch toast).
          setGiftNotification({ type: 'request', giftName: 'Call Ended' });
          setTimeout(() => setGiftNotification(null), 2500);
        }

        // If we were in an active call from our perspective, terminate.
        if (isInCall) {
          if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
          setIsInCall(false);
          inCallSinceRef.current = 0;
          invitedUserNameRef.current = null;
          setCallToken(null);
          setCallWsUrl(null);
          setCallChannelId(null);
          setCallTimer(0);
          setIsMuted(false);
          setInQueue(false);
          setQueueType(null);
          fetchBalance();
        }
        getQueue(sessionId).then(q => setQueue(Array.isArray(q) ? q : []));
      }),
      onSendInvite((d: any) => {
        dlog('onSendInvite received:', d);
        if (isInCall || isJoiningCall) return;
        
        const myId = getMyId();
        const inviteData = d?.sessionCall || d;
        if (sameId(inviteData?.userId, myId) || sameId(inviteData?.invitedUserId, myId)) {
          const detectedIsPrivate = typeof inviteData?.isPrivate === 'string'
            ? inviteData.isPrivate === 'true'
            : !!inviteData?.isPrivate;
          const cType: 'private' | 'public' = (detectedIsPrivate || queueType === 'private') ? 'private' : 'public';
          
          setInviteCallData((prev: any) => ({
            ...prev,
            channelId: inviteData?.channelId || prev?.channelId || null,
            sessionId,
            userId: myId,
            isPrivate: detectedIsPrivate || queueType === 'private',
            _source: 'socket-send_invite',
          }));
          setInviteCallType(cType);
          setShowInviteModal(true);
        }
      }),
      onQueueJoined((d: any) => {
        // Match Swift: append only entries we don't already have, toast the
        // first new joiner, do not wipe the existing queue.
        const incoming: any[] = Array.isArray(d?.data) ? d.data : [];
        if (incoming.length === 0) return;
        setQueue(prev => {
          const existingIds = new Set(prev.map(q => q._id));
          const newOnes = incoming.filter((u: any) => u?._id && !existingIds.has(u._id));
          if (newOnes.length > 0) {
            const firstName = newOnes[0]?.userName || 'User';
            setGiftNotification({
              type: 'request',
              giftName: `${firstName} joined the call queue`,
              fromName: firstName,
            });
            setTimeout(() => setGiftNotification(null), 2500);
          }
          return [...prev, ...newOnes];
        });
      }),
      onLikeUpdate((d: any) => {
        if (d.data?.totalLikes !== undefined) {
          setLikes(prev => {
            // Fire the floating-heart burst whenever the count goes up, so the
            // viewer sees community engagement (Instagram/YouTube Live style).
            if (d.data.totalLikes > prev) setLikeAnimCount(c => c + 1);
            return d.data.totalLikes;
          });
        }
      }),
      onGiftReceived((d: any) => {
        setGiftNotification({ type: 'received', giftName: d.giftName, fromName: d.fromName, price: d.price });
        setTimeout(() => setGiftNotification(null), 3500);
      }),
      // Mirrors Swift's onGiftRequest hookup. Currently a log-only placeholder
      // (Swift does the same) — kept to keep the listener surface in parity so
      // future host-side gift-confirmation UI can hang off the same event.
      onGiftRequest((d: any) => { dlog('gift_request:', d); }),
    ];
    return () => unsubs.forEach(u => { if (typeof u === 'function') u(); });
  }, [isConnected, sessionId, isInCall, queueType, isBroadcaster]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats]);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Chat / Like / Queue handlers                                       */
  /* ════════════════════════════════════════════════════════════════════ */
  const handleSendChat = async () => {
    if (!chatInput.trim() || sendingChat) return;
    if (!isAuthenticated()) { alert('Please login to chat.'); return; }
    setSendingChat(true);
    const msg = chatInput.trim();
    setChatInput('');
    const result = await sendChat(sessionId, msg);
    if (result) setChats(prev => [...prev, result]);
    setSendingChat(false);
  };

  // A user can like a session only ONCE. We still play the heart-burst animation
  // on every tap for visual feedback, but the `add_like` socket emit only fires
  // the first time — subsequent taps are no-ops. `isLiked` is hydrated from the
  // server (getLikes → isLikedByUser) on mount, so this holds across reloads.
  const handleLike = useCallback(async () => {
    if (!isAuthenticated()) return;
    if (isLiked) return;

    // Optimistic UI: bump the visible count + fire heart-burst the instant the
    // user taps. The server response (or the broadcast `like_update`) will
    // overwrite `likes` with the authoritative number a moment later.
    setLikeAnimCount(prev => prev + 1);
    setIsLiked(true);
    setLikes(prev => prev + 1);

    const resp = await addLike(sessionId);
    if (resp?.error) {
      const msg = String(resp?.message || resp?.data?.message || '').toLowerCase();
      // Only roll back if the server actually rejected the like. "Already liked"
      // is treated as a no-op success since the user has in fact liked before.
      if (!msg.includes('already')) {
        setIsLiked(false);
        setLikes(prev => Math.max(0, prev - 1));
      }
      return;
    }
    if (resp?.data?.totalLikes !== undefined) {
      setLikes(resp.data.totalLikes);
    }
    if (resp?.data?.isLikedByUser !== undefined) {
      setIsLiked(!!resp.data.isLikedByUser);
    }
  }, [sessionId, addLike, isLiked]);

  const handleJoinQueue = async (isPrivate: boolean) => {
    if (!isAuthenticated()) { alert('Please login to request a call.'); return; }

    const rpm = isPrivate ? Number(sessionData?.privateAudioRpm || 0) : Number(sessionData?.publicAudioRpm || 0);
    // Need at least one minute's worth of credit to even start the ring, since
    // the backend will reject with LOW_BALANCE otherwise.
    if (rpm > 0 && walletBalance < rpm) {
      alert(`Insufficient balance for ${isPrivate ? 'private' : 'public'} call (₹${rpm}/min needed). Please recharge your wallet.`);
      return;
    }

    setJoiningQueue(true);
    setShowCallTypeModal(false);
    try {
      const resp = await joinQueue(sessionId, isPrivate);
      dlog('joinQueue resp:', resp);

      if (resp?.error) {
        const serverMsg = resp?.message || resp?.data?.message;
        const upper = String(serverMsg || '').toUpperCase();
        if (upper.includes('LOW_BALANCE') || upper.includes('INSUFFICIENT')) {
          alert('Insufficient balance. Please recharge your wallet.');
        } else if (upper.includes('ALREADY')) {
          // Already in queue — treat as success and sync local state.
          setInQueue(true);
          setIsWaitlisted(true);
          setQueueType(isPrivate ? 'private' : 'public');
          myQueuePresenceRef.current = true;
        } else {
          alert(serverMsg || 'Failed to join queue. Please try again.');
        }
        return;
      }

      setInQueue(true);
      setIsWaitlisted(true);
      setQueueType(isPrivate ? 'private' : 'public');
      // Mark presence so the first poll's `wasPresent && !isPresentNow` can
      // fire even if the astrologer picks us before our first tick runs.
      myQueuePresenceRef.current = true;
      if (resp?.data) setQueue(Array.isArray(resp.data) ? resp.data : []);
    } catch (err: any) {
      console.error('joinQueue failed:', err);
      alert('Failed to request call. Please check your connection and try again.');
    } finally {
      setJoiningQueue(false);
    }
  };

  const handleLeaveQueue = async () => {
    setLeavingQueue(true);
    await leaveQueue(sessionId);
    setInQueue(false);
    setIsWaitlisted(false);
    setQueueType(null);
    myQueuePresenceRef.current = false;
    const q = await getQueue(sessionId);
    setQueue(Array.isArray(q) ? q : []);
    setLeavingQueue(false);
  };

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Broadcaster handlers                                                */
  /* ════════════════════════════════════════════════════════════════════ */
  const [endingSession, setEndingSession] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [invitingUserIds, setInvitingUserIds] = useState<Set<string>>(new Set());
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  // Pending invites the broadcaster has sent, keyed by invitee userId. Used to
  // match LiveKit participantConnected events to a known call (channelId +
  // isPrivate) when the backend's call_started socket broadcast doesn't fire.
  const pendingInvitesRef = useRef<Map<string, { channelId: string; isPrivate: boolean; userName: string }>>(new Map());
  // Identity of the viewer currently in-call with this broadcaster, so we can
  // detect their disconnect and tear down the broadcaster's in-call UI.
  const inCallWithRef = useRef<string | null>(null);

  // Broadcaster: invite a queued user. Generates a fresh `channelId` on the
  // frontend (the same id is later persisted by the backend and surfaced
  // through `accept_invite` / `call_started`) and emits `send_invite`.
  const handleInviteUser = useCallback(async (queueItem: QueueItem) => {
    if (!isBroadcaster) return;
    if (invitingUserIds.has(queueItem.userId)) return;
    setInvitingUserIds(prev => new Set(prev).add(queueItem.userId));
    try {
      // Use the queueItem's unique ID so the channelId becomes fully predictable
      // for the viewer, in case the backend's socket broadcast drops.
      const channelId = `live-call-${sessionId}-${queueItem._id}`;
      const resp = await emitSendInvite({
        sessionId,
        channelId,
        queueId: queueItem._id,
        userId: queueItem.userId,
        isPrivate: !!queueItem.isPrivate,
      });
      if (resp?.error) {
        alert(resp.message || 'Failed to invite user. Please try again.');
        return;
      }
      // Record the invite so when this user appears in the LiveKit room (or
      // backend broadcasts call_started) we can flip into in-call UI with
      // the correct call type and channelId without needing the broadcast
      // to carry it.
      pendingInvitesRef.current.set(String(queueItem.userId), {
        channelId,
        isPrivate: !!queueItem.isPrivate,
        userName: queueItem.userName || '',
      });
      // Track the *queueId* + name so onCallEnd can distinguish an
      // outright decline from a generic "Call Ended" (Swift parity).
      invitedQueueUserIdRef.current = queueItem._id;
      invitedUserNameRef.current = queueItem.userName || 'User';
      console.log('[Broadcaster] Invite sent for', queueItem.userName, 'channelId=', channelId);
    } catch (err: any) {
      console.error('[Broadcaster] send_invite failed:', err);
      alert(err?.message || 'Failed to invite user.');
    } finally {
      setInvitingUserIds(prev => {
        const next = new Set(prev);
        next.delete(queueItem.userId);
        return next;
      });
    }
  }, [isBroadcaster, sessionId, emitSendInvite, invitingUserIds]);

  // Broadcaster: a viewer joined the LiveKit room. If we have a pending
  // invite for them, the backend's `accept_invite` likely succeeded — but
  // `call_started` may not have fired (when activeCall isn't persisted with
  // a channelId, getSessionCall returns null and the broadcast is skipped).
  // Use this as a fallback trigger so the broadcaster's in-call UI renders.
  const handleBroadcasterParticipantConnected = useCallback((identity: string) => {
    if (!isBroadcaster) return;
    if (isInCall) return; // already in a call
    const meta = pendingInvitesRef.current.get(String(identity));
    if (!meta) {
      // Unknown participant — ignore. They may be a passive viewer that
      // joined via `joinSession` (different LiveKit grants don't publish).
      return;
    }
    console.log('[Broadcaster] Pending invitee joined room — entering in-call state for', identity);

    // ── Broadcaster-side accept_invite guarantee ──
    // The user's own `accept_invite` may have fired with an empty channelId
    // (Redis hadn't surfaced the activeCall in time), which means the backend
    // never transitioned the call state and `call_started` never broadcast.
    // We know the real channelId (we generated it in handleInviteUser), so
    // emit accept_invite from the broadcaster's socket. The backend handler
    // doesn't validate *who* emits it — it just looks up the call by
    // channelId, cancels the ring timer, and broadcasts `call_started`.
    if (meta.channelId) {
      console.log('[Broadcaster] Emitting accept_invite on behalf of joined user, channelId=', meta.channelId);
      acceptInvite(sessionId, meta.channelId)
        .then(ack => console.log('[Broadcaster] accept_invite ack:', ack))
        .catch(err => console.warn('[Broadcaster] accept_invite failed (non-fatal):', err));
    }

    inCallWithRef.current = String(identity);
    setCallChannelId(meta.channelId);
    setInviteCallType(meta.isPrivate ? 'private' : 'public');
    inCallSinceRef.current = Date.now();
    setIsInCall(true);
    setCallTimer(0);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
    pendingInvitesRef.current.delete(String(identity));
  }, [isBroadcaster, isInCall, acceptInvite, sessionId]);

  const handleBroadcasterParticipantDisconnected = useCallback((identity: string) => {
    if (!isBroadcaster) return;
    if (inCallWithRef.current && String(inCallWithRef.current) === String(identity)) {
      console.log('[Broadcaster] In-call viewer disconnected — tearing down in-call UI');
      if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
      setIsInCall(false);
      inCallSinceRef.current = 0;
      invitedUserNameRef.current = null;
      setCallChannelId(null);
      setCallTimer(0);
      inCallWithRef.current = null;
    }
  }, [isBroadcaster]);

  // Broadcaster: end the session. Clears the cache + redirects back.
  const handleEndBroadcasterSession = useCallback(async () => {
    if (!isBroadcaster || endingSession) return;
    setEndingSession(true);
    try {
      // If the broadcaster is in an active call with a viewer, end that
      // first so the participant gets a clean `call_end` before the room
      // tears down. Avoids an awkward "RING_TIMEOUT" race on the viewer.
      if (callChannelId) {
        try { await endCall(sessionId, callChannelId); } catch {}
      }
      await endSessionBroadcaster(sessionId);
    } catch (err) {
      console.error('[Broadcaster] endSession failed:', err);
    } finally {
      // Always clear the cache + navigate, even if the socket emit failed —
      // the backend's 30s disconnect timer will end the session anyway.
      try { sessionStorage.removeItem(`liveBroadcaster:${sessionId}`); } catch {}
      router.push('/dashboard/partner');
    }
  }, [isBroadcaster, endingSession, callChannelId, sessionId, endCall, endSessionBroadcaster, router]);

  /* ════════════════════════════════════════════════════════════════════ */
  /*  LOADING                                                            */
  /* ════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-5 text-orange-400 text-sm font-semibold animate-pulse">Joining live session...</p>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  ERROR / ENDED                                                      */
  /* ════════════════════════════════════════════════════════════════════ */
  if (error || sessionEnded) {
    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6 border border-orange-200">
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {sessionEnded ? 'Session Has Ended' : 'Session Not Available'}
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {sessionEnded ? 'Thank you for watching. May your path be illuminated.' : error}
          </p>
          <div className="flex gap-3 justify-center">
            {/* Plain anchors so the destination page does a full reload
                (refreshes header wallet after the live session ends). */}
            <a href="/live-sessions" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all">
              Browse Live
            </a>
            <a href="/call-with-astrologer" className="bg-white border border-orange-200 text-orange-600 px-6 py-3 rounded-full font-bold text-sm hover:bg-orange-50 transition-all">
              Astrologers
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════ */
  /*  MAIN RENDER                                                        */
  /* ════════════════════════════════════════════════════════════════════ */
  const broadcasterName = sessionData?.broadcasterName || 'Astrologer';
  const broadcasterAvatar = sessionData?.broadcasterProfilePicture || '';
  const privateRpm = sessionData?.privateAudioRpm;
  const publicRpm = sessionData?.publicAudioRpm;
  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* ═══════ DESKTOP BACKDROP (md+) ═══════ */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-[#2a0f0a] via-black to-[#1a0e0a]" />
      <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.14),transparent_55%)]" />
      <div className="hidden md:block absolute inset-0 backdrop-blur-3xl bg-black/30" />

      {/* ═══════ CENTERED MOBILE-ASPECT STAGE ═══════ */}
      <div className="relative h-full w-full md:w-auto md:mx-auto md:aspect-[10/16] md:max-w-full md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-white/10 overflow-hidden bg-black flex flex-col">

      {/* ═══════ FULL-SCREEN VIDEO & AUDIO ═══════ */}
      <div className="absolute inset-0">
        {livekitToken && livekitUrl ? (
          <LiveKitRoom
            // Remount (disconnect + reconnect with fresh grants) whenever we
            // cross the viewer↔caller phase boundary. @livekit/components-react
            // does not reconnect on token/url prop change alone.
            key={isInCall && callToken ? `call-${callChannelId || sessionId}` : isBroadcaster ? `broad-${sessionId}` : `view-${sessionId}`}
            serverUrl={isInCall && callWsUrl ? callWsUrl : livekitUrl}
            token={isInCall && callToken ? callToken : livekitToken}
            connect={true}
            audio={isBroadcaster ? !isMuted : isInCall && !isMuted}
            video={isBroadcaster}
          >
            {isBroadcaster ? (
              <>
                <BroadcasterSelfPreview broadcasterName={broadcasterName} broadcasterAvatar={broadcasterAvatar} />
                <BroadcasterPublishController
                  isMuted={isMuted}
                  onConnected={() => {
                    console.log('[Broadcaster] onConnected -> emitConnectedWithLivekit');
                    emitConnectedWithLivekit(sessionId, false);
                  }}
                  onRemoteParticipantConnected={handleBroadcasterParticipantConnected}
                  onRemoteParticipantDisconnected={handleBroadcasterParticipantDisconnected}
                />
                {/* Audio renderer for viewers calling in (broadcaster hears them). */}
                <RoomAudioRenderer />
              </>
            ) : (
              <>
                <BroadcasterVideo broadcasterName={broadcasterName} broadcasterAvatar={broadcasterAvatar} />
                {/* Mute remote audio when another viewer is in a *private* call
                    with the host (Swift: unSubscribeAudioForSelf). Volume 0
                    keeps the audio element alive (avoids autoplay re-locks)
                    while preventing eavesdropping. */}
                <RoomAudioRenderer volume={mutedRemoteAudio ? 0 : 1} />
                <AudioPlaybackUnlocker />
                <CallRoomController
                  isInCall={isInCall}
                  isMuted={isMuted}
                  onConnected={() => {
                    dlog('CallRoomController onConnected -> emitConnectedWithLivekit');
                    emitConnectedWithLivekit(sessionId, false);
                  }}
                />
              </>
            )}
          </LiveKitRoom>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 via-white to-amber-50/40">
            {broadcasterAvatar ? (
              <img src={broadcasterAvatar} alt={broadcasterName} className="w-32 h-32 rounded-full object-cover border-4 border-orange-200/60 shadow-2xl" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-white shadow-2xl">
                <span className="text-5xl font-bold text-white">{broadcasterName?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <p className="text-orange-400 text-sm mt-6 font-semibold animate-pulse">Connecting to stream...</p>
          </div>
        )}
      </div>

      {/* ═══════ TOP BAR ═══════ */}
      {/* Always rendered. When `isInCall`, the broadcaster pill grows a second
          row showing the call type + live duration timer, and the right-hand
          LIVE/Eye/X chips are swapped for mute + end-call controls. */}
      <div className="relative z-10 flex items-start justify-between px-3 pt-3 pb-2 safe-top" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 65%, transparent 100%)' }}>
        <div className="flex items-start gap-2.5">
          <button onClick={() => { window.location.href = '/live-sessions'; }} className="w-9 h-9 rounded-full bg-white shadow-md border border-orange-100 flex items-center justify-center text-orange-600 active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-start gap-1">
            <div className="premium-glass rounded-2xl pl-0.5 pr-3.5 py-0.5 shadow-sm border-white/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {broadcasterAvatar ? (
                      <img src={broadcasterAvatar} alt={broadcasterName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase">{broadcasterName?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="leading-none">
                  <p className="text-gray-900 text-[12px] font-extrabold tracking-tight">{broadcasterName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-orange-600 text-[9px] font-black uppercase tracking-widest">{viewers} online</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Full-width in-call banner is rendered separately below the
                top bar (single source of truth) — no duplicate chip here. */}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isInCall ? (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-white border border-orange-100 text-orange-600'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleEndCall}
                className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30 active:scale-90 transition-transform"
                aria-label="End call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </>
          ) : isBroadcaster ? (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-white border border-orange-100 text-orange-600'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30 active:scale-90 transition-transform"
                aria-label="End session"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md shadow-red-500/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-orange-100 rounded-lg px-2 py-1 shadow-sm">
                <Eye className="w-3 h-3 text-orange-500" />
                <span className="text-gray-800 text-[11px] font-bold">{viewers}</span>
              </div>
              <button onClick={() => { window.location.href = '/live-sessions'; }} className="w-8 h-8 rounded-full bg-white shadow-md border border-orange-100 flex items-center justify-center text-gray-400 active:scale-90 transition-transform hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════ ACTIVE CALL BANNER (when someone else is in call) ═══════ */}
      {activeCall && !isInCall && (
        <div className="relative z-10 mx-3 mt-1 animate-fade-in-up">
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-green-200 shadow-lg">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
            <span className="text-gray-800 text-xs font-bold">
              {activeCall.isPrivate ? '🔒 Private' : '🌐 Public'} call in progress
              {activeCall.userName && <span className="text-orange-600 font-extrabold ml-1">with {activeCall.userName}</span>}
            </span>
          </div>
        </div>
      )}

      {/* ═══════ IN-CALL BANNER ═══════ */}
      {/* Rendered for whichever side is in an active call on the web. The
          mobile astrologer apps (iOS Swift / Android Kotlin) ship their own
          version of this UI; we don't have access to those repos, so this
          web banner is the only surface we can control from here. It serves
          both web users (talking to a mobile astrologer) AND web partners
          who go live via the partner panel (StatusToggle → broadcaster mode). */}
      {isInCall && (
        <div className="relative z-10 mx-3 mt-1 animate-fade-in-up">
          <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 shadow-lg ${
            inviteCallType === 'private'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border border-purple-300/60'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border border-emerald-300/60'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-[12px] font-black uppercase tracking-wider">
                {inviteCallType === 'private' ? '🔒 Private Call' : '🌐 Public Call'}
              </span>
              <span className="opacity-70">·</span>
              <span className="text-[12px] font-semibold truncate">
                {isBroadcaster
                  ? `with ${activeCall?.userName || invitedUserNameRef.current || 'User'}`
                  : `with ${broadcasterName}`}
              </span>
            </div>
            <span className="text-[14px] font-extrabold tabular-nums shrink-0">{formatTime(callTimer)}</span>
          </div>
        </div>
      )}

      {/* ═══════ GIFT TOAST ═══════ */}
      <div className="absolute left-3 top-24 z-30">
        <AnimatePresence>
          {giftToast && <GiftToast gift={giftToast.gift} senderName={giftToast.senderName} onDone={() => setGiftToast(null)} />}
        </AnimatePresence>
      </div>

      {/* ═══════ RIGHT SIDE ACTIONS ═══════ */}
      <div className="absolute right-4 bottom-[200px] z-30 flex flex-col items-center gap-6">
        <div className="relative">
          <FloatingHearts trigger={likeAnimCount} />
          <button onClick={handleLike} disabled={isLiked} className="group flex flex-col items-center gap-1.5 transition-all">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 backdrop-blur-xl border-2 group-active:scale-125 ${
              isLiked
                ? 'bg-red-500/20 border-red-500/40'
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
            }`}>
              <Heart className={`w-7 h-7 transition-all ${isLiked ? 'text-red-500 fill-red-500 animate-heart-pop' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{likes}</span>
          </button>
        </div>

        <button onClick={() => { if (!isAuthenticated()) { alert('Please login to send dakshina.'); return; } setShowGiftModal(true); }}
          className="group flex flex-col items-center gap-1.5 transition-all">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F7971E] via-[#FFD200] to-[#F7971E] bg-[length:200%_auto] hover:bg-right flex items-center justify-center shadow-[0_8px_32px_rgba(247,151,30,0.4)] group-hover:scale-110 transition-all duration-500">
            <Gift className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <span className="text-[#FFD200] text-[10px] font-black tracking-widest uppercase drop-shadow-md">Dakshina</span>
        </button>

        {/* Broadcaster: toggle queue panel */}
        {isBroadcaster && !isInCall && (
          <button
            onClick={() => setShowQueuePanel(!showQueuePanel)}
            className="group flex flex-col items-center gap-1.5 transition-all"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-all duration-500 border-2 ${showQueuePanel ? 'bg-orange-500 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'}`}>
              <Users className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <span className="text-white text-[10px] font-black tracking-widest uppercase drop-shadow-md">Queue</span>
          </button>
        )}

        {!inQueue && !isWaitlisted && !isInCall && !isBroadcaster && (
          <button
            onClick={() => setShowCallTypeModal(true)}
            disabled={joiningQueue}
            className="group flex flex-col items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00b09b] to-[#96c93d] flex items-center justify-center shadow-[0_8px_32px_rgba(0,176,155,0.4)] group-hover:scale-110 transition-all duration-500 border-2 border-white/20">
              {joiningQueue ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <Phone className="w-7 h-7 text-white drop-shadow-md" />}
            </div>
            <span className="text-[#96c93d] text-[10px] font-black tracking-widest uppercase drop-shadow-md">Consult</span>
          </button>
        )}
      </div>

      {/* ═══════ BOTTOM: CHAT + QUEUE STATUS ═══════ */}
      <div className="relative z-10 mt-auto" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)' }}>

        {/* Chat messages — Instagram/TikTok style with better aesthetics */}
        <div
          className="px-4 pb-4 pr-24 max-h-[35vh] overflow-y-auto space-y-3 scrollbar-hide"
          style={{ maskImage: 'linear-gradient(to top, black 85%, transparent 100%)' }}
        >
          {chats.slice(-40).map((chat, idx) => {
            const ud = getUserDetails();
            const isMe = String(chat.userId) === String(ud?.id || ud?._id || ud?.userId);
            const isBroadcaster = chat.userId === sessionData?.broadcasterId;
            return (
              <div key={idx} className="flex items-start gap-2.5 animate-fade-in-left">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg ${isBroadcaster ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-black/50' : 'bg-white/10'}`}>
                  {chat.profilePicture
                    ? <img src={chat.profilePicture} alt="" className="w-full h-full object-cover" />
                    : <div className={`w-full h-full flex items-center justify-center ${isBroadcaster ? 'bg-gradient-to-br from-orange-400 to-amber-600' : 'bg-white/20'}`}>
                        <span className="text-xs text-white font-black">{chat.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                  }
                </div>
                <div className="max-w-[85%]">
                  <div className={`backdrop-blur-md rounded-2xl rounded-tl-none px-4 py-2 border shadow-lg ${
                    isBroadcaster 
                      ? 'bg-orange-500/20 border-orange-500/30' 
                      : isMe 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-black/40 border-white/10'
                  }`}>
                    <span className={`text-[10px] font-black block mb-0.5 tracking-wider uppercase ${isBroadcaster ? 'text-orange-400' : isMe ? 'text-blue-400' : 'text-white/60'}`}>
                      {chat.name}{isBroadcaster && ' ✨'}
                    </span>
                    <span className="text-white text-sm leading-relaxed font-medium tracking-tight">
                      {chat.message}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {(inQueue || isWaitlisted) && !isInCall && activeCall && !isJoiningCall && (
          <div className="mx-3 mb-2 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl px-4 py-2.5 shadow-lg shadow-green-500/30 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
              <div>
                <p className="text-white text-xs font-bold">Astrologer is ready</p>
                <p className="text-white/80 text-[10px] font-medium flex items-center gap-1">
                  Tap to join {queueType === 'private' ? <><Lock className="w-2.5 h-2.5" /> Private</> : <><Globe className="w-2.5 h-2.5" /> Public</>} call
                </p>
              </div>
            </div>
            <button onClick={() => {
                const acIsPrivate = typeof activeCall?.isPrivate === 'string'
                  ? activeCall.isPrivate === 'true'
                  : !!activeCall?.isPrivate;
                const cType: 'private' | 'public' = acIsPrivate || queueType === 'private' ? 'private' : 'public';
                setInviteCallType(cType);
                handleAcceptInvite(cType);
              }}
              className="px-4 py-1.5 bg-white text-green-700 rounded-full text-[11px] font-extrabold active:scale-95 transition-all">
              Join Now
            </button>
          </div>
        )}

        {(inQueue || isWaitlisted) && !isInCall && (!activeCall || isJoiningCall) && (
          <div className="mx-3 mb-2 flex items-center justify-between bg-orange-500 rounded-2xl px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <div>
                <p className="text-white text-xs font-bold">{isJoiningCall ? 'Connecting…' : (isWaitlisted && !inQueue ? 'Connecting...' : "You're in queue")}</p>
                <p className="text-white/70 text-[10px] font-medium flex items-center gap-1">
                  {queueType === 'private' ? <><Lock className="w-2.5 h-2.5" /> Private call</> : <><Globe className="w-2.5 h-2.5" /> Public call</>}
                </p>
              </div>
            </div>
            <button onClick={() => { handleLeaveQueue(); setIsWaitlisted(false); }} disabled={leavingQueue || isJoiningCall}
              className="px-4 py-1.5 bg-white text-orange-600 rounded-full text-[11px] font-bold active:scale-95 transition-all disabled:opacity-60">
              {leavingQueue ? 'Leaving...' : 'Leave'}
            </button>
          </div>
        )}

        {/* Chat input */}
        <div className="px-3 pb-4 pt-2 safe-bottom">
          <div className="flex items-center gap-2 premium-glass border-white/20 rounded-full pl-5 pr-2 py-2 shadow-2xl">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none font-medium"
            />
            <button
              onClick={handleSendChat}
              disabled={sendingChat || !chatInput.trim()}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>



      {/* ═══════ LIVE INVITATION MODAL ═══════ */}
      {/* Shown when the astrologer accepts this user's queued request.    */}
      {/* The call type (private/public) was pre-chosen during queue join, */}
      {/* so here the user just accepts or declines.                       */}
      {showInviteModal && inviteCallData && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] animate-in fade-in duration-300" />
          <div className="fixed inset-0 flex items-center justify-center z-[251] p-6">
            <div className="bg-white rounded-[32px] px-6 pt-8 pb-6 shadow-2xl max-w-sm w-full relative overflow-hidden border-4 border-orange-100 animate-scale-in">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full opacity-50 pointer-events-none" />
              <div className="absolute top-4 right-6 text-2xl animate-wiggle pointer-events-none">✨</div>

              <div className="flex flex-col items-center">
                {/* Avatar with pulsing call icon */}
                <div className="relative mb-5">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 p-1 shadow-lg">
                    <div className="w-full h-full rounded-[20px] overflow-hidden bg-white border-2 border-white">
                      {broadcasterAvatar ? (
                        <img src={broadcasterAvatar} alt={broadcasterName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-100">
                          <span className="text-3xl font-bold text-orange-500">{broadcasterName.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-2 shadow-md border-2 border-white animate-pulse">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Invitation</p>
                <h3 className="text-2xl font-black text-gray-900 mb-1 text-center">{broadcasterName}</h3>
                <p className="text-gray-500 text-xs font-medium mb-4 text-center leading-relaxed">
                  is ready to take your call
                </p>

                {/* Call-type badge reflecting the pre-chosen visibility */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-6 border ${
                    inviteCallType === 'private'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}
                >
                  {inviteCallType === 'private' ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Private Call &middot; only astrologer hears you
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" />
                      Public Call &middot; audible to live viewers
                    </>
                  )}
                </div>

                {/* Accept / Decline — matches provided design */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={handleDeclineInvite}
                    disabled={isJoiningCall}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <PhoneOff className="w-4 h-4" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptInvite(inviteCallType)}
                    disabled={isJoiningCall}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isJoiningCall ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        Accept
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════ CALL TYPE MODAL ═══════ */}
      {showCallTypeModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210]" onClick={() => setShowCallTypeModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[210] animate-slide-up max-w-lg mx-auto">
            <div className="bg-white rounded-t-3xl p-6 pb-safe shadow-2xl">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Request a Call</h3>
              <p className="text-gray-500 text-sm mb-5">Choose how you'd like to connect with {broadcasterName}</p>
              <div className="space-y-3">
                <button onClick={() => handleJoinQueue(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-purple-100 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-purple-100 shadow-sm">
                    <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-gray-900 font-bold">Private Call</h4>
                      {privateRpm && <span className="text-purple-600 text-[11px] font-bold bg-purple-100 px-2 py-0.5 rounded-full">₹{privateRpm}/min</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">Only you and the astrologer can hear. Confidential.</p>
                  </div>
                </button>
                <button onClick={() => handleJoinQueue(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-orange-100 bg-orange-50/30 hover:bg-orange-50 hover:border-orange-300 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-orange-100 shadow-sm">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-gray-900 font-bold">Public Call</h4>
                      {publicRpm && <span className="text-orange-600 text-[11px] font-bold bg-orange-100 px-2 py-0.5 rounded-full">₹{publicRpm}/min</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">Everyone in the live session can listen along.</p>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowCallTypeModal(false)} className="w-full mt-4 py-3 rounded-xl text-gray-400 font-medium hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            </div>
          </div>
        </>
      )}
      {/* ═══════ GIFT NOTIFICATION OVERLAY ═══════ */}
      {giftNotification && giftNotification.type === 'received' && (
        <div className="fixed top-20 inset-x-0 z-[250] flex justify-center pointer-events-none px-4 animate-fade-in-down">
          <div className="px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border flex items-center gap-3 bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-amber-300/40">
            <span className="text-2xl">🙏</span>
            <div>
              <p className="text-white text-sm font-bold">Dakshina Received!</p>
              <p className="text-white/80 text-xs">
                {`${giftNotification.fromName || 'User'} sent ${giftNotification.giftName || 'Dakshina'}${giftNotification.price ? ` (₹${giftNotification.price})` : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DAKSHINA MODAL ═══════ */}
      <DakshinaModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSend={handleSendGift}
        receiverName={broadcasterName}
        gifts={gifts}
        onFetchGifts={fetchGifts}
      />

      </div>
      {/* ═══════ BROADCASTER QUEUE PANEL ═══════ */}
      <AnimatePresence>
        {isBroadcaster && showQueuePanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-72 max-w-[80vw] z-40 bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Queue ({queue.length})
              </h3>
              <button onClick={() => setShowQueuePanel(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {queue.length === 0 && (
                <div className="text-white/40 text-xs text-center py-8 italic">No users in queue</div>
              )}
              {queue.map((q) => (
                <div key={q._id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{q.userName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{q.userName}</p>
                    <p className="text-white/40 text-[10px] font-medium">
                      {q.isPrivate ? 'Private' : 'Public'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInviteUser(q)}
                    disabled={invitingUserIds.has(q.userId)}
                    className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
                  >
                    {invitingUserIds.has(q.userId) ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                    {invitingUserIds.has(q.userId) ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ END SESSION CONFIRMATION ═══════ */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowEndConfirm(false)} />
          <div className="relative bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-orange-100 animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <StopCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">End Live Session?</h3>
            <p className="text-gray-500 text-xs text-center mb-6 leading-relaxed">
              This will stop the live stream, remove all viewers from the queue, and end any active call.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:scale-95 transition-all hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); handleEndBroadcasterSession(); }}
                disabled={endingSession}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-red-500/20"
              >
                {endingSession ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ END CENTERED STAGE ═══════ */}

      {/* ═══════ CSS ═══════ */}
      <style jsx>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes float-heart { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-70px) scale(1.15); opacity: 0.8; } 100% { transform: translateY(-140px) scale(0.7); opacity: 0; } }
        .animate-float-heart { animation: float-heart 1.5s ease-out forwards; }
        @keyframes burst-heart {
          0%   { transform: translateX(calc(-50% + 0px)) translateY(12px) scale(0) rotate(0); opacity: 0; }
          15%  { transform: translateX(calc(-50% + 0px)) translateY(-20px) scale(1.4) rotate(calc(var(--burst-rot, 0deg) * 0.4)); opacity: 1; }
          40%  { transform: translateX(calc(-50% + calc(var(--burst-drift, 0px) * 0.6))) translateY(-110px) scale(1.1) rotate(calc(var(--burst-rot, 0deg) * 0.7)); opacity: 1; }
          75%  { transform: translateX(calc(-50% + var(--burst-drift, 0px))) translateY(-210px) scale(0.95) rotate(var(--burst-rot, 0deg)); opacity: 0.85; }
          100% { transform: translateX(calc(-50% + calc(var(--burst-drift, 0px) * 1.5))) translateY(-320px) scale(0.4) rotate(calc(var(--burst-rot, 0deg) * 1.2)); opacity: 0; }
        }
        .animate-burst-heart { animation: burst-heart ease-out forwards; will-change: transform, opacity; }
        @keyframes slide-in-left { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-left { animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }
        .animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
        @keyframes scale-in-chat { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-in-chat { animation: scale-in-chat 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        @keyframes sacred-glow { 0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); } 50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.7); } }
        .animate-sacred-glow { animation: sacred-glow 3s ease-in-out infinite; }
        @keyframes heart-pop { 0% { transform: scale(1); } 30% { transform: scale(1.45) rotate(-8deg); } 60% { transform: scale(0.92) rotate(4deg); } 100% { transform: scale(1) rotate(0); } }
        .animate-heart-pop { animation: heart-pop 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes call-glow { 0%, 100% { box-shadow: 0 10px 30px -10px rgba(34, 197, 94, 0.5), 0 0 0 1px rgba(134, 239, 172, 0.3); } 50% { box-shadow: 0 10px 40px -5px rgba(34, 197, 94, 0.75), 0 0 0 2px rgba(134, 239, 172, 0.5); } }
        .animate-call-glow { animation: call-glow 2.4s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-top { padding-top: max(0.75rem, env(safe-area-inset-top)); }
        .safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}
