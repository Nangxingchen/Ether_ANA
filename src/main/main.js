// 主进程入口：应用生命周期、自定义协议、窗口创建、快捷键注册
const { app, BrowserWindow, ipcMain, protocol, net, dialog, shell, nativeTheme, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const windowManager = require('./window-manager');
const shortcutManager = require('./shortcut-manager');
const settingsManager = require('./settings-manager');
const trayManager = require('./tray-manager');
const converter = require('./converter');

// Windows 任务栏图标关联：必须在 app ready 之前设置
// AppUserModelId 让 Windows 将任务栏图标、通知、快捷方式正确关联到此应用
app.setAppUserModelId('com.aether.nan-converter');

// ---------- 单实例锁：保证一台设备只能打开一个进程 ----------
// 必须在 app ready 之前调用 requestSingleInstanceLock()
// 第二个实例启动时：直接退出，并让已有实例的窗口前置显示
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 当前是第二个实例，立即退出
  app.quit();
} else {
  // 当前是主实例：监听第二个实例启动事件
  app.on('second-instance', () => {
    // 第二个实例启动时：恢复并聚焦主窗口
    const win = windowManager.getMainWindow();
    if (win) {
      // 如果窗口被托盘隐藏，先恢复显示
      if (!win.isVisible()) {
        win.show();
      }
      // 如果最小化，先还原
      if (win.isMinimized()) {
        win.restore();
      }
      // 前置聚焦
      win.focus();
    }
  });
}

// 声明 app:// 与 media:// 为特权协议（必须在 app ready 之前调用）
// app://  —— 渲染层稳定 origin，支持 ES 模块加载与 CSP
// media:// —— 用于加载用户选择的自定义背景文件（图片 / 视频）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false
    }
  },
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false
    }
  }
]);

let mainWindow = null;

// 注册 app:// 自定义协议：将请求映射到 src/renderer 目录下的磁盘文件
function registerAppProtocol() {
  const base = path.join(__dirname, '..', 'renderer');
  protocol.handle('app', (request) => {
    const u = new URL(request.url);
    // 拼接并规范化磁盘路径
    const filePath = path.normalize(path.join(base, decodeURIComponent(u.pathname)));
    // 安全：禁止路径穿越越出 renderer 目录
    if (!filePath.startsWith(base)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (!fs.existsSync(filePath)) {
      return new Response('Not Found', { status: 404 });
    }
    // 通过 net.fetch 读取本地文件，自动带上正确的 MIME 类型
    return net.fetch(url.pathToFileURL(filePath).toString());
  });
}

// 注册窗口控制 IPC 通道（渲染层通过 preload 调用）
function registerIpc() {
  ipcMain.handle('window-minimize', () => {
    const win = windowManager.getMainWindow();
    if (win) win.minimize();
  });
  ipcMain.handle('window-maximize', () => {
    const win = windowManager.getMainWindow();
    if (!win) return;
    // 已最大化则还原，否则最大化
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.handle('window-close', () => {
    const win = windowManager.getMainWindow();
    if (win) win.close();
  });
  ipcMain.handle('window-is-maximized', () => {
    const win = windowManager.getMainWindow();
    return win ? win.isMaximized() : false;
  });

  // 自定义背景文件选择对话框
  ipcMain.handle('dialog-select-background', async () => {
    const win = windowManager.getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: '选择自定义背景',
      properties: ['openFile'],
      filters: [
        {
          name: '图片与视频',
          extensions: [
            'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp',
            'mp4', 'webm', 'mov', 'mkv', 'avi',
          ],
        },
      ],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return { filePath: result.filePaths[0] };
  });

  // 获取系统文档目录
  ipcMain.handle('get-documents-path', () => {
    return app.getPath('documents');
  });

  // 选择保存目录对话框
  ipcMain.handle('dialog-select-save-dir', async () => {
    const win = windowManager.getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: '选择保存位置',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return { dirPath: result.filePaths[0] };
  });

  // 在资源管理器/访达中打开指定目录
  ipcMain.handle('open-path-in-shell', (_e, targetPath) => {
    if (!targetPath) return false;
    shell.openPath(targetPath).catch(() => {});
    return true;
  });

  // 转换文件：完整转换功能 + NANConvert 文件夹结构
  ipcMain.handle('convert-file', async (_e, { inputPath, basePath, targetFormat, lang }) => {
    const win = windowManager.getMainWindow();
    try {
      const result = await converter.convertFile(
        { inputPath, basePath, targetFormat, lang },
        (progress) => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('convert-progress', { inputPath, progress });
          }
        }
      );
      return result;
    } catch (err) {
      return { ok: false, error: err.message || '转换失败' };
    }
  });

  // ---------- 设置管理 IPC ----------
  // 加载设置
  ipcMain.handle('settings:load', () => {
    return settingsManager.loadSettings();
  });

  // 保存设置（自动保存）
  ipcMain.handle('settings:save', (_e, settings) => {
    return settingsManager.saveSettings(settings);
  });

  // 恢复默认设置
  ipcMain.handle('settings:restore', () => {
    const defaults = settingsManager.restoreDefaults();
    // 应用系统语言设置
    applySystemSettings(defaults);
    return defaults;
  });

  // 获取系统语言
  ipcMain.handle('system:get-language', () => {
    return settingsManager.getSystemLanguage();
  });

  // 获取系统主题
  ipcMain.handle('system:get-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // 获取应用版本号（从 package.json 读取，文件变更即同步）
  ipcMain.handle('app:get-version', () => {
    try {
      const pkgPath = path.join(app.getAppPath(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.0';
    } catch (e) {
      return '1.0.0';
    }
  });

  // 监听系统主题变化，转发给渲染层
  nativeTheme.on('updated', () => {
    const win = windowManager.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
  });

  // ---------- 缓存清理 IPC ----------
  ipcMain.handle('cache:clear', async () => {
    try {
      const win = windowManager.getMainWindow();
      if (win) {
        // 清除 session 缓存
        await win.webContents.session.clearCache();
        await win.webContents.session.clearStorageData({
          storages: ['cachestorage', 'serviceworkers', 'shadercache'],
        });
      }
      return { ok: true, message: '缓存已清理' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // ---------- 托盘管理 IPC ----------
  ipcMain.handle('tray:toggle', (_e, enabled) => {
    const win = windowManager.getMainWindow();
    if (enabled) {
      trayManager.createTray(win);
    } else {
      // 托盘关闭时，如果窗口当前是隐藏的，显示出来
      if (win && !win.isDestroyed() && !win.isVisible()) {
        win.show();
        win.focus();
      }
      trayManager.destroyTray();
    }
    return trayManager.isTrayCreated();
  });

  ipcMain.handle('tray:get-state', () => {
    return trayManager.isTrayCreated();
  });

  // ---------- 自启动管理 IPC ----------
  // 获取自启动状态
  ipcMain.handle('autostart:get', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  // 设置自启动
  ipcMain.handle('autostart:set', (_e, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled });
    return app.getLoginItemSettings().openAtLogin;
  });
}

// 应用系统设置到主进程（主题、自启动等）
function applySystemSettings(settings) {
  // 主题：跟随系统时设置 nativeTheme.source = 'system'
  if (settings.theme === 'system') {
    nativeTheme.themeSource = 'system';
  } else {
    nativeTheme.themeSource = settings.theme;
  }
  // 开机自启动
  app.setLoginItemSettings({ openAtLogin: !!settings.autostart });
}

// 注册 media:// 自定义协议：通过 ?file=<绝对路径> 加载本地媒体文件
function registerMediaProtocol() {
  protocol.handle('media', (request) => {
    const u = new URL(request.url);
    const filePath = u.searchParams.get('file');
    if (!filePath) return new Response('Bad Request', { status: 400 });
    if (!fs.existsSync(filePath)) return new Response('Not Found', { status: 404 });
    // 通过 net.fetch 读取本地文件，自动带上正确的 MIME 类型
    return net.fetch(url.pathToFileURL(filePath).toString());
  });
}

app.whenReady().then(() => {
  registerAppProtocol();   // 注册 app:// 自定义协议
  registerMediaProtocol(); // 注册 media:// 媒体协议（自定义背景）
  registerIpc();           // 注册窗口控制 + 背景 + 转换 + 设置 + 托盘 IPC
  mainWindow = windowManager.createMainWindow();
  shortcutManager.register(mainWindow);

  // 加载保存的设置并应用到主进程
  const savedSettings = settingsManager.loadSettings();
  applySystemSettings(savedSettings);

  // 如果设置中启用了托盘，则创建
  if (savedSettings.trayEnabled) {
    trayManager.createTray(mainWindow);
  }

  // macOS：点击 Dock 图标重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = windowManager.createMainWindow();
      shortcutManager.register(mainWindow);
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 退出前注销全局快捷键，清理托盘
app.on('will-quit', () => {
  shortcutManager.unregister();
  trayManager.destroyTray();
});
