#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "     TrackTogether - Application Startup Script"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
check_backend() {
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is already running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Backend is not running${NC}"
        return 1
    fi
}

# Check if frontend is running
check_frontend() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is already running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Frontend is not running${NC}"
        return 1
    fi
}

# Check environment variables
check_env() {
    echo ""
    echo "Checking environment configuration..."
    
    # Check backend .env
    if [ ! -f "backend/.env" ]; then
        echo -e "${RED}❌ backend/.env not found${NC}"
        echo "   Create backend/.env with your MongoDB URI"
        return 1
    fi
    
    # Check frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        echo -e "${RED}❌ frontend/.env.local not found${NC}"
        echo "   Create frontend/.env.local with your API keys"
        return 1
    fi
    
    # Check for placeholder keys
    if grep -q "your_clerk_publishable_key_here" frontend/.env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Clerk keys are placeholders${NC}"
        echo "   Get real keys from: https://dashboard.clerk.com"
        echo "   The app will work in limited mode"
    else
        echo -e "${GREEN}✅ Clerk keys configured${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment files present${NC}"
}

# Start backend
start_backend() {
    echo ""
    echo "Starting backend server..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi
    
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend started successfully${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Backend failed to start${NC}"
    return 1
}

# Start frontend
start_frontend() {
    echo ""
    echo "Starting frontend server..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend started successfully${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Frontend failed to start${NC}"
    return 1
}

# Check Ollama
check_ollama() {
    echo ""
    echo "Checking Ollama (AI features)..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama is not running (AI features will be limited)${NC}"
        echo "   To enable AI features:"
        echo "   1. Install Ollama: https://ollama.com"
        echo "   2. Run: ollama serve"
        echo "   3. Run: ollama pull llama2"
    fi
}

# Main execution
echo "Step 1: Checking current status..."
check_env

BACKEND_RUNNING=0
FRONTEND_RUNNING=0

if check_backend; then
    BACKEND_RUNNING=1
fi

if check_frontend; then
    FRONTEND_RUNNING=1
fi

if [ $BACKEND_RUNNING -eq 1 ] && [ $FRONTEND_RUNNING -eq 1 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Application is already running!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔧 Backend:  http://localhost:5000"
    echo ""
    check_ollama
    echo ""
    echo "Press Ctrl+C to stop this script"
    echo "(Servers will continue running in background)"
    echo ""
    wait
    exit 0
fi

echo ""
echo "Step 2: Starting services..."

if [ $BACKEND_RUNNING -eq 0 ]; then
    start_backend
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Failed to start backend. Check backend/logs for errors.${NC}"
        exit 1
    fi
else
    echo "Backend already running, skipping..."
fi

if [ $FRONTEND_RUNNING -eq 0 ]; then
    start_frontend
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Failed to start frontend. Check frontend/logs for errors.${NC}"
        exit 1
    fi
else
    echo "Frontend already running, skipping..."
fi

check_ollama

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 Application started successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔧 Backend:  http://localhost:5000/health"
echo ""
echo "📝 Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Sign up for an account (if Clerk keys are configured)"
echo "  3. Create a group from the dashboard"
echo ""
echo "⚠️  Important:"
echo "  - Make sure MongoDB Atlas cluster is active"
echo "  - Replace placeholder Clerk keys in frontend/.env.local"
echo "  - Check AUTHENTICATION_FIX.md for detailed setup"
echo ""
echo "Press Ctrl+C to stop this script"
echo "(Servers will continue running in background)"
echo ""

# Keep script running
wait
