import { useEffect, useState, type ElementType } from 'react';
import {
  Monitor, ServerCog, Terminal, Layers, BrainCircuit, Sigma, HardDrive, Shield, Smartphone, Bug, Gamepad2,
  Settings, Wrench, Code2, GitBranch, Server, Boxes, Blocks, BookOpen, Route as RouteIcon, Cpu, Network,
} from 'lucide-react';
import type { Lab } from './labs';

/**
 * 教程目录 / 职业路线 / 实验目录的读取：多个页面共用，进程内缓存 + 并发去重。
 */

export interface Tutorial {
  id: string;
  title: string;
  summary: string;
  domain: string;
  difficulty: '入门' | '进阶' | '高级';
  minutes: number;
  href: string;
  category?: string;
  tags?: string[];
  prereqs?: string[];
}
export interface Domain { id: string; name: string; icon: string; blurb: string; count: number }
export interface TutorialCatalog { domains: Domain[]; tutorials: Tutorial[] }

export interface StageItem { ref: string; why: string }
export interface Stage { name: string; goal: string; items: StageItem[]; checkpoint: string }
export interface Career {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  skills: string[];
  stages: Stage[];
  capstone: { title: string; desc: string };
  extras: StageItem[];
  domains?: string[];
}

/** 实验的类型定义在 labs.ts；这里只负责把 /api/labs 的环境 + 实验拍平成实验列表 */
export type { Lab } from './labs';

/** 知识域 / 路线图标（目录数据里存的是名字） */
export const CATALOG_ICONS: Record<string, ElementType> = {
  Monitor, ServerCog, Terminal, Layers, BrainCircuit, Sigma, HardDrive, Shield, Smartphone, Bug, Gamepad2,
  Settings, Wrench, Code2, GitBranch, Server, Boxes, Blocks, BookOpen, Route: RouteIcon, Cpu, Network,
};
export const catalogIcon = (name: string | undefined, fallback: ElementType = BookOpen): ElementType =>
  (name && CATALOG_ICONS[name]) || fallback;

export const DIFF_STYLE: Record<string, string> = {
  入门: 'bg-green-500/10 text-green-600 dark:text-green-400',
  进阶: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  高级: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const getJson = <T,>(url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(`HTTP ${r.status}`))));

// 进程内缓存 + 并发去重；失败时清掉缓存，下次调用重新请求
const resetters: (() => void)[] = [];
const memoize = <T,>(load: () => Promise<T>) => {
  let req: Promise<T> | null = null;
  resetters.push(() => { req = null; });
  return () => {
    if (!req) req = load().catch((e) => { req = null; throw e; });
    return req;
  };
};

export const fetchTutorials = memoize<TutorialCatalog>(async () => {
  const j = await getJson<{ domains?: Domain[]; tutorials?: Tutorial[] }>('/api/tutorials');
  const tutorials = (j.tutorials || []).map((t) => ({ ...t, href: t.href?.startsWith('/post/') ? t.href : `/post/${t.id}` }));
  return { domains: j.domains || [], tutorials };
});

export const fetchCareers = memoize<Career[]>(async () => {
  const j = await getJson<{ careers?: Career[] }>('/api/careers');
  return j.careers || [];
});

export const fetchLabs = memoize<Lab[]>(async () => {
  const j = await getJson<{ labs?: Record<string, Lab> }>('/api/labs');
  return Object.values(j.labs || {});
});

/** 管理端保存目录后清缓存 */
export const invalidateCatalog = () => resetters.forEach((fn) => fn());

function useLoader<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let dead = false;
    load()
      .then((data) => { if (!dead) setState({ data, error: null }); })
      .catch((e: Error) => { if (!dead) setState({ data: null, error: e.message }); });
    return () => { dead = true; };
  }, [load]);
  return state;
}

export const useTutorials = () => useLoader(fetchTutorials);
export const useCareers = () => useLoader(fetchCareers);
export const useLabs = () => useLoader(fetchLabs);
