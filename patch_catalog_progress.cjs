const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

// Replace setInterval logic in handleInstallSpecificVersion
code = code.replace(/setInstallingId\(item\.id\);\n\s*setInstallProgress\(10\);\n\s*let simProgress = 10;\n\s*const interval = setInterval\(\(\) => \{\n\s*simProgress \+= Math\.random\(\) \* 15;\n\s*if \(simProgress > 90\) simProgress = 90;\n\s*setInstallProgress\(simProgress\);\n\s*\}, 200\);/s, 
  `setInstallingId(item.id);
    setInstallProgress(0);`);

code = code.replace(/clearInterval\(interval\);\n\s*setInstallProgress\(100\);\n\s*setTimeout\(\(\) => setInstallingId\(null\), 300\);/s, 
  `setInstallProgress(100);
      setTimeout(() => setInstallingId(null), 300);`);


// Replace setInterval logic in handleInstall
code = code.replace(/setInstallingId\(item\.id\);\n\s*setInstallProgress\(0\);\n\s*const progressInterval = setInterval\(\(\) => \{\n\s*setInstallProgress\(p => \(p < 90 \? p \+ Math\.random\(\) \* 5 \+ 2 : p\)\);\n\s*\}, 400\);/s, 
  `setInstallingId(item.id);
    setInstallProgress(0);`);

code = code.replace(/clearInterval\(progressInterval\);/g, `/* no interval */`);
code = code.replace(/clearInterval\(interval\);/g, `/* no interval */`);

// Add useEffect to listen to onInstallProgress globally in Catalog
if (!code.includes('onInstallProgress(')) {
  code = code.replace(/useEffect\(\(\) => \{\n\s*searchMods\(\);\n\s*\}, \[searchQuery, targetInstanceId, source, category, page\]\);/, 
    `useEffect(() => {
    searchMods();
  }, [searchQuery, targetInstanceId, source, category, page]);

  useEffect(() => {
    const unsub = window.electronAPI.content.onInstallProgress((progress) => {
      setInstallProgress(progress);
    });
    return () => unsub();
  }, []);`);
}

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
