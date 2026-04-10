const fs = require('fs');
const path = require('path');

function findJapanese(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && !f.name.includes('node_modules')) {
      findJapanese(full);
    } else if (f.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('import ') || line.trim().startsWith('*')) return;
        if (line.includes('DUE_CONFIG') || line.includes('DAY_SHORT') || line.includes('nameJa')) return;
        if (line.includes('PRESET') || line.includes('console.')) return;
        if (/[\u3041-\u3096\u30A1-\u30FA\u4E00-\u9FFF]/.test(line)) {
          const rel = full.replace(/\\/g, '/');
          console.log(rel + ':' + (i+1) + ': ' + line.trim().slice(0, 100));
        }
      });
    }
  }
}
findJapanese('app');
findJapanese('components');
