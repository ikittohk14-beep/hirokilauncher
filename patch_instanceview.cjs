const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/InstanceView.tsx', 'utf8');

// Update empty state text
code = code.replace(/\{searchQuery \? 'Моды по вашему запросу не найдены' : 'В этой сборке еще нет модов'\}/, 
  `{searchQuery 
    ? (activeTab === 'mods' ? 'Моды' : activeTab === 'resourcepacks' ? 'Ресурспаки' : 'Шейдеры') + ' по вашему запросу не найдены' 
    : (activeTab === 'mods' ? 'В этой сборке еще нет модов' : activeTab === 'resourcepacks' ? 'В этой сборке еще нет ресурспаков' : 'В этой сборке еще нет шейдеров')}`);

// Remove the placeholder block completely
const placeholderRegex = /\{\/\* Resourcepacks \/ Shaders tabs \*\/\}\n\s*\{activeTab !== 'mods' && \(\n\s*<div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-hiroki-border text-center">\n\s*<p className="text-xs text-slate-400 mb-3">\n\s*Вы можете найти \{activeTab === 'resourcepacks' \? 'ресурспаки' : 'шейдеры'\} в общем каталоге и установить в 1 клик\.\n\s*<\/p>\n\s*<div className="flex items-center gap-3">\n\s*<button\n\s*onClick=\{\(\) => onNavigateToCatalog\(activeTab === 'resourcepacks' \? 'resourcepack' : 'shader'\)\}\n\s*className="px-4 py-2 rounded-lg bg-\[var\(--blue\)\] hover:brightness-110 text-white text-xs font-semibold shadow-sm transition-all"\n\s*>\n\s*Искать \{activeTab === 'resourcepacks' \? 'ресурспаки' : 'шейдеры'\} в каталоге\n\s*<\/button>\n\s*<button\n\s*onClick=\{handleOpenFolder\}\n\s*className="px-4 py-2 rounded-lg bg-hiroki-card border border-hiroki-border text-slate-300 hover:text-white text-xs font-semibold transition-all"\n\s*>\n\s*Открыть папку\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

code = code.replace(placeholderRegex, '');

fs.writeFileSync('./src/renderer/src/pages/InstanceView.tsx', code);
