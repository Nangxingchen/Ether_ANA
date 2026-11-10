// 设置管理器：自动保存 / 加载 / 恢复默认设置
// 设置文件保存在 "文档/NANSettings/settings.json"，无此文件夹时自动创建
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// 默认设置（需求 12.7：恢复设置后的配置）
const DEFAULT_SETTINGS = {
  theme: 'system',           // 主题：system（跟随系统）| dark | light
  frostedBg: false,          // 磨砂背景：关闭
  customBg: null,            // 自定义背景：关闭
  bgOpacity: 0,             // 背景透明度
  autostart: true,          // 开机自启动：打开
  autoUpdate: true,         // 自动检查更新：打开
  language: 'system',       // 界面语言：跟随系统
  saveMode: 'default',      // 保存位置：默认（系统文档目录）
  savePath: '',             // 自定义保存路径
  trayEnabled: false,        // 托盘功能：默认关闭
};

// 设置文件路径
function getSettingsDir() {
  return path.join(app.getPath('documents'), 'NANSettings');
}

function getSettingsFile() {
  return path.join(getSettingsDir(), 'settings.json');
}

// 确保设置目录存在
function ensureDir() {
  const dir = getSettingsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// 加载设置：若文件不存在则返回默认值
function loadSettings() {
  try {
    ensureDir();
    const file = getSettingsFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw);
      // 合并默认值，确保新字段有值
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    // 读取失败时静默回退到默认值
  }
  return { ...DEFAULT_SETTINGS };
}

// 保存设置：自动写入 JSON 文件
function saveSettings(settings) {
  try {
    ensureDir();
    const file = getSettingsFile();
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

// 恢复默认设置
function restoreDefaults() {
  try {
    ensureDir();
    const file = getSettingsFile();
    fs.writeFileSync(file, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    return { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

// 获取系统语言对应的 app 语言代码
function getSystemLanguage() {
  const locale = app.getSystemLocale() || 'zh-CN';
  // 映射系统 locale 到支持的语言
  const map = {
    'zh-CN': 'zh-CN', 'zh-SG': 'zh-CN', 'zh-CHS': 'zh-CN',
    'zh-TW': 'zh-TW', 'zh-HK': 'zh-TW', 'zh-CHT': 'zh-TW',
    'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en',
    'ja-JP': 'ja', 'ja': 'ja',
    'ko-KR': 'ko', 'ko': 'ko',
  };
  return map[locale] || 'zh-CN';
}

module.exports = {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  restoreDefaults,
  getSystemLanguage,
  getSettingsDir,
};
