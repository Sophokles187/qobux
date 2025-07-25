import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface AppSettings {
  notificationsEnabled: boolean;
}

class QobuxApp {
  // App constants
  private static readonly QOBUZ_URL = 'https://play.qobuz.com';
  private static readonly DEFAULT_WINDOW_WIDTH = 1200;
  private static readonly DEFAULT_WINDOW_HEIGHT = 800;
  private static readonly MIN_WINDOW_WIDTH = 800;
  private static readonly MIN_WINDOW_HEIGHT = 600;

  // Timing constants
  private static readonly DOM_READY_DELAY = 100;
  private static readonly TRACK_CHECK_DELAY = 1000;

  // UI Text constants
  private static readonly MENU_SHOW = 'Show Qobux';
  private static readonly MENU_HIDE = 'Hide Qobux';
  private static readonly MENU_PLAY_PAUSE = 'Play/Pause';
  private static readonly MENU_NEXT = 'Next Track';
  private static readonly MENU_PREVIOUS = 'Previous Track';
  private static readonly MENU_NOTIFICATIONS = 'Notifications';
  private static readonly MENU_QUIT = 'Quit';
  private static readonly TRAY_TOOLTIP = 'Qobux - Qobuz Desktop Client';

  // Media command constants
  private static readonly CMD_PLAY_PAUSE = 'playpause';
  private static readonly CMD_NEXT = 'next';
  private static readonly CMD_PREVIOUS = 'previous';

  // Icon path constants
  private static readonly ICON_MAIN = '../assets/icon.png';
  private static readonly ICON_TRAY_WHITE = '../assets/tray-icon-white.png';
  private static readonly ICON_TRAY_BLACK = '../assets/tray-icon-black.png';

  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private settings: AppSettings = { notificationsEnabled: true };
  private settingsPath!: string;

  constructor() {
    this.initializeSettings();
    this.setupApp();
  }

  private initializeSettings(): void {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.loadSettings();
  }

  // Simple logging helpers
  private log(message: string, ...args: any[]): void {
    console.log(`[Qobux] ${message}`, ...args);
  }

  private logError(message: string, error?: any): void {
    console.error(`[Qobux ERROR] ${message}`, error);
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        this.settings = { ...this.settings, ...JSON.parse(data) };
        this.log('Settings loaded successfully');
      } else {
        this.log('No settings file found, using defaults');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logError('Settings file contains invalid JSON, using defaults', error);
      } else if (error instanceof Error && error.message.includes('EACCES')) {
        this.logError('Permission denied reading settings file, using defaults', error);
      } else {
        this.logError('Failed to load settings, using defaults', error);
      }
    }
  }

  private saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      this.logError('Could not save settings:', error);
    }
  }

  private setupApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      this.setupIPC();

      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        this.log('Blocked new window creation to:', url);
        return { action: 'deny' };
      });
    });
  }

  private setupIPC(): void {
    // Handle notification requests from renderer
    ipcMain.on('show-notification', (event, data) => {
      if (this.settings.notificationsEnabled) {
        this.showNotification(data.title, data.body);
      }
    });

    // Handle settings requests
    ipcMain.handle('get-settings', () => {
      return this.settings;
    });
  }

  private showNotification(title: string, body: string): void {
    if (!Notification.isSupported()) {
      return;
    }

    try {
      const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, QobuxApp.ICON_MAIN),
        silent: false
      });

      notification.show();
    } catch (error) {
      // Notification failed, but don't spam console
    }
  }

  private createWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: QobuxApp.DEFAULT_WINDOW_WIDTH,
      height: QobuxApp.DEFAULT_WINDOW_HEIGHT,
      minWidth: QobuxApp.MIN_WINDOW_WIDTH,
      minHeight: QobuxApp.MIN_WINDOW_HEIGHT,
      icon: path.join(__dirname, QobuxApp.ICON_MAIN),
      autoHideMenuBar: true, // Hide the menu bar (File, Edit, View, etc.)
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        plugins: true, // Enable plugins for Widevine DRM
        experimentalFeatures: true // Enable experimental web features for Hi-Res audio
      },
      show: false // Don't show until ready-to-show
    });

    // Load the Qobuz web app
    this.mainWindow.loadURL(QobuxApp.QOBUZ_URL);

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle minimize to tray
    this.mainWindow.on('minimize' as any, (event: Electron.Event) => {
      if (this.tray) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle close to tray
    this.mainWindow.on('close', (event: Electron.Event) => {
      if (this.tray && !app.isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });
  }

  private createTray(): void {
    // Create tray icon with theme-appropriate color
    const iconPath = this.getTrayIconPath();
    const trayIcon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(trayIcon);

    // Create context menu
    const contextMenu = Menu.buildFromTemplate(this.buildTrayMenuTemplate());

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip(QobuxApp.TRAY_TOOLTIP);

    // Handle tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private getTrayIconPath(): string {
    // Try to detect system theme preference
    // On Linux, check if we can determine the theme
    if (process.platform === 'linux') {
      try {
        // Check for dark theme indicators
        const isDarkTheme = this.isSystemDarkTheme();
        const iconFile = isDarkTheme ? QobuxApp.ICON_TRAY_WHITE : QobuxApp.ICON_TRAY_BLACK;
        return path.join(__dirname, iconFile);
      } catch (error) {
        this.log('Could not detect system theme, using white icon as default');
      }
    }

    // Default to white icon (works on most dark panels)
    return path.join(__dirname, QobuxApp.ICON_TRAY_WHITE);
  }

  private isSystemDarkTheme(): boolean {
    // On Linux, try to detect dark theme through various methods
    if (process.platform === 'linux') {
      try {
        // Method 1: Check GTK theme preference
        const { execSync } = require('child_process');

        // Try gsettings for GNOME/GTK
        try {
          const gtkTheme = execSync('gsettings get org.gnome.desktop.interface gtk-theme 2>/dev/null',
            { encoding: 'utf8', timeout: 1000 }).trim();
          if (gtkTheme.toLowerCase().includes('dark')) {
            return true;
          }
        } catch (e) {
          // gsettings not available or failed
        }

        // Method 2: Check for dark theme preference
        try {
          const colorScheme = execSync('gsettings get org.gnome.desktop.interface color-scheme 2>/dev/null',
            { encoding: 'utf8', timeout: 1000 }).trim();
          if (colorScheme.includes('dark')) {
            return true;
          }
        } catch (e) {
          // color-scheme setting not available
        }

        // Method 3: Check KDE theme (for KDE users)
        try {
          const kdeTheme = execSync('kreadconfig5 --group General --key ColorScheme 2>/dev/null',
            { encoding: 'utf8', timeout: 1000 }).trim();
          if (kdeTheme.toLowerCase().includes('dark')) {
            return true;
          }
        } catch (e) {
          // KDE not available or failed
        }
      } catch (error) {
        // All detection methods failed
      }
    }

    // Default assumption: most Linux desktop environments use dark panels
    // So white icons are usually the safer choice
    return true;
  }

  private buildTrayMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    return [
      {
        label: QobuxApp.MENU_SHOW,
        click: () => {
          this.showWindow();
        }
      },
      {
        label: QobuxApp.MENU_HIDE,
        click: () => {
          this.mainWindow?.hide();
        }
      },
      { type: 'separator' as const },
      {
        label: QobuxApp.MENU_PLAY_PAUSE,
        click: () => {
          this.sendMediaCommand(QobuxApp.CMD_PLAY_PAUSE);
        }
      },
      {
        label: QobuxApp.MENU_NEXT,
        click: () => {
          this.sendMediaCommand(QobuxApp.CMD_NEXT);
        }
      },
      {
        label: QobuxApp.MENU_PREVIOUS,
        click: () => {
          this.sendMediaCommand(QobuxApp.CMD_PREVIOUS);
        }
      },
      { type: 'separator' as const },
      {
        label: QobuxApp.MENU_NOTIFICATIONS,
        type: 'checkbox' as const,
        checked: this.settings.notificationsEnabled,
        click: () => {
          this.settings.notificationsEnabled = !this.settings.notificationsEnabled;
          this.saveSettings();
          this.updateTrayMenu(); // Refresh menu to show new state
        }
      },
      { type: 'separator' as const },
      {
        label: QobuxApp.MENU_QUIT,
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ];
  }

  private updateTrayMenu(): void {
    if (this.tray) {
      // Only update the context menu, don't recreate the entire tray
      const contextMenu = Menu.buildFromTemplate(this.buildTrayMenuTemplate());
      this.tray.setContextMenu(contextMenu);
    }
  }

  private showWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private toggleWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.showWindow();
      }
    }
  }

  private sendMediaCommand(command: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('media-command', command);
    }
  }
}

// Extend app with custom property
declare global {
  namespace Electron {
    interface App {
      isQuiting?: boolean;
    }
  }
}

// Create and start the application
new QobuxApp();
