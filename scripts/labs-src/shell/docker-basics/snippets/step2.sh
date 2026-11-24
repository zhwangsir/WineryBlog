docker exec web cat /etc/os-release          # 容器里的系统：Alpine Linux
docker exec web ls /usr/share/nginx/html     # 容器里的网页根目录：50x.html  index.html
docker logs web                              # Nginx 的启动信息 + 刚才 curl 的访问记录
