const fs = require('fs');
let code = fs.readFileSync('./src/main/services/storage/instances.service.ts', 'utf8');

const oldFunc = `  public openFolder(instanceId: string): void {
    const dir = this.getInstanceDir(instanceId);
    try {
      // In Linux/CachyOS with driftwm, xdg-open triggers the default file manager (e.g. dolphin, thunar, nautilus)
      exec(\`xdg-open "\${dir}"\`, (err) => {
        if (err) {
          console.error('[InstancesService] xdg-open failed:', err);
        }
      });
    } catch (error) {
      console.error('[InstancesService] Failed to execute xdg-open:', error);
    }
  }`;

const newFunc = `  public openFolder(instanceId: string): void {
    const dir = this.getInstanceDir(instanceId);
    try {
      const { shell } = require('electron');
      shell.openPath(dir).then(error => {
        if (error) {
          console.error('[InstancesService] Failed to open path:', error);
        }
      });
    } catch (error) {
      console.error('[InstancesService] shell.openPath error:', error);
    }
  }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('./src/main/services/storage/instances.service.ts', code);
