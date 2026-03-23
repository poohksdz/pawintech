// import React, { useRef } from "react"; 
// import { useSelector } from 'react-redux';
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import { useGetDefaultInvoiceDetailsQuery } from '../../slices/defaultInvoicesApiSlice';
// import { useGetInvoicesByInvoiceIdQuery } from '../../slices/invoicesApiSlice';

// const InvoiceDetailScreen = () => {
//   const componentRef = useRef(); 
//   const invoiceId = 1;
//   const { data: defaultData, isLoading: defaultLoading, error: defaultError } = useGetDefaultInvoiceDetailsQuery(1);
//   const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useGetInvoicesByInvoiceIdQuery(invoiceId);

//   if (defaultLoading || invoicesLoading) return <p>Loading...</p>;
//   if (defaultError) return <p>Error loading company info</p>;
//   if (invoicesError) return <p>Error loading invoice products</p>;

//   if (!defaultData || !invoicesData || invoicesData.length === 0) return <p>No data found</p>;

//   const handleGeneratePDF = async () => {
//     const canvas = await html2canvas(componentRef.current, { scale: 2 });
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
//     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//     window.open(pdf.output("bloburl"));
//   };

//   const company = defaultData; // company info
//   const products = invoicesData; // all products

//   // console.log(company)
//   // console.log(products)

//   // Calculate totals
// const subTotal = products.reduce((acc, p) => acc + parseFloat(p.unit_total), 0);
// const totalDiscount = products.reduce((acc, p) => acc + parseFloat(p.discount), 0);
// const totalAfterDiscount = products.reduce((acc, p) => acc + parseFloat(p.total_after_discount), 0);
// const totalVat = products.reduce((acc, p) => acc + parseFloat(p.vat), 0);
// const grandTotal = products.reduce((acc, p) => acc + parseFloat(p.grand_total), 0);

//   return (
//     <>
//       {/* Top Button */}
//       <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 32px" }}>
//         <button onClick={handleGeneratePDF} className="btn btn-primary">Generate PDF</button>
//       </div>

//       <div style={{ display: "flex", justifyContent: "center", width: "100%", backgroundColor: "#f0f0f0", padding: "20px 0" }}>
//         <div
//           ref={componentRef}
//           style={{
//             width: "210mm",
//             minHeight: "297mm",
//             padding: "20mm",
//             boxSizing: "border-box",
//             display: "flex",
//             flexDirection: "column",
//             fontSize: "12px",
//             backgroundColor: "#fff",
//             border: "1px solid #ccc",
//             boxShadow: "0px 0px 10px rgba(0,0,0,0.1)"
//           }}
//         >
//           {/* Header */}
//           <div className="text-center mb-4">
//             <h3 className="fw-bold">{company.company_name_thai} <br /> {company.company_name}</h3>
//             <p>
//               สำนักงานใหญ่: {company.head_office_thai} <br />
//               Head Office: {company.head_office} <br />
//               โทร: {company.tel} | Email: {company.email} <br />
//               เลขประจำตัวผู้เสียภาษี: {company.tax_id}
//             </p>
//             <h5 className="border p-2 d-inline-block mt-1">
//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 <span>ใบเสนอราคา</span>
//                 <span>QUOTATION</span>
//               </div>
//             </h5>
//           </div>

//           {/* Customer Info */}
//           <div className="d-flex justify-content-between mb-2" style={{ width: "100%" }}>
//             <div>
//               <p>
//                 <strong>ผู้ติดต่อ:</strong> บริษัท เป็ปเป้ เอ็นจิเนียริ่ง จำกัด <br />
//                 <strong>ที่อยู่:</strong> 27/149 ม.5 ต.บางละมุง อ.บางละมุง จ.ชลบุรี 20160
//               </p>
//             </div>
//             <div>
//               <p>
//               <strong>เลขที่:</strong> {" "} <br />
//               <strong>วันที่:</strong>{" "} <br /> 
//               <strong>ยืนราคาภายใน:</strong>  <br />
//               <strong>จำนวนวันเคดิต:</strong>   <br /> 
//               </p>
//             </div>
//           </div>

//           {/* Products Table */}
//           <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1fr 3fr 0.8fr 0.6fr 1.3fr 1.3fr", border: "1px solid #dee2e6", width: "100%", maxWidth: "180mm" }}>
//             {/* Table Header */}
//             {["ลำดับ", "รหัสสินค้า", "รายละเอียด", "จำนวน", "หน่วย", "ราคาต่อหน่วย", "จำนวนเงิน"].map((header, i) => (
//               <div key={i} style={{ textAlign: "center", padding: "8px", fontWeight: "bold", borderRight: i === 6 ? "none" : "1px solid #dee2e6" }}>{header}</div>
//             ))}

//             {/* Product Rows */}
//             {products.map((prod, index) => (
//               <React.Fragment key={prod.id}>
//                 <div style={{ gridColumn: "1", textAlign: "center", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{index + 1}</div>
//                 <div style={{ gridColumn: "2", textAlign: "center", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{prod.product_id}</div>
//                 <div style={{ gridColumn: "3", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{prod.description}</div>
//                 <div style={{ gridColumn: "4", textAlign: "center", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{prod.qty}</div>
//                 <div style={{ gridColumn: "5", textAlign: "center", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{prod.unit}</div>
//                 <div style={{ gridColumn: "6", textAlign: "right", borderTop: "1px solid #dee2e6", borderRight: "1px solid #dee2e6", padding: "8px" }}>{parseFloat(prod.unit_price).toFixed(2)}</div>
//                 <div style={{ gridColumn: "7", textAlign: "right", borderTop: "1px solid #dee2e6", padding: "8px" }}>{parseFloat(prod.unit_total).toFixed(2)}</div>
//               </React.Fragment>
//             ))}

//               {/* Summary Rows */}
//              {[
//   [
//     "ตัวอักษร (หนึ่งหมื่นห้าพันเก้าร้อยสี่สิบสามบาทถ้วน)",
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>ส่วนลด</span>
//         <span style={{ fontSize: "10px" }}>DISCOUNT {company.discount} % </span>
//       </div>
//     ),
//     totalDiscount,
//   ],
//   [
//     "",
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>มูลค่าสินค้าหลังหักส่วนลด</span>
//         <span style={{ fontSize: "10px" }}>TOTAL AMOUNT AFTER DISCOUNT</span>
//       </div>
//     ),
//     totalAfterDiscount,
//   ],
//   [
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>ธนาคารกรุงไทย เลขที่บัญชี 082-0-74742-4</span>
//         <span>ชื่อบัญชี บริษัทอิเล็กโตทรอนิกซ์จำกัด</span>
//       </div>
//     ),
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>รวมมูลค่าสินค้า</span>
//         <span style={{ fontSize: "10px" }}>TOTAL</span>
//       </div>
//     ),
//     subTotal,
//   ],
//   [
//     "",
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>ภาษีมูลค่าเพิ่ม</span>
//         <span style={{ fontSize: "10px" }}>VAT {company.vat} %</span>
//       </div>
//     ),
//     totalVat,
//   ],
//   [
//     "",
//     (
//       <div style={{ display: "flex", flexDirection: "column" }}>
//         <span>ยอดรวมสุทธิ</span>
//         <span style={{ fontSize: "10px" }}>GRAND TOTAL</span>
//       </div>
//     ),
//     grandTotal,
//   ],
// ].map(([leftLabel, summaryLabel, value], i, arr) => (
//   <React.Fragment key={i}>
//     <div
//       style={{
//         gridColumn: "1 / span 4",
//         textAlign: "center",
//         padding: "8px",
//         borderTop: i === 0 ? "1px solid #dee2e6" : "none",
//         borderRight: "1px solid #dee2e6",
//         fontWeight: "bold",
//       }}
//     >
//       {leftLabel}
//     </div>
//     <div
//       style={{
//         gridColumn: "5 / span 2",
//         textAlign: "left",
//         borderTop: "1px solid #dee2e6",
//         borderRight: "1px solid #dee2e6",
//         padding: "8px",
//         fontWeight: "bold",
//       }}
//     >
//       {summaryLabel}
//     </div>
//     <div
//       style={{
//         gridColumn: "7",
//         textAlign: "right",
//         borderTop: "1px solid #dee2e6",
//         padding: "8px",
//         fontWeight: i === arr.length - 1 ? "bold" : "normal",
//       }}
//     >
//       {parseFloat(value).toFixed(2)}
//     </div>
//   </React.Fragment>
// ))}

//           </div>

//           {/* Footer / Signatures */}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", width: "100%", marginTop: "32px", textAlign: "center" }}>
//             {["ผู้ขอซื้อ", "ผู้เสนอราคา", "ผู้จัดการฝ่ายขาย"].map((label, i) => (
//               <div key={i} style={{ border: "1px solid #dee2e6", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
//                 <p>{label} ________________________</p>
//                 <p>ลงวันที่ ________________________</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Bottom Button */}
//       <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 32px" }}>
//         <button onClick={handleGeneratePDF} className="btn btn-primary">Generate PDF</button>
//       </div>
//     </>
//   );
// };

// export default InvoiceDetailScreen;


import React from 'react'
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const InvoiceDetailScreen = () => {
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: '🚧 This feature is still under construction.',
      quote: '"We’re building this shared journey — thanks for your patience!"',
    },
    thai: {
      title: '🚧 ฟีเจอร์นี้ยังอยู่ระหว่างการพัฒนา',
      quote: '"เรากำลังสร้างฟีเจอร์นี้เพื่อการใช้งานร่วมกัน ขอบคุณที่รอคอย!"',
    },
  };

  const t = translations[language] || translations.en;
  
    return (
      <Container
        className="d-flex justify-content-center align-items-center text-center"
        style={{ height: '80vh' }}
      >
        <div>
          <h4 className="text-secondary">{t.title}</h4>
          <p className="text-muted mt-3">{t.quote}</p>
        </div>
      </Container>
    );
  };

export default InvoiceDetailScreen