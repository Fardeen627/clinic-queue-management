#!/bin/bash

cd "$(dirname "$0")/../infra"

echo "Starting Clinic Queue System..."
docker-compose up -d

echo ""
echo "Services started!"
echo "  Web (Reception/Doctor/Admin): http://localhost:3000"
echo "  Display (Waiting Room): http://localhost:3001"
echo "  API: http://localhost:8080"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
