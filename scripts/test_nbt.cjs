const nbt = require('prismarine-nbt');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('/home/ikitto/.local/share/hiroki-launcher/game_data/instances/inst_1788690861934_e89afe/servers.dat');
  const { parsed } = await nbt.parse(buf);
  console.log(JSON.stringify(parsed, null, 2));
}
main().catch(console.error);
