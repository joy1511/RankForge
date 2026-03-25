#!/bin/bash

# RankForge Setup Script
# This script automates the setup process for RankForge

set -e  # Exit on error

echo "================================"
echo "RankForge Setup Script"
echo "================================"
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.11 or higher is required"
    echo "   Current version: $python_version"
    exit 1
fi
echo "✓ Python version: $python_version"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "✓ pip upgraded"
echo ""

# Install dependencies
echo "Installing dependencies..."
echo "This may take a few minutes..."
pip install -r requirements.txt > /dev/null 2>&1
echo "✓ Dependencies installed"
echo ""

# Set up environment file
echo "Setting up environment file..."
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping..."
else
    cp .env.example .env
    echo "✓ .env file created from template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY"
    echo ""
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p output
echo "✓ Directories created"
echo ""

# Run tests
echo "Running tests to verify installation..."
if pytest tests/ -v --tb=short > /dev/null 2>&1; then
    echo "✓ All tests passed"
else
    echo "⚠️  Some tests failed. This is normal if API keys are not configured yet."
fi
echo ""

echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OPENAI_API_KEY"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the application: uvicorn app.main:app --reload"
echo "4. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "For more information, see:"
echo "- QUICKSTART.md for quick start guide"
echo "- ARCHITECTURE.md for system architecture"
echo "- DEPLOYMENT.md for production deployment"
echo ""
