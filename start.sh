#!/bin/bash

# NetRecon Start Script
# Starts all services (Backend, Frontend, MongoDB)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        NetRecon - Starting All Services...               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if MongoDB is running
echo "Checking MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅${NC} MongoDB is running"
else
    echo -e "${YELLOW}ℹ️${NC} MongoDB not running. Start it in a separate terminal:"
    echo "   mongod"
    echo ""
    read -p "Press Enter to continue..."
fi

echo ""

# Start Backend
echo -e "${BLUE}Starting Backend...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✅${NC} Backend started (PID: $BACKEND_PID)"
sleep 2

cd ..
echo ""

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✅${NC} Frontend started (PID: $FRONTEND_PID)"

cd ..
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        All Services Started! 🚀                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Dashboard:  http://localhost:3000"
echo "📡 API:        http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
