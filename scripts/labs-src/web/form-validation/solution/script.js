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

// ── 3. 检查两个密码框，同时更新提示。返回值：两次密码是否一致 ──
function checkPasswords() {
  // 提示 ①：密码长度（和 HTML 里的 minlength="8" 保持一致）
  const len = pwd1.value.length;
  if (len === 0) show(msg1, '');
  else if (len < 8) show(msg1, `还差 ${8 - len} 位`, 'err');
  else show(msg1, '密码长度合格', 'ok');

  // 提示 ②：两次是否一致（确认框还没输入时不提示）
  const same = pwd1.value === pwd2.value;
  if (pwd2.value === '') show(msg2, '');
  else show(msg2, same ? '两次密码一致' : '两次输入的密码不一致', same ? 'ok' : 'err');

  return same;
}

// 两个密码框只要有一个内容变了，就重新检查一遍——这就是「实时提示」
pwd1.addEventListener('input', checkPasswords);
pwd2.addEventListener('input', checkPasswords);

// 注册成功之后如果又改了内容，绿色的成功提示就不该再留着
form.addEventListener('input', () => result.classList.remove('show'));

// 浏览器自带的校验（required / minlength / pattern）全部通过之后，才会触发 submit 事件
form.addEventListener('submit', (e) => {
  e.preventDefault();   // 这个示例没有服务器：拦住真实的提交，否则页面会刷新

  // 最后一道关：实时提示只是给人看的，真正提交前必须再检查一次
  if (!checkPasswords()) {
    pwd2.focus();
    return;
  }

  result.textContent = `注册成功，欢迎你，${nickname.value.trim()}！`;
  result.classList.add('show');
  console.log('表单校验全部通过，可以提交了');
});
