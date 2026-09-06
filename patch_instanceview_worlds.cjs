const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/InstanceView.tsx', 'utf8');

// Update State
code = code.replace(/useState<'mods' \| 'resourcepacks' \| 'shaders'>\('mods'\)/, "useState<'mods' | 'resourcepacks' | 'shaders' | 'maps'>('mods')");

// Update filter
code = code.replace(/const isRightType = \(activeTab === 'mods' && m\.type === 'mod'\) \|\| \n\s*\(activeTab === 'resourcepacks' && m\.type === 'resourcepack'\) \|\| \n\s*\(activeTab === 'shaders' && m\.type === 'shader'\);/, 
  `const isRightType = (activeTab === 'mods' && m.type === 'mod') || 
                        (activeTab === 'resourcepacks' && m.type === 'resourcepack') || 
                        (activeTab === 'shaders' && m.type === 'shader') ||
                        (activeTab === 'maps' && m.type === 'map');`);

// Add Maps tab
code = code.replace(/Шейдеры\n\s*<\/button>/, 
  `Шейдеры
        </button>
        <button
          onClick={() => setActiveTab('maps')}
          className={\`px-4 py-2 rounded-lg text-xs font-semibold transition-all \${
            activeTab === 'maps'
              ? 'bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }\`}
        >
          Миры
        </button>`);

// Fix activeTab checks for type assignment
code = code.replace(/const type = activeTab === 'mods' \? 'mod' : activeTab === 'resourcepacks' \? 'resourcepack' : 'shader';/, 
  "const type = activeTab === 'mods' ? 'mod' : activeTab === 'resourcepacks' ? 'resourcepack' : activeTab === 'shaders' ? 'shader' : 'map';");

code = code.replace(/onClick=\{\(\) => onNavigateToCatalog\(activeTab === 'mods' \? 'mod' : activeTab === 'resourcepacks' \? 'resourcepack' : 'shader'\)\}/g, 
  "onClick={() => onNavigateToCatalog(activeTab === 'mods' ? 'mod' : activeTab === 'resourcepacks' ? 'resourcepack' : activeTab === 'shaders' ? 'shader' : 'map')}");

// Fix empty states
code = code.replace(/\{searchQuery \n\s*\? \(activeTab === 'mods' \? 'Моды' : activeTab === 'resourcepacks' \? 'Ресурспаки' : 'Шейдеры'\) \+ ' по вашему запросу не найдены' \n\s*: \(activeTab === 'mods' \? 'В этой сборке еще нет модов' : activeTab === 'resourcepacks' \? 'В этой сборке еще нет ресурспаков' : 'В этой сборке еще нет шейдеров'\)\}/, 
  `{searchQuery 
    ? (activeTab === 'mods' ? 'Моды' : activeTab === 'resourcepacks' ? 'Ресурспаки' : activeTab === 'shaders' ? 'Шейдеры' : 'Миры') + ' по вашему запросу не найдены' 
    : (activeTab === 'mods' ? 'В этой сборке еще нет модов' : activeTab === 'resourcepacks' ? 'В этой сборке еще нет ресурспаков' : activeTab === 'shaders' ? 'В этой сборке еще нет шейдеров' : 'В этой сборке еще нет миров')}`);

code = code.replace(/\{activeTab === 'mods' \? 'Добавить \.jar файл' : 'Добавить \.zip архив'\}/, 
  "{activeTab === 'mods' ? 'Добавить .jar файл' : 'Добавить .zip архив'}");

fs.writeFileSync('./src/renderer/src/pages/InstanceView.tsx', code);
