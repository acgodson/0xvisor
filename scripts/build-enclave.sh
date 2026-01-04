#!/bin/bash
set -e

echo "Building enclave application..."
pnpm -F @0xvisor/enclave build

echo "Building Docker image (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  -t 0xvisor-enclave:latest \
  -f Dockerfile.enclave \
  --load .


