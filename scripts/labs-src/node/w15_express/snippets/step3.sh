# 新增（201）→ 查全（200）→ 改状态（200）→ 删除（204）
curl -i -X POST localhost:3000/todos -H "Content-Type: application/json" -d '{"text":"写周报"}'
curl -s localhost:3000/todos
curl -i -X PATCH localhost:3000/todos/1 -H "Content-Type: application/json" -d '{"done":true}'
curl -i -X DELETE localhost:3000/todos/1

# 改一个不存在的 id → 404
curl -i -X PATCH localhost:3000/todos/999 -H "Content-Type: application/json" -d '{"done":true}'
