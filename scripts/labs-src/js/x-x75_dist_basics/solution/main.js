// 一主一从两个副本；从库通过「有延迟的定时器」接收复制——这就是异步复制的形态
const primary = new Map();
const replica = new Map();
const REPLICATE_DELAY = 500;   // Step 2：模拟分区下的复制延迟

function write(key, val) {
  primary.set(key, val);
  setTimeout(() => replica.set(key, val), REPLICATE_DELAY);   // 复制延迟
}
function readFrom(type, key) {
  return (type === 'primary' ? primary : replica).get(key);
}

// Step 2：写入后立刻读从库——复制还没到，读到的是「旧值」（这里是什么都没有）
write('stock', 100);
console.log('写入后立刻 · 读主库:', readFrom('primary', 'stock'));   // 100
console.log('写入后立刻 · 读从库:', readFrom('replica', 'stock'));   // undefined —— 数据漂移发生了

await new Promise((r) => setTimeout(r, 600));
console.log('600ms 后   · 读从库:', readFrom('replica', 'stock'));   // 100 —— 最终一致

// Step 3：CAP 不是「三选二」，而是分区发生时在 C 与 A 之间二选一
// CP 场景（错一点就出事，必须读主库、宁可拒绝服务）：下单扣库存、账户余额扣减
// AP 场景（晚几秒无感，读副本换性能）：文章浏览量、点赞数、排行榜
console.log('结论：异步复制的窗口期就是不一致窗口；强一致读主，最终一致读副本。');
