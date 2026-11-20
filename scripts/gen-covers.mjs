// One-time generator: writes 8 themed cover SVGs into public/images/covers/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'images', 'covers');

// warm, library-ish palettes matching the site accent (#F27D26)
const palettes = [
  { top: '#1c1410', mid: '#4a2c1a', glow: '#F27D26' }, // amber
  { top: '#101820', mid: '#1f3a4a', glow: '#3a9dbd' }, // teal-blue
  { top: '#14101c', mid: '#33224d', glow: '#8c6ed1' }, // violet
  { top: '#121a12', mid: '#27452c', glow: '#5aa866' }, // green
  { top: '#1a1216', mid: '#4a2333', glow: '#d16a8c' }, // rose
  { top: '#171310', mid: '#3d3220', glow: '#c2a25a' }, // gold
  { top: '#101418', mid: '#2b333d', glow: '#7d94ad' }, // slate
  { top: '#160f14', mid: '#402038', glow: '#b05a96' }, // plum
];

function petalField(seed, w, h, n, color) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * w);
    const y = Math.round(rnd() * h * 0.75);
    const r = (1.6 + rnd() * 2.2).toFixed(1);
    const o = (0.25 + rnd() * 0.35).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${o}"/>\n  `;
  }
  return out;
}

function svg(i, p) {
  const w = 1280, h = 720;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${p.top}"/>
      <stop offset="0.65" stop-color="${p.mid}"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.25" r="0.5">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <path d="M0 ${h - 160} Q ${w * 0.3} ${h - 240} ${w * 0.62} ${h - 170} T ${w} ${h - 190} V ${h} H 0 Z" fill="${p.top}" opacity="0.9"/>
  <path d="M0 ${h - 90} Q ${w * 0.4} ${h - 150} ${w} ${h - 110} V ${h} H 0 Z" fill="${p.top}"/>
  ${petalField(i * 7919 + 13, w, h, 26, p.glow)}
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
palettes.forEach((p, i) => {
  fs.writeFileSync(path.join(OUT, `cover${i + 1}.svg`), svg(i + 1, p));
});
console.log('wrote', palettes.length, 'covers to', OUT);
