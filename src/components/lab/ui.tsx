import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Eye, Lightbulb, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LAB_LEVEL_STYLE, type Lab, type LabEnv, type LabStep } from '../../lib/labs';

/** 断点：≥1024 是多栏工作台，更窄切成标签页 */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
}

export const LevelChip: React.FC<{ level: Lab['level'] }> = ({ level }) => (
  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', LAB_LEVEL_STYLE[level])}>{level}</span>
);

export const EnvDot: React.FC<{ env: LabEnv; className?: string }> = ({ env, className }) => (
  <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', className)} style={{ background: env.color }} aria-hidden="true" />
);

/** 返回实验室（所有环境） */
export const BackLink: React.FC = () => (
  <Link
    to="/lab"
    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-bg-card hover:text-accent"
  >
    <ChevronLeft className="h-4 w-4" />
    实验室
  </Link>
);

/** 轻量确认框（载入参考答案、重置代码这类不可撤回的操作前用） */
export const Confirm: React.FC<{ title: string; body?: string; confirmText?: string; danger?: boolean; onOk: () => void; onCancel: () => void }> =
  ({ title, body, confirmText = '确定', danger, onOk, onCancel }) => (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-bold text-text-primary">{title}</p>
        {body && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">取消</button>
          <button type="button" onClick={onOk} autoFocus className={cn('rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors', danger ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent-hover')}>{confirmText}</button>
        </div>
      </div>
    </div>
  );

/** 步骤里的示例代码 */
export const Snippet: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* 剪贴板不可用时忽略 */ }
  };
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#232b38] bg-[#0d1117]">
      <button
        type="button"
        onClick={copy}
        className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-[#161d27] px-1.5 py-0.5 text-[11px] text-[#9aa6b6] transition-colors hover:text-[#d6dee8]"
      >
        {copied ? <Check className="h-3 w-3 text-[#7ee787]" /> : <Copy className="h-3 w-3" />} {copied ? '已复制' : '复制'}
      </button>
      <pre className="custom-scrollbar max-h-64 overflow-auto p-3 pr-14 font-mono text-[12px] leading-[1.65] whitespace-pre text-[#c9d4df]">{code}</pre>
    </div>
  );
};

/** 参考说明里的一个步骤：只读的折叠卡片，点标题展开 / 收起 */
export const StepCard: React.FC<{
  step: LabStep; index: number; open: boolean; last: boolean; onToggle: () => void; onNext: () => void;
}> = ({ step, index, open, last, onToggle, onNext }) => (
  <div className={cn('rounded-xl border transition-colors', open ? 'border-accent/60 bg-accent/[0.06]' : 'border-border/60 bg-bg-card hover:border-accent/40')}>
    <button type="button" onClick={onToggle} className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left" aria-expanded={open}>
      <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', open ? 'bg-accent text-white' : 'border border-border text-text-muted')}>
        {index + 1}
      </span>
      <span className={cn('min-w-0 flex-1 text-[13.5px] leading-snug', open ? 'font-semibold text-accent' : 'font-medium text-text-primary')}>{step.title}</span>
      <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
    </button>
    {open && (
      <div className="space-y-2.5 px-3 pb-3 pl-[2.15rem]">
        <p className="text-[13px] leading-relaxed text-text-secondary">{step.detail}</p>
        {step.code && <Snippet code={step.code} />}
        <p className="flex items-start gap-1.5 rounded-lg bg-accent/[0.07] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-text-primary">
          <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span><span className="font-semibold">预期看到：</span>{step.check}</span>
        </p>
        {step.hint && (
          <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/[0.08] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span><span className="font-semibold">提示：</span>{step.hint}</span>
          </p>
        )}
        {!last && (
          <button type="button" onClick={onNext} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs whitespace-nowrap text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
            看下一步 <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )}
  </div>
);

export const PanelToggleIcon: React.FC<{ open: boolean }> = ({ open }) => open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />;
