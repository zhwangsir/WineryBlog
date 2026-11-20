// One-off fix for 3 scraped artifacts + remove unmirrorable unity checklist line
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// 1) Oracle String table: link text contains char[] (nested brackets broke regex)
{
  const p = path.join(ROOT, 'src/references/ref-docs-oracle-com-javase-8-docs-api-java-lang-string-html.md');
  let c = fs.readFileSync(p, 'utf-8');
  c = c.replace(/\[`valueOf\(char\[\], int, int\)`\]\(https?:\/\/[^)]+\)/g, '`valueOf(char[], int, int)`');
  fs.writeFileSync(p, c);
}

// 2) sed manual: parenthesized bare URL in prose
{
  const p = path.join(ROOT, 'src/references/ref-gnu-org-software-sed-manual-sed-html.md');
  let c = fs.readFileSync(p, 'utf-8');
  c = c.replace(/\(http:\/\/austingroupbugs\.net\/view\.php\?id=528\)/g, '(`http://austingroupbugs.net/view.php?id=528`)');
  fs.writeFileSync(p, c);
}

// 3) k8s: nested-bracket commit link -> plain text
{
  const p = path.join(ROOT, 'src/references/ref-k8s-basics.md');
  let c = fs.readFileSync(p, 'utf-8');
  c = c.replace(/\[\[zh-cn\][^\]]*\]\(https?:\/\/[^)]+\)/g, 'sync overview/_index components (2ef2f60d15)');
  fs.writeFileSync(p, c);
}

// 4) unity.com/download can never be mirrored (JS download page) — drop from
//    checklist so fetch stops retrying every cycle
{
  const p = path.join(ROOT, 'docs/REFERENCES.md');
  let c = fs.readFileSync(p, 'utf-8');
  c = c.replace(/^- \[ \] ref-unity-com-download \|.*\n/gm, '');
  fs.writeFileSync(p, c);
}

console.log('fixed 3 artifacts + removed unity checklist line');
