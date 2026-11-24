# 实验内容（labs-src）

实验室**只提供环境**：打开一个环境就能自由练习，想练什么由读者决定，没有任何完成度追踪。
每个环境附带若干**可选的示例练习**——只是一键载入的起始代码加一份参考说明，不用也完全不影响练习。

```
scripts/labs-src/
├── envs.json                      环境定义（顺序、名称、说明、仿真环境设定）
├── README.md
├── sql/seed.sql                   SQL 环境默认的练习数据库
└── <环境 id>/                     一个环境一个目录
    ├── _starter/                  空白练习的起步代码（打开环境时编辑器里的内容，必须能直接跑通）
    └── <示例 id>/                 目录名就是示例 id（kebab-case）
        ├── lab.json               元数据 + 参考步骤 + 自查清单
        ├── files/                 起始代码（文件扩展名决定语言）
        ├── solution/              参考答案
        ├── seed.sql               可选：这一示例专用的数据库，覆盖默认练习库
        └── snippets/              步骤里引用的示例代码
```

`node scripts/build-labs.mjs` 把它们汇编成 `server/data/labs.json`（接口 `/api/labs` 读的就是它）。

## lab.json

```json
{
  "id": "html-basics",
  "title": "HTML 基础：第一个语义化网页",
  "summary": "一句话简介，显示在示例下拉和列表里（30 字以内）",
  "goal": "这个示例想带读者认识什么。",
  "minutes": 15,
  "level": "入门",
  "tags": ["HTML", "语义化"],
  "order": 10,
  "steps": [
    {
      "title": "Step 1 · 认识骨架",
      "detail": "这一步做什么、为什么。可以提「中间编辑器」「右上角的运行按钮」「右侧预览」这些界面元素。",
      "check": "做完这一步，读者能在结果区亲眼看到什么",
      "hint": "可选：卡住时的提示",
      "snippet": "snippets/step1.html"
    }
  ],
  "verify": ["自查清单，至少 2 条", "…"]
}
```

| 字段 | 说明 |
| --- | --- |
| `id` | 必须与目录名一致。沿用自旧版的示例，id 就是对应教程的文章 id；新的用 kebab-case |
| `post` | 可选：关联的文章 id。有的话文章页会出现「配套示例」的入口 |
| `level` | `入门` / `进阶` / `挑战`，只是难度提示 |
| `order` | 环境内的排序，数字小的在前 |
| `steps` | 2–4 步；每步必须有 `title`、`detail`、`check`。读者可以从任意一步看起，所以每一步都要能独立读懂 |
| `snippet` | 相对示例目录的文件路径，构建时内联成 `code`，显示为这一步的示例代码 |
| `sim` | 仅仿真终端的示例：`{ "setup": "…" }`，这一示例的初始状态，接在环境设定后面 |

**不要写完成度相关的内容**：没有「标记完成」「通关」「做完打勾」这类东西。示例不是任务，
措辞上把它当作「一份可以照着做的参考」。

## 各环境的文件约定

| 环境 | 起步代码 / 起始代码 | 运行方式 |
| --- | --- | --- |
| `web` 前端环境 | `_starter/` 与 `files/` 里至少有 `index.html`，可有 `style.css`、`script.js` | 实时渲染到沙箱 iframe；`index.html` 可以是 body 片段，也可以是完整文档 |
| `js` JavaScript | `main.js` | 后台线程真实执行，支持顶层 `await`，最后一个表达式的值会打印 |
| `python` Python | `main.py` | Pyodide（CPython）真实执行，`print` 与最后一个表达式的值会显示 |
| `sql` 数据库 SQL | `query.sql` | 先灌入 `sql/seed.sql`（或示例自己的 `seed.sql`），再执行查询 |
| `ai` AI 提示词 | `system.md`、`user.md` | 作为系统 / 用户提示词发给站内大模型 |
| `shell` / `java` / `node` | 可选；示例没带文件时沿用环境的起步代码 | AI 仿真终端：`shell` 常用 `*.sh`，`java` 用 `*.java` / `*.jsh` / `*.kts`，`node` 用 `server.js` |

## 硬性约束

1. **不出站**：任何文件里都不能出现站外地址（`http://`、`https://`、`//cdn…`、`www.`），构建会直接失败。
   不引用外部图片、字体、脚本库；练习用的链接写 `href="#"`；唯一放行的是 `localhost` / `127.0.0.1`。
2. **参考答案必须真的能跑**，注释里的预期输出必须是实际运行得到的数字：
   `node scripts/test-labs.mjs` 会把 JavaScript、SQL、Python 示例的起始代码和参考答案真正执行一遍
   （Python 的参考答案还会逐行对照注释里的 `# → 预期输出`）。
3. **起始代码和 `_starter/` 也要能跑**：不能一上来就卡死或抛「未捕获」的异常。留 `TODO` 让读者补全，
   并用注释写明每处 TODO 该做什么。
4. 全部简体中文；界面元素按工作台的实际布局来称呼（左侧说明面板、中间编辑器、右侧结果、右上角按钮）。

## 构建与校验

```bash
npm run labs:build     # 汇编成 server/data/labs.json，并做结构校验（字段、站外地址零容忍、id 唯一）
npm run labs:test      # 运行校验：真实执行 JS / SQL / Python 的起始代码与参考答案
npm run labs:pyodide   # 下载 Python 引擎到 public/vendor/pyodide/（约 14MB，不入 git，新环境执行一次）
```

改完内容只需要重新构建；服务端按文件修改时间自动重新加载。
