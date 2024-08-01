const Store = require('electron-store');


const store = new Store();

const setOutlet = (code) =>{
    store.set('outlet', code);
}

const getOutlet = () =>{
    const newStore = new Store();
    return newStore.get('outlet')
}

const setDbNormal = (ip, user, pass, db) =>{
    store.set('ip', ip);
    store.set('user', user);
    store.set('pass', pass);
    store.set('db', db);
}

const getDbNormal = () =>{
    const newStore = new Store();
    const ip = newStore.get('ip');
    const user = newStore.get('user');
    const pass = newStore.get('pass');
    const db= newStore.get('db');
    return {
        ip: ip,
        user: user,
        pass: pass,
        db: db,
    }
}

const setDbTax = (ip, user, pass, db) =>{
    store.set('ip_tax', ip);
    store.set('user_tax', user);
    store.set('pass_tax', pass);
    store.set('db_tax', db);
    
}

const getDbTax = () =>{
    const newStore = new Store();
    const ip = newStore.get('ip_tax');
    const user = newStore.get('user_tax');
    const pass = newStore.get('pass_tax');
    const db= newStore.get('db_tax');
    
    return {
        ip: ip,
        user: user,
        pass: pass,
        db: db,
    }

}

module.exports = {
    setDbNormal,
    getDbNormal,
    setDbTax,
    getDbTax,
    setOutlet,
    getOutlet
}