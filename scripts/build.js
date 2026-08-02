const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'src');
const out = path.join(__dirname, '..', 'dist');

function copyFile(srcPath, destPath) {
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
fs.mkdirSync(out, { recursive: true });
const files = walk(src).filter((file) => !file.endsWith('.map'));
for (const file of files) {
  const rel = path.relative(src, file);
  copyFile(file, path.join(out, rel));
}
console.log('Built static site to dist/');
