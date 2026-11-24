// JavaScript 写在 script.js 里；console 的输出显示在预览下方的「控制台」
console.log('页面加载了');

let count = 0;
document.getElementById('btn').addEventListener('click', () => {
  count += 1;
  document.getElementById('out').textContent = `点了 ${count} 次`;
});
