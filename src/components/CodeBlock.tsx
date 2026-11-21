import React, { useState, useRef, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * 代码块渲染组件：为 <pre> 加语言标签与一键复制。
 * react-markdown 的 components.pre 拦截，children[0] 是 <code> 元素。
 */
export const CodeBlock: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLPreElement>(null);

  // 从 <code className="language-xxx"> 提取语言
  const codeEl = React.isValidElement(children) ? (children.props as any) : null;
  const lang = (codeEl?.className || '').replace('language-', '') || '';
  const text = (codeEl?.children as string) || '';

  const copy = useCallback(() => {
    if (!text) return;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    // 优先 Clipboard API，降级 execCommand（http 环境兼容）
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        fallbackCopy(text); done();
      });
    } else {
      fallbackCopy(text); done();
    }
  }, [text]);

  return (
    <div className="group relative">
      <pre
        ref={ref}
        className="overflow-x-auto rounded-xl bg-black/40 border border-border/50 p-4 text-sm leading-relaxed"
      >
        {children}
      </pre>
      {/* 语言标签 */}
      {lang && (
        <span className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-text-muted select-none">
          {lang}
        </span>
      )}
      {/* 复制按钮：hover 显示，移动端常显 */}
      <button
        type="button"
        onClick={copy}
        aria-label="复制代码"
        className="absolute top-1.5 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs
                   bg-bg-card/90 border border-border text-text-secondary
                   opacity-0 group-hover:opacity-100 focus:opacity-100
                   hover:text-accent hover:border-accent transition-all sm:opacity-0"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
};

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
}
