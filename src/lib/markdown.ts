/**
 * 正文渲染前的规范化（纯函数，不改数据文件）：
 * 收录教程来自 mkdocs / VuePress / GitHub / docsify 等不同引擎，提示块、折叠块、行内 HTML
 * 各有各的写法。这里统一转成站内容器语法 `:::类型 标题 … :::`，再由 rehypeContainers
 * 编译成带样式的提示卡；行内 HTML 白名单转成等价的 Markdown / Unicode。
 */

export type CalloutKind =
  | 'note' | 'tip' | 'info' | 'success' | 'warning' | 'danger' | 'question' | 'important';

/** 容器类型别名 → 站内类型 */
const KINDS: Record<string, CalloutKind> = {
  note: 'note', info: 'info', summary: 'note', abstract: 'note', quote: 'note', cite: 'note', example: 'info',
  tip: 'tip', hint: 'tip', help: 'tip', cheatsheet: 'tip', 'python-tutor': 'info', pythontutor: 'info',
  success: 'success', check: 'success', done: 'success', pass: 'success',
  question: 'question', faq: 'question', ask: 'question', helpq: 'question',
  warning: 'warning', caution: 'warning', attention: 'warning', warn: 'warning', bug: 'warning', failure: 'warning',
  danger: 'danger', error: 'danger', fail: 'danger', stop: 'danger',
  important: 'important', primary: 'important',
};

const DEFAULT_TITLES: Record<CalloutKind, string> = {
  note: '笔记',
  tip: '提示',
  info: '说明',
  success: '答案',
  warning: '注意',
  danger: '危险',
  question: '思考',
  important: '重要',
};

const CALLOUT_ICONS: Record<CalloutKind, string> = {
  note: '📝',
  tip: '💡',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '🚫',
  question: '❓',
  important: '❗',
};

export const calloutKind = (raw: string): CalloutKind => KINDS[raw.toLowerCase()] || 'info';
export const calloutTitle = (kind: CalloutKind) => DEFAULT_TITLES[kind];
export const calloutIcon = (kind: CalloutKind) => CALLOUT_ICONS[kind];

// ---------- Unicode 上下标 ----------
const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', ' ': ' ',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
  o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
};
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ',
  l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ', ' ': ' ',
};

const toScript = (text: string, table: Record<string, string>, fallback: (t: string) => string) => {
  const chars = [...text.trim().toLowerCase()];
  return chars.every((ch) => table[ch]) ? chars.map((ch) => table[ch]).join('') : fallback(text.trim());
};
const toSup = (t: string) => toScript(t, SUP, (x) => `^(${x})`);
const toSub = (t: string) => toScript(t, SUB, (x) => `_(${x})`);

// ---------- 行内 HTML（跳过行内代码）----------
const isCodeSpan = (seg: string) => {
  const m = /^(`+)/.exec(seg);
  return !!m && seg.length > m[1].length && seg.endsWith(m[1]);
};
const mapOutsideCode = (line: string, fn: (s: string) => string) =>
  line.replace(/(`+)[^\n]*?\1|[^`]+|`/g, (seg) => (isCodeSpan(seg) ? seg : fn(seg)));

const STRIP_TAGS =
  /<\/?(?:div|p|span|font|center|hr|img|details|summary|b|strong|i|em|u|s|del|strike|code|mark|kbd|sup|sub|a|table|thead|tbody|tr|td|th|ul|ol|li|h[1-6]|small|big|video|audio|iframe|picture|source|section|article|figure|figcaption|blockquote|br)\b[^>]*>/gi;

function fixInlineHtml(seg: string, inTable: boolean): string {
  let s = seg;
  // <br>：表格单元格里放不下换行，用间隔点；行尾的直接去掉；其余转成硬换行
  s = inTable ? s.replace(/<br\s*\/?>/gi, ' · ') : s.replace(/\s*<br\s*\/?>\s*$/i, '').replace(/<br\s*\/?>/gi, '\\\n');
  s = s.replace(/<(sup)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t: string) => toSup(t));
  s = s.replace(/<(sub)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t: string) => toSub(t));
  s = s.replace(/<kbd\b[^>]*>([\s\S]*?)<\/kbd>/gi, (_, t: string) => `\`${t.trim()}\``);
  s = s.replace(/<(?:mark|b|strong)\b[^>]*>([\s\S]*?)<\/(?:mark|b|strong)>/gi, (_, t: string) => `**${t}**`);
  s = s.replace(/<(?:i|em)\b[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, (_, t: string) => `*${t}*`);
  s = s.replace(/<(?:s|del|strike)\b[^>]*>([\s\S]*?)<\/(?:s|del|strike)>/gi, (_, t: string) => `~~${t}~~`);
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, t: string) => `\`${t}\``);
  // 站内链接保留为 Markdown 链接；站外链接按零外跳铁律只留文字
  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, t: string) =>
    /^(\/|#)/.test(href.trim()) ? `[${t.trim()}](${href.trim()})` : t.trim()
  );
  // 其余已知 HTML 标签：去标签留内容
  return s.replace(STRIP_TAGS, '');
}

// ---------- 容器标记 ----------
// mkdocs:  !!! note "标题" / ??? question "标题"（正文缩进 4 格）
// VuePress: ::: tip 标题 … :::
const MKDOCS = /^(\s*)(!!!|\?\?\?)\s+([A-Za-z]+)\s*(?:"([^"]*)"|'([^']*)')?\s*$/;
const VUEPRESS = /^(\s*)(:::+)\s*([A-Za-z]+(?:-[A-Za-z]+)*)?\s*(.*?)\s*$/;

const pushIsolated = (out: string[], line: string) => {
  if (out.length && out[out.length - 1].trim() !== '') out.push('');
  out.push(line);
  out.push('');
};

const FENCE_LINE = /^\s*(`{3,}|~{3,})/;
// 早期清洗把 ```lang 压成了 `lang（约 2400 个代码块）：单独一行的「一个反引号 + 语言名」
const DAMAGED_OPEN = /^(\s*)`([A-Za-z0-9+#._-]*)[ \t]*$/;
const DAMAGED_CLOSE = /^\s*`[ \t]*$/;

/** 把被压坏的围栏（`lang … `）还原成 ```lang … ```；真围栏内的内容原样跳过 */
function repairFences(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const real = FENCE_LINE.exec(line);
    if (real) {
      const marker = real[1];
      out.push(line);
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        out.push(cur);
        i++;
        const c = FENCE_LINE.exec(cur);
        if (c && c[1][0] === marker[0] && c[1].length >= marker.length) break;
      }
      continue;
    }
    const open = DAMAGED_OPEN.exec(line);
    if (open) {
      let j = i + 1;
      while (j < lines.length && !DAMAGED_CLOSE.test(lines[j]) && !FENCE_LINE.test(lines[j])) j++;
      if (j < lines.length && DAMAGED_CLOSE.test(lines[j])) {
        out.push('```' + open[2].toLowerCase());
        for (let k = i + 1; k < j; k++) out.push(lines[k]);
        out.push('```');
        i = j + 1;
        continue;
      }
    }
    out.push(line);
    i++;
  }
  return out;
}

// hello-algo 的源码引用语法：代码在仓库 codes/ 目录里，正文只留引用
const FILE_REF = /\[file\]\{([^}]+)\}(?:-\[class\]\{([^}]*)\})?(?:-\[func\]\{([^}]*)\})?/g;

/** 正文里的提示块/折叠块/行内 HTML → 站内容器语法（嵌套层级越深，冒号越多） */
export function normalizeMarkdown(md: string, depth = 0): string {
  if (!md) return '';
  const mark = ':'.repeat(3 + depth);
  const lines = repairFences(md.split(/\r?\n/));
  const out: string[] = [];
  let fence: string | null = null;

  const flushText = (text: string) => {
    const inTable = /^\s*\|/.test(text);
    out.push(
      mapOutsideCode(text, (seg) => fixInlineHtml(seg, inTable))
        // 属性列表（kramdown/maruku 扩展）：{: .class } / {: width="75%" }
        .replace(/\s*\{\s*:[^}\n]*\}/g, '')
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 代码围栏内原样保留
    const m = /^(\s*)(`{3,}|~{3,})/.exec(line);
    if (fence) {
      out.push(line);
      if (m && m[2][0] === fence[0] && m[2].length >= fence.length) fence = null;
      continue;
    }
    if (m) {
      // 围栏里只有 [file]{…}-[func]{…} 源码引用（代码本体在原仓库）：转成说明卡
      let k = i + 1;
      while (k < lines.length && !FENCE_LINE.test(lines[k])) k++;
      const inner = lines.slice(i + 1, k);
      const onlyRefs = k < lines.length && inner.some((l) => /\[file\]\{/.test(l)) &&
        inner.every((l) => l.trim() === '' || /^\[file\]\{/.test(l.trim()));
      if (onlyRefs) {
        const parts = (inner.join('\n').match(FILE_REF) || []).map((r) => {
          const f = /\[file\]\{([^}]+)\}/.exec(r)![1];
          const cls = /\[class\]\{([^}]*)\}/.exec(r)?.[1];
          const fn = /\[func\]\{([^}]*)\}/.exec(r)?.[1];
          return `${f}${cls ? ` / ${cls}` : ''}${fn ? ` → ${fn}` : ''}`;
        });
        pushIsolated(out, `${mark}info 代码示例`);
        out.push(`本节示例代码来自原书仓库的 codes 目录：\`${parts.join('`、`')}\`。收录时只保留了讲解正文，源码请对照原书。`);
        pushIsolated(out, mark);
        i = k;
        continue;
      }
      fence = m[2];
      out.push(line);
      continue;
    }

    // 4 空格缩进代码块原样保留（前面必须是空行）
    if (/^( {4}|\t)\S/.test(line) && out.length && out[out.length - 1].trim() === '') {
      out.push(line);
      let j = i + 1;
      while (j < lines.length && /^( {4}|\t)/.test(lines[j])) {
        out.push(lines[j]);
        j++;
      }
      i = j - 1;
      continue;
    }

    // <details><summary>标题</summary> … </details>
    if (/<details\b[^>]*>/i.test(line)) {
      const summary = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i.exec(line);
      const title = summary ? summary[1].replace(/<[^>]+>/g, '').trim() : '';
      const rest = line.replace(/<details\b[^>]*>/i, '').replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, '').trim();
      pushIsolated(out, title ? `${mark}details ${title}` : `${mark}details`);
      if (rest) flushText(rest);
      continue;
    }
    if (/<\/details>/i.test(line)) {
      const rest = line.replace(/<\/details>/i, '').trim();
      pushIsolated(out, mark);
      if (rest) flushText(rest);
      continue;
    }
    const onlySummary = /^\s*<summary\b[^>]*>([\s\S]*?)<\/summary>\s*$/i.exec(line);
    if (onlySummary && (out[out.length - 2] || '') === `${mark}details`) {
      out[out.length - 2] = `${mark}details ${onlySummary[1].replace(/<[^>]+>/g, '').trim()}`;
      continue;
    }

    // mkdocs 提示块：!!! note "标题" / ??? question "标题"，正文缩进 4 格
    const mk = MKDOCS.exec(line);
    if (mk) {
      const kind = calloutKind(mk[3]);
      const title = (mk[4] ?? mk[5] ?? '').trim();
      // 可折叠块（???）里的答案类内容默认折叠；题目类保持展开
      const collapsible = mk[2] === '???' && (kind === 'success' || kind === 'tip');
      pushIsolated(out, `${mark}${collapsible ? 'details-' + kind : kind}${title ? ' ' + title : ''}`);
      const base = mk[1].length + 4;
      const body: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        const ind = l.match(/^(\s*)/)![1].length;
        if (l.trim() !== '' && ind < base) break;
        body.push(l.trim() === '' ? '' : l.slice(Math.min(base, ind)));
        j++;
      }
      while (body.length && body[body.length - 1] === '') body.pop();
      // 正文里的子提示块递归处理
      if (body.length) out.push(...normalizeMarkdown(body.join('\n'), depth + 1).split('\n'));
      pushIsolated(out, mark);
      i = j - 1;
      continue;
    }

    // VuePress 容器标记：独立成段，保证被识别为段落
    if (VUEPRESS.test(line)) {
      pushIsolated(out, line.trim());
      continue;
    }

    flushText(line);
  }
  return out.join('\n');
}

/** 是否含真实 LaTeX（\命令 或 上下标花括号）；只有这类文章才加载公式渲染 */
export function hasMath(md: string): boolean {
  return /\$\$?[^$\n]{1,200}?\\[a-zA-Z]{2,}[^$\n]{0,200}?\$\$?/.test(md) || /\$\$[\s\S]{1,400}?\\\(/.test(md);
}

/** 代码块语言分布：给无语言标注的代码块补上该篇的主语言 */
export function dominantLanguage(md: string): string {
  const counts = new Map<string, number>();
  for (const m of md.matchAll(/^[ \t]*(?:`{3,}|~{3,})[ \t]*([A-Za-z0-9_+#.-]+)/gm)) {
    const lang = m[1].toLowerCase();
    if (lang === 'text' || lang === 'plain' || lang === 'txt') continue;
    counts.set(lang, (counts.get(lang) || 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total < 2) return '';
  const [lang, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return n / total >= 0.6 ? lang : '';
}

const slugify = (text: string) => {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/[^\p{Script=Han}\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'h';
};

/** 标题 id 生成器：同一篇内重名标题自动加序号（rehype 插件与目录共用，保证锚点一致） */
export function createSlugger() {
  const used = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}
