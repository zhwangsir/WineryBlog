---
title: 微信小程序开发入门
category: 移动与跨端
order: 9
tags: [微信小程序, WXML, 云开发, 跨端]
summary: 小程序架构与双线程模型、WXML/WXSS 语法、登录支付流程、云开发免运维——国民级 App 里的 App。
---

## 1. 小程序是什么，为什么值得学

微信小程序 = **跑在微信里的 App**：免安装、微信登录/支付/分享全套基建、10 亿用户触手可及。国内电商/餐饮/政务的标配。技术栈对前端极友好：

```
WXML（类 HTML）+ WXSS（类 CSS）+ JavaScript + JSON（配置）
```

**双线程架构**（与 Web 的本质区别）：

```
渲染层（WebView，每个页面一个）  ←→  逻辑层（JsCore，单一线程）
                    通过微信原生层桥接
```

逻辑层**没有 DOM/BOM**——`document`、`window` 不存在！setData 是渲染层通信的唯一通道。这个设计换来：JS 不会阻塞渲染、可控安全；代价：setData 频繁/大量会卡（它是跨线程序列化通信）。

## 2. 工程结构

```
project/
  app.js        全局逻辑
  app.json      全局配置：页面注册、tabBar、窗口样式
  app.wxss      全局样式
  pages/
    index/
      index.wxml    结构
      index.wxss    样式
      index.js      页面逻辑
      index.json    页面配置
```

```json
// app.json
{
  "pages": ["pages/index/index", "pages/detail/detail"],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "a.png", "selectedIconPath": "b.png" }
    ]
  },
  "window": { "navigationBarTitleText": "我的小程序" }
}
```

## 3. WXML/WXSS 语法速成

```xml
<!-- 数据绑定与指令 -->
<view class="card" wx:for="{{todos}}" wx:key="id">
  <text>{{item.title}}</text>
  <text wx:if="{{item.done}}">✓</text>
  <text wx:elif="{{item.urgent}}">!</text>
  <text wx:else>…</text>
</view>

<!-- 事件绑定：以 bind 开头 -->
<button bindtap="onTap" data-id="{{item.id}}">完成</button>
```

```javascript
Page({
  data: { todos: [] },                    // 视图数据

  onTap(e) {
    const id = e.currentTarget.dataset.id;
    // 必须用 setData 同步到视图（不能直接 this.data.x = 1）
    this.setData({
      [`todos[${e.currentTarget.dataset.index}].done`]: true
    });
  },

  onLoad(options) { this.fetchData(options.id); },     // 页面加载，带路由参数
});
```

WXSS 支持 rpx 单位：**750rpx = 屏幕宽度**——设计稿（750px 宽）直接 1:1 写 rpx，自动适配所有机型。

## 4. 登录：openid 是身份的根

小程序登录是**静默**的（无感，无授权弹窗）：

```
1. wx.login() → 临时 code（5 分钟有效）
2. code 发给你的后端 → 后端调微信接口换 openid + session_key
   https://api.weixin.qq.com/sns/jscode2session
3. 后端用 openid 查/建用户 → 发自定义登录态（JWT）给小程序
4. 后续请求带 JWT
```

敏感操作（获取手机号）才需要用户点按钮授权。**openid 在同一小程序下永久唯一**——它是用户身份的锚。

## 5. 云开发：个人开发者的免运维方案

不想买服务器？**云开发（CloudBase）**提供 Serverless 三件套：云函数、云数据库、云存储——官方 SDK 直连，免鉴权免域名备案：

```javascript
// 直接在小程序里调云数据库
const db = wx.cloud.database();
wx.cloud.init({ env: 'my-env' });

// 增
await db.collection('todos').add({ data: { title: '买牛奶', done: false } });
// 查
const { data } = await db.collection('todos').where({ done: false }).get();

// 云函数（跑在腾讯云 Node 环境，绕过小程序直连的安全限制）
wx.cloud.callFunction({ name: 'pay', data: { orderId: 1 } })
```

免费额度足够个人项目跑很久。代价：被锁定在腾讯云生态，数据迁移受限。

## 6. 支付流程（企业主体才能接）

```
小程序请求你的后端下单
  → 后端调微信支付统一下单 API → 得到 paySign
  → 小程序 wx.requestPayment(paySign) 唤起支付
  → 用户支付
  → 微信回调你的后端（notify_url）→ 验签 → 记账 → 返回 success
```

**回调验签是唯一可信的支付结果来源**——前端 wx.requestPayment 的 success 回调不可信（用户可能中途取消）。

## 7. 上架与开发工具

- **微信开发者工具**：模拟器 + 真机调试 + 代码上传，一站式
- 个人主体能上架（企业类目除外：支付/电商需要企业资质）
- 体验版二维码 → 团队内测 → 提交审核（1-7 天，类目与资质要备齐）

## 8. 性能要点

1. setData 是大头：合并请求、只传变化的字段、避免一次性传长列表（用 `recycle-view`）
2. 图片用 CDN + 懒加载；首屏数据走缓存（`wx.setStorageSync`）
3. 包体积：主包 ≤ 2MB，用分包（`subpackages`）把低频页面拆出去

## 延伸阅读

- 站内相关：《React Native 入门：用 React 写原生 App》《Flutter 与 uni-app：跨端开发入门》《uni-app 项目实战与赛项》
- 《微信小程序开发文档》（[本地镜像](/post/ref-wechat-miniprogram-docs)）——质量很高，以它为准
- 《微信小程序开发实战》
