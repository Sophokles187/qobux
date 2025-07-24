#!/bin/bash
set -e

# Qobux Local Installation Script
# This script sets up a local Flatpak repository for easy updates

APP_ID="io.github.Sophokles187.qobux"
REPO_DIR="$HOME/.local/share/flatpak/repo"
BUILD_DIR="flatpak-build"
DESKTOP_FILE="$HOME/.local/share/applications/qobux-dev.desktop"

echo "🔧 Setting up Qobux for local development..."

# Ensure flatpak repo directory exists
mkdir -p "$REPO_DIR"

# Build and install
echo "🔨 Building application..."
npm run build

echo "📦 Building Flatpak..."
flatpak-builder --user --install --force-clean "$BUILD_DIR" "$APP_ID.yml"

# Create a convenient desktop entry for development
echo "🖥️  Creating desktop entry..."
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Qobux (Dev)
Comment=Qobuz Desktop Client (Development Version)
Exec=flatpak run $APP_ID
Icon=$APP_ID
Type=Application
Categories=AudioVideo;Audio;Player;
StartupNotify=true
EOF

echo "✅ Installation complete!"
echo ""
echo "🚀 You can now:"
echo "   • Run from terminal: flatpak run $APP_ID"
echo "   • Find 'Qobux (Dev)' in your application menu"
echo ""
echo "📝 To update after making changes, run: ./scripts/update-local.sh"
