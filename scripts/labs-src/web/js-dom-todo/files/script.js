// ── 1. 抓元素：选择器和 index.html 里的 id 一一对应 ──
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#list');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');

// ── 2. 更新底部的「剩余 N 项」 ──
function updateCount() {
  // TODO（第 2 步）：
  //   1. const left = list.querySelectorAll('.item:not(.done)').length   没完成的条数
  //   2. count.textContent = `剩余 ${left} 项`
  //   3. empty.hidden = list.children.length > 0
  //      列表里只要有条目，就隐藏「还没有待办」的提示
}

// ── 3. 添加一条待办 ──
function addItem(text) {
  // TODO（第 1 步）：拼出下面这样的一条，并追加到列表末尾
  //   <li class="item"><input type="checkbox"><span>文字</span><button class="del" type="button">×</button></li>
  //   1. const item = document.createElement('li')，然后 item.className = 'item'
  //   2. 用同样的办法创建勾选框 box：把它的 type 设为 'checkbox'
  //   3. 创建文字 label：document.createElement('span')，用 label.textContent = text 写入内容
  //   4. 创建删除按钮 del：className 设为 'del'，type 设为 'button'，textContent 设为 '×'
  //   5. item.append(box, label, del)，再 list.append(item)
  //   6. 最后调用 updateCount()——新增了一条，底部的数量和「还没有待办」的提示要跟着更新
  //      （它现在还是空的，第 2 步会把它补全）

  // TODO（第 2 步）：给勾选框 box 监听 change 事件：
  //   用 item.classList.toggle('done', box.checked) 加上或去掉 done，然后调用 updateCount()

  // TODO（第 3 步）：给删除按钮 del 监听 click 事件：
  //   item.remove() 删掉这一条，然后调用 updateCount()
}

// ── 4. 提交表单（点「添加」或在输入框里按回车）时触发 ──
form.addEventListener('submit', (e) => {
  e.preventDefault();                 // 阻止表单真的提交——否则页面会刷新
  const text = input.value.trim();    // trim()：去掉首尾的空格
  if (text) addItem(text);            // 空内容不添加
  // TODO（第 1 步）：添加之后把输入框清空（input.value = ''），并让焦点留在输入框里（input.focus()）
});

updateCount();   // 页面刚打开时先统计一次
