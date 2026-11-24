// 收起菜单：去掉 open / active，并把 aria-expanded 改回 false
function closeMenu() {
  menu.classList.remove('open');
  toggle.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
}

// 细节一：点了菜单里的链接就收起。
// 事件委托：只给 menu 挂一个监听，点击会从被点的元素一路冒泡上来，看被点的是不是 <a>
menu.addEventListener('click', (e) => {
  if (e.target.matches('a')) closeMenu();
});

// 细节二：跨越断点时把状态复位（比如菜单开着的时候从手机宽度切回宽屏）
const narrow = window.matchMedia('(max-width: 480px)');   // 断点要和 CSS 里的 @media 保持一致
narrow.addEventListener('change', closeMenu);
