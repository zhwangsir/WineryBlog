import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

// 人设由服务端 /api/ai 统一注入（胡桃馆员），客户端不再重复声明以免冲突
const SYSTEM_PROMPT = '';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMd(text: string): string {
  const parts = text.split(/```(?:\w*)\n?([\s\S]*?)```/g);
  let html = '';
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      html += `<pre class="mt-2 mb-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs"><code>${escapeHtml(parts[i])}</code></pre>`;
      continue;
    }
    let seg = escapeHtml(parts[i]);
    seg = seg.replace(/`([^`]+)`/g, '<code class="px-1 bg-gray-100 dark:bg-gray-800 rounded">$1</code>');
    seg = seg.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    seg = seg.replace(/\n/g, '<br>');
    html += seg;
  }
  return html;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: '嘿嘿~ 客官好呀！我是往生堂七十七代堂主胡桃，兼修 AI 馆员一职（本地大模型驱动，数据不出内网）~\n\n可以问我：\n- 「Web 全栈该怎么入门？」\n- 「讲讲 TCP 三次握手」\n- 「站里有哪些 Rust 教程？」\n\n知识胡桃一定讲准，玩笑胡桃管够！' }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    const history = [...messages, userMsg].slice(-12);
    setMessages(prev => [...prev, { role: 'assistant', content: '思考中…' }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'auto',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const text = j.choices?.[0]?.message?.content || '(模型没有返回内容)';
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `请求失败：${e.message}\n可能原因：内网推理服务未启动、代理未放行。`,
        isError: true,
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ minHeight: '60vh' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">AI 馆员</h1>
        <p className="text-sm text-text-muted mt-1">
          馆员由<b>内网本地大模型</b>驱动（数据不出内网）。它会优先推荐站内教程。
        </p>
      </div>

      <div ref={logRef} className="flex-1 space-y-4 mb-6 overflow-y-auto" style={{ minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
            m.role === 'user'
              ? 'ml-auto bg-accent text-white rounded-br-sm'
              : m.isError
                ? 'mr-auto bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'mr-auto bg-bg-card border border-border/30 text-text-primary rounded-bl-sm'
          }`}>
            {renderMd(m.content)}
          </div>
        ))}
        {sending && messages[messages.length - 1]?.content === '思考中…' && (
          <div className="flex items-center gap-1 text-text-muted text-xs ml-2">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-100">●</span>
            <span className="animate-pulse delay-200">●</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 h-10 px-4 rounded-lg border border-border/30 bg-bg-card text-sm text-text-primary outline-none focus:border-accent"
          placeholder="问点什么…（Enter 发送）"
          disabled={sending}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const q = inputRef.current?.value || '';
              if (inputRef.current) inputRef.current.value = '';
              ask(q);
            }
          }}
        />
        <button
          className="px-5 rounded-lg border border-accent bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          disabled={sending}
          onClick={() => {
            const q = inputRef.current?.value || '';
            if (inputRef.current) inputRef.current.value = '';
            ask(q);
          }}
        >
          发送
        </button>
      </div>
    </div>
  );

  function renderMd(text: string): string {
    let html = escapeHtml(text);
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="mt-2 mb-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs"><code>${code}</code></pre>`
    );
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 bg-gray-100 dark:bg-gray-800 rounded">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }
};
