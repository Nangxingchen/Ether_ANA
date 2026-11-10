// 文件类型映射配置：扩展名 → 分类 → 可转换目标格式（演示数据）

// 分类配置：标签、图标、可转换目标格式
export const FILE_CATEGORIES = {
  video:    { label: '视频', icon: 'bi-play-btn',          targets: ['MP4', 'MOV', 'MKV', 'WebM', 'AVI', 'GIF'] },
  document: { label: '文档', icon: 'bi-file-earmark-text', targets: ['PDF', 'DOCX', 'TXT', 'MD', 'HTML'] },
  ebook:    { label: '图书', icon: 'bi-book',              targets: ['EPUB', 'MOBI', 'PDF', 'TXT', 'AZW3'] },
  image:    { label: '图片', icon: 'bi-image',             targets: ['PNG', 'JPG', 'WebP', 'GIF', 'BMP', 'ICO'] },
  audio:    { label: '音频', icon: 'bi-music-note-beamed', targets: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG'] },
};

// 扩展名 → 分类键（注意 txt 归入文档）
export const EXT_MAP = {
  mp4:'video', mov:'video', mkv:'video', webm:'video', avi:'video', flv:'video', wmv:'video', m4v:'video',
  pdf:'document', doc:'document', docx:'document', txt:'document', rtf:'document', md:'document', html:'document', htm:'document', xls:'document', xlsx:'document', ppt:'document', pptx:'document', csv:'document',
  epub:'ebook', mobi:'ebook', azw3:'ebook', fb2:'ebook', lit:'ebook',
  jpg:'image', jpeg:'image', png:'image', webp:'image', gif:'image', bmp:'image', tiff:'image', tif:'image', ico:'image', heic:'image',
  mp3:'audio', wav:'audio', flac:'audio', aac:'audio', ogg:'audio', wma:'audio', m4a:'audio',
};

// 根据文件名获取分类
export function getCategory(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return EXT_MAP[ext] || null;
}

// 生成 input[accept] 字符串
export function getAcceptString() {
  return Object.keys(EXT_MAP).map(e => '.' + e).join(',');
}

// 友好体积格式化
export function formatSize(bytes) {
  if (!bytes) return '0 B';
  const u = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes)/Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i];
}
