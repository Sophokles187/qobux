import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

class QobuxApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      
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

  private createWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, '../assets/icon.png'),
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
    const contextMenu = Menu.buildFromTemplate([
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
      { type: 'separator' },
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
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Qobux - Qobuz Desktop Client');

    // Handle tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
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
    console.log('Qobux Main: Sending media command:', command);
    if (this.mainWindow) {
      console.log('Qobux Main: Window exists, sending IPC message');
      this.mainWindow.webContents.send('media-command', command);
    } else {
      console.log('Qobux Main: No window available');
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
