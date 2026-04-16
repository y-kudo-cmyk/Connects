const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f === 'node_modules' || f === '.next') continue;
      results = results.concat(walkDir(full));
    } else if (f.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const files = [...walkDir('components'), ...walkDir('app')];
const jaRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

const issues = [];
for (const file of files) {
  // Admin pages are Japanese-only, skip
  if (file.includes('admin')) continue;

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (trimmed.startsWith('import ')) return;

    // Remove inline comments
    const noComment = line.replace(/\/\/.*$/g, '');
    if (jaRegex.test(noComment)) {
      const shortFile = file.split(path.sep).slice(-3).join('/');
      issues.push(shortFile + ':' + (i+1) + '  ' + trimmed.slice(0,120));
    }
  });
}

issues.forEach(i => console.log(i));
console.log('\nTotal:', issues.length);
