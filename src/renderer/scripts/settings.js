// 设置页逻辑：主题开关行（与标题栏主题按钮联动）+ 语言切换器
// 语言切换器支持拖拽切换（与 BitDock 类似的即时响应：点击移动即拖拽，松开选择）
// 注：其他 data-toggle 演示开关仍由 utils.delegateToggles 处理，此处仅管主题开关与语言
// 手动切换主题/语言时自动取消"跟随系统"激活态
import { applyTheme, getTheme } from './theme.js';
import { setLanguage, getCurrentLang } from './i18n.js';
import { reflow } from './utils.js';

// 拖拽阈值：移动超过此像素数即开始拖拽（与 BitDock 一致）
const DRAG_THRESHOLD = 4;

export function initSettings() {
  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (!themeToggle) return;

  // 点击主题开关：以开关中心为圆心做圆形辐射切换
  themeToggle.addEventListener('click', () => {
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const current = getTheme();
    // 当前深色→切亮色；当前亮色→切深色
    const target = current === 'dark' ? 'light' : 'dark';
    applyTheme(target, x, y);
    // 手动切换主题时取消"跟随系统"
    const themeFollowBtn = document.getElementById('theme-follow-system');
    if (themeFollowBtn) themeFollowBtn.classList.remove('active');
  });

  // 监听主题变化，同步开关视觉（深色→.on，亮色→移除 .on）
  function syncThemeToggle() {
    const theme = getTheme();
    themeToggle.classList.toggle('on', theme === 'dark');
  }

  document.addEventListener('themechange', syncThemeToggle);
  // 初始化时同步一次
  syncThemeToggle();

  // ---------- 语言切换器（按钮组 + 拖拽滑动指示器） ----------
  const langSwitcher = document.getElementById('lang-switcher');
  const langIndicator = document.getElementById('lang-indicator');
  if (langSwitcher) {
    const langBtns = Array.from(langSwitcher.querySelectorAll('.lang-btn'));

    // 拖拽状态
    const drag = {
      active: false,      // 是否处于拖拽中
      pressing: false,    // 是否按下中（尚未确定是点击还是拖拽）
      startIndex: 0,      // 按下的按钮索引
      originLang: null,   // 按下前的语言（用于拖拽取消时回弹）
      pillWidth: 0,       // 指示条宽度（拖拽时保持）
      startX: 0,          // 按下时的指针 X 坐标
      startY: 0,          // 按下时的指针 Y 坐标
    };

    // 移动滑动指示器到目标按钮位置
    function moveLangIndicator(btn) {
      if (!langIndicator || !btn) return;
      langIndicator.style.width = btn.offsetWidth + 'px';
      langIndicator.style.transform = `translateX(${btn.offsetLeft}px)`;
      langIndicator.classList.add('active');
    }

    // 设置激活态并移动指示器
    function setActiveLang(lang) {
      const targetBtn = langBtns.find((b) => b.dataset.lang === lang);
      if (!targetBtn) return;
      langBtns.forEach((b) => b.classList.toggle('active', b === targetBtn));
      moveLangIndicator(targetBtn);
    }

    // 查找指针下方的按钮（基于按钮在切换器内的偏移范围）
    function btnUnderPointer(e) {
      const rect = langSwitcher.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      return langBtns.find((b) => relX >= b.offsetLeft && relX <= b.offsetLeft + b.offsetWidth) || null;
    }

    // 指针按下：记录起点，等待移动判定（点击 or 拖拽）
    langBtns.forEach((btn, index) => {
      btn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return; // 仅响应左键
        e.preventDefault();
        drag.pressing = true;
        drag.active = false;
        drag.startIndex = index;
        drag.originLang = getCurrentLang();
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
        startDrag();
      }
      // 拖拽中：水平跟随指针，限制在切换器区域内；标记落点按钮
      onDragMove(e);
    });

    // 指针抬起：拖拽中则结束拖拽并选择语言；未拖拽则视为普通点击切换
    document.addEventListener('pointerup', (e) => {
      if (drag.active) {
        onDragEnd(e);
        return;
      }
      if (drag.pressing) {
        // 普通点击：切换到按下的按钮语言
        const btn = langBtns[drag.startIndex];
        if (btn && !btn.classList.contains('active')) {
          setActiveLang(btn.dataset.lang);
          setLanguage(btn.dataset.lang);
          // 手动切换语言时取消"跟随系统"
          const langFollowBtn = document.getElementById('lang-follow-system');
          if (langFollowBtn) langFollowBtn.classList.remove('active');
        }
      }
      drag.pressing = false;
    });

    // 指针取消（如窗口失焦）：回弹并清理
    document.addEventListener('pointercancel', () => {
      if (drag.active) cancelDrag();
      drag.pressing = false;
    });

    // 进入拖拽：指示条定位到按下按钮处，启用即时跟随
    function startDrag() {
      drag.active = true;
      const btn = langBtns[drag.startIndex];
      langIndicator.style.width = btn.offsetWidth + 'px';
      langIndicator.style.transform = `translateX(${btn.offsetLeft}px)`;
      langIndicator.classList.add('dragging');
    }

    // 拖拽移动：水平跟随指针，限制在切换器区域内；标记落点按钮
    function onDragMove(e) {
      const rect = langSwitcher.getBoundingClientRect();
      const x = e.clientX - rect.left - drag.pillWidth / 2;
      const clamped = Math.max(0, Math.min(x, langSwitcher.clientWidth - drag.pillWidth));
      langIndicator.style.transform = `translateX(${clamped}px)`;
      // 标记指针下方的按钮为落点目标
      const target = btnUnderPointer(e);
      langBtns.forEach((b) => b.classList.toggle('drop-target', b === target));
    }

    // 拖拽结束：选择指针下方的语言
    function onDragEnd(e) {
      const rect = langSwitcher.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      langIndicator.classList.remove('dragging');
      reflow(langIndicator);
      langBtns.forEach((b) => b.classList.remove('drop-target'));

      if (inside) {
        const target = btnUnderPointer(e);
        if (target) {
          setActiveLang(target.dataset.lang);
          setLanguage(target.dataset.lang);
          // 手动切换语言时取消"跟随系统"
          const langFollowBtn = document.getElementById('lang-follow-system');
          if (langFollowBtn) langFollowBtn.classList.remove('active');
        } else {
          setActiveLang(drag.originLang);
        }
      } else {
        setActiveLang(drag.originLang);
      }
      drag.active = false;
      drag.pressing = false;
    }

    // 取消拖拽：回弹并清理状态
    function cancelDrag() {
      langIndicator.classList.remove('dragging');
      reflow(langIndicator);
      langBtns.forEach((b) => b.classList.remove('drop-target'));
      setActiveLang(drag.originLang);
      drag.active = false;
    }

    // 初始化指示器位置（等布局完成后定位到当前语言）
    const currentLang = getCurrentLang();
    setActiveLang(currentLang);
    requestAnimationFrame(() => moveLangIndicator(
      langBtns.find((b) => b.dataset.lang === currentLang)
    ));

    // 语言切换后同步按钮激活态（防止外部调用 setLanguage 后不同步）
    document.addEventListener('langchange', (e) => {
      setActiveLang(e.detail.lang);
    });

    // 窗口尺寸变化时重新定位指示器
    window.addEventListener('resize', () => {
      const activeBtn = langBtns.find((b) => b.classList.contains('active'));
      if (activeBtn) moveLangIndicator(activeBtn);
    });

    // ---------- 语言切换（i18n 淡入淡出 570ms）完成后：
    //            重新测量按钮宽度并定位指示器，确保框选准确 ----------
    document.addEventListener('langchange', () => {
      // 淡出 + 文本替换 + 淡入总时长约 220ms + 350ms = 570ms
      // 使用双重 rAF 确保文字替换、布局测量全部落位，避免获取旧宽度
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const activeBtn = langBtns.find((b) => b.classList.contains('active'));
            if (activeBtn) moveLangIndicator(activeBtn);
          });
        });
      }, 580);
    });
  }
}
