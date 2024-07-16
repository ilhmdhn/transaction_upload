const execute = require('../tools/query-executor');
const encrypt = require('../tools/encrypt');
const decrypt = require('../tools/decrypt');
const moment = require('moment');

const getTotalPay = (date) =>{
    return new Promise(async(resolve, reject)=>{
        try {
            const query = `
            SET DATEFORMAT DMY
            SELECT 
                ROUND(ISNULL(SUM(pay_value), 0), 0) AS Pay_Value
            FROM 
                IHP_SUL SUL,
                IHP_SUD SUD
            WHERE 
                SUL.Summary = SUD.Summary AND
                CONVERT(CHAR(10), SUL.DATE_TRANS, 120) = '${date}'
            `;

            const result = await execute(query);
            resolve(result[0].Pay_Value);
        } catch (err) {
            reject(err)
            reject(err);
        }
    });
}


const getTotalInvoice = (date) =>{
    return new Promise(async(resolve, reject)=>{
        try {
            let query = `
            SET DATEFORMAT DMY;
            SELECT 
                ROUND(ISNULL(SUM(Total_kamar), 0), 0) AS Total_kamar,
                ROUND(ISNULL(SUM(total_penjualan), 0), 0) AS total_penjualan,
                ROUND(ISNULL(SUM(Total_all), 0), 0) AS Total_all
            FROM 
                ihp_ivc
            WHERE 
                CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
          `;
          

            const result = await execute(query);
            resolve(result[0]);
        } catch (err) {
            reject(err)
            reject(err);
        }
    });
}

const cekSummaryCashBalance = (date) =>{
    return new Promise(async(resolve, reject)=>{
        try {
            let jumlahCash = 0;

            let cekCashPayment = `
                set dateformat DMY;
                SELECT 
                    ISNULL(SUM(pay_value), 0) as Pay_Value 
                FROM 
                    IHP_SUL SUL, 
                    IHP_SUD SUD 
                WHERE 
                    SUL.Summary = SUD.Summary 
                AND 
                    id_payment = '0' 
                AND 
                    CONVERT(CHAR(10), SUL.Date_Trans, 120) = '${date}'
            `;
            
            const paymentCashTemp = await execute(cekCashPayment);
            
            const cashPaymentTotal = paymentCashTemp[0].Pay_Value;

            let dpCashQuery = `
                SET dateformat dmy;
                SELECT 
                    ISNULL(SUM(Uang_Muka), 0) AS Uang_Muka 
                FROM 
                    IHP_Rsv 
                WHERE 
                    CONVERT(CHAR(10), date_trans, 120) = '${date}'
                AND 
                    status = 1 
                AND 
                    ID_Payment = 0 
                AND 
                    Reservation NOT IN (SELECT Reservation FROM IHP_Rcp)
            `;

            const dpCashTemp = await execute(dpCashQuery);

            const cashDpTotal = dpCashTemp[0].Uang_Muka;

            const dpCashCancelQuery = `
                SET dateformat dmy;
                SELECT 
                    ISNULL(SUM(Uang_Muka), 0) AS Cash_Rsv
                FROM 
                    IHP_Rsv
                WHERE
                    CONVERT(CHAR(10), date_trans, 120) = '${date}'
                AND 
                    status = 3 
                AND 
                    ID_Payment = 0
            `;

            const dpCashCancelTemp = await execute(dpCashCancelQuery);
            
            const cashDpCancel = dpCashCancelTemp[0].Cash_Rsv;
            
            const formattedDate = moment(date).format('DD/MM/YYYY');
            let query = `
                SELECT 
                    * 
                FROM 
                    IHP_Cash_Summary_Detail 
                WHERE 
                    DATE = '${formattedDate} 00:00:00' 
                AND 
                    Status = '0'
            `;
            
            const summaryCheck = await execute(query);
            
            if(summaryCheck.length < 1){
                resolve(0);
                return;
            }
            
            summaryCheck.forEach((element)=>{
                jumlahCash +=   (element.Seratus_Ribu    *  100000)
                            +   (element.Lima_Puluh_Ribu *   50000)
                            +   (element.Dua_Puluh_Ribu  *   20000)
                            +   (element.Sepuluh_Ribu    *   10000)
                            +   (element.Lima_Ribu       *    5000)
                            +   (element.Dua_Ribu        *    2000)
                            +   (element.Seribu          *    1000)
                            +   (element.Lima_Ratus      *     500)
                            +   (element.Dua_Ratus       *     200)
                            +   (element.Seratus         *     100)
                            +   (element.Lima_Puluh      *      50)
                            +   (element.Dua_Puluh_Lima  *      25);
            });

            const totalCash = cashPaymentTotal + cashDpTotal + cashDpCancel;
            
            if(totalCash == 0){
                resolve(true);
            }else if(totalCash > jumlahCash){
                reject('Detail pecahan di FO kurang ');
            }else if(totalCash == jumlahCash){
                resolve(true);
            }else if(totalCash < jumlahCash){
                if((jumlahCash - totalCash) > 2000){
                    reject('Detail pecahan di FO kurang');
                }
                else if((jumlahCash - totalCash) <= 2000){
                    resolve(true);
                }
            }
            reject('Jummlah cash di FO tidak seimbang');

        } catch (err) {
            reject(err);
        }
    });
}

const getInventory = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const queryCheck = `
                SET DateFormat DMY
                SELECT 
                  COUNT(*) AS count 
                FROM 
                  IHP_Inventory 
                WHERE 
                    Status = 1 
                AND
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) >  '${moment(date).format('YYYY-MM-DD') + ' 06:00:00'}' 
                AND
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) <  '${moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 06:00:00'}'
            `;

            const queryData = `
                SET DateFormat DMY
                    SELECT 
                        InventoryID_Global AS Inventory, 
                        Inventory AS Inventory0,
                        Nama,
                        CAST(ROUND(Price, 0) AS int) AS Price 
                    FROM 
                        IHP_Inventory 
                    WHERE 
                        Status = 1 
                        AND Inventory IN (
                            SELECT DISTINCT Inventory 
                            FROM IHP_Okd 
                        WHERE 
                            OrderPenjualan IN (
                                SELECT 
                                    OrderPenjualan 
                                FROM 
                                    IHP_Okl 
                                WHERE 
                                    Reception IN (
                                        SELECT 
                                            Reception 
                                        FROM 
                                            IHP_Rcp 
                                        WHERE 
                                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                                        AND 
                                            Complete = '1'
                                    )
                                )
                            )
                    ORDER BY 
                        Inventory ASC
            `;

            const listInventory = [];
            const dataCount = await execute(queryCheck);

            if(dataCount[0].count < 1){
                resolve([]);
                return;
            }
            
            const dataInventory = await execute(queryData);

            dataInventory.forEach((element)=>{
                if((element.Inventory).trim() == '' || (!element.Inventory)){
                    console.log('WOEEEE')
                    reject(`Item ${element.Nama} Tidak ada ID Global`)
                }
                listInventory.push({
                    Inventory: element.Inventory,
                    Nama: element.Nama,
                    Price: element.Price
                });
            });

            resolve(listInventory);
        } catch (err) {
            reject(err);
        }
    })
}

const getRoomType = (date) =>{
    return new Promise(async (resolve, reject) => {
        try {

            let query = `
                SET DateFormat DMY;
                SELECT 
                    COUNT(*) as count
                FROM 
                    IHP_Jenis_Kamar
                WHERE 
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) >  '${moment(date).format('YYYY-MM-DD') + ' 06:00:00'}' 
                AND
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) <  '${moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 06:00:00'}'
            `;

            let queryData = `
                SET DateFormat DMY;
                SELECT
                    Nama_Kamar,
                    Hari,
                    Time_Start,
                    Time_Finish,
                    CAST(Overpax AS INT) AS Overpax,
                    CAST(ROUND(Tarif, 0) AS INT) AS Tarif,
                    CONVERT(VARCHAR(19), CHTime, 103) AS CHTimeTgl,
                    CONVERT(VARCHAR(8), CHTime, 108) AS CHTimeJam,
                    Chusr
                FROM
                    IHP_Jenis_Kamar
                WHERE
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) >  '${moment(date).format('YYYY-MM-DD') + ' 06:00:00'}' 
                AND
                    CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) <  '${moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 06:00:00'}'
                `;

        const dataCount = await execute(query);

        if(dataCount[0].count < 1){
                resolve([]);
                return;
        }
            const dataRoomType = await execute(queryData);

            const result = [];

            dataRoomType.forEach((element)=>{
                result.push({
                    Nama_Kamar: element.Nama_Kamar,
                    Hari: element.Hari,
                    Time_Start: element.Time_Start,
                    Time_Finish: element.Time_Finish,
                    Overpax: element.Overpax,
                    Tarif: element.Tarif,
                    CHTime: element.CHTimeTgl + ' ' +element.CHTimeJam,
                    Chusr: element.Chusr,
                });
            })

            resolve(result);
        } catch (err) {
            reject(err)
        }
    });
}

const getUser = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const regex = /^[A-Z0-9]+$/;
            const query = `
                Set DateFormat DMY 
                SELECT 
                    User_ID
                FROM 
                    IHP_User
                WHERE 
                    USER_ID != ''
                ORDER BY 
                    User_ID ASC
            `;

            const dataUser = await execute(query);
            let userList = [];
            dataUser.forEach(element => {
                const decryptedName = encrypt(element.User_ID);
                if(regex.test(decryptedName)){
                    userList.push({User_ID: decryptedName});
                }else{
                    // throw `USER POS HARUS MENGGUNAKAN HURUF KAPITAL ${element.User_ID} / ${decryptedName}`
                }
            });
            resolve(userList);
        } catch (err) {
            reject(err)
        }
    })
}

const getMember = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = `
                SET DateFormat DMY;
                SELECT 
                    Member,
                    (CONVERT(VARCHAR(10), CAST(Expire_Date AS datetime), 103)) AS Expire_Date,
                    Nama_Lengkap,
                    ISNULL(ALAMAT, ' ') AS ALAMAT,
                    ISNULL(KOTA, ' ') AS KOTA,
                    --ISNULL(KODEPOS, ' ') AS KODEPOS,
                    --ISNULL(Telepon, ' ') AS Telepon,
                    ISNULL(FAX, ' ') AS FAX,
                    CASE 
                    WHEN HP IS NULL THEN ''
                    WHEN HP = '-' THEN ''
                    ELSE HP
                    END AS Hp,
                    CASE 
                    WHEN EMAIL IS NULL THEN ''
                    WHEN EMAIL NOT LIKE '%_@__%.__%' THEN ''
                    WHEN EMAIL LIKE CHAR(9) THEN REPLACE(REPLACE(EMAIL, CHAR(9), ''), ' ', '')
                    WHEN EMAIL = '-' THEN ''
                    WHEN EMAIL = ' ' THEN ''
                    WHEN EMAIL = ' - ' THEN ''
                    ELSE REPLACE(REPLACE(EMAIL, CHAR(9), ''), ' ', '')
                    END AS EMAIL,
                    CASE 
                    WHEN BirthDay = '1900-01-01 12:00:00' THEN (CONVERT(VARCHAR(10), CAST('01/01/1900' AS datetime), 103))
                    WHEN BirthDay = '1900-01-01 00:00:00' THEN (CONVERT(VARCHAR(10), CAST('01/01/1900' AS datetime), 103))
                    ELSE (CONVERT(VARCHAR(10), ISNULL(BirthDay, '01/01/1900'), 103))
                    END AS BirthDay
                FROM IHP_Mbr
                WHERE 
--                    CONVERT(CHAR(10), convert(datetime,CHTime), 120) =  '${date}'
                        CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) >  '${moment(date).format('YYYY-MM-DD') + ' 06:00:00'}' AND
                        CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) <  '${moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 06:00:00'}'
                    OR Member IN (
                        SELECT 
                            Member 
                        FROM 
                            IHP_Rcp
                        WHERE 
                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND 
                            Complete = '1'
                    )
                ORDER BY 
                    Member ASC;
            `;

            const result = await execute(query);
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

const getReservation = (date) =>{
    return new Promise(async (resolve, reject) => {
        try {
            const query = `
               SET DateFormat DMY;
                SELECT 
                    Rsv.Reservation AS Reservation,
                    SUBSTRING(Rsv.Date, 1, 10) AS Date,
                    Rsv.Shift AS Shift,
                    Rsv.Member AS Member,
                    CAST(ROUND(Rsv.Uang_Muka, 0) AS INT) AS Uang_Muka,
                    Rsv.Id_Payment AS Id_Payment,
                    Rsv.Status AS Status,
                    Non.EDC_Machine AS EDC_Machine
                FROM 
                    IHP_Rsv Rsv, 
                    IHP_UangMukaNonCash Non
                WHERE 
                    CONVERT(CHAR(10), Rsv.DATE_TRANS, 120) = '${date}'
                    AND Rsv.Reservation = Non.Reception
                GROUP BY 
                    Rsv.Reservation, 
                    SUBSTRING(Rsv.Date, 1, 10), 
                    Rsv.Shift, 
                    Rsv.Member,
                    CAST(ROUND(Rsv.Uang_Muka, 0) AS INT), 
                    Rsv.Id_Payment, 
                    Rsv.Status, 
                    Non.EDC_Machine
                ORDER BY 
                    Rsv.Reservation ASC;
            `;

            const result = await execute(query);
            resolve(result);
        } catch (err) {
            reject(err)
        }
    })
}

const getRcp = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
                SET DateFormat DMY;
                SELECT 
                    Rcp.Reception,
                    CONVERT(VARCHAR(19), Rcp.Checkin, 103) + ' ' + CONVERT(VARCHAR(8), Rcp.Checkin, 8) AS Checkin,
                    (Rcp.Jam_Sewa + ISNULL(SUM(Ext.Jam_Extend), 0) + ((Rcp.Menit_Sewa + ISNULL(SUM(Ext.Menit_Extend), 0)) / 60)) AS Jam_Sewa,
                    ((Rcp.Menit_Sewa + ISNULL(SUM(Ext.Menit_Extend), 0)) % 60) AS Menit_Sewa,
                    CONVERT(VARCHAR(19), DATEADD(hh, ISNULL(SUM(Ext.Jam_Extend), 0), DATEADD(mi, ISNULL(SUM(Ext.Menit_Extend), 0), Rcp.Checkout)), 103) + ' ' + CONVERT(VARCHAR(8), DATEADD(hh, ISNULL(SUM(Ext.Jam_Extend), 0), DATEADD(mi, ISNULL(SUM(Ext.Menit_Extend), 0), Rcp.Checkout)), 8) AS Checkout,
                    Rcp.QM1,
                    Rcp.QM2,
                    Rcp.QM3,
                    Rcp.QM4,
                    Rcp.QF1,
                    Rcp.QF2,
                    Rcp.QF3,
                    Rcp.QF4,
                    Rcp.PAX,
                    Rcp.Reservation,
                    Rcp.Invoice
                FROM 
                    IHP_Rcp Rcp
                    LEFT JOIN IHP_Ext Ext ON Rcp.Reception = Ext.Reception
                    INNER JOIN IHP_Ivc ON Rcp.Reception = IHP_Ivc.Reception AND Rcp.Invoice = IHP_Ivc.Invoice
                WHERE 
                    CONVERT(CHAR(10), Rcp.date_trans, 120) = '${date}'
                    AND Complete = '1'
                GROUP BY 
                    Rcp.Reception, Rcp.Checkin, Rcp.Checkout, Rcp.Jam_Sewa, Rcp.Menit_Sewa,
                    Rcp.QM1, Rcp.QM2, Rcp.QM3, Rcp.QM4, Rcp.QF1, Rcp.QF2, Rcp.QF3, Rcp.QF4,
                    Rcp.PAX, Rcp.Reservation, Rcp.Invoice
                ORDER BY 
                    Rcp.Reception ASC;
                `;

            const result = await execute(query);
            resolve(result);
        } catch (err) {
            reject(err)
        }
    })
}

const getOkl = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
                SET DateFormat DMY;
                SELECT 
                    Okl.OrderPenjualan,
                    Okl.Reception 
                FROM 
                    IHP_Okl Okl 
                WHERE 
                    Okl.Reception IN (
                    SELECT 
                        Rcp.Reception 
                    FROM 
                        IHP_Rcp Rcp, 
                        IHP_Ivc 
                    WHERE 
                        CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                        AND Rcp.Reception = IHP_Ivc.Reception 
                        AND Rcp.Invoice = IHP_Ivc.Invoice 
                    )
                ORDER BY 
                    Okl.OrderPenjualan ASC;
            `;

            const result = await execute(query);
            resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}

const getOkd = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
                SET DateFormat DMY;
                SELECT 
                    IHP_Okd.OrderPenjualan,
                    IHP_Okd.SlipOrder AS SlipOrder,
                    IHP_Inventory.inventoryID_Global AS Inventory,
                    IHP_Okd.Nama,
                    CAST(ROUND(IHP_Okd.Price, 0) AS INT) AS Price,
                    CAST(IHP_Okd.Qty AS INT) AS Qty,
                    IHP_Okd.Inventory AS OKDInventory,
                    IHP_Inventory.Location 
                FROM 
                    IHP_Okd,
                    IHP_Inventory 
                WHERE 
                    IHP_Okd.Inventory = IHP_Inventory.Inventory 
                    AND OrderPenjualan IN (
                    SELECT OrderPenjualan FROM IHP_Okl 
                    WHERE reception IN (
                        SELECT Reception FROM IHP_Rcp 
                        WHERE 
                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    )
                    )
                ORDER BY 
                    IHP_Okd.OrderPenjualan, OKDInventory ASC;
            `;

            const item = [];
            const result = await execute(query);

            result.forEach((element)=>{
                if((element.Inventory).trim() == '' || (!element.Inventory)){
                    reject(`Item ${element.Nama} Tidak ada ID Global`)
                }
                item.push(
                    {
                        OrderPenjualan: element.OrderPenjualan,
                        SlipOrder: element.SlipOrder,
                        Inventory: element.Inventory,
                        Nama: element.Nama,
                        Price: element.Price,
                        Qty: element.Qty,
                        Location: element.Location,
                    }
                )
            });
            resolve(item);            
        } catch (err) {
            reject(err)
        }
    })
}

const getOkdPromo = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SET DateFormat DMY;
                SELECT 
                    COUNT(*) AS Jumlah
                FROM 
                    IHP_Okd_Promo a, 
                    IHP_Inventory b 
                WHERE 
                    a.Inventory = b.Inventory 
                    AND a.OrderPenjualan IN (
                    SELECT OrderPenjualan 
                    FROM IHP_OKL 
                    WHERE reception IN (
                        SELECT Reception 
                        FROM IHP_Rcp 
                        WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    )
                    );
            `;

            let query = `
                SET DateFormat DMY;
                SELECT 
                    a.OrderPenjualan,
                    a.SlipOrder,
                    b.InventoryID_Global AS Inventory,
                    CAST(ROUND(a.Harga_Promo, 0) AS INT) AS Harga_Promo
                FROM 
                    IHP_Okd_Promo a,
                    IHP_Inventory b
                WHERE 
                    a.Inventory = b.Inventory 
                    AND a.OrderPenjualan IN (
                    SELECT OrderPenjualan 
                    FROM IHP_OKL 
                    WHERE reception IN (
                        SELECT Rcp.Reception 
                        FROM IHP_Rcp Rcp, IHP_Ivc 
                        WHERE 
                        CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}' 
                        AND Complete = '1'
                        AND Rcp.Reception = IHP_Ivc.Reception 
                        AND Rcp.Invoice = IHP_Ivc.Invoice
                    )
                    )
                ORDER BY 
                    a.OrderPenjualan, b.Inventory ASC;
                `;

            const resultCheck = await execute(queryCheck);
            if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
                resolve([])
            }
            
            const result = await execute(query);

            resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}

const getOcl = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SELECT 
                    COUNT(*) AS Jumlah
                FROM 
                    IHP_Ocl
                WHERE 
                    reception IN (
                        SELECT 
                            Reception 
                        FROM 
                            IHP_Rcp 
                        WHERE 
                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                            AND Complete = '1'
                    );
            `;

            let query = `
                  SET DateFormat DMY;
                    SELECT 
                        IHP_Ocl.OrderCancelation,
                        IHP_Ocl.Reception
                    FROM 
                        IHP_Ocl
                    WHERE 
                        IHP_Ocl.reception IN (
                        SELECT 
                            IHP_Rcp.Reception 
                        FROM 
                            IHP_Rcp, 
                            IHP_Ivc
                        WHERE 
                            CONVERT(CHAR(10), IHP_Rcp.DATE_TRANS, 120) = '${date}'
                            AND Complete = '1'
                            AND IHP_Rcp.Reception = IHP_Ivc.Reception
                            AND IHP_Rcp.Invoice = IHP_Ivc.Invoice
                        )
                    ORDER BY 
                        OrderCancelation ASC;
                `;

            const resultCheck = await execute(queryCheck);
            if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
                resolve([])
            }
            
            const result = await execute(query);

            resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}


const getOcd = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
              SET DateFormat DMY;
                SELECT 
                    COUNT(*) AS Jumlah
                FROM 
                    IHP_Ocd, 
                    IHP_Inventory
                WHERE 
                    IHP_Ocd.Inventory = IHP_Inventory.Inventory
                    AND IHP_Ocd.OrderCancelation IN (
                    SELECT OrderCancelation 
                    FROM IHP_Ocl 
                    WHERE reception IN (
                        SELECT Reception 
                        FROM IHP_Rcp
                        WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    )
                    );
            `;

            let query = `
                SET DateFormat DMY;
                SELECT 
                    IHP_Ocd.OrderCancelation,
                    IHP_Ocd.OrderPenjualan,
                    IHP_Ocd.SlipOrder,
                    CAST(IHP_Ocd.Qty AS INT) AS Qty,
                    IHP_Inventory.InventoryID_Global AS Inventory,
                    CAST(ROUND(IHP_Ocd.Price, 0) AS INT) AS Price
                FROM 
                    IHP_Ocd, 
                    IHP_Inventory
                WHERE 
                    IHP_Ocd.Inventory = IHP_Inventory.Inventory
                    AND IHP_Ocd.OrderCancelation IN (
                    SELECT OrderCancelation 
                    FROM IHP_Ocl 
                    WHERE IHP_Ocl.reception IN (
                        SELECT Rcp.Reception 
                        FROM IHP_Rcp Rcp, IHP_Ivc
                        WHERE 
                        CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                        AND Rcp.Reception = IHP_Ivc.Reception
                        AND Rcp.Invoice = IHP_Ivc.Invoice
                    )
                    )
                ORDER BY 
                    IHP_Ocd.OrderCancelation, Inventory ASC;
                `;

            const resultCheck = await execute(queryCheck);
            if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
                resolve([])
            }
            
            const result = await execute(query);

            resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}


const getOcdPromo = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SET DateFormat DMY;
                SELECT 
                    COUNT(*) AS Jumlah
                FROM 
                    IHP_Ocd_Promo a, 
                    IHP_Inventory b
                WHERE 
                    a.Inventory = b.Inventory
                    AND a.OrderCancelation IN (
                    SELECT OrderCancelation 
                    FROM IHP_Ocl 
                    WHERE reception IN (
                        SELECT Reception 
                        FROM IHP_Rcp
                        WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'

                        AND Complete = '1'
                    )
                    );
            `;

            let query = `
                SET DateFormat DMY;
  SELECT 
    a.OrderCancelation,
    a.OrderPenjualan,
    a.SlipOrder,
    b.InventoryID_Global AS Inventory,
    CAST(ROUND(a.Harga_Promo, 0) AS INT) AS Harga_Promo
  FROM 
    IHP_Ocd_Promo a,
    IHP_Inventory b
  WHERE 
    a.Inventory = b.Inventory
    AND a.OrderCancelation IN (
      SELECT OrderCancelation 
      FROM IHP_Ocl 
      WHERE IHP_Ocl.reception IN (
        SELECT Rcp.Reception 
        FROM IHP_Rcp Rcp, IHP_Ivc
        WHERE 
            CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
          AND Complete = '1'
          AND Rcp.Reception = IHP_Ivc.Reception
          AND Rcp.Invoice = IHP_Ivc.Invoice
      )
    )
  ORDER BY 
    a.OrderCancelation, Inventory ASC;
                `;
        const resultCheck = await execute(queryCheck);

        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);
        
        resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}

const getSul = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SET DateFormat DMY;
                SELECT 
                    COUNT(*) as Jumlah
                FROM 
                    IHP_Sul
                WHERE 
                    CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                    AND reception IN (
                    SELECT Reception 
                    FROM IHP_Rcp
                    WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                );
            `;

            let query = `
            SET DateFormat DMY;
            SELECT 
                IHP_Sul.Summary,
                CONVERT(VARCHAR(10), IHP_Sul.date_trans, 103) AS Date,
                IHP_Sul.Shift,
                IHP_Sul.Reception,
                IHP_Sul.Invoice
            FROM 
                IHP_Sul
            WHERE 
                IHP_Sul.reception IN (
                SELECT IHP_Rcp.Reception 
                FROM IHP_Rcp, IHP_Ivc
                WHERE 
                CONVERT(CHAR(10), IHP_Rcp.DATE_TRANS, 120) = '${date}'
                    AND Complete = '1'
                    AND IHP_Rcp.Reception = IHP_Ivc.Reception
                    AND IHP_Rcp.Invoice = IHP_Ivc.Invoice
                )
                AND CONVERT(CHAR(10), IHP_Sul.DATE_TRANS, 120) = '${date}'
            ORDER BY 
                Summary ASC;
                `;
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);
        
        resolve(result);
            
        } catch (err) {
            reject(err)
        }
    })
}

const getSud = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkZeroCash = `
                SELECT 
                    SUMMARY, PAY_VALUE 
                FROM 
                    IHP_SUD 
                WHERE 
                    ID_PAYMENT = 0 
                AND 
                    PAY_VALUE = 0 
                AND 
                    SUMMARY IN (
                        SELECT 
                            SUMMARY 
                        FROM 
                            IHP_SUD 
                        GROUP BY 
                            SUMMARY 
                        HAVING COUNT(*) > 1
                    )
            `;

            const zeroCashResult = await execute(checkZeroCash);
            if(zeroCashResult.length>0){
                for(const cash of zeroCashResult){
                    let deleteQuery = `
                        DELETE FROM IHP_SUD 
                        WHERE 
                            ID_PAYMENT = 0 
                        AND 
                            PAY_VALUE = 0 
                        AND 
                            SUMMARY = '${cash.SUMMARY}'
                  `;

                  await execute(deleteQuery);
                }
            }

            const checkZeroDebit = `
                SELECT 
                    SUMMARY, PAY_VALUE 
                FROM 
                    IHP_SUD 
                WHERE 
                    ID_PAYMENT = 1 
                AND 
                    PAY_VALUE = 0 
                AND 
                    SUMMARY IN (
                        SELECT 
                            SUMMARY 
                        FROM 
                            IHP_SUD 
                        GROUP BY 
                            SUMMARY 
                        HAVING COUNT(*) > 1
                    )
            `;
            const zeroDebitResult = await execute(checkZeroDebit);
            
            if(zeroDebitResult.length>0){
                for(const cash of zeroDebitResult){
                    let deleteQuery = `
                        DELETE FROM IHP_SUD 
                        WHERE 
                            ID_PAYMENT = 1 
                        AND 
                            PAY_VALUE = 0 
                        AND 
                            SUMMARY = '${cash.SUMMARY}'
                  `;

                  await execute(deleteQuery);
                }
            }
            const checkZeroCredit = `
                SELECT 
                    SUMMARY, PAY_VALUE 
                FROM 
                    IHP_SUD 
                WHERE 
                    ID_PAYMENT = 2 
                AND 
                    PAY_VALUE = 0 
                AND 
                    SUMMARY IN (
                        SELECT 
                            SUMMARY 
                        FROM 
                            IHP_SUD 
                        GROUP BY 
                            SUMMARY 
                        HAVING COUNT(*) > 1
                    )
            `;

            const zeroCreditResult = await execute(checkZeroCredit);
            if(zeroCreditResult.length>0){
                for(const cash of zeroCreditResult){
                    let deleteQuery = `
                        DELETE FROM IHP_SUD 
                        WHERE 
                            ID_PAYMENT = 2 
                        AND 
                            PAY_VALUE = 0 
                        AND 
                            SUMMARY = '${cash.SUMMARY}'
                  `;

                  await execute(deleteQuery);
                }
            }

            let queryCheck = `
                SET DateFormat DMY;
                SELECT 
                    COUNT(*) AS Jumlah
                FROM 
                    IHP_Sud
                WHERE 
                    Summary IN (
                    SELECT Summary 
                    FROM IHP_Sul 
                    WHERE 
                    CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                    AND 
                        reception IN (
                        SELECT Reception 
                        FROM IHP_Rcp 
                        WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                        )
                    )
            `;

            let query = `
                SET DateFormat DMY;
                SELECT
                    Summary,
                    ID_Payment,
                    Member,
                    ISNULL(Input1, '') AS Input1,
                    ISNULL(Input2, '') AS Input2,
                    ISNULL(Input3, '') AS Input3,
                    CAST(ROUND(Pay_Value, 0) AS int) AS Pay_Value,
                    Status,
                    ISNULL(EDC_Machine, '') AS EDC_Machine
                FROM
                    IHP_Sud
                WHERE
                    Summary IN (
                        SELECT 
                            Summary
                        FROM 
                            IHP_Sul
                        WHERE 
                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND 
                            reception IN (
                                SELECT 
                                    Rcp.Reception
                                FROM   
                                    IHP_Rcp Rcp, 
                                    IHP_Ivc
                                WHERE 
                                    CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
                                AND 
                                    Complete = '1'
                                AND 
                                    Rcp.Reception = IHP_Ivc.Reception
                                AND 
                                    Rcp.Invoice = IHP_Ivc.Invoice
                            )
                        )
                        AND 
                            Pay_Value > 0
                        ORDER BY 
                            Summary, 
                            ID_Payment 
                            ASC
                `;
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);
        const listSud = [];
        for(const sud of result){

            if(sud.ID_Payment == 6){
                let queryUM = `
                    SELECT 
                        RCP.ID_Payment AS RCPID_Payment,
                        RCP.Member AS RCPMember,
                        CAST(ROUND(RCP.Uang_Muka, 0) AS int) AS RCPPay_Value,
                        ISNULL(UM.Member, '') AS UMMember,
                        ISNULL(UM.Input1, '') AS Input1,
                        ISNULL(UM.Input2, '') AS Input2,
                        ISNULL(UM.Input3, '') AS Input3,
                        ISNULL(CAST(ROUND(UM.Pay_Value, 0) AS int), 0) AS Pay_Value,
                        ISNULL(UM.EDC_Machine, '') AS EDC_Machine
                    FROM 
                        IHP_SUL SUL,
                        IHP_Rcp RCP
                    LEFT JOIN 
                        IHP_UangMukaNonCash UM 
                        ON RCP.Reception = UM.Reception
                    WHERE 
                        SUL.Reception = RCP.Reception
                        AND SUL.Summary = '${sud.Summary}'
                `;

                const resultUM = await execute(queryUM);
                
                if(resultUM.length > 0){
                    let UmList = [];
    
                    resultUM.forEach((element)=>{
                        if(element.RCPID_Payment == 0){
                            UmList.push({
                                ID_Payment: element.RCPID_Payment,
                                Member: element.RCPMember,
                                Input1: '',
                                Input2: '',
                                Input3: '',
                                Pay_Value: element.RCPPay_Value,
                                Status: '0',
                                EDC_Machine: '',
                            })
                        }else{
                            UmList.push({
                                Summary: sud.Summary,
                                ID_Payment: element.RCPID_Payment,
                                Member: element.UMMember,
                                Input1: element.Input1,
                                Input2: element.Input2,
                                Input3: element.Input3,
                                Pay_Value: element.Pay_Value,
                                Status: '0',
                                EDC_Machine: element.EDC_Machine,
                            })
                        }
                    })
                    UmList.forEach((element)=>{
                        listSud.push(element)
                    })
                    // result.push(UmList);
                }
            }else{
                listSud.push(sud);
            }
        }
        resolve(listSud);
        } catch (err) {
            reject(err)
        }
    })
}

const getDetailPromo = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SET DATEFORMAT DMY;
                SELECT 
                    COUNT(*) as Jumlah
                FROM 
                    IHP_Detail_Promo
                WHERE 
                    Reception IN (
                        SELECT 
                            Rcp.Reception 
                        FROM 
                            IHP_Rcp Rcp
                        JOIN 
                            IHP_Ivc ON Rcp.Reception = IHP_Ivc.Reception AND Rcp.Invoice = IHP_Ivc.Invoice
                        WHERE 
                            CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
                            AND Complete = '1'
            );`;

            let query = `
                SET DATEFORMAT DMY;
                SELECT 
                    Reception, 
                    CAST(ROUND(Nilai_Promo, 0) AS INT) AS Nilai_Promo 
                FROM 
                    IHP_Detail_Promo 
                WHERE 
                    Reception IN (
                    SELECT 
                        Reception 
                    FROM 
                        IHP_Rcp 
                    WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    );
            `;
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);        
        resolve(result);
        } catch (err) {
            reject(err)
        }
    })
}

const getCashSummaryDetail = (date) => {
    return new Promise(async (resolve, reject) => {
        try {

            let result1 = `
                SET DATEFORMAT DMY;
                SELECT 
                    SUBSTRING(Date, 1, 10) AS Date,
                    Shift,
                    SUM(CAST(Seratus_Ribu AS int)) AS Seratus_Ribu,
                    SUM(CAST(Lima_Puluh_Ribu AS int)) AS Lima_Puluh_Ribu,
                    SUM(CAST(Dua_Puluh_Ribu AS int)) AS Dua_Puluh_Ribu,
                    SUM(CAST(Sepuluh_Ribu AS int)) AS Sepuluh_Ribu,
                    SUM(CAST(Lima_Ribu AS int)) AS Lima_Ribu,
                    SUM(CAST(Dua_Ribu AS int)) AS Dua_Ribu,
                    SUM(CAST(Seribu AS int)) AS Seribu,
                    SUM(CAST(Lima_Ratus AS int)) AS Lima_Ratus,
                    SUM(CAST(Dua_Ratus AS int)) AS Dua_Ratus,
                    SUM(CAST(Seratus AS int)) AS Seratus,
                    SUM(CAST(Lima_Puluh AS int)) AS Lima_Puluh,
                    SUM(CAST(Dua_Puluh_Lima AS int)) AS Dua_Puluh_Lima
                                FROM 
                    IHP_Cash_Summary_Detail
                WHERE 
                    CONVERT(CHAR(10), convert(datetime,DATE), 120) =  '${date}'
                    AND Shift = 1 
                GROUP BY 
                    Date, Shift;
                `;

                let result2 = `
                SET DATEFORMAT DMY;
                SELECT 
                  SUBSTRING(Date, 1, 10) AS Date,
                  Shift,
                  SUM(CAST(Seratus_Ribu AS int)) AS Seratus_Ribu,
                  SUM(CAST(Lima_Puluh_Ribu AS int)) AS Lima_Puluh_Ribu,
                  SUM(CAST(Dua_Puluh_Ribu AS int)) AS Dua_Puluh_Ribu,
                  SUM(CAST(Sepuluh_Ribu AS int)) AS Sepuluh_Ribu,
                  SUM(CAST(Lima_Ribu AS int)) AS Lima_Ribu,
                  SUM(CAST(Dua_Ribu AS int)) AS Dua_Ribu,
                  SUM(CAST(Seribu AS int)) AS Seribu,
                  SUM(CAST(Lima_Ratus AS int)) AS Lima_Ratus,
                  SUM(CAST(Dua_Ratus AS int)) AS Dua_Ratus,
                  SUM(CAST(Seratus AS int)) AS Seratus,
                  SUM(CAST(Lima_Puluh AS int)) AS Lima_Puluh,
                  SUM(CAST(Dua_Puluh_Lima AS int)) AS Dua_Puluh_Lima
                FROM 
                  IHP_Cash_Summary_Detail
                WHERE 
                  CONVERT(CHAR(10), convert(datetime,DATE), 120) =  '${date}'
                  AND Shift = 2 
                GROUP BY 
                  Date, Shift;
              `;

        const result = [];
        const resultSatu = await execute(result1);
        const resultDua = await execute(result2);
        
        if(result1.length >0){
            result.push(resultSatu[0]);
        }

        if(result2.length >0){
            result.push(resultDua[0]);
        }

        resolve(result);

        } catch (err) {
            reject(err)
        }
    })
}

const getRoom = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheck = `
                SET DATEFORMAT DMY;
                SELECT 
                    COUNT(*) as Jumlah 
                FROM 
                    IHP_Room 
                WHERE 
--                    CONVERT(CHAR(10), convert(datetime,CHTime), 120) =  '${date}'
CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) >  '${moment(date).format('YYYY-MM-DD') + ' 06:00:00'}' AND
CONVERT(VARCHAR, CAST(CHTime AS datetime), 120) <  '${moment(date).add(1, 'days').format('YYYY-MM-DD') + ' 06:00:00'}'
            `;

            let query = `
                SET DATEFORMAT DMY;
                SELECT 
                    Kamar, 
                    Jenis_Kamar 
                FROM 
                    IHP_Room 
                WHERE 
                    Kamar IN (
                        SELECT DISTINCT 
                            Kamar 
                        FROM 
                            IHP_Rcp 
                        WHERE 
                            CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                            AND Complete = '1'
                    )
                ORDER BY 
                    Kamar ASC;
                `;
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);
        
        resolve(result);

        } catch (err) {
            reject(err)
        }
    })
}

const getIvc = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let queryCheckChusr = `
            SET DATEFORMAT DMY;
            SELECT 
              Chusr 
            FROM 
              IHP_Ivc 
            WHERE 
              CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
              AND Reception IN (
                  SELECT 
                      Reception 
                  FROM 
                      IHP_Rcp 
                  WHERE 
                      CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                      AND Complete = '1'
              );
          `;



        const resultChusrCheck = await execute(queryCheckChusr);

        if(resultChusrCheck.length > 0){
            for(const chusr of resultChusrCheck){
                const queryCheckAvailableChusr = `select User_ID from IHP_USer where User_ID = ${decrypt(chusr.Chusr)}`;
                const resultChusr = await execute(queryCheckAvailableChusr);
                if(resultChusr.length < 0){
                    reject('CHUSR GA VALID');
                }
            }
        }

        let queryCheckMember = `
            SET DATEFORMAT DMY;
            SELECT 
                member, Reception, Invoice 
            FROM 
                IHP_Ivc 
            WHERE 
                CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                AND Member = ' ' 
                AND Reception IN (
                    SELECT 
                        Reception 
                    FROM 
                        IHP_Rcp 
                    WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                );
            `;
        
        const resultMemberCheck = await execute(queryCheckMember);

        if(resultMemberCheck.length > 0){
            reject('ERROR Member Kosong RCP '+resultChusrCheck[0].Reception);
        }

        let queryCheck = `
            SET DATEFORMAT DMY;
            SELECT 
                COUNT(*) as Jumlah 
            FROM 
                IHP_Ivc 
            WHERE 
                CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                AND Reception IN (
                    SELECT 
                        Reception 
                    FROM 
                        IHP_Rcp 
                    WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                );
            `;
        const resultCheck = await execute(queryCheck)

        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }

        const query = `
            SET DATEFORMAT DMY;
            SELECT 
                IHP_Ivc.Invoice,
                CONVERT(VARCHAR(10), IHP_Ivc.date_trans, 103) AS Date,
                IHP_Ivc.Shift,
                IHP_Ivc.Reception,
                IHP_Ivc.Member,
                IHP_Ivc.Nama,
                REPLACE(IHP_Ivc.Kamar, ' ', '') AS Kamar,
                --IHP_Ivc.Jenis_Kamar,
                CAST(ROUND(IHP_Ivc.Sewa_Kamar, 0) AS INT) AS Sewa_Kamar,
                CAST(ROUND(IHP_Ivc.Total_Extend, 0) AS INT) AS Total_Extend,
                CAST(ROUND(IHP_Ivc.Overpax, 0) AS INT) AS Overpax,
                CAST(ROUND(IHP_Ivc.Discount_Kamar, 0) AS INT) AS Discount_Kamar,
                CAST(ROUND(IHP_Ivc.Surcharge_Kamar, 0) AS INT) AS Surcharge_Kamar,
                CAST(ROUND(IHP_Ivc.Service_Kamar, 0) AS INT) AS Service_Kamar,
                CAST(ROUND(IHP_Ivc.Tax_Kamar, 0) AS INT) AS Tax_Kamar,
                CAST(ROUND(IHP_Ivc.Total_Kamar, 0) AS INT) AS Total_Kamar,
                CAST(ROUND(IHP_Ivc.Charge_Penjualan, 0) AS INT) AS CHargesPenjualan,
                CAST(ROUND(IHP_Ivc.Total_Cancelation, 0) AS INT) AS Total_Cancelation,
                CAST(ROUND(IHP_Ivc.Discount_Penjualan, 0) AS INT) AS Discount_Penjualan,
                CAST(ROUND(IHP_Ivc.Service_Penjualan, 0) AS INT) AS Service_Penjualan,
                CAST(ROUND(IHP_Ivc.Tax_Penjualan, 0) AS INT) AS Tax_Penjualan,
                CAST(ROUND(IHP_Ivc.Total_Penjualan, 0) AS INT) AS Total_Penjualan,
                CAST(ROUND(IHP_Ivc.Charge_Lain, 0) AS INT) AS Charge_Lain,
                IHP_Ivc.Chusr,
                IHP_Ivc.Status,
                IHP_Ivc.Transfer,
                CAST(ROUND(IHP_Ivc.Uang_Voucher, 0) AS INT) AS Uang_Voucher
            FROM 
                IHP_Ivc
            JOIN 
                IHP_Rcp ON IHP_Ivc.Invoice = IHP_Rcp.Invoice AND IHP_Ivc.Reception = IHP_Rcp.Reception
            WHERE 
                CONVERT(CHAR(10), IHP_Ivc.DATE_TRANS, 120) = '${date}' 
                AND IHP_Ivc.Invoice IN (SELECT Invoice FROM IHP_Rcp) 
                AND IHP_Ivc.Reception IN (
                    SELECT Reception 
                    FROM IHP_Rcp 
                    WHERE 
                    CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}' 
                    AND Complete = '1'
                )
            ORDER BY 
                IHP_Ivc.Invoice ASC;
        `;
        
        const result = await execute(query);
        
        resolve(result);

        } catch (err) {
            reject(err)
        }
    })
}

const search = async() =>{
    try {
        const queryCheckAvailableChusr = `select User_ID from IHP_USer where User_ID = ${decrypt("Talitha")}`;
        const resultChusr = await execute(queryCheckAvailableChusr);
    } catch (err) {
        reject(err)
    }
}

module.exports = {
    getTotalPay,
    getTotalInvoice,
    cekSummaryCashBalance,
    getInventory,
    getRoomType,
    getUser,
    getMember,
    getReservation,
    getRcp,
    getOkl,
    getOkd,
    getOkdPromo,
    getOcl,
    getOcd,
    getOcdPromo,
    getSul,
    getSud,
    getDetailPromo,
    getCashSummaryDetail,
    getRoom,
    getIvc,
    search
}