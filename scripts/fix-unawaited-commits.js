const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let beforeMatches = (content.match(/(?<!await\s+)commitDb\(/g) || []).length;
  console.log(`Processing ${filePath}: found ${beforeMatches} unawaited commitDb calls`);

  // Replace occurrences of commitDb( that are NOT preceded by 'await '
  // Regex: replace (whitespace/start-of-statement)commitDb( with $1await commitDb(
  const updated = content.replace(/(^|[^a-zA-Z0-9_]await\s+)?([^a-zA-Z0-9_]|^)commitDb\(/g, (match, awaitPrefix, prefix) => {
    if (match.includes('await')) {
      return match;
    }
    return (prefix || '') + 'await commitDb(';
  });

  let afterMatches = (updated.match(/(?<!await\s+)commitDb\(/g) || []).length;
  console.log(`After replacement: ${afterMatches} unawaited commitDb calls`);

  fs.writeFileSync(filePath, updated, 'utf8');
}

const slugRoute = path.join(__dirname, '../src/app/api/[...slug]/route.ts');
const actionRoute = path.join(__dirname, '../src/app/[action]/route.ts');

fixFile(slugRoute);
fixFile(actionRoute);

