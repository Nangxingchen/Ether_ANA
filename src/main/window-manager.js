// 窗口管理：创建无边框窗口、加载主界面、转发窗口状态事件
// 适配任务栏最小化动画、托盘托管关闭拦截
const { BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow = null;

// 创建主窗口（无边框 + 自定义标题栏）
function createMainWindow() {
  mainWindow = new BrowserWindow({
    frame: false,                 // 移除原生标题栏，使用自定义标题栏
    transparent: true,            // 透明窗口：支持"透明背景"功能（关闭时由 .app-bg 不透明层遮挡，视觉无差异）
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,                  // 就绪后再显示，避免白屏
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,     // 上下文隔离（安全）
      nodeIntegration: false      // 禁用渲染层 Node（安全）
    }
  });

  // 通过自定义协议加载主界面（稳定 origin，支持 ES 模块与 CSP）
  mainWindow.loadURL('app://renderer/index.html');

  // 就绪后显示，消除白屏闪烁
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 将最大化 / 还原事件转发给渲染层，便于切换图标
  mainWindow.on('maximize', () => {
    // 透明无边框窗口在 Windows 上最大化会覆盖任务栏，此处限制到工作区
    if (process.platform === 'win32') {
      mainWindow.setBounds(screen.getPrimaryDisplay().workArea);
    }
    mainWindow.webContents.send('window-maximize-changed', true);
  });
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximize-changed', false));

  // 最小化 / 还原事件转发：渲染层据此播放过渡动画
  // 适配任务栏最小化动画：在最小化前发送预通知，让渲染层先播放收缩动画
  mainWindow.on('minimize', () => {
    // 通知渲染层开始最小化过渡动画
    mainWindow.webContents.send('window-minimize-changed', true);
  });
  mainWindow.on('restore', () => {
    // 通知渲染层播放还原动画
    mainWindow.webContents.send('window-minimize-changed', false);
  });

  // 关闭拦截：托盘开启时隐藏窗口而非关闭
  // 通过 before-quit 标志区分"真正退出"和"关闭按钮"
  mainWindow.on('close', (e) => {
    const trayManager = require('./tray-manager');
    // 尝试拦截：托盘开启时返回 true，隐藏窗口
    if (trayManager.interceptClose()) {
      e.preventDefault(); // 阻止窗口关闭
    }
    // 托盘未开启时，interceptClose 返回 false，不阻止关闭
  });

  // 调试：把渲染层控制台输出转发到主进程终端，便于排查加载错误
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[renderer] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('did-fail-load', (event, code, desc, validatedURL) => {
    console.error(`[did-fail-load] ${code} ${desc} ${validatedURL}`);
  });
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error(`[preload-error] ${preloadPath} ${error}`);
  });

  return mainWindow;
}

// 获取当前主窗口引用（供 IPC 处理器使用）
function getMainWindow() {
  return mainWindow;
}

module.exports = { createMainWindow, getMainWindow };
