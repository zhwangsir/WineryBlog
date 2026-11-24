import React, { useCallback, useEffect, useRef, useState } from 'react';
import ConsoleView from '../ConsoleView';
import { mkLine, pushLines, type LogLine, type RunnerProps } from '../types';

const TIMEOUT_MS = 8000;

/** JavaScript 环境：代码在后台线程里真实执行（见 public/lab/js-runner.js） */
const JsRunner: React.FC<RunnerProps> = ({ files, runId, onOutput }) => {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAt = useRef(0);
  const filesRef = useRef(files);
  filesRef.current = files;
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  const finish = useCallback((note?: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setRunning(false);
    if (note) setLines((prev) => prev.filter((l) => l.level !== 'sys').concat(mkLine('sys', note)).slice(-500));
  }, []);

  const run = useCallback((code: string) => {
    finish();
    startedAt.current = performance.now();
    setLines([]);
    setRunning(true);
    const worker = new Worker('/lab/js-runner.js');
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      const { type, text } = e.data || {};
      if (type === 'done') { finish(`运行结束 · 用时 ${Math.round(performance.now() - startedAt.current)} ms`); return; }
      if (type === 'error' || type === 'warn' || type === 'result' || type === 'log') {
        setLines((prev) => pushLines(prev, mkLine(type, text)));
      }
    };
    worker.onerror = (e) => {
      setLines((prev) => pushLines(prev, mkLine('error', e.message || '运行器出错')));
      finish('运行中断');
    };
    timerRef.current = window.setTimeout(() => {
      finish(`已强制终止：运行超过 ${TIMEOUT_MS / 1000} 秒仍未结束（多半是死循环）`);
      setLines((prev) => pushLines(prev, mkLine('error', '可以点「重置」回到起始代码，或检查循环的结束条件')));
    }, TIMEOUT_MS);
    worker.postMessage({ type: 'run', code });
  }, [finish]);

  const codeNow = () => filesRef.current['main.js'] ?? Object.values(filesRef.current)[0] ?? '';

  // 打开实验时先跑一次起始代码，让读者立刻看到「现在是什么样」。
  // 不用「只跑一次」的标记：严格模式下副作用会执行两遍，靠清理函数终止多余的那一次
  useEffect(() => {
    run(codeNow());
    return () => finish();
  }, [run]);

  useEffect(() => {
    if (runId > 0) run(codeNow());
  }, [runId]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onOutputRef.current(lines.map((l) => l.text).join('\n'));
  }, [lines]);

  useEffect(() => () => finish(), [finish]);

  return (
    <ConsoleView
      lines={lines}
      title="输出"
      running={running}
      onClear={() => setLines([])}
      empty="点「运行」执行代码；console 输出和最后一个表达式的值会显示在这里"
      className="h-full"
    />
  );
};

export default JsRunner;
