import Store from 'electron-store';

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
    store.set('ip', ip);
    store.set('user', user);
    store.set('pass', pass);
    store.set('db', db);
}