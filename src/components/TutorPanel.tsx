import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, BookOpenCheck, Compass, ClipboardCheck, Hammer, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../utils/cn';

export type TutorMode = 'socratic' | 'explain' | 'quiz' | 'practice';

interface TutorPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

interface Msg { role: 'user' | 'assistant'; content: string }

const MODES: { id: TutorMode; label: string; icon: React.ElementType; greet: string }[] = [
  { id: 'socratic', label: '引导', icon: Compass, greet: '嘿嘿~ 客官，胡桃我用提问带你一步步想通这篇教程。随时可以说「不会，直接讲」，我就切换成直接讲解~\n\n先热热身：这篇教程想解决的核心问题是什么？用你的话说说看？' },
  { id: 'explain', label: '讲解', icon: BookOpenCheck, greet: '直接讲解模式开啦~ 把想弄懂的段落、概念或代码贴出来，或者直接问「XX 是什么/为什么」，胡桃一次讲透一个点，保证不糊弄客官！' },
  { id: 'quiz', label: '检验', icon: ClipboardCheck, greet: '准备好了就说「开始」~ 胡桃出 3 道题（概念/场景/动手各一道）逐一检验，答完逐题批改打分。答错也不许哭鼻子哦，嘿嘿~' },
  { id: 'practice', label: '实操', icon: Hammer, greet: '说「来个练习」，胡桃基于这篇教程给你设计一个 30-60 分钟的实战小练习，带分解步骤和验收标准——练成了可是很有成就感的！' },
];

export const TutorPanel: React.FC<TutorPanelProps> = ({ open, onClose, title, content }) => {
  const [mode, setMode] = useState<TutorMode>('socratic');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // reset conversation when the tutorial changes
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [title]);

  const greet = useMemo(
    () => MODES.find(m => m.id === mode)!.greet,
    [mode]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          title,
          content,
          messages: next.slice(-12).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || data?.error || '（助教暂时离线，请稍后再试）';
      setMessages(prev => [...prev, { role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `网络出错：${e.message}` }]);
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
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-text-primary">胡桃助教</span>
              </div>
              <p className="text-xs text-text-muted truncate mt-0.5">《{title}》· 堂主亲自带学</p>
            </div>
              <button onClick={onClose} className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* mode tabs */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto custom-scrollbar">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
                      mode === m.id
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-bg-base text-text-secondary hover:text-accent'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
              <div className="flex justify-start">
                <div className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-base text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {greet}
                </div>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  {m.role === 'user' ? (
                    <div className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tr-sm bg-accent text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[92%] px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-base text-sm text-text-primary leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-pre:bg-black/40">
                      {/* 铁律：AI 生成的外链一律降级为纯文本，站内路径升级为路由链接 */}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => {
                            const h = href || '';
                            if (/^https?:\/\//i.test(h)) {
                              return (
                                <span
                                  className="text-text-muted"
                                  title="站内不提供外部链接"
                                >
                                  {children}
                                </span>
                              );
                            }
                            if (h.startsWith('/')) {
                              return <Link to={h} className="text-accent hover:underline">{children}</Link>;
                            }
                            return <span>{children}</span>;
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-base text-text-secondary flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> 助教思考中…
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="p-3 border-t border-border">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="问点什么…（Enter 发送，Shift+Enter 换行）"
                  className="flex-1 resize-none px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  className="p-3 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
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
