import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Image, MapPin, Smile } from 'lucide-react';
import { mockUsers } from '@/data/users';

interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const currentUserId = mockUsers[0].id;

const mockMessages: Message[] = [
  {
    id: 1,
    senderId: mockUsers[1].id,
    text: '¡Hola a todos! ¿Listos para la actividad?',
    timestamp: '10:30',
    isOwn: false,
  },
  {
    id: 2,
    senderId: mockUsers[0].id,
    text: '¡Sí! Ya tengo todo preparado. Zapatillas de trekking, agua y snacks.',
    timestamp: '10:32',
    isOwn: true,
  },
  {
    id: 3,
    senderId: mockUsers[2].id,
    text: '¿Alguien sabe si hay estacionamiento cerca del punto de encuentro?',
    timestamp: '10:35',
    isOwn: false,
  },
  {
    id: 4,
    senderId: mockUsers[5].id,
    text: 'Sí, hay un estacionamiento gratuito a 200 metros. Yo puedo llevar a 3 personas desde el metro.',
    timestamp: '10:37',
    isOwn: false,
  },
  {
    id: 5,
    senderId: mockUsers[0].id,
    text: '¡Genial Andrés! Yo necesito que me lleven 🙋‍♀️',
    timestamp: '10:38',
    isOwn: true,
  },
  {
    id: 6,
    senderId: mockUsers[4].id,
    text: '¿A qué hora nos juntamos exactamente? El evento dice 7:00 pero ¿llegamos antes?',
    timestamp: '10:42',
    isOwn: false,
  },
  {
    id: 7,
    senderId: mockUsers[1].id,
    text: 'Yo diría llegar 6:45 para organizarnos y partir todos juntos.',
    timestamp: '10:44',
    isOwn: false,
  },
  {
    id: 8,
    senderId: mockUsers[0].id,
    text: 'Perfecto, nos vemos a las 6:45 entonces. ¡No olviden bloqueador solar!',
    timestamp: '10:45',
    isOwn: true,
  },
  {
    id: 9,
    senderId: mockUsers[2].id,
    text: '¡Listo! Llevo mi cámara también para sacar fotos del grupo en la cumbre 📸',
    timestamp: '10:48',
    isOwn: false,
  },
  {
    id: 10,
    senderId: mockUsers[5].id,
    text: 'Revisen el clima mañana por si acaso. Vi que podría haber algo de viento.',
    timestamp: '11:02',
    isOwn: false,
  },
];

function getUserById(id: number) {
  return mockUsers.find((u) => u.id === id) ?? mockUsers[0];
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
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

export default function ChatPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Activity title based on id (simple mock lookup)
  const activityTitle = activityId === '1'
    ? 'Trekking Cerro Manquehue'
    : `Actividad #${activityId}`;

  const participantCount = 13;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      senderId: currentUserId,
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
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
          <p className="font-label text-xs text-muted">
            {participantCount} participantes
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const user = getUserById(msg.senderId);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex gap-2 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {!msg.isOwn && (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    className="h-7 w-7 rounded-full object-cover border border-outline-variant shrink-0 mt-1"
                  />
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    msg.isOwn
                      ? 'bg-primary-container text-[#442c00] rounded-br-md'
                      : 'bg-surface-container-high text-on-surface rounded-bl-md'
                  }`}
                >
                  {!msg.isOwn && (
                    <p className="font-label text-xs font-semibold text-primary mb-0.5">
                      {user.full_name}
                    </p>
                  )}
                  <p className="font-body text-sm leading-relaxed">{msg.text}</p>
                  <p
                    className={`font-label text-[10px] mt-1 text-right ${
                      msg.isOwn ? 'text-[#442c00]/60' : 'text-muted'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <img
              src={mockUsers[1].avatar}
              alt={mockUsers[1].full_name}
              className="h-7 w-7 rounded-full object-cover border border-outline-variant"
            />
            <div className="rounded-2xl bg-surface-container-high px-3 py-2 rounded-bl-md">
              <TypingIndicator />
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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje…"
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
