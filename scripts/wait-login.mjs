// 轮询官方登录状态，最长 5 分钟；登录成功输出并写标记文件
import fs from 'fs';
import { execFileSync } from 'child_process';
const BIN = 'C:\\workspace\\winery-library\\tools\\node-v22.11.0-win-x64\\ncm-cli.cmd';
for (let i = 1; i <= 20; i++) {
  try {
    const out = execFileSync(BIN, ['login', '--check'], { encoding: 'utf8', timeout: 30000 });
    const j = JSON.parse(out);
    if (j.success) {
      fs.writeFileSync('C:/workspace/WineryBlog/scripts/.login-ok.txt', JSON.stringify({ at: new Date().toISOString(), message: j.message || '' }));
      console.log(`LOGIN OK (poll ${i}): ${j.message || ''}`);
      process.exit(0);
    }
  } catch { /* 忽略单次失败 */ }
  await new Promise(r => setTimeout(r, 15000));
}
console.log('LOGIN TIMEOUT (5min) - 用户尚未完成登录');
