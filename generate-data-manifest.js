const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data_files');
const outFile = path.join(dataDir, 'index.json');

const files = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.csv'));

fs.writeFileSync(outFile, JSON.stringify(files, null, 2));
console.log(`Wrote ${files.length} CSV filenames to data_files/index.json`);
