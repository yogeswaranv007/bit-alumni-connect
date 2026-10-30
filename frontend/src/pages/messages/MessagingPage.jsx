import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageApi } from '../../api/messageApi';
import { cryptoService } from '../../utils/cryptoService';
import { webSocketClient } from '../../utils/webSocketClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Search,
  Send,
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  MoreVertical,
  Ban,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  User,
  Info,
  ChevronDown,
  Unlock
} from 'lucide-react';

export const MessagingPage = () => {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Messages State
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Cryptography State
  const [deviceKeyPair, setDeviceKeyPair] = useState(null);
  const [peerPublicKey, setPeerPublicKey] = useState(null);
  const [sharedAesKey, setSharedAesKey] = useState(null);
  const [encryptionStatus, setEncryptionStatus] = useState('initializing'); // 'initializing' | 'active' | 'no_peer_keys' | 'unsupported'
  const [decryptedCache, setDecryptedCache] = useState({});
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Real-time WebSocket & Connectivity
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');

  // UI & Menu State
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ── 1. Device Key Registration & WebSocket Init ────────────────────────────

  useEffect(() => {
    let unbindStatus = () => {};

    const initializeKeysAndSocket = async () => {
      try {
        if (!token) return;

        // Ensure browser WebCrypto key pair exists in IndexedDB
        const keyPair = await cryptoService.getOrCreateDeviceKeyPair();
        setDeviceKeyPair(keyPair);

        // Export public key and register with backend
        const jwkString = await cryptoService.exportPublicKeyJwk(keyPair.publicKey);
        const deviceId = cryptoService.getDeviceId();

        await messageApi.registerDeviceKey({
          deviceId,
          publicKey: jwkString,
          publicKeyData: jwkString,
          keyAlgorithm: 'ECDH-P256',
          algorithm: 'ECDH-P256',
        });

        // Initialize WebSocket connection
        webSocketClient.connect(token);
        unbindStatus = webSocketClient.onStatusChange((status) => {
          setWsStatus(status);
        });
      } catch (err) {
        console.warn('Initialization error in crypto/websocket:', err);
      }
    };

    initializeKeysAndSocket();

    return () => {
      unbindStatus();
    };
  }, [token]);

  // Global user queue subscription for real-time conversation list unread counts
  useEffect(() => {
    if (wsStatus !== 'CONNECTED' || !user?.id) return;

    const unsubscribeQueue = webSocketClient.subscribeUserQueue((incomingMessage) => {
      // Update conversations list
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === incomingMessage.conversationId) {
            const isCurrentChat = activeConversation?.id === conv.id;
            return {
              ...conv,
              lastMessageAt: incomingMessage.createdAt,
              unreadCount: isCurrentChat ? conv.unreadCount : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
      });
    });

    return () => {
      unsubscribeQueue();
    };
  }, [wsStatus, user?.id, activeConversation?.id]);

  // ── 2. Load User Conversations ─────────────────────────────────────────────

  const fetchConversations = async (selectRecipientId = null) => {
    try {
      setConversationsLoading(true);
      const res = await messageApi.getMyConversations(0, 50);
      const list = res.data?.content || [];
      setConversations(list);

      // If query param recipientId provided, resolve or create conversation
      if (selectRecipientId) {
        const found = list.find((c) => c.otherUserId === selectRecipientId);
        if (found) {
          selectConversation(found);
        } else {
          // Create new conversation with recipient
          try {
            const createdRes = await messageApi.createOrGetConversation(selectRecipientId);
            if (createdRes.data) {
              const newConv = createdRes.data;
              setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
              selectConversation(newConv);
            }
          } catch (createErr) {
            console.error('Failed to start conversation with recipient:', createErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    const recipientId = searchParams.get('recipientId');
    fetchConversations(recipientId);
  }, [searchParams]);

  // ── 3. Select Conversation & Perform Client Key Agreement ──────────────────

  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMobileView('chat');
    setMenuOpen(false);
    setMessages([]);
    setMessagesLoading(true);
    setPage(0);
    setEncryptionStatus('initializing');
    setSharedAesKey(null);

    // Mark messages as read on backend
    try {
      await messageApi.markAsRead(conversation.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {
      console.warn('Failed to mark messages read:', e);
    }

    // 1. Fetch peer device public keys for ECDH agreement
    try {
      const keysRes = await messageApi.getDeviceKeys(conversation.otherUserId);
      const activeKeys = (keysRes.data || []).filter((k) => !k.isRevoked);

      if (activeKeys.length === 0) {
        setEncryptionStatus('no_peer_keys');
      } else {
        const primaryPeerKey = activeKeys[0];
        const peerKeyData = primaryPeerKey.publicKeyData || primaryPeerKey.publicKey;
        const importedPeerKey = await cryptoService.importPeerPublicKey(peerKeyData);
        setPeerPublicKey(importedPeerKey);

        // Derive shared AES-256-GCM key with HKDF
        const localKeyPair = deviceKeyPair || (await cryptoService.getOrCreateDeviceKeyPair());
        const derivedKey = await cryptoService.deriveSharedAesKey(
          localKeyPair.privateKey,
          importedPeerKey,
          conversation.id
        );
        setSharedAesKey(derivedKey);
        setEncryptionStatus('active');
      }
    } catch (cryptoErr) {
      console.warn('Peer key agreement failed:', cryptoErr);
      setEncryptionStatus('unsupported');
    }

    // 2. Fetch message history
    try {
      const historyRes = await messageApi.getMessages(conversation.id, 0, 50);
      const msgList = historyRes.data?.content || [];
      setMessages(msgList);
      setTotalPages(historyRes.data?.totalPages || 0);
    } catch (histErr) {
      console.error('Failed to load message history:', histErr);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ── 4. Decrypt Messages When AES Key is Active ─────────────────────────────

  useEffect(() => {
    if (!sharedAesKey || messages.length === 0) return;

    let isMounted = true;

    const decryptAll = async () => {
      const newCache = { ...decryptedCache };
      let updated = false;

      for (const msg of messages) {
        if (!newCache[msg.id] && msg.encryptedPayload && msg.iv) {
          const plain = await cryptoService.decryptMessage(
            msg.encryptedPayload,
            msg.iv,
            sharedAesKey
          );
          newCache[msg.id] = plain;
          updated = true;
        }
      }

      if (updated && isMounted) {
        setDecryptedCache(newCache);
      }
    };

    decryptAll();

    return () => {
      isMounted = false;
    };
  }, [sharedAesKey, messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!messagesLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesLoading]);

  // ── 5. Real-Time Conversation Subscriptions ────────────────────────────────

  useEffect(() => {
    if (!activeConversation || wsStatus !== 'CONNECTED') return;

    const convId = activeConversation.id;

    const unsubscribe = webSocketClient.subscribeConversation(
      convId,
      // On new message:
      async (incomingMsg) => {
        // Decrypt immediately if we have AES key
        if (sharedAesKey && incomingMsg.encryptedPayload && incomingMsg.iv) {
          const plain = await cryptoService.decryptMessage(
            incomingMsg.encryptedPayload,
            incomingMsg.iv,
            sharedAesKey
          );
          setDecryptedCache((prev) => ({ ...prev, [incomingMsg.id]: plain }));
        }

        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === incomingMsg.id)) {
            return prev.map((m) => (m.id === incomingMsg.id ? incomingMsg : m));
          }
          return [...prev, incomingMsg];
        });

        // Mark read if it's from peer and chat is active
        if (incomingMsg.senderId !== user?.id) {
          messageApi.markAsRead(convId).catch(() => {});
        }
      },
      // On read receipt:
      (receipt) => {
        const readerId = receipt?.readerId || receipt?.readByUserId;
        if (readerId && readerId !== user?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === user?.id ? { ...m, deliveryStatus: 'READ', readAt: receipt.readAt } : m
            )
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeConversation?.id, wsStatus, sharedAesKey, user?.id]);

  // ── 6. Send Encrypted Message ──────────────────────────────────────────────

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || sending || !activeConversation) return;

    if (encryptionStatus !== 'active' || !sharedAesKey) {
      alert(
        'Cannot send message: Recipient has not activated their device public key yet. End-to-end encryption cannot establish a secure session.'
      );
      return;
    }

    if (activeConversation.status === 'BLOCKED') {
      alert('This conversation is currently blocked.');
      return;
    }

    setSending(true);
    setInputText('');

    try {
      // 1. Client-Side Encryption via WebCrypto AES-256-GCM
      const { encryptedPayload, iv } = await cryptoService.encryptMessage(
        textToSend,
        sharedAesKey
      );

      // 2. Optimistic local UI item
      const tempId = 'temp-' + Date.now();
      const optimisticMsg = {
        id: tempId,
        conversationId: activeConversation.id,
        senderId: user?.id,
        encryptedPayload,
        iv,
        deliveryStatus: 'SENT',
        createdAt: new Date().toISOString(),
      };

      setDecryptedCache((prev) => ({ ...prev, [tempId]: textToSend }));
      setMessages((prev) => [...prev, optimisticMsg]);

      // 3. Send encrypted payload + IV to backend relay
      const res = await messageApi.sendMessage(activeConversation.id, {
        encryptedPayload,
        iv,
      });

      if (res.data) {
        const savedMsg = res.data;
        setDecryptedCache((prev) => ({ ...prev, [savedMsg.id]: textToSend }));
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );

        // Update conversation lastMessageAt in left panel
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id ? { ...c, lastMessageAt: savedMsg.createdAt } : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send encrypted message. Please check connection.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── 7. Block / Unblock Participant ─────────────────────────────────────────

  const handleToggleBlock = async () => {
    if (!activeConversation) return;
    
    // Who blocks can only unblock
    if (
      activeConversation.status === 'BLOCKED' &&
      activeConversation.blockedBy &&
      activeConversation.blockedBy !== user?.id
    ) {
      alert(`Only the participant who initiated the block (${activeConversation.otherUserName}) can unblock this conversation.`);
      return;
    }

    setBlockLoading(true);
    try {
      if (activeConversation.status === 'BLOCKED') {
        await messageApi.unblockUser(activeConversation.id);
        setActiveConversation((prev) => ({ ...prev, status: 'ACTIVE', blockedBy: null }));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, status: 'ACTIVE', blockedBy: null } : c))
        );
      } else {
        await messageApi.blockUser(activeConversation.id, 'User requested block');
        setActiveConversation((prev) => ({ ...prev, status: 'BLOCKED', blockedBy: user?.id }));
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, status: 'BLOCKED', blockedBy: user?.id } : c))
        );
      }
      setMenuOpen(false);
    } catch (err) {
      console.error('Error toggling block status:', err);
      const serverMessage = err.response?.data?.message || 'Action failed. Please try again.';
      alert(serverMessage);
    } finally {
      setBlockLoading(false);
    }
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherUserName?.toLowerCase().includes(q) ||
        c.otherUserEmail?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[550px] transition-colors">
      {/* Connectivity Ribbon (If Disconnected) */}
      {wsStatus !== 'CONNECTED' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-medium">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-time channel offline. Reconnecting to STOMP relay...</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider">{wsStatus}</span>
        </div>
      )}

      {/* Main Split-Pane Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── LEFT PANE: Conversations List ─────────────────────────────────── */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Messages</span>
                <span className="text-xs bg-bit-100 dark:bg-bit-950/60 text-bit-700 dark:text-bit-300 font-bold px-2 py-0.5 rounded-full border border-bit-200 dark:border-bit-800">
                  {conversations.length}
                </span>
              </h2>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bit-500/30"
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {conversationsLoading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="sm" text="Loading chats..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <User className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold">No conversations yet</p>
                <p className="text-[11px]">
                  Browse the <button onClick={() => navigate('/directory')} className="text-bit-600 font-bold hover:underline">Alumni Directory</button> to start a private chat.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3.5 flex items-start space-x-3 transition-colors ${
                      isSelected
                        ? 'bg-bit-50/80 dark:bg-bit-950/40 border-l-4 border-bit-600'
                        : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Avatar */}
                    {(conv.otherUserProfilePhotoUrl || conv.otherUserAvatar) ? (
                      <img
                        src={conv.otherUserProfilePhotoUrl || conv.otherUserAvatar}
                        alt={conv.otherUserName}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-bit-800 to-bit-600 text-white font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                        {conv.otherUserName?.charAt(0) || 'U'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {conv.otherUserName}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>Encrypted message</span>
                        </p>

                        {conv.unreadCount > 0 && (
                          <span className="bg-bit-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Chat View ─────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20 ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMobileView('list')}
                    className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {(activeConversation.otherUserProfilePhotoUrl || activeConversation.otherUserAvatar) ? (
                    <img
                      src={activeConversation.otherUserProfilePhotoUrl || activeConversation.otherUserAvatar}
                      alt={activeConversation.otherUserName}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-bit-800 to-bit-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                      {activeConversation.otherUserName?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {activeConversation.otherUserName}
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-bit-700 dark:text-bit-300">
                        {activeConversation.otherUserRole?.replace('ROLE_', '') || 'Member'}
                      </span>
                      <span>•</span>
                      {encryptionStatus === 'active' ? (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold space-x-1" title="Client-Side WebCrypto ECDH + AES-256-GCM encryption">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Client-Encrypted</span>
                        </span>
                      ) : encryptionStatus === 'no_peer_keys' ? (
                        <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-semibold space-x-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>No Device Key</span>
                        </span>
                      ) : (
                        <span>Initializing...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center space-x-2 relative">
                  <button
                    onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                    className="p-2 rounded-xl text-slate-400 hover:text-bit-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Cryptographic Security Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                      {activeConversation.status === 'BLOCKED' ? (
                        activeConversation.blockedBy === user?.id ? (
                          <button
                            onClick={handleToggleBlock}
                            disabled={blockLoading}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center space-x-2"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{blockLoading ? 'Unblocking...' : 'Unblock Participant'}</span>
                          </button>
                        ) : (
                          <div className="px-3.5 py-2 text-xs text-slate-400 italic flex items-center space-x-1.5">
                            <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>Blocked by {activeConversation.otherUserName}</span>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={handleToggleBlock}
                          disabled={blockLoading}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{blockLoading ? 'Blocking...' : 'Block Participant'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Cryptography Disclosure Banner */}
              {showSecurityInfo && (
                <div className="bg-bit-50/80 dark:bg-bit-950/60 border-b border-bit-200/60 dark:border-bit-800/60 p-3 text-xs text-bit-900 dark:text-bit-200 space-y-1 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-bit-600" />
                      <span>Security & Zero-Plaintext Architecture</span>
                    </span>
                    <button onClick={() => setShowSecurityInfo(false)} className="text-slate-400 hover:text-slate-600">×</button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Messages are encrypted in this browser using WebCrypto ECDH (NIST P-256) key agreement and authenticated AES-256-GCM. The BIT Connect backend and database store only encrypted ciphertext and IVs. No plaintext or private keys ever touch the server.
                  </p>
                </div>
              )}

              {/* No Peer Keys Warning Banner */}
              {encryptionStatus === 'no_peer_keys' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    <strong>Recipient Device Offline:</strong> {activeConversation.otherUserName} has not registered an active device key. Outgoing messages are paused until the recipient initializes their client session.
                  </p>
                </div>
              )}

              {/* Blocked Conversation Notice */}
              {activeConversation.status === 'BLOCKED' && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2">
                  <span className="flex items-center space-x-2">
                    <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      {activeConversation.blockedBy === user?.id
                        ? `You have blocked ${activeConversation.otherUserName}. They cannot send you messages.`
                        : `You have been blocked by ${activeConversation.otherUserName}. Messaging is disabled.`}
                    </span>
                  </span>
                  {activeConversation.blockedBy === user?.id && (
                    <button
                      onClick={handleToggleBlock}
                      disabled={blockLoading}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition flex-shrink-0"
                    >
                      {blockLoading ? 'Unblocking...' : 'Unblock'}
                    </button>
                  )}
                </div>
              )}

              {/* Message History Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
              >
                {messagesLoading ? (
                  <div className="p-8 text-center">
                    <LoadingSpinner size="md" text="Decrypting message history..." />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
                    <Lock className="w-8 h-8 text-bit-600/40" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      End-to-End Encrypted Conversation
                    </p>
                    <p className="text-[11px] text-center max-w-xs">
                      Send a secure message to start the conversation. Only you and {activeConversation.otherUserName} can read what is sent.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    const decryptedText = decryptedCache[msg.id];
                    const prevMsg = messages[index - 1];
                    const showDateHeader =
                      !prevMsg ||
                      formatDateHeader(prevMsg.createdAt) !== formatDateHeader(msg.createdAt);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <div className="flex justify-center my-2">
                            <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full shadow-2xs">
                              {formatDateHeader(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 space-y-1 shadow-xs ${
                              isMe
                                ? 'bg-bit-700 text-white rounded-br-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-bl-xs'
                            }`}
                          >
                            <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                              {decryptedText ? (
                                decryptedText.startsWith('[Encrypted message cannot be decrypted') ? (
                                  <span className="text-amber-200 dark:text-amber-300 font-medium italic text-[11px] flex items-start space-x-1.5 py-0.5">
                                    <AlertCircle className="w-3.5 h-3.5 inline mt-0.5 flex-shrink-0 text-amber-400" />
                                    <span>{decryptedText}</span>
                                  </span>
                                ) : (
                                  decryptedText
                                )
                              ) : (
                                <span className="italic opacity-60 text-[11px] flex items-center space-x-1">
                                  <Lock className="w-3 h-3 inline mr-1" />
                                  <span>Decrypting payload...</span>
                                </span>
                              )}
                            </p>

                            <div
                              className={`flex items-center justify-end space-x-1 text-[10px] ${
                                isMe ? 'text-bit-100/80' : 'text-slate-400'
                              }`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe && (
                                <span>
                                  {msg.deliveryStatus === 'READ' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" title="Read" />
                                  ) : msg.deliveryStatus === 'DELIVERED' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-300 inline" title="Delivered" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-300 inline" title="Sent" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={
                        activeConversation.status === 'BLOCKED'
                          ? 'Conversation is blocked'
                          : encryptionStatus !== 'active'
                          ? 'Recipient encryption keys unavailable'
                          : 'Type an encrypted message...'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={activeConversation.status === 'BLOCKED' || encryptionStatus !== 'active' || sending}
                      className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-bit-500/50 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bit-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !inputText.trim() ||
                      activeConversation.status === 'BLOCKED' ||
                      encryptionStatus !== 'active' ||
                      sending
                    }
                    className="p-2.5 rounded-2xl bg-bit-700 text-white hover:bg-bit-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex-shrink-0"
                    title="Send Encrypted Message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-bit-50 dark:bg-bit-950/60 text-bit-700 dark:text-bit-300 flex items-center justify-center shadow-xs border border-bit-200 dark:border-bit-800">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                BIT Connect Private Messaging
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Select an existing conversation from the list or visit the Alumni Directory to start a one-to-one encrypted conversation.
              </p>
              <button
                onClick={() => navigate('/directory')}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-700 text-white font-bold text-xs hover:bg-bit-800 transition shadow-xs"
              >
                <span>Browse Alumni Directory</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
