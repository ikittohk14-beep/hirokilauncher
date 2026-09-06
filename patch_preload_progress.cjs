const fs = require('fs');
let code = fs.readFileSync('./src/preload/index.ts', 'utf8');

if (!code.includes('onInstallProgress')) {
  code = code.replace(/onProgress: \(callback: \(progress: LaunchProgress\) => void\) => \{/, 
    `onInstallProgress: (callback: (percentage: number) => void) => {
      const listener = (_event: any, p: number) => callback(p);
      ipcRenderer.on('install:progress', listener);
      return () => ipcRenderer.removeListener('install:progress', listener);
    },
    onProgress: (callback: (progress: LaunchProgress) => void) => {`);
  fs.writeFileSync('./src/preload/index.ts', code);
}

let types = fs.readFileSync('./src/preload/types.ts', 'utf8');
if (!types.includes('onInstallProgress')) {
  types = types.replace(/onProgress: \(callback: \(progress: LaunchProgress\) => void\) => \(\) => void;/, 
    `onInstallProgress: (callback: (percentage: number) => void) => () => void;
    onProgress: (callback: (progress: LaunchProgress) => void) => () => void;`);
  fs.writeFileSync('./src/preload/types.ts', types);
}
