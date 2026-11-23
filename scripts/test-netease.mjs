// 网易云本地服务连通性测试：搜索 + 播放 URL 解析
const BASE = 'http://127.0.0.1:3650';
const search = await fetch(`${BASE}/search?keywords=${encodeURIComponent('周杰伦 晴天')}&limit=3`).then(r => r.json());
const songs = (search?.result?.songs || []).map(s => ({ id: s.id, name: s.name, artist: s.artists?.[0]?.name }));
console.log('搜索结果:', JSON.stringify(songs, null, 1));

if (songs.length) {
  const url = await fetch(`${BASE}/song/url/v1?id=${songs[0].id}&level=standard`).then(r => r.json());
  const u = url?.data?.[0];
  console.log('播放URL:', JSON.stringify({ url: u?.url?.slice(0, 60), type: u?.type, size: u?.size, freeTrialInfo: u?.freeTrialInfo ?? null, code: u?.code }));
}
