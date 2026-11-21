// 学习进度客户端：匿名访客 ID（localStorage）+ 服务端同步
const VID_KEY = 'winery-visitor-id';

export interface ProgressData {
  read: Record<string, string>; // tutorialId -> ISO timestamp
  lastRead: string | null;
}

export function getVisitorId(): string {
  let vid = localStorage.getItem(VID_KEY);
  if (!vid || !/^[a-f0-9-]{36}$/.test(vid)) {
    vid = crypto.randomUUID();
    localStorage.setItem(VID_KEY, vid);
  }
  return vid;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-Id': getVisitorId(),
      ...(init?.headers || {}),
    },
  });
}

export async function fetchProgress(): Promise<ProgressData> {
  try {
    const r = await api('/api/progress');
    if (r.ok) return await r.json();
  } catch { /* offline */ }
  return { read: {}, lastRead: null };
}

export async function markRead(tutorialId: string, read: boolean): Promise<ProgressData | null> {
  try {
    const r = await api('/api/progress/read', {
      method: 'POST',
      body: JSON.stringify({ tutorialId, read }),
    });
    if (r.ok) return await r.json();
  } catch { /* offline */ }
  return null;
}
