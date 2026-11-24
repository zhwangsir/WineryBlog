import React, { useEffect, useRef } from 'react';
import { Eraser } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LEVEL_CLASS, type LogLine } from './types';

const PREFIX: Record<LogLine['level'], string> = { log: '', result: '⮑ ', warn: '⚠ ', error: '✖ ', sys: '· ' };

interface Props {
  lines: LogLine[];
  title?: string;
  empty?: string;
  running?: boolean;
  onClear?: () => void;
  className?: string;
}

/** 结果区的控制台：等宽字体、按级别着色、自动跟到底部（读者往上翻时不打扰） */
export const ConsoleView: React.FC<Props> = ({ lines, title = '控制台', empty = '运行后，输出会显示在这里', running, onClear, className }) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className={cn('flex min-h-0 flex-col bg-[#0a0e13]', className)}>
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-[#1c2430] px-3">
        <span className="text-[11px] font-semibold tracking-wide text-[#8b96a6]">{title}</span>
        {running && <span className="inline-flex items-center gap-1 text-[11px] text-[#e3b341]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e3b341]" />运行中</span>}
        {lines.length > 0 && <span className="text-[11px] text-[#5b6676]">{lines.length} 行</span>}
        {onClear && lines.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            title="清空输出"
            aria-label="清空输出"
            className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#8b96a6] transition-colors hover:bg-[#1a212c] hover:text-[#d6dee8]"
          >
            <Eraser className="h-3 w-3" /> 清空
          </button>
        )}
      </div>
      <div
        ref={bodyRef}
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-[1.7]"
        aria-live="polite"
      >
        {lines.length === 0
          ? <p className="select-none text-[#5b6676]">{empty}</p>
          : lines.map((l) => (
            <div key={l.id} className={cn('whitespace-pre-wrap break-words', LEVEL_CLASS[l.level])}>
              {PREFIX[l.level]}{l.text}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ConsoleView;
