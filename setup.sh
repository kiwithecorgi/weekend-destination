#!/bin/bash

# Weekender App Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Weekender - Family & Pet-Friendly Outing Planner"
echo "================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies with legacy peer deps to handle conflicts
echo "📦 Installing client dependencies..."
cd client
npm install --legacy-peer-deps
cd ..

# Create environment files
echo "🔧 Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please update server/.env with your API keys:"
    echo "   - GOOGLE_PLACES_API_KEY"
    echo "   - Firebase configuration"
else
    echo "✅ Server environment file already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    echo "📝 Creating client environment file..."
    cp client/env.example client/.env
    echo "⚠️  Please update client/.env with your API keys:"
    echo "   - REACT_APP_GOOGLE_MAPS_API_KEY"
else
    echo "✅ Client environment file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment files with your API keys"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Required API Keys:"
echo "- Google Places API (for venue data)"
echo "- Google Maps API (for static maps)"
echo "- Firebase/Firestore (for data storage)"
echo ""
echo "Happy coding! 🐾" 