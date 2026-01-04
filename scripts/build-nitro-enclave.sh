#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

echo "🛑 Stopping Docker container..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  docker stop 0xvisor-test 2>/dev/null || true
  docker rm 0xvisor-test 2>/dev/null || true
EOF

echo "🔨 Building Nitro Enclave..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  sudo nitro-cli build-enclave \
    --docker-uri 0xvisor-enclave:latest \
    --output-file 0xvisor-enclave.eif
EOF

echo "🚀 Running Nitro Enclave (1536 MB)..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  sudo nitro-cli terminate-enclave --all 2>/dev/null || true

  sudo nitro-cli run-enclave \
    --eif-path 0xvisor-enclave.eif \
    --cpu-count 2 \
    --memory 1536 \
    --enclave-name 0xvisor-enclave \
    --enclave-cid 16 \
    --debug-mode

  sleep 5
  sudo nitro-cli console --enclave-name 0xvisor-enclave
EOF

echo "✅ Enclave deployed!"
