const http = require('http');
const net = require('net');
const fs = require('fs');

const PORT = 8000;
const ENCLAVE_CID = 16;
const ENCLAVE_PORT = 5000;
const AF_VSOCK = 40;
const VMADDR_CID_ANY = -1;

function createVsockConnection(cid, port, callback) {
  const { spawn } = require('child_process');

  const nc = spawn('nc', ['--vsock', cid.toString(), port.toString()]);

  nc.on('error', callback);
  nc.on('spawn', () => callback(null, nc));

  return nc;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const message = JSON.parse(body);
      const messageStr = JSON.stringify(message) + '\n';

      const proc = spawn('nc', ['--vsock', ENCLAVE_CID.toString(), ENCLAVE_PORT.toString()]);

      proc.stdin.write(messageStr);
      proc.stdin.end();

      let response = '';
      proc.stdout.on('data', data => response += data.toString());

      proc.on('close', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(response.trim() || '{}');
      });

      proc.on('error', err => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`HTTP→vsock proxy on :${PORT} → vsock:${ENCLAVE_CID}:${ENCLAVE_PORT}`);
});
