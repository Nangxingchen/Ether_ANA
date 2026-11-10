// 标题栏逻辑：最小化 / 最大化 / 关闭按钮，主题切换按钮
// Win10/11 原生动画适配：最小化向任务栏缩小淡出、最大化交叉淡入淡出、关闭淡出
import { toggleTheme, getTheme } from './theme.js';
import { t } from './i18n.js';

export function initTitlebar() {
  const wc = window.windowControls;
  if (!wc) {
    console.warn('windowControls 未注入，请检查 preload 是否加载');
    return;
  }

  const btnMin = document.getElementById('btn-minimize');
  const btnMax = document.getElementById('btn-maximize');
  const btnClose = document.getElementById('btn-close');
  const maxIcon = btnMax.querySelector('i');
  const appEl = document.getElementById('app');

  // ---------- 启动动画：从轻微缩小态淡入 ----------
  if (appEl) {
    appEl.classList.add('starting');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => appEl.classList.remove('starting'));
    });
  }

  // ---------- 最小化：向任务栏方向缩小 + 淡出 ----------
  btnMin.addEventListener('click', () => {
    if (appEl) {
      appEl.classList.add('minimizing');
      setTimeout(() => wc.minimize(), 180);
    } else {
      wc.minimize();
    }
  });

  // 窗口还原时播放淡入放大动画（从最小化态恢复）
  if (wc.onMinimizeChange) {
    wc.onMinimizeChange((isMinimized) => {
      if (!isMinimized && appEl) {
        // 还原：重置到隐藏态再触发淡入
        appEl.classList.add('minimizing');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            appEl.classList.remove('minimizing');
          });
        });
      }
    });
  }

  // ---------- 最大化 / 还原：交叉淡入淡出 ----------
  btnMax.addEventListener('click', async () => {
    if (appEl) {
      // 淡出 → 窗口尺寸变化 → 淡入
      appEl.classList.add('maximizing');
      await new Promise((r) => setTimeout(r, 150));
      await wc.maximize();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => appEl.classList.remove('maximizing'));
      });
    } else {
      await wc.maximize();
    }
    refreshMaxIcon(await wc.isMaximized());
  });

  // 双击标题栏等触发的最大化/还原：同样播放交叉淡入淡出
  wc.onMaximizeChange((isMaximized) => {
    if (appEl) {
      appEl.classList.add('maximizing');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => appEl.classList.remove('maximizing'));
      });
    }
    refreshMaxIcon(isMaximized);
  });

  // ---------- 关闭：托盘开启时淡出隐藏到托盘，否则淡出后关闭 ----------
  btnClose.addEventListener('click', async () => {
    const trayEnabled = window.trayApi && await window.trayApi.getState();
    if (appEl) {
      if (trayEnabled) {
        // 托盘开启：播放淡出动画后隐藏到托盘（主进程 close 事件会拦截并 hide）
        appEl.classList.add('closing');
        setTimeout(() => {
          wc.close(); // 主进程拦截 → hide()
          // 隐藏后移除动画类，以便下次显示时正常
          setTimeout(() => appEl.classList.remove('closing'), 300);
        }, 180);
      } else {
        // 无托盘：淡出后真正关闭
        appEl.classList.add('closing');
        setTimeout(() => wc.close(), 180);
      }
    } else {
      wc.close();
    }
  });

  // 根据状态切换图标：未最大化→bi-square（最大化），已最大化→bi-copy（还原）
  function refreshMaxIcon(isMaximized) {
    maxIcon.className = isMaximized ? 'bi bi-copy' : 'bi bi-square';
    btnMax.classList.toggle('is-maximized', !!isMaximized);
    btnMax.title = isMaximized ? t('win.restore') : t('win.maximize');
  }

  // 初始化时同步一次图标状态
  wc.isMaximized().then(refreshMaxIcon);

  // 语言切换后刷新按钮 title 文本
  document.addEventListener('langchange', () => {
    wc.isMaximized().then(refreshMaxIcon);
  });

  // ---------- 主题切换按钮 ----------
  initThemeButton();
}

// 主题按钮：点击时以按钮位置为圆心做圆形辐射切换
function initThemeButton() {
  const btnTheme = document.getElementById('btn-theme');
  if (!btnTheme) return;
  const themeIcon = btnTheme.querySelector('i');

  // 点击触发圆形辐射切换主题
  btnTheme.addEventListener('click', (event) => {
    toggleTheme(event.clientX, event.clientY);
    // 手动切换主题时取消"跟随系统"
    const themeFollowBtn = document.getElementById('theme-follow-system');
    if (themeFollowBtn) themeFollowBtn.classList.remove('active');
  });

  // 同步图标：深色模式显示 bi-sun（点击切到亮色），亮色模式显示 bi-moon-stars（点击切到深色）
  function syncThemeIcon() {
    const theme = getTheme();
    themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
  }

  // 监听主题变化事件，刷新图标
  document.addEventListener('themechange', syncThemeIcon);
  // 初始化时同步一次
  syncThemeIcon();
}
