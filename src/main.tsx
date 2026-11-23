import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// 字体本地打包：拉丁字符用 Inter / JetBrains Mono（按 unicode-range 子集按需下载），中文回落系统中文字体
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
