import React from 'react';

/**
 * 路由代码块加载期间的占位。首页以外的页面都是懒加载的，
 * 首次进入要先取代码块，这里给一个轻量骨架而不是空白。
 */
export const PageFallback: React.FC = () => (
  <div className="animate-pulse py-10" aria-busy="true" aria-label="页面加载中">
    <div className="h-10 w-48 rounded-lg bg-bg-card" />
    <div className="mt-6 h-4 w-2/3 rounded bg-bg-card" />
    <div className="mt-3 h-4 w-1/2 rounded bg-bg-card" />
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-40 rounded-2xl border border-border/40 bg-bg-card" />
      ))}
    </div>
  </div>
);
