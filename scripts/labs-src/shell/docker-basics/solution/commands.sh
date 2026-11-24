#!/usr/bin/env bash
# Docker 容器的完整生命周期：运行 → 查看 → 进入 → 挂载 → 清理
# 用的是本地的 nginx:alpine 镜像（一个自带 Nginx 的小型 Linux）

# 如果之前起过同名容器，先删掉，保证这份脚本可以反复运行
docker rm -f web 2>/dev/null

# Step 1：启动一个容器
#   -d        后台运行
#   --name    给容器起个名字，后面都用名字操作它
#   -p        端口映射：宿主机的 8080 → 容器里的 80
docker run -d --name web -p 8080:80 nginx:alpine
docker ps                                  # STATUS 为 Up，PORTS 为 0.0.0.0:8080->80/tcp
curl -i localhost:8080/                    # 200，Nginx 欢迎页

# Step 2：观察容器内部
docker exec web cat /etc/os-release        # Alpine Linux
docker exec web ls /usr/share/nginx/html   # 50x.html  index.html
docker logs web                            # 启动信息 + 上面 curl 的访问记录

# Step 3：挂载——端口和挂载在创建时就定死了，要带 -v 只能删掉重建
#   -v 宿主机目录:容器目录:ro   把 ~/html 当作容器里的网页根目录（容器内只读）
docker rm -f web
docker run -d --name web -p 8080:80 -v "$HOME/html:/usr/share/nginx/html:ro" nginx:alpine
curl -s localhost:8080/                    # <h1>挂载成功：我来自宿主机的 ~/html</h1>

# 清理：先停止，再删除
docker stop web
docker rm web
docker ps -a                               # 只剩表头
