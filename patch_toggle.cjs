const fs = require('fs');
let code = fs.readFileSync('./src/main/services/storage/instances.service.ts', 'utf8');

const oldCode = `  public toggleMod(instanceId: string, filename: string, enabled: boolean): boolean {
    const folderName = type === 'shader' ? 'shaderpacks' : type === 'resourcepack' ? 'resourcepacks' : 'mods';
      const modsDir = path.join(this.getInstanceDir(instanceId), folderName);
    const currentPath = path.join(modsDir, filename);

    try {
      if (!fs.existsSync(currentPath)) return false;`;

const newCode = `  public toggleMod(instanceId: string, filename: string, enabled: boolean): boolean {
    const folders = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'saves'];
    let modsDir = '';
    let currentPath = '';
    for (const folder of folders) {
      const p = path.join(this.getInstanceDir(instanceId), folder, filename);
      if (fs.existsSync(p)) {
        modsDir = path.join(this.getInstanceDir(instanceId), folder);
        currentPath = p;
        break;
      }
    }

    try {
      if (!currentPath || !fs.existsSync(currentPath)) return false;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('./src/main/services/storage/instances.service.ts', code);
