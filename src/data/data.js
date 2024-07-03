const execute = require('../tools/query-executor');
const decryptor = require('../tools/encrypt');

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
            AND CONVERT(CHAR(10), CHTime, 120) = '${date}'
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
                WHERE OrderPenjualan IN (
                    SELECT OrderPenjualan 
                    FROM IHP_Okl 
                    WHERE Reception IN (
                    SELECT Reception 
                    FROM IHP_Rcp 
                    WHERE CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    )
                )
                )
            ORDER BY 
                Inventory ASC`;
            const dataCount = await execute(queryCheck);
            if(dataCount.count < 1){
                resolve([]);
            }
            console.log(queryData)
            const dataInventory = await execute(queryData);


            console.log(dataInventory);
        } catch (err) {
            console.log(`
            Error get inventory
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
        }
    })
}

const getRoomType = () =>{
    return new Promise(async (resolve, reject) => {
        try {
            const queryCheck = `
            SET DateFormat DMY
                SELECT 
                    Nama_Kamar, 
                    Hari, 
                    Time_Start, 
                    Time_Finish, 
                    CAST(Overpax as int) as Overpax, 
                    CAST(ROUND(Tarif,0) as int) as Tarif, 
                    CONVERT(VARCHAR(19), CHTime, 103) as CHTimeTgl, 
                    CONVERT(VARCHAR(8), CHTime, 108) as CHTimeJam, 
                    Chusr
                FROM 
                    IHP_Jenis_Kamar 
                WHERE 
                    CONVERT(CHAR(10), convert(datetime,CHTime), 120) =  '${date}'
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
                WHERE OrderPenjualan IN (
                    SELECT OrderPenjualan 
                    FROM IHP_Okl 
                    WHERE Reception IN (
                    SELECT Reception 
                    FROM IHP_Rcp 
                    WHERE 
                        CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                    )
                )
                )
            ORDER BY 
                Inventory ASC`;
            const dataCount = await execute(queryCheck);
            if(dataCount.count < 1){
                resolve([]);
            }
            console.log(queryData)
            const dataInventory = await execute(queryData);


            console.log(dataInventory);
        } catch (err) {
            console.log(`
            Error get inventory
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
        }
    })
}

const getUser = () => {
    return new Promise(async (resolve, reject) => {
        try {
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
            dataUser.forEach(element => {
                console.log(decryptor(element.User_ID))
            });
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
                    ISNULL(KODEPOS, ' ') AS KODEPOS,
                    ISNULL(Telepon, ' ') AS Telepon,
                    ISNULL(FAX, ' ') AS FAX,
                    CASE 
                    WHEN HP IS NULL THEN ''
                    WHEN HP = '-' THEN ''
                    ELSE HP
                    END AS HP,
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
                    ELSE (CONVERT(VARCHAR(10), CAST(ISNULL(BirthDay, '01/01/1900') AS datetime), 103))
                    END AS BirthDay
                FROM IHP_Mbr
                WHERE 
                    CONVERT(CHAR(10), convert(datetime,CHTime), 120) =  '${date}'
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
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            const result = await execute(query);
            resolve(result);
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
                    b.InventoryID_Global AS Inventory,
                    a.SlipOrder,
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
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log('jml '+resultCheck[0].Jumlah)
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log('jml '+resultCheck[0].Jumlah)
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
        console.log('1')
        const resultCheck = await execute(queryCheck);
        console.log('2')
        console.log('DEBUGGING RESULT '+resultCheck[0].Jumlah)
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        console.log('3')
        
        const result = await execute(query);
        console.log('4')
        
        resolve(result);
        console.log('5')
            console.log('jml '+resultCheck[0].Jumlah)
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log('jml '+resultCheck[0].Jumlah)
            console.log(result)
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
        }
    })
}

const getSud = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('1');
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
            console.log('2');
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
            console.log('3');
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
            console.log('4');
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
            console.log('5');
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
                    ISNULL(EDC_Machine, '') AS EDC_Machine,
                    Status
                FROM
                    IHP_Sud
                WHERE
                    Summary IN (
                    SELECT Summary
                    FROM IHP_Sul
                    WHERE 
                    CONVERT(CHAR(10), DATE_TRANS, 120) = '${date}'
                    AND reception IN (
                        SELECT Rcp.Reception
                        FROM IHP_Rcp Rcp, IHP_Ivc
                        WHERE 
                        CONVERT(CHAR(10), Rcp.DATE_TRANS, 120) = '${date}'
                        AND Complete = '1'
                        AND Rcp.Reception = IHP_Ivc.Reception
                        AND Rcp.Invoice = IHP_Ivc.Invoice
                    )
                    )
                    AND Pay_Value > 0
                ORDER BY Summary, ID_Payment ASC
                `;
                console.log('6');
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            console.log('kok kosong');
            resolve([])
        }
        
        const result = await execute(query);
        console.log('7');
        for(const sud of result){
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
            console.log('8');
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
                console.log('9');
                result.push(UmList);
            }
        }
        console.log('10');
        console.log(result);
        resolve(result);
        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
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
            console.log('1')
        const resultCheck = await execute(queryCheck);
        if(!resultCheck[0].Jumlah || resultCheck[0].Jumlah < 1){
            resolve([])
        }
        
        const result = await execute(query);
        console.log('2')
        
        resolve(result);
        console.log(result);

        } catch (err) {
            console.log(`
            Error get User
                err: ${err}    
                name: ${err.name}    
                message: ${err.message}    
                stack: ${err.stack}    
            `);
        }
    })
}

module.exports = {
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
    getDetailPromo
}