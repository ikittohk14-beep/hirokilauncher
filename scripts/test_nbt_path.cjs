const nbt = require('prismarine-nbt');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('/home/ikitto/.local/share/hiroki-launcher/game_data/instances/inst_1788690861934_e89afe/servers.dat');
  const { parsed } = await nbt.parse(buf);
  const servers = parsed.value.servers?.value?.value || [];
  console.log(servers.map(s => ({ name: s.name?.value, ip: s.ip?.value })));
}
main().catch(console.error);
