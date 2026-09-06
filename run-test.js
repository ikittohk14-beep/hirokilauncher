import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { GameInstallerService } from './dist-electron/main/services/minecraft/game-installer.service.js';
import { InstancesService } from './dist-electron/main/services/storage/instances.service.js';

// Setup basic environment
process.env.XDG_DATA_HOME = path.join(os.homedir(), '.local', 'share');
const dataHome = process.env.XDG_DATA_HOME;
const baseDir = path.join(dataHome, 'hiroki-launcher');

async function testLaunch() {
  console.log("Loading instances...");
  const instances = InstancesService.getInstance().getAll();
  const instance = instances.find(i => i.id === 'inst_1788530159547_23c818');
  if (!instance) {
    console.error("Instance not found!");
    return;
  }
  
  console.log("Preparing game files...");
  const { classpath, mainClass, assetIndexId } = await GameInstallerService.getInstance().prepareGameFiles(instance);
  
  console.log("Building args...");
  const jvmArgs = [
    '-Xms1024M',
    '-Xmx4096M',
    '-XX:+UseG1GC',
    '-Djava.library.path=' + path.join(baseDir, 'game_data', 'versions', instance.gameVersion, 'natives'),
    '-cp', classpath.join(':'),
    mainClass
  ];
  
  const gameArgs = [
    '--username', 'Player',
    '--version', instance.gameVersion,
    '--gameDir', path.join(baseDir, 'game_data', 'instances', instance.id),
    '--assetsDir', path.join(baseDir, 'game_data', 'assets'),
    '--assetIndex', assetIndexId,
    '--uuid', '00000000000000000000000000000000',
    '--accessToken', '0',
    '--userType', 'legacy',
    '--versionType', 'HirokiLauncher'
  ];
  
  console.log("Spawning java...");
  const child = spawn('/usr/bin/java', [...jvmArgs, ...gameArgs], {
    cwd: path.join(baseDir, 'game_data', 'instances', instance.id),
    env: process.env
  });
  
  child.stdout.on('data', d => console.log('STDOUT:', d.toString()));
  child.stderr.on('data', d => console.error('STDERR:', d.toString()));
  child.on('close', c => console.log('CLOSED:', c));
}

testLaunch().catch(e => console.error('FATAL:', e));
