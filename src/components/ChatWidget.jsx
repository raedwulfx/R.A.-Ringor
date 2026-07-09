import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hi! I can answer questions about my projects, skills, and certifications. What would you like to know?'
  }
];

const CHATHEAD_SIZE = 56;
const EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 8;
const TAP_MAX_DURATION = 220;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 24 });
  const [dockedSide, setDockedSide] = useState('right');
  const [panelHeight, setPanelHeight] = useState(0);
  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    startedAt: 0
  });
  const ignoreClickRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const heroSection = document.getElementById('Home');
    if (!heroSection) {
      setIsVisible(true);
      return;
    }

    if (typeof window.IntersectionObserver === 'undefined') {
      const rect = heroSection.getBoundingClientRect();
      setIsVisible(rect.bottom <= 0);
      return;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem('chat-widget-position');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const nextSide = parsed.dockedSide === 'left' ? 'left' : 'right';
        const nextY = typeof parsed.y === 'number' ? parsed.y : 24;
        const viewportWidth = window.innerWidth || 390;
        const nextX = nextSide === 'left' ? EDGE_MARGIN : viewportWidth - CHATHEAD_SIZE - EDGE_MARGIN;
        setDockedSide(nextSide);
        setPosition({ x: clamp(nextX, EDGE_MARGIN, viewportWidth - CHATHEAD_SIZE - EDGE_MARGIN), y: clamp(nextY, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerHeight - CHATHEAD_SIZE - EDGE_MARGIN)) });
        return;
      } catch {
        // Fall back to default position.
      }
    }

    const viewportWidth = window.innerWidth || 390;
    setPosition({
      x: viewportWidth - CHATHEAD_SIZE - EDGE_MARGIN,
      y: 24
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('chat-widget-position', JSON.stringify({ dockedSide, y: position.y }));
  }, [dockedSide, position.y]);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      setPanelHeight(panelRef.current.getBoundingClientRect().height);
    }
  }, [isOpen, messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isLoading) return;

    const nextMessages = [
      ...messages,
      { id: Date.now(), role: 'user', content: trimmed }
    ];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.map(({ role, content }) => ({ role, content }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to respond right now.');
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.reply || 'I can help with questions about my portfolio.'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointerDown = (event) => {
    if (!isVisible || event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
      startedAt: Date.now()
    };
    setIsDragging(true);
    ignoreClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current.active) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    if (!dragStateRef.current.moved && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      dragStateRef.current.moved = true;
    }

    if (dragStateRef.current.moved) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const nextX = clamp(dragStateRef.current.originX + deltaX, EDGE_MARGIN, viewportWidth - CHATHEAD_SIZE - EDGE_MARGIN);
      const nextY = clamp(dragStateRef.current.originY + deltaY, EDGE_MARGIN, Math.max(EDGE_MARGIN, viewportHeight - CHATHEAD_SIZE - EDGE_MARGIN));
      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (event) => {
    if (!dragStateRef.current.active) {
      return;
    }

    const moved = dragStateRef.current.moved;
    const elapsed = Date.now() - dragStateRef.current.startedAt;
    if (!moved && elapsed <= TAP_MAX_DURATION) {
      ignoreClickRef.current = true;
      setIsOpen((current) => !current);
    }

    const viewportWidth = window.innerWidth;
    const snappedX = event.clientX > viewportWidth / 2 ? viewportWidth - CHATHEAD_SIZE - EDGE_MARGIN : EDGE_MARGIN;
    const nextSide = snappedX === EDGE_MARGIN ? 'left' : 'right';
    setDockedSide(nextSide);
    setPosition((current) => ({
      x: snappedX,
      y: clamp(current.y, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerHeight - CHATHEAD_SIZE - EDGE_MARGIN))
    }));
    setIsDragging(false);
    dragStateRef.current.active = false;
    dragStateRef.current.moved = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleToggle = () => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    setIsOpen((current) => !current);
  };

  const panelTop = clamp(
    position.y + CHATHEAD_SIZE - panelHeight,
    EDGE_MARGIN,
    Math.max(EDGE_MARGIN, window.innerHeight - panelHeight - EDGE_MARGIN)
  );

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute w-[calc(100vw-2rem)] max-w-[24rem] overflow-hidden rounded-2xl border border-white/10 bg-[#080314]/90 shadow-[0_20px_80px_rgba(225,29,72,0.25)] backdrop-blur-xl transition-all duration-300 pointer-events-auto sm:w-[24rem]"
          style={{
            [dockedSide === 'left' ? 'left' : 'right']: `${EDGE_MARGIN}px`,
            top: `${panelTop}px`
          }}
        >
          <div className="border-b border-white/10 bg-gradient-to-r from-[#e11d48]/20 via-[#111827]/70 to-[#f43f5e]/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e11d48] to-[#fb7185] text-white shadow-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Portfolio Assistant</p>
                  <p className="text-xs text-slate-400">Ask about my work and experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-4 py-3 sm:max-h-[420px]"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#e11d48] to-[#f43f5e] text-white'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  Thinking...
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-white/10 bg-[#0b0615]/90 px-3 py-3">
            <label className="sr-only" htmlFor="chat-input">Type your message</label>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Message the assistant..."
                className="flex-1 bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#e11d48] to-[#fb7185] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`pointer-events-auto absolute flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gradient-to-r from-[#e11d48] to-[#f43f5e] text-white shadow-[0_12px_35px_rgba(225,29,72,0.35)] transition-all duration-300 ease-out hover:scale-105 ${isVisible ? 'opacity-100 visible translate-y-0 scale-100' : 'pointer-events-none invisible opacity-0 translate-y-2 scale-95'} ${isOpen ? 'z-0 opacity-70 scale-95' : 'z-10'} ${isDragging ? 'transition-none' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none'
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
