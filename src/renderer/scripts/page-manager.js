// 页面切换管理器：横向轨道滑动，方向由索引大小自然决定
// 轨道宽 400%，4 页各占 25%；translate3d(-index*25%,0,0) 即可定位到第 index 页。
// 使用 requestAnimationFrame 批处理 DOM 写入，避免布局抖动与主线程阻塞。
// 向右切换（index 增大）translate3d x 减小，新页从右侧滑入；
// 向左切换（index 减小）translate3d x 增大，新页从左侧滑入。
// 方向感由轨道过渡自动呈现，无需额外处理。

const PAGE_COUNT = 4; // 首页 / 工具 / 关于 / 设置
let currentIndex = 0;

// requestAnimationFrame 批处理：将 DOM 写入合并到下一帧，减少重排次数
let pendingSwitch = null;   // 待处理的切换请求 { targetIndex }
let rafScheduled = false;  // 是否已调度 rAF

function flushPendingSwitch() {
  rafScheduled = false;
  if (!pendingSwitch) return;

  const { targetIndex } = pendingSwitch;
  pendingSwitch = null;

  // 1. 先标记活动页（CSS 类切换在同一帧内完成，避免两次重排）
  const pages = document.querySelectorAll('.page');
  pages.forEach((p, i) => p.classList.toggle('active-page', i === targetIndex));
  currentIndex = targetIndex;

  // 2. 轨道平移：使用 translate3d 触发 GPU 合成层，transform 在合成线程执行不阻塞主线程
  const track = document.querySelector('.page-track');
  if (track) {
    // 使用 translate3d 而非 translateX，强制独立合成层，与 CSS will-change: transform 配合
    track.style.transform = `translate3d(-${currentIndex * 25}%, 0, 0)`;
  }
}

export const pageManager = {
  // 初始化轨道位置与活动页
  init() {
    const track = document.querySelector('.page-track');
    if (track) {
      // 初始位置也使用 translate3d，确保一致的 GPU 合成层
      track.style.transform = 'translate3d(0, 0, 0)';
    }
    this.markActive(0);
  },

  // 切换到目标页（rAF 批处理，零延迟排队）
  switchTo(targetIndex) {
    if (targetIndex < 0 || targetIndex >= PAGE_COUNT) return;
    if (targetIndex === currentIndex) return; // 同页不处理

    // 保存为待处理请求，若已有 pending 则覆盖（只保留最新目标）
    pendingSwitch = { targetIndex };

    // 调度 rAF（同一帧多次调用只排队一次）
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(flushPendingSwitch);
    }
  },

  // 切换活动页类（用于内容淡入动画）
  markActive(index) {
    const pages = document.querySelectorAll('.page');
    pages.forEach((p, i) => p.classList.toggle('active-page', i === index));
  },

  // 获取当前页索引
  getCurrentIndex() {
    return currentIndex;
  }
};
