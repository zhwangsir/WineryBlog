// 候选池的精选清单（refill-pool.mjs 在池空时按此补充）
// 原则：纯 Markdown 的中文开源教程仓库、内容成体系、与已收录来源不重叠；
// domain 必须是 tutorials.json 里的 14 个域 id 之一；
// branch 不写死——refill 时经 GitHub API 校验存在性并填入真实默认分支。
// 已收录来源（脚本内置 SOURCES + 候选池历史）由 refill 脚本运行时自动排除，这里不必维护。
export const CURATED = [
  // ── 人工智能 ──
  // picks：仓库里的辅助文件（_FR 法语版、errata、index、各章 README 空壳）由收录脚本的 junk 过滤兜底；
  // 有明确正文目录的仓库写精确 picks，避免默认规则把辅助页挤占篇数上限
  { id: 'pumpkinbook', repo: 'datawhalechina/pumpkin-book', category: '南瓜书：机器学习公式详解', domain: 'ai', tags: ['机器学习', '公式推导', 'Datawhale'],
    picks: [{ dir: 'docs', keywords: ['.md'], max: 16, recursive: true, files: ['chapter1/chapter1.md', 'chapter2/chapter2.md', 'chapter3/chapter3.md', 'chapter4/chapter4.md', 'chapter5/chapter5.md', 'chapter6/chapter6.md', 'chapter7/chapter7.md', 'chapter8/chapter8.md', 'chapter9/chapter9.md', 'chapter10/chapter10.md', 'chapter11/chapter11.md', 'chapter12/chapter12.md', 'chapter13/chapter13.md', 'chapter14/chapter14.md', 'chapter15/chapter15.md', 'chapter16/chapter16.md'] }] },
  { id: 'dlbookcn', repo: 'exacity/deeplearningbook-chinese', category: '深度学习花书中文笔记', domain: 'ai', tags: ['深度学习', '花书', '笔记'],
    picks: [{ dir: 'docs/_posts', keywords: ['.md'], max: 20, recursive: true }] },
  { id: 'nndlbook', repo: 'nndl/nndl.github.io', category: '神经网络与深度学习', domain: 'ai', tags: ['神经网络', '邱锡鹏', '教材'] },
  // ── 编程语言 ──
  { id: 'waytogo', repo: 'Unknwon/the-way-to-go_ZH_CN', category: 'The Way to Go 中文版', domain: 'langs', tags: ['Go', '入门', '教材'] },
  // ── 后端开发 ──
  { id: 'goweb', repo: 'astaxie/build-web-application-with-golang', category: 'Go Web 编程', domain: 'backend', tags: ['Go', 'Web', 'beego'] },
  { id: 'codehunter', repo: 'doocs/source-code-hunter', category: '源码学习笔记', domain: 'backend', tags: ['Spring', 'Netty', '源码'] },
  // ── Web 前端 ──
  { id: 'es6tut', repo: 'ruanyf/es6tutorial', category: 'ES6 教程', domain: 'frontend', tags: ['JavaScript', 'ES6', '阮一峰'] },
  { id: 'mqblog', repo: 'mqyqingfeng/Blog', category: '深入 ES 系列', domain: 'frontend', tags: ['JavaScript', 'ES6', '进阶'] },
  // ── 数据库与大数据 ──
  { id: 'bigdatanotes', repo: 'heibaiying/BigData-Notes', category: '大数据教程笔记', domain: 'data', tags: ['Hadoop', 'Spark', 'Flink'] },
  // ── 移动与跨端 ──
  { id: 'flutteria', repo: 'flutterchina/flutter-in-action', category: 'Flutter 实战', domain: 'mobile', tags: ['Flutter', 'Dart', '跨端'] },
];
