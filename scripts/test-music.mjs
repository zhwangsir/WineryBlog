// 音乐卡片端到端测试：生成测试音频 → 上传 → 歌单保存 → 前台 /api/music 验证
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
const ROOT = 'C:/workspace/WineryBlog';
const T = process.env.GITHUB_TOKEN || '';

// ① sharp 不产音频——生成一个最小合法 WAV（44 字节头 + 1 秒 440Hz 静音 PCM）
function makeWav() {
  const sampleRate = 44100, seconds = 1, channels = 1, bits = 16;
  const dataSize = sampleRate * seconds * channels * (bits / 8);
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels * bits / 8, 28); buf.writeUInt16LE(channels * bits / 8, 32);
  buf.writeUInt16LE(bits, 34); buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < dataSize / 2; i++) {
    buf.writeInt16LE(Math.round(Math.sin((i / sampleRate) * 440 * 2 * Math.PI) * 12000), 44 + i * 2);
  }
  return buf;
}
const wav = makeWav();
const b64 = `data:audio/wav;base64,${wav.toString('base64')}`;

// 登录
const login = await fetch('http://127.0.0.1:3000/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
}).then(r => r.json());
const H = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' };

// ② 上传音频
const up = await fetch('http://127.0.0.1:3000/api/upload', {
  method: 'POST', headers: { ...H }, body: JSON.stringify({ name: 'test-tone.wav', data: b64 }),
}).then(r => r.json());
console.log('① 上传:', JSON.stringify(up));

// ③ 保存歌单
const save = await fetch('http://127.0.0.1:3000/api/music', {
  method: 'PUT', headers: { ...H },
  body: JSON.stringify([{ id: 'test-1', title: '测试音阶', artist: 'WineryLab', url: up.url }]),
}).then(r => r.json());
console.log('② 歌单保存:', JSON.stringify(save));

// ④ 公开歌单验证
const list = await fetch('http://127.0.0.1:3000/api/music').then(r => r.json());
console.log('③ 公开歌单:', list.length, '首，首曲:', JSON.stringify(list[0]));

// ⑤ 音频可访问性
const head = await fetch('http://127.0.0.1:3000' + list[0].url).then(r => ({ ok: r.ok, ct: r.headers.get('content-type') }));
console.log('④ 音频可访问:', JSON.stringify(head));
