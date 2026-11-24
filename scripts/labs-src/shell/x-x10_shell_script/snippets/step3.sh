ls -t "$DEST"/backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs -r rm -f
echo "已清理旧备份，仅保留最近 3 份"