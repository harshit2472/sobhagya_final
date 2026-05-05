'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUserDetails, getAuthToken } from '../utils/auth-utils';
import { getApiBaseUrl } from '../config/api';

const LIVE_SOCKET_URL = typeof window !== 'undefined' ? getApiBaseUrl() : 'https://micro.sobhagya.in';
const LIVE_SOCKET_PATH = '/live-socket/socket.io/';

export interface LiveSession {
  sessionId: string;
  broadcasterId: string;
  broadcasterName: string;
  broadcasterProfilePicture: string;
  status: string;
  viewers?: number;
  likes?: number;
  privateAudioRpm?: number;
  publicAudioRpm?: number;
  activeCall?: any;
  createdAt?: string;
}

export interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  profilePicture?: string;
  timestamp?: string;
}

export interface QueueItem {
  _id: string;
  userId: string;
  userName: string;
  isPrivate: boolean;
  status: string;
  sessionId: string;
}

/**
 * Hook options.
 * Pass `sessionId` for the broadcaster's hook so that:
 *   1. The handshake.query carries `sessionId` (the backend's `disconnect`
 *      handler keys the 30s session-end timer off this field).
 *   2. Every *reconnect* (i.e. every `connect` after the first) auto-emits
 *      `partner-reconnect` to cancel that timer immediately. Without this,
 *      a refresh or brief network blip during a live session causes the
 *      backend to end the session 30s later.
 */
export interface UseLiveSocketOptions {
  /** Pass the live-session id when the current user is the broadcaster. */
  sessionId?: string;
}

export function useLiveSocket(options: UseLiveSocketOptions = {}) {
  const { sessionId: connectSessionId } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Tracks whether we've completed at least one `connect` — used to detect
  // *reconnect* events so we can re-emit `partner-reconnect` for broadcasters.
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    const userDetails = getUserDetails();
    const userId = userDetails?.id || userDetails?._id || 'anonymous';
    const token = getAuthToken() || '';
    const role = userDetails?.role || 'user';

    const query: Record<string, string> = { userId: String(userId), role: String(role), token };
    // Broadcaster: include sessionId so the backend's disconnect handler can
    // pair us with the live session and schedule its end if we go offline.
    if (connectSessionId) query.sessionId = connectSessionId;

    const socket = io(LIVE_SOCKET_URL, {
      path: LIVE_SOCKET_PATH,
      query,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 20,
    });

    socket.on('connect', () => {
      console.log('[LiveSocket] Connected:', socket.id);
      // Reconnect path (broadcaster only): cancel the 30s session-end timer
      // that the backend scheduled when this socket disconnected.
      if (hasConnectedOnceRef.current && connectSessionId) {
        console.log('[LiveSocket] Auto-emitting partner-reconnect for', connectSessionId);
        socket.emit('partner-reconnect', connectSessionId, (resp: any) => {
          console.log('[LiveSocket] partner-reconnect ack:', resp);
        });
      }
      hasConnectedOnceRef.current = true;
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[LiveSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[LiveSocket] Connection error:', err.message);
    });

    // Log every inbound event so we can see what the server actually broadcasts
    // when the astrologer accepts a queued invite — exact event name varies by
    // backend and isn't documented on the Android side (FCM does that job there).
    socket.onAny((event, ...args) => {
      console.log('[LiveSocket] <=', event, ...args);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      hasConnectedOnceRef.current = false;
    };
  }, [connectSessionId]);

  const getSessions = useCallback((lastSessionId?: string, limit: number = 20): Promise<LiveSession[]> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve([]); return; }
      socketRef.current.emit('getSessions', { lastSessionId, limit }, (resp: any) => {
        // Match Swift: success when `error == 0/false` OR `sessions` array is present.
        if (resp && Array.isArray(resp.sessions)) {
          resolve(resp.sessions);
          return;
        }
        if (resp && (resp.error === 0 || resp.error === false)) {
          resolve(Array.isArray(resp.sessions) ? resp.sessions : []);
          return;
        }
        resolve([]);
      });
    });
  }, []);

  const startSession = useCallback((sessionId: string, broadcasterId: string, broadcasterName: string, broadcasterProfilePicture: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve({ error: true, message: "Socket not connected" }); return; }
      let settled = false;
      const finish = (r: any) => { if (settled) return; settled = true; resolve(r); };
      // Match Swift: timingOut(after: 15). Without this the broadcaster UI hangs
      // forever if the backend silently drops the ack.
      const timer = setTimeout(() => finish({ error: true, message: 'START_SESSION_TIMEOUT' }), 15000);
      socketRef.current.emit('startSession', { sessionId, broadcasterId, broadcasterName, broadcasterProfilePicture }, (resp: any) => {
        clearTimeout(timer);
        finish(resp);
      });
    });
  }, []);

  const endSessionBroadcaster = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve({ error: true }); return; }
      socketRef.current.emit('endSession', { sessionId }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const joinSession = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      const userName = userDetails?.name || userDetails?.displayName || 'User';
      const userProfilePicture = userDetails?.avatar || '';

      socketRef.current.emit('joinSession', { sessionId, userName, userId, userProfilePicture }, (resp: any) => {
        // Match Swift: a session that has already ended comes back as
        // `{ error: 1, status: 'ended' }`. Surface a clean code so the page can
        // route to "session ended" UI without ambiguity.
        if (resp && (resp.error === 1 || resp.error === true) && resp.status === 'ended') {
          resolve({ error: true, code: 'SESSION_ENDED', raw: resp });
          return;
        }
        if (resp && resp.status === 'error') {
          resolve({ error: true, code: 'JOIN_FAILED', raw: resp });
          return;
        }
        resolve(resp);
      });
    });
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    if (!socketRef.current) return;
    const userDetails = getUserDetails();
    const userId = userDetails?.id || userDetails?._id || '';
    socketRef.current.emit('leaveSession', { sessionId, userId });
  }, []);

  const fetchSessionToken = useCallback((currentSessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      socketRef.current.emit('fetchSessionToken', {
        currentSessionId,
        previousSessionId: null,
        nextSessionId: null,
        userId,
      }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const getChats = useCallback((sessionId: string): Promise<ChatMessage[]> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve([]); return; }
      socketRef.current.emit('get_chats', { sessionId }, (resp: any) => {
        if (!resp.error && resp.data) {
          resolve(resp.data);
        } else {
          resolve([]);
        }
      });
    });
  }, []);

  const sendChat = useCallback((sessionId: string, message: string): Promise<ChatMessage | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      const name = userDetails?.name || userDetails?.displayName || 'User';
      const profilePicture = userDetails?.avatar || '';

      let settled = false;
      const finish = (r: ChatMessage | null) => { if (settled) return; settled = true; resolve(r); };
      // Swift fires-and-forgets `add_chat`. The web previously awaited the ack
      // and dropped the message when the backend skipped it. Local-echo after
      // 1 s so the sender always sees their own message — the broadcasted
      // `chat_update` will dedupe via list semantics on other clients.
      const localEcho: ChatMessage = { userId, name, message, profilePicture, timestamp: new Date().toISOString() };
      const timer = setTimeout(() => finish(localEcho), 1000);
      socketRef.current.emit('add_chat', { sessionId, userId, name, message, profilePicture }, (resp: any) => {
        clearTimeout(timer);
        if (resp && !resp.error && resp.data) {
          finish(resp.data);
        } else {
          finish(localEcho);
        }
      });
    });
  }, []);

  const joinQueue = useCallback((sessionId: string, isPrivate: boolean): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      const userName = userDetails?.name || userDetails?.displayName || 'User';

      socketRef.current.emit('joinQueue', { sessionId, userId, userName, isPrivate }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const leaveQueue = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      socketRef.current.emit('leaveQueue', { sessionId, userId }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const getQueue = useCallback((sessionId: string): Promise<QueueItem[]> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve([]); return; }
      socketRef.current.emit('getQueue', { sessionId }, (resp: any) => {
        if (!resp.error && resp.data) {
          resolve(Array.isArray(resp.data) ? resp.data : []);
        } else {
          resolve([]);
        }
      });
    });
  }, []);

  const getActiveCall = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      socketRef.current.emit('get_active_call', { sessionId }, (resp: any) => {
        try { console.log('[LiveSocket] get_active_call FULL:', JSON.stringify(resp)); }
        catch { console.log('[LiveSocket] get_active_call (unstringifiable):', resp); }
        if (resp?.error || !resp?.data) { resolve(null); return; }
        let ac: any = resp.data.activeCalls ?? resp.data.activeCall ?? resp.data;
        if (typeof ac === 'string') {
          try { ac = JSON.parse(ac); } catch { ac = null; }
        }
        if (!ac || typeof ac !== 'object') { resolve(null); return; }
        
        // If the backend returned a map of calls (e.g., {"user123": { channelId: ... }}),
        // extract the first actual call object from it.
        if (!Array.isArray(ac) && !ac.channelId && !ac.userId && !ac.user) {
          const values = Object.values(ac);
          if (values.length > 0 && typeof values[0] === 'object' && values[0] !== null) {
            ac = values[0];
          } else {
            resolve(null); return;
          }
        } else if (!Array.isArray(ac) && !ac.channelId && !ac.userId && !ac.user) {
          resolve(null); return;
        }

        if (Array.isArray(ac)) {
          ac = ac.map(call => {
            if (typeof call.isPrivate === 'string') call.isPrivate = call.isPrivate === 'true';
            return call;
          });
        } else if (typeof ac.isPrivate === 'string') {
          ac.isPrivate = ac.isPrivate === 'true';
        }
        
        console.log('[LiveSocket] get_active_call PARSED:', ac);
        resolve(ac);
      });
    });
  }, []);

  const addLike = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      socketRef.current.emit('add_like', { sessionId, userId }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const getLikes = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      socketRef.current.emit('get_likes', { sessionId, userId }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  const joinRoomParticipant = useCallback((sessionId: string, callRate: number, isAudioPrivate: boolean): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      let settled = false;
      const finish = (resp: any) => {
        if (settled) return;
        settled = true;
        resolve(resp);
      };
      // 10 s is generous — backend has to mint a LiveKit token. Anything
      // longer is a bug we'd rather surface than hide behind a spinner.
      const timer = setTimeout(() => {
        finish({ error: true, message: 'JOIN_ROOM_TIMEOUT' });
      }, 10000);
      socketRef.current.emit('joinRoomParticipant', {
        sessionId,
        userId,
        callRate,
        isAudioPrivate,
        isVideoPrivate: true,
        isVideoOff: true,
      }, (resp: any) => {
        clearTimeout(timer);
        finish(resp);
      });
    });
  }, []);

  const acceptInvite = useCallback((sessionId: string, channelId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      let settled = false;
      const finish = (resp: any) => {
        if (settled) return;
        settled = true;
        resolve(resp);
      };
      // Hard timeout — if the backend forgets to ack we don't want the UI
      // pinned on "Joining..." indefinitely. 6 s is plenty for a Redis ack
      // and well under the 60 s ring-timeout the server enforces.
      const timer = setTimeout(() => {
        finish({ error: true, message: 'ACCEPT_INVITE_TIMEOUT' });
      }, 6000);
      socketRef.current.emit('accept_invite', { sessionId, channelId }, (resp: any) => {
        clearTimeout(timer);
        finish(resp);
      });
    });
  }, []);

  const endCall = useCallback((sessionId: string, channelId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      let settled = false;
      const finish = (resp: any) => {
        if (settled) return;
        settled = true;
        resolve(resp);
      };
      // Backend's end_call handler does not ack on the success path — it only
      // broadcasts `call_end`. Without a timeout the await sits forever and
      // blocks downstream cleanup (e.g. handleEndBroadcasterSession awaits
      // endCall before tearing the session down).
      const timer = setTimeout(() => {
        finish({ error: false, viaTimeout: true });
      }, 3000);
      socketRef.current.emit('end_call', { sessionId, channelId, userId, reason: 'user_ended' }, (resp: any) => {
        clearTimeout(timer);
        finish(resp);
      });
    });
  }, []);

  const emitConnectedWithLivekit = useCallback((sessionId: string, isHlsStream: boolean = false): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(null); return; }
      socketRef.current.emit('connectedWithLivekit', { sessionId, isHlsStream }, (resp: any) => {
        resolve(resp);
      });
    });
  }, []);

  /**
   * Manually emit `partner-reconnect` (the broadcaster's hook auto-emits this
   * on reconnect — exposed for explicit calls e.g. when a broadcaster regains
   * focus on a tab).
   */
  const emitPartnerReconnect = useCallback((sessionId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve({ success: false, error: true }); return; }
      socketRef.current.emit('partner-reconnect', sessionId, (resp: any) => resolve(resp));
    });
  }, []);

  /**
   * Broadcaster invites a queued user to a call. Backend persists the call
   * with `channelId` (frontend-generated) and broadcasts `call_started` to
   * the session room when the user accepts via `accept_invite`.
   */
  const emitSendInvite = useCallback((params: {
    sessionId: string;
    channelId: string;
    queueId: string;
    userId: string;
    isPrivate: boolean;
  }): Promise<any> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve({ error: true, message: 'Socket not connected' }); return; }
      socketRef.current.emit('send_invite', params, (resp: any) => resolve(resp));
    });
  }, []);

  /**
   * Wallet balance via the live socket. Mirrors the REST `/wallet/balance`
   * endpoint and is preferred when the live socket is already connected
   * because it avoids an extra round-trip.
   */
  const getBalanceViaSocket = useCallback((userId: string): Promise<{ error: boolean; balance: number }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve({ error: true, balance: 0 }); return; }
      socketRef.current.emit('getBalance', { userId }, (resp: any) => {
        resolve({
          error: !!resp?.error,
          balance: Number(resp?.data?.balance || 0),
        });
      });
    });
  }, []);

  // Mirrors useCallSocket.fetchGifts — the live backend shares the same
  // `get_gifts` event, so the modal doesn't need a REST fallback.
  const fetchGifts = useCallback((): Promise<any[]> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        resolve([]);
        return;
      }
      socketRef.current.emit('get_gifts', {}, (response: any) => {
        if (response?.error) {
          console.error('[useLiveSocket] get_gifts error:', response);
          resolve([]);
          return;
        }
        const list = Array.isArray(response?.data) ? response.data : [];
        resolve(list);
      });
    });
  }, []);

  const emitSendGift = useCallback((sessionId: string, gift: any, receiverId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) { reject(new Error('Socket not connected')); return; }
      if (!receiverId) { reject(new Error('Missing receiver id for gift')); return; }
      const userDetails = getUserDetails();
      const userId = userDetails?.id || userDetails?._id || '';
      const userName = userDetails?.name || userDetails?.displayName || 'User';
      const itemSendId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Field set matches Swift's emitSendGift exactly: no `toName` extra.
      const payload = {
        giftId: gift._id,
        giftIcon: gift.icon,
        channelId: sessionId,
        from: userId,
        fromName: userName,
        itemSendId,
        to: receiverId,
        giftName: gift.name,
        sessionId,
      };

      socketRef.current.emit('send_gift', payload, (resp: any) => {
        if (resp && resp.error) {
          reject(new Error(resp.message || resp.data?.message || 'Failed to send dakshina'));
          return;
        }
        resolve(resp);
      });
    });
  }, []);

  // Event listeners
  const onChatUpdate = useCallback((callback: (data: ChatMessage) => void) => {
    socketRef.current?.on('chat_update', (resp: any) => callback(resp.data));
    return () => { socketRef.current?.off('chat_update'); };
  }, []);

  const onViewerUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('viewerUpdate', callback);
    return () => { socketRef.current?.off('viewerUpdate'); };
  }, []);

  const onViewerLeft = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('viewerLeft', callback);
    return () => { socketRef.current?.off('viewerLeft'); };
  }, []);

  const onSessionEnded = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('sessionEnded', callback);
    return () => { socketRef.current?.off('sessionEnded'); };
  }, []);

  const onCallStarted = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('call_started', callback);
    return () => { socketRef.current?.off('call_started'); };
  }, []);

  const onCallEnd = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('call_end', callback);
    return () => { socketRef.current?.off('call_end'); };
  }, []);

  const onQueueJoined = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('queueJoined', callback);
    return () => { socketRef.current?.off('queueJoined'); };
  }, []);

  const onLikeUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('like_update', callback);
    return () => { socketRef.current?.off('like_update'); };
  }, []);

  const onGiftReceived = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('receive_gift', callback);
    return () => { socketRef.current?.off('receive_gift'); };
  }, []);

  // Mirrors Swift `onGiftRequest`. Backend broadcasts `gift_request` ahead of
  // `receive_gift` for host-side confirmation flows; expose so the page can
  // subscribe alongside `onGiftReceived`.
  const onGiftRequest = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('gift_request', callback);
    return () => { socketRef.current?.off('gift_request'); };
  }, []);

  const onSendInvite = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('send_invite', callback);
    return () => { socketRef.current?.off('send_invite', callback); };
  }, []);

  /**
   * Backend emits `sessionStarted` to the room when a broadcaster's
   * `startSession` succeeds. Useful as a confirmation/UI hook on the
   * broadcaster side and for any viewer that reaches the room before the
   * session is fully provisioned.
   */
  const onSessionStarted = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('sessionStarted', callback);
    return () => { socketRef.current?.off('sessionStarted', callback); };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    getSessions,
    startSession,
    endSessionBroadcaster,
    joinSession,
    leaveSession,
    fetchSessionToken,
    getChats,
    sendChat,
    joinQueue,
    leaveQueue,
    getQueue,
    getActiveCall,
    addLike,
    getLikes,
    joinRoomParticipant,
    acceptInvite,
    endCall,
    emitConnectedWithLivekit,
    emitPartnerReconnect,
    emitSendInvite,
    getBalanceViaSocket,
    onChatUpdate,
    onViewerUpdate,
    onViewerLeft,
    onSessionEnded,
    onSessionStarted,
    onCallStarted,
    onCallEnd,
    onQueueJoined,
    onLikeUpdate,
    onGiftReceived,
    onGiftRequest,
    onSendInvite,
    emitSendGift,
    fetchGifts,
  };
}
