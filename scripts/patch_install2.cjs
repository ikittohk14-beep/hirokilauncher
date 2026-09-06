const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

const handleSpecific = `
  const handleInstallSpecificVersion = async (item: any, versionToInstall: any) => {
    if (!targetInstanceId) {
      alert('Пожалуйста, выберите целевую сборку для установки.');
      return;
    }
    setInstallingId(item.id);
    setInstallProgress(10);
    
    let simProgress = 10;
    const interval = setInterval(() => {
      simProgress += Math.random() * 15;
      if (simProgress > 90) simProgress = 90;
      setInstallProgress(simProgress);
    }, 200);

    try {
      if (category === 'modpack') {
        await window.electronAPI.content.installModpack(versionToInstall, item.title);
        onInstanceCreated();
        setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));
      } else {
        const ok = await window.electronAPI.content.installContent(
          targetInstanceId,
          item.id,
          source,
          versionToInstall,
          category
        );
        if (ok) {
          const meta = await window.electronAPI.instances.getModsMetadata(targetInstanceId);
          setInstalledMap(meta || {});
          const mods = await window.electronAPI.instances.getMods(targetInstanceId);
          setLocalMods(mods || []);
        }
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      clearInterval(interval);
      setInstallProgress(100);
      setTimeout(() => setInstallingId(null), 300);
    }
  };

`;

code = code.replace(/const handleUninstall = async/, handleSpecific + "const handleUninstall = async");

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
