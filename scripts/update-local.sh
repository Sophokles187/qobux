#!/bin/bash
set -e

# Qobux Local Update Script
# Quick update script for development

APP_ID="io.github.Sophokles187.qobux"
BUILD_DIR="flatpak-build"

echo "🔄 Updating Qobux..."

# Pull latest changes if this is a git repo
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Update Flatpak installation
echo "📦 Updating Flatpak..."
flatpak-builder --user --install --force-clean "$BUILD_DIR" "$APP_ID.yml"

echo "✅ Update complete!"
echo "🚀 Restart the app if it's running: flatpak run $APP_ID"
