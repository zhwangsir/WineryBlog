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
chmod +x hello.sh      # 加执行权限
./hello.sh             # 运行
bash hello.sh          # 或直接 bash 运行
```

`#!/bin/bash` 是 shebang：告诉系统用哪个解释器执行。

## 2. 变量

```bash
NAME="winery"              # 赋值等号两边不能有空格！
echo "Hello, $NAME"        # 引用（双引号内解析）
echo 'Hello, $NAME'        # 单引号不解析（原样输出）

readonly PI=3.14            # 只读变量
unset NAME                  # 删除变量
```

**命令替换**：

```bash
CURRENT_DATE=$(date +%Y-%m-%d)
FILE_COUNT=$(ls | wc -l)
echo "Today is $CURRENT_DATE, $FILE_COUNT files"
```

**位置参数**：

```bash
./script.sh arg1 arg2
echo $1                     # arg1
echo $2                     # arg2
echo $#                     # 参数个数
echo $@                     # 所有参数
```

## 3. 条件判断

```bash
# 数字比较
if [ "$1" -gt 10 ]; then
    echo "大于 10"
elif [ "$1" -eq 10 ]; then
    echo "等于 10"
else
    echo "小于 10"
fi

# 字符串比较
if [ -z "$NAME" ]; then echo "为空"; fi      # -z 空串
if [ -n "$NAME" ]; then echo "非空"; fi      # -n 非空
if [ "$A" = "$B" ]; then echo "相等"; fi

# 文件测试
if [ -f "$FILE" ]; then echo "是文件"; fi
if [ -d "$DIR" ]; then echo "是目录"; fi
if [ -x "$FILE" ]; then echo "可执行"; fi
```

## 4. 循环

```bash
# for 遍历列表
for item in apple banana cherry; do
    echo "水果: $item"
done

# for 范围
for i in {1..10}; do echo "$i"; done
for i in $(seq 1 10); do echo "$i"; done

# while 读文件逐行
while IFS= read -r line; do
    echo "处理: $line"
done < input.txt

# C 风格 for
for ((i = 0; i < 10; i++)); do echo $i; done
```

## 5. 函数

```bash
deploy() {
    local ENV=$1               # local 限定作用域
    local BRANCH=${2:-main}    # 默认值
    echo "部署 $ENV 分支 $BRANCH"
    # 部署逻辑...
}

deploy "production" "release"
deploy "staging"

# 返回值：echo 输出 + $() 捕获
get_version() {
    echo "1.0.0"
}
VERSION=$(get_version)
```

## 6. 实用脚本模板

```bash
#!/bin/bash
set -euo pipefail              # 出错即退出 + 未定义变量报错 + 管道错误传播

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/data.tar.gz" /var/www/data

# 只保留最近 7 天
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR"
```

`set -euo pipefail` 三行是生产脚本标配：出错即退出 + 未定义变量报错 + 管道中间错误传播。

## 延伸阅读

- 站内相关：《Linux 入门与文件系统》《Linux 常用命令与文本处理》《Linux 服务器运维清单》
- [Google Shell 风格指南](https://google.github.io/styleguide/shellguide.html)
