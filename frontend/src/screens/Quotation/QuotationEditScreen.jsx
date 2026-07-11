import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Form, Card, Container, Row, Col, Table } from "react-bootstrap";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import {
  useGetQuotationByQuotationNoQuery,
  useUpdateQuotationByQuotationNoMutation,
  useUploadQuotationPDFMutation,
} from "../../slices/quotationApiSlice";
import { 
  useGetSignaturesQuery, 
  useCreateSignatureMutation,
  useDeleteSignatureMutation,
  uploadSignatureImage 
} from "../../slices/signatureApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaEye, FaArrowLeft, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { useSelector } from "react-redux";

const QuotationEditScreen = () => {
  const componentRef = useRef();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  // --- API Calls ---
  const { data: quotationData, isLoading: isLoadingData } =
    useGetQuotationByQuotationNoQuery(id);
  const { data: defaultData } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const { data: invoiceCompanyInfo } = useGetDefaultInvoiceUsedQuery();

  const [, { isLoading: isLoadingUpload }] =
    useUploadQuotationPDFMutation();
  const [updateQuotationByQuotationNo, { isLoading: isLoadingUpdate }] =
    useUpdateQuotationByQuotationNoMutation();

  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  const { data: signaturesData, refetch: refetchSignatures } = useGetSignaturesQuery();
  const signaturesList = Array.isArray(signaturesData) ? signaturesData : (signaturesData?.signatures || []);
  const [createSignature] = useCreateSignatureMutation();
  const [deleteSignature] = useDeleteSignatureMutation();

  // --- State ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddSignatureModal, setShowAddSignatureModal] = useState(false);
  const [showManageSignatureModal, setShowManageSignatureModal] = useState(false);
  
  const [newSigName, setNewSigName] = useState("");
  const [newSigPosition, setNewSigPosition] = useState("");
  const [newSigImage, setNewSigImage] = useState(null);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [internalContactName, setInternalContactName] = useState("");
  const [internalContactPhone, setInternalContactPhone] = useState("");
  const [selectedSalesSignature, setSelectedSalesSignature] = useState("");
  const [selectedManagerSignature, setSelectedManagerSignature] = useState("");

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [create_date, setcreate_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_present_name: "",
    customer_address: "",
    customer_vat: "",
    buyer_approves_signature: null,
    buyer_approves_signature_date: null,
    branch_type: "สำนักงานใหญ่",
    branch_no: "",
  });

  const [rows, setRows] = useState([]);
  const [defaultSummary, setDefaultSummary] = useState({ discount: 0, vat: 0 });

  // --- Effects ---
  useEffect(() => {
    const firstQuotation = quotationData?.quotation?.[0]?.[0];
    if (!firstQuotation) return;

    if (firstQuotation.date) {
      setcreate_date(firstQuotation.date);
    }

    setCustomerInfo({
      customer_name: firstQuotation.customer_name || "",
      customer_present_name: firstQuotation.customer_present_name || "",
      customer_address: firstQuotation.customer_address || "",
      customer_vat: firstQuotation.customer_vat || "",
      buyer_approves_signature: firstQuotation.buyer_approves_signature,
      buyer_approves_signature_date: firstQuotation.buyer_approves_signature_date,
      branch_type: firstQuotation.branch_type || "สำนักงานใหญ่",
      branch_no: firstQuotation.branch_no || "",
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
    
    if (firstQuotation.note) {
      setNote(firstQuotation.note);
    } else if (defaultSelected?.note && !note) {
      setNote(defaultSelected.note);
    }
    if (firstQuotation.internal_note) {
      setInternalNote(firstQuotation.internal_note);
    }
    if (firstQuotation.internal_contact_name) {
      setInternalContactName(firstQuotation.internal_contact_name);
    }
    if (firstQuotation.internal_contact_phone) {
      setInternalContactPhone(firstQuotation.internal_contact_phone);
    }
    
    setSelectedSalesSignature(firstQuotation.sales_person_signature || defaultSelected?.sales_person || "");
    setSelectedManagerSignature(firstQuotation.sales_manager_signature || defaultSelected?.sales_manager || "");

    const initialRows = quotationData?.quotation?.[0] || [];
    const mappedRows = initialRows.map((item) => ({
        product_id: item.product_id || "",
        description: item.product_detail || "",
        qty: parseFloat(item.quantity) || 0,
        unit: item.unit || "pcs",
        unit_price: parseFloat(item.unit_price) || 0,
    }));
    
    // Add empty row if list is empty
    if(mappedRows.length === 0) {
        mappedRows.push({ product_id: "", description: "", qty: 0, unit: "pcs", unit_price: 0 });
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
    setRows(mappedRows);
  }, [quotationData, defaultSelected]);

  // --- Handlers ---
  const handleCustomerChange = (field, value) =>
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] =
      field === "qty" || field === "unit_price"
        ? value === ""
          ? 0
          : Number(value)
        : value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { product_id: "", description: "", qty: 0, unit: "pcs", unit_price: 0 },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSignature = async () => {
    if (!newSigName || !newSigImage) {
      toast.error("กรุณาระบุชื่อและเลือกไฟล์ลายเซ็น");
      return;
    }
    try {
      setIsUploadingSig(true);
      const uploadRes = await uploadSignatureImage(newSigImage);
      
      await createSignature({
        name: newSigName,
        image_path: uploadRes.image_path || uploadRes.image,
      }).unwrap();
      
      toast.success("เพิ่มลายเซ็นใหม่เรียบร้อยแล้ว");
      setShowAddSignatureModal(false);
      setNewSigName("");
      setNewSigPosition("");
      setNewSigImage(null);
    } catch (err) {
      toast.error(err?.data?.message || err.message || "Failed to add signature");
    } finally {
      setIsUploadingSig(false);
    }
  };

  const handleDeleteSignature = async (id) => {
    if (window.confirm("คุณต้องการลบลายเซ็นนี้ใช่หรือไม่?")) {
      try {
        await deleteSignature(id).unwrap();
        toast.success("ลบลายเซ็นเรียบร้อยแล้ว");
      } catch (err) {
        toast.error(err?.data?.message || err.message || "Failed to delete signature");
      }
    }
  };

  const subTotal = rows.reduce((acc, r) => acc + (r.qty * r.unit_price || 0), 0);
  const totalDiscount = 0;
  const totalAfterDiscount = subTotal - totalDiscount;
  const depositAmount = parseFloat(defaultSummary.deposit || 0);
  const totalAfterDeposit = totalAfterDiscount - depositAmount;
  const totalVat = totalAfterDeposit * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDeposit + totalVat;

  const now = new Date();
  const createDateObj = create_date ? new Date(create_date) : now;
  
  const salesSignatureObj = signaturesList.find(s => s.image_path === selectedSalesSignature);
  const salesName = salesSignatureObj ? salesSignatureObj.name : "";

  const managerSignatureObj = signaturesList.find(s => s.image_path === selectedManagerSignature);
  const managerName = managerSignatureObj ? managerSignatureObj.name : "";

  const mappedOrder = {
    id: quotationNumber || "QT-XXXX",
    quotation_no: quotationNumber || "QT-XXXX",
    createdAt: createDateObj,
    status: "Quoted",
    billingAddress: {
      billingName: customerInfo.customer_name || "",
      billinggAddress: customerInfo.customer_present_name || "",
      billingCity: customerInfo.customer_address || "",
      tax: customerInfo.customer_vat || "",
      branch: customerInfo.branch_type === "สาขา" ? customerInfo.branch_no : customerInfo.branch_type,
    },
    orderItems: rows.filter((r) => r.product_id || r.description).map((item) => ({
      product_id: item.product_id,
      name: item.description,
      qty: item.qty,
      unit: item.unit,
      price: item.unit_price,
    })),
    itemsPrice: subTotal,
    vatPrice: totalVat,
    totalPrice: grandTotal,
    discountPrice: totalDiscount,
    summary: { deposit: depositAmount, discount: totalDiscount, vat: defaultSummary.vat },
    note: note,
    internal_note: internalNote,
    internal_contact_name: internalContactName,
    internal_contact_phone: internalContactPhone,
    signatures: {
      buyer: customerInfo.buyer_approves_signature,
      buyerDate: customerInfo.buyer_approves_signature_date,
      sales: selectedSalesSignature,
      salesName: salesName,
      salesDate: createDateObj, // Default to creation date for existing quotes
      manager: selectedManagerSignature,
      managerName: managerName,
      managerDate: createDateObj,
    }
  };


  // --- PDF Functions ---
  const handlePreviewPDF = () => {
      setShowPreview(true);
  };

  const uploadPDF = async (quotation_no) => {
    if (!componentRef.current) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const canvas = await html2canvas(componentRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const totalPdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = totalPdfHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 5) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }
    const dataUri = pdf.output("datauristring");
    const base64Part = dataUri.split(",")[1];

    const payload = {
      pdfBase64: base64Part,
      filename: `${quotation_no}.pdf`
    };

    // Prompt user to download
    pdf.save(`${quotation_no}.pdf`);

    // Use native fetch with credentials for file uploads
    const res = await fetch("/api/quotations/upload/upload-pdf", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || "PDF upload failed");
    }

    const data = await res.json();
    return data.url;
  };

  const handleUpdateQuotation = async (uploadedPDFUrl = null) => {
    try {
      const payload = {
        quotation_no: quotationNumber,
        date: create_date,
        due_date,
        submit_price_within,
        number_of_credit_days,
        signatures: mappedOrder.signatures,
        quotation_pdf: uploadedPDFUrl || null,
        note: mappedOrder.note,
        internal_note: mappedOrder.internal_note,
        items: rows
          .filter((r) => r.product_id || r.description)
          .map((r) => ({
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
          grand_total: grandTotal,
          total: grandTotal,
          sub_total: subTotal,
          vat: defaultSummary.vat,
          note: note,
  // eslint-disable-next-line no-dupe-keys
  // eslint-disable-next-line no-dupe-keys
        },
        customer: customerInfo,
        signatures: {
          sales_person_signature: selectedSalesSignature,
          sales_manager_signature: selectedManagerSignature,
        },
      };

      await updateQuotationByQuotationNo({ id: quotationNumber, ...payload }).unwrap();
      toast.success("Quotation updated successfully!");
      navigate("/admin/quotations");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update quotation");
    }
  };

  const handleConfirmUpdate = async () => {
    try {
      setShowConfirm(false);
      
      // Force tiny wait so componentRef captures changes correctly
      await new Promise(r => setTimeout(r, 100));
      
      const pdfUrl = await uploadPDF(quotationNumber);
      await handleUpdateQuotation(pdfUrl);
    } catch (error) {
      console.error("Save error:", error);
      const errorMsg = error?.data?.message || error?.data?.error || error?.message || "Failed to save quotation";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to save quotation");
    }
  };

  const isLoadingAll = isLoadingData || isLoadingUpload || isLoadingUpdate;

  if (isLoadingData) {
    return <Loader />;
  }

  return (
    <Container fluid className="py-4 font-prompt bg-light min-vh-100">
      {isLoadingAll && (
        <div
          className="fixed-top w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 9999 }}
        >
          <Loader />
        </div>
      )}

      {/* Action Bar */}
      <Card
        className="shadow-sm border-0 mb-4 rounded-4 sticky-top"
        style={{ zIndex: 1020 }}
      >
        <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="light"
              className="rounded-circle shadow-sm"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
            </Button>
            <h5 className="mb-0 fw-bold text-dark">
              <FaEdit className="me-2 text-primary" /> Edit Quotation: <span className="text-danger">{quotationNumber}</span>
            </h5>
          </div>
          <div className="d-flex gap-2 w-100 w-md-auto">
            <Button
              variant="outline-secondary"
              className="flex-fill"
              onClick={handlePreviewPDF}
            >
              <FaEye className="me-2" />
              Preview PDF
            </Button>
            <Button
              variant="primary"
              className="flex-fill fw-bold shadow-sm"
              onClick={() => setShowConfirm(true)}
            >
              <FaSave className="me-2" />
              Update Quotation
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Row>
        <Col lg={12}>
          {/* Customer Details Form */}
          <Card className="shadow-sm border-0 mb-4 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h6 className="fw-bold mb-0 text-primary">ข้อมูลลูกค้า (Customer Details)</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ชื่อลูกค้า (ผู้ติดต่อ)</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.customer_name}
                      onChange={(e) => handleCustomerChange("customer_name", e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">เลขประจำตัวผู้เสียภาษี</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.customer_vat}
                      onChange={(e) => handleCustomerChange("customer_vat", e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ที่อยู่บรรทัดที่ 1</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.customer_present_name}
                      onChange={(e) => handleCustomerChange("customer_present_name", e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ที่อยู่บรรทัดที่ 2</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.customer_address}
                      onChange={(e) => handleCustomerChange("customer_address", e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">ประเภทสาขา</Form.Label>
                        <Form.Select 
                            value={customerInfo.branch_type} 
                            onChange={(e) => handleCustomerChange("branch_type", e.target.value)}
                        >
                            <option value="สำนักงานใหญ่">สำนักงานใหญ่</option>
                            <option value="สาขา">สาขา</option>
                            <option value="ไม่ระบุ">ไม่ระบุ</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                {customerInfo.branch_type === "สาขา" && (
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">รหัสสาขา</Form.Label>
                            <Form.Control
                            type="text"
                            value={customerInfo.branch_no}
                            onChange={(e) => handleCustomerChange("branch_no", e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Quotation Terms Form */}
          <Card className="shadow-sm border-0 mb-4 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h6 className="fw-bold mb-0 text-primary">เงื่อนไขใบเสนอราคา (Quotation Terms)</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">เครดิต (วัน)</Form.Label>
                    <Form.Control
                      type="number"
                      value={number_of_credit_days}
                      onChange={(e) => setnumber_of_credit_days(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ยืนราคา (วัน)</Form.Label>
                    <Form.Control
                      type="number"
                      value={submit_price_within}
                      onChange={(e) => setsubmit_price_within(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">หมายเหตุ (Note/Remark)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ใส่หมายเหตุ หรือ เงื่อนไขการชำระเงิน"
                    />
                  </Form.Group>
                </Col>
                <Col md={12} className="mt-3">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">หมายเหตุภายใน (Internal Note - ไม่แสดงในใบเสนอราคา)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="กรอกหมายเหตุภายในสำหรับการตรวจสอบ..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">ชื่อที่ติดต่อ (Contact Name - Internal)</Form.Label>
                    <Form.Control
                      type="text"
                      value={internalContactName}
                      onChange={(e) => setInternalContactName(e.target.value)}
                      placeholder="ชื่อผู้ติดต่อ (สำหรับภายใน)"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">เบอร์ที่ใช้ติดต่อ (Contact Phone - Internal)</Form.Label>
                    <Form.Control
                      type="text"
                      value={internalContactPhone}
                      onChange={(e) => setInternalContactPhone(e.target.value)}
                      placeholder="เบอร์โทรศัพท์ (สำหรับภายใน)"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="small fw-bold text-muted mb-0">ลายเซ็นผู้เสนอราคา (Sales Person)</Form.Label>
                      <div>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none text-danger me-3" onClick={() => setShowManageSignatureModal(true)}>จัดการลายเซ็น</Button>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowAddSignatureModal(true)}>+ เพิ่มลายเซ็นใหม่</Button>
                      </div>
                    </div>
                    <Form.Select
                      value={selectedSalesSignature}
                      onChange={(e) => setSelectedSalesSignature(e.target.value)}
                    >
                      <option value="">-- ไม่ระบุ (No Signature) --</option>
                      {signaturesList.map((sig, index) => (
                        <option key={sig._id || index} value={sig.image_path}>
                          {sig.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="small fw-bold text-muted mb-0">ลายเซ็นผู้อนุมัติ (Manager)</Form.Label>
                      <div>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none text-danger me-3" onClick={() => setShowManageSignatureModal(true)}>จัดการลายเซ็น</Button>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowAddSignatureModal(true)}>+ เพิ่มลายเซ็นใหม่</Button>
                      </div>
                    </div>
                    <Form.Select
                      value={selectedManagerSignature}
                      onChange={(e) => setSelectedManagerSignature(e.target.value)}
                    >
                      <option value="">-- ไม่ระบุ (No Signature) --</option>
                      {signaturesList.map((sig, index) => (
                        <option key={sig._id || index} value={sig.image_path}>
                          {sig.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Items Form */}
          <Card className="shadow-sm border-0 mb-4 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-primary">รายการสินค้า (Items)</h6>
              <Button variant="outline-primary" size="sm" onClick={addRow} className="rounded-pill px-3">
                <FaPlus className="me-2" /> เพิ่มรายการ
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover size="sm" className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-center" style={{width: '5%'}}>#</th>
                      <th style={{width: '15%'}}>รหัสสินค้า</th>
                      <th style={{width: '35%'}}>รายละเอียด</th>
                      <th className="text-center" style={{width: '10%'}}>จำนวน</th>
                      <th className="text-center" style={{width: '10%'}}>หน่วย</th>
                      <th className="text-end" style={{width: '15%'}}>ราคา/หน่วย</th>
                      <th className="text-end" style={{width: '10%'}}>รวม</th>
                      <th className="text-center" style={{width: '5%'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-center text-muted small">{idx + 1}</td>
                        <td>
                          <Form.Control
                            size="sm"
                            className="border-0 shadow-none bg-transparent"
                            value={row.product_id}
                            placeholder="รหัส"
                            onChange={(e) => handleChange(idx, "product_id", e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            size="sm"
                            className="border-0 shadow-none bg-transparent"
                            style={{ resize: "none" }}
                            placeholder="รายละเอียดสินค้า"
                            value={row.description}
                            onChange={(e) => handleChange(idx, "description", e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            className="border-0 shadow-none bg-transparent text-center"
                            value={row.qty}
                            onChange={(e) => handleChange(idx, "qty", e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            className="border-0 shadow-none bg-transparent text-center"
                            value={row.unit}
                            onChange={(e) => handleChange(idx, "unit", e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            className="border-0 shadow-none bg-transparent text-end"
                            value={row.unit_price}
                            onChange={(e) => handleChange(idx, "unit_price", e.target.value)}
                          />
                        </td>
                        <td className="text-end fw-bold small text-primary">
                          {row.qty && row.unit_price ? (row.qty * row.unit_price).toFixed(2) : "-"}
                        </td>
                        <td className="text-center">
                          <Button variant="link" className="text-danger p-0" onClick={() => removeRow(idx)}>
                            <FaTrash size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Summary Bottom */}
              <div className="d-flex justify-content-end mt-3">
                <div style={{ width: "300px" }} className="bg-light p-3 rounded-4">
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-muted fw-bold">รวมเป็นเงิน</span>
                    <span className="fw-bold">{subTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2 small align-items-center">
                    <span className="text-muted fw-bold">มัดจำ / Deposit</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="text-end"
                      style={{ width: "100px" }}
                      value={defaultSummary.deposit}
                      onChange={(e) =>
                        setDefaultSummary({ ...defaultSummary, deposit: e.target.value })
                      }
                    />
                  </div>
                  <div className="d-flex justify-content-between mb-2 small align-items-center">
                    <span className="text-muted fw-bold">VAT %</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="text-end"
                      style={{ width: "60px" }}
                      value={defaultSummary.vat}
                      onChange={(e) =>
                        setDefaultSummary({ ...defaultSummary, vat: e.target.value })
                      }
                    />
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold text-dark">จำนวนเงินรวมทั้งสิ้น</span>
                    <span className="fw-bold text-success fs-5">{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hidden element for PDF rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={componentRef}>
              <FullTaxInvoiceA4
                  order={mappedOrder}
                  companyInfo={invoiceCompanyInfo}
                  isQuotation={true}
                  isAdmin={userInfo?.isAdmin}
                  docType="quotation"
                  printMode="full"
              />
          </div>
      </div>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered>
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="fw-bold text-primary">
            <FaEye className="me-2" />
            Live Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-secondary overflow-auto d-flex justify-content-center" style={{ maxHeight: "80vh" }}>
           <div className="my-4 shadow-lg">
             <FullTaxInvoiceA4
                order={mappedOrder}
                companyInfo={invoiceCompanyInfo}
                isQuotation={true}
                isAdmin={userInfo?.isAdmin}
                docType="quotation"
             />
           </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => { setShowPreview(false); setShowConfirm(true); }}>
            Update Quotation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            <FaEdit className="me-2" />
            Confirm Update
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to update this quotation? This will regenerate the PDF.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmUpdate}>
            Yes, Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Signature Modal */}
      <Modal show={showAddSignatureModal} onHide={() => setShowAddSignatureModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            <FaPlus className="me-2" />
            เพิ่มลายเซ็นใหม่ (Add New Signature)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">ชื่อ-นามสกุล (Name) <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text" 
              placeholder="เช่น นาย ภาวินท์ เทคโนโลยี" 
              value={newSigName}
              onChange={(e) => setNewSigName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">ตำแหน่ง (Position)</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="เช่น ผู้จัดการ (Manager)" 
              value={newSigPosition}
              onChange={(e) => setNewSigPosition(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">ไฟล์รูปภาพลายเซ็น <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="file" 
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setNewSigImage(e.target.files[0])}
            />
            <Form.Text className="text-muted">แนะนำให้ใช้ไฟล์ภาพ PNG พื้นหลังโปร่งใส</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowAddSignatureModal(false)} disabled={isUploadingSig}>
            ยกเลิก (Cancel)
          </Button>
          <Button variant="primary" onClick={handleUploadSignature} disabled={isUploadingSig}>
            {isUploadingSig ? <Loader /> : "บันทึก (Save Signature)"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Manage Signature Modal */}
      <Modal show={showManageSignatureModal} onHide={() => setShowManageSignatureModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">จัดการลายเซ็น (Manage Signatures)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {signaturesList.length === 0 ? (
            <p className="text-center text-muted my-4">ไม่มีลายเซ็นในระบบ</p>
          ) : (
            <Table hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>ลายเซ็น</th>
                  <th>ชื่อ</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {signaturesList.map((sig) => (
                  <tr key={sig._id}>
                    <td>
                      <img 
                        src={sig.image_path} 
                        alt={sig.name} 
                        style={{ height: "40px", objectFit: "contain" }} 
                      />
                    </td>
                    <td>{sig.name}</td>
                    <td className="text-center">
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSignature(sig._id)}>
                        <FaTrash /> ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowManageSignatureModal(false)}>
            ปิด (Close)
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuotationEditScreen;
