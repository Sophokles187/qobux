#!/bin/bash
set -e

# Qobux System Update Script
# Updates the installed AppImage with the latest build

APP_NAME="Qobux"
INSTALL_DIR="$HOME/.local/bin"

echo "🔄 Updating $APP_NAME..."

# Pull latest changes if this is a git repo
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull
fi

# Install dependencies if package.json changed
echo "📦 Installing dependencies..."
npm install

# Build new version
echo "🔨 Building new version..."
npm run build
npm run dist

# Find the new AppImage
APPIMAGE_PATH="$(pwd)/release/Qobux-1.0.0.AppImage"

if [ ! -f "$APPIMAGE_PATH" ]; then
    echo "❌ New AppImage not found at $APPIMAGE_PATH"
    exit 1
fi

# Stop running instance if exists
if pgrep -f "qobux" > /dev/null; then
    echo "🛑 Stopping running instance..."
    pkill -f "qobux" || true
    sleep 2
fi

# Replace the installed AppImage
echo "📦 Installing new version..."
cp "$APPIMAGE_PATH" "$INSTALL_DIR/qobux"
chmod +x "$INSTALL_DIR/qobux"

echo "✅ Update complete!"
echo "🚀 You can now start the updated version from your app menu or run: qobux"
