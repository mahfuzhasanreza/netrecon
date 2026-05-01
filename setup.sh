#!/bin/bash

# NetRecon Setup Script
# This script sets up the complete NetRecon environment

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        NetRecon Installation & Setup Script               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if MongoDB is installed or running
if ! command -v mongod &> /dev/null; then
    echo "ℹ️  MongoDB not found locally."
    echo "   Options:"
    echo "   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
    echo "   2. Use MongoDB Atlas (Cloud): https://www.mongodb.com/cloud/atlas"
    echo ""
    read -p "Press Enter to continue..."
fi

# Check if Nmap is installed
if ! command -v nmap &> /dev/null; then
    echo "❌ Nmap is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y nmap
fi

echo "✅ Nmap found"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your MongoDB URI and JWT secret"
fi

npm install
echo "✅ Backend dependencies installed"
cd ..
echo ""

# Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..
echo ""

# Make bash script executable
echo "🔧 Setting up bash script..."
chmod +x netrecon.sh
echo "✅ netrecon.sh is now executable"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            Setup Complete! 🎉                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Start MongoDB (if local):"
echo "   mongod"
echo ""
echo "2️⃣  Start Backend (new terminal):"
echo "   cd backend && npm run dev"
echo ""
echo "3️⃣  Start Frontend (new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "4️⃣  Or use Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "5️⃣  Use the bash script directly:"
echo "   ./netrecon.sh"
echo ""
echo "📖 Documentation: See README.md"
echo "🔗 Dashboard: http://localhost:3000"
echo "📡 API: http://localhost:5000"
echo ""
echo "Happy scanning! 🔍"
