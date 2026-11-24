import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, ClipboardCheck, GraduationCap, Lightbulb, Send, Square, Trash2, X } from 'lucide-react';
import { MarkdownView } from '../markdown/MarkdownView';
import { AI_UNREACHABLE, readModelStream } from '../../lib/sse';
import { cn } from '../../utils/cn';
import type { Lab, LabEnv } from '../../lib/labs';

export type CoachMode = 'guide' | 'explain' | 'review';

const MODES: { id: CoachMode; label: string; hint: (lab?: Lab) => string }[] = [
  { id: 'guide', label: '引导', hint: () => '不直接给答案，用提问带你自己想通' },
  { id: 'explain', label: '讲解', hint: (lab) => (lab ? '把正在看的那一步涉及的知识点讲透' : '讲透你问到的知识点') },
  { id: 'review', label: '检查代码', hint: (lab) => (lab ? '对照参考步骤和自查清单检查你写的代码' : '检查你写的代码，指出问题和改进方向') },
];

/** 快捷提问：有没有载入示例，措辞不一样 */
const quickActions = (lab?: Lab): { id: CoachMode; label: string; icon: typeof Lightbulb; message: string }[] => (lab
  ? [
    { id: 'guide', label: '给点提示', icon: Lightbulb, message: '我卡在正在看的这一步了，给我一点提示（先别告诉我完整答案）。' },
    { id: 'explain', label: '讲解这一步', icon: GraduationCap, message: '请把正在看的这一步要用到的知识点讲给我听。' },
    { id: 'review', label: '检查我的代码', icon: ClipboardCheck, message: '请检查我现在的代码，对照这个示例的步骤和自查清单，告诉我哪里做对了、哪里还有问题。' },
  ]
  : [
    { id: 'guide', label: '给点建议', icon: Lightbulb, message: '看看我现在的代码，给我一点下一步可以尝试的方向（先别直接替我写）。' },
    { id: 'explain', label: '讲解知识点', icon: GraduationCap, message: '请结合我现在的代码，讲讲其中用到的知识点。' },
    { id: 'review', label: '检查我的代码', icon: ClipboardCheck, message: '请检查我现在的代码，告诉我哪里写得没问题、哪里有问题、可以怎么改进。' },
  ]);

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: boolean;
}

interface Props {
  /** 当前载入的示例练习；自由练习时没有 */
  lab?: Lab;
  env: LabEnv;
  stepIndex: number;
  /** 编辑器里的全部文件（文件名 → 内容），助教据此检查代码 */
  files: Record<string, string>;
  /** 运行结果 / 终端输出的最近若干行 */
  output: string;
  onClose: () => void;
}

const MAX_FILE = 4000;
const welcomeFor = (env: LabEnv, lab?: Lab) => (lab
  ? `客官好呀~ 我是**${env.name}**的 AI 助教。我看得见这个示例的参考说明、编辑器里的代码和运行结果。\n\n示例只是一份参考，练到哪算哪。需要的话：卡住了点「给点提示」，想听讲解点「讲解这一步」，写完了点「检查我的代码」。默认我会**用提问引导你自己想通**，不会一上来就把答案塞给你。`
  : `客官好呀~ 我是**${env.name}**的 AI 助教。我看得见编辑器里的代码和运行结果——想练什么由你决定，我不会给你布置任务。\n\n有问题直接问；想让我看看代码就点「检查我的代码」；想听某个知识点就点「讲解知识点」。`);

let seq = 0;
const nextId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * AI 助教：可开关的侧边窗口。每条消息都带上编辑器里的代码和最近的运行输出（载入了示例时还会带上示例内容），
 * 由服务端按模式（引导 / 讲解 / 检查代码）组织提示词，流式返回。
 */
const CoachPanel: React.FC<Props> = ({ lab, env, stepIndex, files, output, onClose }) => {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 'welcome', role: 'assistant', content: welcomeFor(env, lab) }]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CoachMode>('guide');
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stick = useRef(true);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const ctxRef = useRef({ stepIndex, files, output });
  ctxRef.current = { stepIndex, files, output };

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (stick.current) boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs, msgs[msgs.length - 1]?.content]);

  const send = useCallback(async (text: string, m: CoachMode) => {
    const message = text.trim();
    if (!message) return;
    const { files: f, output: out, stepIndex: step } = ctxRef.current;
    const code = Object.entries(f).map(([name, content]) => `// ===== ${name} =====\n${content.length > MAX_FILE ? `${content.slice(0, MAX_FILE)}\n… （文件太长，已截断）` : content}`).join('\n\n');
    const replyId = nextId();
    historyRef.current.push({ role: 'user', content: message });
    setMsgs((prev) => [...prev, { id: nextId(), role: 'user', content: message }, { id: replyId, role: 'assistant', content: '', streaming: true }]);
    setSending(true);
    stick.current = true;
    const patch = (fn: (m: Msg) => Msg) => setMsgs((prev) => prev.map((x) => (x.id === replyId ? fn(x) : x)));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/lab-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envId: env.id, labId: lab?.id, context: 'coach', mode: m, message,
          step: lab ? step : undefined,
          code, output: out.slice(-2500),
          history: historyRef.current.slice(-12), stream: true,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let full = '';
      if ((res.headers.get('content-type') || '').includes('text/event-stream') && res.body) {
        await readModelStream(res, (d) => { full += d; patch((m) => ({ ...m, content: m.content + d })); }, ctrl.signal);
      } else {
        const j = await res.json();
        full = j.choices?.[0]?.message?.content || j.error || '';
        patch((m) => ({ ...m, content: full }));
      }
      if (full.trim()) historyRef.current.push({ role: 'assistant', content: full });
      patch((m) => (m.content.trim() ? { ...m, streaming: false } : { ...m, streaming: false, error: true, content: '模型没有返回内容，换个问法再试试。' }));
    } catch (e: any) {
      if (e.name === 'AbortError') patch((m) => ({ ...m, streaming: false }));
      else patch((m) => ({ ...m, streaming: false, error: true, content: AI_UNREACHABLE }));
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [env.id, lab?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (sending || !input.trim()) return;
    const q = input;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    void send(q, mode);
  };

  const clear = () => {
    abortRef.current?.abort();
    historyRef.current = [];
    setMsgs([{ id: 'welcome', role: 'assistant', content: welcomeFor(env, lab) }]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-bg-card">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent"><Bot className="h-3.5 w-3.5" /></span>
        <span className="text-sm font-bold text-text-primary">AI 助教</span>
        <button type="button" onClick={clear} title="清空对话" aria-label="清空对话" className="ml-auto rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary"><Trash2 className="h-4 w-4" /></button>
        <button type="button" onClick={onClose} title="关闭 AI 助教" aria-label="关闭 AI 助教" className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary"><X className="h-4 w-4" /></button>
      </div>

      <div className="shrink-0 space-y-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1" role="tablist" aria-label="助教模式">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              title={m.hint(lab)}
              onClick={() => setMode(m.id)}
              className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors', mode === m.id ? 'border-accent bg-accent/15 text-accent' : 'border-border/60 text-text-secondary hover:border-accent/50 hover:text-accent')}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickActions(lab).map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={sending}
              onClick={() => { setMode(q.id); void send(q.message, q.id); }}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-bg-base px-2 py-1 text-[11.5px] text-text-secondary transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-40"
            >
              <q.icon className="h-3 w-3" /> {q.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={boxRef}
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
        aria-live="polite"
      >
        {msgs.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('min-w-0 max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed', m.role === 'user' ? 'rounded-tr-md bg-accent text-white' : 'rounded-tl-md border border-border/60 bg-bg-base text-text-primary')}>
              {m.role === 'user'
                ? <p className="whitespace-pre-wrap break-words">{m.content}</p>
                : (
                  <div className={cn('prose prose-sm max-w-none leading-relaxed text-text-primary dark:prose-invert', m.error && 'whitespace-pre-wrap')}>
                    <MarkdownView content={m.content} />
                    {m.streaming && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent animate-pulse" aria-label="正在输入" />}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-bg-base p-2 focus-within:border-accent/60">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
            placeholder={`问助教（${MODES.find((m) => m.id === mode)?.label}模式）… Enter 发送`}
            aria-label="给 AI 助教留言"
            className="custom-scrollbar max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
          />
          {sending ? (
            <button type="button" onClick={() => abortRef.current?.abort()} aria-label="停止生成" className="shrink-0 rounded-lg border border-border p-2 text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"><Square className="h-4 w-4" /></button>
          ) : (
            <button type="button" onClick={submit} disabled={!input.trim()} aria-label="发送" className="shrink-0 rounded-lg bg-accent p-2 text-white transition-colors hover:bg-accent-hover disabled:opacity-40"><Send className="h-4 w-4" /></button>
          )}
        </div>
        <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-text-muted">
          助教能看到你{env.runner === 'sim' ? '在终端里的操作和' : '结果区的输出和'}编辑器里的代码；回答由站内大模型生成，重要结论请以代码的实际运行结果为准。
        </p>
      </div>
    </div>
  );
};

export default CoachPanel;
