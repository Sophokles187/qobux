#!/bin/bash
set -e

# Qobux System Installation Script
# Installs AppImage system-wide with proper desktop integration

APP_NAME="Qobux"
APP_ID="io.github.Sophokles187.qobux"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"

# Find the AppImage
APPIMAGE_PATH="$(pwd)/release/Qobux-1.0.0.AppImage"

if [ ! -f "$APPIMAGE_PATH" ]; then
    echo "❌ AppImage not found at $APPIMAGE_PATH"
    echo "Run 'npm run dist' first to build the AppImage"
    exit 1
fi

echo "🔧 Installing $APP_NAME system-wide..."

# Create directories
mkdir -p "$INSTALL_DIR" "$DESKTOP_DIR" "$ICON_DIR"

# Copy AppImage to local bin
echo "📦 Installing AppImage..."
cp "$APPIMAGE_PATH" "$INSTALL_DIR/qobux"
chmod +x "$INSTALL_DIR/qobux"

# Copy icon
echo "🎨 Installing icon..."
cp "assets/icon.png" "$ICON_DIR/$APP_ID.png"

# Create desktop entry
echo "🖥️  Creating desktop entry..."
cat > "$DESKTOP_DIR/$APP_ID.desktop" << EOF
[Desktop Entry]
Name=Qobux
Comment=Qobuz Desktop Client
Exec=$INSTALL_DIR/qobux
Icon=$APP_ID
Type=Application
Categories=AudioVideo;Audio;Player;
StartupNotify=true
MimeType=x-scheme-handler/qobuz;
EOF

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    echo "🔄 Updating desktop database..."
    update-desktop-database "$DESKTOP_DIR"
fi

echo "✅ Installation complete!"
echo ""
echo "🚀 You can now:"
echo "   • Find 'Qobux' in your application menu"
echo "   • Run from terminal: qobux"
echo ""
echo "📝 To update, run: ./scripts/update-system.sh"
