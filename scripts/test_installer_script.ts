import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function test() {
  const sharedDir = '/home/ikitto/.local/share/hiroki-launcher/game_data';
  const toolsDir = path.join(sharedDir, 'tools');
  const installerPath = path.join(toolsDir, 'neoforge-21.1.50-installer.jar');
  
  if (!fs.existsSync(installerPath)) {
    console.error('Installer not found at', installerPath);
    return;
  }
  
  const profilesPath = path.join(sharedDir, 'launcher_profiles.json');
  if (!fs.existsSync(profilesPath)) {
    fs.writeFileSync(profilesPath, '{"profiles":{}}');
  }

  console.log('Running installer...');
  await new Promise<void>((resolve, reject) => {
    const child = spawn('java', ['-jar', installerPath, '--installClient', sharedDir]);
    child.stdout.on('data', (d: any) => console.log('[Installer]', d.toString()));
    child.stderr.on('data', (d: any) => console.error('[Installer ERR]', d.toString()));
    child.on('error', reject);
    child.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`Installer exited with code ${code}`));
    });
  });
  console.log('Success!');
}
test().catch(console.error);
