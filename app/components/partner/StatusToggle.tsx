'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useLiveSocket } from '../../hooks/useLiveSocket';
import { Signal, Video, Phone, Power, Radio as RadioIcon, Loader2, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  _id: string;
  // Backend uses 'ogbusy' (literally) when the partner is on a call, in
  // addition to 'online' / 'offline'. We surface that as "On a call" in UI.
  status?: 'online' | 'offline' | 'busy' | 'ogbusy';
  isVideoCallAllowed?: boolean;
  isVideoCallAllowedAdmin?: boolean;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

interface StatusToggleProps {
  user: User | null;
  onUpdate: () => void;
}

export default function StatusToggle({ user, onUpdate }: StatusToggleProps) {
  const router = useRouter();
  const { startSession } = useLiveSocket();
  const [loading, setLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  
  const currentStatus: 'online' | 'offline' | 'busy' | 'ogbusy' = user?.status || 'offline';
  const isBusy = currentStatus === 'busy' || currentStatus === 'ogbusy';
  const videoEnabled = user?.isVideoCallAllowed ?? false;
  const adminBlocked = user?.isVideoCallAllowedAdmin === false;

  const performRequest = async (endpoint: string, body: any) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }

    return await res.json();
  };

  const handleStatusChange = async (newStatus: 'online' | 'offline') => {
    if (currentStatus === newStatus) return;

    setLoading(true);
    try {
      const response = await performRequest('/api/user/change-status', { status: newStatus });
      
      if (response.success) {
        if (newStatus === 'offline') {
          if (videoEnabled && !adminBlocked) {
            try {
              await performRequest('/api/user/change-status-video', { status: false });
              toast.success('You are now Offline. Settings disabled.', { icon: '🌑' });
            } catch (error) {
              toast.success('You are now Offline.');
            }
          } else {
            toast.success('Status changed to offline.');
          }
        } else {
          toast.success(`You are now Online!`, { icon: '🟢' });
        }
        onUpdate();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    setLiveLoading(true);
    try {
      // 1. Ensure user is online
      if (currentStatus !== 'online') {
        const statusResponse = await performRequest('/api/user/change-status', { status: 'online' });
        if (!statusResponse.success) throw new Error("Failed to set online status");
      }

      // 2. Ensure video is enabled
      if (!videoEnabled && !adminBlocked) {
        await performRequest('/api/user/change-status-video', { status: true });
      }

      // 3. Initiate Live Session via Socket
      const sessionId = `live_${user?._id}_${Date.now()}`;
      const broadcasterId = user?._id || '';
      const broadcasterName = user?.name || 'Partner';
      const broadcasterAvatar = user?.avatar || '';

      const resp = await startSession(sessionId, broadcasterId, broadcasterName, broadcasterAvatar);

      if (!resp.error) {
        // Cache the broadcaster's LiveKit token + URL so the live-session page
        // can connect as a publisher without round-tripping `fetchSessionToken`
        // (which mints a *viewer* token). Without this, the broadcaster lands
        // on the page as a viewer and cannot publish their video/audio.
        try {
          if (typeof window !== 'undefined' && resp.data) {
            sessionStorage.setItem(
              `liveBroadcaster:${sessionId}`,
              JSON.stringify({
                token: resp.data.token,
                livekitSocketURL: resp.data.livekitSocketURL,
                broadcasterId,
                broadcasterName,
                broadcasterProfilePicture: broadcasterAvatar,
                startedAt: Date.now(),
              })
            );
          }
        } catch (storageErr) {
          console.warn('[GoLive] Failed to cache broadcaster session:', storageErr);
        }

        toast.success('Live Session Started!', { icon: '🎥' });
        onUpdate();
        // 4. Redirect to Live Session Room (broadcaster mode)
        router.push(`/live-sessions/${sessionId}?role=broadcaster`);
      } else {
        // Roll back the online toggle if startSession failed (incl. the new
        // 15 s timeout from useLiveSocket). Otherwise the partner stays marked
        // online with no live session, which surfaces a confusing UI state.
        if (resp?.message === 'START_SESSION_TIMEOUT') {
          toast.error('Live server did not respond. Please try again.');
        } else {
          toast.error(resp.message || 'Failed to start live session');
        }
        try {
          await performRequest('/api/user/change-status', { status: 'offline' });
        } catch (rollbackErr) {
          console.warn('[GoLive] Failed to roll back status:', rollbackErr);
        }
        onUpdate();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to go live');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleVideoToggle = async (enabled: boolean) => {
    if (adminBlocked) {
      toast.error('Video calls restricted by admin.');
      return;
    }

    if (currentStatus === 'offline') {
      toast.error('Please go online first.');
      return;
    }

    setLoading(true);
    try {
      const response = await performRequest('/api/user/change-status-video', { status: enabled });
      if (response.success) {
        toast.success(`Video calls ${enabled ? 'enabled' : 'disabled'}`);
        onUpdate();
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const isOnline = currentStatus === 'online';
  const handleToggle = () => {
    if (loading) return;
    handleStatusChange(isOnline ? 'offline' : 'online');
  };

  return (
    <div
      className={`relative rounded-2xl border p-6 transition-all duration-300
        ${isOnline
          ? 'bg-white border-[#F7941D] shadow-md'
          : 'bg-white border-gray-200 shadow-sm'
        }`}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-[#333333] flex items-center gap-2">
              <Signal className={`w-5 h-5 ${isOnline ? 'text-[#F7941D]' : 'text-gray-400'}`} />
              Status
            </h3>
            <p className="text-sm font-medium text-[#4D4D4D] mt-1">Manage your availability</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-2 transition-colors duration-300 ${
              isBusy
                ? 'bg-red-50 text-red-600 border-red-200'
                : isOnline
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              {isOnline && (
                <motion.span
                  className={`absolute inset-0 rounded-full ${isBusy ? 'bg-red-400' : 'bg-green-400'}`}
                  animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <span
                className={`relative w-2 h-2 rounded-full ${
                  isBusy ? 'bg-red-500' : isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </span>
            <span>
              {isBusy ? 'In Session' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Toggle Switch for Status */}
        <div className="mb-8">
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            aria-label="Toggle online availability"
            onClick={handleToggle}
            disabled={loading}
            className={`group relative w-full overflow-hidden rounded-2xl border p-1.5 transition-all duration-500 ${
              isOnline
                ? 'border-orange-300 bg-orange-100 shadow-inner'
                : 'border-gray-200 bg-gray-100 shadow-inner'
            } ${loading ? 'cursor-wait opacity-80' : 'cursor-pointer hover:shadow-md hover:border-orange-400'}`}
          >
            {/* Shine sweep on hover */}
            <span
              aria-hidden
              className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] translate-x-0 group-hover:translate-x-[250%] transition-transform duration-1000 pointer-events-none"
            />

            <div className="relative grid grid-cols-2 items-stretch">
              {/* Sliding highlight */}
              <motion.span
                aria-hidden
                layout
                className={`absolute top-0 bottom-0 w-1/2 rounded-xl shadow-[0_2px_10px_rgba(249,115,22,0.2)] ${
                  isOnline
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                    : 'bg-white'
                }`}
                initial={false}
                animate={{ left: isOnline ? '0%' : '50%' }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />

              <span
                className={`relative z-10 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide transition-colors duration-300 ${
                  isOnline ? 'text-white' : 'text-[#4D4D4D]'
                }`}
              >
                <span className="relative flex items-center justify-center w-2.5 h-2.5">
                  {isOnline && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-white/60"
                      animate={{ scale: [1, 2, 1], opacity: [0.9, 0, 0.9] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <span className={`relative w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-400'}`} />
                </span>
                Online
              </span>

              <span
                className={`relative z-10 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide transition-colors duration-300 ${
                  !isOnline ? 'text-gray-600' : 'text-[#F7941D]/70'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                Offline
              </span>
            </div>

            {/* Loading shimmer bar */}
            {loading && (
              <motion.span
                aria-hidden
                className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
                initial={{ width: '20%', x: '-20%' }}
                animate={{ x: '500%' }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </button>
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Tap the switch to change your spiritual availability
          </p>
        </div>

        {/* Go Live CTA */}
        <div className="mb-8 relative">
          {/* Pulsing halo rings (only when ready to go live) */}
          {!adminBlocked && !liveLoading && (
            <>
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl border-2 border-orange-400/40 pointer-events-none"
                animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl border-2 border-red-400/30 pointer-events-none"
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
              />
            </>
          )}

          <motion.button
            onClick={handleGoLive}
            disabled={liveLoading || adminBlocked}
            whileHover={!adminBlocked && !liveLoading ? { scale: 1.02 } : undefined}
            whileTap={!adminBlocked && !liveLoading ? { scale: 0.98 } : undefined}
            className={`w-full group relative overflow-hidden py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-shadow duration-300 ${
              adminBlocked
                ? 'bg-gray-100 cursor-not-allowed opacity-50'
                : liveLoading
                ? 'bg-[#F7941D]/80 cursor-wait'
                : 'bg-[#F7941D] hover:bg-[#F7941D]/90 shadow-sm'
            }`}
          >
            <div className="relative z-10 flex items-center gap-2 text-white">
              {liveLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <RadioIcon className="w-6 h-6" />
              )}
              <span className="text-lg font-bold uppercase tracking-wider">
                {liveLoading ? 'Going Live...' : 'Go Live Now'}
              </span>
            </div>
            <p className="relative z-10 text-white/80 text-xs font-semibold uppercase tracking-wider mt-1">
              {liveLoading ? 'Connecting to your studio' : 'Start streaming to your followers'}
            </p>
          </motion.button>
        </div>

        {/* Call Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={currentStatus === 'online' ? { y: -2 } : undefined}
            className={`group relative overflow-hidden p-5 rounded-3xl border transition-all duration-300 ${
              currentStatus === 'offline'
                ? 'bg-gray-50 border-gray-100 opacity-60'
                : videoEnabled && !adminBlocked
                ? 'bg-orange-50 border-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.1)] ring-1 ring-orange-200'
                : 'bg-white border-gray-200 shadow-sm hover:shadow-orange-100'
            }`}
          >
            {videoEnabled && !adminBlocked && currentStatus === 'online' && (
              <motion.div
                aria-hidden
                className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-orange-500/10 blur-2xl pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <div className="relative flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl transition-colors ${
                videoEnabled && !adminBlocked && currentStatus === 'online'
                  ? 'bg-orange-100 text-orange-600'
                  : currentStatus === 'online'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <Video className="w-4 h-4" />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoEnabled && !adminBlocked}
                  onChange={(e) => handleVideoToggle(e.target.checked)}
                  disabled={loading || adminBlocked || currentStatus === 'offline'}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 border border-gray-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-orange-400 peer-checked:to-amber-500 peer-checked:border-orange-400 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            <p className="relative font-bold text-[#333333] text-sm mb-0.5">Video Consultation</p>
            <p className="relative text-[10px] font-bold uppercase tracking-wide">
              <span className={
                adminBlocked ? 'text-red-500'
                  : videoEnabled && currentStatus === 'online' ? 'text-orange-500'
                  : 'text-gray-400'
              }>
                {adminBlocked ? 'Restricted' : videoEnabled ? 'Active' : 'Inactive'}
              </span>
            </p>
          </motion.div>

          <motion.div
            whileHover={currentStatus === 'online' ? { y: -2 } : undefined}
            className={`relative overflow-hidden p-5 rounded-3xl border transition-all duration-300 ${
              currentStatus === 'offline' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-orange-50 border-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.05)]'
            }`}
          >
            {currentStatus === 'online' && (
              <motion.div
                aria-hidden
                className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-orange-500/10 blur-2xl pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              />
            )}
            <div className="relative flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl transition-colors ${currentStatus === 'online' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
                <Phone className="w-4 h-4" />
              </div>
              <span className="relative flex items-center justify-center w-3 h-3">
                {currentStatus === 'online' && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-orange-400"
                    animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
                <span className={`relative w-3 h-3 rounded-full ${currentStatus === 'online' ? 'bg-orange-500' : 'bg-gray-300'}`} />
              </span>
            </div>
            <p className="relative font-bold text-[#333333] text-sm mb-0.5">Audio Consultation</p>
            <p className="relative text-[10px] font-bold uppercase tracking-wide">
              <span className={currentStatus === 'online' ? 'text-orange-500' : 'text-gray-400'}>
                {currentStatus === 'online' ? 'Active' : 'Inactive'}
              </span>
            </p>
          </motion.div>
        </div>

        {/* Footer info/warning */}
        {adminBlocked && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
             <ShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0" />
             <p className="text-[11px] font-bold text-red-600 leading-normal">
               Professional streaming and video services are currently restricted. Seek divine guidance from support to awaken them.
             </p>
          </div>
        )}
        
        {!adminBlocked && currentStatus === 'offline' && (
           <div className="mt-6 flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200">
             <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
             <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-tight">
               Go online to receive calls and messages.
             </p>
           </div>
        )}
      </div>
    </div>
  );
}
