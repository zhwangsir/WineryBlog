import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronDown, ChevronLeft, ChevronRight, Eye, PanelLeftOpen, Play, RotateCcw, Send, Sparkles, SquareTerminal, Undo2,
} from 'lucide-react';
import { SEO } from '../SEO';
import CodeEditor from './CodeEditor';
import CoachPanel from './CoachPanel';
import WebRunner from './runners/WebRunner';
import JsRunner from './runners/JsRunner';
import PythonRunner from './runners/PythonRunner';
import AiRunner from './runners/AiRunner';
import SimTerminal from './runners/SimTerminal';
import { BackLink, Confirm, EnvDot, LevelChip, PanelToggleIcon, StepCard, useMedia as useMediaQuery } from './ui';
import { langOf, labsOfEnv, type Lab, type LabEnv, type LabsData } from '../../lib/labs';
import { cn } from '../../utils/cn';

const COACH_KEY = 'winery-lab-coach';
const draftKey = (envId: string, labId?: string) => `winery-lab-draft:${envId}:${labId || 'blank'}`;

/** 读者在本地的草稿：编辑器里的代码、参考说明里展开的那一步 */
interface Draft { files: Record<string, string>; open: number }

function loadDraft(envId: string, labId: string | undefined, names: string[]): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(envId, labId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    if (!d || typeof d.files !== 'object' || !d.files) return null;
    // 内容更新后文件名可能变了：只认现在还存在的文件
    const files: Record<string, string> = {};
    for (const n of names) if (typeof d.files[n] === 'string') files[n] = d.files[n];
    if (!Object.keys(files).length) return null;
    return { files, open: Number.isInteger(d.open) ? (d.open as number) : 0 };
  } catch {
    return null;
  }
}

type Pane = 'side' | 'code' | 'result' | 'coach';

// SQLite 引擎（sql.js + wasm）接近 1 MB，只有打开 SQL 环境时才下载
const SqlRunner = React.lazy(() => import('./runners/SqlRunner'));

interface Props { data: LabsData; env: LabEnv; lab?: Lab }

/**
 * 环境工作台：顶部操作栏 + 左侧说明面板 + 中间「编辑器 | 运行结果」+ 右侧可开关的 AI 助教。
 * 实验室只提供环境——打开就能自由练习；载入的示例（如果有）只是起始代码加一份参考说明，不做完成度追踪。
 * 窄屏（< 1024px）切成标签页，一次只显示一块。
 */
export const Workbench: React.FC<Props> = ({ data, env, lab }) => {
  const navigate = useNavigate();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const wide = useMediaQuery('(min-width: 1440px)');
  const examples = useMemo(() => labsOfEnv(data, env.id), [data, env.id]);

  // 起始代码：载入了示例就用示例的，否则用环境的空白起步代码（示例自己没带文件时也退回它）
  const starter = useMemo(
    () => Object.fromEntries(((lab?.files?.length ? lab.files : env.blank) || []).map((f) => [f.name, f.content])),
    [lab, env],
  );
  const fileNames = Object.keys(starter);
  const draft0 = useMemo(() => loadDraft(env.id, lab?.id, fileNames), [env.id, lab?.id, starter]);   // eslint-disable-line react-hooks/exhaustive-deps

  const [files, setFiles] = useState<Record<string, string>>(() => draft0?.files ?? starter);
  const [activeFile, setActiveFile] = useState(() => fileNames[0] ?? '');
  const [solutionLoaded, setSolutionLoaded] = useState(false);
  const backupRef = useRef<Record<string, string> | null>(null);
  const [open, setOpen] = useState(() => Math.min(draft0?.open ?? 0, Math.max(0, (lab?.steps.length ?? 1) - 1)));

  const [runId, setRunId] = useState(0);
  const [resetId, setResetId] = useState(0);
  const [output, setOutput] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; body: string; confirmText?: string; danger?: boolean; onOk: () => void } | null>(null);

  const [panelOpen, setPanelOpen] = useState<boolean | null>(null);
  const showPanel = panelOpen ?? wide;
  const [coachOpen, setCoachOpen] = useState(() => { try { return localStorage.getItem(COACH_KEY) !== '0'; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem(COACH_KEY, coachOpen ? '1' : '0'); } catch { /* 隐私模式下忽略 */ } }, [coachOpen]);
  const [pane, setPane] = useState<Pane>('side');

  const [split, setSplit] = useState(env.runner === 'ai' ? 0.5 : 0.52);
  const [dragging, setDragging] = useState(false);
  const centerRef = useRef<HTMLDivElement | null>(null);

  // 草稿自动保存
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(draftKey(env.id, lab?.id), JSON.stringify({ files, open })); } catch { /* 存储满了就放弃 */ }
    }, 500);
    return () => window.clearTimeout(t);
  }, [env.id, lab?.id, files, open]);

  const run = useCallback(() => {
    setRunId((n) => n + 1);
    if (!desktop) setPane('result');
  }, [desktop]);

  // Ctrl / Cmd + Enter 运行
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  // 拖动分隔条调整「编辑器 | 结果」的比例
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const r = centerRef.current?.getBoundingClientRect();
      if (!r) return;
      setSplit(Math.max(0.22, Math.min(0.78, (e.clientX - r.left) / r.width)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging]);

  const setFile = (name: string, content: string) => setFiles((prev) => (prev[name] === content ? prev : { ...prev, [name]: content }));

  /** 切换示例：不带 id 就是回到空白练习（URL 变化后页面会按新的示例重新挂载工作台） */
  const openExample = (id?: string) => navigate(id ? `/lab?env=${env.id}&exp=${id}` : `/lab?env=${env.id}`);

  const resetCode = () => setConfirm({
    title: '把代码重置回起始状态？',
    body: `你在${lab ? '这个示例' : '这个环境'}里改过的代码会被丢弃。载入过的参考答案也会一并撤掉。`,
    confirmText: '重置代码',
    danger: true,
    onOk: () => {
      setFiles(starter);
      backupRef.current = null;
      setSolutionLoaded(false);
      setConfirm(null);
      setResetId((n) => n + 1);       // SQL：顺便把练习库的数据也还原
    },
  });

  const loadSolution = () => setConfirm({
    title: '载入参考答案？',
    body: '参考答案会覆盖编辑器里的同名文件。你现在的代码会先备份，随时可以撤销回来。建议自己先试过再看。',
    confirmText: '载入参考答案',
    onOk: () => {
      backupRef.current = files;
      setFiles((prev) => ({ ...prev, ...Object.fromEntries((lab?.solution || []).map((f) => [f.name, f.content])) }));
      setSolutionLoaded(true);
      setConfirm(null);
    },
  });
  const undoSolution = () => {
    if (backupRef.current) setFiles(backupRef.current);
    backupRef.current = null;
    setSolutionLoaded(false);
  };

  const stepPrev = () => setOpen((s) => Math.max(0, s - 1));
  const stepNext = () => setOpen((s) => Math.min((lab?.steps.length ?? 1) - 1, s + 1));
  const runLabel = env.runner === 'web' ? '刷新预览' : env.runner === 'ai' ? '发送' : env.runner === 'sim' ? '在终端运行' : '运行';
  const RunIcon = env.runner === 'ai' ? Send : env.runner === 'sim' ? SquareTerminal : Play;

  const runnerProps = { lab, env, files, activeFile, runId, onOutput: setOutput };

  const sidePanel = (
    <>
      <div className="shrink-0 space-y-3 px-4 pt-4">
        {lab ? (
          <>
            <button type="button" onClick={() => openExample()} className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent">
              <ChevronLeft className="h-3.5 w-3.5" /> 空白练习与全部示例
            </button>
            <h2 className="text-lg leading-snug font-bold text-text-primary">{lab.title}</h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
              <LevelChip level={lab.level} />
              <span>约 {lab.minutes} 分钟</span>
              <span>·</span>
              <span>{lab.steps.length} 步</span>
              {lab.tags.map((t) => <span key={t} className="rounded-full border border-border/60 px-2 py-0.5">{t}</span>)}
            </div>
            <p className="border-l-2 border-accent pl-3 text-[13.5px] leading-relaxed text-text-primary">{lab.goal}</p>
            <p className="text-xs leading-relaxed text-text-muted">示例只是一份参考：可以从任意一步看起，也可以只借它的起始代码，练别的完全没问题。</p>
          </>
        ) : (
          <>
            <h2 className="flex items-center gap-2 text-lg leading-snug font-bold text-text-primary">
              <EnvDot env={env} />
              {env.name}
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">自由练习</span>
            </h2>
            <p className="text-sm font-medium text-text-primary">{env.tagline}</p>
            <p className="text-[13.5px] leading-relaxed text-text-secondary">{env.desc}</p>
            <p className="text-xs text-text-muted">{env.engine}</p>
          </>
        )}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {lab ? (
          <>
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-text-muted uppercase"><Eye className="h-3.5 w-3.5 text-accent" /> 参考步骤</h3>
              <div className="space-y-2">
                {lab.steps.map((s, i) => (
                  <StepCard
                    key={i} step={s} index={i} open={i === open} last={i === lab.steps.length - 1}
                    onToggle={() => setOpen(i)} onNext={() => setOpen(i + 1)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-[11px] font-bold tracking-widest text-text-muted uppercase">自查清单</h3>
              <ul className="space-y-1.5">
                {lab.verify.map((v, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                    {v}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
            <section>
              <h3 className="mb-2 text-[11px] font-bold tracking-widest text-text-muted uppercase">怎么用</h3>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-text-secondary">
                <li>想练什么就写什么。编辑器里的起步代码只是一个能跑通的最简示例，尽管改、尽管删。</li>
                {env.runner === 'sim'
                  ? <li>命令直接在右侧终端里敲；写在文件里的脚本点「在终端运行」交给它执行。</li>
                  : <li>按 Ctrl / ⌘ + Enter（或右上角的按钮）运行，结果立刻显示在右边。</li>}
                <li>拖动编辑器和结果之间的分隔条可以调整宽度。</li>
                <li>代码自动保存在浏览器里，下次打开还在；「重置代码」随时回到起步状态。</li>
              </ul>
            </section>
            {examples.length > 0 && (
              <section>
                <h3 className="mb-1 text-[11px] font-bold tracking-widest text-text-muted uppercase">示例练习 · 可选</h3>
                <p className="mb-2.5 text-xs leading-relaxed text-text-muted">每个示例给一份起始代码和一份参考说明。想用就用，不用也完全不影响练习。</p>
                <div className="space-y-1.5">
                  {examples.map((x, i) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => openExample(x.id)}
                      className="group flex w-full items-start gap-2.5 rounded-xl border border-border/60 bg-bg-card px-3 py-2.5 text-left transition-colors hover:border-accent/50"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-text-muted transition-colors group-hover:border-accent group-hover:text-accent">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-text-primary transition-colors group-hover:text-accent">{x.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                          <LevelChip level={x.level} />
                          <span>约 {x.minutes} 分钟 · {x.steps.length} 步</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );

  const codePane = (
    <div className="flex h-full min-h-0 flex-col">
      {fileNames.length > 0 && (
        <div className="flex h-9 shrink-0 items-center border-b border-[#1c2430] bg-[#0a0e13] px-1.5">
          {fileNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveFile(name)}
              aria-selected={activeFile === name}
              className={cn('relative mr-0.5 flex h-7 items-center rounded-md px-2.5 font-mono text-[12px] transition-colors', activeFile === name ? 'bg-[#1a212c] text-[#d6dee8]' : 'text-[#7d8899] hover:text-[#c9d4df]')}
            >
              {name}
              {files[name] !== starter[name] && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" aria-label="已修改" />}
            </button>
          ))}
          {solutionLoaded && (
            <span className="ml-1 flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              <BookOpen className="h-3 w-3" /> 参考答案已载入
              <button type="button" onClick={undoSolution} className="underline decoration-dotted hover:text-accent-hover">撤销</button>
            </span>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1">
        {activeFile && <CodeEditor value={files[activeFile] ?? ''} onChange={(v) => setFile(activeFile, v)} lang={langOf(activeFile)} name={activeFile} />}
      </div>
      <div className="flex h-6 shrink-0 items-center gap-3 border-t border-[#1c2430] bg-[#0a0e13] px-3 font-mono text-[11px] text-[#5b6676]">
        {activeFile && <span>{activeFile} · {langOf(activeFile)}</span>}
        <span className="ml-auto">{env.engine}</span>
      </div>
    </div>
  );

  const resultPane = (
    <div className="h-full min-h-0">
      {env.runner === 'web' && <WebRunner {...runnerProps} />}
      {env.runner === 'js' && <JsRunner {...runnerProps} />}
      {env.runner === 'python' && <PythonRunner {...runnerProps} />}
      {env.runner === 'sql' && (
        <React.Suspense fallback={<div className="flex h-full items-center justify-center bg-[#0a0e13] text-[13px] text-[#7d8899]">正在加载 SQLite 引擎…</div>}>
          <SqlRunner {...runnerProps} seed={lab?.seed ?? data.defaultSeed} resetId={resetId} />
        </React.Suspense>
      )}
      {env.runner === 'ai' && <AiRunner {...runnerProps} />}
      {env.runner === 'sim' && <SimTerminal {...runnerProps} stepIndex={open} />}
    </div>
  );

  const coachPane = <CoachPanel lab={lab} env={env} stepIndex={open} files={files} output={output} onClose={() => { setCoachOpen(false); if (!desktop) setPane('side'); }} />;

  const actionBtn = 'flex h-9 items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40';

  return (
    <>
      <SEO title={lab ? `${lab.title} · ${env.name} · 实验室` : `${env.name} · 实验室`} description={lab ? lab.goal : env.tagline} />
      <div className={cn('relative flex h-[calc(100vh-4rem)] min-h-[480px] flex-col bg-bg-base', dragging && 'select-none')}>
        {/* 顶部操作栏 */}
        <header className="relative z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border bg-bg-card px-3 py-1.5">
          <BackLink />
          <span className="hidden text-border sm:inline">/</span>
          <h1 className="flex min-w-0 shrink-0 items-center gap-2 text-[15px] leading-tight font-bold text-text-primary">
            <EnvDot env={env} />
            {env.name}
          </h1>

          {/* 示例练习：可选。随时切换到别的示例，或回到空白练习 */}
          {examples.length > 0 && (
            <span className="relative min-w-0">
              <label htmlFor="lab-example" className="sr-only">示例练习</label>
              <select
                id="lab-example"
                value={lab?.id || ''}
                onChange={(e) => openExample(e.target.value || undefined)}
                className="h-9 max-w-[46vw] cursor-pointer appearance-none truncate rounded-xl border border-border bg-bg-card pr-8 pl-3 text-[13px] font-medium text-text-primary transition-colors hover:border-accent/60 focus:border-accent focus:outline-none sm:max-w-[200px] xl:max-w-[300px]"
              >
                <option value="">空白练习</option>
                {examples.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </span>
          )}

          <div className="hidden flex-1 sm:block" />

          {desktop && (
            <button type="button" onClick={() => setPanelOpen((o) => !(o ?? wide))} title={showPanel ? '收起说明面板' : '展开说明面板'} aria-pressed={showPanel} className={cn(actionBtn, 'w-9 justify-center px-0', showPanel && 'border-accent/60 text-accent')}>
              <PanelToggleIcon open={!!showPanel} />
            </button>
          )}
          <button type="button" onClick={run} title={`${runLabel}（Ctrl / ⌘ + Enter）`} className={cn('flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold text-white transition-colors', env.runner === 'web' ? 'border border-border bg-bg-card text-text-primary hover:border-accent/60 hover:text-accent' : 'bg-accent hover:bg-accent-hover')}>
            <RunIcon className="h-4 w-4" /> {runLabel}
          </button>
          {fileNames.length > 0 && (
            <>
              <button type="button" onClick={resetCode} title="丢弃改动，回到起步代码" className={actionBtn}><RotateCcw className="h-4 w-4" /> <span className="hidden md:inline">重置代码</span></button>
              {(lab?.solution?.length ?? 0) > 0 && (
                <button type="button" onClick={solutionLoaded ? undoSolution : loadSolution} title={solutionLoaded ? '撤销载入的参考答案' : '把这个示例的参考答案载入编辑器'} className={cn(actionBtn, solutionLoaded && 'border-accent/60 text-accent')}>
                  {solutionLoaded ? <Undo2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />} <span className="hidden md:inline">{solutionLoaded ? '撤销答案' : '参考答案'}</span>
                </button>
              )}
            </>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={coachOpen}
            onClick={() => setCoachOpen((o) => !o)}
            title={coachOpen ? '关闭 AI 辅助教学' : '开启 AI 辅助教学：助教看得见你的代码和运行结果'}
            className={cn('flex h-9 items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition-colors', coachOpen ? 'border-accent/60 bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:border-accent/60 hover:text-accent')}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI 辅助教学</span>
            <span className={cn('relative h-4 w-7 rounded-full transition-colors', coachOpen ? 'bg-accent' : 'bg-border')}>
              <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', coachOpen ? 'left-3.5' : 'left-0.5')} />
            </span>
          </button>
        </header>

        {/* 窄屏：标签页切换 */}
        {!desktop && (
          <div className="flex shrink-0 border-b border-border bg-bg-card" role="tablist" aria-label="工作台区域">
            {([
              ['side', lab ? '参考' : '说明'], ['code', '代码'], ['result', env.runner === 'sim' ? '终端' : env.runner === 'ai' ? '输出' : '结果'],
              ...(coachOpen ? [['coach', 'AI 助教'] as [Pane, string]] : []),
            ] as [Pane, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={pane === id}
                onClick={() => setPane(id)}
                className={cn('h-10 flex-1 text-[13px] font-medium transition-colors', pane === id ? 'border-b-2 border-accent text-accent' : 'text-text-secondary hover:text-text-primary')}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {desktop ? (
            <>
              {showPanel && (
                <aside className="flex w-[290px] shrink-0 flex-col border-r border-border bg-bg-card xl:w-[310px]">{sidePanel}</aside>
              )}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {!showPanel && (
                  <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-bg-card px-3">
                    <button type="button" onClick={() => setPanelOpen(true)} className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-accent">
                      <PanelLeftOpen className="h-4 w-4" /> {lab ? '参考说明' : '环境说明'}
                    </button>
                    {lab ? (
                      <>
                        <span className="hidden shrink-0 text-xs text-text-muted sm:inline">步骤 {open + 1}/{lab.steps.length}</span>
                        <button type="button" onClick={() => setPanelOpen(true)} className="min-w-0 truncate text-[13px] font-medium text-text-primary transition-colors hover:text-accent" title="展开参考说明">{lab.steps[open].title}</button>
                        <span className="hidden min-w-0 truncate text-xs text-text-muted 2xl:block">预期看到：{lab.steps[open].check}</span>
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          <button type="button" onClick={stepPrev} disabled={open === 0} aria-label="上一步" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-base hover:text-accent disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                          <button type="button" onClick={stepNext} disabled={open >= lab.steps.length - 1} aria-label="下一步" className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-base hover:text-accent disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                      </>
                    ) : (
                      <span className="min-w-0 truncate text-xs text-text-muted">{env.desc}</span>
                    )}
                  </div>
                )}
                <div ref={centerRef} className={cn('flex min-h-0 min-w-0 flex-1', dragging && '[&_iframe]:pointer-events-none')}>
                  {fileNames.length > 0 && (
                    <section className="flex min-h-0 min-w-0 flex-col" style={{ width: `${split * 100}%` }}>
                      {codePane}
                    </section>
                  )}
                  {fileNames.length > 0 && (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="调整编辑器与结果区的宽度"
                      onPointerDown={(e) => { e.preventDefault(); setDragging(true); }}
                      className={cn('group relative w-2 shrink-0 cursor-col-resize bg-transparent', dragging && 'bg-accent/30')}
                    >
                      <span className={cn('absolute top-1/2 left-1/2 h-10 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-accent', dragging && 'bg-accent')} />
                    </div>
                  )}
                  <section className="flex min-h-0 min-w-0 flex-1 flex-col">{resultPane}</section>
                </div>
              </div>
              {coachOpen && <aside className="min-h-0 w-[330px] shrink-0 2xl:w-[370px]">{coachPane}</aside>}
            </>
          ) : (
            <>
              {pane === 'side' && <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">{sidePanel}</div>}
              {pane === 'code' && fileNames.length > 0 && <div className="min-h-0 flex-1">{codePane}</div>}
              {pane === 'result' && <div className="min-h-0 flex-1">{resultPane}</div>}
              {pane === 'coach' && coachOpen && <div className="min-h-0 flex-1">{coachPane}</div>}
            </>
          )}
        </div>

        {confirm && <Confirm title={confirm.title} body={confirm.body} confirmText={confirm.confirmText} danger={confirm.danger} onOk={confirm.onOk} onCancel={() => setConfirm(null)} />}
      </div>
    </>
  );
};

export default Workbench;
