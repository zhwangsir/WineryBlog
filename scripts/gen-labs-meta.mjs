// 为 labs.json 注入实验室元数据：kind（web=浏览器沙箱可真跑 / sim=AI 仿真终端）、
// simEnv（仿真环境描述）、starter（web 类的初始用户代码）
// 幂等：重复运行只覆盖元数据字段，不动实验内容本身
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LABS_FILE = path.join(ROOT, 'server', 'data', 'labs.json');

const META = {
  // ── web：浏览器沙箱可真跑 ──
  't11_dp_intro': {
    kind: 'web',
    starter: `let calls = 0;
function f(n) {
  calls++;
  if (n <= 2) return n;
  return f(n - 1) + f(n - 2);
}
console.log('f(30) =', f(30));
console.log('暴力递归调用次数 =', calls);

// TODO Step 2：加 memo 缓存，对比调用次数
// TODO Step 3：改成递推 DP，空间 O(1)`,
  },
  'w53_threejs_canvas': {
    kind: 'web',
    starter: `// 在下方沙箱预览区直接看效果；改代码后点「运行」
const ps = Array.from({ length: 200 }, () => ({
  x: Math.random() * 480, y: Math.random() * 160,
  vx: Math.random() * 2 + 0.5, vy: 0,
}));
let frame = 0;
setInterval(() => {
  frame++;
  ctx.clearRect(0, 0, 480, 160);
  for (const p of ps) {
    p.vy += 0.05;                    // 重力
    p.x = (p.x + p.vx) % 480;
    p.y += p.vy;
    if (p.y > 160) { p.y = 0; p.vy = 0; }
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  console.log('frame', frame);
}, 33);`,
  },
  'x-x83_probability': {
    kind: 'web',
    starter: `function entropy(ps) {
  // TODO: 实现 H = -Σ p·log2(p)，p=0 时贡献按 0 处理
  return 0;
}
console.log('均匀分布 [0.5,0.5] →', entropy([0.5, 0.5]));   // 期望 1
console.log('一边倒 [0.9,0.1] →', entropy([0.9, 0.1]));     // 期望 ≈0.469
console.log('确定事件 [1,0] →', entropy([1, 0]));           // 期望 0

function textEntropy(text) {
  // TODO: 统计字符频率 → 归一化 → entropy
  return 0;
}
console.log('重复文本熵:', textEntropy('哈哈哈哈哈哈'));
console.log('多样文本熵:', textEntropy('信息熵度量不确定性'));`,
  },
  'x-x78_design_patterns': {
    kind: 'web',
    starter: `// Step 1：会腐烂的 if-else 原版
function finalPrice(type, price) {
  if (type === 'full') return price >= 100 ? price - 20 : price;
  if (type === 'percent') return price * 0.85;
  if (type === 'vip') return price * 0.8 - 5;
  return price;
}
console.log(finalPrice('full', 120), finalPrice('percent', 100));

// TODO Step 2：重构为策略表 strategies = { full: p => ..., ... }
// TODO Step 3：新增 full200 促销，验证 finalPrice 零改动`,
  },
  'w92_sec_xss_sqli': {
    kind: 'web',
    starter: `<div id="box" style="border:1px solid #333;padding:8px">评论区</div>
<script>
  // Step 1：模拟「直接 innerHTML 渲染用户评论」的漏洞写法
  const userInput = '<img src=x onerror="document.getElementById(\\'box\\').innerHTML += \\'<p style=color:#f27d26>XSS 触发！脚本执行了</p>\\'">';
  // TODO：取消下一行注释，观察 XSS 发生（本沙箱内完全安全）
  // document.getElementById('box').innerHTML = userInput;

  // Step 2：改用 textContent 修复——用户输入变纯文本
  // document.getElementById('box').textContent = userInput;
</script>`,
  },
  'x-x57_promise_impl': {
    kind: 'web',
    starter: `// 最小 Promise 骨架：实现 then 与 resolve 的同步/异步两种路径
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.cbs = [];
    const resolve = (v) => {
      if (this.state !== 'pending') return;
      this.state = 'fulfilled';
      this.value = v;
      this.cbs.forEach((cb) => cb(v));
    };
    executor(resolve);
  }
  then(onFulfilled) {
    // TODO：pending 时把回调存入 this.cbs；fulfilled 时立即调用
    if (this.state === 'fulfilled') onFulfilled(this.value);
    else this.cbs.push(onFulfilled);
    return this;
  }
}

// 验收：同步与异步 resolve 都能触发 then
new MyPromise((r) => r(1)).then((v) => console.log('同步:', v));
setTimeout(() => {
  new MyPromise((r) => setTimeout(() => r(2), 100)).then((v) => console.log('异步:', v));
}, 0);`,
  },
  'x-x54_flex_container': {
    kind: 'web',
    starter: `<div class="toolbar">
  <span class="logo">LOGO</span>
  <nav><a>首页</a><a>教程</a><a>关于</a></nav>
  <button class="cta">登录</button>
</div>
<style>
  .toolbar { display:flex; gap:16px; align-items:center; padding:12px; background:#1a2230; border-radius:8px; }
  .logo { color:#f27d26; font-weight:bold; }
  nav { display:flex; gap:12px; }
  /* TODO: 让 nav 居中、CTA 靠右 —— margin-left:auto 是关键 */
  .cta { background:#f27d26; color:#fff; border:none; padding:6px 14px; border-radius:6px; }
</style>`,
  },

  // ── sim：AI 仿真终端 ──
  'x-x16_prompt_engineering': {
    kind: 'sim',
    simEnv: '对话模型（右下角 AI 教练同时扮演「被提示的模型」，输入提示词 A/B/C 观察输出差异）',
  },
  'w15_express': {
    kind: 'sim',
    simEnv: 'Node.js + HTTP 服务终端（curl 请求与响应状态码均由仿真环境给出）',
  },
  'w01_git_install': {
    kind: 'sim',
    simEnv: 'Git Bash（Linux 风格终端，含完整 git 命令与冲突标记输出）',
  },
  'w29_redis_intro': {
    kind: 'sim',
    simEnv: 'redis-cli（交互式，支持 string/hash/list 指令与真实返回格式）',
  },
  'x-x75_dist_basics': {
    kind: 'sim',
    simEnv: 'Node.js REPL（含 Map 副本模拟脚本，可直接粘贴实验代码）',
  },
  'w42_android_intro': {
    kind: 'sim',
    simEnv: 'Kotlin Playground（Kotlin 代码即时求值，输出 println 结果）',
  },
  'x-x10_shell_script': {
    kind: 'sim',
    simEnv: 'Linux Bash（Ubuntu 22.04，date/tar/ls/xargs 等命令真实行为）',
  },
  's01_java_collections_concurrency': {
    kind: 'sim',
    simEnv: 'Java REPL（jshell，Map/Set/Stream 操作与真实输出格式）',
  },
};

const labs = JSON.parse(fs.readFileSync(LABS_FILE, 'utf8'));
let n = 0;
for (const [id, meta] of Object.entries(META)) {
  if (!labs[id]) { console.log('skip (no lab):', id); continue; }
  labs[id] = { ...labs[id], ...meta };
  n++;
}
fs.writeFileSync(LABS_FILE, JSON.stringify(labs, null, 1));
console.log(`meta updated on ${n} labs (total ${Object.keys(labs).length})`);
