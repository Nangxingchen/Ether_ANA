// 关于页 & 首页逻辑：
// 1) NAN 笔画动画（logo + 标题流线动画）：描边 → 填充过渡，支持点击重放
// 2) 头像点击：纯旋转动画（点击开始，再次停止）
//
// NAN 描边动画（SVG）: stroke-dasharray + nan-draw 关键帧，时长 2.2s
// 标题流线描边: -webkit-text-stroke 动画 + hero-title-draw 关键帧，时长 1.8s
// 填充时机：各自动画结束后添加 filled 类，颜色同主色（浅→黑 / 深→白）

import { t } from './i18n.js';

export function initAbout() {
  // ---------- 首页：NAN + 标题流线笔画动画（开场 & 点击重放） ----------
  const nanText = document.getElementById('hero-nan-text');
  const nanLogo = document.getElementById('hero-nan-logo');
  const heroTitle = document.getElementById('hero-title');

  // 开场自动播放：NAN SVG 描边 + 标题流线描边
  requestAnimationFrame(() => {
    // NAN logo：2.2s 描边动画（CSS nan-draw），结束后填充颜色
    if (nanText) {
      setTimeout(() => nanText.classList.add('nan-filled'), 2200);
    }
    // 标题流线描边：1.8s 结束后填充颜色（略早于 NAN 结束，形成错落过渡）
    if (heroTitle) {
      heroTitle.classList.add('hero-stroke');
      // 添加 title 提示可点击重放
      heroTitle.title = t('home.title.replay');
      setTimeout(() => {
        heroTitle.classList.remove('hero-stroke');
        heroTitle.classList.add('hero-stroke-filled');
      }, 1800);
    }
  });

  // 点击 NAN logo 或标题：重新播放开场动画（NAN + 标题同步重放）
  function replayIntro() {
    // 1) NAN SVG 描边重放
    if (nanText) {
      nanText.classList.remove('nan-filled');
      nanText.style.animation = 'none';
      void nanText.offsetWidth; // 强制重排
      nanText.style.animation = '';
      setTimeout(() => nanText.classList.add('nan-filled'), 2200);
    }
    // 2) 标题流线描边重放
    if (heroTitle) {
      heroTitle.classList.remove('hero-stroke-filled');
      heroTitle.classList.remove('hero-stroke');
      void heroTitle.offsetWidth; // 强制重排
      heroTitle.classList.add('hero-stroke');
      setTimeout(() => {
        heroTitle.classList.remove('hero-stroke');
        heroTitle.classList.add('hero-stroke-filled');
      }, 1800);
    }
  }

  if (nanLogo) {
    nanLogo.style.cursor = 'pointer';
    nanLogo.addEventListener('click', replayIntro);
    nanLogo.title = t('home.title.replay');
  }
  if (heroTitle) {
    heroTitle.addEventListener('click', replayIntro);
  }

  // ---------- 版本号：从 package.json 读取并同步显示 ----------
  const aboutRows = document.querySelectorAll('.about-row');
  aboutRows.forEach((row) => {
    const label = row.querySelector('.about-label');
    if (label && label.getAttribute('data-i18n') === 'about.version') {
      const valueSpan = row.querySelector('.about-value');
      if (valueSpan && window.settingsApi && window.settingsApi.getAppVersion) {
        window.settingsApi.getAppVersion().then((version) => {
          if (version) valueSpan.textContent = version;
        }).catch(() => {});
      }
    }
  });

  // ---------- 头像点击：纯旋转动画（开始/停止切换） ----------
  const avatarWraps = document.querySelectorAll('.avatar-wrap');
  avatarWraps.forEach((wrap) => {
    wrap.addEventListener('click', () => {
      wrap.classList.toggle('spinning');
    });
  });

  // ---------- 语言切换：刷新 title 提示文本 ----------
  document.addEventListener('langchange', () => {
    if (nanLogo) nanLogo.title = t('home.title.replay');
    if (heroTitle) heroTitle.title = t('home.title.replay');
  });
}
