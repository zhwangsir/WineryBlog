// Rewrite 延伸阅读 site mentions into local mirror links (11 tutorials)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TUT = path.join(ROOT, 'src', 'tutorials');

// host mention -> local mirror link (slug must match REFERENCES.md)
const MIRROR = {
  'gameprogrammingpatterns.com': '/post/ref-game-programming-patterns',
  'learn.unity.com': '/post/ref-unity-learn',
  'developer.android.com': '/post/ref-android-compose-course',
  'gobyexample.com': '/post/ref-go-by-example',
  'jwt.io': '/post/ref-jwt-io-introduction',
  'protobuf.dev': '/post/ref-protobuf-proto3',
  'nginx.org': '/post/ref-nginx-beginners-guide',
  'developers.weixin.qq.com': '/post/ref-wechat-miniprogram-docs',
  'web.dev': '/post/ref-webdev-learn-performance',
  'riverpod.dev': '/post/ref-riverpod-docs',
  'react.dev': '/post/ref-react-learn',
};

// exact line replacements per file (site mention -> local mirror link)
const REPLACEMENTS = [
  {
    file: 'x14_gamedev_overview.md',
    from: '- gameprogrammingpatterns.com ——游戏编程模式（免费在线）',
    to: '- 《游戏编程模式》（本地镜像 /post/ref-game-programming-patterns）——免费在线全文',
  },
  {
    file: 'x15_unity_intro.md',
    from: '- Unity 官方 Learn 平台：learn.unity.com（免费路径 Ruby\'s Adventure）',
    to: '- Unity 官方 Learn 平台（本地镜像 /post/ref-unity-learn）——免费路径 Ruby\'s Adventure',
  },
  {
    file: 'x24_jwt_oauth.md',
    from: '- jwt.io 官网（解码器 + 调试工具）',
    to: '- 《JSON Web Token 介绍》（本地镜像 /post/ref-jwt-io-introduction）——含解码器与调试工具',
  },
  {
    file: 'x29_jetpack_compose.md',
    from: '- 官方 Compose 路径：developer.android.com/courses/jetpack-compose/course',
    to: '- 官方 Compose 学习路径（本地镜像 /post/ref-android-compose-course）',
  },
  {
    file: 'x36_go_intro.md',
    from: '- Go by Example（gobyexample.com）——按例子学标准库',
    to: '- 《Go by Example》（本地镜像 /post/ref-go-by-example）——按例子学标准库',
  },
  {
    file: 'x40_grpc_micro.md',
    from: '- protobuf.dev 官方语言指南（风格规范 proto3-style）',
    to: '- 《Protobuf 语言指南 proto3》（本地镜像 /post/ref-protobuf-proto3）——含风格规范',
  },
  {
    file: 'x46_nginx_deep.md',
    from: '- nginx.org 官方文档（每个指令的语义都有精确说明）',
    to: '- 《Nginx 初学者指南》（本地镜像 /post/ref-nginx-beginners-guide）——每个指令语义精确说明',
  },
  {
    file: 'x47_weapp.md',
    from: '- 微信官方文档（developers.weixin.qq.com/miniprogram）——质量很高，以它为准',
    to: '- 《微信小程序开发文档》（本地镜像 /post/ref-wechat-miniprogram-docs）——质量很高，以它为准',
  },
  {
    file: 'x49_web_perf.md',
    from: '- web.dev（Google 官方性能文档，Core Web Vitals 出处）',
    to: '- 《Web.dev Learn Performance》（本地镜像 /post/ref-webdev-learn-performance）——Core Web Vitals 出处',
  },
  {
    file: 'x53_flutter_state.md',
    from: '- Riverpod 官方文档（riverpod.dev，质量极高）',
    to: '- 《Riverpod 官方文档》（本地镜像 /post/ref-riverpod-docs）——质量极高',
  },
  {
    file: 'x60_usestate_deep.md',
    from: '- react.dev 官方文档 State as a Snapshot / Queueing a Series of State Updates',
    to: '- 《React 官方文档 Learn》（本地镜像 /post/ref-react-learn）——State as a Snapshot 等',
  },
];

let patched = 0;
for (const r of REPLACEMENTS) {
  const p = path.join(TUT, r.file);
  let c = fs.readFileSync(p, 'utf-8');
  if (c.includes(r.from)) {
    c = c.replace(r.from, r.to);
    fs.writeFileSync(p, c);
    patched++;
    console.log(`patched ${r.file}`);
  } else {
    console.log(`MISS ${r.file} (pattern not found)`);
  }
}
console.log(`\npatched ${patched}/11`);
