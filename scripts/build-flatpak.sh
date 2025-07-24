#!/bin/bash
set -e

# Qobux Flatpak Build Script
# This script builds and updates the local Flatpak installation

REPO_DIR="$HOME/.local/share/flatpak/repo"
BUILD_DIR="flatpak-build"
APP_ID="io.github.Sophokles187.qobux"

echo "🔨 Building Qobux..."

# Clean previous build
rm -rf "$BUILD_DIR"

# Build TypeScript first
npm run build

# Build Flatpak
flatpak-builder --user --install --force-clean "$BUILD_DIR" "$APP_ID.yml"

echo "✅ Build complete!"
echo "🚀 Run with: flatpak run $APP_ID"

# Optional: Create bundle for distribution
read -p "Create distribution bundle? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creating bundle..."
    flatpak build-bundle "$REPO_DIR" "qobux-$(date +%Y%m%d).flatpak" "$APP_ID"
    echo "✅ Bundle created: qobux-$(date +%Y%m%d).flatpak"
fi
