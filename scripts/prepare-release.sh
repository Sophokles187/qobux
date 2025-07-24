#!/bin/bash
set -e

# Qobux Release Preparation Script
# Ensures consistent versioning across all files

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.1"
    exit 1
fi

VERSION=$1

# Validate version format (semantic versioning)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format. Use semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.0.1)"
    exit 1
fi

echo "🔄 Preparing release v$VERSION..."

# Update package.json version
echo "📝 Updating package.json..."
npm version $VERSION --no-git-tag-version

# Check if Flatpak manifest needs version update
FLATPAK_MANIFEST="io.github.Sophokles187.qobux.yml"
if [ -f "$FLATPAK_MANIFEST" ]; then
    echo "📝 Checking Flatpak manifest..."
    # Note: Flatpak versions are usually handled by the manifest's sources section
    echo "   Flatpak manifest found - ensure version consistency in sources"
fi

# Build and test
echo "🔨 Building application..."
npm run build
npm run dist

echo "✅ Release v$VERSION prepared!"
echo ""
echo "📝 Next steps:"
echo "1. Commit changes: git add . && git commit -m \"Release $VERSION\""
echo "2. Create and push tag: git tag $VERSION && git push origin $VERSION"
echo "3. GitHub Actions will automatically create the release"
echo ""
echo "🚀 Or run all at once:"
echo "   git add . && git commit -m \"Release $VERSION\" && git tag $VERSION && git push origin main && git push origin $VERSION"
