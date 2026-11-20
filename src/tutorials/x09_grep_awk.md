---
title: Linux 文本三剑客：grep/sed/awk
category: 操作系统与运维/Linux 进阶
order: 1
tags: [Linux, grep, sed, awk, 文本处理]
summary: 三剑客的组合拳——grep 搜索、sed 替换、awk 分析，日志处理的完整工具链。
---

## 1. grep：搜索

```bash
grep "error" app.log              # 基本搜索
grep -i "error" app.log           # 忽略大小写
grep -n "error" app.log           # 显示行号
grep -r "TODO" src/               # 递归搜目录
grep -c "GET" access.log          # 统计匹配行数
grep -v "debug" app.log           # 反向（排除）
grep -E "error|warn" app.log      # 扩展正则
grep -A 3 -B 1 "error" app.log    # 显示匹配行后3行前1行
```

## 2. sed：流编辑器

```bash
sed 's/old/new/' file             # 替换每行第一个匹配
sed 's/old/new/g' file            # 全局替换
sed -i 's/old/new/g' file         # 直接修改文件
sed -n '10,20p' file              # 打印 10-20 行
sed '/debug/d' file               # 删除包含 debug 的行
sed '1d' file                     # 删除第一行
```

## 3. awk：按列分析

```bash
awk '{print $1}' access.log       # 打印第一列
awk '{sum += $NF} END {print sum}' file    # 最后一列求和
awk -F: '{print $1}' /etc/passwd  # 以冒号分列
awk '$3 > 100 {print $1}' file    # 条件过滤
awk 'NR > 1 {print}' file         # 跳过标题行
```

内置变量：`$0` 整行、`$1..$NF` 各列、`NF` 列数、`NR` 行号、`FS` 列分隔符。

## 4. 三剑客组合拳

**日志分析实战**：

```bash
# 统计每个 IP 的请求次数（Top 10）
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# 统计各状态码分布
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# 找出所有 5xx 请求的 URL
grep " 5[0-9][0-9] " access.log | awk '{print $7}' | sort | uniq -c | sort -rn

# 统计每个接口的平均响应时间
awk '{sum[$7] += $NF; count[$7]++} END {for (url in sum) printf "%s %.2fms\n", url, sum[url]/count[url]}' timing.log
```

## 5. 实用别名（加到 ~/.bashrc）

```bash
alias ll='ls -lah'
alias gs='git status'
alias ports='ss -tlnp | grep LISTEN'
alias myip='curl -s ifconfig.me'
```

## 延伸阅读

- 站内相关：《Linux 入门与文件系统》《Linux 常用命令与文本处理》《Linux 进阶》《Linux 服务器运维清单》
- [GNU sed 手册](/post/ref-gnu-org-software-sed-manual-sed-html)
- [GNU awk 手册](/post/ref-gnu-org-software-gawk-manual-gawk-html)
