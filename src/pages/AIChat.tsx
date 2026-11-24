import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Square, Trash2, Copy, Check, ShieldCheck, User, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';
import { MarkdownView } from '../components/markdown/MarkdownView';
import { readModelStream as readStream } from '../lib/sse';
import { cn } from '../utils/cn';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  /** 正在接收流式输出 */
  streaming?: boolean;
}

const SUGGESTIONS = [
  '零基础学编程，该从哪个知识域开始？',
  '讲讲 TCP 三次握手',
  '站里有哪些 Rust 教程？',
  '帮我规划一条 Java 后端学习路线',
];

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '嘿嘿~ 客官好呀！我是往生堂七十七代堂主**胡桃**，兼修 AI 馆员一职。\n\n我读过馆里全部的教程，可以陪你：\n\n- **答疑**：讲解某个知识点（「讲讲 TCP 三次握手」）\n- **找书**：推荐站内教程与专题（「站里有哪些 Rust 教程？」）\n- **规划**：按职业路线安排学习阶段\n\n知识胡桃一定讲准，玩笑胡桃管够！',
};

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const [copied, setCopied] = useState(false);
  const { config } = useData();
  const isUser = msg.role === 'user';

  const copy = async () => {
    try { await navigator.clipboard.writeText(msg.content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* 剪贴板不可用时忽略 */ }
  };

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full',
          isUser ? 'bg-accent/15 text-accent' : 'border border-orange-300/50 bg-bg-card'
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : config?.profile?.avatar ? (
          <img src={config.profile.avatar} alt="胡桃" className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="h-4 w-4 text-accent" />
        )}
      </span>
      <div className={cn('min-w-0 max-w-[86%] sm:max-w-[78%]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block max-w-full rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed',
            isUser
              ? 'rounded-tr-md bg-accent text-white'
              : msg.isError
                ? 'rounded-tl-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300'
                : 'rounded-tl-md border border-border/60 bg-bg-card text-text-primary'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          ) : (
            <div className={cn('prose prose-sm max-w-none leading-relaxed text-text-primary dark:prose-invert', msg.isError && 'whitespace-pre-wrap')}>
              <MarkdownView content={msg.content} />
              {msg.streaming && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent animate-pulse" aria-label="正在输入" />}
            </div>
          )}
        </div>
        {!isUser && !msg.streaming && !msg.isError && msg.content && (
          <button
            type="button"
            onClick={copy}
            aria-label="复制这条回复"
            className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-card hover:text-accent"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? '已复制' : '复制'}
          </button>
        )}
      </div>
    </div>
  );
};

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const stickBottom = useRef(true);

  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const ask = useCallback(async (question: string, history: ChatMessage[]) => {
    const q = question.trim();
    if (!q) return;
    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: q };
    const replyId = nextId();
    const next = [...history, userMsg];
    setMessages([...next, { id: replyId, role: 'assistant', content: '', streaming: true }]);
    setSending(true);
    stickBottom.current = true;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'auto',
          stream: true,
          // 人设由服务端统一注入；只带最近的对话
          messages: next.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const isStream = (res.headers.get('content-type') || '').includes('text/event-stream');
      if (isStream && res.body) {
        await readStream(res, (delta) => patch(replyId, (m) => ({ ...m, content: m.content + delta })), ctrl.signal);
      } else {
        const j = await res.json();
        const text = j.choices?.[0]?.message?.content || j.error || '（模型没有返回内容）';
        patch(replyId, (m) => ({ ...m, content: text }));
      }
      patch(replyId, (m) => (m.content.trim() ? { ...m, streaming: false } : { ...m, streaming: false, isError: true, content: '模型没有返回内容，换个问法再试试。' }));
    } catch (e: any) {
      if (e.name === 'AbortError') {
        patch(replyId, (m) => ({ ...m, streaming: false }));
      } else {
        patch(replyId, (m) => ({
          ...m,
          streaming: false,
          isError: true,
          content: m.content || '请求失败：内网推理服务可能没启动，或模型网关暂时不可达。',
        }));
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [patch]);

  const stop = () => abortRef.current?.abort();

  // 发送 / 回复时滚到底部（用户手动上翻时不打扰）
  useEffect(() => {
    if (stickBottom.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = () => {
    if (sending || !input.trim()) return;
    const q = input;
    setInput('');
    void ask(q, messages);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // 输入框随内容增高（最多 5 行）
  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <>
      <SEO title="AI 馆员" description="本地大模型驱动的胡桃馆员：认识全站教程，帮你答疑、找书、规划学习路线" />
      <div className="mx-auto flex w-full max-w-3xl flex-col" style={{ minHeight: 'calc(100vh - 11rem)' }}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">AI 馆员</h1>
            <p className="mt-1 text-sm text-text-muted">胡桃读过全馆藏书 · 答疑、找书、规划路线都可以问她</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
              <ShieldCheck className="h-3.5 w-3.5" /> 本地大模型 · 数据不出内网
            </span>
            <button
              type="button"
              onClick={() => setMessages([WELCOME])}
              disabled={messages.length <= 1}
              aria-label="清空对话"
              title="清空对话"
              className="rounded-lg border border-border/60 bg-bg-card p-2 text-text-secondary transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div
          ref={logRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto py-6"
          aria-live="polite"
        >
          {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-3" aria-label="可以这样问">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void ask(s, messages)}
                className="rounded-full border border-border/60 bg-bg-card px-3.5 py-1.5 text-xs text-text-secondary transition-all hover:border-accent/50 hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="sticky bottom-4 rounded-2xl border border-border/60 bg-bg-card p-2 shadow-lg shadow-black/5">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoGrow(e.currentTarget); }}
            onKeyDown={onKey}
            placeholder="问点什么…（Enter 发送，Shift+Enter 换行）"
            aria-label="给 AI 馆员留言"
            className="custom-scrollbar max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="flex items-center justify-between gap-3 px-1 pt-1">
            <p className="text-xs text-text-muted">回答基于站内教程检索，重要内容请以原文为准</p>
            {sending ? (
              <button
                type="button"
                onClick={stop}
                aria-label="停止生成"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
              >
                <Square className="h-3.5 w-3.5" /> 停止
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!input.trim()}
                aria-label="发送"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
              >
                发送 <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
