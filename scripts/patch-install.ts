import fs from 'node:fs';
import path from 'node:path';

export function patchInstall() {
  const content = fs.readFileSync('src/main/ipc/register.ts', 'utf-8');
  const target = `    'content:installContent',
    async (_event, instanceId: string, projectId: string, source: 'modrinth' | 'curseforge', version: import('../../../preload/types').ContentVersion, category: import('../../../preload/types').ContentCategory) => {
      try {
        const instanceDir = InstancesService.getInstance().getInstanceDir(instanceId);
        const ok = await ContentService.getInstance().installContentIntoInstance(instanceDir, version, category);
        if (ok) {
          const meta = InstancesService.getInstance().getById(instanceId);
          if (meta) {
            meta.installedContent = meta.installedContent || {};
            meta.installedContent[version.filename] = {
              projectId,
              source,
              versionId: version.id
            };
            const configPath = require('node:path').join(instanceDir, 'instance.json');
            require('node:fs').writeFileSync(configPath, JSON.stringify(meta, null, 2));
          }
        }
        return ok;
      } catch (err) {`;

  const re = /    'content:installContent',\n    async \(_event, instanceId: string, version: ContentVersion, category: ContentCategory\) => \{\n      try \{\n        const instanceDir = InstancesService\.getInstance\(\)\.getInstanceDir\(instanceId\);\n        return await ContentService\.getInstance\(\)\.installContentIntoInstance\(instanceDir, version, category\);\n      \} catch \(err\) \{/;
  const newContent = content.replace(re, target);
  fs.writeFileSync('src/main/ipc/register.ts', newContent);
}
patchInstall();
