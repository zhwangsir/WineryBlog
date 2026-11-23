// 网易云音乐 API 本地服务：持久运行在 3650 端口（本站服务端代理转发，读者端零外跳）
// 启动：node scripts/serve-netease.cjs
// cookie 登录态存储：server/data/netease-cookie.json（由后台扫码登录写入请求头）
const { serveNcmApi } = require('NeteaseCloudMusicApi');
const fs = require('fs');
const path = require('path');

const PORT = 3650;
const COOKIE_FILE = path.join(__dirname, '..', 'server', 'data', 'netease-cookie.txt');

serveNcmApi({
  port: PORT,
  checkVersion: false,
}).catch((e) => {
  console.error('[netease-api] start failed:', e.message);
  process.exit(1);
});

console.log(`[netease-api] serving on http://localhost:${PORT}`);
if (fs.existsSync(COOKIE_FILE)) {
  console.log('[netease-api] cookie file found (login state applies per-request)');
}
