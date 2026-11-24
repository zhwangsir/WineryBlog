if [ -z "$1" ]; then
  echo "用法: ./backup.sh <要备份的目录>"; exit 1
fi
if [ ! -d "$1" ]; then
  echo "目录不存在: $1"; exit 1
fi