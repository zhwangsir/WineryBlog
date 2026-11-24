import { useEffect, useState, type ElementType } from 'react';
import { Braces, BrainCircuit, Coffee, Database, FileCode2, PanelsTopLeft, Server, Terminal } from 'lucide-react';

/**
 * 实验室的数据模型：环境（前端 / JavaScript / Python / SQL / AI 提示词 / 仿真终端…）→ 可选的示例练习。
 * 实验室只提供环境：打开环境就能自由练习，示例只是一键载入的起始代码加一份参考，不做任何完成度追踪。
 * 数据来自 /api/labs（由 scripts/build-labs.mjs 从 scripts/labs-src/ 汇编）。
 */

export type LabLang =
  | 'html' | 'css' | 'javascript' | 'typescript' | 'python' | 'sql' | 'markdown'
  | 'shell' | 'java' | 'kotlin' | 'json' | 'yaml' | 'text';

export interface LabFile { name: string; lang: LabLang; content: string }

export interface LabStep {
  title: string;
  detail: string;
  /** 这一步做完后读者能亲眼核对的现象 */
  check: string;
  hint?: string;
  /** 示例代码 */
  code?: string;
}

/** web / js / python / sql / ai 在浏览器里真实运行；sim 是由大模型扮演的终端 */
export type LabRunner = 'web' | 'js' | 'python' | 'sql' | 'ai' | 'sim';

export interface LabEnv {
  id: string;
  name: string;
  runner: LabRunner;
  order: number;
  icon: string;
  color: string;
  tagline: string;
  desc: string;
  files: string[];
  engine: string;
  labCount: number;
  /** 打开环境时编辑器里的起步代码（空白练习） */
  blank: LabFile[];
  /** 仿真终端的环境设定 */
  sim?: { title: string; setup: string; rules: string[] };
}

export type LabLevel = '入门' | '进阶' | '挑战';

export interface Lab {
  id: string;
  env: string;
  /** 关联的文章 id（有则文章页出现「配套示例」的入口） */
  post?: string;
  title: string;
  summary: string;
  goal: string;
  minutes: number;
  level: LabLevel;
  tags: string[];
  order: number;
  /** 起始代码 */
  files?: LabFile[];
  /** 参考答案（只需包含有改动的文件） */
  solution?: LabFile[];
  solutionNotes?: string;
  steps: LabStep[];
  verify: string[];
  /** sql：这一实验专用的建表与数据 */
  seed?: string;
  sim?: { setup?: string; rules?: string[] };
  simEnv?: string;
}

export interface LabsData {
  v: number;
  builtAt: string;
  defaultSeed: string;
  envs: LabEnv[];
  labs: Record<string, Lab>;
}

/** 环境图标（envs.json 里只存名字） */
export const LAB_ICON: Record<string, ElementType> = {
  PanelsTopLeft, Braces, FileCode2, Database, BrainCircuit, Terminal, Server, Coffee,
};

export const LAB_LEVEL_STYLE: Record<LabLevel, string> = {
  入门: 'bg-green-500/10 text-green-600 dark:text-green-400',
  进阶: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  挑战: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export const isRealEnv = (env: LabEnv | undefined) => !!env && env.runner !== 'sim';

/** 某个环境下的示例练习，按 order 排序 */
export const labsOfEnv = (data: LabsData | null, envId: string | null): Lab[] =>
  !data || !envId ? [] : Object.values(data.labs).filter((l) => l.env === envId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

export const envOfLab = (data: LabsData | null, lab: Lab | undefined) =>
  data && lab ? data.envs.find((e) => e.id === lab.env) : undefined;

// 进程内缓存 + 并发去重；失败时清掉缓存，下次重新请求
let labsReq: Promise<LabsData> | null = null;
export const fetchLabs = (): Promise<LabsData> => {
  if (!labsReq) {
    labsReq = fetch('/api/labs').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<LabsData>;
    }).catch((e) => { labsReq = null; throw e; });
  }
  return labsReq;
};

export const useLabsData = () => {
  const [state, setState] = useState<{ data: LabsData | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let dead = false;
    fetchLabs()
      .then((data) => { if (!dead) setState({ data, error: null }); })
      .catch((e: Error) => { if (!dead) setState({ data: null, error: e.message }); });
    return () => { dead = true; };
  }, []);
  return state;
};

/** 文件名 → 编辑器语言 */
export const langOf = (name: string, fallback: LabLang = 'text'): LabLang => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, LabLang> = {
    html: 'html', htm: 'html', css: 'css', js: 'javascript', mjs: 'javascript', ts: 'typescript',
    py: 'python', sql: 'sql', md: 'markdown', sh: 'shell', bash: 'shell', java: 'java', jsh: 'java',
    kt: 'kotlin', kts: 'kotlin', json: 'json', yaml: 'yaml', yml: 'yaml', conf: 'text', txt: 'text',
  };
  return map[ext] || fallback;
};
