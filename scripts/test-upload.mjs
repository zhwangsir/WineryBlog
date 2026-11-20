// E2E probe: login -> upload -> fetch uploaded file -> cleanup
const BASE = 'http://127.0.0.1:3000';
import fs from 'fs';

async function main() {
  // 1) login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wineryblog2026' }),
  });
  const login = await loginRes.json();
  if (!login.token) throw new Error('login failed: ' + JSON.stringify(login));
  console.log('login: ok');

  // 2) upload without token must fail
  const svg = fs.readFileSync('public/images/default-avatar.svg');
  const dataUrl = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  const anon = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test.svg', data: dataUrl }),
  });
  console.log('upload anon:', anon.status, anon.status === 401 ? '(correctly rejected)' : '(BUG)');

  // 3) upload with token
  const upRes = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ name: 'test-avatar.svg', data: dataUrl }),
  });
  const up = await upRes.json();
  console.log('upload auth:', upRes.status, JSON.stringify(up));
  if (!up.url) throw new Error('no url returned');

  // 4) fetch uploaded file
  const fileRes = await fetch(`${BASE}${up.url}`);
  console.log('fetch uploaded:', fileRes.status, fileRes.headers.get('content-type'));

  // 5) list uploads
  const listRes = await fetch(`${BASE}/api/uploads`, {
    headers: { Authorization: `Bearer ${login.token}` },
  });
  const list = await listRes.json();
  console.log('uploads list:', listRes.status, list.length, 'file(s)');

  // 6) bad type must be rejected
  const badRes = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ name: 'evil.txt', data: 'data:text/plain;base64,SGVsbG8=' }),
  });
  console.log('upload bad type:', badRes.status, badRes.status === 415 ? '(correctly rejected)' : '(BUG)');

  console.log('E2E_UPLOAD_OK');
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
