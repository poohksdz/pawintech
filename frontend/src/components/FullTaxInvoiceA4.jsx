import { format, isValid } from "date-fns";

const FullTaxInvoiceA4 = ({ order, companyInfo, printMode, isQuotation = false, isAdmin = false, docType, slotSignatures }) => {
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
        orderItems: [],
        itemsPrice: 0,
        vatPrice: 0,
        totalPrice: 0,
        status: ""
    };

    const currentOrder = order || defaultOrder;
    const items = currentOrder.orderItems || currentOrder.items || [];
    const status = currentOrder.status || "";

    const billing = (() => {
      if (currentOrder.billingAddress) {
        return {
          billingName: currentOrder.billingAddress.billingName || "",
          billinggAddress: currentOrder.billingAddress.billinggAddress || currentOrder.billingAddress.billingAddress || "",
          billingCity: currentOrder.billingAddress.billingCity || "",
          billingPostalCode: currentOrder.billingAddress.billingPostalCode || "",
          tax: currentOrder.billingAddress.tax || currentOrder.billingAddress.billingTax || "",
          branch: currentOrder.billingAddress.branch || "",
        };
      }
      return {
        billingName: currentOrder.billingName || "",
        billinggAddress: currentOrder.billinggAddress || currentOrder.billingAddress || "",
        billingCity: currentOrder.billingCity || "",
        billingPostalCode: currentOrder.billingPostalCode || "",
        tax: currentOrder.billingTax || "",
        branch: currentOrder.billingBranch || "",
      };
    })();

    const isPaid = currentOrder.isPaid === 1 || currentOrder.isPaid === true || currentOrder.status?.toLowerCase() === "paid";

    let effectiveDocType = docType;
    if (!effectiveDocType) {
        if (isQuotation || status.toLowerCase() === "quoted") {
            effectiveDocType = "quotation";
        } else if (isPaid) {
            effectiveDocType = "taxinvoice";
        } else {
            effectiveDocType = "proforma";
        }
    }

    const piTitleTH = "ใบแจ้งหนี้ / ใบวางบิล";
    const piTitleEN = "PROFORMA INVOICE / BILLING NOTE";
    const tiTitleTH = "ใบกำกับภาษี / ใบส่งของ";
    const tiTitleEN = "TAX INVOICE / DELIVERY INVOICE";
    const rcTitleTH = "ใบเสร็จรับเงิน";
    const rcTitleEN = "RECEIPT";
    const qtTitleTH = "ใบเสนอราคา";
    const qtTitleEN = "QUOTATION";

    let invoicePages = [];

    if (effectiveDocType === "quotation") {
        invoicePages = [{
            titleTH: qtTitleTH, titleEN: qtTitleEN,
            recipient: "สำหรับลูกค้า", docSet: "ต้นฉบับ",
            colorBg: "bg-[#5F9EA0]", type: "quotation"
        }];
    } else if (effectiveDocType === "proforma") {
        invoicePages = [{
            titleTH: piTitleTH, titleEN: piTitleEN,
            recipient: "สำหรับลูกค้า", docSet: "ต้นฉบับ",
            colorBg: "bg-[#5F9EA0]", type: "proforma"
        }];
    } else {
        invoicePages = [
            { titleTH: `ต้นฉบับ${tiTitleTH}`, titleEN: `ORIGINAL ${tiTitleEN}`, recipient: "สำหรับลูกค้า", docSet: "เอกสารออกเป็นชุด", colorBg: "bg-[#5F9EA0]", type: "taxinvoice" },
            { titleTH: `สำเนา${tiTitleTH}`, titleEN: `COPY ${tiTitleEN}`, recipient: "สำหรับบัญชี", docSet: "เอกสารออกเป็นชุด", colorBg: "bg-red-600", type: "taxinvoice" },
            { titleTH: `ต้นฉบับ${rcTitleTH}`, titleEN: `ORIGINAL ${rcTitleEN}`, recipient: "สำหรับลูกค้า", docSet: "เอกสารออกเป็นชุด", colorBg: "bg-orange-500", type: "receipt" },
            { titleTH: `สำเนา${rcTitleTH}`, titleEN: `COPY ${rcTitleEN}`, recipient: "สำหรับลูกค้า", docSet: "เอกสารออกเป็นชุด", colorBg: "bg-green-600", type: "receipt" },
            { titleTH: piTitleTH, titleEN: piTitleEN, recipient: "สำหรับลูกค้า", docSet: "ต้นฉบับ", colorBg: "bg-[#8B0000]", type: "proforma" },
        ];
    }

    const formatDateThai = (dateString) => {
        const date = dateString ? new Date(dateString) : new Date();
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

        const convert = (str) => {
            let res = "";
            for (let i = 0; i < str.length; i++) {
                const digit = parseInt(str[i]);
                const pos = str.length - i - 1;
                if (digit !== 0) {
                    if (pos === 1 && digit === 1) res += "";
                    else if (pos === 1 && digit === 2) res += "ยี่";
                    else if (pos === 0 && digit === 1 && str.length > 1) res += "เอ็ด";
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

    const companyNameTH = companyInfo?.company_name_thai || companyInfo?.nameTH || "บริษัท ภาวินท์เทคโนโลยี จำกัด";
    const companyNameEN = companyInfo?.company_name || companyInfo?.nameEN || "PAWINTECHNOLOGY CO., LTD.";
    const companyAddressTH = companyInfo?.head_office_thai || companyInfo?.addressTH || "สำนักงานใหญ่ : 124 ซอยร่มเกล้า 24 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510";
    const companyAddressEN = companyInfo?.head_office || companyInfo?.addressEN || "Head Office : 124 Soi Rom Klao 24, Min Buri, Min Buri, Bangkok, 10510";
    const companyPhone = companyInfo?.tel || companyInfo?.phone || "099-226-3277";
    const companyEmail = companyInfo?.email || "contact@pawin-tech.com";
    const companyTaxId = companyInfo?.tax_id || companyInfo?.taxId || "0105562141221";
    const companyLogo = companyInfo?.logo || "/image/Pawin_Logo_long.png";

    return (
        <div className={`${printMode === "full" ? "print-area print-block" : printMode === "short" ? "print-area print-block" : "no-print block"}`}>
            {invoicePages.map((pageDef, pageIndex) => (
                <div key={pageIndex} className={`${pageIndex === invoicePages.length - 1 ? "last-print-page" : "break-after-page"} font-prompt text-black p-[10mm] bg-white w-[210mm] min-h-[296mm] h-[296mm] box-border overflow-hidden mx-auto text-[11px] leading-tight shadow-none border-none relative print:m-0 print:p-[10mm]`}>

                    {(effectiveDocType === "taxinvoice" || pageDef.docSet !== "ต้นฉบับ") && (
                        <div className="absolute top-[10mm] right-[10mm] text-right">
                            <p className="text-[12px] font-bold m-0 leading-tight">{pageDef.recipient}</p>
                            <p className="text-[10px] m-0 leading-tight">{pageDef.docSet}</p>
                        </div>
                    )}

                    <div className="flex justify-center mb-4">
                        <div className="w-[200px]">
                            <img src={companyLogo} alt="Logo" className="w-full object-contain" />
                        </div>
                    </div>

                    <div className="text-center mb-2">
                        <h1 className="text-[16px] font-bold">{companyNameTH}</h1>
                        <h1 className="text-[16px] font-bold mb-1">{companyNameEN}</h1>
                        <p className="text-[10px] m-0">{companyAddressTH}</p>
                        <p className="text-[10px] m-0">{companyAddressEN}</p>
                        <p className="text-[10px] mt-1 flex justify-center gap-4 font-bold">
                            <span>โทร. {companyPhone}</span>
                            <span>Email: {companyEmail}</span>
                            <span>เลขประจำตัวผู้เสียภาษี {companyTaxId}</span>
                        </p>
                    </div>

                    <div className="text-center mb-2 mt-1">
                        <h2 className="text-[14px] font-bold m-0">{pageDef.titleTH}</h2>
                        <h3 className="text-[11px] font-bold m-0">{pageDef.titleEN}</h3>
                    </div>

                    <div className="grid grid-cols-12 gap-4 mb-4 items-start">
                        <div className="col-span-8 space-y-4">
                            <div className="flex items-start">
                                <span className="shrink-0 w-[80px] font-bold text-gray-500 uppercase tracking-tighter">นามลูกค้า</span>
                                <div className="flex-1 border-b border-dotted border-gray-400 pb-1">
                                    <span className="text-blue-600 font-black text-[13px]">{billing.billingName || "\u00A0"}</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="shrink-0 w-[80px] font-bold text-gray-500 uppercase tracking-tighter">ที่อยู่</span>
                                <div className="flex-1 border-b border-dotted border-gray-400 pb-1">
                                    <span className="text-blue-600 font-bold leading-relaxed">
                                        {billing.billinggAddress || "\u00A0"}{" "}
                                        {billing.billingCity || ""}{" "}
                                        {billing.billingPostalCode || ""}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center flex-1">
                                    <span className="shrink-0 mr-3 font-bold text-gray-500 uppercase tracking-tighter">เลขประจำตัวผู้เสียภาษี</span>
                                    <div className="flex-1 border-b border-dotted border-gray-400 pb-1 flex justify-center">
                                        <span className="text-blue-600 font-black tracking-[0.2em]">{billing.tax || "\u00A0"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black flex items-center justify-center rounded-sm bg-transparent">
                                            {(billing.branch === "สำนักงานใหญ่" || (!billing.branch && currentOrder.id)) && <span className="text-black text-[14px] font-black leading-none -mt-[2px] ml-[1px]">✓</span>}
                                        </div>
                                        <span className="font-bold text-[10px]">สำนักงานใหญ่</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black flex items-center justify-center rounded-sm bg-transparent">
                                            {billing.branch && billing.branch !== "สำนักงานใหญ่" && <span className="text-black text-[14px] font-black leading-none -mt-[2px] ml-[1px]">✓</span>}
                                        </div>
                                        <span className="font-bold text-[10px]">สาขาที่</span>
                                        <span className="min-w-[40px] border-b border-black text-center text-blue-600 font-black ml-1 leading-none">{billing.branch && billing.branch !== "สำนักงานใหญ่" ? billing.branch : "...."}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-4 pl-6 border-l border-gray-100 space-y-4">
                            <div className="space-y-3">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">เลขที่ / No.</span>
                                    <div className="border-b-2 border-black pb-1">
                                        <span className="text-blue-600 font-black text-sm tracking-tight">{currentOrder.paymentComfirmID || currentOrder.id || "\u00A0"}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">วันที่ / Date</span>
                                    <div className="border-b-2 border-black pb-1">
                                        <span className="text-blue-600 font-black text-sm tracking-tight">{currentOrder.id ? formatDateThai(currentOrder.createdAt) : "\u00A0"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-0 overflow-hidden border border-black h-[290px] flex flex-col">
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
                            <div className="flex justify-between p-2 bg-[#00A651]/5 h-10 items-center">
                                <span className="font-black text-[12px] leading-tight">ยอดรวมสุทธิ<br /><span className="text-[9px] opacity-70">GRAND TOTAL</span></span>
                                <span className="text-right font-black text-[15px] text-emerald-700">{grandTotal > 0 ? grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between text-[8px] mt-2 italic px-2 opacity-60">
                        <span>กรณีชำระด้วยเช็ค ใบเสร็จรับเงินนี้จะสมบูรณ์ต่อเมื่อบริษัทฯ ได้รับเงินแล้วเท่านั้น</span>
                        <span>ใบเสร็จรับเงินนี้จะสมบูรณ์ต่อเมื่อบริษัทฯ ได้รับเงินครบถ้วนแล้ว</span>
                    </div>

                    {pageDef.type === "quotation" ? (
                        <div className="grid grid-cols-3 mt-4 h-32 text-[9px] gap-4">
                            <div className="border border-black flex flex-col items-center p-2 relative h-full">
                                <p className="font-bold mb-1">ผู้สั่งซื้อ / Buyer Approves</p>
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.quoBuyer ? (
                                        <img src={slotSignatures.quoBuyer} alt="Buyer Signature" className="max-h-16 object-contain" />
                                    ) : currentOrder.signatures?.buyer ? (
                                        <img src={currentOrder.signatures.buyer} alt="Buyer Signature" className="max-h-16 object-contain" />
                                    ) : (
                                        <div className="h-10"></div>
                                    )}
                                </div>
                                <div className="w-[90%] border-t border-dotted border-black pt-1 text-center mt-2">
                                    <p>(...........................................................)</p>
                                    <p>วันที่ / Date {currentOrder.signatures?.buyerDate || "......../......../........"}</p>
                                </div>
                            </div>
                            <div className="border border-black flex flex-col items-center p-2 relative h-full">
                                <p className="font-bold mb-1">ผู้เสนอราคา / Sales Person</p>
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.quoSales ? (
                                        <img src={slotSignatures.quoSales} alt="Sales Signature" className="max-h-16 object-contain" />
                                    ) : currentOrder.signatures?.sales ? (
                                        <img src={currentOrder.signatures.sales} alt="Sales Signature" className="max-h-16 object-contain" />
                                    ) : (
                                        <div className="h-10"></div>
                                    )}
                                </div>
                                <div className="w-[90%] border-t border-dotted border-black pt-1 text-center mt-2">
                                    <p>(...........................................................)</p>
                                    <p>วันที่ / Date {currentOrder.signatures?.salesDate ? formatDateThai(currentOrder.signatures.salesDate) : "......../......../........"}</p>
                                </div>
                            </div>
                            <div className="border border-black flex flex-col items-center p-2 relative h-full">
                                <p className="font-bold mb-1">ผู้อนุมัติ / Sales Manager</p>
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.quoManager ? (
                                        <img src={slotSignatures.quoManager} alt="Manager Signature" className="max-h-16 object-contain" />
                                    ) : currentOrder.signatures?.manager ? (
                                        <img src={currentOrder.signatures.manager} alt="Manager Signature" className="max-h-16 object-contain" />
                                    ) : (
                                        <div className="h-10"></div>
                                    )}
                                </div>
                                <div className="w-[90%] border-t border-dotted border-black pt-1 text-center mt-2">
                                    <p>(...........................................................)</p>
                                    <p>วันที่ / Date {currentOrder.signatures?.managerDate ? formatDateThai(currentOrder.signatures.managerDate) : "......../......../........"}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 mt-4 h-24 text-[9px] gap-0">
                            <div className="border border-black flex flex-col items-center p-2 text-center relative h-full">
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.buyer ? (
                                        <img src={slotSignatures.buyer} alt="Buyer Signature" className="max-h-12 object-contain" />
                                    ) : (
                                        <div className="h-8"></div>
                                    )}
                                </div>
                                <div className="w-[85%] border-t border-dotted border-black pt-1">
                                    <p className="font-bold leading-tight m-0 text-[10px]">ผู้รับสินค้า<br />Received by</p>
                                </div>
                                <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
                            </div>
                            <div className="border-y border-r border-black flex flex-col items-center p-2 text-center relative h-full">
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.cashier ? (
                                        <img src={slotSignatures.cashier} alt="Cashier Signature" className="max-h-12 object-contain" />
                                    ) : (
                                        <div className="h-8"></div>
                                    )}
                                </div>
                                <div className="w-[85%] border-t border-dotted border-black pt-1">
                                    <p className="font-bold leading-tight m-0 text-[10px]">ผู้รับเงิน<br />Collector</p>
                                </div>
                                <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
                            </div>
                            <div className="border-y border-r border-black flex flex-col items-center p-2 text-center relative h-full pt-2">
                                <p className="leading-tight m-0 font-black text-[10px] uppercase px-1">ในนาม {companyNameEN}</p>
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.manager ? (
                                        <img src={slotSignatures.manager} alt="Manager Signature" className="max-h-12 object-contain" />
                                    ) : (
                                        <div className="h-6"></div>
                                    )}
                                </div>
                                <div className="w-[85%] border-t border-dotted border-black pt-1">
                                    <p className="font-bold m-0 text-[10px]">ผู้มีอำนาจลงนาม</p>
                                </div>
                            </div>
                            <div className="border-y border-r border-black flex flex-col items-center p-2 text-center relative h-full">
                                <div className="flex-1 flex items-center justify-center w-full">
                                    {slotSignatures?.sender ? (
                                        <img src={slotSignatures.sender} alt="Sender Signature" className="max-h-12 object-contain" />
                                    ) : (
                                        <div className="h-8"></div>
                                    )}
                                </div>
                                <div className="w-[85%] border-t border-dotted border-black pt-1">
                                    <p className="font-bold leading-tight m-0 text-[10px]">ผู้ส่งสินค้า<br />Delivered by</p>
                                </div>
                                <p className="text-[8px] mt-2 m-0">ลงวันที่ <span className="border-b border-dotted border-black w-16 inline-block"></span></p>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    html, body {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                        background: white;
                    }
                    body *:not(:has(.print-area)):not(.print-area):not(.print-area *) {
                        display: none !important;
                    }
                    style {
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
                        width: 210mm;
                        margin: 0 auto;
                        height: auto !important;
                        page-break-after: auto !important;
                    }
                    .break-after-page {
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-after: page;
                        break-inside: avoid;
                        margin: 0 !important;
                        padding: 10mm !important;
                        width: 210mm !important;
                        height: 296mm !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        overflow: hidden !important;
                        position: relative !important;
                    }
                    .last-print-page {
                        page-break-after: auto !important;
                        page-break-inside: avoid;
                        break-after: auto !important;
                        break-inside: avoid;
                        margin: 0 !important;
                        padding: 10mm !important;
                        width: 210mm !important;
                        height: 296mm !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        overflow: hidden !important;
                        position: relative !important;
                    }
                }
                .font-prompt { font-family: 'Prompt', sans-serif; }
            ` }} />
        </div>
    );
};

export default FullTaxInvoiceA4;