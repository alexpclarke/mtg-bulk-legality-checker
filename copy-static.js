const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(child => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const dist = path.join(__dirname, 'dist');
cleanDir(dist);
fs.mkdirSync(dist);

// Copy static files
['index.html', '404.html'].forEach(file => {
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dist, file));
});

// Copy src and data_files folders
['src', 'data_files'].forEach(folder => {
  if (fs.existsSync(folder)) copyRecursiveSync(folder, path.join(dist, folder));
});

console.log('Copied static site to dist/');
