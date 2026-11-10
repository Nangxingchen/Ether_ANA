// 主题初始化：在首帧渲染前应用已保存的主题，避免主题闪烁
// 注：本文件为普通经典脚本（非 ES 模块），需在 <head> 中同步加载
(function () {
  try {
    var saved = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
