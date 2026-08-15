// dsh-desktop-zero — Electron 主进程
// 非官方 DeepSeek Harness (DSH) Windows 桌面封装
// 职责：以 ELECTRON_RUN_AS_NODE 模式启动 DSH web 服务，自绘标题栏承载其界面。
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { execFile, spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');

const APP_TITLE = 'dsh-desktop-zero';
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;

let mainWindow = null;
let dshProcess = null;
let dshPort = null;

// ---------------------------------------------------------------------------
// 1) 单实例锁：确保同时只能运行一个应用实例
// ---------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// 工具：找一个空闲端口
// ---------------------------------------------------------------------------
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

// ---------------------------------------------------------------------------
// 2) 启动 DSH web 服务
//    禁止 spawn('dsh')：必须通过 process.resourcesPath 定位入口，
//    用内置 Node（process.execPath + ELECTRON_RUN_AS_NODE）执行。
// ---------------------------------------------------------------------------
function resolveDshEntry() {
  // 开发模式：从项目 node_modules 解析；打包模式（asar: false）：
  // 依赖以真实文件位于 resources/app/node_modules。
  const candidates = [
    path.join(process.resourcesPath, 'app', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'),
    path.join(__dirname, '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('找不到 @deepseek-ai/dsh 入口文件（lib/bin.js），请检查打包配置');
}

// ---------------------------------------------------------------------------
// 2) 独立数据目录（DSH_HOME）
//    三种运行形态互不干扰，避免多实例并发写同一份 .dsh 导致日志损坏：
//      - 官方 npx DSH    → ~/.dsh（不动，保持原样）
//      - 安装版          → <用户选择的安装目录>\data（卸载即清，跟随安装目录）
//      - 便携版          → %LOCALAPPDATA%\dsh-desktop-zero-portable\data（独立常驻）
// ---------------------------------------------------------------------------
function resolveDshHome() {
  // NSIS portable 运行时会注入 PORTABLE_EXECUTABLE_DIR（指向 exe 所在目录），
  // 用它可靠区分"便携版"与"安装版"。
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.APPDATA, 'dsh-desktop-zero-portable', 'data');
  }
  // 安装版：resourcesPath = <安装目录>\resources，上级即真实安装目录
  // （用户安装时可选任意盘符/目录，这里始终跟随实际安装位置）
  return path.join(path.dirname(process.resourcesPath), 'data');
}

function resolveDshNode() {
  // 打包模式：使用内置的官方 node.exe（extraResources 复制到 resources/node.exe），
  // DSH 跑在独立 Node 而非 Electron 内嵌 Node，确保 koffi 原生模块
  // （沙箱 runner / 目录选择器 / 会话持久化 / ACL 原子写）在正确 ABI 下工作。
  const candidates = [
    path.join(process.resourcesPath, 'node.exe'),
    // 开发模式：使用系统 node（F:\Node.js\node.exe 或 PATH 中的 node）
    process.env.DSH_DEV_NODE || 'node',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'node';
}

function startDsh(port) {
  const entry = resolveDshEntry();
  const dshNode = resolveDshNode();
  // --expose-internals：DSH 的 HMR 服务（cordis-plugin-hmr）必需此 Node 标志。
  const args = ['--expose-internals', entry, 'web', '--host', '127.0.0.1', '--port', String(port)];
  // DSH 由独立 node.exe 运行（非 Electron），process.execPath 即 node.exe，
  // 沙箱 runner 等 koffi 路径使用正确 ABI。
  // DSH_HOME：独立数据目录，与官方 ~/.dsh 及其他版本完全隔离。
  const dshHome = resolveDshHome();
  console.log(`[dsh-desktop-zero] 数据目录: ${dshHome}`);
  console.log(`[dsh-desktop-zero] DSH 运行时: ${dshNode}`);
  // SSH_CONNECTION 环境变量：DSH 的目录选择器据此走 browse 后端
  // （独立 Node 下 native 后端本应正常，此处保留作为双保险）。
  dshProcess = execFile(dshNode, args, {
    env: {
      ...process.env,
      DSH_HOME: dshHome,
      SSH_CONNECTION: 'dsh-desktop-zero', // 非空即可触发 browse 分支
    },
    windowsHide: true,
  });
  dshProcess.stdout?.on('data', (d) => process.stdout.write(`[dsh] ${d}`));
  dshProcess.stderr?.on('data', (d) => process.stderr.write(`[dsh] ${d}`));
  dshProcess.on('exit', (code, signal) => {
    console.log(`[dsh] exited code=${code} signal=${signal}`);
    dshProcess = null;
  });
}

function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ port, host: '127.0.0.1' });
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`DSH 服务在 ${timeoutMs}ms 内未能启动`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

// ---------------------------------------------------------------------------
// 3) 终止 DSH 子进程（含整个进程树，Windows 用 taskkill /T）
// ---------------------------------------------------------------------------
function killDsh() {
  if (!dshProcess || dshProcess.killed) return;
  const pid = dshProcess.pid;
  try {
    // 先温和退出，随后兜底强杀进程树
    dshProcess.kill();
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
  } catch (e) {
    console.error('[dsh-desktop-zero] 终止 DSH 进程失败:', e.message);
  }
  dshProcess = null;
}

// ---------------------------------------------------------------------------
// 4) 独立闪屏窗 + 主窗口（DSH 就绪后弹出）
//    - 双击 exe：先出现透明无边框闪屏（鲸鱼娘 + 转圈），无窗口框架
//    - DSH 服务就绪：关闭闪屏，弹出主窗口
// ---------------------------------------------------------------------------
let splashWindow = null;

function createSplash() {
  const { screen } = require('electron');
  splashWindow = new BrowserWindow({
    width: 560,
    height: 620,
    frame: false,          // 无边框
    transparent: true,     // 透明背景，只显示圆形图
    resizable: false,
    movable: true,
    alwaysOnTop: true,     // 置顶，不被其他窗口遮挡
    skipTaskbar: true,     // 不在任务栏显示
    show: false,
    hasShadow: false,
    webPreferences: {
      sandbox: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.once('ready-to-show', () => {
    // 屏幕居中（适配任意分辨率/DPI）
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    splashWindow.setPosition(
      Math.round((width - 560) / 2),
      Math.round((height - 620) / 2)
    );
    splashWindow.show();
  });

  splashWindow.on('closed', () => { splashWindow = null; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 800,
    minHeight: 600,
    title: APP_TITLE,
    frame: false, // 替换默认标题栏
    backgroundColor: '#121212',
    show: false, // DSH 就绪后才显示，避免空白窗口
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 直接加载 DSH 界面（此时 DSH 已就绪）
  mainWindow.loadFile(path.join(__dirname, 'index.html'), {
    query: { port: String(dshPort) },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => { mainWindow = null; });
}

// 窗口控制 IPC（供自绘标题栏按钮使用）
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize-toggle', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ---------------------------------------------------------------------------
// 生命周期
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  // 动态分配可用端口
  dshPort = await findFreePort();
  console.log(`[dsh-desktop-zero] 使用端口: ${dshPort}`);

  // 便携版：NSIS 自解压期间已通过 portable.splashImage 展示过闪屏，
  // 进入应用后直接等待 DSH 就绪并弹出主窗口，不再重复应用内闪屏。
  const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;

  // 启动 DSH 服务（后台初始化）
  startDsh(dshPort);

  // 安装版：显示应用内闪屏（透明窗 + 鲸鱼娘 + 转圈 + 最少5秒）
  const splashStart = Date.now();
  if (!isPortable) createSplash();

  try {
    await waitForServer(dshPort);
  } catch (e) {
    if (splashWindow) splashWindow.close();
    dialog.showErrorBox(APP_TITLE, `无法启动 DSH 服务：${e.message}\n请检查应用目录完整性。`);
    app.quit();
    return;
  }

  // 安装版：保证闪屏至少展示 5 秒（便携版无需，解压期已展示）
  if (!isPortable) {
    const elapsed = Date.now() - splashStart;
    const minSplash = 5000;
    if (elapsed < minSplash) {
      await new Promise((r) => setTimeout(r, minSplash - elapsed));
    }
  }

  // DSH 就绪：关闭闪屏（安装版），弹出主窗口
  if (splashWindow) splashWindow.close();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // 主窗口（含闪屏）全部关闭即退出（同时终止 DSH 子进程）
  app.quit();
});

app.on('will-quit', () => {
  killDsh();
});
