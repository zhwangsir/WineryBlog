echo "== 404 条数 =="
grep -c '" 404 ' "$LOG"                # 3

echo "== 5xx 条数 =="
grep -cE '" 5[0-9]{2} ' "$LOG"         # 2
