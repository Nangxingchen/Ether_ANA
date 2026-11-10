// 渲染进程入口：按顺序初始化各功能模块
import { initTitlebar } from './titlebar.js';
import { initDock } from './dock.js';
import { pageManager } from './page-manager.js';
import { delegateToggles } from './utils.js';
import { initSettings } from './settings.js';
import { initTools } from './tools.js';
import { initBackground } from './background.js';
import { initAbout } from './about.js';
import { initI18n } from './i18n.js';
import { initSavePath } from './save-path.js';
import { initSettingsController } from './settings-controller.js';
// 主题模块（无初始化函数，导入以确保加载；切换逻辑由 titlebar/settings 调用）
import './theme.js';

// 应用初始化
function init() {
  initI18n();           // 初始化国际化（须在其他模块前，确保文本先替换）
  pageManager.init();   // 初始化页面轨道
  initTitlebar();       // 初始化标题栏按钮 + 主题切换按钮
  initDock();           // 初始化底部 Dock
  initTools();          // 初始化工具页文件转换
  initSettings();       // 初始化设置页主题开关 + 语言选择器
  initBackground();     // 初始化透明背景控制
  initAbout();          // 初始化关于页 NAN 动画 + 头像唱片动画
  initSavePath();       // 初始化设置页保存位置选择器
  initSettingsController(); // 初始化设置自动保存 + 恢复 + 跟随系统 + 缓存清理 + 托盘
  delegateToggles();    // 设置页演示开关交互（非主题开关）
}

// 等 DOM 就绪后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
