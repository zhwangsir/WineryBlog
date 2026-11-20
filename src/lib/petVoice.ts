/** 桌宠语音层：优先播放预置胡桃语音包，缺音频文件时用浏览器 TTS 兜底。 */

const AUDIO_DIR = '/audio/hutao';
// 台词 → 音频映射：把胡桃语音包里语义相近的台词接到场景上（有资源时填 hash 文件名）
const AUDIO_MAP: Record<string, string[]> = {
  // greet: ['greet_01.mp3', 'greet_02.mp3'],
  // tap: ['tap_01.mp3', 'tap_02.mp3'],
};

let muted = false;
export function setPetVoiceMuted(m: boolean) { muted = m; }

let lastAudio: HTMLAudioElement | null = null;

/** 播台词语音；找不到映射或播放失败时回落浏览器 TTS。 */
export function speakPetLine(scene: string, text: string, enabled: boolean) {
  if (!enabled || muted) return;
  const bank = AUDIO_MAP[scene];
  if (bank && bank.length) {
    const file = bank[Math.floor(Math.random() * bank.length)];
    try {
      lastAudio?.pause();
      const audio = new Audio(`${AUDIO_DIR}/${file}`);
      audio.volume = 0.7;
      lastAudio = audio;
      audio.play().catch(() => ttsFallback(text));
      return;
    } catch { /* fall through to TTS */ }
  }
  ttsFallback(text);
}

function ttsFallback(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[~～（）()♪]/g, ''));
    u.lang = 'zh-CN';
    u.rate = 1.15;          // 胡桃语速偏快
    u.pitch = 1.35;         // 音调偏高贴近少女声线
    u.volume = 0.65;
    synth.speak(u);
  } catch { /* TTS 不可用就静默 */ }
}
