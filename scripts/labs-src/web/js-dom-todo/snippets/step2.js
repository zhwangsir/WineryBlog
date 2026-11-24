// 放在 addItem 里（三个元素都创建完之后）
box.addEventListener('change', () => {
  // 第二个参数为 true 就加上 done，为 false 就去掉
  item.classList.toggle('done', box.checked);
  updateCount();
});

// 剩余数量统一在这里算：添加、勾选、删除之后只要调用它，数字就一定是对的
function updateCount() {
  // 还没完成的条数：选出不带 done 的条目
  const left = list.querySelectorAll('.item:not(.done)').length;
  count.textContent = `剩余 ${left} 项`;
  // 列表里只要有条目，就隐藏「还没有待办」的提示
  empty.hidden = list.children.length > 0;
}
