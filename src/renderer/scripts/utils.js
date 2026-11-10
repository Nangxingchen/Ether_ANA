// 通用工具函数集合（可复用）

/** 防抖：延迟执行并取消之前的调用 */
export function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** 强制重绘元素，用于重启 CSS 动画 */
export function reflow(el) {
  void el.offsetWidth;
}

/** 限制数值到 [min, max] 区间 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** 设置页开关交互：点击带 [data-toggle] 的元素切换 on 状态（主题开关由 settings.js 单独处理） */
export function delegateToggles() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle]');
    if (!toggle) return;
    toggle.classList.toggle('on');
  });
}

/** 轻量提示：复用单一 .toast 节点，显示后自动隐藏 */
export function showToast(message, duration = 2200) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  // 强制重绘以重启进入动画
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}
