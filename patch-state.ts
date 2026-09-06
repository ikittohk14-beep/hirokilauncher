import fs from 'node:fs';

export function patchState() {
  const content = fs.readFileSync('src/renderer/src/pages/InstanceView.tsx', 'utf-8');
  let newContent = content.replace(
    /  const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `  const [searchQuery, setSearchQuery] = useState('');\n  const [updatingMod, setUpdatingMod] = useState<string | null>(null);\n  const [modVersions, setModVersions] = useState<import('../../../preload/types').ContentVersion[]>([]);\n  const [selectedVersionId, setSelectedVersionId] = useState<string>('');`
  );
  fs.writeFileSync('src/renderer/src/pages/InstanceView.tsx', newContent);
}
patchState();
