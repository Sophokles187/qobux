#!/bin/bash
set -e

# Qobux System Uninstall Script

APP_ID="io.github.Sophokles187.qobux"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"

echo "🗑️  Uninstalling Qobux..."

# Stop running instance if exists
if pgrep -f "qobux" > /dev/null; then
    echo "🛑 Stopping running instance..."
    pkill -f "qobux" || true
    sleep 2
fi

# Remove files
echo "📦 Removing files..."
rm -f "$INSTALL_DIR/qobux"
rm -f "$DESKTOP_DIR/$APP_ID.desktop"
rm -f "$ICON_DIR/$APP_ID.png"

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    echo "🔄 Updating desktop database..."
    update-desktop-database "$DESKTOP_DIR"
fi

echo "✅ Uninstall complete!"
