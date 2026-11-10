// 主题管理：切换、持久化、圆形辐射过渡动画
// 使用 requestAnimationFrame 批处理主题应用，避免首次切换时主线程阻塞与卡顿
// 保证多个组件（settings、titlebar、follow-system 按钮）在同一帧内只触发一次 ViewTransition
const STORAGE_KEY = 'app-theme';

// rAF 批处理：合并同一帧内的多次 applyTheme 请求，避免重复动画/闪烁
let pendingTheme = null;      // { theme, originX, originY }
let rafScheduled = false;

function flushPendingTheme() {
  rafScheduled = false;
  if (!pendingTheme) return;
  const { theme, originX, originY } = pendingTheme;
  pendingTheme = null;
  applyThemeImpl(theme, originX, originY);
}

// 读取当前主题（默认深色）
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

// 以 (originX, originY) 为圆心做圆形辐射过渡切换主题（rAF 批处理入口）
export function toggleTheme(originX, originY) {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next, originX, originY);
}

// 应用主题；若提供坐标则使用 View Transitions 圆形辐射（rAF 批处理入口）
export function applyTheme(theme, originX, originY) {
  // 合并到 rAF 批处理队列，同一帧多次调用只执行一次最新请求
  pendingTheme = { theme, originX, originY };
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(flushPendingTheme);
  }
}

// 真实应用主题（rAF 后回调执行）
function applyThemeImpl(theme, originX, originY) {
  const root = document.documentElement;
  const set = () => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };
  // 不支持 View Transitions 或未提供坐标时直接切换
  if (!document.startViewTransition || originX == null) { set(); return; }
  try {
    const transition = document.startViewTransition(() => set());
    transition.ready.then(() => {
      // 计算到最远角的距离，确保圆形扩散覆盖整个视口
      const end = Math.hypot(
        Math.max(originX, innerWidth - originX),
        Math.max(originY, innerHeight - originY)
      );
      root.animate(
        { clipPath: [`circle(0px at ${originX}px ${originY}px)`, `circle(${end}px at ${originX}px ${originY}px)`] },
        { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {
      // ready reject 时直接兜底（如浏览器兼容性），避免 UI 卡死
      if (getTheme() !== theme) set();
    });
  } catch (_err) {
    // startViewTransition 抛错：直接应用，保证功能可用
    if (getTheme() !== theme) set();
  }
}
