import fs from 'node:fs';
const content = fs.readFileSync('src/renderer/src/pages/Instances.tsx', 'utf-8');
const target = `    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchLoaders = async () => {
      if (!selectedGameVersion || selectedLoader === 'vanilla') {
        setLoaderVersions([]);
        setSelectedLoaderVersion('');
        return;
      }
      setLoadingLoaders(true);
      try {
        const loaders = await window.electronAPI.versions.getLoaderVersions(selectedGameVersion, selectedLoader);
        if (mounted) {
          setLoaderVersions(loaders);
          if (loaders.length > 0) {
            setSelectedLoaderVersion(loaders[0].version);
          } else {
            setSelectedLoaderVersion('');
          }
        }
      } catch (err) {
        console.error('[Instances] Failed to fetch loader versions:', err);
      } finally {
        if (mounted) setLoadingLoaders(false);
      }
    };
    fetchLoaders();
    return () => {
      mounted = false;
    };
  }, [selectedGameVersion, selectedLoader]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !selectedGameVersion) return;

    setIsSubmitting(true);
    try {
      await window.electronAPI.instances.create({
        name: newInstanceName.trim(),
        gameVersion: selectedGameVersion,
        loaderType: selectedLoader,
        loaderVersion: selectedLoader === 'vanilla' ? '' : selectedLoaderVersion,
      });
      setIsModalOpen(false);
      setNewInstanceName('');
      onRefresh();
    } catch (err) {
      console.error('[Instances] Failed to create instance:', err);
      alert('Ошибка при создании сборки.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (`;

const newContent = content.replace(/    return \(\n    <div className="h-full flex flex-col relative overflow-hidden">/, target + '\n    <div className="h-full flex flex-col relative overflow-hidden">');
fs.writeFileSync('src/renderer/src/pages/Instances.tsx', newContent);
