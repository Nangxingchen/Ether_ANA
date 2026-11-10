// 构建准备脚本：复制 src/ → build/src/ 并混淆所有 JS 文件
// 同时复制 assets/ → build/assets/
// 原始 src/ 目录完全不变

const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico').default;
const JavaScriptObfuscator = require('javascript-obfuscator');

// 路径常量
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const ASSETS_DIR = path.join(ROOT, 'assets');
const BUILD_DIR = path.join(ROOT, 'build');
const BUILD_SRC_DIR = path.join(BUILD_DIR, 'src');
const BUILD_ASSETS_DIR = path.join(BUILD_DIR, 'assets');

// 混淆配置（中等强度：平衡安全保护与运行性能）
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 递归混淆目录下所有 .js 文件
function obfuscateJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      obfuscateJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        const result = JavaScriptObfuscator.obfuscate(code, {
          ...OBFUSCATOR_OPTIONS,
          inputFileName: entry.name
        });
        fs.writeFileSync(fullPath, result.getObfuscatedCode(), 'utf8');
        console.log(`  [OK] ${path.relative(BUILD_SRC_DIR, fullPath)}`);
      } catch (err) {
        console.error(`  [FAIL] ${path.relative(BUILD_SRC_DIR, fullPath)}: ${err.message}`);
      }
    }
  }
}

// 从 JPG 源图生成应用图标（ICO + PNG + 托盘小图标）
async function generateIcons(srcJpg, outDir) {
  try {
    const image = await Jimp.read(srcJpg);
    image.cover({ w: 256, h: 256 });
    const pngBuffer = await image.getBuffer('image/png');
    fs.writeFileSync(path.join(outDir, 'icon.png'), pngBuffer);
    console.log('  -> icon.png (256x256)');

    const icoBuffer = await pngToIco(path.join(outDir, 'icon.png'));
    fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuffer);
    console.log('  -> icon.ico');

    const smallImage = image.clone().cover({ w: 16, h: 16 });
    const smallPng = await smallImage.getBuffer('image/png');
    fs.writeFileSync(path.join(outDir, 'tray-icon.png'), smallPng);
    console.log('  -> tray-icon.png (16x16)');
  } catch (err) {
    console.error(`  [FAIL] 图标生成: ${err.message}`);
  }
}

// ==================== 主流程 ====================
console.log('\n========== 构建准备开始 ==========\n');

// 1. 清理旧构建目录
console.log('[1/5] 清理旧构建目录...');
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });
console.log('  -> 已清理');

// 2. 复制源代码 src/ → build/src/
console.log('\n[2/5] 复制源代码到构建目录...');
copyDir(SRC_DIR, BUILD_SRC_DIR);
console.log('  -> src/ 已复制');

// 3. 复制资源 assets/ → build/assets/（logo.jpg 等运行时引用）
console.log('\n[3/5] 复制资源文件...');
if (fs.existsSync(ASSETS_DIR)) {
  copyDir(ASSETS_DIR, BUILD_ASSETS_DIR);
  console.log('  -> assets/ 已复制');
} else {
  fs.mkdirSync(BUILD_ASSETS_DIR, { recursive: true });
  console.log('  -> assets/ 不存在，创建空目录');
}

// 4. 混淆所有 JS 文件（仅作用于 build/src/ 副本，原始 src/ 不受影响）
console.log('\n[4/5] 混淆 JavaScript 文件...');
obfuscateJsFiles(BUILD_SRC_DIR);

// 5. 从 PNG/logo.jpg 重新生成应用图标（确保每次构建使用最新图标）
console.log('\n[5/5] 生成应用图标...');
const SRC_JPG = path.join(ROOT, 'PNG', 'logo.jpg');
if (fs.existsSync(SRC_JPG)) {
  generateIcons(SRC_JPG, BUILD_ASSETS_DIR);
} else {
  console.log('  -> PNG/logo.jpg 不存在，跳过图标生成');
}

console.log('\n========== 构建准备完成 ==========');
console.log('混淆源代码: build/src/');
console.log('运行时资源: build/assets/');
console.log('NSIS 安装器: 原生外观（跟随系统深浅色模式）');
console.log('\n下一步: 运行 npm run build:win 开始打包');
