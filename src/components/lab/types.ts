import type { Lab, LabEnv } from '../../lib/labs';

export type LogLevel = 'log' | 'warn' | 'error' | 'result' | 'sys';

export interface LogLine {
  id: number;
  level: LogLevel;
  text: string;
}

/** 各运行器的公共入参。lab 是当前载入的示例练习，自由练习（空白环境）时没有 */
export interface RunnerProps {
  lab?: Lab;
  env: LabEnv;
  // 当前编辑器里的全部文件内容（文件名 → 内容）
  files: Record<string, string>;
  // 当前选中的文件名
  activeFile: string;
  // 每次点「运行」加一；0 表示还没有点过
  runId: number;
  // 把最近的输出交给 AI 助教做上下文
  onOutput: (text: string) => void;
}

let seq = 0;
export const mkLine = (level: LogLevel, text: string): LogLine => ({ id: ++seq, level, text });

/** 保留最近 N 行，避免长时间运行撑爆内存 */
export const pushLines = <T extends LogLine>(prev: T[], ...next: T[]): T[] => [...prev, ...next].slice(-500);

export const LEVEL_CLASS: Record<LogLevel, string> = {
  log: 'text-[#c9d4df]',
  result: 'text-[#7ee787] font-medium',
  warn: 'text-[#e3b341]',
  error: 'text-[#ff7b72]',
  sys: 'text-[#7d8899]',
};
