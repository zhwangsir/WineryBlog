/**
 * rehype 插件：把规范化后的容器语法与 GitHub 警示块编译成带 data-callout 的元素，
 * 并按文档顺序给标题分配锚点 id（目录与标题锚点共用同一套 id）。
 */
import type { Root, RootContent, Element, ElementContent, Nodes, Text } from 'hast';
import { calloutKind, createSlugger, type CalloutKind, type TocItem } from './markdown';

// ::: / ::: tip 标题 / ::: details 标题 / ::: details-success 标题
const MARKER = /^(:{3,})[ \t]*(?:(details)(?:-([a-z]+))?|([a-z]+))?(?:[ \t]+([^]*?))?[ \t]*$/i;
const GH_ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*/i;
const GH_KIND: Record<string, CalloutKind> = {
  NOTE: 'note', TIP: 'tip', IMPORTANT: 'important', WARNING: 'warning', CAUTION: 'danger',
};
const HEADING = /^h([1-6])$/;

export const textOf = (node: Nodes): string =>
  node.type === 'text' ? node.value : 'children' in node ? (node.children as Nodes[]).map(textOf).join('') : '';

interface Marker { len: number; open: boolean; kind: CalloutKind; title: string; collapsible: boolean }

function parseMarker(text: string): Marker | null {
  const m = MARKER.exec(text);
  if (!m) return null;
  if (!m[2] && !m[4]) return { len: m[1].length, open: false, kind: 'info', title: '', collapsible: false };
  const collapsible = !!m[2];
  const kind = calloutKind(collapsible ? m[3] || 'info' : m[4]);
  return { len: m[1].length, open: true, kind, collapsible, title: (m[5] || '').replace(/[*`]/g, '').trim() };
}

const calloutProps = (mk: Pick<Marker, 'kind' | 'title'>) => ({
  dataCallout: mk.kind,
  dataCalloutTitle: mk.title,
});

function makeContainer(mk: Marker): Element {
  return {
    type: 'element',
    tagName: mk.collapsible ? 'details' : 'div',
    properties: calloutProps(mk),
    children: [],
  };
}

/** 从段落开头的文本节点里删掉前 n 个字符（去掉 [!NOTE] 这类前缀） */
function stripPrefix(el: Element, n: number) {
  let rest = n;
  while (rest > 0 && el.children.length && el.children[0].type === 'text') {
    const t = el.children[0] as Text;
    const cut = Math.min(rest, t.value.length);
    t.value = t.value.slice(cut);
    rest -= cut;
    if (t.value === '') el.children.shift();
  }
}

/** > [!NOTE] 警示块 → 提示卡 */
function githubAlert(bq: Element) {
  // remark-rehype 会在块元素之间插入换行文本节点，取第一个真正的元素
  const first = bq.children.find((c): c is Element => c.type === 'element');
  if (!first || first.tagName !== 'p') return;
  const m = GH_ALERT.exec(textOf(first));
  if (!m) return;
  stripPrefix(first, m[0].length);
  if (!textOf(first).trim()) bq.children.shift();
  bq.tagName = 'div';
  bq.properties = { ...bq.properties, dataCallout: GH_KIND[m[1].toUpperCase()], dataCalloutTitle: '' };
}

function transform(parent: Root | Element) {
  if (!parent.children) return;
  const next: RootContent[] = [];
  let open: { len: number; node: Element } | null = null;
  const close = () => {
    if (open) {
      next.push(open.node);
      open = null;
    }
  };

  for (const node of parent.children) {
    const marker = node.type === 'element' && node.tagName === 'p' ? parseMarker(textOf(node)) : null;
    if (marker) {
      if (open) {
        // 更短的标记属于嵌套的内层容器，留给递归处理
        if (marker.len < open.len) {
          open.node.children.push(node as ElementContent);
          continue;
        }
        close();
        if (!marker.open) continue;
      } else if (!marker.open) {
        continue; // 孤立的闭合标记：丢弃
      }
      open = { len: marker.len, node: makeContainer(marker) };
      continue;
    }
    if (open) open.node.children.push(node as ElementContent);
    else next.push(node);
  }
  close();
  parent.children = next as ElementContent[];

  for (const node of parent.children) {
    if (node.type === 'element' && node.tagName === 'blockquote') githubAlert(node);
  }
  for (const node of parent.children) {
    if (node.type === 'element') transform(node);
  }
}

function assignHeadingIds(parent: Root | Element, slug: (t: string) => string, list: TocItem[]) {
  for (const node of parent.children) {
    if (node.type !== 'element') continue;
    const h = HEADING.exec(node.tagName);
    if (h) {
      const text = textOf(node).replace(/\s+/g, ' ').trim();
      const id = slug(text);
      node.properties = { ...node.properties, id };
      const depth = Number(h[1]);
      if (depth >= 2 && depth <= 4) list.push({ id, text, depth });
    }
    assignHeadingIds(node, slug, list);
  }
}

export interface DocOptions {
  /** 解析完成后回填标题列表（供目录使用） */
  headings?: TocItem[];
}

export function rehypeDoc(options: DocOptions = {}) {
  return (tree: Root) => {
    transform(tree);
    const list: TocItem[] = [];
    assignHeadingIds(tree, createSlugger(), list);
    if (options.headings) {
      options.headings.length = 0;
      options.headings.push(...list);
    }
  };
}
