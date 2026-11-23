// 池修正：dlbook 标 failed（仓库 API 异常）；cppthings2 改 viaContents 模式
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const c of pool.candidates) {
  if (c.id === 'dlbook') c.status = 'failed';
  if (c.id === 'cppthings2' && c.picks?.[0]) c.picks[0].viaContents = true;
}
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log('pool fixed:', pool.candidates.map(c => `${c.id}:${c.status}`).join(' '));
