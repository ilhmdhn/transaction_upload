const { ipcMain, Tray, Menu, app, BrowserWindow } = require('electron');
const path = require('path');
const { uploadPos } = require('./src/data/generate_file');
const {setDbNormal, getDbNormal, setDbTax, getDbTax, setOutlet, getOutlet} = require('./src/data/preferences');
const db = require('./src/tools/db');
const { default: axios } = require('axios');
const config = require('./src/data/config');

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

    

    
    
    win.webContents.on('did-finish-load', async () => {
        showNormalConfig()
        showTaxConfig()
        showOutlet();
        mcInfo()
    });

    ipcMain.on('UPLOAD-POS', async (event, data) => {
        try {
            if(!data.date){
                throw `Tanggal tidak valid ${data.date}`
            }

            showLoading()
            const response = await uploadPos(data.date, data.normal, data.tax)   

            closeLoading()
            if(response.state){
                showSuccessAlert('Berhasil', response.message)
            }else{
                showErrorAlert('Gagal', response.message)
            }
        } catch (err) {
            showErrorAlert(err, err.message)
            closeLoading()
        }
    });

    ipcMain.on('SAVE-NORMAL', async (event, data) => {
        setDbNormal(data.ip, data.user, data.pass, data.db)
        showNormalConfig()
    });

    ipcMain.on('SAVE-TAX', async (event, data) => {
        setDbTax(data.ip, data.user, data.pass, data.db)
        showTaxConfig()
    });

    ipcMain.on('SAVE-OUTLET', async (event, data) => {
        setOutlet(data)
        showOutlet()
    });

    const showNormalConfig = () =>{
        const dbInfo = getDbNormal();
        win.webContents.send('SHOW-DB-NORMAL', dbInfo);
    }

    const showTaxConfig = () =>{
        const dbInfo = getDbTax();
        win.webContents.send('SHOW-DB-TAX', dbInfo);
    }

    const showOutlet = () =>{
        const outletInfo = getOutlet();
        win.webContents.send('SHOW-OUTLET', outletInfo);
    }

    const showLoading = () =>{
        win.webContents.send('SHOW-LOADING');
    }
    
    const closeLoading = () =>{
        win.webContents.send('CLOSE-LOADING');
    }

    const showSuccessAlert = (title, message) =>{
        win.webContents.send('SUCCESS', {
            title: title,
            message: message
        });
    }

    const showErrorAlert = (title, message) =>{
        win.webContents.send('FAILED', {
            title: title,
            message: message
        });
    }

    const mcInfo = async() =>{
        try {
            const outlet = getOutlet()
            const response = await axios.get(config.mcInfo+outlet);
            if(response.data.state){
                win.webContents.send('SHOW-MC',{
                    mcVersion: response.data.versi,
                    mcNew: response.data.latest_version,
                    mcSync: response.data.last_sync,
                });
            }   
        } catch (err) {
            console.log(err)
        }
    }
}

app.whenReady().then(() => {
    createWindow();
});