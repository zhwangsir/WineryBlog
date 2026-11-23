import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FlaskConical, Play, RotateCcw, Terminal, Code2, CheckCircle2, Circle,
  Send, Loader2, ChevronDown, ChevronUp, Bot, LayoutGrid, Sparkles,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { fetchProgress, markLab, type ProgressData } from '../lib/progress';

interface LabStep { title: string; detail: string; code?: string; check?: string }
interface Lab {
  title: string; runner: string; minutes: number; goal: string; env: string;
  steps: LabStep[]; verify: string[]; solution?: string;
  kind?: 'web' | 'sim'; simEnv?: string; starter?: string;
}

/** 沙箱文档模板：深色样式 + console.log 拦截回显 + 用户代码（错误入页面不炸外层） */
function buildSandboxDoc(userCode: string): string {
  const esc = userCode.replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { background:#0b0f14; color:#dfe6ee; font-family:ui-monospace,Consolas,monospace;
           font-size:13px; padding:14px; margin:0; line-height:1.6; }
    #out .line { border-bottom:1px solid #1c2430; padding:3px 0; white-space:pre-wrap; }
    #out .err { color:#ff6b6b; }
    #cv { background:#0b0f14; image-rendering:pixelated; border:1px solid #1c2430; border-radius:8px; margin-bottom:10px; }
    b.tag { color:#f27d26; }
  </style></head><body>
  <canvas id="cv" width="480" height="160"></canvas>
  <div id="out"></div>
  <script>
    (function () {
      var out = document.getElementById('out');
      var ctx = document.getElementById('cv').getContext('2d');
      function print(text, err) {
        var d = document.createElement('div');
        d.className = 'line' + (err ? ' err' : '');
        d.textContent = String(text);
        out.appendChild(d);
      }
      ['log','info','warn'].forEach(function (k) {
        var orig = console[k];
        console[k] = function () {
          print(Array.prototype.map.call(arguments, function (a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
          }).join(' '));
          orig.apply(console, arguments);
        };
      });
      console.error = function () {
        print('[Error] ' + Array.prototype.map.call(arguments, String).join(' '), true);
      };
      window.onerror = function (msg) { print('[Error] ' + msg, true); };
      window.ctx = ctx;   // 暴露画布上下文给实验脚本
    })();
  </script>
  <script>
  try {
    ${esc}
  } catch (e) { document.getElementById('out').appendChild(Object.assign(document.createElement('div'), { className: 'line err', textContent: '[Error] ' + e.message })); }
  </script>
  </body></html>`;
}

/** 轻量 Markdown 代码块渲染（教练回复用）：``` 拆段 */
const RichText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/```(?:\w*)\n?/g);
  return (
    <div className="text-sm text-text-secondary leading-relaxed space-y-2">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="bg-bg-base border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{p.trim()}</pre>
        ) : (
          p.trim() && <p key={i} className="whitespace-pre-wrap">{p}</p>
        )
      )}
    </div>
  );
};

/** AI 仿真终端：黑底输出区 + 命令输入，由 /api/lab-agent(context=terminal) 驱动 */
const TerminalView: React.FC<{ labId: string; simEnv?: string }> = ({ labId, simEnv }) => {
  const [lines, setLines] = useState<{ text: string; kind?: 'cmd' | 'sys' }[]>([
    { text: `WineryLab 仿真终端 · ${simEnv || '沙箱环境'}`, kind: 'sys' },
    { text: '输入命令或粘贴代码后回车；实验说明见左侧步骤卡。', kind: 'sys' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setLines(l => [...l, { text: msg, kind: 'cmd' }]);
    setBusy(true);
    try {
      historyRef.current.push({ role: 'user', content: msg });
      const r = await fetch('/api/lab-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId, context: 'terminal', message: msg, history: historyRef.current }),
      });
      const j = await r.json();
      const text = j?.choices?.[0]?.message?.content || j?.error || '(环境无响应)';
      historyRef.current.push({ role: 'assistant', content: text });
      setLines(l => [...l, { text }]);
    } catch {
      setLines(l => [...l, { text: '[连接中断，请重试]', kind: 'sys' }]);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div ref={boxRef} className="flex-1 overflow-y-auto bg-[#0a0e13] border border-border rounded-t-xl p-3 font-mono text-[12.5px] leading-relaxed space-y-1.5 min-h-[260px] max-h-[420px]">
        {lines.map((l, i) => (
          <div key={i} className={l.kind === 'cmd' ? 'text-accent before:content-["$_"] before:mr-2 before:text-text-muted whitespace-pre-wrap' : l.kind === 'sys' ? 'text-text-muted text-xs' : 'text-[#c9d4df] whitespace-pre-wrap'}>
            {l.text}
          </div>
        ))}
        {busy && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
      </div>
      <div className="flex items-center gap-2 bg-[#0a0e13] border border-t-0 border-border rounded-b-xl px-3 py-2">
        <span className="text-accent font-mono text-sm">$</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="输入命令，如：redis-cli / INCR views ..."
          className="flex-1 bg-transparent text-[#dfe6ee] font-mono text-sm focus:outline-none placeholder:text-text-muted/60"
          disabled={busy}
        />
        <button onClick={send} disabled={busy || !input.trim()} className="text-text-muted hover:text-accent disabled:opacity-40 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** 教练 Agent 对话面板 */
const CoachPanel: React.FC<{ labId: string }> = ({ labId }) => {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    setMsgs([{ role: 'assistant', content: '客官好呀~ 我是本实验的教练。卡住了就把你当前的写法贴给我，我帮你定位问题；完成了我就帮你逐条核对验收清单！' }]);
    historyRef.current = [];
  }, [labId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', content: msg }]);
    setBusy(true);
    try {
      historyRef.current.push({ role: 'user', content: msg });
      const r = await fetch('/api/lab-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId, context: 'coach', message: msg, history: historyRef.current }),
      });
      const j = await r.json();
      const text = j?.choices?.[0]?.message?.content || j?.error || '(教练暂无响应，请重试)';
      historyRef.current.push({ role: 'assistant', content: text });
      setMsgs(m => [...m, { role: 'assistant', content: text }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: '[连接中断，请重试]' }]);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[300px] bg-bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-accent/5">
        <Bot className="w-4 h-4 text-accent" />
        <span className="text-sm font-bold text-text-primary">实验教练 · 胡桃</span>
        <span className="text-[10px] text-text-muted">引导式陪练 · 卡住两轮才给答案</span>
      </div>
      <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[380px]">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-xl px-3.5 py-2.5 ${m.role === 'user' ? 'bg-accent/15 text-text-primary' : 'bg-bg-base border border-border'}`}>
              {m.role === 'user' ? <p className="text-sm whitespace-pre-wrap">{m.content}</p> : <RichText text={m.content} />}
            </div>
          </div>
        ))}
        {busy && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
      </div>
      <div className="p-3 border-t border-border flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="问教练：卡在哪一步？贴出你的写法…"
          className="flex-1 px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
          disabled={busy}
        />
        <button onClick={send} disabled={busy || !input.trim()} className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-40 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** 沙箱运行区：编辑器 + iframe 实时运行 */
const SandboxView: React.FC<{ labId: string; starter?: string }> = ({ labId, starter }) => {
  const [code, setCode] = useState(starter || '');
  const [doc, setDoc] = useState('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [stepsOpen, setStepsOpen] = useState(true);

  const run = useCallback(() => setDoc(buildSandboxDoc(code)), [code]);

  useEffect(() => {
    setCode(starter || '');
    setDoc('');
  }, [labId, starter]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Code2 className="w-3.5 h-3.5" />
          编辑代码后点「运行」，输出与画布显示在右侧沙箱
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCode(starter || '')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </button>
          <button onClick={run} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors">
            <Play className="w-3.5 h-3.5" /> 运行
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const ta = e.currentTarget;
              const s = ta.selectionStart;
              setCode(code.slice(0, s) + '  ' + code.slice(ta.selectionEnd));
              requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
            }
          }}
          spellCheck={false}
          className="flex-1 min-h-[300px] lg:min-h-[380px] bg-[#0a0e13] text-[#dfe6ee] font-mono text-[12.5px] leading-relaxed p-3 rounded-xl border border-border focus:outline-none focus:border-accent/60 resize-y"
        />
        <div className="flex-1 min-h-[300px] lg:min-h-[380px]">
          {doc ? (
            <iframe
              ref={frameRef}
              title="沙箱预览"
              sandbox="allow-scripts"
              srcDoc={doc}
              className="w-full h-full min-h-[300px] lg:min-h-[380px] rounded-xl border border-border bg-[#0b0f14]"
            />
          ) : (
            <div className="w-full h-full min-h-[300px] lg:min-h-[380px] rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted">
              <Play className="w-6 h-6" />
              <span className="text-sm">点「运行」在沙箱中执行代码</span>
              <span className="text-xs">隔离 iframe · 不影响本页</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LabPage: React.FC = () => {
  const [labs, setLabs] = useState<Record<string, Lab> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [verifyOpen, setVerifyOpen] = useState(true);

  useEffect(() => {
    fetch('/api/labs').then(r => r.json()).then(setLabs).catch(() => {});
    fetchProgress().then(setProgress).catch(() => {});
  }, []);

  const entries = useMemo(() => Object.entries(labs || {}), [labs]);
  const webLabs = entries.filter(([, l]) => l.kind === 'web');
  const simLabs = entries.filter(([, l]) => l.kind === 'sim');
  const active = activeId ? labs?.[activeId] : null;
  const labDone = (id: string) => !!progress?.labs?.[id];

  const toggleDone = async () => {
    if (!activeId) return;
    const next = !labDone(activeId);
    const p = await markLab(activeId, next);
    if (p) setProgress(p);
  };

  return (
    <>
      <SEO title="实验室" description="各种方向的动手实验环境 + AI Agent 陪练" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary flex items-center gap-3 mb-3">
              <FlaskConical className="w-9 h-9 text-accent" />
              实验室
            </h1>
            <p className="text-lg text-text-secondary max-w-3xl">
              <span className="text-accent font-medium">真沙箱</span>（编辑代码即时运行）与
              <span className="text-accent font-medium"> AI 仿真终端</span>（Agent 扮演 Linux / Redis / Node 等环境）双引擎，
              <span className="text-accent font-medium">实验教练</span>全程陪练——卡住了它会教，做完了它帮你验收。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            已完成 {Object.keys(progress?.labs || {}).length} / {entries.length}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
          {/* 实验列表 */}
          <aside className="flex flex-col gap-5">
            {[
              { title: '可运行沙箱', icon: Code2, desc: '代码编辑 + iframe 隔离执行', list: webLabs },
              { title: 'AI 仿真环境', icon: Terminal, desc: 'Agent 扮演命令行环境', list: simLabs },
            ].map(group => {
              const GroupIcon = group.icon;
              return (
                <section key={group.title} className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <GroupIcon className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold text-text-primary">{group.title}</span>
                    <span className="text-xs text-text-muted ml-auto">{group.list.length}</span>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    {group.list.map(([id, lab]) => {
                      const done = labDone(id);
                      const isActive = activeId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => { setActiveId(id); setStepsOpen(true); setVerifyOpen(true); }}
                          className={`text-left px-3 py-2.5 rounded-xl transition-colors flex items-start gap-2 ${isActive ? 'bg-accent/10' : 'hover:bg-bg-base'}`}
                        >
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            : <Circle className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-accent' : 'text-text-muted'}`} />}
                          <span className="min-w-0">
                            <span className={`block text-sm truncate ${isActive ? 'text-accent font-medium' : 'text-text-primary'}`}>{lab.title.replace(/^实验：/, '')}</span>
                            <span className="text-[11px] text-text-muted">{lab.minutes} 分钟 · {lab.steps?.length || 0} 步</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <div className="text-xs text-text-muted px-2 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              完成实验会记入「学习周报」的实验统计；进度匿名保存在本站本地。
            </div>
          </aside>

          {/* 实验房间 */}
          <section className="min-w-0">
            {!active ? (
              <div className="bg-bg-card border border-dashed border-border rounded-2xl p-14 text-center">
                <LayoutGrid className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary mb-1">从左侧选择一个实验开始</p>
                <p className="text-xs text-text-muted">沙箱类实验可真跑代码；仿真类实验由 AI Agent 扮演环境陪练</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* 头部 */}
                <div className="bg-bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-text-primary mb-2">{active.title}</h2>
                      <p className="text-sm text-text-secondary leading-relaxed">{active.goal}</p>
                      <p className="text-xs text-text-muted mt-2">环境：{active.env}{active.kind === 'sim' && active.simEnv ? ` · 仿真：${active.simEnv}` : ''}</p>
                    </div>
                    <button
                      onClick={toggleDone}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                        labDone(activeId!)
                          ? 'bg-green-500/15 text-green-500 border-green-500/30'
                          : 'bg-bg-base text-text-secondary border-border hover:border-green-500/50 hover:text-green-500'
                      }`}
                    >
                      {labDone(activeId!) ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      {labDone(activeId!) ? '已完成' : '标记完成'}
                    </button>
                  </div>
                </div>

                {/* 运行区 */}
                {active.kind === 'web'
                  ? <SandboxView key={activeId!} labId={activeId!} starter={active.starter} />
                  : <TerminalView key={activeId!} labId={activeId!} simEnv={active.simEnv} />}

                {/* 步骤 + 验收（可折叠） */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                    <button onClick={() => setStepsOpen(o => !o)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-base/50 transition-colors">
                      <span className="text-sm font-bold text-text-primary">实验步骤</span>
                      {stepsOpen ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                    </button>
                    {stepsOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {active.steps?.map((s, i) => (
                          <div key={i} className="bg-bg-base rounded-xl p-3">
                            <p className="text-sm font-medium text-accent mb-1">{s.title}</p>
                            <p className="text-xs text-text-secondary leading-relaxed">{s.detail}</p>
                            {s.code && <pre className="mt-2 bg-[#0a0e13] border border-border rounded-lg p-2.5 text-[11px] font-mono overflow-x-auto text-[#c9d4df] whitespace-pre-wrap">{s.code}</pre>}
                            {s.check && <p className="text-[11px] text-green-500/90 mt-1.5">✔ {s.check}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-bg-card border border-border rounded-2xl overflow-hidden self-start w-full">
                    <button onClick={() => setVerifyOpen(o => !o)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-base/50 transition-colors">
                      <span className="text-sm font-bold text-text-primary">验收清单</span>
                      {verifyOpen ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                    </button>
                    {verifyOpen && (
                      <ul className="px-4 pb-4 pt-3 space-y-2 border-t border-border">
                        {active.verify?.map((v, i) => (
                          <li key={i} className="text-sm text-text-secondary flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500/70 shrink-0 mt-0.5" />
                            {v}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* 教练 Agent */}
                <CoachPanel labId={activeId!} />
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </>
  );
};
