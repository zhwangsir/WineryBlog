---
title: gRPC 与微服务通信
category: 后端开发
order: 8
tags: [gRPC, Protobuf, 微服务, RPC]
summary: Protobuf 契约、四种流模式、与 REST 的取舍——服务间通信的高性能方案。
---

## 1. 为什么服务间通信不用 REST

微服务内部调用用 HTTP+JSON 的问题：

- **慢**：JSON 文本序列化/解析开销大（`{"age":20}` vs 二进制的几个字节）
- **松**：接口没有契约，改字段名下游跑起来才发现
- **弱**：只有请求-响应，流式推送要另想办法

**gRPC** = HTTP/2 + Protobuf + 生成代码。三大件：

1. **Protobuf**：二进制序列化，体积小 JSON 一半以上、解析快 5-10 倍
2. **强类型契约**：`.proto` 文件定义接口，两端代码生成，改协议编译期就报错
3. **HTTP/2 多路复用**：一条连接并发多请求，还支持四种流模式

## 2. Protobuf：先写契约

```protobuf
// user.proto —— 接口的唯一事实来源
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);           // 一元调用
  rpc WatchOrders (WatchReq) returns (stream Order);     // 服务端流
}

message GetUserRequest {
  int64 user_id = 1;          // 字段编号是二进制格式的 key，绝不许改！
}

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
  repeated string tags = 4;   // 数组
  map<string, string> attrs = 5;
}
```

规则三条：
1. **字段编号就是 wire format 的键**——只许新增，不许改号/复用（reserved 标记废弃）
2. 字段类型演进用新增字段 + 旧字段 deprecated，做到前后兼容
3. proto 文件进 git、走 code review——**它就是微服务的 API 合同**

生成代码（两端语言随意）：

```bash
protoc --go_out=. --go-grpc_out=. user.proto
# Python: python -m grpc_tools.protoc --python_out=. --grpc_python_out=. user.proto
```

## 3. 服务端与客户端（Go）

```go
// 服务端
type server struct{ pb.UnimplementedUserServiceServer }

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    if req.UserId <= 0 {
        return nil, status.Errorf(codes.InvalidArgument, "user_id 必须 > 0")
    }
    return &pb.User{Id: req.UserId, Name: "bob", Tags: []string{"vip"}}, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    pb.RegisterUserServiceServer(s, &server{})
    s.Serve(lis)
}
```

```go
// 客户端
conn, _ := grpc.NewClient("localhost:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials()))
client := pb.NewUserServiceClient(conn)

u, err := client.GetUser(ctx, &pb.GetUserRequest{UserId: 42})
// err 是结构化的 status.Error：codes.NotFound / DeadlineExceeded …
```

## 4. 四种通信模式

| 模式 | 签名 | 场景 |
| --- | --- | --- |
| Unary | req → resp | 常规 CRUD |
| Server streaming | req → stream resp | 下发行情/日志tail |
| Client streaming | stream req → resp | 批量上报/文件分片上传 |
| Bidirectional | stream ↔ stream | 聊天、实时协同 |

服务端流示例（推送订单状态）：

```go
func (s *server) WatchOrders(req *pb.WatchReq, stream pb.UserService_WatchOrdersServer) error {
    for {                                   // 每 2 秒推一次
        order := fetchLatest(req.UserId)
        if err := stream.Send(order); err != nil {
            return err                      // 客户端断开
        }
        time.Sleep(2 * time.Second)
    }
}
```

## 5. 错误、超时与拦截器

```go
// 服务端抛结构化错误
status.Error(codes.NotFound, "user not found")

// 客户端必须设超时（生产红线：无超时的调用迟早拖死整个链路）
ctx, cancel := context.WithTimeout(context.Background(), 800*time.Millisecond)
defer cancel()
client.GetUser(ctx, req)
// 判断错误类型
if st, ok := status.FromError(err); ok && st.Code() == codes.DeadlineExceeded { ... }
```

**拦截器**（= middleware）：统一做鉴权、日志、重试、metrics——`grpc.UnaryInterceptor(myAuth)`。元数据传递用 metadata（类似 HTTP header）：`metadata.AppendToOutgoingContext(ctx, "x-user-id", "42")`。

## 6. gRPC vs REST：怎么选

| 维度 | gRPC | REST/JSON |
| --- | --- | --- |
| 性能 | 二进制 + HTTP/2，高 5-10 倍 | 文本，够用 |
| 契约 | 强类型 proto，编译期检查 | OpenAPI（弱约束） |
| 浏览器 | 原生不支持（要 grpc-web 代理） | 原生支持 |
| 可读性 | 二进制不可直接读 | 人眼可读 |
| 生态 | 内部服务间 | 对外 API/第三方 |

结论：**对外 API 用 REST（通用可调试），内部微服务之间用 gRPC（性能与契约）**——这就是业界的"外部 REST、内部 gRPC"双层结构。

## 7. 生产清单

- [ ] proto 独立仓库/目录，版本化管理
- [ ] 全链路超时与 deadline 传递（上游超时自动传播给下游）
- [ ] 拦截器统一：认证（JWT metadata）、日志、重试（只重试幂等调用！）
- [ ] 健康检查协议（grpc_health_probe）给 K8s 探针
- [ ] 连接复用：一个服务对另一个服务只建一条 channel，channel 线程安全

## 延伸阅读

- 站内相关：《消息队列入门：RabbitMQ 与 Kafka》《JWT 与 OAuth2：现代认证鉴权》《Spring Boot 快速上手：从 Hello 到 CRUD》
- 《gRPC: Up and Running》
- protobuf.dev 官方语言指南（风格规范 proto3-style）
