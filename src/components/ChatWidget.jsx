import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hi! I can answer questions about my projects, skills, and certifications. What would you like to know?'
  }
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const panelClasses = useMemo(() => {
    return isOpen
      ? 'opacity-100 translate-y-0 pointer-events-auto'
      : 'opacity-0 translate-y-4 pointer-events-none';
  }, [isOpen]);

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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`mb-3 w-[calc(100vw-2rem)] max-w-[24rem] overflow-hidden rounded-2xl border border-white/10 bg-[#080314]/90 shadow-[0_20px_80px_rgba(225,29,72,0.25)] backdrop-blur-xl transition-all duration-300 sm:mb-0 sm:w-[24rem] ${panelClasses}`}>
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

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#e11d48] to-[#f43f5e] text-white shadow-[0_12px_35px_rgba(225,29,72,0.35)] transition hover:scale-105"
        aria-label="Toggle chat"
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
