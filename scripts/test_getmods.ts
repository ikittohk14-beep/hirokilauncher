import { InstancesService } from './src/main/services/storage/instances.service';
const svc = InstancesService.getInstance();
const instances = svc.getAll();
if (instances.length > 0) {
  console.log('Testing instance:', instances[0].id);
  const mods = svc.getInstalledMods(instances[0].id);
  console.log('Found mods:', mods.length);
  console.log(mods.slice(0, 2));
} else {
  console.log('No instances found');
}
