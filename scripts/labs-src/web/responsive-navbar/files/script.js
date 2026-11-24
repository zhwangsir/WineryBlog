// 抓元素：汉堡按钮和菜单
const toggle = document.querySelector('#toggle');
const menu = document.querySelector('#menu');

// TODO（第 2 步）：给 toggle 监听 click 事件，点击时切换菜单的开 / 关：
//   const open = menu.classList.toggle('open')
//     classList.toggle(name)：有这个 class 就去掉、没有就加上；返回值 = 切换之后「有没有」
//   toggle.classList.toggle('active', open)          让三条横线变成 ×
//   toggle.setAttribute('aria-expanded', String(open))   把开 / 关状态告诉读屏软件

// TODO（第 3 步）：点了菜单里的链接之后自动收起：
//   给 menu 监听 click，用 e.target.matches('a') 判断被点到的是不是链接，是就收起
// TODO（第 3 步）：跨越断点时（比如从手机宽度切回宽屏）把状态复位：
//   const narrow = window.matchMedia('(max-width: 480px)');
//   narrow.addEventListener('change', 收起菜单的函数);
//   媒体查询的断点要和 CSS 里 @media 的断点写成一样

// 调试用（已写好）：实时显示预览区的宽度，方便对照断点
const widthLabel = document.querySelector('#width');
const showWidth = () => { widthLabel.textContent = window.innerWidth + 'px'; };
window.addEventListener('resize', showWidth);
showWidth();
