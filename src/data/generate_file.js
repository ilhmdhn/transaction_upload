  const fs = require('fs');
  const path = require('path');
  const xmlbuilder = require('xmlbuilder');
  const moment = require('moment');

  const { getInventory, getRoomType, getUser, getMember, getReservation, getRcp, getOkl, getOkd, getOkdPromo, getOcd, getOcl, getOcdPromo, getSul, getSud, getDetailPromo, getCashSummaryDetail, getRoom, getIvc, getTotalPay, getTotalInvoice, cekSummaryCashBalance } = require("./data");
  const uploadAllFiles = require('../network/upload');
  const config = require('./config');
  const { getOutlet } = require('./preferences');
  const { getTotalPayTax, getTotalInvoiceTax, cekSummaryCashBalanceTax, getInventoryTax, getRoomTypeTax, getUserTax, getMemberTax, getReservationTax, getRcpTax, getOklTax, getOkdTax, getOkdPromoTax, getOclTax, getOcdTax, getOcdPromoTax, getSulTax, getSudTax, getDetailPromoTax, getCashSummaryDetailTax, getRoomTax, getIvcTax, searchTax} = require('./data_tax')

  const uploadPos = (date, normal, tax) =>{
    return new Promise(async(resolve, reject)=>{
        try {
          let stateNormal = true;
          let stateTax = true;
          let messageUpload = '';

          if(normal == true){
            const response = await uploadPosNormal(date);
            if(response.state){
              stateNormal = true;
              messageUpload = response.message
            }else{
              stateNormal = false;
              messageUpload = response.message
            }
          }

          if(tax == true){
            
            const response = await uploadPosTax(date)

            if(response.state){
              stateTax = true;
              if(messageUpload){
                messageUpload = messageUpload+`\n ${response.message}`
              }else{
                messageUpload = response.message
              }
            }else{
              stateTax = false;
              if(messageUpload){
                messageUpload = messageUpload+`\n ${response.message}`
              }else{
                messageUpload = response.message
              }
            }
          } 
          let finalState = true;

          if(stateNormal && stateTax){
            finalState = true;
          }else{
            finalState = false;
          }

          resolve({
            state: finalState,
            message: messageUpload
          })
        } catch (err) {
          console.log(err)
          reject(err);
        }
    });
  }

  const uploadPosNormal = (date) =>{
  return new Promise(async(resolve, reject)=>{
    try {
      const getDate = convertDateFormat(date);

    deleteFilesInDirectory('C:/upload_transaction/pos/normal');
    const summaryTotal = await getTotalPay(date);
    const invoiceTotal = await getTotalInvoice(date);

    const selisih = summaryTotal - invoiceTotal.Total_all;

    if(selisih > 1000 || selisih < (-1000)){
      reject('selisih')
    }

    await cekSummaryCashBalance(date);

    const inventoryData = await getInventory(date);
    if(inventoryData.length >0){
        const inventoryXml = generateDynamicXML(inventoryData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `AIHP_Inventory_${getDate}.xml`, inventoryXml);
    }
    
    const roomTypeData = await getRoomType(date);
    if(roomTypeData.length >0){
        const roomTypeXml = generateDynamicXML(roomTypeData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `BIHP_Jenis_Kamar_${getDate}.xml`, roomTypeXml);
    }
    
    
    const userData = await getUser();
    if(userData.length >0){
        const userXml = generateDynamicXML(userData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `CIHP_User_${getDate}.xml`, userXml);
    }
    
    const memberData = await getMember(date);
    if(memberData.length >0){
        const memberXml = generateDynamicXML(memberData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `DIHP_Mbr_${getDate}.xml`, memberXml);
    }

    const reservationData = await getReservation(date);
    if(reservationData.length >0){
        const reservationXml = generateDynamicXML(reservationData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `EIHP_Rsv_${getDate}.xml`, reservationXml);
    }

    const rcpData = await getRcp(date);
    if(rcpData.length >0){
        const rcpXml = generateDynamicXML(rcpData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `FIHP_Rcp_${getDate}.xml`, rcpXml);
    }

    const oklData = await getOkl(date);
    if(oklData.length >0){
        const oklXml = generateDynamicXML(oklData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `GIHP_Okl_${getDate}.xml`, oklXml);
    }

    const okdData = await getOkd(date);
    if(okdData.length >0){
        const okdXml = generateDynamicXML(okdData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `HIHP_Okd_${getDate}.xml`, okdXml);
    }
    
    const okdPromoData = await getOkdPromo(date);
    if(okdPromoData.length >0){
        const okdPromoXml = generateDynamicXML(okdPromoData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `IIHP_Okd_Promo_${getDate}.xml`, okdPromoXml);
    }

    const oclData = await getOcl(date);
    if(oclData.length >0){
        const oclXml = generateDynamicXML(oclData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `JIHP_Ocl_${getDate}.xml`, oclXml);
    }

    const ocdData = await getOcd(date);
    if(ocdData.length >0){
        const ocdXml = generateDynamicXML(ocdData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `KIHP_Ocd_${getDate}.xml`, ocdXml);
    }

    const ocdPromoData = await getOcdPromo(date);
    if(ocdPromoData.length >0){
        const ocdPromoXml = generateDynamicXML(ocdPromoData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `LIHP_Ocd_Promo_${getDate}.xml`, ocdPromoXml);
    }

    const sulData = await getSul(date);
    if(sulData.length >0){
        const sulXml = generateDynamicXML(sulData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `MIHP_Sul_${getDate}.xml`, sulXml);
    }

    const sudData = await getSud(date);
    if(sudData.length >0){
        const sudXml = generateDynamicXML(sudData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `NIHP_Sud_${getDate}.xml`, sudXml);
    }

    const detailPromoData = await getDetailPromo(date);
    if(detailPromoData.length >0){
        const detailPromoXml = generateDynamicXML(detailPromoData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `OIHP_Detail_Promo_${getDate}.xml`, detailPromoXml);
    }

    const cashSummaryData = await getCashSummaryDetail(date);
    if(cashSummaryData.length >0){
        const cashSummaryXml = generateDynamicXML(cashSummaryData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `PIHP_Cash_Summary_Detail_${getDate}.xml`, cashSummaryXml);
    }

    const roomData = await getRoom(date);
    if(roomData.length >0){
        const roomXml = generateDynamicXML(roomData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `QIHP_Room_${getDate}.xml`, roomXml);
    }

    const ivcData = await getIvc(date);
    if(ivcData.length >0){
        const ivcyXml = generateDynamicXML(ivcData);
        saveXMLToFile('C:/upload_transaction/pos/normal', `RIHP_Ivc_${getDate}.xml`, ivcyXml);
    }
    const outlet = getOutlet()
    const uploadResult =  await uploadAllFiles('C:/upload_transaction/pos/normal/', config.urlPos, outlet, 1)

    resolve(uploadResult);
    } catch (err) {
      reject(err)
    }
  });
  }

  const uploadPosTax = (date) =>{
    return new Promise(async(resolve, reject)=>{
      try {
        const getDate = convertDateFormat(date);
  
      deleteFilesInDirectory('C:/upload_transaction/pos/tax');
      const summaryTotal = await getTotalPayTax(date);
      const invoiceTotal = await getTotalInvoiceTax(date);
  
      const selisih = summaryTotal - invoiceTotal.Total_all;
  
      if(selisih > 1000 || selisih < (-1000)){
        reject('selisih')
      }
  
      await cekSummaryCashBalanceTax(date);
  
      const inventoryData = await getInventoryTax(date);
      if(inventoryData.length >0){
          const inventoryXml = generateDynamicXML(inventoryData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `AIHP_Inventory_${getDate}.xml`, inventoryXml);
      }
      
      const roomTypeData = await getRoomTypeTax(date);
      if(roomTypeData.length >0){
          const roomTypeXml = generateDynamicXML(roomTypeData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `BIHP_Jenis_Kamar_${getDate}.xml`, roomTypeXml);
      }
      
      
      const userData = await getUserTax();
      if(userData.length >0){
          const userXml = generateDynamicXML(userData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `CIHP_User_${getDate}.xml`, userXml);
      }
      
      const memberData = await getMemberTax(date);
      if(memberData.length >0){
          const memberXml = generateDynamicXML(memberData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `DIHP_Mbr_${getDate}.xml`, memberXml);
      }
  
      const reservationData = await getReservationTax(date);
      if(reservationData.length >0){
          const reservationXml = generateDynamicXML(reservationData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `EIHP_Rsv_${getDate}.xml`, reservationXml);
      }
  
      const rcpData = await getRcpTax(date);
      if(rcpData.length >0){
          const rcpXml = generateDynamicXML(rcpData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `FIHP_Rcp_${getDate}.xml`, rcpXml);
      }
  
      const oklData = await getOklTax(date);
      if(oklData.length >0){
          const oklXml = generateDynamicXML(oklData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `GIHP_Okl_${getDate}.xml`, oklXml);
      }
  
      const okdData = await getOkdTax(date);
      if(okdData.length >0){
          const okdXml = generateDynamicXML(okdData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `HIHP_Okd_${getDate}.xml`, okdXml);
      }
      
      const okdPromoData = await getOkdPromoTax(date);
      if(okdPromoData.length >0){
          const okdPromoXml = generateDynamicXML(okdPromoData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `IIHP_Okd_Promo_${getDate}.xml`, okdPromoXml);
      }
  
      const oclData = await getOclTax(date);
      if(oclData.length >0){
          const oclXml = generateDynamicXML(oclData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `JIHP_Ocl_${getDate}.xml`, oclXml);
      }
  
      const ocdData = await getOcdTax(date);
      if(ocdData.length >0){
          const ocdXml = generateDynamicXML(ocdData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `KIHP_Ocd_${getDate}.xml`, ocdXml);
      }
  
      const ocdPromoData = await getOcdPromoTax(date);
      if(ocdPromoData.length >0){
          const ocdPromoXml = generateDynamicXML(ocdPromoData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `LIHP_Ocd_Promo_${getDate}.xml`, ocdPromoXml);
      }
  
      const sulData = await getSulTax(date);
      if(sulData.length >0){
          const sulXml = generateDynamicXML(sulData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `MIHP_Sul_${getDate}.xml`, sulXml);
      }
  
      const sudData = await getSudTax(date);
      if(sudData.length >0){
          const sudXml = generateDynamicXML(sudData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `NIHP_Sud_${getDate}.xml`, sudXml);
      }
  
      const detailPromoData = await getDetailPromoTax(date);
      if(detailPromoData.length >0){
          const detailPromoXml = generateDynamicXML(detailPromoData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `OIHP_Detail_Promo_${getDate}.xml`, detailPromoXml);
      }
  /*
      const cashSummaryData = await getCashSummaryDetailTax(date);
      if(cashSummaryData.length >0){
          const cashSummaryXml = generateDynamicXML(cashSummaryData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `PIHP_Cash_Summary_Detail_${getDate}.xml`, cashSummaryXml);
      }
*/
      const roomData = await getRoomTax(date);
      if(roomData.length >0){
          const roomXml = generateDynamicXML(roomData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `PIHP_Room_${getDate}.xml`, roomXml);
      }

      const ivcData = await getIvcTax(date);
      if(ivcData.length >0){
          const ivcyXml = generateDynamicXML(ivcData);
          saveXMLToFile('C:/upload_transaction/pos/tax', `QIHP_Ivc_${getDate}.xml`, ivcyXml);
      }
  

      const outlet = getOutlet()
      const uploadResult =  await uploadAllFiles('C:/upload_transaction/pos/tax/', config.urlPos, outlet, 2)
  
      resolve(uploadResult);
      } catch (err) {
        reject(err)
      }
    });
  }
  
  const generateDynamicXML = (data) => {
    const root = xmlbuilder.create('Dial_Stats')
      .ele('UK_Products_Pipeline');
    data.forEach(item => {
      if(item){
        const ihp = root.ele('ihp');
        Object.keys(item).forEach(key => {
          if(!item[key] && (item[key] != 0)){
            ihp.ele(key, '');
          }else{
            ihp.ele(key, item[key]);
          }
        }); 
      }
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