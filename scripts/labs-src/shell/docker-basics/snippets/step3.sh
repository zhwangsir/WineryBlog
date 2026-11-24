docker rm -f web      # 端口和挂载在创建时就定死了，要带 -v 只能删掉重建
docker run -d --name web -p 8080:80 -v "$HOME/html:/usr/share/nginx/html:ro" nginx:alpine
curl -s localhost:8080/
# <h1>挂载成功：我来自宿主机的 ~/html</h1>

# 清理
docker stop web && docker rm web
docker ps -a         # 只剩表头
