#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  sudo pkill vsock-proxy 2>/dev/null || true

  nohup sudo vsock-proxy 8000 16 5000 > /tmp/vsock-proxy.log 2>&1 &

  sleep 2
  echo "vsock-proxy started on port 8000"
  echo "Testing connection..."
  echo '{"type":"HEALTH_CHECK"}' | nc localhost 8000
EOF
