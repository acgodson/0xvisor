#!/usr/bin/env python3
import socket
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

ENCLAVE_CID = 16
ENCLAVE_PORT = 5000
HTTP_PORT = 8000

class VsockProxy(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)

        try:
            message = json.loads(body)
            s = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
            s.connect((ENCLAVE_CID, ENCLAVE_PORT))
            s.sendall((json.dumps(message) + '\n').encode())

            response = b''
            while True:
                chunk = s.recv(4096)
                if not chunk:
                    break
                response += chunk
                if b'\n' in chunk:
                    break

            s.close()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response.strip())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', HTTP_PORT), VsockProxy)
    print(f'HTTP→vsock proxy on :{HTTP_PORT} → vsock:{ENCLAVE_CID}:{ENCLAVE_PORT}')
    server.serve_forever()
