// dsh-desktop-zero — 预加载脚本
// 通过 contextBridge 向渲染进程暴露窗口控制能力（自绘标题栏按钮用）。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshDesktop', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
  close: () => ipcRenderer.send('window:close'),
  // 由 index.html 注入的 dsh 端口（通过 query 传递）
  getPort: () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('port');
  },
});
