---
title: JWT 与 OAuth2：现代认证鉴权
category: 后端开发
order: 6
tags: [JWT, OAuth2, 认证, 安全]
summary: Session vs Token、JWT 结构与陷阱、OAuth2 授权码流程——登录系统的完整原理与实现。
---

## 1. 认证 vs 授权

- **认证（Authentication）**：你是谁 → 登录
- **授权（Authorization）**：你能干什么 → 权限

所有登录系统都在回答这两个问题。HTTP 无状态，服务器每次请求都要重新确认"你是谁"，于是有两种记忆方案。

## 2. Session vs Token：两条路线

| | Session | Token（JWT） |
| --- | --- | --- |
| 状态存哪 | 服务端（内存/Redis） | 客户端 |
| 识别方式 | Cookie 里的 SessionID | Header 里的 JWT |
| 水平扩展 | 需要共享存储（粘性会话/Redis） | 无状态，天然分布式 |
| 注销 | 删服务端记录即可 | 难（token 发出去就收不回） |
| 适用 | 传统单体网站 | 微服务、移动端、跨域 |

判断标准：**需要服务端即时吊销能力选 Session；无状态扩容选 JWT**。两者可以混用（JWT + Redis 黑名单）。

## 3. JWT 结构与签名原理

JWT 是三段 Base64URL，用 `.` 连接：

```
eyJhbGciOiJIUzI1NiJ9   .   eyJ1c2VyIjoiYm9iIn0   .   SflKxwRJSme...
      Header                    Payload                Signature
```

- Header：算法声明 `{"alg":"HS256"}`
- Payload：声明（claims），如 `{"sub":"user-1","role":"admin","exp":1735689600}`
- Signature：`HMACSHA256(base64(header) + "." + base64(payload), secret)`

**关键认知：Payload 只是 Base64 编码，不是加密**——任何人都能解码看到内容。绝不能放密码、手机号等敏感信息。签名只保证"没被篡改"，不保证"保密"。

## 4. 手写一个 JWT 流程（Node）

```javascript
import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET;   // 足够长且保密！

// 登录：验证密码后签发
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!checkPassword(username, password)) return res.status(401).json({ error: '密码错误' });

  const token = jwt.sign(
    { sub: username, role: 'user' },
    SECRET,
    { expiresIn: '2h' }                  // 必须设过期
  );
  res.json({ token });
});

// 鉴权中间件：验证签名与有效期
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, SECRET);   // 验签失败/过期都会 throw
    next();
  } catch {
    res.status(401).json({ error: 'token 无效或已过期' });
  }
}

app.get('/me', auth, (req, res) => res.json({ user: req.user }));
```

签名校验是**本地计算**（不查库），这就是 JWT 快的原因——也解释了为什么没法主动吊销。

## 5. JWT 三大陷阱

1. **alg: none 攻击**——早期库接受不签名的 token。对策：验证时**白名单算法**：`jwt.verify(token, SECRET, { algorithms: ['HS256'] })`
2. **弱密钥**——`secret = "123456"` 等于裸奔。用 `openssl rand -base64 48` 生成，进环境变量不进 git
3. **无法吊销**——被偷的 token 在过期前一直有效。对策组合：
   - 短有效期（15 分钟）+ **Refresh Token**（长有效期，存服务端可吊销，换发新 access token）
   - 敏感操作（改密码）二次验证密码

## 6. OAuth2：让"别人"帮你登录

OAuth2 是**授权**框架（顺带解决登录）。四大角色：资源拥有者（用户）、客户端（你的网站）、授权服务器（Google）、资源服务器（Google API）。

**授权码流程（最安全，必背）**：

```
1. 用户点"用 GitHub 登录" → 浏览器跳转 GitHub 授权页
   https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=user&state=xyz
2. 用户同意 → GitHub 重定向回你的网站：?code=abc&state=xyz
3. 你的后端拿 code + client_secret 换 access token（服务器对服务器，用户看不到）
4. 用 access token 调 GitHub API 拿用户信息
5. 查/建本地账号 → 发你自己的 JWT → 登录完成
```

`state` 随机串防 CSRF（回调时必须校验是否是自己发出的）；`code` 一次性、10 分钟过期；`client_secret` 只存在后端——这就是为什么要后端换 token 而不是前端。

## 7. 生产架构模板

```
登录：账号密码 / OAuth2 → 签发 access(15min) + refresh(7d, 服务端可吊销)
请求：access 放 Authorization: Bearer，前端 axios 拦截器自动携带
过期：401 → 用 refresh 静默换新 → 重试原请求 → refresh 也失效才踢回登录页
```

前端注意：access token 放内存而非 localStorage（防 XSS 偷取）；refresh token 放 httpOnly Cookie（防 JS 读取）。

## 延伸阅读

- 站内相关：《Spring Boot 快速上手：从 Hello 到 CRUD》《Node.js 核心机制：事件循环、模块体系与工程实践》《Web 安全实战：XSS 与 SQL 注入基础》
- 《OAuth2 in Action》
- jwt.io 官网（解码器 + 调试工具）
