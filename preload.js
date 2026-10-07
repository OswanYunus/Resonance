const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-min'),
  maximize: () => ipcRenderer.send('window-max'),
  close: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (state) => ipcRenderer.send('window-always-on-top', state),
  openFileDialog: () => ipcRenderer.invoke('dialog-open-files'),
  readLocalFile: (path) => ipcRenderer.invoke('read-local-file', path),
  onMediaKey: (callback) => {
    ipcRenderer.on('media-key', (e, action) => callback(action));
  },
  onOpenFile: (callback) => {
    ipcRenderer.on('open-file', (e, path) => callback(path));
  }
});
