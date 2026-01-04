#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  echo "Testing Nitro Enclave via vsock..."

  echo '{"type":"HEALTH_CHECK"}' | sudo socat - VSOCK-CONNECT:16:5000

  echo ""
  echo "Enclave status:"
  sudo nitro-cli describe-enclaves
EOF
