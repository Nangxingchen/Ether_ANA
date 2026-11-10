// 背景管理：磨砂玻璃 + 自定义背景（图片 / 视频），支持开关、透明度调节、视频验证与持久化
// 依赖主进程 transparent: true 透明窗口 + media:// 协议加载本地媒体文件

import { showToast } from './utils.js';
import { t } from './i18n.js';

const STORAGE_KEY = 'app-bg-state';
const DEFAULT_STATE = {
  enabled: false,       // 磨砂背景开关
  opacity: 0,           // 显示值 0-100（映射到实际背景透明度 80-100）
  customBg: null,       // { type: 'image'|'video', path: string } | null
};

// 最低实际不透明度：滑块显示 0% 时背景仍保留 80% 不透明度
const MIN_OPACITY = 80;
const MAX_OPACITY = 100;

// 显示值（0-100）映射为实际不透明度（80-100）
function toActualOpacity(displayValue) {
  return MIN_OPACITY + (displayValue / 100) * (MAX_OPACITY - MIN_OPACITY);
}

// 支持的图片 / 视频扩展名
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
const MAX_VIDEO_DURATION = 30;   // 视频最大时长（秒）
const MAX_VIDEO_WIDTH = 1920;    // 视频最大宽度（1080p）
const MAX_VIDEO_HEIGHT = 1080;

let bgLayer = null;        // .app-bg 主题背景层
let mediaLayer = null;     // .bg-media-layer 自定义背景媒体层
let imageEl = null;        // <img> 背景图片
let videoEl = null;        // <video> 背景视频
let toggleEl = null;       // 磨砂背景开关
let controlEl = null;      // 透明度滑块容器
let sliderEl = null;       // 滑块
let valueEl = null;        // 数值显示
let bgSelectBtn = null;    // 自定义背景选择按钮
let bgFileName = null;     // 当前背景文件名显示
let bgFileIcon = null;      // 当前背景文件图标
let bgClearBtn = null;     // 清除背景按钮
let state = { ...DEFAULT_STATE };

// 读取本地存储的状态
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      // 兼容旧版（80-100 范围）存储值：转为新的 0-100 显示值
      if (parsed.opacity >= 80 && parsed.opacity <= 100) {
        parsed.opacity = Math.round(((parsed.opacity - MIN_OPACITY) / (MAX_OPACITY - MIN_OPACITY)) * 100);
      }
      // 限制显示值在 0-100 范围
      parsed.opacity = Math.max(0, Math.min(100, parsed.opacity));
      return parsed;
    }
  } catch (e) { /* 忽略解析错误，回退默认 */ }
  return { ...DEFAULT_STATE };
}

// 持久化状态
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 忽略 */ }
}

// 构造 media:// 协议 URL，用于加载本地媒体文件
function mediaUrl(filePath) {
  return 'media://bg/?file=' + encodeURIComponent(filePath);
}

// 从文件路径提取扩展名（小写）
function getExt(filePath) {
  return (filePath.split('.').pop() || '').toLowerCase();
}

// 从文件路径提取文件名
function getFileName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.split('/').pop() || filePath;
}

// 应用背景到各层（磨砂 + 自定义背景媒体层）
function apply() {
  if (!bgLayer) return;
  const hasCustomBg = !!state.customBg;

  // 磨砂背景或自定义背景生效时，背景层半透明以透出后方内容
  const semiTransparent = state.enabled || hasCustomBg;
  bgLayer.classList.toggle('frosted', state.enabled);
  // 显示值 0-100 映射为实际不透明度 80-100
  bgLayer.style.opacity = semiTransparent ? (toActualOpacity(state.opacity) / 100).toString() : '1';

  // 自定义背景媒体层
  if (!mediaLayer) return;
  if (hasCustomBg) {
    mediaLayer.classList.add('active');
    const { type, path } = state.customBg;
    if (type === 'image') {
      imageEl.src = mediaUrl(path);
      imageEl.hidden = false;
      videoEl.hidden = true;
      videoEl.pause();
    } else {
      // 视频：设置 src 并自动循环播放
      videoEl.src = mediaUrl(path);
      videoEl.hidden = false;
      imageEl.hidden = true;
      videoEl.play().catch(() => { /* 自动播放可能被阻止，忽略 */ });
    }
  } else {
    mediaLayer.classList.remove('active');
    imageEl.hidden = true;
    videoEl.hidden = true;
    videoEl.pause();
    imageEl.src = '';
    videoEl.removeAttribute('src');
    videoEl.load();
  }
}

// 同步 UI：开关高亮、滑块显隐与数值、自定义背景文件信息
function syncUI() {
  if (toggleEl) toggleEl.classList.toggle('on', state.enabled);
  // 磨砂或自定义背景任一启用时显示透明度滑块
  const showSlider = state.enabled || !!state.customBg;
  if (controlEl) controlEl.classList.toggle('visible', showSlider);
  if (sliderEl) {
    sliderEl.min = '0';
    sliderEl.max = '100';
    sliderEl.value = state.opacity;
  }
  if (valueEl) valueEl.textContent = state.opacity + '%';

  // 自定义背景文件信息
  if (bgFileName) {
    if (state.customBg) {
      bgFileName.textContent = getFileName(state.customBg.path);
      bgFileIcon.className = state.customBg.type === 'video'
        ? 'bi bi-play-btn bg-file-icon'
        : 'bi bi-image bg-file-icon';
      if (bgClearBtn) bgClearBtn.hidden = false;
    } else {
      bgFileName.textContent = t('settings.noFile');
      bgFileIcon.className = 'bi bi-file-earmark bg-file-icon';
      if (bgClearBtn) bgClearBtn.hidden = true;
    }
  }
}

// 验证视频：时长 ≤ 30 秒，分辨率 ≤ 1080p
function validateVideo(src) {
  return new Promise((resolve, reject) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      const w = probe.videoWidth;
      const h = probe.videoHeight;
      if (duration > MAX_VIDEO_DURATION) {
        reject(new Error(t('toast.videoTooLong', { duration: duration.toFixed(0) })));
      } else if (w > MAX_VIDEO_WIDTH || h > MAX_VIDEO_HEIGHT) {
        reject(new Error(t('toast.videoTooLarge', { w, h })));
      } else {
        resolve();
      }
    };
    probe.onerror = () => reject(new Error(t('toast.videoUnreadable')));
    probe.src = src;
  });
}

// 选择自定义背景文件
async function selectBackground() {
  if (!window.backgroundDialog) {
    showToast(t('toast.bgUnavailable'));
    return;
  }
  const result = await window.backgroundDialog.select();
  if (!result || !result.filePath) return; // 用户取消

  const filePath = result.filePath;
  const ext = getExt(filePath);

  if (IMAGE_EXTS.includes(ext)) {
    // 图片：直接应用
    state.customBg = { type: 'image', path: filePath };
    saveState();
    apply();
    syncUI();
    showToast(t('toast.bgSetImage'));
  } else if (VIDEO_EXTS.includes(ext)) {
    // 视频：验证时长与分辨率
    showToast(t('toast.bgValidating'), 1500);
    try {
      await validateVideo(mediaUrl(filePath));
      state.customBg = { type: 'video', path: filePath };
      saveState();
      apply();
      syncUI();
      showToast(t('toast.bgSetVideo'));
    } catch (err) {
      showToast(err.message || t('toast.bgUnsupport'));
    }
  } else {
    showToast(t('toast.bgUnsupport'));
  }
}

// 清除自定义背景
function clearBackground() {
  state.customBg = null;
  saveState();
  apply();
  syncUI();
  showToast(t('toast.bgCleared'));
}

export function initBackground() {
  bgLayer = document.getElementById('app-bg');
  mediaLayer = document.getElementById('bg-media-layer');
  imageEl = document.getElementById('bg-image');
  videoEl = document.getElementById('bg-video');
  toggleEl = document.querySelector('[data-bg-toggle]');
  controlEl = document.getElementById('opacity-control');
  sliderEl = document.getElementById('opacity-slider');
  valueEl = document.getElementById('opacity-value');
  bgSelectBtn = document.getElementById('bg-select-btn');
  bgFileName = document.getElementById('bg-file-name');
  bgFileIcon = document.getElementById('bg-file-icon');
  bgClearBtn = document.getElementById('bg-clear-btn');

  // 背景层缺失则无法工作（其余控件可选）
  if (!bgLayer) return;

  state = loadState();

  // 磨砂背景开关
  if (toggleEl) {
    toggleEl.addEventListener('click', () => {
      state.enabled = !state.enabled;
      saveState();
      apply();
      syncUI();
    });
  }

  // 自定义背景选择按钮
  if (bgSelectBtn) {
    bgSelectBtn.addEventListener('click', selectBackground);
  }

  // 清除背景按钮
  if (bgClearBtn) {
    bgClearBtn.addEventListener('click', clearBackground);
  }

  // 媒体加载失败处理：文件可能已被移动或删除
  if (imageEl) {
    imageEl.addEventListener('error', () => {
      if (state.customBg && state.customBg.type === 'image' && imageEl.getAttribute('src')) {
        showToast(t('toast.bgImageError'));
        state.customBg = null;
        saveState();
        apply();
        syncUI();
      }
    });
  }
  if (videoEl) {
    videoEl.addEventListener('error', () => {
      if (state.customBg && state.customBg.type === 'video' && videoEl.getAttribute('src')) {
        showToast(t('toast.bgVideoError'));
        state.customBg = null;
        saveState();
        apply();
        syncUI();
      }
    });
  }

  // 滑块：调整透明度（仅开启或自定义背景时影响背景）
  if (sliderEl) {
    // 同步填充宽度：设置 --fill-width CSS 变量控制 linear-gradient 的分界点
    // 与圆球 thumb 同一渲染层绘制，完全同步无延迟
    function updateSliderFill(value) {
      sliderEl.style.setProperty('--fill-width', value + '%');
    }

    // 拖动中：关闭 transition 实现实时响应；视频背景暂停避免闪烁
    sliderEl.addEventListener('input', () => {
      state.opacity = Math.max(0, Math.min(100, parseInt(sliderEl.value, 10)));
      sliderEl.value = state.opacity;
      if (valueEl) valueEl.textContent = state.opacity + '%';
      updateSliderFill(state.opacity);
      sliderEl.classList.add('dragging');
      if (bgLayer) bgLayer.classList.add('no-transition');
      // 视频背景：暂停视频避免帧变化引起的闪屏
      if (state.customBg && state.customBg.type === 'video' && videoEl && !videoEl.paused) {
        videoEl.pause();
      }
      if (state.enabled || state.customBg) apply();
    });
    // 拖动结束：恢复过渡、持久化、恢复视频播放
    sliderEl.addEventListener('change', () => {
      sliderEl.classList.remove('dragging');
      if (bgLayer) bgLayer.classList.remove('no-transition');
      updateSliderFill(state.opacity);
      saveState();
      // 视频背景：恢复播放
      if (state.customBg && state.customBg.type === 'video' && videoEl && videoEl.paused) {
        videoEl.play().catch(() => { /* 忽略播放错误 */ });
      }
    });
    // 初始化滑块填充宽度
    updateSliderFill(state.opacity);
  }

  syncUI();
  apply();

  // 语言切换后刷新背景文件信息文本（如"未选择"）
  document.addEventListener('langchange', () => {
    syncUI();
  });
}
