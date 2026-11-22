// Probe riverpod candidate URLs, report which has real content
const execFileSync = (await import('child_process')).execFileSync;
const candidates = [
  'https://riverpod.dev/docs/getting_started',
  'https://riverpod.dev/docs/introduction/getting_started',
  'https://riverpod.dev/docs',
  'https://riverpod.dev/',
  'https://pub.dev/packages/flutter_riverpod',
];
for (const u of candidates) {
  try {
    const raw = execFileSync('curl', ['-sL', '--max-time', '40', `https://r.jina.ai/${u}`], { encoding: 'utf8' });
    const t = (raw.match(/^Title:\s*(.+)$/m) || [])[1]?.trim() || '(no title)';
    const body = raw.slice(raw.indexOf('Markdown Content:'));
    const bad = /not found|404|page cannot/i.test(t) || body.length < 800;
    console.log(`${bad ? 'BAD ' : 'OK  '} ${u} title="${t.slice(0, 60)}" bodyLen=${body.length}`);
  } catch (e) {
    console.log(`ERR ${u}: ${String(e.message).slice(0, 80)}`);
  }
}
