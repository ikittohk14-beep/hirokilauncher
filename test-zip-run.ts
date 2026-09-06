import AdmZip from 'adm-zip';
import fs from 'node:fs';

export function getModMetadata(filePath: string) {
  try {
    const zip = new AdmZip(filePath);
    
    // Check Fabric
    const fabricEntry = zip.getEntry('fabric.mod.json');
    if (fabricEntry) {
      const data = JSON.parse(fabricEntry.getData().toString('utf-8'));
      let iconBase64;
      if (data.icon) {
        let iconPath = typeof data.icon === 'string' ? data.icon : data.icon['128x128'] || data.icon['64x64'] || data.icon['32x32'];
        if (iconPath) {
          // trim leading slash
          if (iconPath.startsWith('/')) iconPath = iconPath.slice(1);
          const iconEntry = zip.getEntry(iconPath);
          if (iconEntry) {
            iconBase64 = `data:image/png;base64,${iconEntry.getData().toString('base64')}`;
          }
        }
      }
      return {
        name: data.name || data.id,
        version: data.version,
        description: data.description,
        icon: iconBase64
      };
    }
  } catch(e) {}
  return null;
}
