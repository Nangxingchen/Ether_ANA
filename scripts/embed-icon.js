// 后处理脚本：用 rcedit 将图标嵌入已构建的 exe
// 用法：node scripts/embed-icon.js [exePath] [iconPath]
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 查找 electron-builder 内置的 rcedit
function findRcedit() {
  const possiblePaths = [
    path.join(ROOT, 'node_modules', 'electron-builder', 'out', 'bin', 'rcedit.exe'),
    path.join(ROOT, 'node_modules', 'electron-builder', 'bin', 'rcedit.exe'),
  ];

  // 也在 electron 缓存中查找
  const cacheDir = path.join(ROOT, '.cache', 'electron-builder');
  if (fs.existsSync(cacheDir)) {
    // 搜索 electron-builder 下载的 rcedit
    const searchPaths = [
      path.join(cacheDir, 'win-unpacked', 'rcedit.exe'),
      path.join(cacheDir, 'rcedit.exe'),
    ];
    possiblePaths.push(...searchPaths);

    // 递归搜索
    try {
      const files = [];
      function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.name === 'rcedit.exe') files.push(full);
        }
      }
      walk(cacheDir);
      possiblePaths.push(...files);
    } catch (e) {}
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log('  Found rcedit:', p);
      return p;
    }
  }
  return null;
}

async function main() {
  const exePath = process.argv[2] || path.join(ROOT, 'dist', 'win-unpacked', '以太NAN文件转换器.exe');
  const iconPath = process.argv[3] || path.join(ROOT, 'assets', 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.error('EXE not found:', exePath);
    process.exit(1);
  }
  if (!fs.existsSync(iconPath)) {
    console.error('Icon not found:', iconPath);
    process.exit(1);
  }

  console.log('Embedding icon into exe...');
  console.log('  EXE:', exePath);
  console.log('  Icon:', iconPath);

  const rcedit = findRcedit();
  if (!rcedit) {
    // 如果找不到 rcedit，尝试用 npx electron-builder 的内置功能
    console.log('  rcedit not found in expected locations.');
    console.log('  Trying to download it via electron-builder...');

    // electron-builder 下载的 rcedit 通常在特定缓存路径
    const builderPkg = require('electron-builder');
    // 直接用 electron-builder 的 API 来设置图标
    try {
      const { build } = require('electron-builder');
      console.log('  Note: electron-builder would normally handle this.');
      console.log('  The icon is available at: assets/icon.ico');
      console.log('  It will be used by the app when running (window icon).');
      console.log('  For the exe icon, we need rcedit.exe or signtool.exe.');
    } catch (e) {
      console.log('  Cannot automatically embed icon into exe.');
      console.log('  The icon will still work as the window-level icon.');
    }
    return;
  }

  try {
    execSync(`"${rcedit}" "${exePath}" set icon "${iconPath}"`, {
      stdio: 'inherit',
      timeout: 30000,
    });
    console.log('  -> Icon embedded successfully!');
  } catch (err) {
    console.error('  Failed to embed icon:', err.message);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
