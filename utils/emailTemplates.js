/**
 * Beautiful HTML Email Templates for the system
 */

const resetPasswordTemplate = (resetUrl, userName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #4f46e5);
            padding: 40px 20px;
            text-align: center;
        }
        .header img {
            height: 50px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
            line-height: 1.6;
        }
        .content h2 {
            margin-top: 0;
            font-size: 20px;
            color: #0f172a;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 36px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 14px;
            font-weight: 700;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .expiry-note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://pawintech.com/image/favicon.ico" alt="Logo">
            <h1>Pawin Tech</h1>
        </div>
        <div class="content">
            <h2>สวัสดีคุณ ${userName || "User"},</h2>
            <p>เราได้รับคำขอในการเปลี่ยนรหัสผ่านสำหรับบัญชีของคุณที่ <strong>Pawin Tech</strong> หากคุณเป็นคนส่งคำขอนี้ กรุณาคลิกปุ่มด้านล่างเพื่อเริ่มขั้นตอนการตั้งรหัสผ่านใหม่:</p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">รีเซ็ตรหัสผ่านของคุณ</a>
            </div>
            
            <p>หรือคัดลอกลิงก์นี้ไปวางใน Browser ของคุณ:</p>
            <p style="word-break: break-all; font-size: 12px; color: #2563eb;">${resetUrl}</p>
            
            <p class="expiry-note">ลิ้งก์นี้จะหมดอายุภายใน 1 ชั่วโมง เพื่อความปลอดภัยของบัญชีคุณ</p>
            <p>หากคุณไม่ได้ร้องขอการเปลี่ยนรหัสผ่านนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้ และรหัสผ่านของคุณจะยังคงเดิมไม่มีการเปลี่ยนแปลง</p>
        </div>
        <div class="footer">
            <p>© 2025 Pawin Tech. All rights reserved.</p>
            <p>นี่เป็นอีเมลที่ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
    </div>
</body>
</html>
`;

const quotationEmailTemplate = (userName, quotationNo, grandTotal, companyName, bankInfo) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #334155;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #0f172a;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px;
            line-height: 1.7;
        }
        .content h2 {
            margin-top: 0;
            font-size: 18px;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .info-grid {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
        }
        .info-item {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            font-weight: 600;
            color: #64748b;
        }
        .info-value {
            font-weight: 700;
            color: #0f172a;
        }
        .price-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            margin: 25px 0;
        }
        .price-label {
            font-size: 14px;
            color: #166534;
            margin-bottom: 5px;
        }
        .price-value {
            font-size: 24px;
            font-weight: 800;
            color: #15803d;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PAWIN TECH</h1>
        </div>
        <div class="content">
            <h2>ใบเสนอราคา / Quotation Notification</h2>
            <p>เรียนคุณ <strong>${userName || "ลูกค้า"}</strong>,</p>
            <p>ขณะนี้แอดมินได้ตรวจสอบรายการสั่งผลิต PCB ของคุณแล้ว และได้แจ้งราคาประเมินเบื้องต้นตามรายละเอียดด้านล่างนี้:</p>
            
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">เลขที่ใบเสนอราคา:</span>
                    <span class="info-value">${quotationNo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">วันที่:</span>
                    <span class="info-value">${new Date().toLocaleDateString('th-TH')}</span>
                </div>
            </div>

            <div class="price-box">
                <div class="price-label">ยอดรวมสุทธิ (GRAND TOTAL)</div>
                <div class="price-value">${Number(grandTotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
            </div>

            <p>ท่านสามารถเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดเพิ่มเติมและดำเนินการชำระเงินเพื่อยืนยันการผลิตได้ที่เว็บไซต์ของเรา</p>
            
            <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
                <strong>ข้อมูลการชำระเงิน:</strong><br>
                ธนาคาร: ${bankInfo?.name || "ธนาคารกสิกรไทย"}<br>
                ชื่อบัญชี: ${bankInfo?.accountName || "บริษัท ภาวินท์เทคโนโลยี จำกัด"}<br>
                เลขที่บัญชี: ${bankInfo?.accountNumber || "123-4-56789-0"}
            </p>
        </div>
        <div class="footer">
            <p>© 2025 ${companyName || "Pawin Technology Co., Ltd."}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    resetPasswordTemplate,
    quotationEmailTemplate,
};
