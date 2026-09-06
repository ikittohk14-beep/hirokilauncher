import fs from 'node:fs';

export function patchApp() {
  const content = fs.readFileSync('src/renderer/src/App.tsx', 'utf-8');
  let newContent = content;
  
  // Add BottomBar import
  newContent = newContent.replace(
    "import { Sidebar, NavTab } from './components/Sidebar';",
    "import { Sidebar, NavTab } from './components/Sidebar';\nimport { BottomBar } from './components/BottomBar';"
  );
  
  // Replace Sidebar prop (activeAccount removed)
  newContent = newContent.replace(
    /        <Sidebar\s*currentTab=\{currentTab\}\s*onTabChange=\{\(tab\) => \{\s*setCurrentTab\(tab\);\s*setManageInstanceId\(null\);\s*\}\}\s*activeAccount=\{activeAccount\}\s*\/>/m,
    `        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setManageInstanceId(null);
          }}
        />`
  );
  
  // Wrap main content
  const startIdx = newContent.indexOf('<main className="flex-1 bg-hiroki-dark min-w-0 overflow-hidden relative">');
  const mainOpen = '<main className="flex-1 bg-hiroki-dark min-w-0 flex flex-col relative overflow-hidden">\n          <div className="flex-1 overflow-hidden relative">';
  newContent = newContent.substring(0, startIdx) + mainOpen + newContent.substring(startIdx + '<main className="flex-1 bg-hiroki-dark min-w-0 overflow-hidden relative">'.length);
  
  const endIdx = newContent.indexOf('</main>');
  const mainClose = `          </div>
          <BottomBar
            activeAccount={activeAccount}
            instances={instances}
            selectedInstance={selectedInstance}
            onSelectInstance={setSelectedInstance}
            onLaunch={handleLaunch}
            onTabChange={(tab) => { setCurrentTab(tab); setManageInstanceId(null); }}
            isLaunching={launching}
          />
        </main>`;
  newContent = newContent.substring(0, endIdx) + mainClose + newContent.substring(endIdx + '</main>'.length);
  
  fs.writeFileSync('src/renderer/src/App.tsx', newContent);
}
patchApp();
