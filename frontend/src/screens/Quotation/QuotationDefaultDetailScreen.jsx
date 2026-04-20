import React from "react";
import { format, isValid } from "date-fns";

const QuotationA4 = ({ order, companyInfo, printMode }) => {
  // 1. ตั้งค่า Default ฟอร์มเปล่า
  const defaultOrder = {
    id: "",
    paymentComfirmID: "",
    createdAt: new Date(),
    billingAddress: {
      billingName: "",
      billinggAddress: "",
      billingCity: "",
      billingPostalCode: "",
      tax: "",
      branch: ""
    },
    items: [],
    itemsPrice: 0,
    vatPrice: 0,
    totalPrice: 0
  };

  const currentOrder = order || defaultOrder;
  const items = currentOrder.items || currentOrder.orderItems || [];

  // 2. กำหนดหน้าเอกสารเป็นใบเสนอราคา (หน้าเดียว)
  const invoicePages = [
    {
      titleTH: "ใบเสนอราคา",
      titleEN: "QUOTATION",
      recipient: "สำหรับลูกค้า",
      docSet: "ต้นฉบับ",
      colorBg: "bg-[#5F9EA0]" // สี CadetBlue ตามที่ต้องการ
    }
  ];

  const formatDateThai = (dateString) => {
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
    const day = format(date, "dd");
    const month = format(date, "MM");
    const year = (parseInt(format(date, "yy")) + 43).toString().padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  const thaiBahtText = (price) => {
    if (!price || isNaN(price) || price === 0) return "-";
    const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const numbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];

    const s = parseFloat(price).toFixed(2).split(".");
    let integer = s[0];
    const dec = parseInt(s[1]);

    const convert = (s) => {
      let res = "";
      for (let i = 0; i < s.length; i++) {
        const digit = parseInt(s[i]);
        const pos = s.length - i - 1;
        if (digit !== 0) {
          if (pos === 1 && digit === 1) res += "";
          else if (pos === 1 && digit === 2) res += "ยี่";
          else if (pos === 0 && digit === 1 && s.length > 1) res += "เอ็ด";
          else res += numbers[digit];
          res += units[pos];
        }
      }
      return res;
    };

    let result = convert(integer) + "บาท";
    if (dec === 0) result += "ถ้วน";
    else result += convert(dec) + "สตางค์";
    return result;
  };

  const totalBeforeVat = currentOrder.itemsPrice || 0;
  const vat = currentOrder.vatPrice || 0;
  const grandTotal = currentOrder.totalPrice || 0;

  const companyNameTH = companyInfo?.nameTH || "บริษัท ภาวินท์เทคโนโลยี จำกัด";
  const companyNameEN = companyInfo?.nameEN || "PAWINTECHNOLOGY CO., LTD.";
  const companyAddressTH = companyInfo?.addressTH || "สำนักงานใหญ่ : 124 ซอยร่มเกล้า 24 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510";
  const companyAddressEN = companyInfo?.addressEN || "Head Office : 124 Soi Rom Klao 24, Min Buri, Min Buri, Bangkok, 10510";
  const companyPhone = companyInfo?.phone || "099-226-3277";
  const companyEmail = companyInfo?.email || "contact@pawin-tech.com";
  const companyTaxId = companyInfo?.taxId || "0105562141221";

  return (
    <div className={`print-area ${printMode === "full" ? "print-block" : "hidden"}`}>
      {invoicePages.map((pageDef, pageIndex) => (
        <div key={pageIndex} className="break-after-page font-prompt text-black p-[15mm] bg-white w-[210mm] h-[297mm] box-border overflow-hidden mx-auto text-[11px] leading-tight shadow-none border-none relative">

          <div className="absolute top-[15mm] right-[15mm] text-right">
            <p className="text-[14px] font-bold m-0 leading-tight">{pageDef.recipient}</p>
            <p className="text-[11px] m-0 leading-tight">{pageDef.docSet}</p>
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-[200px]">
              <img src="/image/Pawin_Logo_long.png" alt="PAWIN Logo" className="w-full object-contain" />
            </div>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-[18px] font-bold">{companyNameTH}</h1>
            <h1 className="text-[18px] font-bold mb-1">{companyNameEN}</h1>
            <p className="text-[11px]">{companyAddressTH}</p>
            <p className="text-[11px]">{companyAddressEN}</p>
            <p className="text-[11px] mt-1 flex justify-center gap-4 font-bold">
              <span>โทร. {companyPhone}</span>
              <span>Email: {companyEmail}</span>
              <span>เลขประจำตัวผู้เสียภาษี {companyTaxId}</span>
            </p>
          </div>

          <div className="text-center mb-4 mt-2">
            <h2 className="text-[16px] font-bold m-0">{pageDef.titleTH}</h2>
            <h3 className="text-[12px] font-bold m-0">{pageDef.titleEN}</h3>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2">
            <div className="col-span-8 space-y-2">
              <p className="flex"><span className="shrink-0 mr-2">นามลูกค้า</span> <span className="text-blue-600 font-bold border-b border-dotted border-gray-400 flex-1">{currentOrder.billingAddress?.billingName || "................................................................................................"}</span></p>
              <p className="flex"><span className="shrink-0 mr-2">ที่อยู่</span> <span className="text-blue-600 leading-tight flex-1 border-b border-dotted border-gray-400">{currentOrder.billingAddress?.billinggAddress || "......................................................................................................................."} {currentOrder.billingAddress?.billingCity || ""} {currentOrder.billingAddress?.billingPostalCode || ""}</span></p>
            </div>
            <div className="col-span-4 pl-4">
              <div className="space-y-2">
                <p className="flex justify-between items-end border-b border-dotted border-black">
                  <span>เลขที่ / No.</span>
                  <span className="text-blue-600 font-bold">{currentOrder.paymentComfirmID || currentOrder.id || ".............................."}</span>
                </p>
                <p className="flex justify-between items-end border-b border-dotted border-black">
                  <span>วันที่ / Date</span>
                  <span className="text-blue-600 font-bold">{currentOrder.id ? formatDateThai(currentOrder.createdAt) : "......../......../........"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <p className="flex items-center flex-1"><span className="shrink-0 mr-2">เลขประจำตัวผู้เสียภาษี</span> <span className="text-blue-600 font-bold tracking-widest border-b border-dotted border-gray-400 flex-1">{currentOrder.billingAddress?.tax || ".................................................."}</span></p>
            <div className="flex items-center gap-4 translate-y-[6px]">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 border border-black flex items-center justify-center font-bold text-[10px]">{currentOrder.billingAddress?.branch === "สำนักงานใหญ่" || (!currentOrder.billingAddress?.branch && currentOrder.id) ? "X" : ""}</span>
                <span>สำนักงานใหญ่</span>
              </div>
              <div className="flex items-end">
                <span className="w-4 h-4 border border-black flex items-center justify-center font-bold text-[10px] mr-1 mb-[1px]">{currentOrder.billingAddress?.branch && currentOrder.billingAddress?.branch !== "สำนักงานใหญ่" ? "X" : ""}</span>
                <span>สาขาที่</span>
                <span className="w-12 border-b border-dotted border-black text-center text-blue-600 ml-1 leading-none pb-[1px]">{currentOrder.billingAddress?.branch && currentOrder.billingAddress?.branch !== "สำนักงานใหญ่" ? currentOrder.billingAddress.branch : ""}</span>
              </div>
            </div>
          </div>

          <div className="mb-0 overflow-hidden border border-black h-[360px] flex flex-col">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${pageDef.colorBg} text-white text-[10px] font-bold`}>
                  <th className="py-2 px-1 border-r border-black w-10 text-center">ลำดับ</th>
                  <th className="py-2 px-1 border-r border-black w-24 text-center">รหัสสินค้า</th>
                  <th className="py-2 px-2 border-r border-black text-center">รายละเอียด</th>
                  <th className="py-2 px-1 border-r border-black w-16 text-center">จำนวน</th>
                  <th className="py-2 px-1 border-r border-black w-14 text-center">หน่วย</th>
                  <th className="py-2 px-1 border-r border-black w-24 text-center">ราคา/หน่วย</th>
                  <th className="py-2 px-2 text-center w-28">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="text-[10px]">
                {items.map((item, index) => (
                  <tr key={index} className="h-7 border-b border-gray-200">
                    <td className="px-1 border-r border-black text-center">{index + 1}</td>
                    <td className="px-1 border-r border-black text-center">{item.product_id || "-"}</td>
                    <td className="px-2 border-r border-black">{item.name}</td>
                    <td className="px-1 border-r border-black text-center">{item.qty?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-1 border-r border-black text-center">pcs</td>
                    <td className="px-1 border-r border-black text-right">{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-2 text-right border-l border-black">{(item.qty * item.price)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {[...Array(Math.max(0, 15 - items.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-7 border-b border-gray-100 last:border-0 grow">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-l border-black"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-12 border border-black border-t-0">
            <div className="col-span-7 p-3 border-r border-black flex flex-col justify-between bg-white">
              <div>
                <div className="flex gap-2 items-start mb-4">
                  <span className="font-bold shrink-0 mr-2">ตัวอักษร:</span>
                  <span className="text-blue-600 font-bold border-b border-dotted border-gray-400 flex-1 text-center">
                    {grandTotal > 0 ? `(${thaiBahtText(grandTotal)})` : ""}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-[9px]">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 border border-black flex items-center justify-center text-[8px]"></span>
                      <span>เงินสด</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-3 h-3 border border-black flex items-center justify-center text-[8px]"></span>
                      <span>เช็คธนาคาร</span>
                      <span className="border-b border-dotted border-black flex-1"></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-3 h-3 border border-black flex items-center justify-center text-[8px]"></span>
                      <span>เงินโอนวันที่</span>
                      <span className="border-b border-dotted border-black flex-1 text-center text-blue-600"></span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span>เลขที่</span>
                      <span className="border-b border-dotted border-black flex-1"></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>จำนวนเงิน</span>
                    <span className="border-b border-dotted border-black w-24 text-center text-blue-600 font-bold">
                      {grandTotal > 0 ? grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                    </span>
                    <span>บาท</span>
                    <span className="ml-4 italic opacity-70">(BAHT)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-5 text-[10px]">
              <div className="flex justify-between border-b border-black p-2 h-9 items-center">
                <span className="font-bold leading-tight">มูลค่าสินค้าก่อนหักมัดจำ<br /><span className="text-[8px] opacity-70">TOTAL AMOUNT BEFORE DEPOSIT</span></span>
                <span className="text-right font-bold text-blue-600">{totalBeforeVat > 0 ? totalBeforeVat.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</span>
              </div>
              <div className="flex justify-between border-b border-black p-2 h-10 items-center leading-tight">
                <span className="font-bold">หัก มัดจำ / DEPOSIT</span>
                <span className="text-right font-bold text-blue-600">{totalBeforeVat > 0 ? "0.00" : ""}</span>
              </div>
              <div className="flex justify-between border-b border-black p-2 h-9 items-center bg-gray-50/50">
                <span className="font-bold leading-tight">รวมมูลค่าสินค้า<br /><span className="text-[8px] opacity-70">TOTAL</span></span>
                <span className="text-right font-bold text-blue-600">{totalBeforeVat > 0 ? totalBeforeVat.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</span>
              </div>
              <div className="flex justify-between border-b border-black p-2 h-10 items-center leading-tight">
                <span className="font-bold">ภาษีมูลค่าเพิ่ม / VAT 7%</span>
                <span className="text-right font-bold text-blue-600">{vat > 0 ? vat.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#5F9EA0]/10 h-10 items-center">
                <span className="font-black text-[12px] leading-tight">ยอดรวมสุทธิ<br /><span className="text-[9px] opacity-70">GRAND TOTAL</span></span>
                <span className="text-right font-black text-[15px] text-teal-800">{grandTotal > 0 ? grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</span>
              </div>
            </div>
          </div>

          {/* เปลี่ยนข้อความเงื่อนไขด้านล่างให้เหมาะกับใบเสนอราคา */}
          <div className="flex justify-between text-[8px] mt-2 italic px-2 opacity-60">
            <span>กำหนดยืนราคา 30 วัน นับจากวันที่เสนอราคา</span>
            <span>การสั่งซื้อจะสมบูรณ์เมื่อลูกค้าได้ลงนามยืนยันการสั่งซื้อ</span>
          </div>

          <div className="grid grid-cols-4 mt-4 h-24 text-[9px] gap-0">
            <div className="border border-black flex flex-col justify-end items-center pb-2 text-center">
              <div className="w-[85%] border-t border-dotted border-black pt-1">
                <p className="font-bold leading-tight m-0 text-[10px]">ผู้เสนอราคา<br />Prepared by</p>
              </div>
              <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
            </div>
            <div className="border-y border-r border-black flex flex-col justify-end items-center pb-2 text-center">
              <div className="w-[85%] border-t border-dotted border-black pt-1">
                <p className="font-bold leading-tight m-0 text-[10px]">ผู้ตรวจสอบ<br />Checked by</p>
              </div>
              <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
            </div>
            <div className="border-y border-r border-black flex flex-col justify-start items-center pb-2 text-center pt-2">
              <p className="leading-tight m-0 font-black text-[10px] uppercase px-1">ในนาม {companyNameEN}</p>
              <div className="w-[85%] border-t border-dotted border-black pt-1 mt-auto">
                <p className="font-bold m-0 text-[10px] leading-tight">ผู้มีอำนาจลงนาม<br />Authorized Signature</p>
              </div>
            </div>
            <div className="border-y border-r border-black flex flex-col justify-end items-center pb-2 text-center">
              <div className="w-[85%] border-t border-dotted border-black pt-1">
                <p className="font-bold leading-tight m-0 text-[10px]">ลูกค้ายืนยันการสั่งซื้อ<br />Accepted by</p>
              </div>
              <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
            </div>
          </div>
        </div>
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                        background: white;
                    }

                    body *:not(:has(.print-area)):not(.print-area):not(.print-area *) {
                        display: none !important;
                    }

                    body *:has(.print-area) {
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        position: static !important;
                        border: none !important;
                    }

                    .print-area {
                        display: block !important;
                        width: 100%;
                    }

                    .break-after-page {
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-after: page;
                        break-inside: avoid;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                    }

                    .break-after-page:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }
                }
                .font-prompt { font-family: 'Prompt', sans-serif; }
            ` }} />
    </div>
  );
};

export default QuotationA4;
