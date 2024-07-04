const fs = require('fs');
const path = require('path');
const xmlbuilder = require('xmlbuilder');
const moment = require('moment');

const { getInventory, getRoomType, getUser, getMember, getReservation, getRcp } = require("./data");

const uploadPos = (date) =>{
    return new Promise(async(resolve, reject)=>{
        try {
            const getDate = convertDateFormat(date);
            deleteFilesInDirectory('C:/upload_transaction/pos');


            const inventoryData = await getInventory(date);
            const roomTypeData = await getRoomType();
            const userData = await getUser();
            const memberData = await getMember(date);
            const reservationData = await getReservation(date);
            const rcpData = await getRcp(date);

            
            const rcpXml = generateDynamicXML(rcpData);
            const userXml = generateDynamicXML(userData);

            
            saveXMLToFile('C:/upload_transaction/pos', `FIHP_Rcp_${getDate}.xml`, rcpXml);
            saveXMLToFile('C:/upload_transaction/pos', 'user.xml', userXml);

            resolve(rcpData);
        } catch (err) {
            reject(err);
        }
    });
}

const generateDynamicXML = (data) => {
    const root = xmlbuilder.create('Dial_Stats')
      .ele('UK_Products_Pipeline');
  
    data.forEach(item => {
      const ihp = root.ele('ihp');
      Object.keys(item).forEach(key => {
        ihp.ele(key, item[key]);
      });
    });
  
    return root.end({ pretty: true });
  }

  const saveXMLToFile = (directory, filename, xmlContent)=> {
    // Membuat direktori jika belum ada
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  
    // Menyimpan file XML
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, xmlContent, 'utf8');
    console.log(`File XML berhasil dihasilkan dan disimpan sebagai ${filePath}`);
  }

  const convertDateFormat = (dateString) =>{
    // Mendapatkan waktu saat ini
    const currentTime = moment().format('HH:mm:ss');
    
    // Menggabungkan tanggal input dengan waktu saat ini
    const dateTimeString = `${dateString} ${currentTime}`;
    
    // Memformat menjadi DD/MM/YYYY HH:mm:ss
    return moment(dateTimeString, 'YYYY-MM-DD HH:mm:ss').format('DDMMYYYY_HHmmss');
  }
  

  const deleteFilesInDirectory = (directory) =>{
    // Membaca isi direktori
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
      }
  
      // Menghapus setiap file dalam direktori
      for (const file of files) {
        const filePath = path.join(directory, file);
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Error deleting file ${filePath}: ${err}`);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      }
    });
  }

  module.exports = {
    uploadPos
}