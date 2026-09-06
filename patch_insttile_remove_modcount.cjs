const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/InstanceShelf.tsx', 'utf8');

// The line is: <span style={{ color: getModCountColor(modCount) }}>{modCount} модов</span>
// Remove it entirely or replace with nothing
code = code.replace(/<div style=\{\{\n\s*fontSize: 11, display: 'flex', alignItems: 'center',\n\s*justifyContent: isAdd \? 'center' : 'flex-start', fontWeight: 700, paddingTop: 2,\n\s*\}\}>\n\s*\{isAdd \? \(\n\s*<span style=\{\{ color: 'var\(--blue\)', fontSize: 10 \}\}>\+ ДОБАВИТЬ<\/span>\n\s*\) : \(\n\s*<span style=\{\{ color: getModCountColor\(modCount\) \}\}>\{modCount\} модов<\/span>\n\s*\)\}\n\s*<\/div>/, 
  `<div style={{
          fontSize: 11, display: 'flex', alignItems: 'center',
          justifyContent: isAdd ? 'center' : 'flex-start', fontWeight: 700, paddingTop: 2,
        }}>
          {isAdd && (
            <span style={{ color: 'var(--blue)', fontSize: 10 }}>+ ДОБАВИТЬ</span>
          )}
        </div>`);

fs.writeFileSync('./src/renderer/src/components/InstanceShelf.tsx', code);
