import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PetChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Msg { role: 'user' | 'assistant'; content: string }

const WELCOME = '客官来啦~ 嘿嘿，我是往生堂七十七代堂主胡桃！学习上有想不通的、生活里想唠两句的，都尽管说！本堂主上知天文下知地理（大半个大陆吧）~';

/** 胡桃自由对话面板：桌宠双击打开，走 /api/ai（服务端已注入胡桃馆员人设）。 */
export const PetChatPanel: React.FC<PetChatPanelProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'auto', messages: next.slice(-14) }),
      });
      const j = await res.json();
      const reply = j?.choices?.[0]?.message?.content || '哎呀，堂主走神了……再说一遍嘛~';
      setMessages(prev => [...prev, { role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `通信断了：${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed right-4 bottom-4 z-[1100] w-[min(400px,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] bg-bg-card border border-orange-300/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-500/15 to-transparent border-b border-border">
              <img src="/images/HuTao/hutao68.png" alt="胡桃" className="w-9 h-9 rounded-full border-2 border-orange-300/60 object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-text-primary text-sm">胡桃 · 往生堂堂主</div>
                <div className="text-[11px] text-text-muted">陪你学习，也陪你唠嗑~</div>
              </div>
              <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tl-sm bg-bg-base text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap">
                  {WELCOME}
                </div>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={
                    m.role === 'user'
                      ? 'max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-sm bg-accent text-white text-[13px] leading-relaxed whitespace-pre-wrap'
                      : 'max-w-[92%] px-3 py-2 rounded-2xl rounded-tl-sm bg-bg-base text-[13px] leading-relaxed text-text-primary prose prose-sm dark:prose-invert max-w-none prose-pre:bg-black/40'
                  }>
                    {m.role === 'assistant'
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-bg-base text-text-secondary flex items-center gap-2 text-[13px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> 堂主思考中…
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="p-2.5 border-t border-border">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={2}
                  placeholder="跟堂主说点什么…（Enter 发送）"
                  className="flex-1 resize-none px-3 py-2 bg-bg-base border border-border rounded-xl text-[13px] text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={send}
                  disabled={busy || !input.trim()}
                  className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
