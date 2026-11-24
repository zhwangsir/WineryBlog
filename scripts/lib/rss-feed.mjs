// RSS 2.0 输出（共享）：server.ts 的 /rss.xml 与 scripts/test-rss.mjs 用的都是这一份
// XML 1.0 不允许的控制字符（制表 / 换行 / 回车除外）直接丢弃；
// 文本节点和属性值里的 & < > " ' 转成实体；CDATA 正文里不能出现 ]]>，遇到就在这里断开、再开一节
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

/** 文本节点 / 属性值 */
export function xmlText(value) {
  return String(value ?? '')
    .replace(CONTROL, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** <![CDATA[ … ]]> 的正文 */
export function xmlCdata(value) {
  return String(value ?? '').replace(CONTROL, '').replace(/]]>/g, ']]]]><![CDATA[>');
}

/**
 * 生成 /rss.xml 的正文：按发布时间倒序取前 limit 篇
 * @param {{ siteUrl: string, siteTitle: string, siteDescription?: string, posts: Record<string, any>[], limit?: number, builtAt?: Date }} opts
 */
export function buildRssFeed({ siteUrl, siteTitle, siteDescription = '', posts, limit = 20, builtAt = new Date() }) {
  const items = [...posts]
    .filter((post) => post && post.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((post) => {
      const postUrl = `${siteUrl}/post/${encodeURIComponent(post.id)}`;
      const category = post.category ? `\n      <category>${xmlText(post.category)}</category>` : '';
      return `
    <item>
      <title><![CDATA[${xmlCdata(post.title)}]]></title>
      <link>${xmlText(postUrl)}</link>
      <guid>${xmlText(postUrl)}</guid>
      <pubDate>${xmlText(new Date(post.date).toUTCString())}</pubDate>
      <description><![CDATA[${xmlCdata(post.excerpt)}]]></description>${category}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlText(siteTitle)}</title>
    <link>${xmlText(siteUrl)}</link>
    <description>${xmlText(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${builtAt.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlText(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
}
