#!/bin/bash

# Bendle Test Script
echo "🧪 Testing Bendle Project Setup"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Not in Bendle project root directory"
    exit 1
fi

echo "✅ Project structure looks good"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18+ (current: $NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
if [ "$PYTHON_MAJOR" -lt 3 ]; then
    echo "❌ Python version must be 3.9+ (current: $PYTHON_VERSION)"
    exit 1
fi
echo "✅ Python version: $PYTHON_VERSION"

# Check if required files exist
REQUIRED_FILES=(
    "backend/main.py"
    "backend/requirements.txt"
    "frontend/package.json"
    "frontend/src/App.tsx"
    "contracts/CitadelRegistry.sol"
    "contracts/X402Settlement.sol"
    "hardhat.config.js"
    "scripts/deploy.js"
    "start-dev.sh"
    "start-prod.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    fi
done
echo "✅ All required files present"

# Test backend dependencies
echo "🔍 Checking backend dependencies..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found"
    exit 1
fi

# Check if key packages are in requirements.txt
REQUIRED_PACKAGES=("fastapi" "uvicorn" "aioquic" "langchain" "websockets")
for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! grep -q "$package" requirements.txt; then
        echo "❌ Missing package in requirements.txt: $package"
        exit 1
    fi
done
echo "✅ Backend dependencies configured"
cd ..

# Test frontend dependencies
echo "🔍 Checking frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Check if key packages are in package.json
REQUIRED_FRONTEND_PACKAGES=("react" "reactflow" "wagmi" "tailwindcss")
for package in "${REQUIRED_FRONTEND_PACKAGES[@]}"; do
    if ! grep -q "$package" package.json; then
        echo "❌ Missing package in package.json: $package"
        exit 1
    fi
done
echo "✅ Frontend dependencies configured"
cd ..

# Test contract compilation
echo "🔍 Testing contract compilation..."
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found"
    exit 1
fi

if npx hardhat compile 2>/dev/null; then
    echo "✅ Contracts compile successfully"
else
    echo "❌ Contract compilation failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Bendle is ready to run."
echo ""
echo "Next steps:"
echo "1. Run development environment: ./start-dev.sh"
echo "2. Deploy contracts: npm run deploy:contracts"
echo "3. Test the application in your browser"