# Installation Guide

This guide covers various installation methods for Qobux, including development setup and local installation options.

## Release Installation

### Flatpak Bundle (Recommended)
Download the latest `.flatpak` bundle from [GitHub Releases](https://github.com/Sophokles187/qobux/releases):

```bash
# Install the bundle
flatpak install qobux.flatpak

# Run the application
flatpak run io.github.Sophokles187.qobux
```

### AppImage
Download the latest `.AppImage` from [GitHub Releases](https://github.com/Sophokles187/qobux/releases):

```bash
# Make executable and run
chmod +x Qobux-*.AppImage
./Qobux-*.AppImage
```

## Development Installation

### From Source (Development)
For development and testing:

```bash
git clone https://github.com/Sophokles187/qobux.git
cd qobux
npm install
npm run build
npm start
```

For development with auto-rebuild:
```bash
npm run dev
```

### Local System Installation

#### Option 1: Flatpak (Recommended for developers)
Install locally with proper desktop integration:

```bash
# Build and install locally
./scripts/build-flatpak.sh

# Updates after code changes
./scripts/build-flatpak.sh
```

This provides:
- Desktop menu entry
- System tray integration
- Proper sandboxing
- Easy updates

#### Option 2: AppImage System Installation
Install AppImage system-wide with desktop integration:

```bash
# Build AppImage first
npm run dist

# Install system-wide
./scripts/install-system.sh

# Updates
./scripts/update-system.sh

# Uninstall
./scripts/uninstall-system.sh
```

This provides:
- Desktop menu entry
- Command-line access (`qobux`)
- Manual update process

## Scripts Overview

### Release Management
- `./scripts/prepare-release.sh <version>` - Prepare a new release with consistent versioning
- Automatically updates `package.json` and validates version format

### Local Installation Scripts
- `./scripts/build-flatpak.sh` - Build and install Flatpak locally
- `./scripts/install-system.sh` - Install AppImage system-wide
- `./scripts/update-system.sh` - Update installed AppImage
- `./scripts/uninstall-system.sh` - Remove system installation

### Development Workflow

#### Creating a Release
```bash
# Prepare release
./scripts/prepare-release.sh 1.0.1

# Commit and tag
git add .
git commit -m "Release 1.0.1"
git tag 1.0.1
git push origin main
git push origin 1.0.1
```

GitHub Actions will automatically:
- Build AppImage and Flatpak bundle
- Create GitHub release
- Upload build artifacts

#### Local Development Updates
```bash
# For Flatpak users
./scripts/build-flatpak.sh

# For AppImage users
./scripts/update-system.sh
```

## Requirements

### Runtime Requirements
- Linux distribution with Flatpak support OR AppImage support
- Audio system (PulseAudio/PipeWire)

### Development Requirements
- Node.js 18+
- npm
- Flatpak and flatpak-builder (for Flatpak builds)
- Standard build tools (gcc, make)

## Troubleshooting

### Flatpak Issues
```bash
# Check installation
flatpak list | grep qobux

# Reinstall if needed
flatpak uninstall io.github.Sophokles187.qobux
./scripts/build-flatpak.sh
```

### AppImage Issues
```bash
# Check if installed
ls ~/.local/bin/qobux

# Reinstall
./scripts/uninstall-system.sh
./scripts/install-system.sh
```

### Development Issues
```bash
# Clean build
npm run clean
npm install
npm run build
```
