import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface AppSettings {
  notificationsEnabled: boolean;
}

class QobuxApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private settings: AppSettings = { notificationsEnabled: true };
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.loadSettings();
    this.setupApp();
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (error) {
      // Use defaults on error
    }
  }

  private saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Qobux: Could not save settings:', error);
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
        console.log('Blocked new window creation to:', url);
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
        icon: path.join(__dirname, '../assets/icon.png'),
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
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, '../assets/icon.png'),
      autoHideMenuBar: true, // Hide the menu bar (File, Edit, View, etc.)
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      show: false // Don't show until ready-to-show
    });

    // Load the Qobuz web app
    this.mainWindow.loadURL('https://play.qobuz.com');

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
    // Create tray icon
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(trayIcon);
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate(this.buildTrayMenuTemplate());

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Qobux - Qobuz Desktop Client');

    // Handle tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private buildTrayMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    return [
      {
        label: 'Show Qobux',
        click: () => {
          this.showWindow();
        }
      },
      {
        label: 'Hide Qobux',
        click: () => {
          this.mainWindow?.hide();
        }
      },
      { type: 'separator' as const },
      {
        label: 'Play/Pause',
        click: () => {
          this.sendMediaCommand('playpause');
        }
      },
      {
        label: 'Next Track',
        click: () => {
          this.sendMediaCommand('next');
        }
      },
      {
        label: 'Previous Track',
        click: () => {
          this.sendMediaCommand('previous');
        }
      },
      { type: 'separator' as const },
      {
        label: 'Notifications',
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
        label: 'Quit',
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
