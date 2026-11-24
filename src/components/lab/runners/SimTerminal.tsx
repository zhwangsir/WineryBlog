import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eraser, Send, Square, Terminal } from 'lucide-react';
import { AI_UNREACHABLE, readModelStream } from '../../../lib/sse';
import { cn } from '../../../utils/cn';
import { pushLines, type LogLine, type RunnerProps } from '../types';

interface Props extends RunnerProps {
  stepIndex: number;
}

type Kind = 'cmd' | 'out' | 'sys';

interface Line extends LogLine { kind: Kind }

let seq = 0;

/** 「运行」按钮相当于在终端里敲的命令（按环境和文件类型） */
export const runCommand = (envId: string, fileName: string) => {
  if (envId === 'node') return `node ${fileName}`;
  if (envId === 'shell') {
    // .conf 是 nginx 站点配置：运行 = 写回站点配置文件（是否生效取决于之后有没有 reload）
    if (/\.conf$/i.test(fileName)) return `sudo cp ${fileName} /etc/nginx/sites-available/default`;
    return `bash ${fileName}`;
  }
  return `粘贴并执行 ${fileName}`;
};

/** AI 仿真终端：由站内大模型扮演 Linux / Node / jshell 等环境，读者输入命令，模型按真实行为给出输出 */
const SimTerminal: React.FC<Props> = ({ lab, env, files, activeFile, runId, stepIndex, onOutput }) => {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const cmdHistory = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const abortRef = useRef<AbortController | null>(null);
  const ctxRef = useRef({ files, activeFile, stepIndex });
  ctxRef.current = { files, activeFile, stepIndex };
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  const line = (kind: Kind, text: string): Line => ({ id: ++seq, level: kind === 'sys' ? 'sys' : 'log', text, kind });

  const ask = useCallback(async (message: string, file?: { name: string; content: string }) => {
    if (busy) return;
    const action = file ? runCommand(env.id, file.name) : '';
    setLines((prev) => pushLines(prev, line('cmd', action ? `${action}    ← 运行编辑器里的文件` : message)));
    setInput('');
    setBusy(true);
    historyRef.current.push({ role: 'user', content: message });
    const id = ++seq;
    // 输出行必须用这里取好的编号：后面流式追加内容时按编号查找这一行
    setLines((prev) => pushLines(prev, { id, level: 'log', text: '', kind: 'out' }));
    const append = (text: string) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, text: l.text + text } : l)));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/lab-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envId: env.id, labId: lab?.id, context: 'terminal', message,
          step: lab ? ctxRef.current.stepIndex : undefined,
          file: file ? { name: file.name, content: file.content, action } : undefined,
          history: historyRef.current.slice(-12), stream: true,
        }),
        signal: ctrl.signal,
      });
      let text = '';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ((res.headers.get('content-type') || '').includes('text/event-stream') && res.body) {
        let acc = '';
        await readModelStream(res, (d) => { acc += d; append(d); }, ctrl.signal);
        text = acc;
      } else {
        const j = await res.json();
        text = j.choices?.[0]?.message?.content || j.error || '（环境没有响应）';
        append(text);
      }
      historyRef.current.push({ role: 'assistant', content: text || '(无输出)' });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        append(AI_UNREACHABLE);
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, kind: 'sys' as Kind } : l)));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [busy, env.id, lab?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // 打开环境时的欢迎信息
  useEffect(() => {
    const names = Object.keys(files).join('、');
    setLines([
      line('sys', `${env.sim?.title || env.engine} · AI 仿真环境`),
      line('sys', '这个终端由站内大模型扮演：输入命令回车，它会按真实环境的行为给出输出，并记住你之前做过的操作。'),
      ...(names ? [line('sys', `点右上角的「运行」，会把编辑器里的 ${names} 交给这个终端执行。`)] : []),
      line('sys', ''),
    ]);
    historyRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env.id, lab?.id]);

  // 「运行」按钮：把当前文件交给终端
  useEffect(() => {
    if (runId === 0) return;
    const { files: f, activeFile: a } = ctxRef.current;
    const name = a && f[a] !== undefined ? a : Object.keys(f)[0];
    if (name) void ask(`运行 ${name}`, { name, content: f[name] });
  }, [runId]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    onOutputRef.current(lines.map((l) => (l.kind === 'cmd' ? `$ ${l.text}` : l.text)).join('\n').slice(-2500));
  }, [lines]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = () => {
    const msg = input.trim();
    if (!msg || busy) return;
    cmdHistory.current.push(msg);
    histIdx.current = cmdHistory.current.length;
    void ask(msg);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const n = cmdHistory.current.length;
      if (!n) return;
      histIdx.current = e.key === 'ArrowUp' ? Math.max(0, histIdx.current - 1) : Math.min(n, histIdx.current + 1);
      setInput(cmdHistory.current[histIdx.current] ?? '');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#070a0e]">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#1c2430] px-3">
        <Terminal className="h-3.5 w-3.5 text-accent" />
        <span className="font-mono text-[11px] tracking-wide text-[#8b96a6]">{env.sim?.title || env.name}</span>
        <span className="rounded-full border border-[#b07cff]/40 bg-[#b07cff]/10 px-2 py-0.5 text-[10px] font-medium text-[#c9a7ff]">AI 仿真</span>
        <button
          type="button"
          onClick={() => setLines([])}
          title="清屏"
          aria-label="清屏"
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#7d8899] transition-colors hover:bg-[#1a212c] hover:text-[#d6dee8]"
        >
          <Eraser className="h-3 w-3" /> 清屏
        </button>
      </div>

      <div ref={boxRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-[1.7]">
        {lines.map((l) => (
          <div
            key={l.id}
            className={cn(
              'whitespace-pre-wrap break-words',
              l.kind === 'cmd' ? 'text-[#f27d26]' : l.kind === 'sys' ? 'text-[#7d8899]' : 'text-[#c9d4df]',
            )}
          >
            {l.kind === 'cmd' && <span className="mr-2 select-none text-[#5b6676]">$ </span>}
            {l.kind === 'out' && l.id === lines[lines.length - 1]?.id && busy && <span className="mr-1 inline-block h-[0.9em] w-[6px] translate-y-[1px] bg-[#c9d4df] animate-pulse" aria-hidden="true" />}
            {/* 模型常把输出包在 Markdown 代码围栏里：终端只显示围栏里面的内容 */}
            {l.kind === 'out' ? l.text.replace(/```+[^\n]*/g, '') : l.text}
          </div>
        ))}
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2 border-t border-[#1c2430] bg-[#0a0e13] px-3">
        <span className="font-mono text-[13px] text-accent select-none">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={busy ? '等待环境响应…' : '输入命令后回车（↑ ↓ 翻看历史）'}
          aria-label="终端输入"
          spellCheck={false}
          autoComplete="off"
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#dfe6ee] placeholder:text-[#5b6676] focus:outline-none"
        />
        <span className="hidden text-[10px] text-[#3d4756] sm:inline" aria-hidden="true"><ChevronUp className="inline h-3 w-3" /><ChevronDown className="inline h-3 w-3" /> 历史</span>
        {busy ? (
          <button type="button" onClick={() => abortRef.current?.abort()} title="停止等待" aria-label="停止等待" className="rounded-md p-1.5 text-[#7d8899] transition-colors hover:bg-[#1a212c] hover:text-[#ff9b93]">
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!input.trim()} title="执行" aria-label="执行" className="rounded-md p-1.5 text-accent transition-colors hover:bg-accent/15 disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SimTerminal;
