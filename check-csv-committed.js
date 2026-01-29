const { execSync } = require('child_process');

try {
  const output = execSync('git status --porcelain data_files/*.csv', { encoding: 'utf8' });
  if (output.trim()) {
    console.warn('\x1b[33mWARNING: You have uncommitted CSV files in data_files/. Please commit them before deploying to ensure they are published.\x1b[0m');
    process.exit(1);
  }
} catch (e) {
  // If no files match, ignore
}
