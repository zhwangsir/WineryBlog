// E2E probe for /api/tutor: all four modes must answer coherently
const BASE = 'http://127.0.0.1:3000';
const tutorial = {
  title: 'Shell 脚本入门',
  content: `## 变量\nNAME="winery"\necho "Hello, $NAME"\n命令替换：DATE=$(date +%Y-%m-%d)\n\n## 条件判断\nif [ "$1" -gt 10 ]; then echo "big"; fi\n[ -f file ] 判断文件存在\n\n## 循环\nfor i in {1..10}; do echo $i; done\nwhile IFS= read -r line; do echo $line; done < file.txt`,
};

async function tutor(mode, messages) {
  const r = await fetch(`${BASE}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, title: tutorial.title, content: tutorial.content, messages }),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || `HTTP ${r.status}: ${JSON.stringify(j).slice(0, 120)}`;
}

for (const mode of ['socratic', 'explain', 'quiz', 'practice']) {
  const reply = await tutor(mode, [
    { role: 'user', content: mode === 'socratic' ? 'Shell 里 $() 是干嘛的？' : '开始' },
  ]);
  console.log(`\n=== ${mode} ===`);
  console.log(reply.slice(0, 220).replace(/\n+/g, ' | '));
}
console.log('\nTUTOR_E2E_OK');
