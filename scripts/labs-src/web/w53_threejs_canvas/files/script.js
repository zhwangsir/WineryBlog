const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width;
const H = cv.height;

// Step 1：先让一个方块动起来——游戏循环三件套：清屏 → 更新 → 绘制 → 预约下一帧
let x = 0;
function loop() {
  ctx.clearRect(0, 0, W, H);           // 清屏
  x = (x + 2) % W;                     // 更新
  ctx.fillStyle = '#f27d26';
  ctx.fillRect(x, 70, 20, 20);         // 绘制
  requestAnimationFrame(loop);         // 下一帧
}
loop();

// TODO（Step 2）：把单个方块升级成 200 个粒子的数组——每个粒子有自己的位置与速度
// TODO（Step 3）：给粒子加上重力（vy 每帧加一点），落地后回到顶部
