// 工具页逻辑：拖拽 / 点击导入文件，按扩展名显示可转换目标格式（演示）
// 格式选择支持拖拽切换（与 BitDock 类似：点击移动即拖拽，松开选择）
// 核心功能：按钮 → 进度条动画；保存位置；转换后自动打开文件夹
import {
  FILE_CATEGORIES,
  getCategory,
  getAcceptString,
  formatSize,
} from './file-types.js';
import { showToast, reflow } from './utils.js';
import { t, getCurrentLang } from './i18n.js';

// 拖拽阈值：移动超过此像素数即开始拖拽（与 BitDock / 语言切换器一致）
const DRAG_THRESHOLD = 4;

// 保存路径 localStorage 键
const SAVE_MODE_KEY = 'convert-save-mode';   // 'default' | 'custom'
const SAVE_PATH_KEY = 'convert-save-path';   // 自定义路径

/**
 * 获取保存位置：
 *  - default: 系统文档目录（通过 IPC 获取，带缓存）
 *  - custom: 用户选择的目录（若未选择则回退到文档目录）
 * 返回值始终非 null（主进程 converter 会再次兜底）
 */
let documentsCache = null;
async function getSaveDir() {
  const mode = localStorage.getItem(SAVE_MODE_KEY) || 'default';
  if (mode === 'custom') {
    const custom = localStorage.getItem(SAVE_PATH_KEY);
    if (custom) return custom;
  }
  // 默认模式：获取系统文档目录
  if (!documentsCache && window.saveAndConvert) {
    try {
      documentsCache = await window.saveAndConvert.getDocumentsPath();
    } catch (_) {}
  }
  return documentsCache || '';
}

// 注册进度监听（只注册一次），缓存当前进度
let currentProgressCb = null;
if (window.saveAndConvert) {
  window.saveAndConvert.onProgress(({ inputPath, progress }) => {
    if (currentProgressCb) currentProgressCb({ inputPath, progress });
  });
}

export function initTools() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const convertPanel = document.getElementById('convert-panel');
  const fileIcon = document.getElementById('file-icon');
  const fileName = document.getElementById('file-name');
  const fileInfo = document.getElementById('file-info');
  const fileClear = document.getElementById('file-clear');
  const targetsGrid = document.getElementById('targets-grid');
  const targetsIndicator = document.getElementById('targets-indicator');
  const convertBtn = document.getElementById('convert-btn');
  const progressEl = convertBtn && convertBtn.querySelector('.btn-progress');
  const progressTextEl = document.getElementById('btn-progress-text');

  // 任一关键节点缺失则跳过（避免非工具页报错）
  if (!dropzone || !fileInput || !convertPanel) return;

  // 设置文件选择器可接受的扩展名
  fileInput.accept = getAcceptString();

  // 点击导入区触发文件选择（仅在导入区可见时生效）
  dropzone.addEventListener('click', () => {
    if (dropzone.hidden) return;
    fileInput.click();
  });

  // 拖拽事件：高亮导入区
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dz-dragover');
  });
  dropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropzone.classList.add('dz-dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dz-dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dz-dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  // 文件选择变化
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) loadFile(file);
    // 重置 value 以便重复选择同一文件
    fileInput.value = '';
  });

  // 当前已加载文件（来自 loadFile）
  let currentFile = null;

  // 移除已导入文件，回到导入区（退出动画与入场镜像一致）
  fileClear.addEventListener('click', () => {
    playExitAnimation(() => {
      convertPanel.hidden = true;
      dropzone.hidden = false;
      targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.remove());
      if (targetsIndicator) targetsIndicator.classList.remove('active');
      currentFile = null;
      // 重置按钮状态
      resetConvertBtn();
    });
  });

  // 播放与入场镜像一致的退出动画（入场 entering → 退出 exiting）
  function playExitAnimation(callback) {
    convertPanel.classList.remove('exiting', 'entering');
    reflow(convertPanel);
    convertPanel.classList.add('exiting');
    setTimeout(() => {
      convertPanel.classList.remove('exiting');
      if (callback) callback();
    }, 600);
  }

  // 重置转换按钮到初始态
  function resetConvertBtn() {
    if (!convertBtn) return;
    convertBtn.classList.remove('converting', 'done', 'error');
    if (progressEl) {
      progressEl.style.width = '0';
    }
    if (progressTextEl) {
      progressTextEl.textContent = '0%';
    }
  }

  // 转换按钮：核心进度条动画 + 转换流程
  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    if (convertBtn.classList.contains('converting') ||
        convertBtn.classList.contains('done')) return;

    const selectedChip = targetsGrid.querySelector('.format-chip.selected');
    const targetFormat = selectedChip ? selectedChip.dataset.format : null;
    if (!targetFormat) {
      showToast(t('toast.convertSoon'));
      return;
    }

    // 进入进度条状态：按钮 → 胶囊进度条
    convertBtn.classList.remove('done', 'error');
    convertBtn.classList.add('converting');
    if (progressEl) progressEl.style.width = '0%';
    if (progressTextEl) progressTextEl.textContent = '0%';

    const saveDir = (await getSaveDir()) || '';
    showToast(t('toast.convertStart', { file: currentFile.name }));

    // 监听主进程进度
    currentProgressCb = ({ inputPath, progress }) => {
      if (inputPath !== currentFile.path) return;
      if (progressEl) progressEl.style.width = progress + '%';
      if (progressTextEl) progressTextEl.textContent = progress + '%';
    };

    try {
      // 启动转换（如无 IPC 桥则降级为模拟进度）
      let result;
      if (window.saveAndConvert && currentFile.path) {
        result = await window.saveAndConvert.convertFile({
          inputPath: currentFile.path,
          basePath: saveDir,
          targetFormat,
          lang: getCurrentLang(),
        });
      } else {
        result = await simulateConvertProgress(currentFile);
      }

      // 完成态
      if (result && result.ok) {
        if (progressEl) progressEl.style.width = '100%';
        if (progressTextEl) progressTextEl.textContent = '100%';
        convertBtn.classList.remove('converting');
        convertBtn.classList.add('done');
        showToast(t('toast.convertDone', {
          path: result.outputPath || saveDir,
        }));
        // 自动打开保存文件夹（打开 NANConvert/分类文件夹）
        if (window.saveAndConvert) {
          const toOpen = result.outputDir || saveDir || '';
          if (toOpen) {
            try {
              await window.saveAndConvert.openPath(toOpen);
            } catch (_) {}
          }
        }

        // 停留 1.8 秒后回到初始界面（带退出动画）
        setTimeout(() => {
          playExitAnimation(() => {
            convertPanel.hidden = true;
            dropzone.hidden = false;
            targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.remove());
            if (targetsIndicator) targetsIndicator.classList.remove('active');
            currentFile = null;
            resetConvertBtn();
          });
        }, 1800);
      } else {
        throw new Error(result && result.error ? result.error : '未知错误');
      }
    } catch (err) {
      convertBtn.classList.remove('converting');
      convertBtn.classList.add('error');
      showToast(t('toast.convertError', { msg: err.message || '转换失败' }));
      setTimeout(() => {
        resetConvertBtn();
      }, 1800);
    } finally {
      currentProgressCb = null;
    }
  });

  /** 无 IPC 环境下的降级：模拟转换进度（纯前端） */
  function simulateConvertProgress(file) {
    return new Promise((resolve) => {
      let p = 0;
      const total = 1500;
      const start = Date.now();
      const timer = setInterval(() => {
        p = Math.min(100, Math.round(((Date.now() - start) / total) * 100));
        if (progressEl) progressEl.style.width = p + '%';
        if (progressTextEl) progressTextEl.textContent = p + '%';
        if (p >= 100) {
          clearInterval(timer);
          resolve({ ok: true, outputPath: '' });
        }
      }, 80);
    });
  }

  // ---------- 格式选择拖拽状态（与 BitDock 类似的即时响应） ----------
  const drag = {
    active: false,       // 是否处于拖拽中
    pressing: false,     // 是否按下中（尚未确定是点击还是拖拽）
    startChip: null,     // 按下的 chip
    originChip: null,    // 按下前已选中的 chip（用于拖拽取消时回弹）
    chipWidth: 0,        // 指示条宽度（拖拽时保持）
    chipHeight: 0,       // 指示条高度（拖拽时保持）
    startX: 0,           // 按下时的指针 X 坐标
    startY: 0,           // 按下时的指针 Y 坐标
  };

  // 加载文件：识别分类并渲染转换面板
  function loadFile(file) {
    const cat = getCategory(file.name);
    if (!cat) {
      // 不支持的格式：显示错误态，2 秒后恢复
      showErrorState();
      return;
    }

    // 缓存当前文件（附带绝对路径，通过 webUtils.getPathForFile 解析）
    currentFile = {
      name: file.name,
      size: file.size || 0,
      path: '',
    };
    // 优先使用 webUtils.getPathForFile（Electron 32+），降级到 File.path
    if (window.saveAndConvert && window.saveAndConvert.getFilePath) {
      currentFile.path = window.saveAndConvert.getFilePath(file);
    } else if (file.path) {
      currentFile.path = file.path;
    }

    // 切换到转换面板
    dropzone.hidden = true;
    convertPanel.hidden = false;
    dropzone.classList.remove('dz-error');
    // 确保按钮状态已重置（避免上次转换状态残留）
    resetConvertBtn();

    // 填充文件信息
    const catInfo = FILE_CATEGORIES[cat];
    fileName.textContent = file.name;
    fileInfo.textContent = `${formatSize(file.size)} · ${t('filecat.' + cat)}`;
    fileIcon.className = `bi ${catInfo.icon} file-type-icon`;

    // 构建目标格式按钮，默认选中第一个
    targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.remove());
    catInfo.targets.forEach((format, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'format-chip' + (index === 0 ? ' selected' : '');
      chip.dataset.format = format;
      chip.innerHTML = `<i class="bi bi-file-earmark-arrow"></i> ${format}`;
      // 指针按下：记录起点，等待移动判定（点击 or 拖拽）
      chip.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return; // 仅响应左键
        e.preventDefault();
        drag.pressing = true;
        drag.active = false;
        drag.startChip = chip;
        drag.originChip = targetsGrid.querySelector('.format-chip.selected');
        drag.chipWidth = chip.offsetWidth;
        drag.chipHeight = chip.offsetHeight;
        drag.startX = e.clientX;
        drag.startY = e.clientY;
      });
      targetsGrid.appendChild(chip);
    });

    // 初始定位滑动指示器到第一个选项（等布局完成后定位）
    const firstChip = targetsGrid.querySelector('.format-chip');
    if (firstChip) {
      requestAnimationFrame(() => moveIndicator(firstChip));
    }

    // 触发卡片入场动画：居中 → 右移成列表 + 面板上下收缩
    convertPanel.classList.remove('entering');
    reflow(convertPanel);
    convertPanel.classList.add('entering');
    // 动画结束后移除类，避免重复触发
    setTimeout(() => convertPanel.classList.remove('entering'), 800);
  }

  // 文档级指针移动：按下后检测是否超过阈值，超过即开始拖拽；拖拽中跟随指针
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

  // 指针抬起：拖拽中则结束拖拽并选择格式；未拖拽则视为普通点击切换
  document.addEventListener('pointerup', (e) => {
    if (drag.active) {
      onDragEnd(e);
      return;
    }
    if (drag.pressing) {
      // 普通点击：切换到按下的 chip
      if (drag.startChip) selectChip(drag.startChip);
    }
    drag.pressing = false;
  });

  // 指针取消：回弹并清理
  document.addEventListener('pointercancel', () => {
    if (drag.active) cancelDrag();
    drag.pressing = false;
  });

  // 进入拖拽：指示条定位到按下 chip 处，启用即时跟随
  function startDrag() {
    drag.active = true;
    const chip = drag.startChip;
    if (!chip || !targetsIndicator) return;
    targetsIndicator.style.width = chip.offsetWidth + 'px';
    targetsIndicator.style.height = chip.offsetHeight + 'px';
    targetsIndicator.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;
    targetsIndicator.classList.add('dragging');
  }

  // 拖拽移动：2D 跟随指针，限制在网格区域内；标记落点 chip
  function onDragMove(e) {
    if (!targetsIndicator || !drag.startChip) return;
    const gridRect = targetsGrid.getBoundingClientRect();
    // 指针相对于网格的坐标
    const relX = e.clientX - gridRect.left;
    const relY = e.clientY - gridRect.top;
    // 指示条中心跟随指针，限制在网格内
    const clampedX = Math.max(0, Math.min(relX - drag.chipWidth / 2, targetsGrid.clientWidth - drag.chipWidth));
    const clampedY = Math.max(0, Math.min(relY - drag.chipHeight / 2, targetsGrid.clientHeight - drag.chipHeight));
    targetsIndicator.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    // 标记指针下方的 chip 为落点目标
    const target = chipUnderPointer(e);
    targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.classList.toggle('drop-target', c === target));
  }

  // 拖拽结束：选择指针下方的格式
  function onDragEnd(e) {
    const gridRect = targetsGrid.getBoundingClientRect();
    const inside =
      e.clientX >= gridRect.left && e.clientX <= gridRect.right &&
      e.clientY >= gridRect.top && e.clientY <= gridRect.bottom;

    targetsIndicator.classList.remove('dragging');
    reflow(targetsIndicator);
    targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.classList.remove('drop-target'));

    if (inside) {
      const target = chipUnderPointer(e);
      if (target) {
        selectChip(target);
      } else if (drag.originChip) {
        selectChip(drag.originChip);
      }
    } else if (drag.originChip) {
      selectChip(drag.originChip);
    }
    drag.active = false;
    drag.pressing = false;
  }

  // 取消拖拽：回弹并清理状态
  function cancelDrag() {
    if (targetsIndicator) {
      targetsIndicator.classList.remove('dragging');
      reflow(targetsIndicator);
    }
    targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.classList.remove('drop-target'));
    if (drag.originChip) selectChip(drag.originChip);
    drag.active = false;
  }

  // 查找指针下方的 chip（基于 getBoundingClientRect）
  function chipUnderPointer(e) {
    return targetsGrid.querySelector('.format-chip') && Array.from(targetsGrid.querySelectorAll('.format-chip')).find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }) || null;
  }

  // 单选目标格式：滑动指示器从当前选项丝滑移动到新选中项
  function selectChip(chip) {
    targetsGrid.querySelectorAll('.format-chip').forEach((c) => c.classList.remove('selected'));
    chip.classList.add('selected');
    moveIndicator(chip);
  }

  // 移动滑动指示器到目标 chip 位置（宽高 + 位移均跟随）
  function moveIndicator(chip) {
    if (!targetsIndicator || !chip) return;
    targetsIndicator.style.width = chip.offsetWidth + 'px';
    targetsIndicator.style.height = chip.offsetHeight + 'px';
    targetsIndicator.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;
    targetsIndicator.classList.add('active');
  }

  // 错误区态：提示不支持，2 秒后恢复
  function showErrorState() {
    const hint = dropzone.querySelector('.dz-hint');
    const originHint = hint ? hint.textContent : '';
    dropzone.classList.add('dz-error');
    if (hint) hint.textContent = t('tools.dropzone.error');
    setTimeout(() => {
      dropzone.classList.remove('dz-error');
      if (hint) hint.textContent = originHint;
    }, 2000);
  }
}
