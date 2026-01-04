#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

echo "📦 Saving Docker image..."
docker save 0xvisor-enclave:latest | gzip > /tmp/0xvisor-enclave.tar.gz

echo "📤 Uploading to EC2..."
scp -i $KEY_PATH /tmp/0xvisor-enclave.tar.gz ec2-user@$EC2_IP:~/

echo "🧪 Testing Docker container on EC2..."
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  echo "Loading Docker image..."
  gunzip -c ~/0xvisor-enclave.tar.gz | docker load

  echo "Stopping any existing test container..."
  docker stop 0xvisor-test 2>/dev/null || true
  docker rm 0xvisor-test 2>/dev/null || true

  echo "Running Docker container for testing..."
  docker run -d \
    --name 0xvisor-test \
    -p 5000:5000 \
    0xvisor-enclave:latest

  echo ""
  echo "Container logs:"
  sleep 2
  docker logs 0xvisor-test

  echo ""
  echo "Testing connection..."
  sleep 1
  echo '{"type":"HEALTH_CHECK"}' | nc localhost 5000 || echo "Connection test failed"

  echo ""
  echo "Container status:"
  docker ps -a | grep 0xvisor-test

  echo ""
  echo "✅ Docker test complete!"
  echo "To view logs: docker logs -f 0xvisor-test"
  echo "To stop: docker stop 0xvisor-test"
  echo ""
  echo "If everything looks good, uncomment the enclave deployment section."
EOF

echo ""
echo "✅ Test deployment complete!"