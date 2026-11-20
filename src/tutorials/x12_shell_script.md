---
title: Shell 脚本入门
category: 操作系统与运维/Linux 基础
order: 4
tags: [Shell, Bash, 脚本, 自动化]
summary: 变量、条件、循环、函数与参数——把重复操作写成一行脚本。
---

## 1. 第一个脚本

```bash
#!/bin/bash
# hello.sh
echo "Hello, $USER"
```

```bash
chmod +x hello.sh
./hello.sh
```

## 2. 变量

```bash
NAME="winery"
echo "Hello, $NAME"
readonly PI=3.14
unset NAME
```

命令替换：

```bash
DATE=$(date +%Y-%m-%d)
FILES=$(ls | wc -l)
echo "$DATE: $FILES files"
```

## 3. 条件判断

```bash
if [ "$1" -gt 10 ]; then
    echo "大于 10"
elif [ "$1" -eq 10 ]; then
    echo "等于 10"
else
    echo "小于 10"
fi

if [ -z "$NAME" ]; then echo "空"; fi
if [ -f "$FILE" ]; then echo "文件存在"; fi
if [ -d "$DIR" ]; then echo "目录存在"; fi
```

## 4. 循环

```bash
for item in apple banana cherry; do echo "$item"; done
for i in {1..10}; do echo "$i"; done
while IFS= read -r line; do echo "$line"; done < file.txt
```

## 5. 函数

```bash
greet() {
    local name=$1
    echo "Hello, $name"
}
greet "world"
```

## 6. 实用模板

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/data.tar.gz" /var/www/data
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
echo "备份完成"
```

## 延伸阅读

- [Google Shell 风格指南](https://google.github.io/styleguide/shellguide.html)
- 站内相关：《Linux 常用命令与文本处理》《Linux 服务器运维清单》
