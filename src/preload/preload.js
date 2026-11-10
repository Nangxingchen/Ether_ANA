// 预加载脚本：通过 contextBridge 向渲染层暴露安全的窗口控制 API
// 渲染层只能访问暴露的对象方法，无法直接接触 Node / ipcRenderer
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('windowControls', {
  // 最小化窗口
  minimize: () => ipcRenderer.invoke('window-minimize'),
  // 最大化 / 还原（切换）
  maximize: () => ipcRenderer.invoke('window-maximize'),
  // 关闭窗口
  close: () => ipcRenderer.invoke('window-close'),
  // 查询当前是否最大化
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  // 监听最大化状态变化，返回取消订阅函数
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximize-changed', handler);
    return () => ipcRenderer.removeListener('window-maximize-changed', handler);
  },
  // 监听最小化 / 还原状态变化（用于播放过渡动画），返回取消订阅函数
  onMinimizeChange: (callback) => {
    const handler = (_event, isMinimized) => callback(isMinimized);
    ipcRenderer.on('window-minimize-changed', handler);
    return () => ipcRenderer.removeListener('window-minimize-changed', handler);
  }
});

// 自定义背景文件选择对话框 API
contextBridge.exposeInMainWorld('backgroundDialog', {
  // 打开文件选择对话框，返回 { filePath } 或 null
  select: () => ipcRenderer.invoke('dialog-select-background'),
});

// 文件保存位置与转换 API
contextBridge.exposeInMainWorld('saveAndConvert', {
  // 获取系统文档目录（默认保存位置）
  getDocumentsPath: () => ipcRenderer.invoke('get-documents-path'),
  // 选择自定义保存目录，返回 { dirPath } 或 null
  selectSaveDir: () => ipcRenderer.invoke('dialog-select-save-dir'),
  // 在资源管理器 / 访达中打开指定路径
  openPath: (p) => ipcRenderer.invoke('open-path-in-shell', p),
  // 启动文件转换，返回 { ok, outputPath, outputDir, error }
  convertFile: (payload) => ipcRenderer.invoke('convert-file', payload),
  // 监听转换进度，返回取消订阅函数
  onProgress: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('convert-progress', handler);
    return () => ipcRenderer.removeListener('convert-progress', handler);
  },
  // 通过 webUtils 解析 File 对象的绝对路径（Electron 32+ 替代已弃用的 File.path）
  getFilePath: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (_) {
      // 降级：尝试已弃用的 File.path 属性
      return file.path || '';
    }
  },
});

// 设置管理 API
contextBridge.exposeInMainWorld('settingsApi', {
  // 加载设置
  load: () => ipcRenderer.invoke('settings:load'),
  // 保存设置
  save: (settings) => ipcRenderer.invoke('settings:save', settings),
  // 恢复默认设置
  restore: () => ipcRenderer.invoke('settings:restore'),
  // 获取系统语言
  getSystemLanguage: () => ipcRenderer.invoke('system:get-language'),
  // 获取系统主题
  getSystemTheme: () => ipcRenderer.invoke('system:get-theme'),
  // 获取应用版本号（从 package.json 读取）
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  // 监听系统主题变化
  onSystemThemeChange: (cb) => {
    const handler = (_e, theme) => cb(theme);
    ipcRenderer.on('system-theme-changed', handler);
    return () => ipcRenderer.removeListener('system-theme-changed', handler);
  },
});

// 缓存清理 API
contextBridge.exposeInMainWorld('cacheApi', {
  clear: () => ipcRenderer.invoke('cache:clear'),
});

// 托盘管理 API
contextBridge.exposeInMainWorld('trayApi', {
  toggle: (enabled) => ipcRenderer.invoke('tray:toggle', enabled),
  getState: () => ipcRenderer.invoke('tray:get-state'),
});

// 自启动管理 API
contextBridge.exposeInMainWorld('autostartApi', {
  get: () => ipcRenderer.invoke('autostart:get'),
  set: (enabled) => ipcRenderer.invoke('autostart:set', enabled),
});
