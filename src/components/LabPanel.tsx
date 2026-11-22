import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  FlaskConical, Target, ListChecks, Play, RotateCcw, Trophy, ChevronDown,
  Terminal, Eye, BadgeCheck, Hammer, Clock, Lock,
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

// ---------- 共享视觉元件 ----------

/** 窗口三点 chrome（编辑器 / 终端 / 预览共用） */
const Chrome: React.FC<{ name: string; right?: React.ReactNode; children?: React.ReactNode }> = ({
  name, right, children,
}) => (
  <div className="rounded-xl overflow-hidden border border-[#2a3040] bg-[#0d1117] shadow-lg shadow-black/30">
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#161b22] border-b border-[#2a3040]">
      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-2.5 text-[11px] text-[#8b949e] font-mono select-none">{name}</span>
      {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
    </div>
    {children}
  </div>
);

const ChromeButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#21262d] border border-[#30363d] text-[11px] text-[#c9d1d9] hover:border-accent hover:text-accent transition-colors"
  >
    {children}
  </button>
);

// ---------- JS 沙箱运行器 ----------
const buildJsDoc = (code: string) => {
  const safe = code.replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html><html><head><style>
    body{background:#0d1117;color:#c9d1d9;font:12px/1.8 ui-monospace,SFMono-Regular,Consolas,monospace;margin:0;padding:10px;}
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
  <\/script></body></html>`;
};

const buildWebDoc = (html: string, css: string) =>
  `<!DOCTYPE html><html><head><style>
    body{background:#12181f;color:#cfd8e3;font-family:system-ui,sans-serif;margin:14px;}
  </style><style>${css}</style></head><body>${html}</body></html>`;

const JsRunner: React.FC<{ starter: string }> = ({ starter }) => {
  const [code, setCode] = useState(starter);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const run = () => {
    setLogs([]);
    setRunning(true);
    if (frameRef.current) frameRef.current.srcdoc = buildJsDoc(code);
  };
  const reset = () => { setCode(starter); setLogs([]); setRunning(false); };

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
    <div className="flex flex-col gap-3">
      <Chrome
        name="lab.js"
        right={
          <>
            <ChromeButton onClick={run}>
              <Play className="w-3 h-3 text-green-400" /> 运行
            </ChromeButton>
            <ChromeButton onClick={reset}>
              <RotateCcw className="w-3 h-3" /> 重置
            </ChromeButton>
          </>
        }
      >
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          rows={12}
          className="w-full resize-y bg-[#0d1117] p-3.5 text-[12.5px] leading-relaxed text-[#c9d1d9] font-mono focus:outline-none"
        />
      </Chrome>

      <Chrome name="output">
        <div
          ref={outRef}
          className="p-3.5 text-[12px] font-mono leading-relaxed min-h-[80px] max-h-56 overflow-y-auto"
        >
          {logs.length === 0 ? (
            <span className="text-[#8b949e]">—— 输出区：点「运行」查看结果 ——</span>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={cn('whitespace-pre-wrap', l.startsWith('❌') ? 'text-[#ff7b72]' : l.startsWith('✔') ? 'text-[#8b949e]' : 'text-[#7ee787]')}>
                <span className="text-[#30363d] mr-1.5 select-none">$</span>{l}
              </div>
            ))
          )}
          {running && <div className="text-[#febc2e] animate-pulse">● 运行中…（死循环可点「重置」终止）</div>}
        </div>
      </Chrome>
      <iframe ref={frameRef} title="lab-js" sandbox="allow-scripts" className="hidden" />
    </div>
  );
};

// ---------- Web 实时预览运行器 ----------
const WebRunner: React.FC<{ html: string; css: string }> = ({ html: initHtml, css: initCss }) => {
  const [html, setHtml] = useState(initHtml);
  const [css, setCss] = useState(initCss);
  const [doc, setDoc] = useState(() => buildWebDoc(initHtml, initCss));
  const timer = useRef<number | null>(null);

  const update = (h: string, s: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDoc(buildWebDoc(h, s)), 250);
  };

  const reset = () => { setHtml(initHtml); setCss(initCss); update(initHtml, initCss); };

  const Editor: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="rounded-lg overflow-hidden border border-[#2a3040] bg-[#0d1117]">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#8b949e] font-mono bg-[#161b22] border-b border-[#2a3040]">{label}</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        rows={9}
        className="w-full resize-y bg-[#0d1117] p-3 text-[11.5px] leading-relaxed text-[#c9d1d9] font-mono focus:outline-none"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Editor label="HTML" value={html} onChange={v => { setHtml(v); update(v, css); }} />
        <Editor label="CSS" value={css} onChange={v => { setCss(v); update(html, v); }} />
      </div>
      <Chrome
        name="preview://lab-flex"
        right={
          <ChromeButton onClick={reset}>
            <RotateCcw className="w-3 h-3" /> 重置
          </ChromeButton>
        }
      >
        <iframe title="lab-web" sandbox="allow-scripts" srcDoc={doc} className="w-full h-64 block" />
      </Chrome>
    </div>
  );
};

// ---------- 实验卡片主体 ----------
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-lab-panel
      className="relative rounded-3xl border border-accent/25 bg-gradient-to-b from-accent/[0.07] to-transparent overflow-hidden"
    >
      {/* 顶部光带 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

      <div className="p-6 sm:p-8 flex flex-col gap-7">
        {/* ── 头部 ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/30 shrink-0">
              <FlaskConical className="w-6 h-6 text-white" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold select-none">Hands-on Lab</p>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5">{lab.title}</h2>
            </div>
          </div>
          <button
            onClick={toggleComplete}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              completed
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-accent text-white hover:bg-accent-hover hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/25'
            )}
          >
            {completed ? <Trophy className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            {completed ? '实验通关！' : '标记实验完成'}
          </button>
        </div>

        {/* meta chips */}
        <div className="flex flex-wrap items-center gap-2 -mt-3">
          {lab.minutes && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-base border border-border/60 text-[11px] text-text-secondary">
              <Clock className="w-3 h-3" /> 约 {lab.minutes} 分钟
            </span>
          )}
          {lab.env && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-base border border-border/60 text-[11px] text-text-secondary">
              <Hammer className="w-3 h-3" /> {lab.env}
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-base border border-border/60 text-[11px] text-text-secondary">
            <ListChecks className="w-3 h-3" /> {doneCount}/{lab.steps.length} 步骤已核
          </span>
        </div>

        {/* ── 目标 ── */}
        <div className="relative rounded-2xl bg-bg-card/60 border border-border/40 px-5 py-4">
          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-accent to-transparent" />
          <p className="text-sm leading-relaxed text-text-primary pl-2">
            <span className="inline-flex items-center gap-1 font-bold text-accent mr-1.5">
              <Target className="w-3.5 h-3.5" /> 实验目标
            </span>
            {lab.goal}
          </p>
        </div>

        {/* ── 步骤时间线 ── */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-bold mb-4 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-accent" /> Steps
          </p>
          <div className="relative pl-10">
            {lab.steps.map((s, i) => (
              <div key={i} className={cn('relative pb-6', i < lab.steps.length - 1 && 'last:pb-0')}>
                {/* 连接线 */}
                {i < lab.steps.length - 1 && (
                  <span className="absolute left-[15px] top-9 -bottom-1 w-0.5 rounded bg-gradient-to-b from-accent/50 to-border" />
                )}
                {/* 序号圆 */}
                <span
                  className={cn(
                    'absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                    stepDone[i]
                      ? 'bg-accent border-accent text-white'
                      : 'bg-bg-card border-accent/40 text-accent'
                  )}
                >
                  {i + 1}
                </span>
                <div className={cn(
                  'ml-2 rounded-2xl border p-4 sm:p-5 flex flex-col gap-2.5 transition-all',
                  stepDone[i] ? 'bg-green-500/[0.04] border-green-500/30' : 'bg-bg-card border-border/60'
                )}>
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={!!stepDone[i]}
                      onChange={e => setStepDone(prev => ({ ...prev, [i]: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />
                    <span className={cn('font-bold text-[15px]', stepDone[i] ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent transition-colors')}>
                      {s.title}
                    </span>
                  </label>
                  {s.detail && <p className="text-[13px] text-text-secondary leading-relaxed pl-6">{s.detail}</p>}
                  {s.code && (
                    <Chrome name={`step${i + 1}.java`} right={<ChromeButton onClick={() => navigator.clipboard?.writeText(s.code || '')}>复制</ChromeButton>}>
                      <pre className="p-3.5 text-[11.5px] font-mono leading-relaxed text-[#c9d1d9] overflow-x-auto whitespace-pre">{s.code}</pre>
                    </Chrome>
                  )}
                  {s.check && <p className="text-[11px] text-text-muted pl-6">✔ 自查：{s.check}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 运行器 ── */}
        {lab.runner === 'js' && <JsRunner starter={lab.runnerStarter || '// 在这里写你的代码\nconsole.log("hello lab");'} />}
        {lab.runner === 'web' && lab.webStarter && <WebRunner html={lab.webStarter.html} css={lab.webStarter.css} />}

        {/* ── 验收标准 ── */}
        <div className="rounded-2xl bg-bg-card/60 border border-border/40 p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-bold mb-3 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" /> 验收标准
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {lab.verify.map((v, i) => (
              <div key={i} className="flex items-start gap-2 bg-bg-base rounded-lg px-3 py-2.5 border border-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <span className="text-[13px] text-text-primary leading-relaxed">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 参考答案 ── */}
        {lab.solution && (
          <div className="rounded-2xl border border-border/40 overflow-hidden">
            <button
              onClick={() => setShowSolution(s => !s)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-bg-card hover:bg-bg-base transition-colors group"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-text-secondary group-hover:text-accent transition-colors">
                <Lock className="w-3.5 h-3.5" />
                参考答案 · 建议卡壳 20 分钟以上再看
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', showSolution && 'rotate-180')} />
            </button>
            {showSolution && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-[#0d1117] p-5 text-xs font-mono leading-relaxed text-[#c9d1d9] overflow-x-auto whitespace-pre border-t border-border/40"
              >
                {lab.solution}
              </motion.pre>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};
