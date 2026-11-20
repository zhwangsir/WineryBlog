# WineryBlog 教程体系与 AI 助教方案

> 2026-11-20 定稿。调研基线：csdiy.wiki、OSSU computer-science、roadmap.sh、
> 2025 AI tutoring 最佳实践（Harvard AI-tutor RCT / Khanmigo 苏格拉底设计）。

## 1. 调研结论

| 来源 | 借鉴点 |
| --- | --- |
| csdiy.wiki | 按知识域组织教程；每篇教程独立页面、注明先修与自学建议 |
| OSSU CS | 阶段化课程体系：入门 → 核心必修（按序）→ 高级选修（分方向）→ 毕业项目；课程带时长/每周投入/先修元数据 |
| roadmap.sh | 职业路线 = 有序节点：主题 → 资源 → 项目实战 → 求职准备 |
| AI tutoring RCT / Khanmigo | 助教默认苏格拉底式（不给答案、先追问、分层提示）**但**纯苏格拉底会导致挫败放弃——需提供多模式切换（讲解/引导/出题/实操），并携带当前教程全文作为教学上下文 |

## 2. 信息架构

```
/                    主页 = 纯博客流（随笔 / 项目实战 / 动态；教程类移出）
/post/:id            文章详情（博客与教程共用渲染层）
/tutorials           教程板块首页：知识域矩阵 + 职业路线入口（替代原 /learning）
/tutorials/:domain   知识域教程列表（难度 / 时长 / 先修标注）
/routes/:career      职业路线：阶段化路线 + 每阶段目标 / 自测 + 毕业项目
/ai                  AI 馆员（全局问答，保留）
```

教程阅读页（/post/:id，当文章属于教程域时）挂载 **AI 助教面板**。

## 3. 数据模型

### 3.1 知识域（domains，11 个）

由现有 15 个 post 分类 + src/tutorials/*.md 归并：

| 域 | 收录 |
| --- | --- |
| 编程基础与工具 | 方法与工具 + 计算机组成 + 工具类 md |
| 编程语言 | 编程语言分类 + 语言类 md |
| 数据结构与算法 | 数据结构与算法分类 + 算法 md |
| 计算机系统与网络 | 计算机网络 + 操作系统与运维 + 网络/OS md |
| Web 前端 | Web 前端分类 |
| 后端开发 | 后端开发分类 |
| 数据库与大数据 | 数据库 + 大数据 |
| 人工智能 | 人工智能分类 |
| 信息安全 | 信息安全分类 |
| 移动与跨端 | 移动与跨端分类 |
| 项目实战 | 项目实战分类（同时保留在主页博客流） |

**博客流（主页）** = 随笔 + 项目实战 + 非教程动态；其余全部进入教程板块。

### 3.2 server/data/tutorials.json（脚本生成）

```jsonc
{
  "domains": [{ "id": "web-frontend", "name": "Web 前端", "icon": "Monitor", "blurb": "…", "count": 15 }],
  "tutorials": [{
    "id": "p123",            // 稳定引用（post id 或 md slug）
    "kind": "post | md",     // md 教程经 build 时注入 posts.json
    "title": "…", "summary": "…",
    "domain": "web-frontend",
    "category": "Web 前端",   // 原分类保留
    "difficulty": "入门|进阶|高级",
    "minutes": 12,
    "tags": [], "prereqs": ["标题引用"], "href": "/post/123"
  }]
}
```

生成脚本：`scripts/build-tutorials.mjs`（读 posts.json + 扫描 src/tutorials/*.md frontmatter）。

### 3.3 server/data/careers.json（职业路线，12 条）

```jsonc
{
  "id": "frontend", "name": "前端工程师", "icon": "Monitor", "tagline": "…",
  "skills": ["HTML/CSS", "JavaScript", "…"],   // 结业能力清单
  "stages": [{
    "name": "阶段 1 · 地基", "goal": "…",
    "items": [{ "ref": "p123", "why": "为什么学这个" }],
    "checkpoint": "自测：…"
  }],
  "capstone": { "title": "毕业项目", "desc": "…" },
  "extras": [{ "ref": "p88", "why": "选修" }]
}
```

12 条路线：前端、后端（Java 方向）、后端（Python/Go 方向）、全栈、AI 应用工程师、
算法工程师、数据工程师、网络安全、运维 / SRE、移动开发、测试 / QA、游戏开发。
（嵌入式 / IoT 列为 extras 附注，教程齐后再独立成线。）

## 4. AI 助教（POST /api/tutor）

**上下文**：system prompt + 当前教程全文（教程均 <2 万字，内网 1M 上下文模型直接全量携带）。

**四模式**（默认 socratic，可一键切换）：

| 模式 | 行为 |
| --- | --- |
| explain 讲解 | 直接讲透当前难点：类比 + 图解式文字 + 代码示例 |
| socratic 引导 | 苏格拉底式：一次只问一个问题；学生连续 2 轮答不上 → 主动给阶梯提示 |
| quiz 检验 | 出 3 道题（选择/简答/编程各一），学生作答后逐题批改并给分 |
| practice 实操 | 给一个 30-60 分钟的实战小练习 + 分解步骤 + 验收标准 |

**前端**：教程详情页右下角悬浮「AI 助教」按钮 → 侧滑面板（复用 AIChat 的
markdown 渲染），模式切换 Tab + 预置引导语。

## 5. 教程扩写计划（持续迭代）

现有：117 posts（116 教程性质）+ 14 篇 x 系列 md。
目标：11 域全覆盖，每域 ≥8 篇核心教程。

第一批（填补路线引用缺口，本迭代）：
计算机组成 ×2、数据库 ×3（Redis / MongoDB / 建模）、AI ×3（Prompt / RAG / Transformer）、
前端 ×4（TS 实战 / Hooks 深入 / 布局系统 / 浏览器渲染）、工具 ×1（Git 工作流）。
游戏开发 / 嵌入式在第二批补齐后独立成线。

## 6. 验收标准

1. 主页不再出现教程类文章，显示博客流 + 空态引导卡
2. /tutorials 可按域浏览全部教程，按难度/时长过滤
3. /routes/frontend 等 12 条路线可走通：阶段 → 教程 → 自测 → 毕业项目
4. 教程页 AI 助教四模式均能端到端回答（内网 vLLM）
5. 全站 tsc 通过，推送 GitHub
