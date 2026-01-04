#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

echo "Uploading proxy..."
scp -i $KEY_PATH /Users/godson/Desktop/0xvisor/scripts/http-vsock-proxy.py ec2-user@$EC2_IP:~/

echo "Starting HTTP→vsock proxy..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  pkill -f http-vsock-proxy.py || true
  nohup python3 http-vsock-proxy.py > /tmp/http-proxy.log 2>&1 &
  sleep 2
  echo "Testing proxy..."
  curl -X POST http://localhost:8000 \
    -H "Content-Type: application/json" \
    -d '{"type":"HEALTH_CHECK"}'
EOF

echo ""
echo "✅ Proxy running on http://${EC2_IP}:8000"
echo "Set ENCLAVE_URL=http://${EC2_IP}:8000 in Vercel"
