import http from 'http';
import net from 'net';

export class LocalProxy {
  private server: http.Server | null = null;
  public port: number = 0;

  public async start(upstreamProxyUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = new URL(upstreamProxyUrl);
      const upstreamHost = url.hostname;
      const upstreamPort = Number(url.port);
      const auth = Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64');
      
      this.server = http.createServer((req, res) => {
        const options = {
          hostname: upstreamHost,
          port: upstreamPort,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            'Proxy-Authorization': `Basic ${auth}`
          }
        };
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        req.pipe(proxyReq, { end: true });
        proxyReq.on('error', () => { res.writeHead(500); res.end(); });
      });

      this.server.on('connect', (req, clientSocket, head) => {
        const proxySocket = net.connect(upstreamPort, upstreamHost, () => {
          proxySocket.write(`CONNECT ${req.url} HTTP/1.1\r\n` +
                            `Host: ${req.url}\r\n` +
                            `Proxy-Authorization: Basic ${auth}\r\n\r\n`);
          if (head && head.length > 0) proxySocket.write(head);
        });

        let connected = false;
        proxySocket.on('data', (chunk) => {
          if (!connected) {
            const str = chunk.toString();
            if (str.startsWith('HTTP/1.1 200')) {
              connected = true;
              clientSocket.write(chunk);
              proxySocket.pipe(clientSocket);
              clientSocket.pipe(proxySocket);
            } else {
              clientSocket.end();
            }
          }
        });
        proxySocket.on('error', () => clientSocket.end());
        clientSocket.on('error', () => proxySocket.end());
      });

      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server?.address() as net.AddressInfo;
        this.port = address.port;
        resolve(this.port);
      });
      
      this.server.on('error', reject);
    });
  }

  public stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
