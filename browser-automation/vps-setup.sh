#!/bin/bash
# VPS Setup Script for Browser Automation
# Run this on your Hostinger VPS: ssh claudeuser@68.183.42.69

set -e

echo "=========================================="
echo "  Browser Automation VPS Setup"
echo "=========================================="

# Check if running as appropriate user
echo "[1/7] Checking environment..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version)"
else
    echo "✗ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✓ npm $(npm --version)"
else
    echo "✗ npm not found"
    exit 1
fi

# Install PM2 globally if not present
echo "[2/7] Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "✓ PM2 installed"
else
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Create app directory
echo "[3/7] Setting up directory..."
APP_DIR="$HOME/browser-automation"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone or update repo
echo "[4/7] Getting code..."
if [ -d ".git" ]; then
    echo "Updating existing repo..."
    git pull origin claude/browser-automation-login-MuZZu
else
    echo "Cloning repo..."
    git clone -b claude/browser-automation-login-MuZZu https://github.com/shredathletics/coaching.git temp
    mv temp/browser-automation/* .
    rm -rf temp
fi

# Install dependencies
echo "[5/7] Installing Node.js dependencies..."
npm install

# Install Playwright browsers with dependencies
echo "[6/7] Installing Playwright Chromium..."
npx playwright install chromium
npx playwright install-deps chromium

# Create .env file if not exists
echo "[7/7] Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "=========================================="
    echo "  IMPORTANT: Configure your credentials!"
    echo "=========================================="
    echo ""
    echo "Edit the .env file with your TrainingPeaks login:"
    echo "  nano $APP_DIR/.env"
    echo ""
    echo "Set these values:"
    echo "  TRAININGPEAKS_EMAIL=your-email@example.com"
    echo "  TRAININGPEAKS_PASSWORD=your-password"
    echo "  HEADLESS=true"
    echo ""
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure credentials:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Test the automation:"
echo "   cd $APP_DIR && node trainingpeaks.js"
echo ""
echo "3. Start the server with PM2:"
echo "   cd $APP_DIR && pm2 start server.js --name browser-automation"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. The server will be available at:"
echo "   http://localhost:3001"
echo ""
echo "5. In n8n, use HTTP Request node with:"
echo "   POST http://localhost:3001/trainingpeaks/athletes"
echo ""
