// Diagnose low-scoring features part 1: code-level checks
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = {};

// 1. AI 馆员是否有教程上下文（RAG）
const ai = fs.readFileSync(path.join(ROOT, 'src/pages/AIChat.tsx'), 'utf8');
out.aiRag = (ai.includes('/api/tutorials') || ai.toLowerCase().includes('retriev') || ai.includes('search')) ? 'YES' : 'NO';
out.aiHistoryLimit = /messages\.slice|slice\(-/.test(ai) ? '有' : '无';
out.aiLength = ai.length;

// 2. 路线进度双系统不一致
const route = fs.readFileSync(path.join(ROOT, 'src/pages/CareerRoute.tsx'), 'utf8');
out.routeLocalStorage = route.includes('route-progress:') ? 'YES' : 'NO';
out.routeServerApi = route.includes('/api/progress') ? 'YES' : 'NO';

// 3. 死代码
const app = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
out.learningPathsImported = app.includes('LearningPaths');
const lpPath = path.join(ROOT, 'src/pages/LearningPaths.tsx');
out.learningPathsFile = fs.existsSync(lpPath) ? `${fs.statSync(lpPath).size} bytes` : 'gone';

// 4. posts.json 体积
out.postsJsonKB = Math.round(fs.statSync(path.join(ROOT, 'server/data/posts.json')).size / 1024);

// 5. Progress 页面存在吗
out.progressPage = fs.existsSync(path.join(ROOT, 'src/pages/Progress.tsx')) || fs.existsSync(path.join(ROOT, 'src/pages/MyLearning.tsx'));

// 6. 404 route
out.notFoundCatchAll = /\*\s*\}/.test(app) || app.includes('NotFound');

// 7. 学习进度在路线页的勾选与教程页「已学」是否互通
out.routeReadApi = route.includes('fetchProgress') || route.includes('markRead') ? 'YES' : 'NO（独立 localStorage）';

fs.writeFileSync(path.join(ROOT, 'docs/diagnose-features.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
