# Qobux

An unofficial desktop client for the Qobuz music streaming service, built with Electron for Linux.

## Overview

Qobux provides a native desktop experience for Qobuz streaming on Linux, featuring:

- [x] Electron window with Qobuz web app
- [x] System tray icon with media controls  
- [x] MPRIS support for media keys
- [x] Desktop notifications

## Installation

### Flatpak (Recommended)
```bash
# Install from local bundle
flatpak install qobux.flatpak

# Run the application
flatpak run io.github.Sophokles187.qobux
```

### AppImage
```bash
# Download and run
chmod +x Qobux-1.0.0.AppImage
./Qobux-1.0.0.AppImage
```

### From Source
```bash
git clone https://github.com/Sophokles187/qobux.git
cd qobux
npm install
npm run build
npm start
```

## Legal Notice

Qobux is an **unofficial** desktop client for Qobuz. This project is not affiliated with, endorsed by, or connected to Qobuz in any way. All trademarks belong to their respective owners.

The application provides a desktop wrapper around the official Qobuz web application and does not modify or redistribute Qobuz's content or services.

## License

GPL v3 - See [LICENSE](LICENSE) file for details.

