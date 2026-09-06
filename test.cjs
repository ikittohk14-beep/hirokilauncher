const https = require('https');
https.get('https://docs.ely.by/ru/oauth.html', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => require('fs').writeFileSync('/tmp/oauth.html', data));
}).on('error', (e) => console.error(e));
