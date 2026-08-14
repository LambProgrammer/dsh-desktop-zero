// dsh-desktop-zero — 渲染进程脚本（自绘标题栏 + 加载 DSH 界面）
// 独立文件以符合 CSP script-src 'self'，避免内联脚本被拦截。
(function () {
  const port = window.dshDesktop ? window.dshDesktop.getPort() : null;

  // 自绘标题栏按钮
  if (window.dshDesktop) {
    document.getElementById('btn-min').addEventListener('click', () => window.dshDesktop.minimize());
    document.getElementById('btn-max').addEventListener('click', () => window.dshDesktop.maximizeToggle());
    document.getElementById('btn-close').addEventListener('click', () => window.dshDesktop.close());
  }

  // 主窗口加载时 DSH 已就绪，直接设置 iframe 源
  if (port) {
    document.getElementById('dsh-frame').src = 'http://127.0.0.1:' + port;
  }
})();
