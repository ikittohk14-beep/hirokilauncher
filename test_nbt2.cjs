const nbt = require('nbt');
const fs = require('fs');
const buf = fs.readFileSync('/home/ikitto/.local/share/hiroki-launcher/game_data/instances/inst_1788690861934_e89afe/servers.dat');

nbt.parse(buf, function(error, data) {
    if (error) { throw error; }
    console.log(JSON.stringify(data, null, 2));
});
