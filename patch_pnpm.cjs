const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
if (!pkg.pnpm) pkg.pnpm = {};
pkg.pnpm.ignoredBuilds = ["electron-winstaller"];
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
