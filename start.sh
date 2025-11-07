#!/bin/bash

# AlignedWithWhat - Easy Startup Script

set -e

echo "🚀 Starting AlignedWithWhat..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 IMPORTANT: Edit .env and add your OPENROUTER_API_KEY"
    echo ""
    echo "   nano .env"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if OPENROUTER_API_KEY is set
if grep -q "your-openrouter-api-key-here" .env; then
    echo "⚠️  OPENROUTER_API_KEY not set in .env file!"
    echo ""
    echo "Please edit .env and add your OpenRouter API key:"
    echo ""
    echo "   nano .env"
    echo ""
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Build and start services
echo "🐳 Building Docker containers (this may take a few minutes first time)..."
docker compose build

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ AlignedWithWhat is running!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🔬 Research Playground:  http://localhost:5174"
echo "  📊 AVM Dashboard:         http://localhost:5173"
echo "  🔌 API:                   http://localhost:8000"
echo "  🗄️  pgAdmin:               http://localhost:5050"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Useful commands:"
echo ""
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo ""
echo "🎉 Happy researching!"
