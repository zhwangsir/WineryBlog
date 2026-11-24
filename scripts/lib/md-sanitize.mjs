// md 零外跳清洗（共享模块）：收录内容的统一转换规则
// 逐行状态机：``` 围栏内的代码示例原样保留（verify-no-outbound 同样豁免围栏），
// 全部清洗规则只作用于围栏外的正文文本。
export function sanitize(md) {
  // —— 整体预处理（块级，与围栏状态无关） ——
  md = md
    .replace(/^---\n[\s\S]*?\n---\n/, '')                    // front-matter
    .replace(/<!--[\s\S]*?-->/g, '')                          // HTML 注释
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')               // iframe 整块（外链大户）
    .replace(/<(iframe|embed|video|object|script|link|meta)[^>]*>/gi, '')
    .replace(/```mermaid[\s\S]*?```/g, '')                    // mermaid（渲染不了）
    // 提示容器（::: tip）保留原样交给前台渲染成提示卡，这里不再剥掉类型与标题
    .replace(/\\_/g, '_')                                     // md 转义还原
    // 链接降级为纯文本；(?<!!) 排除图片语法——旧规则会把 ![说明](图.png) 截成「!说明」
    .replace(/(?<!!)\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, '$1')  // md 外链 → 纯文本
    .replace(/(?<!!)\[([^\]]*)\]\((?!https?:)[^)]*\)/g, '$1');      // md 内链 → 纯文本

  const lines = md.split('\n');
  const outLines = [];
  let inFence = false;
  let fenceLang = '';

  for (const line of lines) {
    const fence = line.match(/^\s*(```+)\s*(\S*)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceLang = fence[2].toLowerCase();
        if (fenceLang !== 'mermaid') outLines.push(line);  // mermaid 整块跳过
        continue;
      }
      inFence = false;
      if (fenceLang !== 'mermaid') outLines.push(line);
      continue;
    }
    if (inFence) {
      if (fenceLang !== 'mermaid') outLines.push(line);
      continue;
    }

    // —— 围栏外正文：行级清洗 ——
    // 4 空格缩进代码块（旧式 md 代码语法）：整行原样保留，还原被历史版本误包的反引号
    if (/^\s{4,}\S/.test(line)) {
      outLines.push(line.replace(/`+(https?:\/\/[^`]+)`+/g, '$1'));
      continue;
    }
    let l = line
      // 图片：已本地化进图床的（/images/figures/…）保留；其余（相对路径没抓到的 / 外站图）转成图示提示
      .replace(/!\[([^\]]*)\]\((?!\/images\/figures\/)[^)]*\)/g, (_m, alt) => alt ? `> [图示：${alt}]` : '')
      .replace(/<img[^>]*>/gi, '')                                                     // img 标签删
      .replace(/``(?!`)/g, '`')                                                        // 双反引号瑕疵压平
      .replace(/(?<!!)\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, '$1')                   // 残余 md 链接 → 文本
      .replace(/(?<!!)\[([^\]]*)\]\((?!https?:)[^)]*\)/g, '$1')
      .replace(/<(https?:\/\/[^>]+)>/g, '`$1`')                                        // 自动链接
      .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/, '')                                         // 引用式链接定义行
      .replace(/(^|[\s(（【：:，,。；；>、「*])((?:https?:\/\/)[^\s)）\]<>"`*]{6,})/g, '$1`$2`')  // 裸 URL → 反引号
      // 块级 HTML 容器标签：只去标签、保留文字。旧规则是「行首即块标签则整行删除」，
      // 会把 <p>正文</p> 这类行里的内容一起删掉。<details>/<br>/<sup> 等留给前台转成等价写法
      .replace(/<\/?(div|span|p|table|thead|tbody|tr|td|th|ul|ol|li|blockquote|center|font)\b[^>]*>/gi, ' ');
    outLines.push(l);
  }

  return outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** 摘要：正文开头的纯文本。先整体去掉 HTML 标签再清 Markdown 符号——
 *  直接删 > 字符会把 <u>…</u> 截成「<u回溯…</u是一种」这种半个标签 */
export function excerptFrom(clean) {
  return clean
    .replace(/```[a-z0-9]*\n[\s\S]*?```/g, ' ')          // 代码块不进摘要
    .replace(/^#+\s+.*$/gm, '')
    .replace(/^> ?\[图示：[^\]]*\]\s*$/gm, ' ')            // 图示提示不进摘要
    .replace(/^:::.*$/gm, ' ')                             // 提示卡标记不进摘要
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')                 // 图片不进摘要
    .replace(/<[^<>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`>#*_\-\[\]{}|~]/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}
