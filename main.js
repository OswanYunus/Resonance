const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure hardware audio acceleration and timing flags
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-exclusive-audio');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-highres-timer');

let mainWindow = null;

// ---------- Single instance lock (VLC-like behavior) ----------
// If a second instance is launched (e.g. double-clicking another audio file),
// don't open a new window. Instead, send the file to the existing window.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Another instance is already running — it will receive our argv via
  // the 'second-instance' event. Just quit this duplicate.
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    // Find the file path from the new instance's arguments
    const filePath = argv.slice(app.isPackaged ? 1 : 2).find(a => {
      try { return fs.existsSync(a) && fs.statSync(a).isFile(); } catch { return false; }
    });
    if (mainWindow) {
      // Bring existing window to front
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // Send the new file to the renderer to play it
      if (filePath) {
        mainWindow.webContents.send('open-file', filePath);
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#090519',
    icon: path.join(__dirname, 'icon.png'),
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Prevents audio stutter & visual latency in background
      webSecurity: false // Allows seamless local file:// access
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // If a file was passed as a launch argument (e.g. Open With...)
    const args = process.argv.slice(app.isPackaged ? 1 : 2);
    const filePath = args.find(a => {
      try { return fs.existsSync(a) && fs.statSync(a).isFile(); } catch { return false; }
    });
    if (filePath) {
      mainWindow.webContents.send('open-file', filePath);
    }
  });

  // Handle Windows titlebar actions
  ipcMain.on('window-min', () => mainWindow?.minimize());
  ipcMain.on('window-max', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.on('window-always-on-top', (e, state) => {
    mainWindow?.setAlwaysOnTop(state);
  });

  // Native Open File Dialog
  ipcMain.handle('dialog-open-files', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Music Files',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac', 'opus', 'wma'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return res;
  });

  // Read local file into buffer
  ipcMain.handle('read-local-file', async (event, filePath) => {
    try {
      const buffer = await fs.promises.readFile(filePath);
      return { success: true, data: buffer, name: path.basename(filePath) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

// Media keys support (Play/Pause, Next, Previous)
app.whenReady().then(() => {
  createWindow();

  try {
    globalShortcut.register('MediaPlayPause', () => {
      mainWindow?.webContents.send('media-key', 'play-pause');
    });
    globalShortcut.register('MediaNextTrack', () => {
      mainWindow?.webContents.send('media-key', 'next');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
      mainWindow?.webContents.send('media-key', 'prev');
    });
  } catch (err) {
    console.warn('Media keys registration failed:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
