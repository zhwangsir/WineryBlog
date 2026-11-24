#!/usr/bin/env bash
# 用法：bash backup.sh <要备份的目录>

# Step 2：参数校验——放在最前面，失败即退出
if [ -z "$1" ]; then
  echo "用法: backup.sh <要备份的目录>"
  exit 1
fi
if [ ! -d "$1" ]; then
  echo "目录不存在: $1"
  exit 1
fi

SRC="$1"
DEST="backups"
STAMP=$(date +%Y%m%d-%H%M%S)

# Step 1：时间戳文件名 + tar 打包
mkdir -p "$DEST"
tar -czf "$DEST/backup-$STAMP.tar.gz" -C "$(dirname "$SRC")" "$(basename "$SRC")"
echo "备份完成: $DEST/backup-$STAMP.tar.gz"

# Step 3：只保留最近 3 份（ls -t 新的在前；tail -n +4 跳过前 3 行；xargs -r 在没有输入时不执行 rm）
ls -t "$DEST"/backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs -r rm -f
echo "已清理旧备份，仅保留最近 3 份"
