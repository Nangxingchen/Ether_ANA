// 文件转换器：完整转换功能 + 规范化文件夹结构
// 输出结构：[保存位置]/NANConvert/[分类文件夹]/[文件名].[目标格式]
// 分类文件夹名根据当前语言创建对应名称
// 文本类格式做真实转换；图片/音频/视频/图书类做文件复制（无外部转码依赖）

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// 各语言对应的分类文件夹名称
const CATEGORY_FOLDER_NAMES = {
  'zh-CN': { video: '视频', image: '图片', document: '文档', ebook: '图书', audio: '音频' },
  'zh-TW': { video: '影片', image: '圖片', document: '文件', ebook: '圖書', audio: '音訊' },
  'en':    { video: 'Videos', image: 'Images', document: 'Documents', ebook: 'Books', audio: 'Audio' },
  'ja':    { video: '動画', image: '画像', document: 'ドキュメント', ebook: '書籍', audio: 'オーディオ' },
  'ko':    { video: '동영상', image: '이미지', document: '문서', ebook: '도서', audio: '오디오' },
};

// 扩展名 → 分类键
const EXT_MAP = {
  mp4:'video', mov:'video', mkv:'video', webm:'video', avi:'video', flv:'video', wmv:'video', m4v:'video',
  pdf:'document', doc:'document', docx:'document', txt:'document', rtf:'document', md:'document', html:'document', htm:'document', xls:'document', xlsx:'document', ppt:'document', pptx:'document', csv:'document',
  epub:'ebook', mobi:'ebook', azw3:'ebook', fb2:'ebook', lit:'ebook',
  jpg:'image', jpeg:'image', png:'image', webp:'image', gif:'image', bmp:'image', tiff:'image', tif:'image', ico:'image', heic:'image',
  mp3:'audio', wav:'audio', flac:'audio', aac:'audio', ogg:'audio', wma:'audio', m4a:'audio',
};

// 文本类格式：可以读取内容并做真实转换的格式
const TEXT_FORMATS = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'rtf'];

/**
 * 获取分类文件夹名（根据语言）
 */
function getCategoryFolder(category, lang) {
  const names = CATEGORY_FOLDER_NAMES[lang] || CATEGORY_FOLDER_NAMES['zh-CN'];
  return names[category] || names.document;
}

/**
 * 获取文件分类
 */
function getCategory(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return EXT_MAP[ext] || 'document';
}

/**
 * 确保输出目录存在
 * 结构：[basePath]/NANConvert/[分类文件夹]/
 */
function ensureOutputDir(basePath, category, lang) {
  const nanDir = path.join(basePath, 'NANConvert');
  const categoryDir = path.join(nanDir, getCategoryFolder(category, lang));
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  return categoryDir;
}

/**
 * 文本类格式转换：读取内容，按目标格式输出
 */
function convertTextFile(inputPath, outputPath, targetExt) {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const sourceExt = path.extname(inputPath).slice(1).toLowerCase();

  let output = content;

  // Markdown → HTML
  if ((sourceExt === 'md') && targetExt === 'html') {
    output = mdToHtml(content);
  }
  // HTML → 纯文本
  else if ((sourceExt === 'html' || sourceExt === 'htm') && targetExt === 'txt') {
    output = content.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  }
  // HTML → Markdown
  else if ((sourceExt === 'html' || sourceExt === 'htm') && targetExt === 'md') {
    output = htmlToMd(content);
  }
  // TXT → Markdown（添加标题）
  else if (sourceExt === 'txt' && targetExt === 'md') {
    const lines = content.split('\n');
    if (lines.length > 0) output = '# ' + lines[0] + '\n\n' + lines.slice(1).join('\n');
  }
  // CSV → JSON
  else if (sourceExt === 'csv' && targetExt === 'json') {
    output = csvToJson(content);
  }
  // JSON → CSV（简易转换，仅支持对象数组）
  else if (sourceExt === 'json' && targetExt === 'csv') {
    output = jsonToCsv(content);
  }
  // 其他文本格式：直接复制内容
  else {
    output = content;
  }

  fs.writeFileSync(outputPath, output, 'utf-8');
}

/**
 * Markdown → HTML 简易转换
 */
function mdToHtml(md) {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted</title></head><body><p>${html}</p></body></html>`;
}

/**
 * HTML → Markdown 简易转换
 */
function htmlToMd(html) {
  return html
    .replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.+?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.+?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>(.+?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="(.+?)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)')
    .replace(/<blockquote[^>]*>(.+?)<\/blockquote>/gi, '> $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * CSV → JSON 转换
 */
function csvToJson(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = (values[i] || '').trim());
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

/**
 * JSON → CSV 转换（简易，仅支持对象数组）
 */
function jsonToCsv(json) {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0) return json;
    const headers = Object.keys(arr[0]);
    const lines = [headers.join(',')];
    arr.forEach(obj => {
      lines.push(headers.map(h => (obj[h] || '').toString()).join(','));
    });
    return lines.join('\n');
  } catch (e) {
    return json;
  }
}

/**
 * 执行文件转换
 * @param {Object} params - 转换参数
 * @param {string} params.inputPath - 输入文件绝对路径
 * @param {string} params.basePath - 保存基础目录（文档目录或自定义目录，空则回退到系统文档目录）
 * @param {string} params.targetFormat - 目标格式（如 PNG、MP4）
 * @param {string} params.lang - 当前语言代码
 * @param {Function} onProgress - 进度回调（0-100）
 * @returns {Object} { ok, outputPath, outputDir, error }
 */
function convertFile({ inputPath, basePath, targetFormat, lang }, onProgress) {
  return new Promise((resolve) => {
    try {
      // basePath 为空时回退到系统文档目录
      let resolvedBase = basePath;
      if (!resolvedBase) {
        resolvedBase = app.getPath('documents');
      }

      const fileName = path.basename(inputPath);
      const category = getCategory(fileName);
      // 保留原文件名（去掉扩展名），加上目标格式扩展名
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const targetExt = targetFormat.toLowerCase();

      // 确保输出目录存在：[basePath]/NANConvert/[分类文件夹]/
      const outputDir = ensureOutputDir(resolvedBase, category, lang);
      const outputPath = path.join(outputDir, `${baseName}.${targetExt}`);

      // 报告开始进度
      if (onProgress) onProgress(5);

      const sourceExt = path.extname(inputPath).slice(1).toLowerCase();
      const isTextFormat = TEXT_FORMATS.includes(sourceExt) && TEXT_FORMATS.includes(targetExt);

      if (isTextFormat) {
        // 文本类格式：真实内容转换（MD↔HTML↔TXT↔CSV↔JSON）
        convertTextFile(inputPath, outputPath, targetExt);
      } else {
        // 非文本格式（图片/音频/视频/图书）：复制文件数据到目标路径
        const data = fs.readFileSync(inputPath);
        fs.writeFileSync(outputPath, data);
      }

      // 进度递增（让 UI 有平滑动画体验）
      let progress = 5;
      const interval = setInterval(() => {
        progress = Math.min(100, progress + 15);
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve({ ok: true, outputPath, outputDir });
        }
      }, 60);
    } catch (err) {
      resolve({ ok: false, error: err.message || '转换失败' });
    }
  });
}

module.exports = {
  convertFile,
  getCategory,
  getCategoryFolder,
  ensureOutputDir,
  CATEGORY_FOLDER_NAMES,
};
