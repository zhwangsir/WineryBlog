// WineryBlog Service Worker：可安装 PWA + 离线回退
// 策略：
//   - 静态资源（/assets /images /uploads /wallpapers /vendor）→ cache-first（带 hash 的构建产物与本地媒体）
//   - 页面导航 → network-first，断网回落缓存的 SPA 入口
//   - /api/* → 永远走网络（评论/进度等动态数据不缓存）
//   - 开发期 vite 模块（/src /@vite /@react-refresh node_modules/.vite）→ 不缓存
const CACHE = 'wineryblog-v1';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest'];
const STATIC_PREFIX = ['/assets/', '/images/', '/uploads/', '/wallpapers/', '/vendor/'];
const SKIP = ['/src/', '/@vite', '/@react-refresh', 'node_modules/.vite', '/live2d/', '/api/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  if (SKIP.some((p) => path.startsWith(p))) return;

  // 静态资源：cache-first
  if (STATIC_PREFIX.some((p) => path.startsWith(p))) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 页面导航：network-first，断网回落缓存入口
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
  }
});
