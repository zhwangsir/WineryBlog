# -d 后台运行    --name web 起名字    -p 宿主机端口:容器端口
docker run -d --name web -p 8080:80 nginx:alpine

docker ps                      # STATUS 为 Up，PORTS 为 0.0.0.0:8080->80/tcp
curl -i localhost:8080/        # HTTP/1.1 200 OK，响应体里有 Welcome to nginx!
