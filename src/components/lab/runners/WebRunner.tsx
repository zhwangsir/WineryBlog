import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, RefreshCw, Smartphone, Tablet, Terminal } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ConsoleView from '../ConsoleView';
import { mkLine, pushLines, type LogLine, type RunnerProps } from '../types';

type Level = 'log' | 'warn' | 'error';

/** 沙箱页头：禁掉一切网络请求（CSP），把控制台回传给父页面，并拦截链接跳转与表单提交 */
const BRIDGE = `(function () {
  var send = function (level, text) {
    try { parent.postMessage({ source: 'winery-lab', type: 'console', level: level, text: String(text) }, '*'); } catch (e) {}
  };
  var fmt = function (v, d) {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
    if (typeof v === 'function') return '[Function' + (v.name ? ': ' + v.name : '') + ']';
    if (typeof v === 'string') return d ? JSON.stringify(v) : v;
    if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
    if (typeof v === 'object' && Array.isArray(v)) return '[ ' + v.slice(0, 100).map(function (x) { return fmt(x, 1); }).join(', ') + (v.length > 100 ? ', …' : '') + ' ]';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, function (k, val) { return typeof val === 'object' && val !== null && this && this[k] === v ? '[Circular]' : val; }, d ? 0 : 1) || String(v); }
      catch (e) { return String(v); }
    }
    return String(v);
  };
  var emit = function (level) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      send(level, args.map(function (a) { return fmt(a, 0); }).join(' '));
    };
  };
  console.log = emit('log'); console.info = emit('log'); console.debug = emit('log');
  console.warn = emit('warn'); console.error = emit('error');
  window.addEventListener('error', function (e) {
    send('error', (e.message || '脚本出错') + (e.lineno ? '（第 ' + e.lineno + ' 行）' : ''));
  });
  window.addEventListener('unhandledrejection', function (e) { send('error', '未捕获的 Promise 拒绝：' + fmt(e.reason, 0)); });
  document.addEventListener('click', function (e) {
    var el = e.target;
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' || /^javascript:/i.test(href)) return;
    e.preventDefault();
    send('warn', '实验沙箱不会跳转到其它页面（被拦下的链接：' + href + '）');
  }, true);
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    send('log', '表单已提交（实验沙箱里不会真的发送请求）');
  }, true);
})();`;

// default-src 'none'：不加载任何外部脚本、样式、图片、字体；connect-src 'none'：fetch / XHR / WebSocket 一律不通
const CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; connect-src 'none'; worker-src blob:; frame-src 'none'; form-action 'none'; base-uri 'none'";

const escapeClose = (code: string) => code.replace(/<\/script/gi, '<\\/script');

/** index.html 既可以是一段 body 片段，也可以是完整文档（带 doctype / html / head） */
export const buildWebDoc = (files: Record<string, string>) => {
  const html = files['index.html'] ?? '';
  const css = Object.entries(files).filter(([n]) => n.endsWith('.css')).map(([, c]) => c).join('\n');
  const js = Object.entries(files).filter(([n]) => n.endsWith('.js') && n !== 'index.html').map(([, c]) => c).join('\n;\n');
  let head = '';
  let body = html;
  if (/<html[\s>]/i.test(html)) {
    const h = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const b = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    head = h ? h[1] : '';
    body = b ? b[1] : '';
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${CSP}"><script>${BRIDGE}<\/script>${head}<style>${css}</style></head><body>${body}<script>${escapeClose(js)}<\/script></body></html>`;
};

const DEVICES = [
  { id: 'full', icon: Monitor, label: '自适应', width: '100%' },
  { id: 'tablet', icon: Tablet, label: '平板 · 768px', width: '768px' },
  { id: 'phone', icon: Smartphone, label: '手机 · 390px', width: '390px' },
] as const;

/** 前端环境：HTML / CSS / JS 实时渲染到隔离的沙箱 iframe */
export const WebRunner: React.FC<RunnerProps> = ({ files, runId, onOutput }) => {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [doc, setDoc] = useState(() => buildWebDoc(files));
  const [lines, setLines] = useState<LogLine[]>([]);
  const [auto, setAuto] = useState(true);
  const [device, setDevice] = useState<(typeof DEVICES)[number]['id']>('full');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  // 改代码后自动刷新（防抖）；手动点「运行」立即刷新
  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => setDoc(buildWebDoc(files)), 350);
    return () => window.clearTimeout(t);
  }, [files, auto]);
  useEffect(() => {
    if (runId > 0) setDoc(buildWebDoc(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // 只接收自己这个 iframe 发来的消息
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const d = e.data;
      if (d?.source !== 'winery-lab' || d.type !== 'console') return;
      setLines((prev) => pushLines(prev, mkLine(['log', 'warn', 'error'].includes(d.level) ? d.level : 'log', d.text)));
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    onOutputRef.current(lines.slice(-40).map((l) => l.text).join('\n'));
  }, [lines]);

  const width = DEVICES.find((d) => d.id === device)!.width;
  const errs = lines.filter((l) => l.level === 'error').length;
  const warns = lines.filter((l) => l.level === 'warn').length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[#1c2430] px-2">
        <span className="mr-1 text-[11px] font-semibold tracking-wide text-[#8b96a6]">预览</span>
        <div className="flex items-center rounded-lg bg-[#12161d] p-0.5" role="group" aria-label="预览宽度">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDevice(d.id)}
              title={d.label}
              aria-label={d.label}
              aria-pressed={device === d.id}
              className={cn('flex h-6 w-7 items-center justify-center rounded-md transition-colors', device === d.id ? 'bg-[#26415f] text-[#d6dee8]' : 'text-[#7d8899] hover:text-[#c9d4df]')}
            >
              <d.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDoc(buildWebDoc(files))}
          title="刷新预览"
          aria-label="刷新预览"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-[#7d8899] transition-colors hover:bg-[#1a212c] hover:text-[#d6dee8]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> 刷新
        </button>
        <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-[#8b96a6] select-none">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[#f27d26]" />
          自动刷新
        </label>
        <button
          type="button"
          onClick={() => setConsoleOpen((o) => !o)}
          aria-pressed={consoleOpen}
          className={cn('ml-auto flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] transition-colors', consoleOpen ? 'bg-[#1a212c] text-[#c9d4df]' : 'text-[#7d8899] hover:text-[#d6dee8]')}
        >
          <Terminal className="h-3.5 w-3.5" /> 控制台
          {errs > 0 && <span className="rounded-full bg-[#ff7b72]/20 px-1.5 text-[10px] font-semibold text-[#ff9b93]">{errs}</span>}
          {errs === 0 && warns > 0 && <span className="rounded-full bg-[#e3b341]/20 px-1.5 text-[10px] font-semibold text-[#e3b341]">{warns}</span>}
        </button>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#070a0e] p-4">
        <iframe
          ref={frameRef}
          title="实验预览"
          sandbox="allow-scripts allow-forms"
          srcDoc={doc}
          style={{ width }}
          className="h-full min-h-[320px] rounded-lg border border-[#1c2430] bg-[#12181f] transition-[width] duration-300"
        />
      </div>

      {consoleOpen && (
        <ConsoleView
          lines={lines}
          running={false}
          onClear={() => setLines([])}
          empty="页面的 console 输出和报错会显示在这里"
          className="h-[34%] min-h-[110px] shrink-0 border-t border-[#1c2430]"
        />
      )}
    </div>
  );
};

export default WebRunner;
