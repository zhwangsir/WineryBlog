---
title: Shell 参数扩展完整语法
category: 操作系统与运维
order: 17
tags: [Shell, Bash, 参数扩展, 脚本]
summary: ${var} 的全部形态：默认值、子串、前后缀删除、替换与大小写——一行顶十行的 Bash 内建语法。
---

## 1. 为什么只学参数扩展

脚本里处理变量，90% 的需求（默认值、去扩展名、截取、替换）**不需要启动 sed/awk/cut 子进程**——Bash 内建的参数扩展（Parameter Expansion）一行完成。子进程启动成本约 1-5ms/次，循环里就是性能灾难。语法统一为 `${...}` 形态。

**前提纪律**：所有扩展表达式务必**加双引号**包裹使用（`"$var"`、`"${var}"`），否则触发分词（word splitting）与 glob 展开——路径带空格就翻车。

## 2. 四种默认值形态：:- / := / :? / :+

```bash
${var:-default}    # var 未设置或为空 → 用 default（var 本身不变）
${var:=default}    # 同上，且把 default 赋回 var（修改了变量！）
${var:?err_msg}    # 未设置或为空 → 打印 err_msg 并退出脚本（防呆）
${var:+alt}        # var 已设置且非空 → 用 alt；否则空串
```

实战对照：

```bash
# 配置默认值（只读不改）
PORT="${PORT:-8080}"

# 配置默认值并固化（后续直接用 $PORT）
: "${LOG_DIR:=/var/log/myapp}"      # : 是空命令，只为执行扩展的赋值副作用

# 关键变量缺失直接报错退出（防呆第一线）
: "${API_KEY:?环境变量 API_KEY 未设置}"

# 已设置时才追加（可选覆盖）
cmd="${BASE_CMD:+$BASE_CMD --verbose} serve"
```

**辨析**：`:-` 与 `:?` 是脚本的"容错与防呆"，`:=` 是"就地初始化"，`:+` 是"可选修饰"。四个冒号形态统称默认值扩展——`:` 的有无决定"未设置"与"空串"是否同等对待（`-` 无冒号只查"未设置"，空串也算已设置）。

## 3. 长度与子串

```bash
${#var}              # 字符串长度（数组则是元素个数）
${var:offset}        # 从 offset 起到末尾
${var:offset:len}    # 从 offset 起 len 个字符
${var: -5}           # 负数要留空格！从倒数第 5 个起（无空格会被当 offset:-5 参数）
${var:(-5)}          # 等价写法：括号形式

path="/var/log/nginx/access.log"
${path:0:4}          # /var
${path: -4}          # .log
```

注意 offset 从 0 计；负数偏移必须有空格或括号分隔——这是 Bash 语法的著名暗坑。

## 4. 前后缀删除：# 与 % 的记忆法

```bash
file="archive.tar.gz"

${file#*.}      # 最短匹配从头删到第一个 '.'  → tar.gz
${file##*.}     # 最长匹配从头删到最后一个 '.' → gz        （取扩展名）
${file%.*}      # 最短匹配从尾删到最后一个 '.' → archive.tar （去扩展名）
${file%%.*}     # 最长匹配从尾删到第一个 '.'  → archive     （取主名）
```

**记忆法**：`#` 在键盘上位于 `$`（头部象征）左边 → 删**头**；`%` 在 `$` 右边 → 删**尾**。单个符号=最短匹配，双符号=最长匹配（贪婪）。

经典组合：

```bash
name="${file%.*}"; ext="${file##*.}"           # 拆主名与扩展名
echo "${PATH//:/'\n'}"                          # 冒号分隔转行（见替换）
for f in *.jpg; do mv "$f" "${f%.jpg}.png"; done   # 批量改扩展名
```

## 5. 模式替换：单次与全局

```bash
${var/pattern/replacement}      # 替换第一个匹配
${var//pattern/replacement}     # 替换全部（// 全局）
${var/#pattern/repl}            # 只替换开头匹配
${var/%pattern/repl}            # 只替换结尾匹配

url="https://httpbin.org/httpbin"
echo "${url/http/ftp}"          # 把第一个 http 换 ftp（注意 https 也会中招！）
echo "${url//http:\/\//}"       # 全局删除（/ 是替换符需转义 \/）
```

**陷阱**：`/pattern` 中 pattern 支持 glob（`*`、`?`、`[...]`），但不支持完整正则——复杂替换交给 sed。上例 `${url/http/ftp}` 恰好命中 https 里的 http 子串，结果变成 `ftps://...`——**替换是基于子串的不是单词**，务必精确模式。

## 6. 大小写转换（Bash 4+）

```bash
${var^}      # 首字母大写
${var^^}     # 全部大写
${var,}      # 首字母小写
${var,,}     # 全部小写

env=Production
echo "${env,,}"                 # production
echo "${env^^:0:1}${env,,:1}"   # P + roduction（首大写的手动版，Bash4 有 ^）
```

macOS 自带 Bash 3.2 **不支持**这些语法——跨平台脚本用 `tr` 替代：`echo "$env" | tr '[:upper:]' '[:lower:]'`。

## 7. 与相邻语法的对比辨析

| 需求 | 参数扩展 | 等价外部命令 | 谁赢 |
| --- | --- | --- | --- |
| 默认值 | `${v:-d}` | `v=${v:-d}`（同源）| 参数扩展（无子进程） |
| 取扩展名 | `${f##*.}` | `echo $f \| awk -F. '{print $NF}'` | 参数扩展（快+无引号坑） |
| 复杂正则替换 | 做不到 | sed | sed |
| 多行/复杂解析 | 勉强 | awk | awk |
| 简单计数长度 | `${#s}` | `echo -n $s \| wc -c` | 参数扩展 |

**原则**：内建能做的不起子进程；正则与多行交给 sed/awk——各干各的。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 带空格路径被拆成两个参数 | 未加引号的展开触发分词 | `"$var"` 全程引号 |
| `for f in $list` 空格项拆开 | 同上 | `for f in "$list"` 或数组 |
| `${var: -5}` 写成 `${var:-5}` | 被解析为默认值扩展（默认值是 5） | 负偏移留空格 `${var: -5}` |
| 通配符在替换中被展开 | 未引用的表达式含 `*` | 整个表达式加引号 `"${var//x/y}"` |
| 脚本在 macOS 报错 | Bash 3.2 缺少新语法 | 用 tr/兼容写法；shebang 指 bash4 |
| `$*` 多参数被并成一个 | `$*` 合并成单字符串 | `"$@"`（保留参数边界） |

## 9. `"$@"` 与 `"$*"`：转发参数的唯一正确写法

```bash
run_cmd() {
  cmd "$@"           # ✓ 每个参数独立传递（含空格的参数不拆散）
  # cmd "$*"         # ✗ 所有参数并成一个字符串
  # cmd $@           # ✗ 再次分词，含空格参数爆炸
}
run_cmd echo "hello world" "second arg"
# "$@" 传给 echo 的是 2 个参数；"$*" 是 1 个 "hello world second arg"
```

包装器脚本（透传任意命令）的唯一正确形式就是 `"$@"`——shell 脚本的"rest 参数"。

## 10. 自测五题

1. `:-` 与 `:?` 的使用场景差异？
2. `${f##*.}` 与 `${f%.*}` 分别提取什么？
3. `${var: -5}` 为什么必须有空格？
4. `"$@"` 与 `"$*"` 在参数转发时的本质差异？
5. 哪些场景必须退回 sed/awk？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Shell 脚本入门》《Linux 文本三剑客：grep/sed/awk》《Linux 常用命令与文本处理》《Shell 参数扩展完整语法》（本文）
- 《Bash Pocket Reference》——参数扩展章节速查
- Bash 官方手册 Parameter Expansion 章节
