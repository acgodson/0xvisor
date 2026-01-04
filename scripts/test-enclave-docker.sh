#!/bin/bash
set -e

EC2_IP="35.159.224.254"
KEY_PATH="$HOME/uburu-routing-key.pem"

echo "🧪 Testing Enclave Docker Container on EC2"
echo "==========================================="

ssh -i $KEY_PATH ec2-user@$EC2_IP << 'EOF'
  echo ""
  echo "Checking if container is running..."
  if ! docker ps | grep -q 0xvisor-test; then
    echo "❌ Container 0xvisor-test is not running"
    echo "Please run deploy script first: ./scripts/deploy-enclave.sh"
    exit 1
  fi

  echo "✅ Container is running"

  echo ""
  echo "1️⃣  Testing Health Check..."
  HEALTH_RESPONSE=$(echo '{"type":"HEALTH_CHECK"}' | nc localhost 5000)
  echo "Response: $HEALTH_RESPONSE"

  if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
  else
    echo "❌ Health check failed"
    exit 1
  fi

  echo ""
  echo "2️⃣  Testing Provision Key..."
  PROVISION_RESPONSE=$(echo '{"type":"PROVISION_KEY","sessionAccountId":"test-session-123","privateKey":"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","userAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","adapterId":"test-adapter","deployParams":{}}' | nc localhost 5000)
  echo "Response: $PROVISION_RESPONSE"

  if echo "$PROVISION_RESPONSE" | grep -q "sessionAccountAddress"; then
    echo "✅ Provision key passed"
  else
    echo "❌ Provision key failed"
    exit 1
  fi

  echo ""
  echo "3️⃣  Testing Invalid Request..."
  INVALID_RESPONSE=$(echo '{"type":"INVALID"}' | nc localhost 5000)
  echo "Response: $INVALID_RESPONSE"

  if echo "$INVALID_RESPONSE" | grep -q "Unknown request type"; then
    echo "✅ Error handling works correctly"
  else
    echo "❌ Error handling test failed"
    exit 1
  fi

  echo ""
  echo "==========================================="
  echo "✅ All Docker tests passed!"
  echo ""
  echo "Container is ready for production use!"
EOF

echo ""
echo "Next steps:"
echo "1. All Docker tests passed - ready to build Nitro Enclave"
echo "2. Use 'nitro-cli build-enclave' to convert Docker to .eif file"
echo "3. Deploy the .eif to your EC2 Nitro instance"
