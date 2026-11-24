// ── 1. 抓元素 ──
const form = document.querySelector('#reg-form');
const nickname = document.querySelector('#nickname');
const pwd1 = document.querySelector('#pwd1');
const pwd2 = document.querySelector('#pwd2');
const msg1 = document.querySelector('#pwd1-msg');
const msg2 = document.querySelector('#pwd2-msg');
const result = document.querySelector('#result');

// ── 2. 小工具：往某个提示框里写文字 ──
// type 是 'ok'（绿色）、'err'（红色）或 ''（清空）
function show(el, text, type = '') {
  el.textContent = text;
  el.classList.remove('ok', 'err');
  if (type) el.classList.add(type);
}

// TODO（第 3 步）：实现 checkPasswords()，检查两个密码框并更新提示，返回「两次密码是否一致」
//   提示 ①（写进 msg1）：密码长度
//     没有输入      → show(msg1, '')
//     不足 8 位     → show(msg1, `还差 ${8 - 长度} 位`, 'err')
//     够 8 位       → show(msg1, '密码长度合格', 'ok')
//   提示 ②（写进 msg2）：两次是否一致（确认框为空时先不提示）
//     show(msg2, 一致 ? '两次密码一致' : '两次输入的密码不一致', 一致 ? 'ok' : 'err')
//   最后 return 是否一致
// TODO（第 3 步）：给 pwd1 和 pwd2 都监听 input 事件（内容一变就触发），回调都是 checkPasswords

// 浏览器自带的校验（required / minlength / pattern）全部通过之后，才会触发 submit 事件
form.addEventListener('submit', (e) => {
  e.preventDefault();   // 这个示例没有服务器：拦住真实的提交，否则页面会刷新
  console.log('浏览器自带校验已通过，接下来轮到 JS 检查密码是否一致');
  // TODO（第 3 步）：
  //   1. 调用 checkPasswords()：返回 false 就把焦点移到 pwd2（pwd2.focus()）并 return
  //   2. 通过了：result.textContent = `注册成功，欢迎你，${nickname.value.trim()}！`
  //      再 result.classList.add('show')
  //      再 console.log('表单校验全部通过，可以提交了')
});
