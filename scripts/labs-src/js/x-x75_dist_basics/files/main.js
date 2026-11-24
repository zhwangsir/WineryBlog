// 一主一从两个副本；从库通过「有延迟的定时器」接收复制——这就是异步复制的形态
const primary = new Map();
const replica = new Map();
const REPLICATE_DELAY = 0;     // 正常情况下复制几乎立刻到达（Step 2 会把它改成 500）

function write(key, val) {
  primary.set(key, val);
  setTimeout(() => replica.set(key, val), REPLICATE_DELAY);   // 复制延迟
}
function readFrom(type, key) {
  return (type === 'primary' ? primary : replica).get(key);
}

// Step 1：正常情况——写进去，读主库和从库都是 100
write('stock', 100);
console.log('读主库:', readFrom('primary', 'stock'));          // 100
await new Promise((r) => setTimeout(r, 20));                    // 等复制到达
console.log('读从库:', readFrom('replica', 'stock'));           // 100

// TODO（Step 2）：把顶部的 REPLICATE_DELAY 改成 500（模拟分区下的复制延迟），
//                写入后不要等，立刻读从库——看看读到什么；再过 600ms 读一次
// TODO（Step 3）：把你的业务各举一个 CP / AP 的例子写进下面的注释
// CP 场景（必须读主库）：
// AP 场景（读副本即可）：
