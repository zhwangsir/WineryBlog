function addItem(text) {
  // 1. 创建这一条的「外壳」
  const item = document.createElement('li');
  item.className = 'item';

  // 2. 创建勾选框
  const box = document.createElement('input');
  box.type = 'checkbox';

  // 3. 创建文字：textContent 会把内容当作纯文本写进去
  const label = document.createElement('span');
  label.textContent = text;

  // 4. 创建删除按钮
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'del';
  del.textContent = '×';

  // 5. 先把孩子挂到 <li> 上，再把 <li> 挂到列表上
  item.append(box, label, del);
  list.append(item);

  // 6. 新增了一条：底部的数量和「还没有待办」的提示要跟着更新（updateCount 在第 2 步补全）
  updateCount();
}
