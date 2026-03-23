import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Modal, Form, Card, Container } from "react-bootstrap";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import { useCreateQuotationMutation, useUpdateQuotationByQuotationNoMutation, useUploadQuotationPDFMutation } from "../../slices/quotationApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaFilePdf, FaSave, FaEye, FaArrowLeft } from 'react-icons/fa';

const QuotationSetSelectedCustomerScreen = () => {
  const componentRef = useRef();
  const navigate = useNavigate();

  // --- State ---
  const [showConfirm, setShowConfirm] = useState(false);
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");
  const [numRows, setNumRows] = useState(10);

  // --- API Hooks ---
  const { data: defaultData, isLoading } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const [createQuotation, { isLoading: isLoadingCreate }] = useCreateQuotationMutation();
  const [uploadQuotationPDF, { isLoading: isLoadingUpload }] = useUploadQuotationPDFMutation();
  const [updateQuotationByQuotationNo, { isLoading: isLoadingUpdate }] = useUpdateQuotationByQuotationNoMutation();

  const [customerInfo, setCustomerInfo] = useState({
    id: "", customer_name: "", customer_present_name: "", customer_address: "", customer_vat: "",
    quotation_no: "", date: "", due_date: "", submit_price_within: "", number_of_credit_days: "",
    product_id: "", product_detail: "", quantity: "", unit: "", unit_price: "", amount_money: "",
    discount: "", total_amount_after_discount: "", total: "", vat: "", grand_total: "",
    transfer_bank_account_name: "", transfer_bank_account_number: "",
  });

  const [rows, setRows] = useState(Array.from({ length: numRows }, () => ({
    product_id: "", description: "", qty: 0, unit: "", unit_price: 0
  })));

  // ✅ แก้ไข 1: กำหนดค่าเริ่มต้นให้ defaultSummary เพื่อไม่ให้เป็น undefined
  const [defaultSummary, setDefaultSummary] = useState({
    discount: 0,
    vat: 7,
    deposit: 0,
    company_name: "",
    company_name_thai: "",
    head_office: "",
    head_office_thai: "",
    tel: "",
    email: "",
    tax_id: "",
    bank_account_name: "",
    bank_account_number: ""
  });

  // --- Effects ---
  useEffect(() => {
    if (defaultSelected) {
        setRows(prevRows => {
            const initialRows = (defaultSelected.items || []).map((item) => ({ 
                ...item, 
                qty: parseFloat(item.qty) || 0, 
                unit_price: parseFloat(item.unit_price) || 0 
            }));
            return initialRows.length > 0 ? initialRows : prevRows;
        });
        
        setDefaultSummary({ 
            ...defaultSelected, 
            discount: parseFloat(defaultSelected.discount) || 0, 
            vat: parseFloat(defaultSelected.vat) || 7, // Default VAT 7%
            deposit: parseFloat(defaultSelected.deposit) || 0 
        });
    }
  }, [defaultSelected]);

  // --- Handlers ---
  const handleCustomerChange = (field, value) => setCustomerInfo((prev) => ({ ...prev, [field]: value }));

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = (field === "qty" || field === "unit_price") ? (value === "" ? 0 : Number(value)) : value;
    setRows(updatedRows);
    
    // Auto add row
    const lastRow = updatedRows[updatedRows.length - 1];
    if (lastRow && Object.values(lastRow).some(val => val !== "" && val !== 0)) {
       setRows(prev => [...prev, { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 }]);
    }
  };

  const autoGrow = (e) => {
    e.target.style.height = "24px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // --- Calculation ---
  const subTotal = rows.reduce((acc, r) => acc + r.qty * r.unit_price, 0);
  const totalDiscount = subTotal * (parseFloat(defaultSummary.discount || 0) / 100);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat = totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear() + 543}`;

  // --- PDF Functions ---
  const handlePreviewPDF = async () => { 
    if (!componentRef.current) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
  };

  const uploadPDF = async (quotation_no) => {
     if (!componentRef.current) return;
     const noSpan = document.getElementById("quotation_no_span");
     if(noSpan) noSpan.textContent = quotation_no;

     const pdf = new jsPDF("p", "mm", "a4");
     const canvas = await html2canvas(componentRef.current, { scale: 2, useCORS: true });
     const imgData = canvas.toDataURL("image/png");
     pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
     
     const formData = new FormData();
     formData.append("quotationPDF", pdf.output("blob"), `Quotation_${quotation_no}.pdf`);
     
     const response = await uploadQuotationPDF(formData).unwrap();
     return response.url;
  };

  const handleUpdateQuotation = async (id, quotation_no, pdfResponse) => {
    try {
        const payload = {
            quotation_no, quotation_pdf: pdfResponse, date: today, due_date, submit_price_within, number_of_credit_days,
            items: rows.filter((r) => r.product_id || r.description).map((r) => ({ ...r, amount_money: r.qty * r.unit_price })),
            summary: { ...defaultSummary, sub_total: subTotal, total_after_discount: totalAfterDiscount, grand_total: grandTotal, total: grandTotal },
            customer: customerInfo,
            signatures: { sales_person_signature: defaultSelected?.sales_person, sales_manager_signature: defaultSelected?.sales_manager }
        };
        await updateQuotationByQuotationNo({ id, ...payload }).unwrap();
    } catch (error) { toast.error("Failed to update quotation detail."); }
  };

  const handleCreateQuotation = async () => {
    try {
        const payload = {
            due_date, submit_price_within, number_of_credit_days, date: today,
            items: rows.filter(row => row.product_id || row.description).map(r => ({ ...r, qty: Number(r.qty), unit_price: Number(r.unit_price), amount_money: Number(r.qty) * Number(r.unit_price) })),
            customer: { ...customerInfo }, summary: { ...defaultSummary, total: grandTotal },
            signatures: { sales_person_signature: defaultSelected?.sales_person, sales_manager_signature: defaultSelected?.sales_manager }
        };
        const result = await createQuotation(payload).unwrap();
        setQuotationNumber(result.quotation_no);
        const pdfResponse = await uploadPDF(result.quotation_no);
        await handleUpdateQuotation(result.id, result.quotation_no, pdfResponse);
        toast.success("Quotation created successfully!");
        navigate("/admin/quotations");
    } catch (error) { toast.error("Failed to create quotation."); }
  };

  const handleConfirmCreate = () => { handleCreateQuotation(); handleCloseConfirm(); };
  const isLoadingAll = isLoading || isLoadingCreate || isLoadingUpload || isLoadingUpdate;

  return (
    <Container fluid className="py-4 font-prompt bg-light min-vh-100">
      {isLoadingAll && <div className="fixed-top w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center" style={{zIndex: 9999}}><Loader /></div>}
      
      {/* 1. Action Bar */}
      <Card className="shadow-sm border-0 mb-4 rounded-4 sticky-top" style={{zIndex: 1020}}>
          <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-3">
                  <Button variant="light" className="rounded-circle shadow-sm" onClick={() => navigate(-1)}><FaArrowLeft/></Button>
                  <h5 className="mb-0 fw-bold text-dark"><FaFilePdf className="me-2 text-danger"/> Create Quotation</h5>
              </div>
              <div className="d-flex gap-2 w-100 w-md-auto">
                   <Button variant="outline-secondary" className="flex-fill" onClick={handlePreviewPDF}><FaEye className="me-2"/>Preview PDF</Button>
                   <Button variant="primary" className="flex-fill fw-bold shadow-sm" onClick={handleOpenConfirm}><FaSave className="me-2"/>Save & Create</Button>
              </div>
          </Card.Body>
      </Card>

      <Row className="justify-content-center">
        <div className="d-flex justify-content-center w-100" style={{ overflowX: 'auto', paddingBottom: '50px' }}>
            
            {/* --- PAPER START --- */}
            <div className="paper-container shadow-lg bg-white" ref={componentRef}>
                
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4 position-relative">
                     <div style={{width: '80px'}}>
                         {defaultSelected?.logo && <img src={defaultSelected.logo} alt="Logo" style={{width: '100%', objectFit: 'contain'}} />}
                     </div>
                     <div className="flex-grow-1 text-center px-3">
                         <h5 className="fw-bold mb-0 text-primary">{defaultSummary.company_name_thai}</h5>
                         <h6 className="fw-bold text-uppercase mb-2 text-secondary">{defaultSummary.company_name}</h6>
                         <div className="small text-muted" style={{fontSize: '0.75rem', lineHeight: '1.4'}}>
                             <div>{defaultSummary.head_office_thai}</div>
                             <div>{defaultSummary.head_office}</div>
                             <div className="mt-1">
                                 <span className="fw-bold">Tel:</span> {defaultSummary.tel} | <span className="fw-bold">Email:</span> {defaultSummary.email}
                             </div>
                             <div><span className="fw-bold">Tax ID:</span> {defaultSummary.tax_id}</div>
                         </div>
                     </div>
                     <div className="text-end" style={{width: '120px'}}>
                         <div className="d-inline-block border border-dark px-3 py-2 text-center" style={{minWidth: '100%'}}>
                             <div className="fw-bold small">ใบเสนอราคา</div>
                             <div className="fw-bold small">QUOTATION</div>
                         </div>
                     </div>
                </div>

                {/* Info Grid */}
                <div className="d-flex border border-dark mb-3">
                    <div className="flex-grow-1 border-end border-dark p-3" style={{width: '65%'}}>
                        <div className="info-row">
                            <span className="info-label">Customer:</span>
                            <Form.Control type="text" className="paper-input fw-bold text-primary" value={customerInfo.customer_name} onChange={(e) => handleCustomerChange("customer_name", e.target.value)} />
                        </div>
                        <div className="info-row">
                            <span className="info-label">Attention:</span>
                            <Form.Control type="text" className="paper-input" value={customerInfo.customer_present_name} onChange={(e) => handleCustomerChange("customer_present_name", e.target.value)} />
                        </div>
                        <div className="info-row">
                            <span className="info-label">Address:</span>
                            <Form.Control type="text" className="paper-input" value={customerInfo.customer_address} onChange={(e) => handleCustomerChange("customer_address", e.target.value)} />
                        </div>
                        <div className="info-row">
                            <span className="info-label">Tax ID:</span>
                            <div className="d-flex w-100 align-items-center">
                                <Form.Control type="text" className="paper-input" style={{maxWidth: '150px'}} value={customerInfo.customer_vat} onChange={(e) => handleCustomerChange("customer_vat", e.target.value)} />
                                <div className="d-flex gap-3 small ms-3">
                                    <Form.Check type="checkbox" label="Head Office" id="head" className="paper-check" />
                                    <Form.Check type="checkbox" label="Branch" id="branch" className="paper-check" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3" style={{width: '35%'}}>
                         <div className="info-row">
                            <span className="info-label-sm">No:</span>
                            <span id="quotation_no_span" className="paper-text fw-bold text-danger fs-6">{quotationNumber || "QT-XXXX"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label-sm">Date:</span>
                            <span className="paper-text">{today}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label-sm">Credit:</span>
                            <div className="d-flex align-items-center">
                                <Form.Control type="number" className="paper-input text-center me-2" style={{width: '50px'}} value={number_of_credit_days} onChange={(e) => setnumber_of_credit_days(e.target.value)} />
                                <span className="small">Days</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <span className="info-label-sm">Valid:</span>
                            <div className="d-flex align-items-center">
                                <Form.Control type="number" className="paper-input text-center me-2" style={{width: '50px'}} value={submit_price_within} onChange={(e) => setsubmit_price_within(e.target.value)} />
                                <span className="small">Days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-grow-1 border border-dark mb-3 d-flex flex-column" style={{minHeight: '400px'}}>
                    <div className="d-flex bg-light border-bottom border-dark fw-bold small text-center" style={{height: '35px', lineHeight: '35px'}}>
                        <div style={{width: '5%', borderRight: '1px solid #000'}}>#</div>
                        <div style={{width: '15%', borderRight: '1px solid #000'}}>Code</div>
                        <div style={{width: '40%', borderRight: '1px solid #000'}}>Description</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}}>Qty</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}}>Unit</div>
                        <div style={{width: '10%', borderRight: '1px solid #000'}}>Price</div>
                        <div style={{width: '10%'}}>Amount</div>
                    </div>

                    {rows.map((row, idx) => (
                        <div key={idx} className="d-flex small border-bottom border-light" style={{minHeight: '28px'}}>
                             <div className="text-center pt-1" style={{width: '5%', borderRight: '1px solid #dee2e6'}}>{idx + 1}</div>
                             <div style={{width: '15%', borderRight: '1px solid #dee2e6'}}><Form.Control className="paper-input-table text-start" value={row.product_id} onChange={(e) => handleChange(idx, "product_id", e.target.value)}/></div>
                             <div style={{width: '40%', borderRight: '1px solid #dee2e6'}}><Form.Control as="textarea" rows={1} className="paper-input-table text-start" style={{resize:'none', overflow:'hidden'}} value={row.description} onChange={(e) => handleChange(idx, "description", e.target.value)} onInput={autoGrow}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}}><Form.Control type="number" className="paper-input-table text-center" value={row.qty} onChange={(e) => handleChange(idx, "qty", e.target.value)}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}}><Form.Control className="paper-input-table text-center" value={row.unit} onChange={(e) => handleChange(idx, "unit", e.target.value)}/></div>
                             <div style={{width: '10%', borderRight: '1px solid #dee2e6'}}><Form.Control type="number" className="paper-input-table text-end" value={row.unit_price} onChange={(e) => handleChange(idx, "unit_price", e.target.value)}/></div>
                             <div className="text-end pt-1 pe-2 fw-bold" style={{width: '10%'}}>{row.qty && row.unit_price ? (row.qty * row.unit_price).toFixed(2) : ""}</div>
                        </div>
                    ))}
                    
                    <div className="flex-grow-1 border-top border-dark"></div>

                    {/* ✅ แก้ไข 2: Summary Section - ใช้ text-nowrap ป้องกันข้อความตกหล่น */}
                    <div className="d-flex small border-top border-dark" style={{height: '110px'}}>
                         <div className="border-end border-dark p-3 d-flex flex-column justify-content-between" style={{width: '65%'}}>
                             <div>
                                 <strong className="text-decoration-underline mb-1 d-block">Note / Remark:</strong>
                                 <div className="ps-2">
                                     - Deposit {defaultSummary.deposit || 0}% <br/>
                                     - Bank: <span className="fw-bold">{defaultSummary.bank_account_name}</span> No: <span className="fw-bold">{defaultSummary.bank_account_number}</span>
                                 </div>
                             </div>
                             <div className="text-muted fst-italic" style={{fontSize: '0.65rem'}}>* This document is computer generated and valid without signature.</div>
                         </div>
                         <div style={{width: '35%'}}>
                             {[
                                 {l: "Sub Total", v: subTotal},
                                 {l: `Discount (${defaultSummary.discount || 0}%)`, v: totalDiscount},
                                 {l: `VAT (${defaultSummary.vat || 7}%)`, v: totalVat},
                             ].map((item, i) => (
                                 <div key={i} className="d-flex justify-content-between px-3 py-1 border-bottom border-secondary align-items-center" style={{height: '28px'}}>
                                     <span className="text-nowrap">{item.l}</span> {/* ✅ เพิ่ม text-nowrap */}
                                     <span className="fw-bold">{item.v.toFixed(2)}</span>
                                 </div>
                             ))}
                             <div className="d-flex justify-content-between px-3 py-2 bg-light align-items-center h-100">
                                 <span className="fw-bold">Grand Total</span>
                                 <span className="text-primary fw-bold fs-6">{grandTotal.toFixed(2)}</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="d-flex justify-content-between small text-center mt-auto border border-dark">
                    {["Customer Acceptance", "Sales Person", "Authorized Signature"].map((role, idx) => (
                        <div key={idx} className="border-end border-dark p-2 d-flex flex-column justify-content-end" style={{width: '33.33%', height: '100px', borderRight: idx===2?'none':'1px solid #000'}}>
                            <div className="border-bottom border-dark mb-1 mx-3 position-relative" style={{height: '50px'}}>
                                {idx !== 0 && defaultSelected?.[idx===1?'sales_person':'sales_manager'] && 
                                    <img src={defaultSelected[idx===1?'sales_person':'sales_manager']} style={{height: '45px', objectFit: 'contain', position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)'}} alt="sign" />
                                }
                            </div>
                            <div className="fw-bold text-uppercase">{role}</div>
                            <div className="small text-muted">Date: {today}</div>
                        </div>
                    ))}
                </div>
            </div>
            {/* --- PAPER END --- */}
        </div>
      </Row>

      {/* Rows Config */}
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

      <Modal show={showConfirm} onHide={handleCloseConfirm} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold text-primary"><FaSave className="me-2"/>Confirm Creation</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to create and save this quotation?</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCloseConfirm}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmCreate}>Yes, Create</Button>
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
        .info-row { display: flex; align-items: center; margin-bottom: 6px; }
        .info-label { font-weight: bold; font-size: 12px; width: 80px; flex-shrink: 0; }
        .info-label-sm { font-weight: bold; font-size: 12px; width: 60px; flex-shrink: 0; }
        .paper-input {
            border: none; border-bottom: 1px dotted #ccc; border-radius: 0;
            padding: 0 4px; font-size: 12px; background: transparent;
            width: 100%; height: 22px; box-shadow: none !important;
        }
        .paper-input:focus { background: #f0f8ff; border-bottom: 1px solid #0d6efd; }
        .paper-input-table {
            border: none; border-radius: 0; padding: 0 4px; font-size: 12px;
            background: transparent; width: 100%; height: 100%; min-height: 24px;
            box-shadow: none !important;
        }
        .paper-input-table:focus { background: #f0f8ff; }
        .paper-text { font-size: 12px; }
        .text-nowrap { white-space: nowrap; }
        
        @media (max-width: 768px) { .paper-container { min-width: 210mm; } }
        @media print {
            body * { visibility: hidden; }
            .paper-container, .paper-container * { visibility: visible; }
            .paper-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; }
        }
      `}</style>
    </Container>
  );
};

export default QuotationSetSelectedCustomerScreen;