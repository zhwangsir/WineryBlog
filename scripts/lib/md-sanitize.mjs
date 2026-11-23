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
    .replace(/:::\s*\w+[^\n]*\n([\s\S]*?)\n:::/g, '$1')       // 提示组件语法
    .replace(/\\_/g, '_')                                     // md 转义还原
    .replace(/\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, '$1')  // md 外链 → 纯文本
    .replace(/\[([^\]]*)\]\((?!https?:)[^)]*\)/g, '$1');      // md 内链 → 纯文本

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
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt) => alt ? `> [图示：${alt}]` : '')  // 图片 → 图示提示
      .replace(/<img[^>]*>/gi, '')                                                     // img 标签删
      .replace(/``(?!`)/g, '`')                                                        // 双反引号瑕疵压平
      .replace(/\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, '$1')                         // 残余 md 链接 → 文本
      .replace(/\[([^\]]*)\]\((?!https?:)[^)]*\)/g, '$1')
      .replace(/<(https?:\/\/[^>]+)>/g, '`$1`')                                        // 自动链接
      .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/, '')                                         // 引用式链接定义行
      .replace(/(^|[\s(（【：:，,。；；>、「*])((?:https?:\/\/)[^\s)）\]<>"`*]{6,})/g, '$1`$2`')  // 裸 URL → 反引号
      .replace(/^\s*<\/?(div|span|p|table|thead|tbody|tr|td|th|ul|ol|li|details|summary|blockquote|a|br|center|font|sup|sub)[^>]*>.*$/i, '');
    outLines.push(l);
  }

  return outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
