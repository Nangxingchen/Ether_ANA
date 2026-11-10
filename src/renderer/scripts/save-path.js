// 设置面板：保存位置 UI 控制
// BitDock 式可拖动切换：点击移动即拖拽，松开选择
// 2 段分段控件（default / custom），指示条跟随指针丝滑移动
import { showToast, reflow } from './utils.js';
import { t } from './i18n.js';

// localStorage 键（与 tools.js 保持一致）
const SAVE_MODE_KEY = 'convert-save-mode';
const SAVE_PATH_KEY = 'convert-save-path';

// 拖拽阈值：移动超过此像素数即开始拖拽
const DRAG_THRESHOLD = 4;

export function initSavePath() {
  const switcher = document.getElementById('save-path-switcher');
  const indicator = document.getElementById('save-path-indicator');
  const pathText = document.getElementById('save-path-text');
  const pathDisplay = document.getElementById('save-path-display');
  const selectBtn = document.getElementById('save-select-btn');

  if (!switcher || !indicator || !pathText) return;

  const btns = Array.from(switcher.querySelectorAll('.save-path-btn'));

  // 文档目录缓存（仅用于显示）
  let docsDir = '';
  let customDir = localStorage.getItem(SAVE_PATH_KEY) || '';
  let currentMode = localStorage.getItem(SAVE_MODE_KEY) || 'default';

  // 获取系统文档目录
  if (window.saveAndConvert) {
    window.saveAndConvert.getDocumentsPath().then((p) => {
      if (p) {
        docsDir = p;
        refreshDisplay();
      }
    }).catch(() => {});
  }

  /** 移动指示器到目标按钮 */
  function moveIndicator(btn) {
    if (!indicator || !btn) return;
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.height = btn.offsetHeight + 'px';
    indicator.style.transform = `translate(${btn.offsetLeft}px, 0)`;
    indicator.classList.add('active');
  }

  /** 同步按钮选中态 + 滑动指示器 */
  function applyMode(mode, animate = true) {
    currentMode = mode;
    btns.forEach((b) => b.classList.toggle('active', b.dataset.saveMode === mode));
    localStorage.setItem(SAVE_MODE_KEY, mode);
    const activeBtn = btns.find((b) => b.dataset.saveMode === mode);
    if (activeBtn) {
      if (animate) {
        requestAnimationFrame(() => moveIndicator(activeBtn));
      } else {
        moveIndicator(activeBtn);
      }
    }
    refreshDisplay();
  }

  /** 刷新路径显示文本 */
  function refreshDisplay() {
    let displayPath = '';
    if (currentMode === 'default') {
      displayPath = docsDir ? docsDir : (t ? t('settings.saveDefault') : '系统文档目录');
    } else {
      displayPath = customDir || (t ? t('settings.saveDefault') : '系统文档目录');
    }
    pathText.textContent = displayPath;
    pathText.title = displayPath;
  }

  // ---------- BitDock 式拖拽交互 ----------
  const drag = {
    pressing: false,    // 是否按下中
    active: false,      // 是否进入拖拽
    startBtn: null,     // 按下的按钮
    originMode: null,   // 按下前已选中的模式
    startX: 0,
    startY: 0,
    btnWidth: 0,
    btnHeight: 0,
  };

  // 按钮指针按下：记录起点
  btns.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      drag.pressing = true;
      drag.active = false;
      drag.startBtn = btn;
      drag.originMode = currentMode;
      drag.btnWidth = btn.offsetWidth;
      drag.btnHeight = btn.offsetHeight;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
    });
  });

  // 文档级指针移动：检测拖拽阈值 + 跟随指针
  document.addEventListener('pointermove', (e) => {
    if (!drag.pressing) return;
    if (!drag.active) {
      const dx = Math.abs(e.clientX - drag.startX);
      const dy = Math.abs(e.clientY - drag.startY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
      startDrag();
    }
    onDragMove(e);
  });

  // 指针抬起：拖拽结束选择落点 / 普通点击切换
  document.addEventListener('pointerup', (e) => {
    if (drag.active) {
      onDragEnd(e);
      return;
    }
    if (drag.pressing && drag.startBtn) {
      // 普通点击：切换到按下的按钮
      const mode = drag.startBtn.dataset.saveMode;
      if (mode !== currentMode) {
        applyMode(mode);
      }
    }
    drag.pressing = false;
  });

  document.addEventListener('pointercancel', () => {
    if (drag.active) cancelDrag();
    drag.pressing = false;
  });

  // 进入拖拽：指示条定位到按下按钮处
  function startDrag() {
    drag.active = true;
    const btn = drag.startBtn;
    if (!btn || !indicator) return;
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.height = btn.offsetHeight + 'px';
    indicator.style.transform = `translate(${btn.offsetLeft}px, 0)`;
    indicator.classList.add('dragging');
  }

  // 拖拽移动：指示条水平跟随指针，限制在切换器内
  function onDragMove(e) {
    if (!indicator || !drag.startBtn) return;
    const rect = switcher.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(relX - drag.btnWidth / 2, switcher.clientWidth - drag.btnWidth));
    indicator.style.transform = `translate(${clampedX}px, 0)`;
    // 标记指针下方的按钮
    const target = btnUnderPointer(e);
    btns.forEach((b) => b.classList.toggle('drop-target', b === target));
  }

  // 拖拽结束：选择指针下方的按钮
  function onDragEnd(e) {
    const rect = switcher.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right;
    indicator.classList.remove('dragging');
    reflow(indicator);
    btns.forEach((b) => b.classList.remove('drop-target'));

    if (inside) {
      const target = btnUnderPointer(e);
      if (target) {
        applyMode(target.dataset.saveMode);
      } else {
        applyMode(drag.originMode);
      }
    } else {
      applyMode(drag.originMode);
    }
    drag.active = false;
    drag.pressing = false;
  }

  // 取消拖拽：回弹
  function cancelDrag() {
    if (indicator) {
      indicator.classList.remove('dragging');
      reflow(indicator);
    }
    btns.forEach((b) => b.classList.remove('drop-target'));
    applyMode(drag.originMode);
    drag.active = false;
  }

  // 查找指针下方的按钮
  function btnUnderPointer(e) {
    return btns.find((b) => {
      const r = b.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right;
    }) || null;
  }

  // ---------- 选择按钮：自定义目录 ----------
  selectBtn && selectBtn.addEventListener('click', async () => {
    if (currentMode !== 'custom') {
      applyMode('custom');
    }
    if (!window.saveAndConvert) return;
    const res = await window.saveAndConvert.selectSaveDir();
    if (res && res.dirPath) {
      customDir = res.dirPath;
      localStorage.setItem(SAVE_PATH_KEY, customDir);
      refreshDisplay();
      showToast(t('toast.savePathSet'));
    }
  });

  // 初始态：加载上次选择
  applyMode(currentMode, false);

  // 语言切换后刷新路径占位符
  document.addEventListener('langchange', () => {
    refreshDisplay();
  });

  // ---------- 语言切换（i18n 淡入淡出 570ms）完成后：
  //            重新测量按钮宽度并定位指示器，确保框选准确 ----------
  document.addEventListener('langchange', () => {
    // 淡出 + 文本替换 + 淡入总时长约 570ms
    // 双重 rAF 确保 DOM 文字与宽度测量全部稳定
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyMode(currentMode, true);
        });
      });
    }, 580);
  });
}
