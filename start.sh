# AI QA Planning Tool - Startup Script

set -e

echo "🚀 Starting AI Test Assistant..."

# Check if Python 3.13+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "✓ Python version: $PYTHON_VERSION"

# Install dependencies if needed
if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo "📦 Installing dependencies with uv..."
    uv sync
fi


echo "🌐 Starting server on http://localhost:8000"
echo "📋 Press Ctrl+C to stop"
echo ""

uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

