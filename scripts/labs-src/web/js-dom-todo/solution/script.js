// ── 1. 抓元素：选择器和 index.html 里的 id 一一对应 ──
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#list');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');

// ── 2. 更新底部的「剩余 N 项」 ──
function updateCount() {
  // :not(.done) 表示「没有 done 这个 class 的条目」，也就是还没完成的
  const left = list.querySelectorAll('.item:not(.done)').length;
  count.textContent = `剩余 ${left} 项`;
  // 列表里只要有条目，就隐藏「还没有待办」的提示
  empty.hidden = list.children.length > 0;
}

// ── 3. 添加一条待办 ──
function addItem(text) {
  // 创建这一条的 DOM 结构：
  //   <li class="item"><input type="checkbox"><span>文字</span><button class="del" type="button">×</button></li>
  const item = document.createElement('li');
  item.className = 'item';

  const box = document.createElement('input');
  box.type = 'checkbox';

  const label = document.createElement('span');
  label.textContent = text;           // 用 textContent 而不是 innerHTML：输入的内容只会被当成文字

  const del = document.createElement('button');
  del.type = 'button';                // button 默认是 submit 类型，放进表单会触发提交——显式写成 button 更稳妥
  del.className = 'del';
  del.textContent = '×';

  item.append(box, label, del);       // 先把孩子挂到 <li> 上
  list.append(item);                  // 再把 <li> 挂到列表上
  updateCount();                      // 新增了一条：剩余数量和「还没有待办」的提示都要跟着更新

  // 第 2 步：勾选 = 完成。
  // classList.toggle(name, force)：force 为 true 就加上这个 class，为 false 就去掉
  box.addEventListener('change', () => {
    item.classList.toggle('done', box.checked);
    updateCount();
  });

  // 第 3 步：点 × 删除。
  // 监听器是在 addItem 里给每个新建的 del 单独绑定的，所以这里拿到的 item 就是「点的那一条」
  del.addEventListener('click', () => {
    item.remove();
    updateCount();
  });
}

// ── 4. 提交表单（点「添加」或在输入框里按回车）时触发 ──
form.addEventListener('submit', (e) => {
  e.preventDefault();                 // 阻止表单真的提交——否则页面会刷新
  const text = input.value.trim();    // trim()：去掉首尾的空格
  if (text) addItem(text);            // 空内容不添加
  input.value = '';                   // 清空输入框，方便接着输入下一条
  input.focus();
});

updateCount();   // 页面刚打开时先统计一次
