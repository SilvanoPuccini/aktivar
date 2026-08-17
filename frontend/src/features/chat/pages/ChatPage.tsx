import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, MapPin, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import CTAButton from '@/components/CTAButton';
import api from '@/services/api';
import { useActivity, useCurrentUser, useMessages } from '@/services/hooks';
import { useWebSocket, type ConnectionStatus } from '@/services/useWebSocket';
import type { ChatMessage } from '@/types/chat';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: activity } = useActivity(activityId);
  const { data: httpMessages } = useMessages(activityId ? Number(activityId) : undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${window.location.host}/ws/chat/activity/${activityId}/`;

  const onWsMessage = useCallback((data: unknown) => {
    const payload = data as { type?: string; messages?: ChatMessage[]; message?: ChatMessage; full_name?: string; user_id?: number };
    if (payload.type === 'message_history' && payload.messages) setMessages(payload.messages);
    else if (payload.type === 'message' && payload.message) setMessages((prev) => prev.some((m) => m.id === payload.message?.id) ? prev : [...prev, payload.message!]);
    else if (payload.type === 'typing' && payload.user_id !== currentUser?.id && payload.full_name) {
      setTypingNames((prev) => prev.includes(payload.full_name!) ? prev : [...prev, payload.full_name!]);
      setTimeout(() => setTypingNames((prev) => prev.filter((name) => name !== payload.full_name)), 2500);
    }
  }, [currentUser?.id]);

  const { sendMessage, status } = useWebSocket({ url: wsUrl, onMessage: onWsMessage, reconnectAttempts: 3, reconnectInterval: 2000 });

  const displayedMessages = useMemo(() => messages.length > 0 ? messages : (httpMessages ?? []), [messages, httpMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayedMessages, typingNames]);

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
      setInputValue('');
      return;
    }

    toast.error('Sin conexión al chat. Reintentando…');
  };

  const handleReaction = (messageId: number, emoji: string) => {
    setMessages((prev) => prev.map((message) => message.id !== messageId ? message : ({ ...message, reactions: [...(message.reactions || []), { id: Date.now(), emoji, user_id: currentUser?.id ?? 0 }] })));
    api.post(`/chat/messages/${messageId}/reactions/`, { emoji }).catch(() => undefined);
  };

  const connectionPill: Record<ConnectionStatus, string> = {
    connected: 'text-secondary',
    connecting: 'text-primary',
    disconnected: 'text-on-surface-variant',
    error: 'text-error',
  };
  const tripSubtitle = activity
    ? `${new Date(activity.start_datetime).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric' })} • ${activity.confirmed_count} participantes`
    : 'Group chat';

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest text-on-surface">
      <header className="glass fixed inset-x-0 top-0 z-20 border-b border-outline-variant/10">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:max-w-4xl md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-primary cursor-pointer"><ArrowLeft size={18} /></button>
            <div>
              <p className="font-headline text-xl font-black tracking-tight text-primary-container md:text-2xl">{activity?.title ?? `Actividad ${activityId}`}</p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-primary">{tripSubtitle}</p>
                <div className={`flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] ${connectionPill[status]}`}>{status === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}{status}</div>
              </div>
            </div>
          </div>
          {currentUser && (
            <Avatar src={currentUser.avatar} alt={currentUser.full_name} size="md" className="border border-outline-variant/30" />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-32 pt-24 md:max-w-4xl md:px-6 lg:px-8">
        <div className="my-6 flex justify-center">
          <span className="rounded-full border border-outline-variant/10 bg-surface-container px-4 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Today</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {displayedMessages.map((message, index) => {
            const own = message.author.id === currentUser?.id;
            const showAvatar = !own && (index === 0 || displayedMessages[index - 1]?.author.id !== message.author.id);
            return (
              <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'} gap-3`}>
                {!own && <div className="w-10 shrink-0">{showAvatar ? <Avatar src={message.author.avatar} alt={message.author.full_name} size="sm" /> : null}</div>}
                <div className={`max-w-[80%] ${own ? '' : 'pt-1'}`}>
                  {!own && showAvatar && <p className="mb-1 ml-1 font-headline text-xs font-bold text-on-surface-variant">{message.author.full_name}</p>}
                  <div className={`rounded-sm px-4 py-3 ${own ? 'rounded-bl-md rounded-br-md rounded-tl-md bg-primary-container text-[#442c00]' : 'rounded-br-md rounded-bl-md rounded-tr-md bg-surface-container text-on-surface'}`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className={`mt-3 flex items-center justify-between gap-4 ${own ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>
                    <span className="font-label text-[10px] uppercase tracking-[0.16em]">{formatTime(message.created_at)}</span>
                    <div className="flex gap-1">
                      {['🔥', '🙌', '⛰️'].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => handleReaction(message.id, emoji)} className="cursor-pointer text-xs opacity-80 hover:opacity-100">{emoji}</button>
                      ))}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            );
          })}

          {typingNames.length > 0 && <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{typingNames.join(', ')} escribiendo…</p>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="glass fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant/10 pb-safe">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 md:max-w-4xl md:px-6 lg:px-8">
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant cursor-pointer hover:text-primary"><Image size={18} /></button>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant cursor-pointer hover:text-primary"><MapPin size={18} /></button>
          <input value={inputValue} onChange={(e) => { setInputValue(e.target.value); if (status === 'connected') sendMessage({ type: 'typing' }); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }} className="editorial-input flex-1" placeholder="Escribe al grupo" />
          <CTAButton label="Enviar" icon={<Send size={14} />} onClick={handleSend} size="sm" />
        </div>
      </div>
    </div>
  );
}
