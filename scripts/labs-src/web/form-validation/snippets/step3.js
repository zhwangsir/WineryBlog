// 检查两个密码框，同时更新提示。返回值：两次密码是否一致
function checkPasswords() {
  // 提示 ①：密码长度
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

// input 事件：输入框内容一变就触发。两个密码框任何一个变了，都重新检查一遍
pwd1.addEventListener('input', checkPasswords);
pwd2.addEventListener('input', checkPasswords);

form.addEventListener('submit', (e) => {
  e.preventDefault();                 // 没有服务器：拦住真实的提交
  if (!checkPasswords()) {            // 提交前必须再检查一次，不能只靠提示
    pwd2.focus();
    return;
  }
  result.textContent = `注册成功，欢迎你，${nickname.value.trim()}！`;
  result.classList.add('show');
  console.log('表单校验全部通过，可以提交了');
});
