#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

echo "🧹 Cleaning up old enclave and containers on EC2..."

ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  echo "Terminating any running enclaves..."
  nitro-cli terminate-enclave --all 2>/dev/null || echo "No enclaves running"

  echo "Stopping all Docker containers..."
  docker stop $(docker ps -aq) 2>/dev/null || echo "No containers running"

  echo "Removing all Docker containers..."
  docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"

  echo "Removing old Docker images..."
  docker rmi 0xvisor-enclave:latest 2>/dev/null || echo "No old images to remove"

  echo "Cleaning up old .eif files..."
  rm -f ~/0xvisor-enclave.eif

  echo "Cleaning up temporary files..."
  rm -f ~/0xvisor-enclave.tar.gz

  echo "✅ Cleanup complete!"
EOF

echo "✅ All cleaned up and ready for fresh deployment!"
