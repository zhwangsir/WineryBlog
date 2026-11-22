import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  FlaskConical, Target, ListChecks, Play, RotateCcw, Trophy, ChevronDown,
  Terminal, Eye, BadgeCheck, Hammer,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { markLab } from '../lib/progress';

export interface LabStep {
  title: string;
  detail?: string;
  code?: string;
  check?: string;
  starter?: string;
}
export interface LabData {
  title: string;
  runner: 'none' | 'js' | 'web';
  minutes?: number;
  goal: string;
  env?: string;
  steps: LabStep[];
  verify: string[];
  solution?: string;
  runnerStarter?: string;
  webStarter?: { html: string; css: string };
}

// ---------- JS 沙箱运行器（sandbox iframe，console 捕获 + postMessage） ----------
const buildJsDoc = (code: string) => {
  const safe = code.replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html><html><head><style>
    body{background:transparent;color:#cfd8e3;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;margin:0;padding:8px;}
  </style></head><body><div id="out"></div><script>
  const out = document.getElementById('out');
  const fmt = v => (typeof v === 'object' && v !== null) ? JSON.stringify(v, null, 1) : String(v);
  const send = s => { out.textContent += s + '\\n'; parent.postMessage({ type: 'lab-log', text: s }, '*'); };
  console.log = (...a) => send(a.map(fmt).join(' '));
  console.error = (...a) => send('❌ ' + a.map(fmt).join(' '));
  window.onerror = msg => { send('❌ ' + msg); };
  (async () => {
    try {
      ${safe}
    } catch (e) { send('❌ ' + (e && e.message || e)); }
    send('✔ 运行结束');
  })();
  </script></body></html>`;
};

const buildWebDoc = (html: string, css: string) =>
  `<!DOCTYPE html><html><head><style>
    body{background:#12181f;color:#cfd8e3;font-family:system-ui,sans-serif;margin:12px;}
  </style><style>${css}</style></head><body>${html}</body></html>`;

// ---------- 运行器组件 ----------
const JsRunner: React.FC<{ starter: string }> = ({ starter }) => {
  const [code, setCode] = useState(starter);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const run = () => {
    setLogs([]);
    setRunning(true);
    // 重建 iframe = 全新沙箱环境（const 重复定义不报错、死循环可用重置终止）
    if (frameRef.current) {
      frameRef.current.srcdoc = buildJsDoc(code);
    }
  };
  const reset = () => { setCode(starter); setLogs([]); };

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'lab-log') setLogs(prev => [...prev, e.data.text]);
      if (e.data?.type === 'lab-done') setRunning(false);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-medium text-text-secondary">沙箱运行器（iframe 隔离，可放心跑）</span>
        <div className="ml-auto flex gap-1.5">
          <button onClick={run} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-white text-xs hover:bg-accent-hover transition-colors">
            <Play className="w-3 h-3" /> 运行
          </button>
          <button onClick={reset} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-base border border-border text-text-secondary text-xs hover:text-accent transition-colors">
            <RotateCcw className="w-3 h-3" /> 重置
          </button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        rows={12}
        className="w-full resize-y rounded-lg bg-black/40 border border-border/50 p-3 text-xs leading-relaxed text-text-primary font-mono focus:outline-none focus:border-accent"
      />
      <div
        ref={outRef}
        className="rounded-lg bg-black/60 border border-border/50 p-3 text-xs font-mono text-green-400/90 min-h-[72px] max-h-48 overflow-y-auto whitespace-pre-wrap"
      >
        {logs.length === 0 ? '（输出区——点「运行」查看结果）' : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {running && <p className="text-[10px] text-text-muted">仍在运行（含异步任务）…若死循环，点「重置」终止。</p>}
      {/* 沙箱 iframe（隐藏执行体） */}
      <iframe ref={frameRef} title="lab-js" sandbox="allow-scripts" className="hidden" />
    </div>
  );
};

const WebRunner: React.FC<{ html: string; css: string }> = ({ html: initHtml, css: initCss }) => {
  const [html, setHtml] = useState(initHtml);
  const [css, setCss] = useState(initCss);
  const [doc, setDoc] = useState(() => buildWebDoc(initHtml, initCss));
  const timer = useRef<number | null>(null);

  const update = (h: string, s: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDoc(buildWebDoc(h, s)), 300);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-medium text-text-secondary">实时预览（改左侧 HTML/CSS 即时生效）</span>
        <button
          onClick={() => { setHtml(initHtml); setCss(initCss); update(initHtml, initCss); }}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-base border border-border text-text-secondary text-xs hover:text-accent transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> 重置
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <textarea
          value={html}
          onChange={e => { setHtml(e.target.value); update(e.target.value, css); }}
          spellCheck={false}
          rows={10}
          aria-label="HTML 编辑器"
          className="w-full resize-y rounded-lg bg-black/40 border border-border/50 p-3 text-xs leading-relaxed text-text-primary font-mono focus:outline-none focus:border-accent"
        />
        <textarea
          value={css}
          onChange={e => { setCss(e.target.value); update(html, e.target.value); }}
          spellCheck={false}
          rows={10}
          aria-label="CSS 编辑器"
          className="w-full resize-y rounded-lg bg-black/40 border border-border/50 p-3 text-xs leading-relaxed text-text-primary font-mono focus:outline-none focus:border-accent"
        />
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden bg-[#12181f]">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-muted border-b border-border/50">预览</div>
        <iframe title="lab-web" sandbox="allow-scripts" srcDoc={doc} className="w-full h-56" />
      </div>
    </div>
  );
};

// ---------- 实验卡片 ----------
export const LabPanel: React.FC<{ tutorialId: string; lab: LabData; labDone?: boolean; onLabDone?: (d: boolean) => void }> = ({
  tutorialId, lab, labDone = false, onLabDone,
}) => {
  const [stepDone, setStepDone] = useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(labDone);

  const doneCount = useMemo(
    () => lab.steps.filter((_, i) => stepDone[i]).length,
    [stepDone, lab.steps]
  );

  const toggleComplete = async () => {
    const next = !completed;
    setCompleted(next);
    onLabDone?.(next);
    await import('../lib/progress').then(m => m.markLab(tutorialId, next));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn(
        'rounded-2xl border p-6 flex flex-col gap-5 bg-gradient-to-br from-accent/5 to-transparent',
        completed ? 'border-green-500/40' : 'border-accent/30'
      )}
      data-lab-panel
    >
      {/* 头部 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-accent" />
            动手实验 · {lab.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Hammer className="w-3 h-3" /> 配套实战</span>
            {lab.minutes && <span>约 {lab.minutes} 分钟</span>}
            {lab.env && <span>环境：{lab.env}</span>}
          </div>
        </div>
        <button
          onClick={toggleComplete}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            completed
              ? 'bg-green-500/15 text-green-500 border border-green-500/40'
              : 'bg-accent text-white hover:bg-accent-hover'
          )}
        >
          <BadgeCheck className="w-4 h-4" />
          {completed ? '实验完成 ✓' : '标记实验完成'}
        </button>
      </div>

      {/* 目标 */}
      <div className="flex items-start gap-2.5 bg-bg-base rounded-xl px-4 py-3">
        <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-text-primary leading-relaxed"><span className="font-bold text-accent">实验目标：</span>{lab.goal}</p>
      </div>

      {/* 步骤 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-accent" /> 步骤（{doneCount}/{lab.steps.length} 已核）
          </span>
        </div>
        {lab.steps.map((s, i) => (
          <div key={i} className="bg-bg-card border border-border/60 rounded-xl p-4 flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!stepDone[i]}
                onChange={e => setStepDone(prev => ({ ...prev, [i]: e.target.checked }))}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <span className={cn('font-bold text-sm', stepDone[i] ? 'text-text-muted line-through' : 'text-text-primary')}>
                {s.title}
              </span>
            </label>
            {s.detail && <p className="text-xs text-text-secondary leading-relaxed pl-6">{s.detail}</p>}
            {s.code && (
              <pre className="ml-6 rounded-lg bg-black/40 border border-border/50 p-3 text-xs font-mono text-text-primary overflow-x-auto whitespace-pre">
                {s.code}
              </pre>
            )}
            {s.check && (
              <p className="text-[11px] text-text-muted pl-6">✔ 自查：{s.check}</p>
            )}
          </div>
        ))}
      </div>

      {/* 运行器 */}
      {lab.runner === 'js' && (
        <JsRunner starter={lab.runnerStarter || '// 在这里写你的代码\nconsole.log("hello lab");'} />
      )}
      {lab.runner === 'web' && lab.webStarter && (
        <WebRunner html={lab.webStarter.html} css={lab.webStarter.css} />
      )}

      {/* 验收标准 */}
      <div className="flex items-start gap-2.5 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <ListChecks className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-accent mb-1">验收标准</p>
          <ul className="text-sm text-text-primary space-y-1">
            {lab.verify.map((v, i) => <li key={i}>☐ {v}</li>)}
          </ul>
        </div>
      </div>

      {/* 参考答案（折叠） */}
      {lab.solution && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <button
            onClick={() => setShowSolution(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-base text-sm text-text-secondary hover:text-accent transition-colors"
          >
            <span>参考答案（先自己试！卡住超过 20 分钟再看）</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showSolution && 'rotate-180')} />
          </button>
          {showSolution && (
            <pre className="bg-black/40 p-4 text-xs font-mono text-text-primary overflow-x-auto whitespace-pre">
              {lab.solution}
            </pre>
          )}
        </div>
      )}
    </motion.section>
  );
};
