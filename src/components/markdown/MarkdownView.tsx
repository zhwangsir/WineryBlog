import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { dominantLanguage, hasMath, normalizeMarkdown, type CalloutKind, type TocItem } from '../../lib/markdown';
import { rehypeDoc } from '../../lib/rehypeDoc';
import { Callout } from './Callout';
import { CodeBlock, resolveLang } from './CodeBlock';

interface MathPlugins { remark: PluggableList; rehype: PluggableList }
const NO_MATH: MathPlugins = { remark: [], rehype: [] };

/** 无语言标注的代码块用该篇的主语言高亮（如题解类文章通篇 Java） */
const DefaultLangContext = createContext('');

type ExtraProps = Record<string, unknown> & { node?: unknown; children?: React.ReactNode };
const calloutOf = (props: ExtraProps) => {
  const kind = (props['data-callout'] ?? props.dataCallout) as CalloutKind | undefined;
  if (!kind) return null;
  return { kind, title: String(props['data-callout-title'] ?? props.dataCalloutTitle ?? '') };
};
const withoutNode = ({ node: _node, ...rest }: ExtraProps) => rest;

const scrollToHash = (hash: string) => {
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', hash);
  return true;
};

/** 标题：悬停显示锚点，id 由 rehypeDoc 按文档顺序分配 */
const Heading: React.FC<{ level: number; id?: string; children?: React.ReactNode }> = ({ level, id, children }) => {
  const El = `h${level}` as 'h2';
  return (
    <El id={id} className="group/heading relative scroll-mt-24">
      {children}
      {id && (
        <a
          href={`#${id}`}
          aria-label="本节锚点"
          onClick={(e) => {
            if (scrollToHash(`#${id}`)) e.preventDefault();
          }}
          className="heading-anchor ml-1 text-accent no-underline opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100"
        >
          #
        </a>
      )}
    </El>
  );
};

const components: Components = {
  pre: ({ children }) => {
    // react-markdown 把 <pre> 的唯一子元素 <code> 的类名与文本放在这里
    const only = React.Children.toArray(children)[0];
    if (!React.isValidElement(only)) return <pre>{children}</pre>;
    const { className, children: text } = only.props as { className?: string; children?: React.ReactNode };
    const raw = (className || '').match(/language-([\w+#.-]+)/)?.[1] || '';
    const code = React.Children.toArray(text).join('').replace(/\n$/, '');
    const fallback = useContext(DefaultLangContext);
    return <CodeBlock code={code} lang={resolveLang(raw) || resolveLang(fallback)} />;
  },

  a: ({ href, children }) => {
    const to = String(href || '');
    if (to.startsWith('/')) return <Link to={to}>{children}</Link>;
    if (to.startsWith('#')) {
      return (
        <a
          href={to}
          onClick={(e) => {
            if (scrollToHash(to)) e.preventDefault();
          }}
        >
          {children}
        </a>
      );
    }
    if (/^(mailto:|tel:)/i.test(to)) return <a href={to}>{children}</a>;
    // 站外链接：按「读者点击不出站」的铁律降级为纯文本
    return <span>{children}</span>;
  },

  table: ({ children }) => (
    <div className="custom-scrollbar my-6 overflow-x-auto rounded-xl border border-border/60">
      <table>{children}</table>
    </div>
  ),

  input: ({ checked }) => (
    <input type="checkbox" checked={!!checked} readOnly disabled className="mt-1 align-middle accent-[var(--accent)]" />
  ),

  div: (props) => {
    const rest = withoutNode(props as ExtraProps);
    const callout = calloutOf(rest);
    if (callout) return <Callout kind={callout.kind} title={callout.title}>{rest.children}</Callout>;
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} />;
  },
  details: (props) => {
    const rest = withoutNode(props as ExtraProps);
    const callout = calloutOf(rest);
    if (callout) return <Callout kind={callout.kind} title={callout.title} collapsible>{rest.children}</Callout>;
    return <details {...(rest as React.HTMLAttributes<HTMLDetailsElement>)} />;
  },

  h1: ({ node: _node, id, children }) => <Heading level={1} id={id}>{children}</Heading>,
  h2: ({ node: _node, id, children }) => <Heading level={2} id={id}>{children}</Heading>,
  h3: ({ node: _node, id, children }) => <Heading level={3} id={id}>{children}</Heading>,
  h4: ({ node: _node, id, children }) => <Heading level={4} id={id}>{children}</Heading>,
  h5: ({ node: _node, id, children }) => <Heading level={5} id={id}>{children}</Heading>,
  h6: ({ node: _node, id, children }) => <Heading level={6} id={id}>{children}</Heading>,
};

interface MarkdownViewProps {
  content: string;
  /** 外层容器类名 */
  className?: string;
  /** 每次解析完成后回传标题列表（目录用）。在自己的 effect 里回调：
   *  子组件的 effect 先于父组件执行，父组件当次提交就能拿到结果 */
  onHeadings?: (items: TocItem[]) => void;
}

/**
 * 站内统一的 Markdown 渲染：先规范化（提示块 / 行内 HTML / 属性列表），
 * 再由 rehypeDoc 把容器编译成提示卡并分配标题锚点；含 LaTeX 的文章按需加载 KaTeX。
 * 用 memo 包住：父组件因滚动高亮、已学标记等状态重渲染时，不重新解析全文。
 */
export const MarkdownView = React.memo(function MarkdownView({ content, className, onHeadings }: MarkdownViewProps) {
  const parsed = useRef<TocItem[]>([]);
  const [math, setMath] = useState<MathPlugins | null>(null);

  const needMath = useMemo(() => hasMath(content), [content]);
  const normalized = useMemo(() => normalizeMarkdown(content), [content]);
  const defaultLang = useMemo(() => resolveLang(dominantLanguage(content)), [content]);

  // 插件实例必须稳定，否则每次渲染都会重新解析全文。
  // unified 需要的是 attacher（返回 transformer 的函数），不是 transformer 本身
  const plugin = useMemo(() => () => rehypeDoc({ headings: parsed.current }), []);

  useEffect(() => {
    onHeadings?.(parsed.current);
  });

  useEffect(() => {
    let dead = false;
    if (needMath && !math) {
      import('./math')
        .then((m) => { if (!dead) setMath(m.default); })
        .catch(() => { if (!dead) setMath(NO_MATH); });
    }
    return () => { dead = true; };
  }, [needMath, math]);

  if (needMath && !math) {
    return <div className={className}><p className="py-10 text-center text-sm text-text-muted">公式模块加载中…</p></div>;
  }

  const remarkPlugins: PluggableList = math ? [remarkGfm, ...math.remark] : [remarkGfm];
  const rehypePlugins: PluggableList = math ? [plugin, ...math.rehype] : [plugin];

  return (
    <DefaultLangContext.Provider value={defaultLang}>
      <div className={className}>
        <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
          {normalized}
        </Markdown>
      </div>
    </DefaultLangContext.Provider>
  );
});
