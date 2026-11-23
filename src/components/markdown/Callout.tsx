import React from 'react';
import { ChevronRight, Info, Lightbulb, CheckCircle2, AlertTriangle, Ban, HelpCircle, Megaphone } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calloutTitle, type CalloutKind } from '../../lib/markdown';

const ICONS: Record<CalloutKind, React.ElementType> = {
  note: Info,
  tip: Lightbulb,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: Ban,
  question: HelpCircle,
  important: Megaphone,
};

const STYLES: Record<CalloutKind, string> = {
  note: 'border-blue-500/25 bg-blue-500/[0.07] dark:bg-blue-400/[0.08] text-blue-600 dark:text-blue-400',
  tip: 'border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08] text-emerald-600 dark:text-emerald-400',
  info: 'border-sky-500/25 bg-sky-500/[0.07] dark:bg-sky-400/[0.08] text-sky-600 dark:text-sky-400',
  success: 'border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08] text-emerald-600 dark:text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/[0.08] dark:bg-amber-400/[0.09] text-amber-600 dark:text-amber-400',
  danger: 'border-red-500/25 bg-red-500/[0.07] dark:bg-red-400/[0.08] text-red-600 dark:text-red-400',
  question: 'border-violet-500/25 bg-violet-500/[0.07] dark:bg-violet-400/[0.08] text-violet-600 dark:text-violet-400',
  important: 'border-orange-500/30 bg-orange-500/[0.08] dark:bg-orange-400/[0.09] text-orange-600 dark:text-orange-400',
};

interface CalloutProps {
  kind: CalloutKind;
  title?: string;
  collapsible?: boolean;
  children?: React.ReactNode;
}

/**
 * 正文提示卡：mkdocs / VuePress 容器、GitHub 警示块、<details> 折叠块统一渲染成这种形态。
 * collapsible 时是原生 <details>（答案类内容默认折叠）。
 */
export const Callout: React.FC<CalloutProps> = ({ kind, title, collapsible, children }) => {
  const Icon = ICONS[kind] || Info;
  const label = title || calloutTitle(kind);
  const body = (
    <>
      {collapsible ? null : (
        <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </p>
      )}
      <div className="callout-body min-w-0 flex-1 text-text-secondary">{children}</div>
    </>
  );

  if (collapsible) {
    return (
      <details className={cn('callout group my-5 rounded-xl border border-l-4 px-4 py-2.5 text-[15px]', STYLES[kind])}>
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-semibold select-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90" />
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </summary>
        <div className="pt-2">{body}</div>
      </details>
    );
  }

  return (
    <div className={cn('callout my-5 rounded-xl border border-l-4 px-4 py-3 text-[15px]', STYLES[kind])}>
      {body}
    </div>
  );
};
