---
title: HTTP 概述 - HTTP
category: 参考资料
source: https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview
summary: 本地镜像：HTTP 概述 - HTTP（原文 developer.mozilla.org）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview

# HTTP 概述

**HTTP** 是一种用作获取诸如 HTML 文档这类资源的协议。它是 Web 上进行任何数据交换的基础，同时，也是一种客户端—服务器（client-server）协议，也就是说，请求是由接受方——通常是 Web 浏览器——发起的。完整网页文档通常由文本、布局描述、图片、视频、脚本等资源构成。

（图：Image 4: 由来自不同服务器的多个资源组成的单个 Web 文档。）

客户端与服务端之间通过交换一个个独立的消息（而非数据流）进行通信。由客户端发出的消息被称作 _请求_（request），由服务端发出的应答消息被称作 _响应_（response）。

（图：Image 5: HTTP 作为应用层协议，处于 TCP（传输层）和 IP（网络层）之上，表示层之下。）

20 世纪 90 年代，HTTP 作为一套可扩展的协议被设计出来，并随时间不断演进。HTTP 是一种应用层的协议，通过 TCP 或 TLS（一种加密过的 TCP 连接）来发送，当然，理论上来说可以借助任何可靠的传输协议。受益于 HTTP 的可扩展性，时至今日，它不仅可以用来获取超文本文档，还可用来获取图片、视频或者向服务端发送信息，比如填写好的 HTML 表单。HTTP 还可以用来获取文档的部分内容，以便按需更新 Web 页面。

## 本文内容

*   基于 HTTP 的系统的组成
*   HTTP 的基本性质
*   HTTP 能控制什么
*   HTTP 流
*   HTTP 报文
*   基于 HTTP 的 API
*   总结

## 基于 HTTP 的系统的组成

HTTP 是一个客户端—服务器协议：请求由一个实体，即用户代理（user agent），或是一个可以代表它的代理方（proxy）发出。大多数情况下，这个用户代理都是一个 Web 浏览器，不过它也可能是任何东西，比如一个爬取网页来充实、维护搜索引擎索引的机器爬虫。

每个请求都会被发送到一个服务器，它会处理这个请求并提供一个称作 _响应_ 的回复。在客户端与服务器之间，还有许许多多的被称为代理的实体，履行不同的作用，例如充当网关或缓存。

（图：Image 6: 来自客户端的 HTTP 请求通过多个代理转发到服务器，服务器的响应也沿着同样的路径返回到客户端。）

实际上，在浏览器和处理其请求的服务器之间，还有路由器、调制解调器等等许多计算机。归功于 Web 的分层设计，这些机器都隐藏在网络层和传输层内。而 HTTP 位于这些机器之上的应用层。虽然下面的层级在诊断网络问题时很重要，但在描述 HTTP 的设计时，它们大多是不相干的。

### 客户端：用户代理

_用户代理_ 是任何能够代表用户行为的工具。这类工具以浏览器为主，不过，它也可能是工程师和 Web 开发人员调试应用所使用的那些程序。

浏览器**总是**首先发起请求的那个实体，永远不会是服务端（不过，后来已经加入了一些机制，能够模拟出由服务端发起的消息）。

为了展现一个网页，浏览器需要发送最初的请求来获取描述这个页面的 HTML 文档。接着，解析文档，并发送数个其他请求，相应地获取可执行脚本、展示用的布局信息（CSS）以及其他页面内的子资源（一般是图片和视频等）。然后，Web 浏览器将这些资源整合到一起，展现出一个完整的文档，即网页。在之后的阶段，浏览器中执行的脚本可以获取更多资源，并且浏览器会相应地更新网页。

网页是超文本文档。这意味着有一部分展示的内容会是链接——可以通过激活（通常是点击鼠标）来获取一个新的网页——用户可以通过这些链接指示用户代理并进行 Web 浏览。浏览器会将收到的指示转换成 HTTP 请求，并进一步解析 HTTP 响应，向用户提供清晰的响应。

### Web 服务器

在上述通信过程的另一侧是服务器，它负责 _提供_ 客户端所请求的文档。服务器可以表现为仅有一台机器，但实际上，它可以是共享负载的一组服务器集群（负载均衡）或是其他类型的软件（如缓存、数据库服务、电商服务等），按需完整或部分地生成文档。

服务器不一定只有一台机器，也可以在同一台机器上托管多个服务器软件实例。利用 HTTP/1.1 和 `Host` 标头，它们甚至可以共用同一个 IP 地址。

### 代理

在 Web 浏览器和服务器之间，有许多计算机和设备参与传递了 HTTP 消息。依靠 Web 技术栈的层次化的结构，传递过程中的多数操作都位于传输层、网络层或物理层，它们对于 HTTP 应用层而言就是透明的，并默默地对网络性能产生着重要影响。还有一部分实体在应用层参与消息传递，一般被称为**代理**（Proxy）。代理可以是透明的，即转发它们收到的请求并不做任何修改，也可以表现得不透明，将它传递给服务端之前使用一些手段修改这个请求。代理可以发挥很多种作用：

*   缓存（可以是公开的也可以是私有的，如浏览器的缓存）
*   过滤（如反病毒扫描、家长控制...）
*   负载均衡（让多个服务器服务不同的请求）
*   认证（控制对不同资源的访问）
*   日志（使得代理可以存储历史信息）

## HTTP 的基本性质

### HTTP 是简约的

大体上看，HTTP 被设计得简单且易读，尽管在 HTTP/2 中，HTTP 消息被封装进帧（frame）这点引入了额外的复杂度。HTTP 报文能够被人读懂并理解，向开发者提供了更简单的测试方式，也对初学者降低了门槛。

### HTTP 是可扩展的

在 HTTP/1.0 中引入的 HTTP 标头让该协议易于扩展和实验。只要服务器客户端之间对新标头的语义经过简单协商，新功能就可以被加入进来。

### HTTP 无状态，但并非无会话

HTTP 是无状态的：在同一个连接中，两个执行成功的请求之间是没有关系的。这就带来了一个问题，用户没有办法在同一个网站中进行连贯的交互，比如在电商网站中使用购物车功能。尽管 HTTP 根本上来说是无状态的，但借助 HTTP Cookie 就可使用有状态的会话。利用标头的扩展性，HTTP Cookie 被加进了协议工作流程，每个请求之间就能够创建会话，让每个请求都能共享相同的上下文信息或相同的状态。

### HTTP 和连接

连接是由传输层来控制的，因此从根本上说不属于 HTTP 的范畴。HTTP 并不需要底层的传输协议是面向连接的，仅仅需要它是 _可靠的_，或不会丢失消息（至少，某个情况下告知错误）。在互联网两个最常用的传输协议中，TCP 是可靠的而 UDP 不是。HTTP 因此而依靠于 TCP 的标准，即面向连接的。

在客户端与服务器能够传递请求、响应之前，这两者间必须建立 TCP 连接，这个过程需要多次往返交互。HTTP/1.0 默认为每一对 HTTP 请求/响应都打开一个单独的 TCP 连接。当需要接连发起多个请求时，工作效率相比于它们之间共享同一个 TCP 连接要低。

为了减轻这个缺陷，HTTP/1.1 引入了 _流水线_（已被证明难以实现）和 _持久化连接_：可以通过 `Connection` 标头来部分控制底层的 TCP 连接。HTTP/2 则更进一步，通过在一个连接中复合多个消息，让这个连接始终活跃并更加高效。

为了设计一种更匹配 HTTP 的传输协议，各种实验正在进行中。例如，Google 正在测试一种基于 UDP 构建，更可靠、高效的传输协议——QUIC。

## HTTP 能控制什么

多年以来，良好的扩展性使得 HTTP 涉及到更多的 Web 功能与控制权。在 HTTP 诞生的早期，缓存和认证就可以由这个协议来处理了。而直到 2010 年，放行 _同源限制_ 的能力才加入到协议中。

以下是可以被 HTTP 控制的常见特性。

*   _缓存_：文档如何被缓存可以通过 HTTP 来控制。服务端能指示代理和客户端缓存哪些内容以及缓存多长时间，客户端能够指示中间的缓存代理来忽略已存储的文档。
*   _开放同源限制_：为了阻止网络窥听和其它侵犯隐私的问题，Web 浏览器强制在不同网站之间做了严格分割。只有来自于**相同来源**（same origin）的网页才能够获取一个网页的全部信息。这种限制有时对服务器是一种负担，服务器的 HTTP 标头可以减弱此类严格分离，使得一个网页可以是由源自不同地址的信息拼接而成。某些情况下，放开这些限制还有安全相关的考虑。
*   _认证_：一些页面可能会被保护起来，仅让特定的用户进行访问。基本的认证功能可以直接由 HTTP 提供，既可以使用 `WWW-Authenticate` 或其他类似的标头，也可以用 HTTP cookie 来设置一个特定的会话。
*   _代理服务器和隧道_：服务器或客户端常常是处于内网的，对其他计算机隐藏真实 IP 地址。因此 HTTP 请求就要通过代理服务器越过这个网络屏障。并非所有的代理都是 HTTP 代理，例如，SOCKS 协议就运作在更底层。其他的协议，比如 ftp，也能够被这些代理处理。
*   _会话_：使用 HTTP Cookie 可以利用服务端的状态将不同请求联系在一起。这就创建了会话，尽管 HTTP 本身是无状态协议。这不仅仅对电商平台购物车很有用，也让任何网站都能够允许用户自由定制内容了。

## HTTP 流

当客户端想要和服务器——不管是最终的服务器还是中间的代理——进行信息交互时，过程表现为下面几步：

1.   打开一个 TCP 连接：TCP 连接被用来发送一条或多条请求，以及接受响应消息。客户端可能打开一条新的连接，或重用一个已经存在的连接，或者也可能开几个新的与服务器的 TCP 连接。

2.   发送一个 HTTP 报文：HTTP 报文（在 HTTP/2 之前）是人类可读的。在 HTTP/2 中，这些简单的消息被封装在了帧中，这使得报文不能被直接读取，但是原理仍是相同的。例如：

3.   读取服务端返回的报文信息：

4.   关闭连接或者为后续请求重用连接。

当启用 HTTP 流水线时，后续请求都可以直接发送，而不用等待第一个响应被全部接收。然而 HTTP 流水线已被证明很难在现有的网络中实现，因为现有网络中有老旧的软件与现代版本的软件同时存在。因此，HTTP 流水线已在 HTTP/2 中被更健壮、使用帧的多路复用请求所取代。

## HTTP 报文

HTTP/1.1 以及更早的 HTTP 协议报文都是语义可读的。在 HTTP/2 中，这些报文被嵌入到了一个新的二进制结构，帧。帧允许实现很多优化，比如报文标头的压缩以及多路复用。即使只有原始 HTTP 报文的一部分以 HTTP/2 发送出来，每条报文的语义依旧不变，客户端会重组原始 HTTP/1.1 请求。因此用 HTTP/1.1 格式来理解 HTTP/2 报文仍旧有效。

有两种 HTTP 报文的类型，请求与响应，每种都有其特定的格式。

### 请求

HTTP 请求的一个例子：

（图：Image 7: 带标头的 HTTP GET 请求概览）

请求由以下元素组成：

*   HTTP 方法，通常是由一个动词，像 `GET`、`POST` 等，或者一个名词，像 `OPTIONS`、`HEAD` 等，来定义客户端执行的动作。典型场景有：客户端意图获取某个资源（使用 `GET`）；发送 HTML 表单的参数值（使用 `POST`）；以及其他情况下需要的那些其他操作。
*   要获取的那个资源的路径——去除了当前上下文中显而易见的信息之后的 URL，比如说，它不包括协议（`http://`）、域名（这里是 `developer.mozilla.org`），或是 TCP 的端口（这里是 `80`）。
*   HTTP 协议版本号。
*   为服务端表达其他信息的可选标头。
*   请求体（body），类似于响应中的请求体，一些像 `POST` 这样的方法，请求体内包含需要了发送的资源。

### 响应

HTTP 响应的一个例子：

（图：Image 8: 对 GET 请求的“200 OK”HTTP 响应（包括响应标头）的概览。）

响应报文包含了下面的元素：

*   HTTP 协议版本号。
*   状态码，来指明对应请求已成功执行与否，以及不成功时相应的原因。
*   状态信息，这个信息是一个不权威、简短的状态码描述。
*   HTTP 标头，与请求标头类似。
*   可选项，一个包含了被获取资源的主体。

## 基于 HTTP 的 API

Fetch API 是基于 HTTP 的最常用 API，其可用于在 JavaScript 中发起 HTTP 请求。Fetch API 取代了 `XMLHttpRequest` API。

另一种 API，server-sent 事件，是一种单向服务，允许服务端借助作为 HTTP 传输机制向客户端发送事件。使用 `EventSource` 接口，客户端可打开连接并创建事件处理器。客户端浏览器自动将 HTTP 流里到达的消息转换为适当的 `Event` 对象。继而将已知类型的事件，传递给先前注册过的事件处理器，其他未指明类型的事件则传递给 `onmessage` 事件处理器。

## 总结

HTTP 是一种简单、易用、具有可扩展性的协议，其客户端—服务器模式的结构，加上能够增加标头的能力，使得 HTTP 随 Web 中不断扩展的能力一起发展。

虽然增加了一些复杂度——为了提高性能，HTTP/2 将 HTTP 报文嵌入到帧中——但是报文的基本结构自 HTTP/1.0 起仍保持不变。会话流依旧基础，通过 HTTP 网络监视器就可以查看和调试。

## 帮助改进 MDN

了解如何参与贡献
此页面最后更新于 2025年7月4日，由 MDN 贡献者更新。

在 GitHub 上查看此页面 • 报告此内容的问题

1.   HTTP
2.   指南
3.   _HTTP 概述_
4.   HTTP 的发展
5.   典型的 HTTP 会话
6.   HTTP 消息
7.   MIME 类型（IANA 媒体类型）
    1.   常见 MIME 类型列表

8.   HTTP 协议中的数据压缩
9.   HTTP 缓存
10.   HTTP 身份验证
11.   HTTP Cookie
12.   HTTP 的重定向
13.   HTTP 条件请求
14.   HTTP 范围请求
15.   HTTP 客户端提示（Client Hint）
16.   User-Agent reduction
17.   Compression Dictionary Transport
18.   Network Error Logging
19.   内容协商
    1.   Accept 默认值

20.   使用用户代理字段进行浏览器检测
21.   HTTP/1.x 的连接管理
22.   协议升级机制
23.   代理服务器与隧道
    1.   代理自动配置（PAC）文件

24.   
安全与隐私
    1.   HTTP Observatory
    2.   确保你的站点安全
    3.   权限策略
    4.   IFrame credentialless
    5.   Fetch 元数据
    6.   跨源资源共享（CORS）
    7.   
CORS 错误
        1.   `原因：CORS disabled`
        2.   `原因：CORS header 'Access-Control-Allow-Origin' does not match 'xyz'`
        3.   `原因：CORS header 'Access-Control-Allow-Origin' missing`
        4.   `原因：CORS header 'Origin' cannot be added`
        5.   `原因：CORS preflight channel did not succeed`
        6.   `原因：CORS request did not succeed`
        7.   `原因：CORS request external redirect not allowed`
        8.   `原因：CORS request not HTTP`
        9.   `原因：Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'`
        10.   `原因：Did not find method in CORS header 'Access-Control-Allow-Methods'`
        11.   `原因：expected 'true' in CORS header 'Access-Control-Allow-Credentials'`
        12.   `原因：invalid token 'xyz' in CORS header 'Access-Control-Allow-Headers'`
        13.   `原因：invalid token 'xyz' in CORS header 'Access-Control-Allow-Methods'`
        14.   `原因：missing token 'xyz' in CORS header 'Access-Control-Allow-Headers' from CORS preflight channel`
        15.   `原因：Multiple CORS header 'Access-Control-Allow-Origin' not allowed`

    8.   
内容安全策略（CSP）
        1.   Errors and warnings

25.   参考
26.   
HTTP 标头
    1.   `Accept`
    2.   `Accept-CH`
    3.   `Accept-Encoding`
    4.   `Accept-Language`
    5.   `Accept-Patch`
    6.   `Accept-Post`
    7.   `Accept-Query`
    8.   `Accept-Ranges`
    9.   `Access-Control-Allow-Credentials`
    10.   `Access-Control-Allow-Headers`
    11.   `Access-Control-Allow-Methods`
    12.   `Access-Control-Allow-Origin`
    13.   `Access-Control-Expose-Headers`
    14.   `Access-Control-Max-Age`
    15.   `Access-Control-Request-Headers`
    16.   `Access-Control-Request-Method`
    17.   `Activate-Storage-Access`
    18.   `Age`
    19.   `Allow`
    20.   `Alt-Svc`
    21.   `Alt-Used`
    22.   `Attribution-Reporting-Eligible`
    23.   `Attribution-Reporting-Register-Source`
    24.   `Attribution-Reporting-Register-Trigger`
    25.   `Authorization`
    26.   `Available-Dictionary`
    27.   `Cache-Control`
    28.   `Clear-Site-Data`
    29.   `Connection`
    30.   `Content-Digest`
    31.   `Content-Disposition`
    32.   `Content-DPR`
    33.   `Content-Encoding`
    34.   `Content-Language`
    35.   `Content-Length`
    36.   `Content-Location`
    37.   `Content-Range`
    38.   `Content-Security-Policy (CSP)`
    39.   `Content-Security-Policy-Report-Only`
    40.   `Content-Type`
    41.   `Cookie`
    42.   `Critical-CH`
    43.   `Cross-Origin-Embedder-Policy`
    44.   `Cross-Origin-Embedder-Policy-Report-Only`
    45.   `Cross-Origin-Opener-Policy`
    46.   `Cross-Origin-Resource-Policy`
    47.   `Date`
    48.   `Device-Memory`
    49.   `Dictionary-ID`
    50.   `DNT`
    51.   `Downlink`
    52.   `DPR`
    53.   `Early-Data 标头`
    54.   `ECT`
    55.   `ETag`
    56.   `Expect`
    57.   `Expect-CT`
    58.   `Expires`
    59.   `Forwarded`
    60.   `From`
    61.   `Host`
    62.   `Idempotency-Key`
    63.   `If-Match`
    64.   `If-Modified-Since`
    65.   `If-None-Match`
    66.   `If-Range`
    67.   `If-Unmodified-Since`
    68.   `Integrity-Policy`
    69.   `Integrity-Policy-Report-Only`
    70.   `Keep-Alive`
    71.   `Last-Modified`
    72.   `Link`
    73.   `Location`
    74.   `Max-Forwards`
    75.   `NEL`
    76.   `No-Vary-Search`
    77.   `Observe-Browsing-Topics`
    78.   `Origin`
    79.   `Origin-Agent-Cluster`
    80.   `Permissions-Policy`
    81.   `Permissions-Policy-Report-Only`
    82.   `Pragma`
    83.   `Prefer`
    84.   `Preference-Applied`
    85.   `Priority`
    86.   `Proxy-Authenticate`
    87.   `Proxy-Authorization`
    88.   `Range`
    89.   `Referer`
    90.   `Referrer-Policy`
    91.   `Refresh`
    92.   `Report-To`
    93.   `Reporting-Endpoints`
    94.   `Repr-Digest`
    95.   `Retry-After`
    96.   `RTT`
    97.   `Save-Data`
    98.   `Sec-Browsing-Topics`
    99.   `Sec-CH-Device-Memory`
    100.   `Sec-CH-DPR`
    101.   `Sec-CH-Prefers-Color-Scheme`
    102.   `Sec-CH-Prefers-Reduced-Motion`
    103.   `Sec-CH-Prefers-Reduced-Transparency`
    104.   `Sec-CH-UA`
    105.   `Sec-CH-UA-Arch`
    106.   `Sec-CH-UA-Bitness`
    107.   `Sec-CH-UA-Form-Factors`
    108.   `Sec-CH-UA-Full-Version`
    109.   `Sec-CH-UA-Full-Version-List`
    110.   `Sec-CH-UA-Mobile`
    111.   `Sec-CH-UA-Model`
    112.   `Sec-CH-UA-Platform`
    113.   `Sec-CH-UA-Platform-Version`
    114.   `Sec-CH-UA-WoW64`
    115.   `Sec-CH-Viewport-Height`
    116.   `Sec-CH-Viewport-Width`
    117.   `Sec-CH-Width`
    118.   `Sec-Fetch-Dest`
    119.   `Sec-Fetch-Mode`
    120.   `Sec-Fetch-Site`
    121.   `Sec-Fetch-Storage-Access`
    122.   `Sec-Fetch-User`
    123.   `Sec-GPC`
    124.   `Sec-Private-State-Token`
    125.   `Sec-Private-State-Token-Crypto-Version`
    126.   `Sec-Private-State-Token-Lifetime`
    127.   `Sec-Purpose`
    128.   `Sec-Redemption-Record`
    129.   `Sec-Speculation-Tags`
    130.   `Sec-WebSocket-Accept`
    131.   `Sec-WebSocket-Extensions`
    132.   `Sec-WebSocket-Key`
    133.   `Sec-WebSocket-Protocol`
    134.   `Sec-WebSocket-Version`
    135.   `Server`
    136.   `Server-Timing`
    137.   `Service-Worker`
    138.   `Service-Worker-Allowed`
    139.   `Service-Worker-Navigation-Preload`
    140.   `Set-Cookie`
    141.   `Set-Login`
    142.   `SourceMap`
    143.   `Speculation-Rules`
    144.   `Strict-Transport-Security`
    145.   `Supports-Loading-Mode`
    146.   `TE`
    147.   `Timing-Allow-Origin`
    148.   `Tk`
    149.   `Trailer`
    150.   `Transfer-Encoding`
    151.   `Upgrade`
    152.   `Upgrade-Insecure-Requests`
    153.   `Use-As-Dictionary`
    154.   `User-Agent`
    155.   `Vary`
    156.   `Via`
    157.   `Viewport-Width`
    158.   `Want-Content-Digest`
    159.   `Want-Repr-Digest`
    160.   `Warning`
    161.   `Width`
    162.   `WWW-Authenticate`
    163.   `X-Content-Type-Options`
    164.   `X-DNS-Prefetch-Control`
    165.   `X-Forwarded-For`
    166.   `X-Forwarded-Host`
    167.   `X-Forwarded-Proto`
    168.   `X-Frame-Options`
    169.   `X-Permitted-Cross-Domain-Policies`
    170.   `X-Powered-By`
    171.   `X-Robots-Tag`
    172.   `X-XSS-Protection`

27.   
HTTP 请求方法
    1.   `CONNECT`
    2.   `DELETE`
    3.   `GET`
    4.   `HEAD`
    5.   `OPTIONS 请求方法`
    6.   `PATCH`
    7.   `POST`
    8.   `PUT`
    9.   `QUERY`
    10.   `TRACE`

28.   
HTTP 响应状态码
    1.   `100 Continue`
    2.   `101 Switching Protocols`
    3.   `103 Early Hints`
    4.   `200 OK`
    5.   `201 Created`
    6.   `202 Accepted`
    7.   `203 Non-Authoritative Information`
    8.   `204 No Content`
    9.   `205 Reset Content`
    10.   `206 Partial Content`
    11.   `207 Multi-Status`
    12.   `208 Already Reported`
    13.   `226 IM Used`
    14.   `300 Multiple Choices`
    15.   `301 Moved Permanently`
    16.   `302 Found`
    17.   `303 See Other`
    18.   `304 Not Modified`
    19.   `307 Temporary Redirect`
    20.   `308 Permanent Redirect`
    21.   `400 Bad Request`
    22.   `401 Unauthorized`
    23.   `402 Payment Required`
    24.   `403 Forbidden`
    25.   `404 Not Found`
    26.   `405 Method Not Allowed`
    27.   `406 Not Acceptable`
    28.   `407 Proxy Authentication Required`
    29.   `408 Request Timeout`
    30.   `409 Conflict`
    31.   `410 Gone`
    32.   `411 Length Required`
    33.   `412 Precondition Failed`
    34.   `413 Content Too Large`
    35.   `414 URI Too Long`
    36.   `415 Unsupported Media Type`
    37.   `416 Range Not Satisfiable`
    38.   `417 Expectation Failed`
    39.   `418 I'm a teapot`
    40.   `421 Misdirected Request`
    41.   `422 Unprocessable Entity`
    42.   `423 Locked`
    43.   `424 Failed Dependency`
    44.   `425 Too Early`
    45.   `426 Upgrade Required`
    46.   `428 Precondition Required`
    47.   `429 Too Many Requests`
    48.   `431 Request Header Fields Too Large`
    49.   `451 Unavailable For Legal Reasons`
    50.   `500 Internal Server Error`
    51.   `501 Not Implemented`
    52.   `502 Bad Gateway`
    53.   `503 Service Unavailable`
    54.   `504 Gateway Timeout`
    55.   `505 HTTP Version Not Supported`
    56.   `506 Variant Also Negotiates`
    57.   `507 Insufficient Storage`
    58.   `508 Loop Detected`
    59.   `510 Not Extended`
    60.   `511 Network Authentication Required`

29.   
CSP 指令
    1.   `CSP: base-uri`
    2.   `CSP: block-all-mixed-content`
    3.   `CSP: child-src`
    4.   `CSP: connect-src`
    5.   `CSP：default-src`
    6.   `fenced-frame-src`
    7.   `CSP: font-src`
    8.   `CSP: form-action`
    9.   `CSP：frame-ancestors`
    10.   `frame-src`
    11.   `img-src`
    12.   `manifest-src`
    13.   `media-src`
    14.   `object-src`
    15.   `prefetch-src`
    16.   `report-to`
    17.   `report-uri`
    18.   `require-trusted-types-for`
    19.   `CSP: sandbox`
    20.   `script-src`
    21.   `script-src-attr`
    22.   `CSP: script-src-elem`
    23.   `style-src`
    24.   `style-src-attr`
    25.   `style-src-elem`
    26.   `trusted-types`
    27.   `upgrade-insecure-requests`
    28.   `CSP: worker-src`

30.   
权限策略指令
    1.   `Permissions-Policy: accelerometer`
    2.   `Permissions-Policy: ambient-light-sensor`
    3.   `aria-notify`
    4.   `Permissions-Policy: attribution-reporting`
    5.   `Permissions-Policy: autoplay`
    6.   `Permissions-Policy: bluetooth`
    7.   `browsing-topics`
    8.   `Permissions-Policy: camera`
    9.   `captured-surface-control`
    10.   `ch-ua-high-entropy-values`
    11.   `compute-pressure`
    12.   `cross-origin-isolated`
    13.   `deferred-fetch`
    14.   `deferred-fetch-minimal`
    15.   `display-capture`
    16.   `encrypted-media`
    17.   `Permissions-Policy: fullscreen`
    18.   `gamepad`
    19.   `geolocation`
    20.   `gyroscope`
    21.   `hid`
    22.   `identity-credentials-get`
    23.   `idle-detection`
    24.   `language-detector`
    25.   `language-model`
    26.   `Permissions-Policy: local-fonts`
    27.   `local-network`
    28.   `local-network-access`
    29.   `loopback-network`
    30.   `magnetometer`
    31.   `microphone`
    32.   `midi`
    33.   `on-device-speech-recognition`
    34.   `otp-credentials`
    35.   `payment`
    36.   `Permissions-Policy: picture-in-picture`
    37.   `private-state-token-issuance`
    38.   `private-state-token-redemption`
    39.   `publickey-credentials-create`
    40.   `publickey-credentials-get`
    41.   `screen-wake-lock`
    42.   `serial`
    43.   `speaker-selection`
    44.   `storage-access`
    45.   `summarizer`
    46.   `translator`
    47.   `unload`
    48.   `usb`
    49.   `Permissions-Policy: web-share`
    50.   `window-management`
    51.   `xr-spatial-tracking`

31.   HTTP 资源与规范

构建更美好互联网的蓝图。

MDN
*   关于
*   博客
*   Mozilla 招聘
*   与我们合作投放广告
*   MDN Plus
*   产品帮助

参与贡献
*   MDN 社区
*   社区资源
*   写作指南
*   MDN Discord
*   MDN GitHub 主页

开发者
*   Web 技术
*   学习 Web 开发
*   指南
*   教程
*   术语表
*   Hacks 博客

*   网站隐私声明
*   遥测设置
*   法律声明
*   社区参与准则

本内容的部分版权归 mozilla.org 贡献者所有，©1998–2026。内容依据知识共享许可协议提供。
