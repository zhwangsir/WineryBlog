> LPUSH user:1:recent 42
> LPUSH user:1:recent 43
> LPUSH user:1:recent 44 45 46 47
> LTRIM user:1:recent 0 4
> LRANGE user:1:recent 0 -1   # 最近 5 条