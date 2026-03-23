import React, { useState, useEffect, useRef } from "react";
import Button from "../../components/ui/Button";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import {
  useGetQuotationByQuotationNoQuery,
} from "../../slices/quotationApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import { useParams } from "react-router-dom";

const QuotationDetailScreen = () => {
  const componentRef = useRef();
  const { id } = useParams();

  const { data: quotationData } = useGetQuotationByQuotationNoQuery(id);
  const { data: defaultData } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");
  const [numRows, setNumRows] = useState(10);

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_present_name: "",
    customer_address: "",
    customer_vat: "",
  });

  const [rows, setRows] = useState([]);
  const [defaultSummary, setDefaultSummary] = useState({});

  const handleCustomerChange = (field, value) =>
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const firstQuotation = quotationData?.quotation?.[0]?.[0];
    if (!firstQuotation) return;

    setCustomerInfo({
      customer_name: firstQuotation.customer_name || "",
      customer_present_name: firstQuotation.customer_present_name || "",
      customer_address: firstQuotation.customer_address || "",
      customer_vat: firstQuotation.customer_vat || "",
    });

    setDefaultSummary({
      discount: parseFloat(firstQuotation.discount) || 0,
      vat: parseFloat(firstQuotation.vat) || 0,
      deposit: firstQuotation.deposit || 50,
      bank_account_name: firstQuotation.transfer_bank_account_name || "",
      bank_account_number: firstQuotation.transfer_bank_account_number || "",
    });

    setdue_date(firstQuotation.due_date || "");
    setsubmit_price_within(firstQuotation.submit_price_within || "");
    setnumber_of_credit_days(firstQuotation.number_of_credit_days || "");
    setQuotationNumber(firstQuotation.quotation_no || "");

    const initialRows = quotationData?.quotation?.[0] || [];
    setRows(initialRows.map(item => ({
      product_id: item.product_id || "",
      description: item.product_detail || "",
      qty: parseFloat(item.quantity) || 0,
      unit: item.unit || "",
      unit_price: parseFloat(item.unit_price) || 0,
    })));
  }, [quotationData]);


  useEffect(() => {
    if (defaultSelected) {
      setDefaultSummary({
        discount: parseFloat(defaultSelected.discount) || 0,
        vat: parseFloat(defaultSelected.vat) || 0,
        company_name: defaultSelected.company_name || "",
        company_name_thai: defaultSelected.company_name_thai || "",
        head_office: defaultSelected.head_office || "",
        head_office_thai: defaultSelected.head_office_thai || "",
        tel: defaultSelected.tel || "",
        email: defaultSelected.email || "",
        tax_id: defaultSelected.tax_id || "",
        bank_account_number: defaultSelected.bank_account_number || "",
        bank_account_name: defaultSelected.bank_account_name || "",
        deposit: defaultSelected.deposit || 50,
      });
    }
  }, [defaultData, defaultSelected]);

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] =
      field === "qty" || field === "unit_price" ? (value === "" ? 0 : Number(value)) : value;
    setRows(updatedRows);

    const lastRow = updatedRows[updatedRows.length - 1];
    const hasData = Object.values(lastRow).some((v) => v !== "" && v !== 0);
    if (hasData) {
      setRows((prev) => [...prev, { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 }]);
    }
  };

  const autoGrow = (e) => {
    e.target.style.height = "20px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const subTotal = rows.reduce((acc, r) => acc + r.qty * r.unit_price, 0);
  const totalDiscount = subTotal * (parseFloat(defaultSummary.discount || 0) / 100);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat = totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")} / ${String(
    now.getMonth() + 1
  ).padStart(2, "0")} / ${now.getFullYear() + 543}`;

  const handlePreviewPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const tableEl = componentRef.current;
    if (!tableEl) return;
    const canvas = await html2canvas(tableEl, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      position -= pdfHeight;
      if (heightLeft > 0) pdf.addPage();
    }

    const pdfBlob = pdf.output("blob");
    const pdfURL = URL.createObjectURL(pdfBlob);
    window.open(pdfURL, "_blank");
  };

  if (!quotationData || !defaultData) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <>
      <div className="flex justify-center w-full bg-slate-100 py-4">
        <div
          ref={componentRef}
          className="bg-white border border-slate-300 shadow-sm flex flex-col justify-between"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "8mm 20mm 15mm",
            boxSizing: "border-box",
            fontSize: "12px",
            fontFamily: "sans-serif"
          }}
        >
          {/* Header */}
          <div className="text-center relative">
            <div className="absolute top-2 left-0">
              <img src={defaultSelected?.logo} alt="Logo" className="max-h-[40px] object-contain" />
            </div>
            <div className="inline-block mt-3">
              <h3 className="font-bold text-lg leading-tight">
                {defaultSummary.company_name_thai}<br />{defaultSummary.company_name}
              </h3>
              <p className="mt-1 text-xs">
                <strong>
                  สำนักงานใหญ่: {defaultSummary.head_office_thai}<br />
                  Head Office: {defaultSummary.head_office}<br />
                  โทร: {defaultSummary.tel} | Email: {defaultSummary.email}<br />
                  เลขประจำตัวผู้เสียภาษี: {defaultSummary.tax_id}
                </strong>
              </p>
              <h5 className="border border-slate-300 p-1.5 inline-block mt-2 font-bold tracking-widest text-slate-800 text-sm">
                <div className="flex flex-col">
                  <span>ใบเสนอราคา</span>
                  <span>QUOTATION</span>
                </div>
              </h5>
            </div>
          </div>

          <div className="h-4"></div>

          {/* Customer Info */}
          <div className="flex justify-between w-full mt-2 text-xs">
            <div className="flex-1">
              <div className="leading-loose relative">
                <strong>ติดต่อจาก:</strong>
                <input
                  type="text"
                  value={customerInfo.customer_name}
                  onChange={(e) => handleCustomerChange("customer_name", e.target.value)}
                  className="border-none ml-2 w-[350px] outline-none bg-transparent"
                /><br />

                <strong>ผู้มาติดต่อ:</strong>
                <input
                  type="text"
                  value={customerInfo.customer_present_name}
                  onChange={(e) => handleCustomerChange("customer_present_name", e.target.value)}
                  className="border-none ml-2 w-[350px] outline-none bg-transparent"
                /><br />

                <strong>ที่อยู่:</strong>
                <input
                  type="text"
                  value={customerInfo.customer_address}
                  onChange={(e) => handleCustomerChange("customer_address", e.target.value)}
                  className="border-none ml-2 w-[380px] outline-none bg-transparent"
                /><br />

                <strong>เลขประจำตัวผู้เสียภาษี:</strong>
                <input
                  type="text"
                  value={customerInfo.customer_vat}
                  onChange={(e) => handleCustomerChange("customer_vat", e.target.value)}
                  className="border-none ml-2 w-[280px] outline-none bg-transparent"
                /><br />

                <label className="inline-flex items-center mt-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded-sm border-slate-400" />
                  <strong className="ml-1.5 font-medium">สำนักงานใหญ่</strong>
                </label>
                <label className="inline-flex items-center mt-1 ml-4 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded-sm border-slate-400" />
                  <strong className="ml-1.5 font-medium">สาขา</strong>
                </label>

                <div className="mt-1">
                  <label><strong>Number of rows: </strong></label>
                  <select
                    value={numRows}
                    className="border-none bg-transparent outline-none cursor-pointer"
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      setNumRows(newCount);
                      setRows(Array.from({ length: newCount }, (_, i) => rows[i] || { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 }));
                    }}
                  >
                    {Array.from({ length: 200 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
            <div className="flex flex-col justify-start items-end min-w-[200px] leading-loose text-xs">
              <div>
                <strong>เลขที่:</strong>
                <div className="inline-block border-b border-slate-400 min-w-[105px] ml-2 text-center font-bold">
                  {quotationNumber || " "}
                </div>
                <br />
                <strong>วันที่: </strong>
                <input
                  type="text"
                  value={today}
                  readOnly
                  className="w-[80px] border-none outline-none ml-5 bg-transparent font-bold text-center"
                /><br />
                <strong>วันที่กำหนดส่ง:</strong>
                <input
                  type="number"
                  value={due_date}
                  onChange={(e) => setdue_date(e.target.value)}
                  className="w-[30px] border-none outline-none ml-1 bg-transparent text-center font-bold"
                /> วัน<br />
                <strong>ยืนราคาภายใน:</strong>
                <input
                  type="number"
                  value={submit_price_within}
                  onChange={(e) => setsubmit_price_within(e.target.value)}
                  className="w-[30px] border-none outline-none ml-1 bg-transparent text-center font-bold"
                /> วัน<br />
                <strong>จำนวนวันเคดิต:</strong>
                <input
                  type="number"
                  value={number_of_credit_days}
                  onChange={(e) => setnumber_of_credit_days(e.target.value)}
                  className="w-[30px] border-none outline-none ml-1 bg-transparent text-center font-bold"
                /> วัน
              </div>
            </div>
          </div>

          <div className="h-4"></div>

          {/* Products Table */}
          <div className="flex-grow mt-2">
            <div className="grid border border-slate-300 w-full max-w-[180mm]" style={{ gridTemplateColumns: "0.5fr 1fr 2.8fr 0.7fr 0.7fr 1fr 1.2fr" }}>
              {["ลำดับ", "รหัสสินค้า", "รายละเอียด", "จำนวน", "หน่วย", "ราคา/หน่วย", "จำนวนเงิน"].map((header, i) => (
                <div key={i} className={`text-center py-1.5 px-1 font-bold bg-slate-50 ${i === 6 ? "" : "border-r border-slate-300"} text-xs`}>
                  {header}
                </div>
              ))}
              {rows.map((row, index) => (
                <React.Fragment key={index}>
                  <div className="text-center content-start border-t border-r border-slate-300 py-1 px-1 text-xs">{index + 1}</div>
                  <div className="border-t border-r border-slate-300 px-1 content-start">
                    <input
                      value={row.product_id}
                      onChange={(e) => handleChange(index, "product_id", e.target.value)}
                      className="w-full text-xs h-[24px] border-none outline-none leading-none p-0 bg-transparent text-center"
                    />
                  </div>

                  <div className="border-t border-r border-slate-300 px-1.5 py-1 content-start">
                    <textarea
                      value={row.description}
                      onChange={(e) => handleChange(index, "description", e.target.value)}
                      onInput={autoGrow}
                      className="w-full text-xs min-h-[22px] border-none outline-none resize-none overflow-hidden leading-snug p-0 bg-transparent"
                      rows={1}
                    />
                  </div>

                  <div className="text-center border-t border-r border-slate-300 px-1 content-start">
                    <input
                      type="number"
                      min="0"
                      value={row.qty || ""}
                      onChange={(e) => handleChange(index, "qty", e.target.value)}
                      className="w-full text-xs text-center h-[24px] border-none outline-none leading-none p-0 bg-transparent"
                    />
                  </div>

                  <div className="text-center border-t border-r border-slate-300 px-1 content-start">
                    <input
                      value={row.unit}
                      onChange={(e) => handleChange(index, "unit", e.target.value)}
                      className="w-full text-xs text-center h-[24px] border-none outline-none leading-none p-0 bg-transparent"
                    />
                  </div>

                  <div className="text-right border-t border-r border-slate-300 px-1 content-start">
                    <input
                      type="number"
                      min="0"
                      value={row.unit_price || ""}
                      onChange={(e) => handleChange(index, "unit_price", e.target.value)}
                      className="w-full text-xs text-right h-[24px] border-none outline-none leading-none px-1 bg-transparent"
                    />
                  </div>

                  <div className="text-right content-start border-t border-slate-300 py-1.5 px-1.5 text-xs tabular-nums">
                    {row.qty && row.unit_price ? (parseFloat(row.qty) * parseFloat(row.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                  </div>
                </React.Fragment>
              ))}

              {/* Summary Rows */}
              {[
                [`*** มัดจำ ${defaultSummary.deposit} % ***`, `ส่วนลด ${defaultSummary.discount || "0"} %`, totalDiscount],
                [`${defaultSummary.bank_account_name || ""}\n${defaultSummary.bank_account_number || ""}`, "มูลค่าสินค้าหลังหักส่วนลด", totalAfterDiscount],
                ["", `ภาษีมูลค่าเพิ่ม ${defaultSummary.vat || "0"} %`, totalVat],
                ["", "ยอดรวมสุทธิ", grandTotal],
              ].map(([note, label, value], i) => (
                <React.Fragment key={i}>
                  <div className={`text-center py-1.5 px-1 whitespace-pre-line ${i === 0 ? "border-t border-slate-300" : ""} border-r border-slate-300 font-normal text-xs`} style={{ gridColumn: "1 / span 4" }}>{note}</div>
                  <div className="text-left py-1.5 px-2 border-t border-r border-slate-300 font-bold text-xs bg-slate-50/50" style={{ gridColumn: "5 / span 2" }}>{label}</div>
                  <div className="text-right py-1.5 px-1.5 border-t border-slate-300 font-bold text-xs bg-slate-50/50 tabular-nums" style={{ gridColumn: "7" }}>{parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="h-8"></div>

          {/* Footer / Signatures */}
          <div className="flex justify-between w-full mt-2 mb-0 gap-4">
            {["buyer_approves", "sales_person", "sales_manager"].map((role, idx) => (
              <div key={idx} className="flex-1 min-w-0 border border-slate-300 px-4 pb-2 pt-2 flex flex-col items-center h-[95px] justify-between text-xs">
                <div className="flex items-center w-full mb-1">
                  <span className="flex-[0_0_50%] text-left self-end font-medium text-slate-700">
                    {role === "buyer_approves"
                      ? "ผู้ขอซื้อ"
                      : role === "sales_person"
                        ? "ผู้เสนอราคา"
                        : "ผู้จัดการขาย"}
                  </span>

                  <div className={`flex-[0_0_90px] border-b border-slate-400 h-[45px] flex items-end justify-center ${role === "buyer_approves" ? "-ml-2.5" : ""}`}>
                    {role !== "buyer_approves" && (
                      <img
                        src={defaultSelected?.[role]}
                        alt={`${role} Signature`}
                        className="max-h-[35px] object-contain mb-1"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center w-full mt-1">
                  <span className="flex-[0_0_25%] text-left font-medium text-slate-700">ลงวันที่</span>
                  <div className="flex-1 border-b border-slate-400 h-[22px] flex items-center justify-center font-semibold text-slate-800">
                    {today}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="flex justify-center w-full py-8 mt-4 bg-white border-t border-slate-200">
        <Button onClick={handlePreviewPDF} className="min-w-[200px] shadow-sm font-semibold">Preview PDF</Button>
      </div>

    </>
  );
};

export default QuotationDetailScreen;
