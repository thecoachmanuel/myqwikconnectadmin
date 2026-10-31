const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '../src/app/api/[...slug]/route.ts');
const content = fs.readFileSync(routePath, 'utf8');

// Find all occurrences of commitDb
const lines = content.split('\n');
const unawaitedCommitLines = [];
lines.forEach((line, idx) => {
  if (line.includes('commitDb(') && !line.includes('await commitDb(')) {
    unawaitedCommitLines.push({ lineNum: idx + 1, line: line.trim() });
  }
});

console.log('Unawaited commitDb count:', unawaitedCommitLines.length);
unawaitedCommitLines.forEach(l => console.log(`  L${l.lineNum}: ${l.line}`));

