import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Check, ChevronDown, Copy, RotateCcw, Square } from 'lucide-react';
import { MarkdownView } from '../../markdown/MarkdownView';
import { AI_UNREACHABLE, readModelStream } from '../../../lib/sse';
import { cn } from '../../../utils/cn';
import type { RunnerProps } from '../types';

interface RunRecord {
  id: number;
  system: string;
  user: string;
  output: string;
  streaming: boolean;
  error?: boolean;
  ms?: number;
}

let seq = 0;

/** AI 提示词环境：把编辑器里的 system.md / user.md 发给站内大模型，流式显示，逐次记录下来方便前后对比 */
const AiRunner: React.FC<RunnerProps> = ({ files, runId, onOutput }) => {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [openPrompts, setOpenPrompts] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const tempRef = useRef(temperature);
  tempRef.current = temperature;
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const send = useCallback(async () => {
    const system = filesRef.current['system.md'] ?? '';
    const user = filesRef.current['user.md'] ?? '';
    const id = ++seq;
    if (!user.trim()) {
      setRuns((prev) => [...prev, { id, system, user, output: 'user.md 是空的：先在左边写一句提示词，再点「发送」。', streaming: false, error: true }]);
      return;
    }
    const t0 = performance.now();
    setRuns((prev) => [...prev, { id, system, user, output: '', streaming: true }]);
    const patch = (fn: (r: RunRecord) => RunRecord) => setRuns((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/lab-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, user, temperature: tempRef.current, stream: true }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if ((res.headers.get('content-type') || '').includes('text/event-stream') && res.body) {
        await readModelStream(res, (d) => patch((r) => ({ ...r, output: r.output + d })), ctrl.signal);
      } else {
        const j = await res.json();
        patch((r) => ({ ...r, output: j.choices?.[0]?.message?.content || j.error || '（模型没有返回内容）' }));
      }
      patch((r) => (r.output.trim() ? { ...r, streaming: false, ms: Math.round(performance.now() - t0) } : { ...r, streaming: false, error: true, output: '模型没有返回内容，换个写法再试一次。' }));
    } catch (e: any) {
      if (e.name === 'AbortError') patch((r) => ({ ...r, streaming: false }));
      else patch((r) => ({ ...r, streaming: false, error: true, output: AI_UNREACHABLE }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (runId > 0) { abortRef.current?.abort(); void send(); }
  }, [runId]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [runs, runs[runs.length - 1]?.output]);

  useEffect(() => {
    const last = runs[runs.length - 1];
    if (last && !last.streaming) onOutputRef.current(last.output.slice(0, 1500));
  }, [runs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const streamingNow = runs.some((r) => r.streaming);
  const copy = async (text: string, id: number) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); window.setTimeout(() => setCopied(0), 1500); } catch { /* 剪贴板不可用时忽略 */ }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0e13]">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-[#1c2430] px-3">
        <Bot className="h-3.5 w-3.5 text-[#b07cff]" />
        <span className="text-[11px] font-semibold tracking-wide text-[#8b96a6]">模型输出</span>
        {runs.length > 0 && <span className="text-[11px] text-[#5b6676]">已发送 {runs.length} 次</span>}
        <label className="ml-auto flex items-center gap-2 text-[11px] text-[#8b96a6] select-none" title="温度越高回答越发散，越低越稳定">
          温度 <span className="w-6 text-right font-mono text-[#c9d4df]">{temperature.toFixed(1)}</span>
          <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-24 accent-[#f27d26]" aria-label="温度" />
        </label>
        <button
          type="button"
          onClick={() => setRuns([])}
          disabled={streamingNow}
          title="清空运行记录"
          aria-label="清空运行记录"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#7d8899] transition-colors hover:bg-[#1a212c] hover:text-[#d6dee8] disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" /> 清空
        </button>
      </div>

      <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {runs.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-[#9aa6b6]">左边写好 <code className="rounded bg-[#161d27] px-1 font-mono text-[12px]">system.md</code> 和 <code className="rounded bg-[#161d27] px-1 font-mono text-[12px]">user.md</code>，点右上角的「发送」</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#5b6676]">模型的回答会流式显示在这里。改一改提示词再发一次，每次的结果都留着，方便前后对比。</p>
          </div>
        )}
        {runs.map((r, i) => (
          <div key={r.id} className={cn('overflow-hidden rounded-xl border', r.error ? 'border-[#ff7b72]/40' : 'border-[#1c2430] bg-[#0d1219]')}>
            <div className="flex items-center gap-2 border-b border-[#1c2430] bg-[#0f141b] px-3 py-1.5 text-[11px] text-[#7d8899]">
              <span className="font-semibold text-[#9aa6b6]">第 {i + 1} 次</span>
              {r.ms !== undefined && <span>{(r.ms / 1000).toFixed(1)} s</span>}
              {r.streaming && <span className="flex items-center gap-1 text-[#b07cff]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b07cff]" />生成中</span>}
              <button type="button" onClick={() => setOpenPrompts((o) => ({ ...o, [r.id]: !o[r.id] }))} className="ml-auto flex items-center gap-1 transition-colors hover:text-[#d6dee8]">
                提示词 <ChevronDown className={cn('h-3 w-3 transition-transform', openPrompts[r.id] && 'rotate-180')} />
              </button>
              {!r.streaming && r.output && (
                <button type="button" onClick={() => copy(r.output, r.id)} className="flex items-center gap-1 transition-colors hover:text-[#d6dee8]" aria-label="复制这次输出">
                  {copied === r.id ? <Check className="h-3 w-3 text-[#7ee787]" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
            {openPrompts[r.id] && (
              <div className="space-y-2 border-b border-[#1c2430] px-3 py-2 font-mono text-[11.5px] leading-relaxed">
                {r.system.trim() && <div><p className="mb-0.5 text-[#5b6676]">system.md</p><pre className="whitespace-pre-wrap break-words text-[#9aa6b6]">{r.system}</pre></div>}
                <div><p className="mb-0.5 text-[#5b6676]">user.md</p><pre className="whitespace-pre-wrap break-words text-[#9aa6b6]">{r.user}</pre></div>
              </div>
            )}
            <div className={cn('px-3 py-2 text-[13px]', r.error ? 'whitespace-pre-wrap text-[#ffb4ad]' : 'prose prose-sm max-w-none leading-relaxed text-text-primary dark:prose-invert')}>
              <MarkdownView content={r.output} />
              {r.streaming && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-[#b07cff] animate-pulse" aria-label="正在输入" />}
            </div>
          </div>
        ))}
      </div>

      {streamingNow && (
        <div className="shrink-0 border-t border-[#1c2430] p-2">
          <button type="button" onClick={stop} className="mx-auto flex items-center gap-1.5 rounded-lg border border-[#2a3442] bg-[#161d27] px-3 py-1.5 text-[12px] text-[#c9d4df] transition-colors hover:border-[#ff7b72]/60 hover:text-[#ffb4ad]">
            <Square className="h-3 w-3" /> 停止生成
          </button>
        </div>
      )}
    </div>
  );
};

export default AiRunner;
