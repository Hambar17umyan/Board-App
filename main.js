const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let isSafeToClose = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        titleBarStyle: 'hidden',
        titleBarOverlay: { color: '#1e1e1e', symbolColor: '#ffffff', height: 30 },
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    mainWindow.loadFile('index.html');
    mainWindow.maximize();

    mainWindow.on('close', (e) => {
        if (!isSafeToClose) {
            e.preventDefault();
            mainWindow.webContents.send('check-unsaved');
        }
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.on('close-response', (event, hasUnsaved) => {
    if (hasUnsaved) {
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'warning',
            buttons: ['Save & Quit', 'Quit Without Saving', 'Cancel'],
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Do you want to save before closing?'
        });
        if (choice === 0) {
            mainWindow.webContents.send('trigger-save-quit');
        } else if (choice === 1) {
            isSafeToClose = true;
            mainWindow.close();
        }
    } else {
        isSafeToClose = true;
        mainWindow.close();
    }
});

ipcMain.on('quit-app', () => {
    isSafeToClose = true;
    mainWindow.close();
});

ipcMain.handle('show-save-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'SmartBoard Project', extensions: ['json'] }]
    });
    return result.filePath;
});

ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'SmartBoard Project', extensions: ['json'] }]
    });
    return result.filePaths[0];
});