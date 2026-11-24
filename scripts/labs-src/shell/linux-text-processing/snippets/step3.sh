echo "== 访问量 Top 3 IP =="
awk '{print $1}' "$LOG" | sort | uniq -c | sort -rn | head -n 3
# 输出：
#     8 10.0.0.5
#     5 172.16.8.23
#     4 192.168.1.15
