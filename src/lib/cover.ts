// 封面回落链：图床封面（posts.cover）→ 胡桃主题图 → SVG 渐变
// 同一篇文章的回落图按 id 稳定哈希——分配的图床封面一旦写入即固定

const hutaoCovers = [
  '/images/HuTao/hutao1.png',
  '/images/HuTao/hutao2.png',
  '/images/HuTao/hutao3.png',
  '/images/HuTao/hutao4.png',
  '/images/HuTao/hutao5.png',
  '/images/HuTao/hutao6.png',
  '/images/HuTao/hutao7.png',
  '/images/HuTao/hutao8.png',
  '/images/HuTao/hutao9.png',
  '/images/HuTao/hutao10.png',
];

const gradientCovers = [
  '/images/covers/cover1.svg',
  '/images/covers/cover2.svg',
  '/images/covers/cover3.svg',
  '/images/covers/cover4.svg',
  '/images/covers/cover5.svg',
  '/images/covers/cover6.svg',
  '/images/covers/cover7.svg',
  '/images/covers/cover8.svg',
];

export const coverIndex = (id: string, len: number): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % len;
};

/** 封面候选链（依次回落） */
export function coverChain(post: { id: string; cover?: string }): string[] {
  const hutao = hutaoCovers[coverIndex(post.id, hutaoCovers.length)];
  const gradient = gradientCovers[coverIndex(post.id, gradientCovers.length)];
  return post.cover ? [post.cover, hutao, gradient] : [hutao, gradient];
}
