#!/usr/bin/env bash
# 访问日志分析：统计 ~/demo/access.log 的状态码分布与访问量最高的 IP
LOG="$HOME/demo/access.log"

# Step 1：总览——一行日志就是一次请求，总行数即总请求数（这一条已经写好）
echo "== 总请求数 =="
wc -l < "$LOG"

# TODO（Step 1）：用 grep -c 分别数出 404 和 5xx 的条数
#   - 404：用模式 '" 404 ' 精确匹配状态码（它前面是请求行的右双引号，不会误中字节数）
#   - 5xx：用 grep -cE 加扩展正则 '" 5[0-9]{2} '，匹配 500~599
#   每条统计前面都用 echo 打印一行小标题，输出才好读

# TODO（Step 2）：状态码分布
#   awk '{print $9}' 取出状态码这一列 → sort 排序 → uniq -c 去重并计数 → sort -rn 按次数降序

# TODO（Step 3）：访问量前 3 的 IP
#   同样的管线换成第 1 列（$1），最后用 head -n 3 只取前 3 名
