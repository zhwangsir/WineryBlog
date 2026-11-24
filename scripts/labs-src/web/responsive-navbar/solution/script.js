// 抓元素：汉堡按钮和菜单
const toggle = document.querySelector('#toggle');
const menu = document.querySelector('#menu');

// 收起菜单：去掉 open / active，并把 aria-expanded 改回 false
function closeMenu() {
  menu.classList.remove('open');
  toggle.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
}

// 第 2 步：点汉堡按钮 → 开 / 关切换
toggle.addEventListener('click', () => {
  // classList.toggle(name)：有这个 class 就去掉、没有就加上；返回值 = 切换之后「有没有」
  const open = menu.classList.toggle('open');
  toggle.classList.toggle('active', open);               // 三条横线 ↔ ×
  toggle.setAttribute('aria-expanded', String(open));    // 把开 / 关状态告诉读屏软件
});

// 第 3 步：点了菜单里的链接就收起。
// 事件委托：只给 menu 挂一个监听，点击会从被点的元素一路冒泡上来，看被点的是不是 <a>
menu.addEventListener('click', (e) => {
  if (e.target.matches('a')) closeMenu();
});

// 第 3 步：跨越断点时（比如菜单开着的时候从手机宽度切回宽屏）把状态复位
const narrow = window.matchMedia('(max-width: 480px)');   // 断点要和 CSS 里的 @media 保持一致
narrow.addEventListener('change', closeMenu);

// 调试用（已写好）：实时显示预览区的宽度，方便对照断点
const widthLabel = document.querySelector('#width');
const showWidth = () => { widthLabel.textContent = window.innerWidth + 'px'; };
window.addEventListener('resize', showWidth);
showWidth();
