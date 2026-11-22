// Generate server/data/labs.json (valid JSON guaranteed via JSON.stringify)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const s01Steps = [
  {
    title: 'Step 1 · 用 HashMap 统计借阅次数',
    detail: '给定借阅记录数组（每条为书名），统计每本书被借阅的次数。核心：map.merge(key, 1, Integer::sum) 一行完成计数。',
    code: 'import java.util.*;\n\npublic class BorrowStats {\n    public static void main(String[] args) {\n        String[] records = {\n            "三体", "三体", "红楼梦", "三体", "红楼梦", "活着"\n        };\n        Map<String, Integer> count = new HashMap<>();\n        for (String book : records) {\n            count.merge(book, 1, Integer::sum);   // 不存在放 1，存在则累加\n        }\n        System.out.println(count);\n        // 期望：{三体=3, 红楼梦=2, 活着=1}\n    }\n}',
    check: '运行后输出 {三体=3, 红楼梦=2, 活着=1}',
  },
  {
    title: 'Step 2 · 按借阅次数降序排行',
    detail: '把 Map 的 entrySet 转成 List，用 Comparator 按值降序排序后输出 TopN。这是「Map 无法直接排序」的经典处理套路。',
    code: 'count.entrySet().stream()\n    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())\n    .limit(2)\n    .forEach(e -> System.out.println(e.getKey() + " × " + e.getValue()));\n// 期望：三体 × 3 / 红楼梦 × 2',
    check: '输出 Top2 排行，且次数降序',
  },
  {
    title: 'Step 3 · 用 Set 找出「谁两本都借过」',
    detail: '再给两个人各自的借阅清单，用 Set 的 retainAll（交集）找出共同借阅的书——体会去重与交界的 O(1) 语义。',
    code: 'Set<String> alice = new HashSet<>(List.of("三体", "活着"));\nSet<String> bob = new HashSet<>(List.of("三体", "红楼梦"));\nalice.retainAll(bob);\nSystem.out.println(alice);   // 期望：[三体]',
    check: '输出交集 [三体]',
  },
];

const s01Solution = 'import java.util.*;\n\npublic class BorrowStats {\n    public static void main(String[] args) {\n        String[] records = { "三体", "三体", "红楼梦", "三体", "红楼梦", "活着" };\n        Map<String, Integer> count = new HashMap<>();\n        for (String book : records) count.merge(book, 1, Integer::sum);\n\n        count.entrySet().stream()\n            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())\n            .limit(2)\n            .forEach(e -> System.out.println(e.getKey() + " × " + e.getValue()));\n\n        Set<String> alice = new HashSet<>(List.of("三体", "活着"));\n        Set<String> bob = new HashSet<>(List.of("三体", "红楼梦"));\n        alice.retainAll(bob);\n        System.out.println(alice);\n    }\n}';

const labs = {
  s01_java_collections_concurrency: {
    title: '实验：图书借阅统计（集合框架实战）',
    runner: 'none',
    minutes: 30,
    goal: '用 HashMap + List + 排序解决一个真实的「图书借阅统计」问题，体会「查询多用 ArrayList、去重用 Set、键值映射用 Map」的选型口诀。',
    env: '任意 Java 8+ 环境（IDEA / VS Code / 在线编译器均可）',
    steps: s01Steps,
    verify: [
      'Step 1 输出与注释中的期望完全一致',
      'Step 2 能正确输出降序 Top2',
      'Step 3 交集结果为 [三体]',
      '能口头回答：为什么统计用 HashMap 而排行要先转 List？',
    ],
    solution: s01Solution,
  },

  'x-x57_promise_impl': {
    title: '实验：手写 Promise.all 并验证',
    runner: 'js',
    minutes: 25,
    goal: '不借助 Promise.all，手写一个行为兼容的 myAll：全部成功则按「原顺序」返回结果数组；任一失败立即 reject。跑通三组验证用例。',
    env: '本页运行器直接跑（浏览器 JS），或粘贴到浏览器控制台',
    steps: [
      {
        title: 'Step 1 · 骨架：计数器 + 位置保序',
        detail: '核心难点是「按原顺序返回」：不能 push（完成顺序不定），要用 results[i] = v 按下标写入；用计数器判断是否全部落定。',
        starter: 'function myAll(promises) {\n  return new Promise((resolve, reject) => {\n    const results = [];\n    let done = 0;\n    // TODO: 处理空数组\n    // TODO: 遍历 promises，逐个 .then\n    //   成功: results[i] = v; done++; 若 done === promises.length 则 resolve(results)\n    //   失败: reject(e)（只第一次生效——Promise 天然如此）\n  });\n}',
      },
      {
        title: 'Step 2 · 三个验证用例',
        detail: '① 全成功且乱序完成（慢的排前面）；② 包含非 Promise 值（直接当结果）；③ 任一失败。三组输出的顺序与时序都要对。',
        starter: "// 用例①：乱序完成但结果保序\nmyAll([\n  new Promise(r => setTimeout(() => r('A'), 300)),\n  new Promise(r => setTimeout(() => r('B'), 100)),\n]).then(console.log);            // 期望 ['A','B']（不是 ['B','A']）\n\n// 用例②：普通值混入\nmyAll([1, Promise.resolve(2), 3]).then(console.log);   // [1,2,3]\n\n// 用例③：任一失败\nmyAll([Promise.reject(new Error('boom')), 1])\n  .catch(e => console.log('caught:', e.message));       // caught: boom",
      },
      {
        title: 'Step 3 · 进阶：给 myAll 加超时',
        detail: '用 Promise.race 把 myAll 与一个 setTimeout reject 的 Promise 竞速——超时未完成则整体 reject（工程中拉取接口的标配保护）。',
        starter: "function withTimeout(p, ms) {\n  return Promise.race([\n    p,\n    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))\n  ]);\n}\n// 验证：一个 500ms 才完成的任务，超时设 200ms → 应 reject('timeout')",
      },
    ],
    verify: [
      '用例① 输出 [\'A\',\'B\']——顺序与输入一致而非完成顺序',
      '用例② 非 Promise 值被正确当作结果',
      '用例③ reject 只触发一次 catch',
      'withTimeout 包裹慢任务能按预期超时',
    ],
    solution: "function myAll(promises) {\n  return new Promise((resolve, reject) => {\n    const list = Array.from(promises);\n    const results = new Array(list.length);\n    let done = 0;\n    if (list.length === 0) return resolve([]);\n    list.forEach((p, i) => {\n      Promise.resolve(p).then(v => {\n        results[i] = v;\n        if (++done === list.length) resolve(results);\n      }, reject);\n    });\n  });\n}\n\nfunction withTimeout(p, ms) {\n  return Promise.race([\n    p,\n    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))\n  ]);\n}\n\n// 验证用例①\nmyAll([\n  new Promise(r => setTimeout(() => r('A'), 300)),\n  new Promise(r => setTimeout(() => r('B'), 100)),\n]).then(console.log);\n// 用例②\nmyAll([1, Promise.resolve(2), 3]).then(console.log);\n// 用例③\nmyAll([Promise.reject(new Error('boom')), 1])\n  .catch(e => console.log('caught:', e.message));\n// 用例④ 超时\nwithTimeout(new Promise(r => setTimeout(() => r('ok'), 500)), 200)\n  .catch(e => console.log('timeout caught:', e.message));",
    runnerStarter: "// 在下面实现 myAll 并运行验证\nfunction myAll(promises) {\n  return new Promise((resolve, reject) => {\n    const list = Array.from(promises);\n    const results = new Array(list.length);\n    let done = 0;\n    if (list.length === 0) return resolve([]);\n    list.forEach((p, i) => {\n      Promise.resolve(p).then(v => {\n        results[i] = v;\n        if (++done === list.length) resolve(results);\n      }, reject);\n    });\n  });\n}\n\nconsole.log('①', await myAll([\n  new Promise(r => setTimeout(() => r('A'), 300)),\n  new Promise(r => setTimeout(() => r('B'), 100)),\n]));\nconsole.log('②', await myAll([1, Promise.resolve(2), 3]));\nawait myAll([Promise.reject(new Error('boom')), 1])\n  .catch(e => console.log('③ caught:', e.message));",
  },

  'x-x54_flex_container': {
    title: '实验：Flex 三栏布局挑战（迷你 Froggy）',
    runner: 'web',
    minutes: 30,
    goal: '在实时预览里只用 flex 属性完成三关布局挑战：①居中一颗星；②三栏等分导航；③圣杯布局（侧栏+主区+侧栏）。全部通过即通关。',
    env: '本页运行器（右下实时预览），无需任何环境',
    steps: [
      {
        title: '第 1 关 · 完美居中',
        detail: '让容器里的 ★ 水平垂直都居中。只允许改 .stage 的两行属性。',
        starter: '.stage {\n  display: flex;\n  height: 120px;\n  background: #1a1f2b;\n  /* TODO: 补两行——水平居中 + 垂直居中 */\n}',
        check: '★ 出现在灰块正中央',
      },
      {
        title: '第 2 关 · 三等分导航',
        detail: '让三个导航项平分容器宽度（每个占 1/3），且间距 8px。',
        starter: '.stage2 {\n  display: flex;\n  height: 60px;\n  gap: 8px;\n  /* TODO: 让 .nav 均分剩余空间 */\n}\n.nav {\n  background: #2a3550;\n  border-radius: 6px;\n}',
        check: '三块等宽贴满一行，间隙 8px',
      },
      {
        title: '第 3 关 · 圣杯布局',
        detail: '左侧栏 80px 固定、右主区吃掉全部剩余空间（提示：flex: 1）。',
        starter: '.stage3 {\n  display: flex;\n  height: 90px;\n  /* TODO: aside 固定宽、main 自适应 */\n}\n.aside { background: #3d2f4f; width: 80px; }\n.main  { background: #24404f; flex: 1; }',
        check: '左块 80px 不变，拖动窗口右块始终填满',
      },
    ],
    verify: [
      '★ 完美居中',
      '三等分导航（等宽 + 8px 间距）',
      '圣杯布局且窗口缩放时主区始终自适应',
    ],
    solution: '第 1 关：justify-content: center; align-items: center;\n第 2 关：.nav { flex: 1; }\n第 3 关：.aside { flex: none; width: 80px; } .main { flex: 1; }',
    webStarter: {
      html: '<div class="stage">\n  <span class="star">★</span>\n</div>\n<div class="stage2">\n  <div class="nav">首页</div>\n  <div class="nav">教程</div>\n  <div class="nav">关于</div>\n</div>\n<div class="stage3">\n  <div class="aside">侧栏</div>\n  <div class="main">主区</div>\n</div>',
      css: '.stage {\n  display: flex;\n  height: 120px;\n  background: #1a1f2b;\n  /* TODO: 补两行实现居中 */\n}\n.star { color: #F27D26; font-size: 28px; }\n.stage2 {\n  display: flex;\n  height: 60px;\n  gap: 8px;\n  margin-top: 12px;\n}\n.nav {\n  background: #2a3550;\n  border-radius: 6px;\n  display: flex; align-items: center; justify-content: center;\n  color: #cfd8e3;\n}\n.stage3 {\n  display: flex;\n  height: 90px;\n  margin-top: 12px;\n}\n.aside { background: #3d2f4f; width: 80px; }\n.main  { background: #24404f; flex: 1; }',
    },
  },
};

fs.writeFileSync(path.join(ROOT, 'server/data/labs.json'), JSON.stringify(labs, null, 2));
console.log('labs.json written:', Object.keys(labs).join(', '));
