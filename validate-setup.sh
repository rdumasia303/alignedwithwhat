#!/bin/bash

# Test validation script
# This script validates that the test setup works correctly

set -e

echo "🧪 Testing AlignedWithWhat Database Setup"
echo "========================================"

# Check if docker-compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ Error: docker compose is not installed"
    exit 1
fi

echo "✅ Docker Compose is available"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    exit 1
fi

echo "✅ Docker Compose configuration found"

# Test starting services
echo ""
echo "🚀 Starting main services..."
./db-manage.sh start

# Wait a bit for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo ""
echo "📊 Checking service status..."
./db-manage.sh status

# Test API health endpoint
echo ""
echo "🏥 Testing API health endpoint..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    ./db-manage.sh logs api
    exit 1
fi

# Test running tests
echo ""
echo "🧪 Running test suite..."
if ./db-manage.sh test; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
    exit 1
fi

# Test pgAdmin accessibility
echo ""
echo "🐘 Testing pgAdmin accessibility..."
if curl -s http://localhost:5050 | grep -q "pgAdmin"; then
    echo "✅ pgAdmin is accessible"
else
    echo "⚠️  pgAdmin might not be fully ready yet (this is normal)"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "Access points:"
echo "  🌐 API: http://localhost:8000"
echo "  🐘 pgAdmin: http://localhost:5050"
echo "  🗄️  PostgreSQL: localhost:5432"
echo ""
echo "Next steps:"
echo "  • Open http://localhost:8000 to explore the API"
echo "  • Run './db-manage.sh test' to run tests anytime"
echo "  • Run './db-manage.sh logs' to monitor services"
echo "  • Run './db-manage.sh stop' to stop all services"
