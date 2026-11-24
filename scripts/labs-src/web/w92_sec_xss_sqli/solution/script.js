// 模拟一条来自用户的「评论」：攻击者把脚本藏在 <img> 的 onerror 里
const userInput = '<img src=x onerror="document.getElementById(\'box\').innerHTML += \'<p style="color:#f27d26">XSS 触发！脚本执行了</p>\'">';

// Step 1 的漏洞写法：innerHTML 把用户输入当 HTML 解析，onerror 里的脚本被执行了
// document.getElementById('box').innerHTML = userInput;

// Step 2 的修复：textContent 把输入当纯文本——标签原样显示，脚本不会执行
document.getElementById('box').textContent = userInput;

// Step 3：确实要渲染富文本时，先把特殊字符转义，再交给 innerHTML（真实项目里常用 DOMPurify 这类白名单库）
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
document.getElementById('box').innerHTML += `<p style="color:#3ecf8e">转义后再渲染就安全了：${escapeHtml(userInput)}</p>`;
