const fs = require('fs');
const path = require('path');
const xmlbuilder = require('xmlbuilder');
const moment = require('moment');

const { getInventory, getRoomType, getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcd, getOcl, getOcdPromo, getSul, getSud, getDetailPromo, getCashSummaryDetail, getIvc, getTotalPay, getTotalInvoice } = require("./data");

const uploadPos = (date) =>{
    return new Promise(async(resolve, reject)=>{
        try {
            const getDate = convertDateFormat(date);
            deleteFilesInDirectory('C:/upload_transaction/pos');
            
            const summaryTotal = await getTotalPay(date);
            const invoiceTotal = await getTotalInvoice(date);

            const selisih = summaryTotal - invoiceTotal.Total_all;

            if(selisih > 1000 || selisih < (-1000)){
              console.log('anu')
              reject('selisih')
            }

            const inventoryData = await getInventory(date);
            if(inventoryData.length >0){
                const inventoryXml = generateDynamicXML(inventoryData);
                saveXMLToFile('C:/upload_transaction/pos', `AIHP_Inventory_${getDate}.xml`, inventoryXml);
            }
            
            const roomTypeData = await getRoomType(date);
            if(roomTypeData.length >0){
                const roomTypeXml = generateDynamicXML(roomTypeData);
                saveXMLToFile('C:/upload_transaction/pos', `BIHP_Jenis_Kamar_${getDate}.xml`, roomTypeXml);
            }
            
            
            const userData = await getUser();
            if(userData.length >0){
                const userXml = generateDynamicXML(userData);
                saveXMLToFile('C:/upload_transaction/pos', `CIHP_User_${getDate}.xml`, userXml);
            }
            
            const memberData = await getMember(date);
            if(memberData.length >0){
                const memberXml = generateDynamicXML(memberData);
                saveXMLToFile('C:/upload_transaction/pos', `DIHP_Mbr_${getDate}.xml`, memberXml);
            }

            const reservationData = await getReservation(date);
            if(reservationData.length >0){
                const reservationXml = generateDynamicXML(reservationData);
                saveXMLToFile('C:/upload_transaction/pos', `EIHP_Rsv_${getDate}.xml`, reservationXml);
            }

            const rcpData = await getRcp(date);
            if(rcpData.length >0){
                const rcpXml = generateDynamicXML(rcpData);
                saveXMLToFile('C:/upload_transaction/pos', `FIHP_Rcp_${getDate}.xml`, rcpXml);
            }

            const oklData = await getOkl(date);
            if(oklData.length >0){
                const oklXml = generateDynamicXML(oklData);
                saveXMLToFile('C:/upload_transaction/pos', `GIHP_Okl_${getDate}.xml`, oklXml);
            }

            const okdData = await getOkd(date);
            if(okdData.length >0){
                const okdXml = generateDynamicXML(okdData);
                saveXMLToFile('C:/upload_transaction/pos', `HIHP_Okd_${getDate}.xml`, okdXml);
            }
            
            const okdPromoData = await getOkdPromo(date);
            if(okdPromoData.length >0){
                const okdPromoXml = generateDynamicXML(okdPromoData);
                saveXMLToFile('C:/upload_transaction/pos', `IIHP_Okd_Promo_${getDate}.xml`, okdPromoXml);
            }

            const oclData = await getOcl(date);
            if(oclData.length >0){
                const oclXml = generateDynamicXML(oclData);
                saveXMLToFile('C:/upload_transaction/pos', `JIHP_Ocl_${getDate}.xml`, oclXml);
            }

            const ocdData = await getOcd(date);
            if(ocdData.length >0){
                const ocdXml = generateDynamicXML(ocdData);
                saveXMLToFile('C:/upload_transaction/pos', `KIHP_Ocd_${getDate}.xml`, ocdXml);
            }

            const ocdPromoData = await getOcdPromo(date);
            if(ocdPromoData.length >0){
                const ocdPromoXml = generateDynamicXML(ocdPromoData);
                saveXMLToFile('C:/upload_transaction/pos', `LIHP_Ocd_Promo_${getDate}.xml`, ocdPromoXml);
            }

            const sulData = await getSul(date);
            if(sulData.length >0){
                const sulXml = generateDynamicXML(sulData);
                saveXMLToFile('C:/upload_transaction/pos', `MIHP_Sul_${getDate}.xml`, sulXml);
            }

            const sudData = await getSud(date);
            if(sudData.length >0){
                const sudXml = generateDynamicXML(sudData);
                saveXMLToFile('C:/upload_transaction/pos', `NIHP_Sud_${getDate}.xml`, sudXml);
            }

            const detailPromoData = await getDetailPromo(date);
            if(detailPromoData.length >0){
                const detailPromoXml = generateDynamicXML(detailPromoData);
                saveXMLToFile('C:/upload_transaction/pos', `OIHP_Detail_Promo_${getDate}.xml`, detailPromoXml);
            }

            const cashSummaryData = await getCashSummaryDetail(date);
            if(cashSummaryData.length >0){
                const cashSummaryXml = generateDynamicXML(cashSummaryData);
                saveXMLToFile('C:/upload_transaction/pos', `PIHP_Cash_Summary_Detail_${getDate}.xml`, cashSummaryXml);
            }

            const ivcData = await getIvc(date);
            if(ivcData.length >0){
                const ivcyXml = generateDynamicXML(ivcData);
                saveXMLToFile('C:/upload_transaction/pos', `RIHP_Ivc_${getDate}.xml`, ivcyXml);
            }

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
        if(!item[key] && (item[key] != 0)){
          ihp.ele(key, '');
        }else{
          ihp.ele(key, item[key]);
        }
      });
    });
  
    return root.end({ pretty: true, allowEmpty: true });
  }

  const saveXMLToFile = (directory, filename, xmlContent)=> {
    // Membuat direktori jika belum ada
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  
    // Menyimpan file XML
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, xmlContent, 'utf8');
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
          }
        });
      }
    });
  }

  module.exports = {
    uploadPos
}