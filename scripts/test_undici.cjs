const { fetch, ProxyAgent } = require('undici');
async function test() {
  const dispatcher = process.env.HTTPS_PROXY ? new ProxyAgent(process.env.HTTPS_PROXY) : undefined;
  try {
    const res = await fetch('https://api.modrinth.com/v2/search?query=fabric', { dispatcher });
    console.log(res.status);
  } catch(e) { console.error(e); }
}
test();
