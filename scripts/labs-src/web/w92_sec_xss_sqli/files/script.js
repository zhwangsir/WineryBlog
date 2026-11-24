// 模拟一条来自用户的「评论」：攻击者把脚本藏在 <img> 的 onerror 里
// （src=x 是个不存在的图片地址，加载失败就会触发 onerror）
const userInput = '<img src=x onerror="document.getElementById(\'box\').innerHTML += \'<p style="color:#f27d26">XSS 触发！脚本执行了</p>\'">';

// Step 1：取消下一行的注释，看看「把用户输入直接当 HTML 渲染」会发生什么（沙箱里完全安全）
// document.getElementById('box').innerHTML = userInput;

// Step 2：改用 textContent —— 用户输入只会被当成纯文本
// document.getElementById('box').textContent = userInput;

// Step 3（选做）：如果确实要显示富文本，先做输出转义再交给 innerHTML
