const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

pkg.scripts['dist:win'] = "tsc && vite build && electron-builder --win";

pkg.build = {
  appId: "com.ikitto.hirokilauncher",
  productName: "HirokiLauncher",
  directories: {
    output: "dist_electron_bin"
  },
  files: [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  win: {
    target: "nsis",
    icon: "build/icon.png"
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
