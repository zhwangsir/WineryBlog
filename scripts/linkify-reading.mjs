// Convert plain-text mirror paths into clickable markdown links
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TUT = path.join(ROOT, 'src', 'tutorials');

const files = [
  'x14_gamedev_overview.md', 'x15_unity_intro.md', 'x24_jwt_oauth.md',
  'x29_jetpack_compose.md', 'x36_go_intro.md', 'x40_grpc_micro.md',
  'x46_nginx_deep.md', 'x47_weapp.md', 'x49_web_perf.md',
  'x53_flutter_state.md', 'x60_usestate_deep.md',
];

const slugs = [
  'ref-game-programming-patterns', 'ref-unity-learn', 'ref-jwt-io-introduction',
  'ref-android-compose-course', 'ref-go-by-example', 'ref-protobuf-proto3',
  'ref-nginx-beginners-guide', 'ref-wechat-miniprogram-docs',
  'ref-webdev-learn-performance', 'ref-riverpod-docs', 'ref-react-learn',
];

let fixed = 0;
for (const f of files) {
  const p = path.join(TUT, f);
  let c = fs.readFileSync(p, 'utf-8');
  const before = c;
  for (const s of slugs) {
    c = c.replace(`（本地镜像 /post/${s}）`, `（[本地镜像](/post/${s})）`);
  }
  if (c !== before) { fs.writeFileSync(p, c); fixed++; console.log(`linked ${f}`); }
}
console.log(`fixed ${fixed}/${files.length}`);
