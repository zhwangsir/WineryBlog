const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width;
const H = cv.height;

// Step 2：200 个粒子，每个有自己的位置与速度
const ps = Array.from({ length: 200 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  vx: Math.random() * 2 + 0.5,   // 水平速度随机
  vy: 0,
}));

function loop() {
  ctx.clearRect(0, 0, W, H);            // 清屏
  ctx.fillStyle = '#f27d26';
  for (const p of ps) {
    p.vy += 0.05;                       // Step 3：重力，每帧让竖直速度变大一点
    p.x = (p.x + p.vx) % W;             // 超出右边界就回到左边
    p.y += p.vy;
    if (p.y > H) {                      // 落地：回到顶部，竖直速度清零
      p.y = 0;
      p.vy = 0;
    }
    ctx.fillRect(p.x, p.y, 3, 3);       // 绘制
  }
  requestAnimationFrame(loop);          // 下一帧
}
loop();
