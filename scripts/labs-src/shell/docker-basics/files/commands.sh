#!/usr/bin/env bash
# Docker 容器的完整生命周期：运行 → 查看 → 进入 → 挂载 → 清理
# 用的是本地的 nginx:alpine 镜像（一个自带 Nginx 的小型 Linux）

# 如果之前起过同名容器，先删掉，保证这份脚本可以反复运行（这一行已经写好）
docker rm -f web 2>/dev/null

# Step 1：启动一个容器（已写好一部分，还差端口映射）
#   -d        后台运行
#   --name    给容器起个名字，后面都用名字操作它
docker run -d --name web nginx:alpine

# TODO（Step 1）：容器有自己独立的网络，不映射端口的话外面访问不到
#   在上面这条命令里加上 -p 8080:80（宿主机端口:容器端口），再补上两条验证：
#   docker ps                     列出正在运行的容器
#   curl -i localhost:8080/       应拿到 Nginx 的欢迎页

# TODO（Step 2）：观察容器内部
#   docker exec web cat /etc/os-release          在容器里执行一条命令：它是什么系统
#   docker exec web ls /usr/share/nginx/html      容器里的网页根目录有哪些文件
#   docker logs web                              查看容器主进程的日志，应能看到刚才 curl 的那条请求

# TODO（Step 3）：挂载宿主机目录，然后清理
#   docker rm -f web        端口和挂载在创建时就定死了，要带 -v 只能删掉重建
#   docker run -d --name web -p 8080:80 -v "$HOME/html:/usr/share/nginx/html:ro" nginx:alpine
#   curl -s localhost:8080/  首页应变成 ~/html/index.html 的内容
#   docker stop web && docker rm web       停止并删除容器
#   docker ps -a                          确认已经清理干净
