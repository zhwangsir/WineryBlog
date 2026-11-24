import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/** 列表页首屏骨架（文章数据到达前） */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="animate-pulse" aria-busy="true" aria-label="内容加载中">
    <div className="mb-6 h-10 w-56 rounded-xl bg-bg-card" />
    <div className="mb-10 h-4 w-2/3 rounded bg-bg-card" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border/40 bg-bg-card">
          <div className="aspect-[16/9] bg-bg-base/60" />
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-5/6 rounded bg-bg-base" />
            <div className="h-3 w-1/2 rounded bg-bg-base" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** 数据加载失败：就地说明 + 重试（不再静默显示成空列表） */
export const LoadError: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-bg-card/60 py-20 text-center">
    <AlertTriangle className="h-10 w-10 text-amber-500" strokeWidth={1.2} />
    <p className="text-lg font-medium text-text-primary">内容没能加载出来</p>
    <p className="max-w-md text-sm text-text-secondary">{message || '服务暂时没有响应，稍后重试一下。'}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        <RotateCcw className="h-4 w-4" /> 重试
      </button>
    )}
  </div>
);
