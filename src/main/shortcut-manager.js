// 快捷键管理：禁用原生调试 / 全屏 / 刷新快捷键
const { globalShortcut, Menu } = require('electron');

// 需要全局屏蔽的快捷键（系统级，避免 F11 触发全屏）
const GLOBAL_BLOCKED = ['F11'];

// 注册屏蔽逻辑
function register(win) {
  // 移除应用菜单，避免原生 reload / devtools / togglefullscreen 角色快捷键
  Menu.setApplicationMenu(null);

  // 全局注册屏蔽（失败不报错，可能与系统其他应用冲突）
  GLOBAL_BLOCKED.forEach((accel) => {
    try {
      globalShortcut.register(accel, () => {});
    } catch (e) {
      /* 忽略注册失败 */
    }
  });

  // 在渲染层输入事件中拦截调试 / 刷新 / 全屏快捷键
  win.webContents.on('before-input-event', (event, input) => {
    const key = input.key;
    const ctrl = input.control;
    const shift = input.shift;

    // F12：开发者工具
    if (key === 'F12') { event.preventDefault(); return; }
    // F5 / Ctrl+R：刷新页面
    if (key === 'F5' || (ctrl && key.toLowerCase() === 'r')) { event.preventDefault(); return; }
    // F11：全屏切换
    if (key === 'F11') { event.preventDefault(); return; }
    // Ctrl+Shift+I：开发者工具
    if (ctrl && shift && key.toLowerCase() === 'i') { event.preventDefault(); return; }
    // Ctrl+Shift+J：开发者工具控制台
    if (ctrl && shift && key.toLowerCase() === 'j') { event.preventDefault(); return; }
  });
}

// 注销全局快捷键
function unregister() {
  GLOBAL_BLOCKED.forEach((accel) => {
    try { globalShortcut.unregister(accel); } catch (e) { /* 忽略 */ }
  });
  globalShortcut.unregisterAll();
}

module.exports = { register, unregister };
