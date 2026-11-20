---
title: TLS 握手与证书体系：HTTPS 的安全基石
category: 计算机网络
order: 10
tags: [TLS, HTTPS, 证书, 密码学]
summary: TLS 1.2 与 1.3 的握手全程、证书链验证、前向保密——"为什么 HTTPS 安全"的完整答案。
---

## 1. HTTPS = HTTP over TLS

TLS（传输层安全）为 TCP 连接提供三重保证：

| 保证 | 含义 | 靠什么 |
| --- | --- | --- |
| 机密性 | 中间人看不懂内容 | 对称加密（会话密钥） |
| 完整性 | 内容不可篡改 | MAC/AEAD 认证标签 |
| 身份认证 | 你连的真是目标服务器 | 数字证书（证书链） |

**混合加密的设计理由**：非对称加密（RSA/ECDHE）解决"如何在不安全信道协商密钥"，但性能差；对称加密（AES）快但密钥怎么安全传输是死结。TLS 用非对称完成密钥交换，之后全程对称——各取所长。

## 2. TLS 1.2 握手全程（RSA 密钥交换，教学版）

```
ClientHello → 支持的 TLS 版本、密码套件、客户端随机数
ServerHello ← 选定套件、服务端随机数、证书（含公钥）
[客户端] 验证证书 → 生成 pre-master → 用证书公钥加密发送
双方: master_secret = PRF(pre-master, 两个随机数) → 派生会话密钥
ChangeCipherSpec → Finished（加密验证）→ 应用数据
```

**RSA 密钥交换的致命缺陷**：pre-master 用服务端 RSA 公钥加密——**私钥一旦泄漏，历史抓包全部可解**（无前向保密）。这也是 TLS 1.3 强制 ECDHE 的原因。

## 3. ECDHE 与前向保密（PFS）

ECDHE（椭圆曲线 Diffie-Hellman 临时密钥）的握手：

```
双方各自生成临时密钥对，交换公钥
共享密钥 = 自己私钥 × 对方公钥（椭圆曲线运算）
```

**数学保证**：窃听者拿到双方公钥也推不出共享密钥（椭圆曲线离散对数难题）；且临时密钥用完即弃——**服务端私钥泄漏也无法解密历史流量**（前向保密）。

TLS 1.3 相比 1.2 的改进：
- **握手从 2-RTT 减到 1-RTT**（甚至 0-RTT 恢复）——首包延迟减半
- **废弃不安全套件**：RSA 密钥交换、CBC 模式、RC4/3DES 全部移除
- 密码套件瘦身：仅 AEAD（AES-GCM / ChaCha20-Poly1305）

## 4. 证书链：从根 CA 到你的域名

证书是一个签名的声明：**"CA 担保：这个公钥属于这个域名"**。浏览器验证的是**证书链**：

```
根 CA（预置在操作系统/浏览器信任库，自签名）
  ↑ 签发
中间 CA（如 Let's Encrypt R3）
  ↑ 签发
终端证书（CN/SAN = your.domain.com）
```

验证要点：
1. **链完整性**：每级由上一级签名，最终锚定在受信任根
2. **域名匹配**：SAN（Subject Alternative Name）含目标域名（通配符 *.example.com 也行）
3. **有效期**：未过期（Let's Encrypt 90 天，自动续期常态化）
4. **吊销状态**：CRL / OCSP（在线查询是否被吊销）——OCSP 装订（stapling）由服务器代查，避免浏览器直连 OCSP 的隐私与延迟问题

**私钥泄漏的处理**：立即吊销 + 换发证书——但注意吊销机制本身不可靠（浏览器对 OCSP 失败常静默放行），重要系统要配合密钥轮换。

## 5. 证书链断裂：最常见的 HTTPS 报错

**现象**：浏览器报 `ERR_CERT_AUTHORITY_INVALID`，但证书看起来正常。
**原因**：服务器只配了终端证书，**没配中间证书**——桌面浏览器可能能补链（AIA fetching），但 curl、App、安卓 Webview 会直接失败。
**修法**：`fullchain.pem`（终端+中间）而非 `cert.pem`。诊断：

```bash
openssl s_client -connect your.domain:443 -servername your.domain
# 看 Certificate chain：0（终端）→ 1（中间）→ 根（自签）
```

其他证书错误：`ERR_CERT_DATE_INVALID`（过期）、`ERR_CERT_COMMON_NAME_INVALID`（域名不匹配）、自签名证书（内网服务用自签需要把根证书装进信任库）。

## 6. TLS 层的攻击与防御速览

| 攻击 | 原理 | 防御 |
| --- | --- | --- |
| 中间人（MITM） | 伪造证书劫持 | 证书链验证 + HSTS |
| 协议降级 | 诱导协商到弱版本/弱套件 | 禁用旧版本；TLS 1.3 内置降级保护 |
| 重 negotiation 攻击 | 重协商插入请求 | 禁用客户端重协商 |
| BEAST/Lucky13 | CBC 模式弱点 | AEAD 套件（GCM/ChaCha20） |
| CRIME/BREACH | 压缩侧信道 | 禁 TLS 压缩；谨慎压缩响应体 |

**HSTS**（`Strict-Transport-Security: max-age=31536000; includeSubDomains`）：告诉浏览器"未来一年只许用 HTTPS 访问本域"——防降级与域名拼写劫持。可加入 HSTS preload 列表（内置进浏览器）。

## 7. 服务器配置实战（Nginx 模板）

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate     /etc/letsencrypt/live/x/fullchain.pem;   # 含中间证书
    ssl_certificate_key /etc/letsencrypt/live/x/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...;
    ssl_prefer_server_ciphers off;          # TLS1.3 由客户端优先
    ssl_session_cache   shared:SSL:10m;     # 会话复用（省一次握手）
    ssl_session_timeout 1d;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

证书自动续期：Let's Encrypt + certbot 定时任务（见站内《Linux 服务器运维清单》）。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 部分客户端证书报错 | 缺中间证书 | 配 fullchain；openssl s_client 验证链 |
| HTTPS 站点仍被降级 HTTP | 无 HSTS / 有 http 链接（混合内容） | HSTS + 全站资源改 https |
| 握手慢一个 RTT | TLS 1.2 两次握手 | 升级 TLS 1.3 + 会话复用 |
| OCSP 请求慢/隐私泄漏 | 浏览器在线查吊销 | 服务器 OCSP stapling |
| 内网自签证书告警 | 根证书不在信任库 | 分发自签根 CA 到信任库 |
| 证书续期后未生效 | 未 reload 服务 | certbot renew 钩子里 reload nginx |

## 9. 自测五题

1. RSA 密钥交换为什么没有前向保密？ECDHE 如何解决？
2. 证书链验证的四个要点？
3. TLS 1.3 握手为什么能减到 1-RTT？
4. OCSP stapling 解决浏览器的哪两个问题？
5. HSTS 防御的具体攻击场景是什么？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《HTTP/HTTPS 协议详解》（HTTPS 在 HTTP 语义中的位置）、《TCP 深入：三次握手、四次挥手与状态机》（TLS 跑在 TCP 之上）、《Nginx 深入：反向代理与负载均衡》（证书配置实战）
- 站内参考资料：《MDN HTTP 概述》（本地镜像 /post/ref-http-mdn）
- 《HTTPS 权威指南》（系统化覆盖部署与调优）
