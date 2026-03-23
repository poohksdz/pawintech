const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateProduct37() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawin-tech'
    });

    try {
        const liveData = {
            productCode: "SW12P06",
            name: "SW12P06 AC-DC Converter 6W, Output 12V 0.5A",
            image: "/images/image-1743106479116.jpg",
            mutipleImage: "/images/images-1757050664296-d1c9ca.png,/images/images-1757050664297-77e6f2.png,/images/images-1757050664297-a7fa09.png",
            brand: "PAWIN",
            category: "Switching Power Supply ,AC-DC",
            description: `<p><strong>PAWIN รุ่น SW12P06</strong></p><p><strong>แรงดัน Output 12V | กระแส 500mA | มีระบบป้องกันครบ</strong></p><p><strong>คุณสมบัติ</strong></p><ul><li><strong>แรงดัน Output: 12V DC</strong></li><li><strong>กระแสสูงสุด: 500mA</strong></li><li><strong>กำลังไฟรวม: 6 วัตต์</strong></li><li><strong>รองรับแรงดัน Input: 100-240V AC (50/60Hz)</strong> ใช้งานได้ทั้งในและต่างประเทศ</li></ul><h3><strong>ระบบป้องกัน (Protection System)</strong></h3><ul><li><strong>Overcurrent Protection (OCP)</strong>: ตัดการทำงานทันทีหากกระแสไฟฟ้าเกินพิกัด ป้องกันความเสียหายต่ออุปกรณ์</li><li><strong>Overtemperature Protection (OTP)</strong>: ระบบป้องกันความร้อนสูงเกิน ช่วยยืดอายุการใช้งานของตัวเครื่อง</li><li><strong>Short Circuit Protection (SCP)</strong>: ป้องกันความเสียหายกรณีเกิดไฟลัดวงจร</li></ul><h3><strong>เหมาะสำหรับ:</strong></h3><ul><li>อุปกรณ์อิเล็กทรอนิกส์ทั่วไป เช่น กล้องวงจรปิด, เราเตอร์, ไฟ LED</li><li>งาน DIY หรือโปรเจกต์อิเล็กทรอนิกส์ที่ต้องการแหล่งจ่ายไฟ 12V ขนาดเล็ก</li><li>อุปกรณ์ควบคุมต่าง ๆ ที่ต้องการความเสถียรของแรงดันไฟฟ้า</li></ul><h3><strong>ทำไมต้องเลือก PAWIN SW12P06</strong></h3><ul><li>วัสดุแข็งแรง ทนความร้อนดี</li><li>ขนาดเล็ก</li><li>ใช้งานได้ต่อเนื่องและปลอดภัย</li><li>ราคาเหมาะสม คุ้มค่าเกินราคา</li></ul><p><br></p><p><br></p><p><img src="/images/image-1757050001779.png"><img src="/images/image-1757049996608.png"><img src="/images/image-1757049989432.png"></p><p><img src="/images/image-1757050394204.png"></p>`,
            datasheet: "/datasheets/datasheet-1757052210633.pdf",
            manual: "/manuals/manual-1757052229339.pdf",
            nameThai: "SW12P06 โมดูลสวิตซ์ชิ่งเพาเวอร์ซัพพลาย 6W ,12V 0.5A",
            descriptionThai: `<p><strong>PAWIN รุ่น SW12P06</strong></p><p><strong>แรงดัน Output 12V | กระแส 500mA | มีระบบป้องกันครบ</strong></p><p><strong>คุณสมบัติ</strong></p><ul><li><strong>แรงดัน Output: 12V DC</strong></li><li><strong>กระแสสูงสุด: 500mA</strong></li><li><strong>กำลังไฟรวม: 6 วัตต์</strong></li><li><strong>รองรับแรงดัน Input: 100-240V AC (50/60Hz)</strong> ใช้งานได้ทั้งในและต่างประเทศ</li></ul><h3><strong>ระบบป้องกัน (Protection System)</strong></h3><ul><li><strong>Overcurrent Protection (OCP)</strong>: ตัดการทำงานทันทีหากกระแสไฟฟ้าเกินพิกัด ป้องกันความเสียหายต่ออุปกรณ์</li><li><strong>Overtemperature Protection (OTP)</strong>: ระบบป้องกันความร้อนสูงเกิน ช่วยยืดอายุการใช้งานของตัวเครื่อง</li><li><strong>Short Circuit Protection (SCP)</strong>: ป้องกันความเสียหายกรณีเกิดไฟลัดวงจร</li></ul><h3><strong>เหมาะสำหรับ:</strong></h3><ul><li>อุปกรณ์อิเล็กทรอนิกส์ทั่วไป เช่น กล้องวงจรปิด, เราเตอร์, ไฟ LED</li><li>งาน DIY หรือโปรเจกต์อิเล็กทรอนิกส์ที่ต้องการแหล่งจ่ายไฟ 12V ขนาดเล็ก</li><li>อุปกรณ์ควบคุมต่าง ๆ ที่ต้องการความเสถียรของแรงดันไฟฟ้า</li></ul><h3><strong>ทำไมต้องเลือก PAWIN SW12P06</strong></h3><ul><li>วัสดุแข็งแรง ทนความร้อนดี</li><li>ขนาดเล็ก</li><li>ใช้งานได้ต่อเนื่องและปลอดภัย</li><li>ราคาเหมาะสม คุ้มค่าเกินราคา</li></ul><p><img src="/images/image-1757050725717.png"></p><p><img src="/images/image-1757050291293.png"><img src="/images/image-1757050275180.png"><img src="/images/image-1757050255686.png"></p>`,
            brandThai: "PAWIN",
            categoryThai: "สวิตชิ่งเพาเวอร์ซัพพลาย AC-DC",
            id: 37
        };

        const query = `
      UPDATE products 
      SET productCode = ?, name = ?, mutipleImage = ?, brand = ?, category = ?, description = ?, datasheet = ?, manual = ?, nameThai = ?, descriptionThai = ?, brandThai = ?, categoryThai = ?
      WHERE _id = ?
    `;

        const values = [
            liveData.productCode, liveData.name, liveData.mutipleImage, liveData.brand, liveData.category, liveData.description, liveData.datasheet, liveData.manual, liveData.nameThai, liveData.descriptionThai, liveData.brandThai, liveData.categoryThai, liveData.id
        ];

        const [result] = await connection.execute(query, values);
        console.log("Product 37 updated successfully!");
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        await connection.end();
    }
}

updateProduct37();
