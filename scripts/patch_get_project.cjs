const fs = require('fs');
const path = './src/main/services/content/content.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const \[projRes, versRes\] = await Promise\.all\(\[\n.*?net\.fetch\(\`\$\{this\.modrinthBase\}\/project\/\$\{id\}\`, \{ headers: \{ 'User-Agent': 'HirokiLauncher\/1\.0' \} \}\),\n.*?net\.fetch\(\`\$\{this\.modrinthBase\}\/project\/\$\{id\}\/version\`, \{ headers: \{ 'User-Agent': 'HirokiLauncher\/1\.0' \} \}\)\n.*?\]\);\n.*?const proj = await projRes\.json\(\);\n.*?const vers = await versRes\.json\(\);\n.*?return \{\n.*?id: proj\.id,\n.*?title: proj\.title,\n.*?description: proj\.description,\n.*?body: proj\.body,\n.*?gallery: proj\.gallery \|\| \[\],\n.*?versions: vers\.map\(\(v: any\) => \(\{\n.*?id: v\.id,\n.*?name: v\.name,\n.*?version_number: v\.version_number,\n.*?game_versions: v\.game_versions,\n.*?loaders: v\.loaders,\n.*?\}\)\)\n.*?\};/s,
  `const [projRes, versions] = await Promise.all([
          net.fetch(\`\${this.modrinthBase}/project/\${id}\`, { headers: { 'User-Agent': 'HirokiLauncher/1.0' } }),
          this.getVersions(id, source)
        ]);
        const proj = await projRes.json();
        return {
          id: proj.id,
          title: proj.title,
          description: proj.description,
          body: proj.body,
          gallery: proj.gallery || [],
          versions: versions
        };`);

fs.writeFileSync(path, code);
