import React, { useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
// 语言组件按依赖顺序引入（后引入的会扩展前面定义的语法）
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-batch';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-json5';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-properties';
import 'prismjs/components/prism-makefile';
import 'prismjs/components/prism-cmake';
import 'prismjs/components/prism-git';
import 'prismjs/components/prism-diff';

/** 代码围栏语言标注 → Prism 语法 id（空串 = 不高亮） */
const LANGS: Record<string, string> = {
  javascript: 'javascript', js: 'javascript', node: 'javascript',
  typescript: 'typescript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
  java: 'java', scala: 'scala', kotlin: 'kotlin', kt: 'kotlin',
  csharp: 'csharp', cs: 'csharp', 'c#': 'csharp', dotnet: 'csharp',
  dart: 'dart', swift: 'swift',
  c: 'c', h: 'c', cpp: 'cpp', 'c++': 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  python: 'python', py: 'python', python3: 'python',
  go: 'go', golang: 'go', rust: 'rust', rs: 'rust',
  php: 'php', ruby: 'ruby', rb: 'ruby', lua: 'lua', haskell: 'haskell', hs: 'haskell',
  bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', terminal: 'bash', unix: 'bash',
  powershell: 'powershell', ps: 'powershell', ps1: 'powershell', pwsh: 'powershell',
  batch: 'batch', bat: 'batch', cmd: 'batch', dos: 'batch',
  sql: 'sql', mysql: 'sql', postgresql: 'sql', plsql: 'sql', sqlite: 'sql', hive: 'sql', sparksql: 'sql',
  json: 'json', json5: 'json5', jsonc: 'json', yaml: 'yaml', yml: 'yaml',
  markup: 'markup', html: 'markup', xml: 'markup', svg: 'markup', vue: 'markup', 'vue-html': 'markup', xhtml: 'markup', sgl: 'markup',
  css: 'css', scss: 'scss', less: 'scss',
  markdown: 'markdown', md: 'markdown',
  docker: 'docker', dockerfile: 'docker',
  nginx: 'nginx', http: 'http', ini: 'ini', toml: 'toml', properties: 'properties', cfg: 'ini', conf: 'ini',
  makefile: 'makefile', mf: 'makefile', cmake: 'cmake', git: 'git', gitignore: 'git', diff: 'diff', patch: 'diff',
};

/** 语言栏展示名 */
const LABELS: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX', java: 'Java', kotlin: 'Kotlin',
  csharp: 'C#', dart: 'Dart', swift: 'Swift', c: 'C', cpp: 'C++', python: 'Python', go: 'Go', rust: 'Rust',
  php: 'PHP', ruby: 'Ruby', lua: 'Lua', haskell: 'Haskell', bash: 'Shell', powershell: 'PowerShell', batch: 'Batch',
  sql: 'SQL', json: 'JSON', json5: 'JSON5', yaml: 'YAML', markup: 'HTML', css: 'CSS', scss: 'SCSS',
  markdown: 'Markdown', docker: 'Dockerfile', nginx: 'Nginx', http: 'HTTP', ini: 'INI', toml: 'TOML',
  properties: 'Properties', makefile: 'Makefile', cmake: 'CMake', git: 'Git', diff: 'Diff', scala: 'Scala',
};

export const resolveLang = (raw: string): string => LANGS[raw.trim().toLowerCase()] || '';
export const langLabel = (lang: string): string => LABELS[lang] || lang;

interface CodeBlockProps {
  code: string;
  /** 已归一化的 Prism 语法 id */
  lang: string;
}

/**
 * 代码块：Prism 语法高亮 + 语言栏 + 一键复制。
 * 配色走 CSS 变量（--code-bg / --tok-*），明暗主题各一套，见 index.css。
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ code, lang }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    const grammar = lang && (Prism.languages as Record<string, unknown>)[lang];
    if (!grammar || !code) return '';
    try {
      return Prism.highlight(code, grammar as any, lang);
    } catch {
      return '';
    }
  }, [code, lang]);

  const copy = async () => {
    const text = preRef.current?.textContent ?? code;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    try {
      // 非安全上下文（http 局域网访问）下没有 Clipboard API，回落 execCommand
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      done();
    } catch { /* 复制失败不打断阅读 */ }
  };

  return (
    <div className="code-block group/code not-prose relative my-5 overflow-hidden rounded-xl border border-border/60 bg-[var(--code-bg)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] py-1 pr-1.5 pl-4 dark:border-white/[0.06]">
        <span className="font-mono text-[11px] tracking-wider text-[var(--tok-comment)] uppercase">{langLabel(lang) || '代码'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="复制代码"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--tok-comment)] transition-colors hover:bg-white/10 hover:text-[var(--code-text)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover/code:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre ref={preRef} className="custom-scrollbar overflow-x-auto p-4 font-mono text-[13px] leading-[1.75] text-[var(--code-text)] [font-variant-ligatures:none]">
        {html ? (
          <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
};
