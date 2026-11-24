echo "== 状态码分布 =="
awk '{print $9}' "$LOG" | sort | uniq -c | sort -rn
# 输出：
#    11 200
#     4 304
#     3 404
#     2 500
