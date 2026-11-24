curl -i localhost:3000/                # 200：text/plain，响应体是「欢迎来到 WineryLab」
curl -i localhost:3000/api/time        # 200：application/json，响应体含 now 字段
curl -i localhost:3000/nope            # 404：含 error 字段的 JSON
curl -i -X POST localhost:3000/        # 404：路由 = 方法 + 路径，POST / 没有定义
