import { LaunchService } from './src/main/services/launcher/launch.service.js';
import { InstancesService } from './src/main/services/storage/instances.service.js';
import { AccountsService } from './src/main/services/storage/accounts.service.js';
import { GameInstallerService } from './src/main/services/minecraft/game-installer.service.js';

// We can just call GameInstallerService directly to see if it works!
async function test() {
  const instances = InstancesService.getInstance();
  const inst = instances.getById('inst_1788625789015_c9071c');
  if (!inst) { console.error('Not found'); return; }
  console.log('Testing', inst.name);
  try {
    const res = await GameInstallerService.getInstance().prepareGameFiles(inst, (p) => console.log(p));
    console.log('Success!', res.mainClass);
  } catch(e) {
    console.error('ERROR:', e);
  }
}
test();
