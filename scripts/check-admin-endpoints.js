const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(fullPath));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(fullPath);
  });
  return results;
}

const files = getFiles('src/app');
const endpoints = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/fetch\(['"](\/[a-zA-Z0-9_\-]+)/g);
  for (const m of matches) {
    if (!m[1].startsWith('/api/')) endpoints.add(m[1].substring(1));
  }
});

const actionRoute = fs.readFileSync('src/app/[action]/route.ts', 'utf8');
const missingInAction = [];
for (const ep of endpoints) {
  if (!actionRoute.includes(`action === '${ep}'`) && !actionRoute.includes(`action === "${ep}"`)) {
    missingInAction.push(ep);
  }
}

console.log('Total admin fetch endpoints:', endpoints.size);
console.log('Endpoints:', [...endpoints]);
console.log('Missing in [action]/route.ts:', missingInAction);

