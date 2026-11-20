const TOKEN_KEY = 'wineryblog_token';

/**
 * fetch wrapper for authenticated admin APIs.
 * Attaches the Bearer token stored at login; merges caller headers.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers });
}
