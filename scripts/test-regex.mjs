import { sanitize } from './lib/md-sanitize.mjs';
const line = '- *https://draw.io*';
const re = /(^|[\s(（【：:，,。；；>、「*])((?:https?:\/\/)[^\s)）\]<>"`*]{8,})/g;
const m = re.exec(line);
console.log('exec match:', m ? [m[1], m[2]] : null);
console.log('sanitize out:', sanitize(line));
// 分步测
console.log('prefix alone:', /(^|[\s(（【：:，,。；；>、「*])/.test('*https://draw.io*'));
console.log('url alone:', /((?:https?:\/\/)[^\s)）\]<>"`*]{8,})/.test(line));
