const asyncHandler = require('../middleware/asyncHandler')
const { pool } = require('../config/db.js')
const deleteFile = require('../utils/fileUtils')
const fs = require('fs')
const path = require('path')
const jsQR = require('jsqr')
const Jimp = require('jimp')

// Helper: สร้าง Timestamp สำหรับ ID
const getTimestamp = () => {
    const now = new Date()
    const YYYY = now.getFullYear()
    const MM = String(now.getMonth() + 1).padStart(2, '0')
    const DD = String(now.getDate()).padStart(2, '0')
    const HH = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    return `${YYYY}${MM}${DD}${HH}${mm}${ss}`
}

// Helper: สร้าง ID อ้างอิงการชำระเงิน
const generateUniquePaymentConfirmID = async () => {
    const base = getTimestamp()
    let counter = 1, uniqueID, isUnique = false
    while (!isUnique) {
        uniqueID = `PIDP-${base}${String(counter).padStart(3, '0')}`
        const [rows] = await pool.query('SELECT id FROM pcb_custom_orders WHERE paymentComfirmID = ?', [uniqueID])
        if (rows.length === 0) isUnique = true; else counter++
    }
    return uniqueID
}

// Helper: ตรวจสอบหา QR Code ในรูปภาพ
const checkSlipQR = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return false;

        const image = await Jimp.read(filePath);
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height,
        };

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        return code !== null;
    } catch (error) {
        console.error('🔥 Error reading image for QR:', error);
        return false;
    }
}

// Helper: format Date -> MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
const toMySQLDatetime = (d = new Date()) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

// @desc    สร้างออเดอร์ใหม่จากสลิป
const createCustomPCB = asyncHandler(async (req, res) => {
    try {
        const payload = req.body.orderData || req.body;
        const {
            cartId, userId, userName, userEmail, transferedAmount, transferedName, transferedDate, paymentSlip,
            receivePlace, shippingName, shippingPhone, shippingAddress,
            shippingCity, shippingPostalCode, shippingCountry,
            billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax
        } = payload;

        if (!cartId) return res.status(400).json({ success: false, message: '⚠️ ไม่พบข้อมูลตะกร้าสินค้า' });
        if (!paymentSlip) return res.status(400).json({ success: false, message: '⚠️ กรุณาแนบรูปสลิปโอนเงิน' });

        // 1. ดึงข้อมูลต้นฉบับจากตะกร้า
        const [cartRows] = await pool.query(`SELECT * FROM pcb_custom_carts WHERE id = ?`, [cartId])
        if (cartRows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลตะกร้าที่ต้องการชำระเงิน' })
        const cart = cartRows[0]

        // 2. จัดการ Path สลิป
        let cleanPaymentSlip = paymentSlip.replace(/\\/g, '/');
        if (!cleanPaymentSlip.startsWith('/')) cleanPaymentSlip = '/' + cleanPaymentSlip;

        // --------------------------------------------------------------------------
        // 🛑 ตรวจสอบความถูกต้องของสลิปและยอดเงิน
        // --------------------------------------------------------------------------
        const absoluteFilePath = path.join(__dirname, '..', cleanPaymentSlip);

        // 2.1 ตรวจสอบยอดเงิน (เผื่อกรณีมี estimatedCost ด้วย)
        const targetPrice = Number(cart.confirmed_price) || Number(cart.estimatedCost) || 0;
        const paidAmount = Number(transferedAmount);

        if (targetPrice > 0 && Math.abs(paidAmount - targetPrice) > 1.00) {
            if (fs.existsSync(absoluteFilePath)) {
                fs.unlinkSync(absoluteFilePath);
            }
            return res.status(400).json({
                success: false,
                message: `⚠️ ยอดโอนเงินไม่ถูกต้อง (ยอดที่ต้องชำระคือ ${targetPrice.toLocaleString()} บาท)`
            });
        }

        // 2.2 ตรวจสอบว่ารูปภาพมี QR Code หรือไม่
        const isValidQR = await checkSlipQR(absoluteFilePath);

        if (!isValidQR) {
            if (fs.existsSync(absoluteFilePath)) {
                fs.unlinkSync(absoluteFilePath);
            }
            return res.status(400).json({
                success: false,
                message: '⚠️ ไม่พบ QR Code ในรูปภาพ กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้อง'
            });
        }
        // --------------------------------------------------------------------------

        // 3. สร้าง OrderID
        let count = 1, orderID = '', isUnique = false;
        const targetUserId = userId || cart.user_id || 0;
        while (!isUnique) {
            orderID = `${parseInt(targetUserId) + 1000}PID${String(count).padStart(3, '0')}`
            const [existing] = await pool.query(`SELECT id FROM pcb_custom_orders WHERE orderID = ?`, [orderID])
            if (existing.length === 0) isUnique = true; else count++;
        }

        const paymentComfirmID = await generateUniquePaymentConfirmID()

        // 📥 4. คำสั่ง SQL บันทึกข้อมูล
        const insertSql = `
            INSERT INTO pcb_custom_orders (
                projectname, user_id, pcb_qty, notes, dirgram_zip,
                dirgram_image_1, dirgram_image_2, dirgram_image_3, dirgram_image_4, dirgram_image_5,
                dirgram_image_6, dirgram_image_7, dirgram_image_8, dirgram_image_9, dirgram_image_10,
                status, confirmed_price, created_at, updated_at,
                userName, userEmail, 
                shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone, 
                receivePlace, 
                billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
                transferedAmount, transferedName, paymentSlip, transferedDate,
                orderID, paymentComfirmID, cartId, isDelivered
            ) VALUES (
                ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, 
                'paid', ?, NOW(), NOW(), 
                ?, ?, 
                ?, ?, ?, ?, ?, ?, 
                ?, 
                ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, 
                ?, ?, ?, 0
            )
        `

        const insertValues = [
            cart.projectname,
            cart.user_id,
            cart.pcb_qty,
            cart.notes || '',
            cart.dirgram_zip || '',
            cart.dirgram_image_1 || '', cart.dirgram_image_2 || '', cart.dirgram_image_3 || '', cart.dirgram_image_4 || '', cart.dirgram_image_5 || '',
            cart.dirgram_image_6 || '', cart.dirgram_image_7 || '', cart.dirgram_image_8 || '', cart.dirgram_image_9 || '', cart.dirgram_image_10 || '',
            targetPrice,
            userName || cart.userName,
            userEmail || cart.userEmail,
            shippingName || cart.shippingName,
            shippingAddress || cart.shippingAddress,
            shippingCity || cart.shippingCity,
            shippingPostalCode || cart.shippingPostalCode,
            shippingCountry || cart.shippingCountry,
            shippingPhone || cart.shippingPhone,
            receivePlace || cart.receivePlace || 'bysending',
            billingName || cart.billingName,
            billinggAddress || cart.billinggAddress,
            billingCity || cart.billingCity,
            billingPostalCode || cart.billingPostalCode,
            billingCountry || cart.billingCountry,
            billingPhone || cart.billingPhone,
            billingTax || cart.billingTax,
            transferedAmount,
            transferedName,
            cleanPaymentSlip,
            transferedDate,
            orderID,
            paymentComfirmID,
            cartId
        ]

        await pool.query(insertSql, insertValues)

        // 5. อัปเดตตะกร้าเดิมเป็นจ่ายแล้ว
        await pool.query(`UPDATE pcb_custom_carts SET status = 'paid' WHERE id = ?`, [cartId])

        return res.status(201).json({ success: true, message: 'ชำระเงินสำเร็จ!', orderID })

    } catch (error) {
        console.error('🔥 Backend Error:', error)
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: error.message })
    }
})

// @desc    แอดมินสร้างออเดอร์ให้ลูกค้าโดยตรง
const createCustomPCBbyAdmin = asyncHandler(async (req, res) => {
    try {
        const orderData = req.body || {}
        const customerInfo = orderData.customerInfo || {}
        const shippingAddress = orderData.shippingAddress || {}
        const billingAddress = orderData.billingAddress || {}

        const user_id = orderData.user_id ?? null
        const userName = customerInfo.customerName ?? ''
        const userEmail = customerInfo.customerEmailAddress ?? ''

        const uidNum = Number(user_id)
        const userPrefix = Number.isFinite(uidNum) ? String(uidNum + 1000) : '1000'
        let count = 1, orderID = '', isUnique = false
        while (!isUnique) {
            orderID = `${userPrefix}PID${String(count).padStart(3, '0')}`
            const [rows] = await pool.query(`SELECT id FROM pcb_custom_orders WHERE orderID = ? LIMIT 1`, [orderID])
            if (!rows || rows.length === 0) isUnique = true; else count++
        }

        const paymentComfirmID = await generateUniquePaymentConfirmID()
        const createdAt = toMySQLDatetime()

        const insertSql = `
            INSERT INTO pcb_custom_orders (
                projectname, user_id, pcb_qty, notes, dirgram_zip,
                status, confirmed_price, userName, userEmail,
                shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry, shippingPhone,
                receivePlace, billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, billingTax,
                orderID, paymentComfirmID, cartId, created_at, updated_at, isDelivered
            ) VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `

        const insertValues = [
            orderData.projectname || 'Admin Order', user_id, orderData.pcb_qty || 1, orderData.notes || '', orderData.diagram_zip || null,
            orderData.confirmed_price || 0, userName, userEmail,
            shippingAddress.shippingname || '', shippingAddress.address || '', shippingAddress.city || '', shippingAddress.postalCode || '', shippingAddress.country || '', shippingAddress.phone || '',
            shippingAddress.receivePlace || 'bysending', billingAddress.billingName || '', billingAddress.billinggAddress || '', billingAddress.billingCity || '', billingAddress.billingPostalCode || '', billingAddress.billingCountry || '', billingAddress.billingPhone || '', billingAddress.tax || '',
            orderID, paymentComfirmID, orderData.cartId || null, createdAt, createdAt
        ]

        await pool.query(insertSql, insertValues)
        return res.status(201).json({ success: true, message: 'แอดมินสร้างออเดอร์สำเร็จ', orderID })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    อัปเดตสถานะจัดส่ง
const updateDeliveryCustomPCBById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { transferedNumber } = req.body;
    try {
        await pool.query(`UPDATE pcb_custom_orders SET isDelivered = 1, deliveryOn = NOW(), deliveryID = ?, transferedNumber = ?, updated_at = NOW() WHERE id = ?`, [transferedNumber, transferedNumber, id]);
        res.json({ success: true, message: 'แจ้งจัดส่งสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

// @desc    แอดมินอนุมัติชำระเงิน
const updatePaymentCustomPCBById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; const { status } = req.body;
        const dbStatus = status === 'Paid' ? 'accepted' : (status === 'Reject' ? 'rejected' : 'pending');
        await pool.query(`UPDATE pcb_custom_orders SET status = ?, updated_at = NOW() WHERE id = ?`, [dbStatus, id]);
        res.status(200).json({ success: true, message: `อัปเดตสำเร็จ` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const getCustomPCBs = asyncHandler(async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pcb_custom_orders ORDER BY created_at DESC')
        res.status(200).json({ success: true, data: rows })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const getCustomPCBById = asyncHandler(async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pcb_custom_orders WHERE id = ?', [req.params.id])
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' })
        res.status(200).json({ success: true, data: rows[0] })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const getCustomPCBByUserId = asyncHandler(async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pcb_custom_orders WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId])
        res.status(200).json({ success: true, data: rows })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const getCustomPCBByOrderId = asyncHandler(async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pcb_custom_orders WHERE orderID = ?', [req.params.orderID])
        res.status(200).json({ success: true, data: rows })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const deleteCustomPCB = asyncHandler(async (req, res) => {
    const { id } = req.params
    try {
        // 1. Fetch order to get files
        const [rows] = await pool.query('SELECT paymentSlip, dirgram_zip, dirgram_image_1, dirgram_image_2, dirgram_image_3, dirgram_image_4, dirgram_image_5, dirgram_image_6, dirgram_image_7, dirgram_image_8, dirgram_image_9, dirgram_image_10 FROM pcb_custom_orders WHERE id = ?', [id])

        if (rows.length > 0) {
            const order = rows[0]
            deleteFile(order.paymentSlip)
            deleteFile(order.dirgram_zip)
            for (let i = 1; i <= 10; i++) {
                deleteFile(order[`dirgram_image_${i}`])
            }
        }

        const [result] = await pool.query('DELETE FROM pcb_custom_orders WHERE id = ?', [id])
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' })
        res.status(200).json({ success: true, message: 'ลบสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

const updateCustomPCBById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body.updatedData || req.body;
        const {
            projectname, pcb_qty, notes, dirgram_zip, diagramImages, confirmed_price,
            userName, userEmail, receivePlace,
            shippingName, shippingPhone, shippingAddress, shippingCity, shippingPostalCode, shippingCountry,
            billingName, billingPhone, billinggAddress, billingCity, billingPostalCode, billingCountry, billingTax
        } = data;

        // 1. Prepare base update fields
        let updateFields = [
            'projectname = ?', 'pcb_qty = ?', 'notes = ?', 'dirgram_zip = ?', 'updated_at = NOW()',
            'userName = ?', 'userEmail = ?', 'receivePlace = ?',
            'shippingName = ?', 'shippingPhone = ?', 'shippingAddress = ?', 'shippingCity = ?', 'shippingPostalCode = ?', 'shippingCountry = ?',
            'billingName = ?', 'billingPhone = ?', 'billinggAddress = ?', 'billingCity = ?', 'billingPostalCode = ?', 'billingCountry = ?', 'billingTax = ?'
        ];

        let queryParams = [
            projectname, pcb_qty, notes || '', dirgram_zip || '',
            userName || '', userEmail || '', receivePlace || 'bysending',
            shippingName || '', shippingPhone || '', shippingAddress || '', shippingCity || '', shippingPostalCode || '', shippingCountry || '',
            billingName || '', billingPhone || '', billinggAddress || '', billingCity || '', billingPostalCode || '', billingCountry || '', billingTax || ''
        ];

        // 2. Handle Price
        if (confirmed_price !== undefined) {
            updateFields.push('confirmed_price = ?');
            queryParams.push(confirmed_price);
        }

        // 3. Handle Images (up to 10)
        if (Array.isArray(diagramImages)) {
            for (let i = 1; i <= 10; i++) {
                const imgPath = diagramImages[i - 1] || '';
                updateFields.push(`dirgram_image_${i} = ?`);
                queryParams.push(imgPath);
            }
        }

        const sql = `UPDATE pcb_custom_orders SET ${updateFields.join(', ')} WHERE id = ?`;
        queryParams.push(id);

        await pool.query(sql, queryParams);
        res.json({ success: true, message: 'อัปเดตสำเร็จ' });
    } catch (error) {
        console.error('🔥 Update Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = {
    createCustomPCB, getCustomPCBById, getCustomPCBByOrderId, getCustomPCBs,
    getCustomPCBByUserId, updateCustomPCBById, updateDeliveryCustomPCBById,
    updatePaymentCustomPCBById, deleteCustomPCB, createCustomPCBbyAdmin,
}