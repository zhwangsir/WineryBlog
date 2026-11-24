import React, { useCallback, useEffect, useRef, useState } from 'react';
import ConsoleView from '../ConsoleView';
import { mkLine, pushLines, type LogLine, type RunnerProps } from '../types';

const TIMEOUT_MS = 20000;

type Status = 'loading' | 'ready' | 'fatal';

/** Python 环境：Pyodide（浏览器里的 CPython）在后台线程里真实执行，见 public/lab/py-runner.js */
const PythonRunner: React.FC<RunnerProps> = ({ files, runId, onOutput }) => {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAt = useRef(0);
  // 打开实验时先跑一次起始代码：引擎就绪后自动执行（引擎被销毁重建后也会再跑一次）
  const pending = useRef(true);
  const statusRef = useRef<Status>('loading');
  const filesRef = useRef(files);
  filesRef.current = files;
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  const setStatusBoth = (s: Status) => { statusRef.current = s; setStatus(s); };

  const finish = useCallback((note?: string) => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setRunning(false);
    if (note) setLines((prev) => prev.filter((l) => l.level !== 'sys').concat(mkLine('sys', note)).slice(-500));
  }, []);

  const execute = useCallback((code: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    startedAt.current = performance.now();
    setLines([]);
    setRunning(true);
    worker.postMessage({ type: 'run', code, id: String(Date.now()) });
    // 解释器在后台线程里，没法打断一段死循环：超时后整个线程销毁重建
    timerRef.current = window.setTimeout(() => {
      worker.terminate();
      workerRef.current = null;
      setStatusBoth('loading');
      finish('已强制终止：运行超过 20 秒仍未结束（多半是死循环），Python 引擎正在重新启动');
      setLines((prev) => pushLines(prev, mkLine('error', '等引擎就绪后可以重新运行；或者点「重置」回到起始代码')));
      pending.current = false;     // 引擎重启后不要把那段死循环代码再自动跑一遍
      boot();
    }, TIMEOUT_MS);
  }, [finish]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** 启动（或重启）Python 引擎；引擎就绪后如果有排队中的运行就执行它 */
  const boot = useCallback(() => {
    const worker = new Worker('/lab/py-runner.js');
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      const { type, text } = e.data || {};
      if (type === 'ready') {
        setStatusBoth('ready');
        setLines((prev) => prev.filter((l) => l.level !== 'sys').concat(mkLine('sys', 'Python 引擎已就绪（CPython · Pyodide）')).slice(-500));
        if (pending.current) { pending.current = false; execute(filesRef.current['main.py'] ?? Object.values(filesRef.current)[0] ?? ''); }
      } else if (type === 'loading') {
        setStatusBoth('loading');
      } else if (type === 'fatal') {
        setStatusBoth('fatal');
        worker.terminate();
        workerRef.current = null;
        setLines([mkLine('error', text)]);
        finish();
      } else if (type === 'done') {
        finish(`运行结束 · 用时 ${Math.round(performance.now() - startedAt.current)} ms`);
      } else if (type === 'error' || type === 'log') {
        setLines((prev) => pushLines(prev, mkLine(type, text)));
      }
    };
    worker.onerror = () => {
      setStatusBoth('fatal');
      setLines((prev) => pushLines(prev, mkLine('error', 'Python 运行器加载失败，请刷新页面重试')));
      finish();
    };
    worker.postMessage({ type: 'status' });
  }, [execute, finish]);

  useEffect(() => {
    boot();
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, [boot]);

  const codeNow = () => filesRef.current['main.py'] ?? Object.values(filesRef.current)[0] ?? '';

  useEffect(() => {
    if (runId === 0) return;
    if (statusRef.current === 'ready') execute(codeNow());
    else if (statusRef.current === 'loading') { pending.current = true; setLines([mkLine('sys', 'Python 引擎还在启动，就绪后会自动运行…')]); }
  }, [runId]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onOutputRef.current(lines.map((l) => l.text).join('\n'));
  }, [lines]);

  const waiting = status === 'loading';
  return (
    <ConsoleView
      lines={waiting && !lines.length ? [mkLine('sys', '正在启动 Python 引擎（首次约 10–20 秒）…')] : lines}
      title="输出"
      running={running || waiting}
      onClear={() => setLines([])}
      empty="点「运行」执行代码；print 输出和最后一个表达式的值会显示在这里"
      className="h-full"
    />
  );
};

export default PythonRunner;
