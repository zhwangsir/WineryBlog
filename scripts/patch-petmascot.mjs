// Patch PetMascot: remove stale PIXI canvases (StrictMode double-mount leaves
// an orphan white canvas) and force canvas transparency.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(ROOT, 'src', 'components', 'PetMascot.tsx');
let c = fs.readFileSync(p, 'utf-8');
const before = c;

// 1) appendChild 前清掉宿主里的旧 canvas（StrictMode 双挂载/热更残留会白屏）
c = c.replace(
  "pixiHostRef.current?.appendChild(app.view as HTMLCanvasElement);",
  "pixiHostRef.current?.querySelectorAll('canvas').forEach(cv => cv.remove());\n" +
  "        pixiHostRef.current?.appendChild(app.view as HTMLCanvasElement);\n" +
  "        (app.view as HTMLCanvasElement).style.background = 'transparent';"
);

// 2) destroy 时把 view 也从 DOM 移除
c = c.replace(
  "appRef.current?.destroy(false, { children: true });",
  "appRef.current?.destroy(false, { children: true });\n" +
  "        pixiHostRef.current?.querySelectorAll('canvas').forEach(cv => cv.remove());"
);

if (c !== before) {
  fs.writeFileSync(p, c);
  console.log('patched PetMascot.tsx');
} else {
  console.log('no change (patterns not found — may already be patched)');
}
