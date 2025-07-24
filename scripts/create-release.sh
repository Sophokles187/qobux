#!/bin/bash
set -e

# Qobux Release Creation Script
# Creates builds and prepares them for GitHub release

VERSION=${1:-$(date +%Y%m%d)}
RELEASE_DIR="release-$VERSION"

echo "🚀 Creating release for version $VERSION..."

# Clean and build
echo "🧹 Cleaning previous builds..."
rm -rf release/ flatpak-build/ "$RELEASE_DIR"

echo "🔨 Building application..."
npm run build
npm run dist

# Build Flatpak bundle
echo "📦 Building Flatpak bundle..."
flatpak-builder --repo=repo --force-clean flatpak-build io.github.Sophokles187.qobux.yml
flatpak build-bundle repo "qobux-$VERSION.flatpak" io.github.Sophokles187.qobux

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy builds
echo "📋 Preparing release files..."
cp release/Qobux-*.AppImage "$RELEASE_DIR/"
cp "qobux-$VERSION.flatpak" "$RELEASE_DIR/"

# Create checksums
echo "🔐 Creating checksums..."
cd "$RELEASE_DIR"
sha256sum * > SHA256SUMS
cd ..

echo "✅ Release prepared in $RELEASE_DIR/"
echo ""
echo "📝 Next steps:"
echo "1. Create a git tag: git tag v$VERSION"
echo "2. Push the tag: git push origin v$VERSION"
echo "3. Go to GitHub and create a release from the tag"
echo "4. Upload files from $RELEASE_DIR/"
echo ""
echo "Or use GitHub CLI: gh release create v$VERSION $RELEASE_DIR/* --title \"Release v$VERSION\""
