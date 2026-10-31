const fs = require('fs');
const path = require('path');

const actionRoutePath = path.join(__dirname, '../src/app/[action]/route.ts');
const content = fs.readFileSync(actionRoutePath, 'utf8');

const lines = content.split('\n');
const unawaitedActionLines = [];
lines.forEach((line, idx) => {
  if (line.includes('commitDb(') && !line.includes('await commitDb(')) {
    unawaitedActionLines.push({ lineNum: idx + 1, line: line.trim() });
  }
});

console.log('Unawaited commitDb count in [action]/route.ts:', unawaitedActionLines.length);
