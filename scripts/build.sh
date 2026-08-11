#!/bin/bash

cd "$(dirname "$0")/.."

echo "Building packages..."
cd packages/shared && npm install && npm run build && cd ../..

echo "Building API..."
cd apps/api && npm install && npm run build && cd ../..

echo "Building Web..."
cd apps/web && npm install && npm run build && cd ../..

echo "Building Display..."
cd apps/display && npm install && npm run build && cd ../..

echo "All builds completed!"
