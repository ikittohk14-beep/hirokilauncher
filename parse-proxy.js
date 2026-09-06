const proxyUrlStr = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrlStr) {
  try {
    const proxyUrl = new URL(proxyUrlStr);
    console.log(`-Dhttp.proxyHost=${proxyUrl.hostname}`);
    console.log(`-Dhttp.proxyPort=${proxyUrl.port}`);
    if (proxyUrl.username) {
      console.log(`-Dhttp.proxyUser=${decodeURIComponent(proxyUrl.username)}`);
      console.log(`-Dhttp.proxyPassword=${decodeURIComponent(proxyUrl.password)}`);
    }
  } catch(e) {}
}
