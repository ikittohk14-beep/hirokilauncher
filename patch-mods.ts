import fs from 'node:fs';
import path from 'node:path';

export function patchMods() {
  const content = fs.readFileSync('src/main/services/storage/instances.service.ts', 'utf-8');
  const target = `  public getInstalledMods(instanceId: string): InstalledModFile[] {
    const modsDir = path.join(this.getInstanceDir(instanceId), 'mods');
    const result: InstalledModFile[] = [];

    try {
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true });
        return [];
      }
      
      const meta = this.getById(instanceId);

      const files = fs.readdirSync(modsDir);
      for (const file of files) {
        if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) {
          const filePath = path.join(modsDir, file);
          const isEnabled = !file.endsWith('.disabled');
          let cleanName = file.replace('.disabled', '').replace('.jar', '');
          let version = 'unknown';
          let description = undefined;
          let iconUrl = undefined;
          
          try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(filePath);
            const fabricEntry = zip.getEntry('fabric.mod.json');
            if (fabricEntry) {
              const data = JSON.parse(fabricEntry.getData().toString('utf-8'));
              cleanName = data.name || data.id || cleanName;
              version = data.version || version;
              description = data.description;
              if (data.icon) {
                let iconPath = typeof data.icon === 'string' ? data.icon : data.icon['128x128'] || data.icon['64x64'] || data.icon['32x32'];
                if (iconPath) {
                  if (iconPath.startsWith('/')) iconPath = iconPath.slice(1);
                  const iconEntry = zip.getEntry(iconPath);
                  if (iconEntry) {
                    iconUrl = 'data:image/png;base64,' + iconEntry.getData().toString('base64');
                  }
                }
              }
            } else {
              const forgeEntry = zip.getEntry('META-INF/mods.toml');
              if (forgeEntry) {
                const text = forgeEntry.getData().toString('utf-8');
                const nameMatch = text.match(/displayName\\s*=\\s*"([^"]+)"/);
                const descMatch = text.match(/description\\s*=\\s*'([^']+)'|description\\s*=\\s*"([^"]+)"|description\\s*=\\s*'''([\\s\\S]*?)'''/);
                cleanName = nameMatch ? nameMatch[1] : cleanName;
                if (descMatch) description = descMatch[1] || descMatch[2] || descMatch[3];
                const versionMatch = text.match(/version\\s*=\\s*"([^"]+)"/);
                if (versionMatch && versionMatch[1] !== '\\$\\{file.jarVersion\\}') version = versionMatch[1];
              }
            }
          } catch(e) {}
          
          const cleanFilename = file.replace('.disabled', '');
          const installData = meta?.installedContent?.[cleanFilename];

          result.push({
            filename: file,
            name: cleanName,
            version: version,
            description: description,
            iconUrl: iconUrl,
            isEnabled: isEnabled,
            type: 'mod',
            projectId: installData?.projectId,
            source: installData?.source || 'local',
            versionId: installData?.versionId
          } as any);
        }
      }
    } catch (error) {
      console.error(\`[InstancesService] Failed to read mods for \${instanceId}:\`, error);
    }

    return result;
  }`;

  const re = /  public getInstalledMods\(instanceId: string\): InstalledModFile\[\] \{[\s\S]*?return result;\n  \}/;
  const newContent = content.replace(re, target);
  fs.writeFileSync('src/main/services/storage/instances.service.ts', newContent);
}
patchMods();
