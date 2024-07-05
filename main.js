const { ipcMain, Tray, Menu, app, BrowserWindow } = require('electron');
const path = require('path');
const { uploadPos } = require('./src/data/generate_file');

const createWindow = () =>{
    const additionalData = { myKey: 'transaction_upload' }
    const gotTheLock = app.requestSingleInstanceLock(additionalData);

    if (!gotTheLock) {
        app.isQuiting = true;
        app.quit();
        app.exit();
        return
    }

    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: true,
        icon: path.join(__dirname, '/icon.png'),
        title: "Member Client",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            zoomFactor: 1,
            scrollBounce: false,
        },
        enableRemoteModule: true
    });

    win.loadFile(path.join(__dirname, '/page.html'));

    win.focus();
    win.center();

    const iconTray = path.join(__dirname, 'icon.png');
    const tray = new Tray(iconTray);

    ipcMain.on('UPLOAD-POS', async (event, data) => {
        if(!data.date){
            console.log('Tanggal tidak valid '+data.date)
            return;
        }
        uploadPos(data.date);
    });
}

app.whenReady().then(() => {
    createWindow();
});