# Qobux

An unofficial desktop client for the Qobuz music streaming service, built with Electron for Linux.

## Overview

Qobux provides a native desktop experience for Qobuz streaming on Linux, featuring:

- Native desktop window for the Qobuz web app
- System tray integration
- Media key support (MPRIS)
- Desktop notifications for "Now Playing"
- Minimize to tray functionality

## Features

### Current Status
This project is in early development. Planned features include:

**MVP (Phase 1)**
- [x] Basic Electron window with Qobuz web app
- [x] System tray icon with basic controls  
- [x] Window management (minimize/restore)
- [x] AppImage packaging

**Version 1.0 (Phase 2)**
- [ ] MPRIS support for media keys
- [ ] Desktop notifications
- [ ] Custom branding
- [ ] Flatpak packaging


## Installation

*Installation packages will be available once development is complete.*

Planned distribution methods:
- **Flatpak** via Flathub (primary)
- **AppImage** for direct download
- **AUR** package for Arch Linux users

## Development

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Linux development environment

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd qobux

# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build && npm start

# Create distributable package
npm run dist
```

## Technology Stack

- **Electron** - Desktop app framework
- **TypeScript** - Primary language
- **Media Session API** - Cross-platform media controls integration
- **Node.js** - Backend runtime

## Legal Notice

Qobux is an **unofficial** desktop client for Qobuz. This project is not affiliated with, endorsed by, or connected to Qobuz in any way. All trademarks belong to their respective owners.

The application provides a desktop wrapper around the official Qobuz web application and does not modify or redistribute Qobuz's content or services.

## License

GPL v3 - See [LICENSE](LICENSE) file for details.

