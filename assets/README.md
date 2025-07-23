# Assets Directory

This directory contains icons and images for the Qobux application.

## Required Files

- `icon.png` - Main application icon (512x512 recommended)
- `tray-icon.png` - System tray icon (16x16 or 22x22 recommended)

## Icon Requirements

### Main Icon (`icon.png`)
- Size: 512x512 pixels (PNG format)
- Used for: Application window, taskbar, app launcher
- Should be the main Qobux logo/branding

### Tray Icon (`tray-icon.png`)
- Size: 16x16 or 22x22 pixels (PNG format)
- Used for: System tray display
- Should be a simplified version that's readable at small sizes
- Consider using monochrome or high contrast design for better visibility

## Creating Icons

You can create simple placeholder icons using ImageMagick:

```bash
# Create main icon (512x512)
convert -size 512x512 xc:blue -fill white -gravity center -pointsize 72 -annotate +0+0 "Q" icon.png

# Create tray icon (22x22)
convert -size 22x22 xc:blue -fill white -gravity center -pointsize 16 -annotate +0+0 "Q" tray-icon.png
```

Or use any image editor like GIMP, Inkscape, or online tools.
