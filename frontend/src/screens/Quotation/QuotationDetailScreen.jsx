import React, { useState, useEffect, useRef } from "react";
import Button from "../../components/ui/Button";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import {
  useUpdateQuotationByQuotationNoMutation,
  useGetQuotationByQuotationNoQuery,
} from "../../slices/quotationApiSlice";
import { useUpdateOrderStatusByQuotationNoMutation } from "../../slices/ordersApiSlice";
import Loader from "../../components/Loader";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaCheckCircle, FaPrint, FaArrowLeft, FaFileInvoice } from "react-icons/fa";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";

const QuotationDetailScreen = () => {
  const componentRef = useRef();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: quotationData, isLoading, refetch } = useGetQuotationByQuotationNoQuery(id);
  const { data: defaultData } = useGetDefaultQuotationUsedQuery();
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();
  const [updateStatus] = useUpdateOrderStatusByQuotationNoMutation();

  const defaultSelected = defaultData?.quotations?.[0] || null;

  const handleAcceptQuote = async () => {
    try {
      await updateStatus({
        quotation_no: id,
        status: "Awaiting Payment"
      }).unwrap();
      toast.success("Quotation Accepted! Please proceed to payment.");
      navigate("/profile?tab=orders");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const companyNameTH = "บริษัท ภาวินท์เทคโนโลยี จำกัด";
  const companyNameEN = "PAWINTECHNOLOGY CO., LTD.";
  const companyAddressTH = "สำนักงานใหญ่ : 124 ซอยร่มเกล้า 24 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510";
  const companyAddressEN = "Head Office : 124 Soi Rom Klao 24, Min Buri, Min Buri, Bangkok, 10510";
  const companyPhone = "099-226-3277";
  const companyEmail = "contact@pawin-tech.com";
  const companyTaxId = "0105562141221";
  const companyLogo = "/image/Pawin_Logo_long.png";

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");
  const [numRows, setNumRows] = useState(8);

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_present_name: "",
    customer_address: "",
    customer_vat: "",
    branch_type: "สำนักงานใหญ่",
    branch_no: "",
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
      branch_type: "สำนักงานใหญ่", // Defaulting, adjust as needed
      branch_no: "",
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
    setRows(
      initialRows.map((item) => ({
        product_id: item.product_id || "",
        description: item.product_detail || "",
        qty: parseFloat(item.quantity) || 0,
        unit: item.unit || "",
        unit_price: parseFloat(item.unit_price) || 0,
      })),
    );
  }, [quotationData]);

  useEffect(() => {
    if (defaultSelected) {
      setDefaultSummary((prev) => ({
        ...prev,
        discount: parseFloat(defaultSelected.discount) || prev.discount || 0,
        vat: parseFloat(defaultSelected.vat) || prev.vat || 0,
        company_name: defaultSelected.company_name || "",
        company_name_thai: defaultSelected.company_name_thai || "",
        head_office: defaultSelected.head_office || "",
        head_office_thai: defaultSelected.head_office_thai || "",
        tel: defaultSelected.tel || "",
        email: defaultSelected.email || "",
        tax_id: defaultSelected.tax_id || "",
        bank_account_number: defaultSelected.bank_account_number || prev.bank_account_number,
        bank_account_name: defaultSelected.bank_account_name || prev.bank_account_name,
        deposit: defaultSelected.deposit || prev.deposit || 50,
      }));
    }
  }, [defaultData, defaultSelected]);

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] =
      field === "qty" || field === "unit_price"
        ? value === ""
          ? 0
          : Number(value)
        : value;
    setRows(updatedRows);

    const lastRow = updatedRows[updatedRows.length - 1];
    const hasData = Object.values(lastRow).some((v) => v !== "" && v !== 0);
    if (hasData) {
      setRows((prev) => [
        ...prev,
        { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 },
      ]);
    }
  };

  const autoGrow = (e) => {
    e.target.style.height = "20px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Calculations
  const subTotal = rows.reduce((acc, r) => acc + (r.qty * r.unit_price || 0), 0);
  const totalDiscount = subTotal * (parseFloat(defaultSummary.discount || 0) / 100);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat = totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}/${now.getFullYear() + 543}`;

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

  const handlePrint = () => {
    window.print();
  };

  // Adapter for FullTaxInvoiceA4
  const firstQuotation = quotationData?.quotation?.[0]?.[0];
  const mappedOrder = firstQuotation ? {
    id: firstQuotation.quotation_no,
    quotation_no: firstQuotation.quotation_no,
    createdAt: firstQuotation.createdAt || new Date(),
    status: firstQuotation.status || "Quoted",
    billingAddress: {
      billingName: firstQuotation.customer_present_name || firstQuotation.customer_name,
      billinggAddress: firstQuotation.customer_address,
      tax: firstQuotation.customer_vat,
      branch: firstQuotation.branch_type === "สาขา" ? firstQuotation.branch_no : firstQuotation.branch_type,
    },
    orderItems: (quotationData?.quotation?.[0] || []).map(item => ({
      product_id: item.product_id,
      name: item.product_detail,
      qty: item.quantity,
      unit: item.unit,
      price: item.unit_price,
    })),
    itemsPrice: subTotal,
    vatPrice: totalVat,
    totalPrice: grandTotal,
    discountPrice: totalDiscount,
    signatures: {
      buyer: firstQuotation.buyer_approves_signature,
      buyerDate: firstQuotation.buyer_approves_signature_date,
      sales: firstQuotation.sales_person_signature,
      salesDate: firstQuotation.sales_person_signature_date,
      manager: firstQuotation.sales_manager_signature,
      managerDate: firstQuotation.sales_manager_signature_date,
    }
  } : null;

  if (!quotationData || !defaultData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <>
      {/* Control Panel (Not printed) */}
      <div className="flex justify-center w-full bg-slate-100 py-2 print:hidden gap-4 items-center">
        <label className="font-semibold text-sm">เลือกจำนวนแถวเริ่มต้น:</label>
        <select
          value={numRows}
          className="border border-slate-300 rounded px-2 py-1 outline-none cursor-pointer"
          onChange={(e) => {
            const newCount = parseInt(e.target.value);
            setNumRows(newCount);
            setRows(
              Array.from({ length: newCount }, (_, i) => rows[i] || { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 })
            );
          }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 5).map((n) => (
            <option key={n} value={n}>{n} แถว</option>
          ))}
        </select>

        <Button onClick={handlePrint} className="shadow-sm font-semibold bg-[#5F9EA0] text-white px-6">
          Print / Save PDF
        </Button>
      </div>

      {/* A4 Paper Canvas */}
      <div className="flex justify-center w-full bg-slate-200 py-4 print:py-0 print:bg-white overflow-visible">
        {mappedOrder && (
          <FullTaxInvoiceA4
            order={mappedOrder}
            companyInfo={companyInfo}
            isQuotation={true}
            isAdmin={userInfo?.isAdmin}
            docType="quotation"
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          @media print {
              @page {
                  size: A4;
                  margin: 0;
              }
              body {
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background: white !important;
              }
              .no-print { display: none !important; }
              #root > *:not(.print-area),
              .navbar, .footer, .header { display: none !important; }

              .print-area {
                  display: block !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  margin: 0 !important;
                  padding: 8mm !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
              }
          }

          .break-after-page {
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
              margin: 0 !important;
          }
          .font-prompt { font-family: 'Prompt', sans-serif; }
      ` }} />

      {/* Floating Action Bar (Customer View) */}
      {!userInfo?.isAdmin && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-[100] no-print px-4">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 px-4 sm:px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row items-center gap-4 sm:gap-8 max-w-2xl w-full border-t border-white/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shrink-0">
                <FaFileInvoice size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Next Action</span>
                <span className="text-sm font-bold text-slate-800">ยืนยันราคา & รับใบแจ้งหนี้</span>
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-slate-200" />

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FaPrint /> Print
              </button>
              <button
                onClick={handleAcceptQuote}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-black"
              >
                <FaCheckCircle className="text-green-400" /> Accept Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Nav */}
      {userInfo?.isAdmin && (
        <div className="fixed top-24 left-8 z-[100] no-print">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center justify-center text-slate-600 hover:text-black hover:border-black transition-all group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </>
  );
};

export default QuotationDetailScreen;
