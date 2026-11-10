// 设置控制器：自动保存、恢复默认、跟随系统、清理缓存、托盘开关
// 所有设置变更通过 settingsApi 保存到 "文档/NANSettings/settings.json"
import { showToast } from './utils.js';
import { t, setLanguage, getCurrentLang } from './i18n.js';
import { applyTheme, getTheme } from './theme.js';

// 当前设置缓存
let currentSettings = null;

// 自动保存（防抖）
let saveTimer = null;
function autoSave(settings) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (window.settingsApi && settings) {
      await window.settingsApi.save(settings);
    }
  }, 300);
}

// 收集当前 UI 状态为设置对象
function collectSettings() {
  const settings = {};

  // 主题
  const themeFollowBtn = document.getElementById('theme-follow-system');
  if (themeFollowBtn && themeFollowBtn.classList.contains('active')) {
    settings.theme = 'system';
  } else {
    settings.theme = getTheme();
  }

  // 磨砂背景
  const bgToggle = document.querySelector('[data-bg-toggle]');
  settings.frostedBg = bgToggle ? bgToggle.classList.contains('on') : false;

  // 背景透明度
  const slider = document.getElementById('opacity-slider');
  settings.bgOpacity = slider ? parseInt(slider.value, 10) : 0;

  // 开机自启动
  const autostartToggle = document.getElementById('autostart-toggle');
  settings.autostart = autostartToggle ? autostartToggle.classList.contains('on') : false;

  // 自动更新
  const autoupdateToggle = document.getElementById('autoupdate-toggle');
  settings.autoUpdate = autoupdateToggle ? autoupdateToggle.classList.contains('on') : false;

  // 托盘
  const trayToggle = document.getElementById('tray-toggle');
  settings.trayEnabled = trayToggle ? trayToggle.classList.contains('on') : false;

  // 语言
  const langFollowBtn = document.getElementById('lang-follow-system');
  if (langFollowBtn && langFollowBtn.classList.contains('active')) {
    settings.language = 'system';
  } else {
    settings.language = getCurrentLang();
  }

  // 保存位置
  settings.saveMode = localStorage.getItem('convert-save-mode') || 'default';
  settings.savePath = localStorage.getItem('convert-save-path') || '';

  // 自定义背景
  try {
    const raw = localStorage.getItem('app-bg-state');
    if (raw) {
      const parsed = JSON.parse(raw);
      settings.customBg = parsed.customBg || null;
    }
  } catch (e) {}

  return settings;
}

// 应用设置到 UI（使用 rAF 分帧，避免首次加载切换主题的集中重排导致卡顿）
function applySettings(settings) {
  currentSettings = settings;

  // ---------- 主题：先切换再跟随（避免多次触发 themechange 事件叠加） ----------
  const themeFollowBtn = document.getElementById('theme-follow-system');
  if (settings.theme === 'system') {
    if (themeFollowBtn) themeFollowBtn.classList.add('active');
    // 异步 IPC 获取系统主题后应用（rAF 批处理会自动合并）
    if (window.settingsApi) {
      window.settingsApi.getSystemTheme().then((sysTheme) => {
        applyTheme(sysTheme);
      });
    }
  } else {
    if (themeFollowBtn) themeFollowBtn.classList.remove('active');
    // 非跟随系统：仅在与当前不同时切换（减少动画抖动）
    if (getTheme() !== settings.theme) applyTheme(settings.theme);
  }

  // 第二帧：应用其他 UI 状态（与主题切换分帧，降低主线程阻塞）
  requestAnimationFrame(() => {
    // 磨砂背景
    const bgToggle = document.querySelector('[data-bg-toggle]');
    if (bgToggle) bgToggle.classList.toggle('on', !!settings.frostedBg);

    // 背景透明度
    const slider = document.getElementById('opacity-slider');
    if (slider && settings.bgOpacity !== undefined) {
      slider.value = settings.bgOpacity;
      slider.dispatchEvent(new Event('input'));
    }

    // 开机自启动
    const autostartToggle = document.getElementById('autostart-toggle');
    if (autostartToggle) autostartToggle.classList.toggle('on', !!settings.autostart);

    // 自动更新
    const autoupdateToggle = document.getElementById('autoupdate-toggle');
    if (autoupdateToggle) autoupdateToggle.classList.toggle('on', !!settings.autoUpdate);

    // 托盘
    const trayToggle = document.getElementById('tray-toggle');
    if (trayToggle) trayToggle.classList.toggle('on', !!settings.trayEnabled);

    // 保存位置
    if (settings.saveMode) {
      localStorage.setItem('convert-save-mode', settings.saveMode);
    }
    if (settings.savePath) {
      localStorage.setItem('convert-save-path', settings.savePath);
    }

    // 自定义背景
    if (settings.customBg) {
      try {
        const raw = localStorage.getItem('app-bg-state') || '{}';
        const parsed = JSON.parse(raw);
        parsed.customBg = settings.customBg;
        localStorage.setItem('app-bg-state', JSON.stringify(parsed));
      } catch (e) {}
    }

    // 第三帧：语言切换（最耗时的文字替换与淡入淡出，与主题完全分离）
    requestAnimationFrame(() => {
      const langFollowBtn = document.getElementById('lang-follow-system');
      if (settings.language === 'system') {
        if (langFollowBtn) langFollowBtn.classList.add('active');
        if (window.settingsApi) {
          window.settingsApi.getSystemLanguage().then((sysLang) => {
            setLanguage(sysLang);
          });
        }
      } else {
        if (langFollowBtn) langFollowBtn.classList.remove('active');
        setLanguage(settings.language);
      }
    });
  });
}

export function initSettingsController() {
  // ---------- 加载已保存设置 ----------
  if (window.settingsApi) {
    window.settingsApi.load().then((settings) => {
      applySettings(settings);
    });

    // 监听系统主题变化（跟随系统时自动切换：使用屏幕中心辐射过渡，自然流畅）
    window.settingsApi.onSystemThemeChange((sysTheme) => {
      const themeFollowBtn = document.getElementById('theme-follow-system');
      if (themeFollowBtn && themeFollowBtn.classList.contains('active')) {
        // 以屏幕中心为圆心播放圆形辐射过渡动画（不是点击事件，所以取中心）
        const cx = innerWidth / 2;
        const cy = innerHeight / 2;
        applyTheme(sysTheme, cx, cy);
      }
    });
  }

  // ---------- 主题：跟随系统按钮 ----------
  const themeFollowBtn = document.getElementById('theme-follow-system');
  if (themeFollowBtn) {
    themeFollowBtn.addEventListener('click', async () => {
      const isActive = themeFollowBtn.classList.toggle('active');
      // 按钮中心为圆心，做圆形辐射过渡（与主题按钮、Dock一致的动画）
      const rect = themeFollowBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (isActive) {
        // 跟随系统：获取系统主题并应用（带动画）
        if (window.settingsApi) {
          const sysTheme = await window.settingsApi.getSystemTheme();
          applyTheme(sysTheme, cx, cy);
        }
      } else {
        // 取消跟随：翻转一次主题（与当前相反，带圆形辐射动画）
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, cx, cy);
      }
      autoSave(collectSettings());
    });
  }

  // ---------- 语言：跟随系统按钮 ----------
  const langFollowBtn = document.getElementById('lang-follow-system');
  if (langFollowBtn) {
    langFollowBtn.addEventListener('click', async () => {
      const isActive = langFollowBtn.classList.toggle('active');
      if (isActive) {
        if (window.settingsApi) {
          const sysLang = await window.settingsApi.getSystemLanguage();
          setLanguage(sysLang);
        }
      }
      autoSave(collectSettings());
    });
  }

  // ---------- 所有 toggle 自动保存 ----------
  // 监听 toggle 的 class 变化（使用 mutation observer）
  const toggleIds = ['autostart-toggle', 'autoupdate-toggle', 'tray-toggle'];
  toggleIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      const observer = new MutationObserver(() => {
        autoSave(collectSettings());
      });
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    }
  });

  // 磨砂背景 toggle 也监听
  const bgToggle = document.querySelector('[data-bg-toggle]');
  if (bgToggle) {
    const observer = new MutationObserver(() => {
      autoSave(collectSettings());
    });
    observer.observe(bgToggle, { attributes: true, attributeFilter: ['class'] });
  }

  // ---------- 托盘开关 ----------
  const trayToggle = document.getElementById('tray-toggle');
  if (trayToggle && window.trayApi) {
    trayToggle.addEventListener('click', async () => {
      // delegateToggles 在 document 级处理（冒泡后切换 class）
      // 使用 rAF 确保读取到切换后的状态
      requestAnimationFrame(async () => {
        const enabled = trayToggle.classList.contains('on');
        await window.trayApi.toggle(enabled);
        autoSave(collectSettings());
      });
    });
  }

  // ---------- 自启动开关 ----------
  const autostartToggleEl = document.getElementById('autostart-toggle');
  if (autostartToggleEl && window.autostartApi) {
    autostartToggleEl.addEventListener('click', async () => {
      requestAnimationFrame(async () => {
        const enabled = autostartToggleEl.classList.contains('on');
        // 同步到系统注册表（通过 Electron 的 setLoginItemSettings）
        await window.autostartApi.set(enabled);
        autoSave(collectSettings());
      });
    });
  }

  // ---------- 清理缓存 ----------
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  if (clearCacheBtn && window.cacheApi) {
    clearCacheBtn.addEventListener('click', async () => {
      const result = await window.cacheApi.clear();
      if (result.ok) {
        showToast(t('toast.cacheCleared'));
      } else {
        showToast(t('toast.cacheClearError', { msg: result.error || '' }));
      }
    });
  }

  // ---------- 恢复默认设置 ----------
  const restoreBtn = document.getElementById('restore-settings-btn');
  if (restoreBtn && window.settingsApi) {
    restoreBtn.addEventListener('click', async () => {
      const defaults = await window.settingsApi.restore();
      applySettings(defaults);
      showToast(t('toast.settingsRestored'));
    });
  }

  // ---------- 主题切换时自动保存 ----------
  document.addEventListener('themechange', () => {
    // 主题切换时，如果不在跟随系统模式，自动保存
    const themeFollowBtn = document.getElementById('theme-follow-system');
    if (themeFollowBtn && !themeFollowBtn.classList.contains('active')) {
      autoSave(collectSettings());
    }
  });

  // ---------- 语言切换时自动保存 ----------
  document.addEventListener('langchange', () => {
    const langFollowBtn = document.getElementById('lang-follow-system');
    if (langFollowBtn && !langFollowBtn.classList.contains('active')) {
      autoSave(collectSettings());
    }
  });

  // ---------- 透明度变化时自动保存 ----------
  const slider = document.getElementById('opacity-slider');
  if (slider) {
    slider.addEventListener('change', () => {
      autoSave(collectSettings());
    });
  }
}
