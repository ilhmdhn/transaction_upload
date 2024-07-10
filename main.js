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

    win.loadFile(path.join(__dirname, './src/page/page.html'));

    win.focus();
    win.center();

    const iconTray = path.join(__dirname, 'icon.png');
    const tray = new Tray(iconTray);

    ipcMain.on('UPLOAD-POS', async (event, data) => {
        try {
            console.log(data)
            if(!data.date){
                throw `Tanggal tidak valid ${data.date}`
            }

            showLoading()
            const date =  data.date;
            const normal =  data.normal;
            const tax =  data.tax;
            
            await uploadPos(date, normal, tax)   
            closeLoading()
        } catch (err) {
            console.log(err)
            closeLoading()
        }
    });

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const showLoading = () =>{
        console.log('show loading')
        win.webContents.send('SHOW-LOADING',true);
    }
    
    const closeLoading = () =>{
        console.log('close loading')
        win.webContents.send('CLOSE-LOADING',{yaa: 'yaa'});
    }
}

app.whenReady().then(() => {
    createWindow();
});