const fs = require('fs');
const path = require('path');
const { City } = require('country-state-city');

const allCities = City.getAllCities();
console.log('Exporting', allCities.length, 'cities with country_code...');

const lines = ['name,country_code,state_code'];
for (const c of allCities) {
  let name = c.name;
  if (name.includes(',') || name.includes('"')) {
    name = '"' + name.replace(/"/g, '""') + '"';
  }
  lines.push(`${name},${c.countryCode},${c.stateCode}`);
}

const csvPath = path.join(__dirname, '../../Orange/assets/csv/cities.csv');
fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
console.log('Successfully wrote to', csvPath);
