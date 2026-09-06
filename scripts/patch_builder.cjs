const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
// Ensure nsis doesn't try to run things that break wine
pkg.build.nsis = {
  ...pkg.build.nsis,
  runAfterFinish: false
};
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
