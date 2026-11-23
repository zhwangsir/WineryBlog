// md 零外跳清洗（共享模块）：收录内容的统一转换规则
export function sanitize(md) {
  return md
    // 剥离 front-matter
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    // mermaid 块（渲染不了）删除
    .replace(/```mermaid[\s\S]*?```/g, '')
    // HTML 注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 嵌入式标签（iframe/embed/video/object/script）整块删除——外链大户
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(iframe|embed|video|object|script|link|meta)[^>]*>/gi, '')
    // 图片（md 形式）→ 删除，保留图示提示
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt) => alt ? `\n> [图示：${alt}]\n` : '')
    // HTML img 标签 → 删除
    .replace(/<img[^>]*>/gi, '')
    // md 转义符还原（\_ → _，避免 URL 断裂）
    .replace(/\\_/g, '_')
    // md 链接 → 纯文本（外链与内部导航链接一律降级）
    .replace(/\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\((?!https?:)[^)]*\)/g, '$1')
    // 自动链接 <https://…> → 反引号（verify-no-outbound 对反引号内豁免）
    .replace(/<(https?:\/\/[^>]+)>/g, '`$1`')
    // 引用式链接定义行删除
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, '')
    // 裸 URL → 反引号（前缀含中英冒号/逗号/引块符，收口全部书写形态）
    .replace(/(^|[\s(（【：:，,。；；>])((?:https?:\/\/)[^\s)）\]<>"`]{8,})/g, '$1`$2`')
    // 常见 HTML 块标签行删除
    .replace(/^\s*<\/?(div|span|p|table|thead|tbody|tr|td|th|ul|ol|li|details|summary|blockquote|a|br|center|font|sup|sub)[^>]*>.*$/gim, '')
    // 提示标签（Tip/Note 前端组件语法）清理
    .replace(/:::\s*\w+[^\n]*\n([\s\S]*?)\n:::/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
