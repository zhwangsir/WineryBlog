#!/usr/bin/env bash
# 访问日志分析：统计 ~/demo/access.log 的状态码分布与访问量最高的 IP
LOG="$HOME/demo/access.log"

# Step 1：总览——一行日志就是一次请求，总行数即总请求数
echo "== 总请求数 =="
wc -l < "$LOG"                             # 20

echo "== 404 条数 =="
grep -c '" 404 ' "$LOG"                    # 3（状态码前面是请求行的右双引号，这样匹配不会误中字节数）

echo "== 5xx 条数 =="
grep -cE '" 5[0-9]{2} ' "$LOG"             # 2（-E 开启扩展正则，5[0-9]{2} 匹配 500~599）

# Step 2：状态码分布——awk 取第 9 列，sort 排好序，uniq -c 去重并计数，sort -rn 按次数降序
echo "== 状态码分布 =="
awk '{print $9}' "$LOG" | sort | uniq -c | sort -rn
#    11 200
#     4 304
#     3 404
#     2 500

# Step 3：访问量前 3 的 IP——同一根管线换成第 1 列，head -n 3 只取前三名
echo "== 访问量 Top 3 IP =="
awk '{print $1}' "$LOG" | sort | uniq -c | sort -rn | head -n 3
#     8 10.0.0.5
#     5 172.16.8.23
#     4 192.168.1.15
