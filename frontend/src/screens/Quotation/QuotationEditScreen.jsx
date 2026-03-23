import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Form, Card, Container } from "react-bootstrap";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import {
  useGetQuotationByQuotationNoQuery,
  useUpdateQuotationByQuotationNoMutation,
  useUploadQuotationPDFMutation,
} from "../../slices/quotationApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaFilePdf, FaArrowLeft, FaEdit } from "react-icons/fa";

const QuotationEditScreen = () => {
  const componentRef = useRef();
  const { id } = useParams();
  const navigate = useNavigate();

  // --- API Calls ---
  const { data: quotationData, isLoading: isLoadingData } = useGetQuotationByQuotationNoQuery(id);
  const { data: defaultData } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const [uploadQuotationPDF, { isLoading: isLoadingUpload }] = useUploadQuotationPDFMutation();
  const [updateQuotationByQuotationNo, { isLoading: isLoadingUpdate }] = useUpdateQuotationByQuotationNoMutation();

  // --- State ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [create_date, setcreate_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");
  const [numRows, setNumRows] = useState(10);

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "", customer_present_name: "", customer_address: "", customer_vat: "",
    buyer_approves_signature: null, buyer_approves_signature_date: null
  });

  const [rows, setRows] = useState([]);
  const [defaultSummary, setDefaultSummary] = useState({});

  // --- Effects ---
  useEffect(() => {
    const firstQuotation = quotationData?.quotation?.[0]?.[0];
    if (!firstQuotation) return;

    if (firstQuotation.date) {
      const dateObj = new Date(firstQuotation.date);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      setcreate_date(`${day} / ${month} / ${year}`);
    }

    setCustomerInfo({
      customer_name: firstQuotation.customer_name || "",
      customer_present_name: firstQuotation.customer_present_name || "",
      customer_address: firstQuotation.customer_address || "",
      customer_vat: firstQuotation.customer_vat || "",
      buyer_approves_signature: firstQuotation.buyer_approves_signature,
      buyer_approves_signature_date: firstQuotation.buyer_approves_signature_date
    });

    const summaryData = {
      discount: parseFloat(firstQuotation.discount) || 0,
      vat: parseFloat(firstQuotation.vat) || 0,
      deposit: firstQuotation.deposit || 50,
      bank_account_name: firstQuotation.transfer_bank_account_name || "",
      bank_account_number: firstQuotation.transfer_bank_account_number || "",
      company_name: defaultSelected?.company_name || "",
      company_name_thai: defaultSelected?.company_name_thai || "",
      head_office: defaultSelected?.head_office || "",
      head_office_thai: defaultSelected?.head_office_thai || "",
      tel: defaultSelected?.tel || "",
      email: defaultSelected?.email || "",
      tax_id: defaultSelected?.tax_id || "",
    };
    setDefaultSummary(summaryData);

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
  }, [quotationData, defaultSelected]);

  // --- Handlers ---
  const handleCustomerChange = (field, value) => setCustomerInfo((prev) => ({ ...prev, [field]: value }));

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = (field === "qty" || field === "unit_price") ? (value === "" ? 0 : Number(value)) : value;
    setRows(updatedRows);

    const lastRow = updatedRows[updatedRows.length - 1];
    if (Object.values(lastRow).some((v) => v !== "" && v !== 0)) {
      setRows((prev) => [...prev, { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 }]);
    }
  };

  const autoGrow = (e) => {
    e.target.style.height = "24px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const subTotal = rows.reduce((acc, r) => acc + r.qty * r.unit_price, 0);
  const totalDiscount = subTotal * (parseFloat(defaultSummary.discount || 0) / 100);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat = totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")} / ${String(now.getMonth() + 1).padStart(2, "0")} / ${now.getFullYear() + 543}`;

  const handlePreviewPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
  };

  const handleAutoDownloadPDF = async (quotation_no) => {
    if (!componentRef.current) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save(`Quotation_${quotation_no}.pdf`);
  };

  const uploadPDF = async (quotation_no) => {
    if (!componentRef.current) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    const formData = new FormData();
    formData.append("quotationPDF", pdf.output("blob"), `Quotation_${quotation_no}.pdf`);
    const response = await uploadQuotationPDF(formData).unwrap();
    return response.url;
  };

  const handleUpdateQuotation = async (uploadedPDFUrl = null) => {
    try {
      const payload = {
        quotation_no: quotationNumber,
        date: create_date,
        due_date,
        submit_price_within,
        number_of_credit_days,
        quotation_pdf: uploadedPDFUrl || null,
        items: rows.filter((r) => r.product_id || r.description).map((r) => ({
          product_id: r.product_id,
          description: r.description,
          qty: r.qty,
          unit: r.unit,
          unit_price: r.unit_price,
          amount_money: r.qty * r.unit_price,
        })),
        summary: {
          discount: defaultSummary.discount,
          total_after_discount: totalAfterDiscount,
          vat: defaultSummary.vat,
          deposit: defaultSummary.deposit,
          grand_total: grandTotal,
          total: grandTotal,
          bank_account_name: defaultSummary.bank_account_name,
          bank_account_number: defaultSummary.bank_account_number,
        },
        customer: customerInfo,
        signatures: {
          buyer_approves_signature: customerInfo.buyer_approves_signature || null,
          buyer_approves_signature_date: customerInfo.buyer_approves_signature_date || null,
          sales_person_signature: defaultSelected?.sales_person || null,
          sales_manager_signature: defaultSelected?.sales_manager || null,
        },
      };
      await updateQuotationByQuotationNo({ id, ...payload }).unwrap();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update quotation.");
      throw error;
    }
  };

  const handleConfirmUpdate = async () => {
    setShowConfirm(false);
    try {
      const uploadedPDFUrl = await uploadPDF(quotationNumber);
      await handleUpdateQuotation(uploadedPDFUrl);
      await handleAutoDownloadPDF(quotationNumber);
      toast.success("Quotation updated successfully!");
      navigate("/admin/quotations");
    } catch (error) {
      console.error(error);
    }
  };

  const isLoadingAll = isLoadingData || isLoadingUpload || isLoadingUpdate;

  return (
    <Container fluid className="py-4 font-prompt bg-light min-vh-100">
      {isLoadingAll && (
        <div className="fixed-top w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center" style={{ zIndex: 9999 }}>
          <Loader />
        </div>
      )}

      {/* 1. Top Action Bar */}
      <Card className="shadow-sm border-0 mb-4 rounded-4 sticky-top" style={{zIndex: 1020}}>
          <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-3">
                  <Button variant="light" className="rounded-circle shadow-sm" onClick={() => navigate(-1)}><FaArrowLeft/></Button>
                  <h5 className="mb-0 fw-bold text-dark"><FaEdit className="me-2 text-warning"/> Edit Quotation: <span className="text-primary">{quotationNumber}</span></h5>
              </div>
              <div className="d-flex gap-2 w-100 w-md-auto">
                   <Button variant="outline-secondary" className="flex-fill flex-md-grow-0" onClick={handlePreviewPDF}><FaFilePdf className="me-2"/>Preview PDF</Button>
                   <Button variant="primary" className="flex-fill flex-md-grow-0 fw-bold shadow-sm" onClick={() => setShowConfirm(true)}><FaSave className="me-2"/>Update & Save</Button>
              </div>
          </Card.Body>
      </Card>

      {/* 2. Paper View Container - Wrapper for Horizontal Scroll on Mobile */}
      <div className="d-flex justify-content-center w-100" style={{ overflowX: 'auto', paddingBottom: '50px' }}>
          
          {/* The A4 Paper */}
          <div className="paper-container shadow-lg bg-white" ref={componentRef}>
                
                {/* --- Header Section --- */}
                <div className="d-flex justify-content-between align-items-start mb-2 position-relative">
                     <div className="position-absolute" style={{top: 0, left: 0}}>
                         {defaultSelected?.logo && <img src={defaultSelected.logo} alt="Logo" style={{height: 50}} />}
                     </div>
                     <div className="w-100 text-center pt-2">
                         <h5 className="fw-bold mb-1">{defaultSummary.company_name_thai}</h5>
                         <h6 className="fw-bold text-uppercase mb-1">{defaultSummary.company_name}</h6>
                         <div className="small text-muted mb-2" style={{fontSize: '0.7rem', lineHeight: '1.3'}}>
                             {defaultSummary.head_office_thai}<br/>
                             {defaultSummary.head_office}<br/>
                             Tel: {defaultSummary.tel} | Email: {defaultSummary.email} | Tax ID: {defaultSummary.tax_id}
                         </div>
                         <div className="d-inline-block border border-dark px-3 py-1 mt-1">
                             <div className="fw-bold small">ใบเสนอราคา / QUOTATION</div>
                         </div>
                     </div>
                     <div style={{width: 50}}></div> {/* Spacer to balance logo */}
                </div>

                {/* --- Customer & Doc Info Grid --- */}
                <div className="d-flex border border-dark mb-2">
                    {/* Left: Customer Info */}
                    <div className="flex-grow-1 border-end border-dark p-2" style={{maxWidth: '65%'}}>
                        <div className="d-flex align-items-center mb-1">
                            <span className="paper-label">Customer:</span>
                            <Form.Control type="text" className="paper-input flex-grow-1 fw-bold" value={customerInfo.customer_name} onChange={(e) => handleCustomerChange("customer_name", e.target.value)} />
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="paper-label">Attention:</span>
                            <Form.Control type="text" className="paper-input flex-grow-1" value={customerInfo.customer_present_name} onChange={(e) => handleCustomerChange("customer_present_name", e.target.value)} />
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="paper-label">Address:</span>
                            <Form.Control type="text" className="paper-input flex-grow-1" value={customerInfo.customer_address} onChange={(e) => handleCustomerChange("customer_address", e.target.value)} />
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="paper-label">Tax ID:</span>
                            <Form.Control type="text" className="paper-input" style={{width: 150}} value={customerInfo.customer_vat} onChange={(e) => handleCustomerChange("customer_vat", e.target.value)} />
                            <div className="d-flex gap-3 small ms-3">
                                <Form.Check type="checkbox" label="Head Office" id="head" />
                                <Form.Check type="checkbox" label="Branch" id="branch" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Doc Info */}
                    <div className="p-2" style={{minWidth: '35%'}}>
                         <div className="d-flex align-items-center mb-1">
                            <span className="paper-label-sm">No:</span>
                            <span className="paper-text fw-bold text-danger">{quotationNumber}</span>
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="paper-label-sm">Date:</span>
                            <Form.Control type="text" className="paper-input" style={{width: 100}} value={create_date} onChange={(e) => setcreate_date(e.target.value)} />
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="paper-label-sm">Credit:</span>
                            <Form.Control type="number" className="paper-input text-center" style={{width: 40}} value={number_of_credit_days} onChange={(e) => setnumber_of_credit_days(e.target.value)} />
                            <span className="small ms-1">Days</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="paper-label-sm">Valid:</span>
                            <Form.Control type="number" className="paper-input text-center" style={{width: 40}} value={submit_price_within} onChange={(e) => setsubmit_price_within(e.target.value)} />
                            <span className="small ms-1">Days</span>
                        </div>
                    </div>
                </div>

                {/* --- Items Table --- */}
                <div className="flex-grow-1 border border-dark mb-2 d-flex flex-column" style={{minHeight: '400px'}}>
                    {/* Header */}
                    <div className="d-flex bg-light border-bottom border-dark fw-bold small text-center" style={{height: 30}}>
                        <div style={{width: '5%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">#</div>
                        <div style={{width: '15%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">Code</div>
                        <div style={{width: '40%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">Description</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">Qty</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">Unit</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}} className="d-flex align-items-center justify-content-center">Price</div>
                        <div style={{width: '10%'}} className="d-flex align-items-center justify-content-center">Amount</div>
                    </div>

                    {/* Rows */}
                    {rows.map((row, idx) => (
                        <div key={idx} className="d-flex small text-center border-bottom border-light" style={{minHeight: 24}}>
                             <div style={{width: '5%', borderRight: '1px solid #dee2e6'}} className="d-flex align-items-start pt-1 justify-content-center">{idx + 1}</div>
                             <div style={{width: '15%', borderRight: '1px solid #dee2e6'}} className="px-1"><Form.Control className="paper-input w-100 text-start" value={row.product_id} onChange={(e) => handleChange(idx, "product_id", e.target.value)}/></div>
                             <div style={{width: '40%', borderRight: '1px solid #dee2e6'}} className="px-1"><Form.Control as="textarea" rows={1} className="paper-input w-100 text-start" style={{resize:'none', overflow:'hidden'}} value={row.description} onChange={(e) => handleChange(idx, "description", e.target.value)} onInput={autoGrow}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}} className="px-1"><Form.Control type="number" className="paper-input w-100 text-center" value={row.qty} onChange={(e) => handleChange(idx, "qty", e.target.value)}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}} className="px-1"><Form.Control className="paper-input w-100 text-center" value={row.unit} onChange={(e) => handleChange(idx, "unit", e.target.value)}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}} className="px-1"><Form.Control type="number" className="paper-input w-100 text-end" value={row.unit_price} onChange={(e) => handleChange(idx, "unit_price", e.target.value)}/></div>
                             <div style={{width: '10%'}} className="d-flex align-items-start pt-1 justify-content-end pe-2 fw-bold">{row.qty && row.unit_price ? (row.qty * row.unit_price).toFixed(2) : ""}</div>
                        </div>
                    ))}
                    
                    {/* Spacer */}
                    <div className="flex-grow-1 border-top border-dark"></div>

                    {/* Footer Summary */}
                    <div className="d-flex small border-top border-dark" style={{height: 100}}>
                         <div className="col-8 border-end border-dark p-2 d-flex flex-column justify-content-between">
                             <div>
                                 <strong>Note:</strong> <br/>
                                 - Deposit {defaultSummary.deposit}% <br/>
                                 - Bank: {defaultSummary.bank_account_name} ({defaultSummary.bank_account_number})
                             </div>
                             <div className="text-muted fst-italic" style={{fontSize: '0.65rem'}}>* This document is computer generated.</div>
                         </div>
                         <div className="col-4">
                             {[
                                 {l: "Sub Total", v: subTotal},
                                 {l: `Discount (${defaultSummary.discount}%)`, v: totalDiscount},
                                 {l: `VAT (${defaultSummary.vat}%)`, v: totalVat},
                             ].map((item, i) => (
                                 <div key={i} className="d-flex justify-content-between px-2 py-1 border-bottom border-secondary">
                                     <span>{item.l}</span>
                                     <span className="fw-bold">{item.v.toFixed(2)}</span>
                                 </div>
                             ))}
                             <div className="d-flex justify-content-between px-2 py-2 bg-secondary bg-opacity-10 fw-bold">
                                 <span>Grand Total</span>
                                 <span className="text-primary fs-6">{grandTotal.toFixed(2)}</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* --- Signatures --- */}
                <div className="d-flex justify-content-between small text-center mt-auto border border-dark">
                    {["Customer Acceptance", "Sales Person", "Authorized Signature"].map((role, idx) => (
                        <div key={idx} className="col-4 border-end border-dark p-2 d-flex flex-column justify-content-end" style={{height: 100, borderRight: idx===2?'none':'1px solid #000'}}>
                            <div className="border-bottom border-dark mb-1 mx-3" style={{height: 40, display:'flex', alignItems:'flex-end', justifyContent:'center'}}>
                                {/* Placeholder logic for images */}
                                {idx !== 0 && defaultSelected?.[idx===1?'sales_person':'sales_manager'] && 
                                    <img src={defaultSelected[idx===1?'sales_person':'sales_manager']} style={{height: 35, objectFit: 'contain'}} alt="sign" />
                                }
                            </div>
                            <div className="fw-bold">{role}</div>
                            <div className="small text-muted">Date: {today}</div>
                        </div>
                    ))}
                </div>

          </div>
      </div>

      {/* Row Config (Desktop Only) */}
      <div className="fixed-bottom p-3 d-flex justify-content-end pe-5 pb-5 d-none d-md-flex pointer-events-none">
          <Card className="shadow border-0" style={{pointerEvents: 'auto'}}>
              <Card.Body className="py-2 px-3 d-flex align-items-center gap-2">
                  <small className="fw-bold">Rows:</small>
                  <Form.Select size="sm" value={numRows} onChange={(e) => {setNumRows(Number(e.target.value)); setRows(prev => Array.from({length: Number(e.target.value)}, (_, i) => prev[i] || {product_id:"",description:"",qty:0,unit:"",unit_price:0}))}} style={{width: 70}}>
                      {[10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                  </Form.Select>
              </Card.Body>
          </Card>
      </div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-primary"><FaEdit className="me-2"/>Confirm Update</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to update this quotation? This will regenerate the PDF.</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmUpdate}>Yes, Update</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .paper-container {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            box-sizing: border-box;
            background: white;
            display: flex;
            flex-direction: column;
            margin-bottom: 2rem;
        }
        .paper-label { font-weight: bold; font-size: 12px; width: 70px; white-space: nowrap; }
        .paper-label-sm { font-weight: bold; font-size: 12px; width: 60px; white-space: nowrap; }
        
        .paper-input {
            border: none;
            border-bottom: 1px dashed #ccc;
            border-radius: 0;
            padding: 0 2px;
            font-size: 12px;
            background: transparent;
            box-shadow: none !important;
            min-height: 20px;
        }
        .paper-input:focus {
            background: #f8f9fa;
            border-bottom: 1px solid #0d6efd;
        }
        .paper-text { font-size: 12px; }
        
        @media (max-width: 768px) {
            /* Mobile tweaks */
            .paper-container {
               /* Allow horizontal scroll on parent, keep size fixed here */
               min-width: 210mm; 
            }
        }
      `}</style>
    </Container>
  );
};

export default QuotationEditScreen;