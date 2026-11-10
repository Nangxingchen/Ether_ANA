// BitDock 逻辑：悬停显示文字、点击果冻动画、切换页面、移动指示条、
// 靠近漂浮、点击后移动即实时拖拽指示条到目标按键切换页面
import { pageManager } from './page-manager.js';
import { reflow } from './utils.js';

const DRAG_THRESHOLD = 4; // 移动超过此像素数即开始拖拽（区分点击与拖拽）

export function initDock() {
  const dock = document.querySelector('.dock');
  const dockWrap = document.querySelector('.dock-wrap');
  const buttons = Array.from(dock.querySelectorAll('.dock-btn'));
  const indicator = dock.querySelector('.dock-indicator');

  // 拖拽状态
  const drag = {
    active: false,      // 是否处于拖拽中
    pressing: false,    // 是否按下中（尚未确定是点击还是拖拽）
    startIndex: 0,      // 按下的按钮索引
    originIndex: 0,     // 按下前的活动页索引（用于脱出回弹）
    pillWidth: 0,       // 指示条宽度（拖拽时保持）
    startX: 0,          // 按下时的指针 X 坐标
    startY: 0,          // 按下时的指针 Y 坐标
  };

  buttons.forEach((btn, index) => {
    // 悬停切换类，驱动 CSS 显示文字标签
    btn.addEventListener('mouseenter', () => btn.classList.add('is-hover'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('is-hover'));

    // 指针按下：记录起点，等待移动判定（点击 or 拖拽）
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // 仅响应左键
      e.preventDefault();
      drag.pressing = true;
      drag.active = false;
      drag.startIndex = index;
      drag.originIndex = getActiveIndex();
      drag.pillWidth = btn.offsetWidth;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
    });
  });

  // 文档级指针移动：按下后检测是否超过阈值，超过即开始拖拽；拖拽中跟随指针
  document.addEventListener('pointermove', (e) => {
    if (!drag.pressing) return;

    // 尚未开始拖拽：检测移动距离是否超过阈值
    if (!drag.active) {
      const dx = Math.abs(e.clientX - drag.startX);
      const dy = Math.abs(e.clientY - drag.startY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
      startDrag(); // 超过阈值，进入拖拽
    }

    // 拖拽中：水平跟随指针，限制在 dock 区域内；标记落点按钮
    onDragMove(e);
  });

  // 指针抬起：拖拽中则结束拖拽并切换；未拖拽则视为普通点击切换
  document.addEventListener('pointerup', (e) => {
    if (drag.active) {
      onDragEnd(e);
      return;
    }
    if (drag.pressing) {
      // 普通点击：果冻弹动 + 切换到按下的按钮
      triggerJelly(buttons[drag.startIndex]);
      setActive(drag.startIndex);
      pageManager.switchTo(drag.startIndex);
    }
    drag.pressing = false;
  });

  // 指针取消（如窗口失焦）：回弹并清理
  document.addEventListener('pointercancel', () => {
    if (drag.active) cancelDrag();
    drag.pressing = false;
  });

  // 进入拖拽：指示条定位到按下按钮处，启用玻璃拟态材质
  function startDrag() {
    drag.active = true;
    // 拖拽时暂停漂浮，避免抖动
    dock.classList.remove('floating');
    const btn = buttons[drag.startIndex];
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
    indicator.classList.add('dragging');
  }

  // 拖拽移动：水平跟随指针，限制在 dock 区域内；标记落点按钮
  function onDragMove(e) {
    const dockRect = dock.getBoundingClientRect();
    const x = e.clientX - dockRect.left - drag.pillWidth / 2;
    // 限制指示条不可拖出 dock 栏区域
    const clamped = Math.max(0, Math.min(x, dock.clientWidth - drag.pillWidth));
    indicator.style.transform = `translateX(${clamped}px)`;
    // 标记指针下方的按钮为落点目标
    const target = buttonUnderPointer(e);
    buttons.forEach((b) => b.classList.toggle('drop-target', b === target));
  }

  // 拖拽结束：在 dock 内则切换到落点按钮；脱出则回弹到原位
  function onDragEnd(e) {
    const dockRect = dock.getBoundingClientRect();
    const inside =
      e.clientX >= dockRect.left && e.clientX <= dockRect.right &&
      e.clientY >= dockRect.top && e.clientY <= dockRect.bottom;

    indicator.classList.remove('dragging');
    reflow(indicator); // 强制重绘，确保过渡在拖拽后生效
    buttons.forEach((b) => b.classList.remove('drop-target'));

    if (inside) {
      // 落在 dock 内：切换到指针下方的按钮
      const target = buttonUnderPointer(e);
      const targetIndex = target ? buttons.indexOf(target) : drag.originIndex;
      triggerJelly(buttons[targetIndex]);
      setActive(targetIndex);
      pageManager.switchTo(targetIndex);
    } else {
      // 脱出 dock 区域：回弹到拖拽前的活动位置
      setActive(drag.originIndex);
    }
    drag.active = false;
    drag.pressing = false;
  }

  // 取消拖拽：回弹并清理状态
  function cancelDrag() {
    indicator.classList.remove('dragging');
    reflow(indicator);
    buttons.forEach((b) => b.classList.remove('drop-target'));
    setActive(drag.originIndex);
    drag.active = false;
  }

  // 查找指针下方的按钮（基于按钮在 dock 内的偏移范围）
  function buttonUnderPointer(e) {
    const dockRect = dock.getBoundingClientRect();
    const relX = e.clientX - dockRect.left;
    return buttons.find((b) => relX >= b.offsetLeft && relX <= b.offsetLeft + b.offsetWidth) || null;
  }

  // 触发果冻弹动动画（先移除类并强制重绘，以便重复触发）
  function triggerJelly(btn) {
    btn.classList.remove('jelly');
    reflow(btn);
    btn.classList.add('jelly');
    btn.addEventListener('animationend', () => btn.classList.remove('jelly'), { once: true });
  }

  // 设置激活态并移动指示条到对应按钮
  function setActive(index) {
    buttons.forEach((b, i) => b.classList.toggle('active', i === index));
    moveIndicator(index);
  }

  // 移动指示条：宽度对齐按钮、位移对齐按钮左侧
  function moveIndicator(index) {
    const btn = buttons[index];
    if (!btn) return;
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  }

  // 当前激活索引
  function getActiveIndex() {
    return buttons.findIndex((b) => b.classList.contains('active'));
  }

  // 窗口尺寸变化时重新定位指示条
  window.addEventListener('resize', () => moveIndicator(getActiveIndex()));

  // 初始化指示条位置（等布局完成后定位到首页）
  requestAnimationFrame(() => moveIndicator(0));

  // ---------- 语言切换（i18n 淡入淡出 570ms）完成后：
  //            重新测量按钮宽度并定位 dock 指示条，确保框选准确 ----------
  document.addEventListener('langchange', () => {
    // 淡出 220ms + 淡入 350ms = 约 570ms；双重 rAF 确保文字布局与宽度测量稳定
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          moveIndicator(getActiveIndex());
        });
      });
    }, 580);
  });

  // 鼠标靠近停靠栏区域时缓慢漂浮；离开后停止（拖拽中不触发）
  if (dockWrap) {
    dockWrap.addEventListener('mouseenter', () => {
      if (!drag.active) dock.classList.add('floating');
    });
    dockWrap.addEventListener('mouseleave', () => dock.classList.remove('floating'));
  }
}
