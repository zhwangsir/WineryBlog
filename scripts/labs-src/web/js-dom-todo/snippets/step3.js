// 放在 addItem 里
del.addEventListener('click', () => {
  item.remove();       // 把这一条从页面上删掉
  updateCount();       // 剩余数量和空提示都要跟着更新
});

// 进阶写法（选做）：事件委托——不给每个 × 单独绑定，只在列表上监听一次
// list.addEventListener('click', (e) => {
//   if (!e.target.matches('.del')) return;                  // 点的不是 ×，不管
//   e.target.closest('.item').remove();                     // 从 × 往上找到所属的 <li> 并删掉
//   updateCount();
// });
