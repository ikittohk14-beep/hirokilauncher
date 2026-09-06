const { InstancesService } = require('./dist-electron/main/services/storage/instances.service.js');
const { SettingsService } = require('./dist-electron/main/services/storage/settings.service.js');

SettingsService.getInstance().getSettings();
const instances = InstancesService.getInstance().getAll();
if (instances.length > 0) {
  console.log('Testing instance:', instances[0].id);
  const mods = InstancesService.getInstance().getInstalledMods(instances[0].id);
  console.log('Found mods:', mods.length);
  console.log(mods.slice(0, 2));
} else {
  console.log('No instances found.');
}
