import fs from 'node:fs';

export function fixTs() {
  // Fix App.tsx
  let app = fs.readFileSync('src/renderer/src/App.tsx', 'utf-8');
  // Remove duplicates
  app = app.replace(/selectedInstance={selectedInstance}\n\s*selectedInstance={selectedInstance}/g, 'selectedInstance={selectedInstance}');
  // Fix launching variable, it's 'isLaunching' in App.tsx!
  app = app.replace(/isLaunching=\{launching\}/g, 'isLaunching={isLaunching}');
  fs.writeFileSync('src/renderer/src/App.tsx', app);

  // Fix Instances.tsx
  let instances = fs.readFileSync('src/renderer/src/pages/Instances.tsx', 'utf-8');
  instances = instances.replace(/instances: InstanceMeta\[\];\n  onSelectInstance:/g, 'instances: InstanceMeta[];\n  selectedInstance: InstanceMeta | null;\n  onSelectInstance:');
  instances = instances.replace(/instances,\n  onSelectInstance,/g, 'instances,\n  selectedInstance,\n  onSelectInstance,');
  fs.writeFileSync('src/renderer/src/pages/Instances.tsx', instances);
}
fixTs();
