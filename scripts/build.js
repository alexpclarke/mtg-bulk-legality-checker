// build.js
// Node.js script to create a dist folder with only the files needed to run the page
const fs = require('fs');
const path = require('path');

const DIST = 'dist';
const SRC = 'src';
const DATA_FILES = path.join(SRC, 'data_files');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST);

  // Copy index.html, update paths
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  html = html.replace('./src/style.css', './style.css')
             .replace('./src/main.js', './main.js');
  fs.writeFileSync(path.join(DIST, 'index.html'), html);

  // Copy CNAME if it exists in src
  const cnameSrc = path.join(SRC, 'CNAME');
  if (fs.existsSync(cnameSrc)) {
    copyFile(cnameSrc, path.join(DIST, 'CNAME'));
  }


  // Copy JS
  copyFile(path.join(SRC, 'main.js'), path.join(DIST, 'main.js'));
  copyFile(path.join(SRC, 'App.js'), path.join(DIST, 'App.js'));

  // Copy data_files (all CSVs)
  const distDataFiles = path.join(DIST, 'data_files');
  fs.mkdirSync(distDataFiles, { recursive: true });
  for (const file of fs.readdirSync(DATA_FILES)) {
    if (file.endsWith('.csv')) {
      copyFile(path.join(DATA_FILES, file), path.join(distDataFiles, file));
    }
  }

  // Generate index.json for data_files
  const csvFiles = fs.readdirSync(DATA_FILES).filter(f => f.endsWith('.csv'));
  fs.writeFileSync(path.join(distDataFiles, 'index.json'), JSON.stringify(csvFiles, null, 2));

  // Build SASS: src/style.sass -> dist/style.css
  const { execSync } = require('child_process');
  try {
    execSync('npx sass --no-source-map src/style.sass dist/style.css', { stdio: 'inherit' });
  } catch (err) {
    console.error('Sass build failed:', err);
    process.exit(1);
  }

  // Copy CNAME if it exists (after dist is created and populated)
  if (fs.existsSync('CNAME')) {
    copyFile('CNAME', path.join(DIST, 'CNAME'));
  }

  console.log('Build complete. Output in dist/');
}

main();
