#!/usr/bin/env bash
SRC="$1"
DEST="backups"
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$DEST"
tar -czf "$DEST/backup-$STAMP.tar.gz" -C "$(dirname "$SRC")" "$(basename "$SRC")"
echo "备份完成: $DEST/backup-$STAMP.tar.gz"