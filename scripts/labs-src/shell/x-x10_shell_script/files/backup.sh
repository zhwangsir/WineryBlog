#!/usr/bin/env bash
# 用法：bash backup.sh <要备份的目录>
SRC="$1"
DEST="backups"
STAMP=$(date +%Y%m%d-%H%M%S)

# Step 1：建目录 + tar 打包（-C 先切到父目录，这样压缩包里只包含目标目录本身）
mkdir -p "$DEST"
tar -czf "$DEST/backup-$STAMP.tar.gz" -C "$(dirname "$SRC")" "$(basename "$SRC")"
echo "备份完成: $DEST/backup-$STAMP.tar.gz"

# TODO（Step 2）：把「参数校验」加到脚本最前面
#   - 没有参数：打印「用法: backup.sh <要备份的目录>」，然后 exit 1
#   - 目录不存在：打印「目录不存在: ...」，然后 exit 1
# TODO（Step 3）：只保留最近 3 份备份
