# Qobux

An unofficial desktop client for the Qobuz music streaming service, built with Electron for Linux.

## Overview

Qobux provides a native desktop experience for Qobuz streaming on Linux, featuring:

- [x] Basic Electron window with Qobuz web app
- [x] System tray icon with basic controls  
- [x] Window management (minimize/restore)
- [x] MPRIS support for media keys
- [x] Desktop notifications

## Installation

*Installation packages will be available once development is complete.*

Planned distribution methods:
- **Flatpak** via Flathub (primary)
- **AppImage** for direct download
- **AUR** package for Arch Linux users


## Audio Quality

- **Supported:** CD Quality (16-bit/44.1kHz) via Qobuz Web Player
- **Limitation:** Hi-Res Audio (24-bit/192kHz) not supported due to browser limitations
- **Future:** Native Hi-Res support planned for future versions

## Flathub Preparation

This project is being prepared for Flathub distribution. Current status:

### ✅ Ready:
- Application ID: `io.github.Sophokles187.qobux`
- Runtime: `org.freedesktop.Platform 24.08`
- GPL-3.0 License
- GitHub repository

### 📝 TODO for Flathub:
- [ ] Create screenshots for MetaInfo file
- [ ] Update brand colors in MetaInfo
- [ ] Create proper application icon (distinct from Qobuz branding)
- [ ] Create Flatpak manifest
- [ ] Test Flatpak build process

## Legal Notice

Qobux is an **unofficial** desktop client for Qobuz. This project is not affiliated with, endorsed by, or connected to Qobuz in any way. All trademarks belong to their respective owners.

The application provides a desktop wrapper around the official Qobuz web application and does not modify or redistribute Qobuz's content or services.

## License

GPL v3 - See [LICENSE](LICENSE) file for details.

