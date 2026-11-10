// 系统托盘管理器：可开关的托盘图标与菜单
// 托盘开启时：右上角退出按钮 → 隐藏到托盘；右键菜单 → 真正退出
const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindowRef = null;

// 创建托盘图标与菜单
function createTray(mainWindow) {
  if (tray) return tray;
  mainWindowRef = mainWindow;

  // 优先使用专用托盘小图标（16x16），回退到应用图标
  const trayIconPath = path.join(__dirname, '../../assets/tray-icon.png');
  const appIconPath = path.join(__dirname, '../../assets/icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(trayIconPath);
    if (trayIcon.isEmpty()) {
      // 回退到应用图标并缩放到 16x16
      trayIcon = nativeImage.createFromPath(appIconPath);
      const resized = trayIcon.resize({ width: 16, height: 16 });
      if (!resized.isEmpty()) trayIcon = resized;
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('以太NAN文件转换器');

  // 托盘右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => showMainWindow(),
    },
    {
      label: '最小化到托盘',
      click: () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        // 真正退出：先销毁托盘，再退出应用
        destroyTray();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  // 左键点击托盘图标：显示主窗口
  tray.on('click', () => {
    showMainWindow();
  });

  // 双击也显示窗口（兼容用户习惯）
  tray.on('double-click', () => {
    showMainWindow();
  });

  return tray;
}

// 显示主窗口（从托盘恢复）
function showMainWindow() {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
  if (mainWindowRef.isMinimized()) mainWindowRef.restore();
  if (!mainWindowRef.isVisible()) {
    mainWindowRef.show();
  }
  mainWindowRef.focus();
}

// 拦截窗口关闭：托盘开启时改为隐藏
// 返回 true 表示已拦截（应阻止关闭），false 表示允许关闭
function interceptClose() {
  if (tray && mainWindowRef && !mainWindowRef.isDestroyed()) {
    // 托盘开启：隐藏窗口而非关闭
    mainWindowRef.hide();
    return true; // 已拦截
  }
  return false; // 允许关闭
}

// 销毁托盘
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

// 托盘是否已创建
function isTrayCreated() {
  return tray !== null;
}

module.exports = {
  createTray,
  destroyTray,
  isTrayCreated,
  interceptClose,
  showMainWindow,
};
