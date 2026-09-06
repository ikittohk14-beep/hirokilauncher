const fs = require('fs');
const path = './src/main/services/content/content.service.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('getProjectDetails')) {
  const method = `
  public async getProjectDetails(id: string, source: 'modrinth' | 'curseforge') {
    if (source === 'modrinth') {
      try {
        const [projRes, versRes] = await Promise.all([
          net.fetch(\`\${this.modrinthBase}/project/\${id}\`, { headers: { 'User-Agent': 'HirokiLauncher/1.0' } }),
          net.fetch(\`\${this.modrinthBase}/project/\${id}/version\`, { headers: { 'User-Agent': 'HirokiLauncher/1.0' } })
        ]);
        const proj = await projRes.json();
        const vers = await versRes.json();
        return {
          id: proj.id,
          title: proj.title,
          description: proj.description,
          body: proj.body,
          gallery: proj.gallery || [],
          versions: vers.map((v: any) => ({
            id: v.id,
            name: v.name,
            version_number: v.version_number,
            game_versions: v.game_versions,
            loaders: v.loaders,
          }))
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null; // CF fallback
  }
`;
  code = code.replace(/public async search\(/, method + '\n  public async search(');
  fs.writeFileSync(path, code);
}
