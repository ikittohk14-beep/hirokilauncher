import { spawn } from 'child_process';
import fs from 'fs';

fs.writeFileSync('/tmp/hiroki-game.log', '');

const child = spawn('./node_modules/.bin/electron', ['.'], {
  env: process.env,
  detached: true
});
child.unref();
console.log("Launched Electron app.");
