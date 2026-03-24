import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Image, MapPin, Smile, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket, type ConnectionStatus } from '@/services/useWebSocket';
import { useMessages, useActivity, useCurrentUser } from '@/services/hooks';
import api from '@/services/api';
import type { ChatMessage } from '@/types/chat';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { color: string; label: string }> = {
    connected: { color: 'bg-secondary', label: 'Conectado' },
    connecting: { color: 'bg-primary animate-pulse', label: 'Conectando...' },
    disconnected: { color: 'bg-muted', label: 'Desconectado' },
    error: { color: 'bg-error', label: 'Error' },
  };

  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`block h-2 w-2 rounded-full ${color}`} />
      <span className="font-label text-[10px] text-muted">{label}</span>
      {status === 'connected' ? (
        <Wifi size={10} className="text-secondary" />
      ) : (
        <WifiOff size={10} className="text-muted" />
      )}
    </div>
  );
}

function TypingIndicator({ userName }: { userName?: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {userName && (
        <span className="font-label text-[10px] text-muted mr-1">{userName}</span>
      )}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

interface TypingUser {
  id: number;
  full_name: string;
  avatar: string;
}

export default function ChatPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the current user from the API
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? 0;

  // Fetch activity details for the header
  const { data: activity } = useActivity(activityId);
  const activityTitle = activity?.title ?? `Actividad #${activityId}`;
  const participantCount = activity?.confirmed_count ?? 0;

  // HTTP fetch for initial messages (used as secondary fallback)
  const { data: httpMessages } = useMessages(activityId ? Number(activityId) : undefined);

  // WebSocket connection
  const wsUrl = `ws://${window.location.host}/ws/chat/activity/${activityId}/`;

  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as { type?: string; [key: string]: unknown };

    if (msg.type === 'message_history') {
      // Received initial history from WebSocket
      const history = msg.messages as ChatMessage[] | undefined;
      if (history && history.length > 0) {
        setMessages(history);
      }
    } else if (msg.type === 'message') {
      // New incoming message
      const chatMsg = msg as unknown as ChatMessage;
      if (chatMsg.id && chatMsg.author) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === chatMsg.id)) return prev;
          return [...prev, chatMsg];
        });
      }
    } else if (msg.type === 'typing') {
      const user = msg.user as TypingUser | undefined;
      if (user && user.id !== currentUserId) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) return prev;
          return [...prev, user];
        });

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.id !== user.id));
        }, 3000);
      }
    }
  }, [currentUserId]);

  const handleWsError = useCallback(() => {
    // Fall back to HTTP messages if WebSocket fails
    if (messages.length === 0 && httpMessages) {
      setMessages(httpMessages);
    }
  }, [messages.length, httpMessages]);

  const handleWsClose = useCallback(() => {
    // If we never got messages, use HTTP fallback
    if (messages.length === 0 && httpMessages) {
      setMessages(httpMessages);
    }
  }, [messages.length, httpMessages]);

  const { sendMessage, status } = useWebSocket({
    url: wsUrl,
    onMessage: handleWsMessage,
    onError: handleWsError,
    onClose: handleWsClose,
    reconnectAttempts: 3,
    reconnectInterval: 2000,
  });

  // Derive displayed messages: prefer WebSocket messages, fall back to HTTP
  const displayedMessages = useMemo(
    () => (messages.length > 0 ? messages : (httpMessages ?? [])),
    [messages, httpMessages],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, typingUsers]);

  const handleReaction = (messageId: number, emoji: string) => {
    // Optimistic update: toggle reaction locally
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions?.find(
          (r) => r.emoji === emoji && r.user_id === currentUserId
        );
        if (existing) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(
              (r) => !(r.emoji === emoji && r.user_id === currentUserId)
            ),
          };
        }
        return {
          ...msg,
          reactions: [
            ...(msg.reactions || []),
            { id: Date.now(), emoji, user_id: currentUserId },
          ],
        };
      })
    );
    // Send reaction via API
    api.post(`/chat/messages/${messageId}/reactions/`, { emoji }).catch(() => {});
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const content = inputValue.trim();

    if (status === 'connected') {
      // Send via WebSocket
      sendMessage({
        type: 'message',
        message_type: 'text',
        content,
      });
    }

    // Optimistically add the message locally
    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      author: {
        id: currentUserId,
        full_name: currentUser?.full_name ?? 'Tú',
        avatar: currentUser?.avatar ?? '',
      },
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send typing indicator via WebSocket
    if (status === 'connected') {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendMessage({ type: 'typing' });
      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant"
        style={{
          background: 'rgba(17,20,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-base font-bold text-on-surface truncate">
            {activityTitle}
          </h1>
          <div className="flex items-center gap-2">
            <p className="font-label text-xs text-muted">
              {participantCount} participantes
            </p>
            <ConnectionIndicator status={status} />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {displayedMessages.map((msg) => {
            const isOwn = msg.author.id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`group relative flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {!isOwn && (
                  <img
                    src={msg.author.avatar}
                    alt={msg.author.full_name}
                    className="h-7 w-7 rounded-full object-cover border border-outline-variant shrink-0 mt-1"
                  />
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    isOwn
                      ? 'bg-primary-container text-[#442c00] rounded-br-md'
                      : 'bg-surface-container-high text-on-surface rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className="font-label text-xs font-semibold text-primary mb-0.5">
                      {msg.author.full_name}
                    </p>
                  )}

                  {msg.message_type === 'system' ? (
                    <p className="font-body text-xs text-muted italic text-center">{msg.content}</p>
                  ) : (
                    <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                  )}

                  <p
                    className={`font-label text-[10px] mt-1 text-right ${
                      isOwn ? 'text-[#442c00]/60' : 'text-muted'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>

                  {/* Reaction badges */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(
                        msg.reactions.reduce((acc: Record<string, number>, r: { emoji: string }) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <span
                          key={emoji}
                          className="inline-flex items-center gap-0.5 rounded-full bg-surface-container-highest/60 px-1.5 py-0.5 text-[10px] cursor-pointer hover:bg-surface-container-highest transition-colors"
                          onClick={() => handleReaction(msg.id, emoji)}
                        >
                          {emoji} {count as number > 1 && <span className="font-label text-muted">{count as number}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick reaction button */}
                <button
                  type="button"
                  onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                  className="self-end opacity-0 group-hover:opacity-100 transition-opacity mb-1 cursor-pointer"
                >
                  <Smile size={14} className="text-muted hover:text-primary" />
                </button>

                {/* Emoji picker */}
                {reactionPickerMsgId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute ${isOwn ? 'right-12' : 'left-12'} bottom-0 z-20 flex gap-1 rounded-full bg-surface-container-high px-2 py-1 shadow-lg border border-outline-variant`}
                  >
                    {['👍', '❤️', '😂', '🔥', '🎉', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          handleReaction(msg.id, emoji);
                          setReactionPickerMsgId(null);
                        }}
                        className="text-lg hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <img
              src={typingUsers[0].avatar}
              alt={typingUsers[0].full_name}
              className="h-7 w-7 rounded-full object-cover border border-outline-variant"
            />
            <div className="rounded-2xl bg-surface-container-high px-3 py-2 rounded-bl-md">
              <TypingIndicator userName={typingUsers[0].full_name} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="border-t border-outline-variant px-3 py-3"
        style={{
          background: 'rgba(17,20,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-on-surface-variant transition-colors cursor-pointer"
            >
              <Smile size={20} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-on-surface-variant transition-colors cursor-pointer"
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-on-surface-variant transition-colors cursor-pointer"
            >
              <MapPin size={20} />
            </button>
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje\u2026"
            className="flex-1 rounded-full bg-surface-container-high border border-outline-variant px-4 py-2.5 text-sm text-on-surface placeholder:text-muted font-body outline-none focus:border-primary transition-colors"
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#442c00] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity"
            style={{
              background: inputValue.trim()
                ? 'linear-gradient(135deg, #ffc56c, #f0a500)'
                : 'rgba(255,197,108,0.3)',
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
