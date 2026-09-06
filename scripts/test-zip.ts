import AdmZip from 'adm-zip';
import fs from 'node:fs';

export function getModMetadata(filePath: string) {
  try {
    const zip = new AdmZip(filePath);
    
    // Check Fabric
    const fabricEntry = zip.getEntry('fabric.mod.json');
    if (fabricEntry) {
      const data = JSON.parse(fabricEntry.getData().toString('utf-8'));
      return {
        name: data.name || data.id,
        version: data.version,
        description: data.description,
        icon: data.icon // could be path to icon in zip
      };
    }
    
    // Check Forge
    const forgeEntry = zip.getEntry('META-INF/mods.toml');
    if (forgeEntry) {
      // Very basic TOML parsing
      const text = forgeEntry.getData().toString('utf-8');
      const nameMatch = text.match(/displayName\s*=\s*"([^"]+)"/);
      const descMatch = text.match(/description\s*=\s*\'\'\'([\s\S]*?)\'\'\'/);
      const iconMatch = text.match(/logoFile\s*=\s*"([^"]+)"/);
      return {
        name: nameMatch ? nameMatch[1] : undefined,
        description: descMatch ? descMatch[1].trim() : undefined,
        icon: iconMatch ? iconMatch[1] : undefined,
      }
    }
  } catch (e) {
    // console.error(e);
  }
  return null;
}
