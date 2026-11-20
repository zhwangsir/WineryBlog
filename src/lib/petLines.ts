/** 胡桃桌宠台词池——按场景分类，随机取用。 */

export const PET_LINES = {
  greet: [
    '嘿嘿~ 客官又来啦！往生堂今日照常营业，顺便也卖点有趣的知识~',
    '诶嘿~ 是不是想胡桃了？我就知道！',
    '欢迎光临~ 本堂主今天心情好，有问必答，绝不坑客官！',
    '呀，来啦来啦！一起学点有意思的东西吧！',
    '嘿嘿，客官今天也是来求学的吗？胡桃奉陪到底~',
  ],
  tap: [
    '哇！别戳别戳，戳坏了可不赔哦~ 嘿嘿，开玩笑的啦！',
    '诶嘿~ 有什么想问的尽管说！本堂主上知天文下知地理（大半个大陆吧）~',
    '嘿嘿~ 想聊天就双击我，想学习就点旁边的助教按钮！',
    '唔……被发现了！其实胡桃也在偷偷学习编程呢~',
    '客官客官，学累了就要休息哦，劳逸结合才能长生~啊不是，才能学得快！',
  ],
  drag: [
    '哇啊——飞起来啦！客官好大的力气！',
    '嘿嘿，带着胡桃飞是不是比走路快多啦~',
    '唔唔，轻一点轻一点，堂主的帽子要掉了！',
    '哇，换个位置也不错，这里视野挺好的嘛~',
  ],
  dodge: [
    '哎呀，挡到客官了？这就挪窝这就挪窝~',
    '唔，这里好像有人在干活，胡桃去那边待着~',
    '嘿嘿，本堂主最识趣了，马上闪人！',
  ],
  idle: [
    '（哼着小曲儿）♪～',
    '今天往生堂的生意也不错呢~',
    '欸——那个知识点好有趣，要不要去看看？',
    '客官要是学累了，就来和胡桃说说话嘛~',
  ],
  night: [
    '这么晚还没睡呀？熬夜可是养生大忌！……好吧其实胡桃也经常熬夜~',
    '嘿嘿，夜深人静适合学习，堂主陪你！',
    '夜猫子客官！早点休息哦，明天继续加油~',
  ],
  openChat: [
    '来啦来啦！堂主亲自坐堂，客官想聊什么？',
    '诶嘿~ 有问题就问，胡桃知无不言！',
  ],
} as const;

export type PetLineScene = keyof typeof PET_LINES;

const lastByScene = new Map<PetLineScene, number>();

/** 取一条不与上一条重复的随机台词。 */
export function pickLine(scene: PetLineScene): string {
  const pool = PET_LINES[scene];
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1) {
    while (idx === lastByScene.get(scene)) {
      idx = Math.floor(Math.random() * pool.length);
    }
  }
  lastByScene.set(scene, idx);
  return pool[idx];
}
