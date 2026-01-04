const net = require('net');
const vsock = require('vsock');

const LOCAL_PORT = 8000;
const ENCLAVE_CID = 16;
const ENCLAVE_PORT = 5000;

const server = net.createServer((clientSocket) => {
  const enclaveSocket = new vsock.VsockStream(ENCLAVE_CID, ENCLAVE_PORT);

  clientSocket.pipe(enclaveSocket).pipe(clientSocket);

  clientSocket.on('error', () => enclaveSocket.destroy());
  enclaveSocket.on('error', () => clientSocket.destroy());
});

server.listen(LOCAL_PORT, () => {
  console.log(`Proxy listening on localhost:${LOCAL_PORT} -> vsock:${ENCLAVE_CID}:${ENCLAVE_PORT}`);
});
