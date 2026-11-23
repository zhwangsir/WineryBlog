import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ListTree } from 'lucide-react';
import { cn } from '../utils/cn';
import type { TocItem } from '../lib/markdown';

interface TableOfContentsProps {
  items: TocItem[];
  /** 折叠面板形态（窄屏，放在正文上方）；默认是侧栏卡片 */
  collapsible?: boolean;
}

/** 滚动高亮：取最后一个已经滚过阅读线（顶部 140px）的标题 */
function useActiveHeading(items: TocItem[]): string {
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    if (!items.length) return;
    let timer = 0;
    const update = () => {
      timer = 0;
      let current = '';
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) current = item.id;
        else break;
      }
      setActiveId(current);
    };
    // 用定时器节流而不是 requestAnimationFrame：被遮挡 / 后台窗口里渲染帧会暂停
    const schedule = () => {
      if (!timer) timer = window.setTimeout(update, 80);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (timer) window.clearTimeout(timer);
    };
  }, [items]);
  return activeId;
}

const jumpTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
};

/** 文章目录：h2–h4，窄屏折叠；标题很多（>48）时只列最高一级 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({ items, collapsible }) => {
  const activeId = useActiveHeading(items);
  const visible = useMemo(() => {
    if (items.length <= 48) return items;
    const top = Math.min(...items.map((i) => i.depth));
    return items.filter((i) => i.depth === top);
  }, [items]);

  if (!items.length) return null;
  const indentBase = Math.min(...visible.map((i) => i.depth));

  const list = (
    <nav aria-label="目录" className="flex flex-col gap-0.5">
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => jumpTo(item.id)}
          title={item.text}
          className={cn(
            'truncate border-l-2 py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors',
            activeId === item.id
              ? 'border-accent bg-accent/[0.07] font-medium text-accent'
              : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
          )}
          style={{ paddingLeft: 12 + (item.depth - indentBase) * 12 }}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );

  if (collapsible) {
    return (
      <details className="group/toc rounded-xl border border-border/60 bg-bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary select-none [&::-webkit-details-marker]:hidden">
          <ListTree className="h-4 w-4 text-accent" />
          目录
          <span className="text-xs text-text-muted">{items.length} 节</span>
          <ChevronDown className="ml-auto h-4 w-4 text-text-muted transition-transform duration-200 group-open/toc:rotate-180" />
        </summary>
        <div className="max-h-[50vh] overflow-y-auto border-t border-border/60 px-3 py-2 custom-scrollbar">{list}</div>
      </details>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-bg-card p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
        <span className="h-4 w-1 rounded-full bg-accent" />
        目录
      </p>
      <div className="custom-scrollbar max-h-[calc(100vh-11rem)] overflow-y-auto">{list}</div>
    </div>
  );
};
