/**
 * 读取服务端转发的大模型 SSE 流，把增量内容交给 onDelta。
 * /api/ai、/api/lab-agent、/api/lab-ai 返回的都是 OpenAI 风格的 `data: {...}` 行。
 */
export async function readModelStream(res: Response, onDelta: (text: string) => void, signal: AbortSignal) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const data = line.trim();
        if (!data.startsWith('data:')) continue;
        const payload = data.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const j = JSON.parse(payload);
          const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content ?? '';
          if (delta) onDelta(delta);
        } catch { /* 非 JSON 行（心跳等）跳过 */ }
      }
    }
  } finally {
    reader.releaseLock();
    if (!signal.aborted) onDelta('');
  }
}

/** 流式请求失败时给读者看的提示 */
export const AI_UNREACHABLE = '请求失败：内网推理服务可能没启动，或者模型网关暂时不可达。';
