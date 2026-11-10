// 生成 ICO 图标文件（从 JPG 转换为 ICO 和 PNG）
// 用法：node scripts/generate-ico.js
const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico').default;

const ROOT = path.resolve(__dirname, '..');
const SRC_JPG = path.join(ROOT, 'PNG', 'logo.jpg');
const OUT_ICO = path.join(ROOT, 'assets', 'icon.ico');
const OUT_PNG = path.join(ROOT, 'assets', 'icon.png');
const OUT_TRAY_PNG = path.join(ROOT, 'assets', 'tray-icon.png');

async function main() {
  console.log('生成 ICO 图标...');
  console.log('  源图像:', SRC_JPG);

  // 用 Jimp 读取 JPG 并转为 256x256 PNG
  const image = await Jimp.read(SRC_JPG);
  image.cover({ w: 256, h: 256 });
  const pngBuffer = await image.getBuffer('image/png');

  // 保存 PNG 版本（256x256）
  fs.writeFileSync(OUT_PNG, pngBuffer);
  console.log('  -> PNG 已保存:', OUT_PNG);

  // 用 png-to-ico 的 default 导出，直接传文件路径
  const icoBuffer = await pngToIco(OUT_PNG);
  fs.writeFileSync(OUT_ICO, icoBuffer);
  console.log('  -> ICO 已保存:', OUT_ICO);

  // 生成 16x16 小图标用于托盘
  const smallImage = image.clone().cover({ w: 16, h: 16 });
  const smallPng = await smallImage.getBuffer('image/png');
  fs.writeFileSync(OUT_TRAY_PNG, smallPng);
  console.log('  -> 托盘图标已保存:', OUT_TRAY_PNG);
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
