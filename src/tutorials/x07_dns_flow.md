---
title: DNS 与一次完整的网页访问
category: 计算机网络/基础
order: 2
tags: [DNS, HTTP, 网络, 排障]
summary: DNS 解析全过程、hosts 文件、缓存层级与排障命令。
---

## 1. DNS 解析完整链路

```
浏览器输入 baidu.com
  ↓
1. 浏览器 DNS 缓存
2. 系统 hosts 文件 (/etc/hosts 或 C:\Windows\System32\drivers\etc\hosts)
3. 本地 DNS 服务器（运营商或 8.8.8.8）
4. 根 DNS → .com 顶级 → baidu.com 权威 DNS
  ↓
返回 IP → 浏览器建立 TCP 连接
```

## 2. DNS 记录类型

| 类型 | 用途 |
| --- | --- |
| A | 域名 → IPv4 |
| AAAA | 域名 → IPv6 |
| CNAME | 域名 → 另一个域名（如 CDN） |
| MX | 邮件服务器 |
| TXT | 文本（验证/SPF） |
| NS | 权威 DNS 服务器 |

## 3. hosts 文件：本地 DNS 覆盖

```text
# Linux: /etc/hosts
# Windows: C:\Windows\System32\drivers\etc\hosts
192.168.71.82  spark01
192.168.71.84  spark02
192.168.71.121 winery
```

集群节点互通的标准做法——所有节点保持同一份 hosts。Hadoop/ES 对 hostname 解析极其敏感。

## 4. DNS 排障命令

```bash
nslookup baidu.com              # 查询解析
nslookup baidu.com 8.8.8.8     # 指定 DNS 服务器
dig baidu.com ANY               # 全部记录
ipconfig /flushdns              # Windows 清缓存
sudo systemd-resolve --flush-caches   # Linux 清缓存
```

## 5. 一次完整的网页访问（全流程串联）

```
1. URL 解析（协议/域名/路径）
2. DNS 解析 → 获取 IP
3. TCP 三次握手（SYN → SYN+ACK → ACK）
4. TLS 握手（HTTPS）
5. 发送 HTTP 请求
6. 服务器处理 → 返回 HTTP 响应
7. 浏览器解析渲染
8. 关闭/复用 TCP 连接
```

排障对应每一步：DNS 不通 → 查 hosts/DNS；TCP 不通 → 查防火墙/路由；TLS 失败 → 查证书；HTTP 4xx/5xx → 查应用。

## 延伸阅读

- 站内相关：《网络基础：IP 地址与访问流程》《HTTP/HTTPS 协议详解》《NAT 网络地址转换》《主机名与 hosts 解析配置》
