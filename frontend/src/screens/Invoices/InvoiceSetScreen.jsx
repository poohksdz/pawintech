/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Row,
  Col,
  Modal,
  Form,
  Card,
  Container,
  Table
} from "react-bootstrap";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import {
  useCreateInvoiceMutation,
  useUpdateInvoiceByInvoiceNoMutation,
  useUploadInvoicePDFMutation,
  useGetNextInvoiceNumberQuery,
} from "../../slices/invoicesApiSlice";
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
import { useNavigate, useLocation } from "react-router-dom";
import { FaFilePdf, FaSave, FaEye, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import { useGetQuotationByQuotationNoQuery } from "../../slices/quotationApiSlice";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { useSelector } from "react-redux";

const InvoiceSetScreen = () => {
  const componentRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.auth);
  
  const convertFromQuotationNo = location.state?.convertFromQuotationNo;
  const { data: quotationDataToConvert, isLoading: isLoadingQuotation } = 
    useGetQuotationByQuotationNoQuery(convertFromQuotationNo, { skip: !convertFromQuotationNo });

  // --- State ---
  const [showConfirm, setShowConfirm] = useState(false);
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");

  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [internalContactName, setInternalContactName] = useState("");
  const [internalContactPhone, setInternalContactPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState(""); // "", "cash", "check", "transfer"
  const [paymentCheckBank, setPaymentCheckBank] = useState("");
  const [paymentTransferDate, setPaymentTransferDate] = useState("");
  const [paymentTransferRef, setPaymentTransferRef] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [selectedSalesSignature, setSelectedSalesSignature] = useState("");
  const [selectedManagerSignature, setSelectedManagerSignature] = useState("");

  const [showManageSignatureModal, setShowManageSignatureModal] = useState(false);
  const [showAddSignatureModal, setShowAddSignatureModal] = useState(false);
  const [newSigName, setNewSigName] = useState("");
  const [newSigPosition, setNewSigPosition] = useState("");
  const [newSigImage, setNewSigImage] = useState(null);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  // --- API Hooks ---
  const { data: defaultData, isLoading } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const { data: invoiceCompanyInfo } = useGetDefaultInvoiceUsedQuery();
  const { data: nextNoData, isLoading: isLoadingNextNo } = useGetNextInvoiceNumberQuery();

  const [createInvoice, { isLoading: isLoadingCreate }] =
    useCreateInvoiceMutation();
  const [uploadInvoicePDF, { isLoading: isLoadingUpload }] =
    useUploadInvoicePDFMutation();
  const [updateInvoiceByInvoiceNo, { isLoading: isLoadingUpdate }] =
    useUpdateInvoiceByInvoiceNoMutation();

  const { data: signaturesData, refetch: refetchSignatures } = useGetSignaturesQuery();
  const signaturesList = Array.isArray(signaturesData) ? signaturesData : (signaturesData?.signatures || []);
  const [createSignature] = useCreateSignatureMutation();
  const [deleteSignature] = useDeleteSignatureMutation();

  const [customerInfo, setCustomerInfo] = useState({
    id: "",
    customer_name: "",
    customer_present_name: "",
    customer_address: "",
    customer_vat: "",
    branch_type: "สำนักงานใหญ่",
    branch_no: "",
  });

  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({
      product_id: "",
      description: "",
      qty: 0,
      unit: "pcs",
      unit_price: 0,
    })),
  );

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
    bank_account_number: "",
  });

  const handleUploadSignature = async () => {
    if (!newSigName || !newSigImage) {
      toast.warning("กรุณากรอกชื่อและเลือกไฟล์รูปภาพ");
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
      refetchSignatures();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น");
    } finally {
      setIsUploadingSig(false);
    }
  };

  const handleDeleteSignature = async (id) => {
    if (window.confirm("คุณต้องการลบลายเซ็นนี้ใช่หรือไม่?")) {
      try {
        await deleteSignature(id).unwrap();
        toast.success("ลบลายเซ็นเรียบร้อยแล้ว");
        if (selectedSalesSignature && signaturesList.find(s => s._id === id)?.image_path === selectedSalesSignature) {
          setSelectedSalesSignature("");
        }
        if (selectedManagerSignature && signaturesList.find(s => s._id === id)?.image_path === selectedManagerSignature) {
          setSelectedManagerSignature("");
        }
        refetchSignatures();
      } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการลบลายเซ็น");
      }
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (defaultSelected && !quotationDataToConvert) {
      setDefaultSummary({
        ...defaultSelected,
        discount: parseFloat(defaultSelected.discount) || 0,
        vat: parseFloat(defaultSelected.vat) || 7, // Default VAT 7%
        deposit: parseFloat(defaultSelected.deposit) || 0,
      });
      if (!convertFromQuotationNo) {
        setNote(defaultSelected.note || "");
      }
    }
  }, [defaultSelected, quotationDataToConvert, convertFromQuotationNo]);

  useEffect(() => {
    if (convertFromQuotationNo && quotationDataToConvert?.quotation?.[0]?.[0]) {
      const q = quotationDataToConvert.quotation[0][0];
      if (q.note && !note) setNote(q.note);
      if (q.internal_note && !internalNote) setInternalNote(q.internal_note);
      if (q.internal_contact_name && !internalContactName) setInternalContactName(q.internal_contact_name);
      if (q.internal_contact_phone && !internalContactPhone) setInternalContactPhone(q.internal_contact_phone);
    }
    if (quotationDataToConvert?.quotation?.length > 0) {
      const itemsArray = Array.isArray(quotationDataToConvert.quotation[0])
        ? quotationDataToConvert.quotation[0]
        : quotationDataToConvert.quotation;

      if (itemsArray && itemsArray.length > 0) {
        const firstItem = itemsArray[0];
        
        setCustomerInfo({
          id: "",
          customer_name: firstItem.customer_name || "",
          customer_present_name: firstItem.customer_present_name || "",
          customer_address: firstItem.customer_address || "",
          customer_vat: firstItem.customer_vat || "",
          branch_type: firstItem.branch_type || "สำนักงานใหญ่",
          branch_no: firstItem.branch_no || "",
        });

        setdue_date(firstItem.due_date || "");
        setnumber_of_credit_days(firstItem.number_of_credit_days || "");
        
        setDefaultSummary((prev) => ({
          ...prev,
          discount: parseFloat(firstItem.discount) || 0,
          vat: parseFloat(firstItem.vat) || 7,
        }));

        const newRows = itemsArray.map((qItem) => ({
          product_id: qItem.product_id || "",
          description: qItem.product_detail || qItem.description || "",
          qty: parseFloat(qItem.quantity || qItem.qty) || 0,
          unit: qItem.unit || "pcs",
          unit_price: parseFloat(qItem.unit_price) || 0,
        }));
        setRows(newRows.length > 0 ? newRows : rows);
        toast.info("Invoice pre-filled from Quotation!");
      }
    }
  }, [quotationDataToConvert]);

  useEffect(() => {
    if (nextNoData && nextNoData.nextInvoiceNo && !invoiceNumber) {
      setInvoiceNumber(nextNoData.nextInvoiceNo);
    }
  }, [nextNoData, invoiceNumber]);

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

  // --- Calculation ---
  const subTotal = rows.reduce((acc, r) => acc + (r.qty * r.unit_price || 0), 0);
  const totalDiscount = 0;
  const totalAfterDiscount = subTotal - totalDiscount;
  const depositAmount = parseFloat(defaultSummary.deposit || 0);
  const totalAfterDeposit = totalAfterDiscount - depositAmount;
  const totalVat = totalAfterDeposit * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDeposit + totalVat;

  const now = new Date();
  const todayDate = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear() + 543}`;

  const mappedOrder = {
    id: invoiceNumber || "INV-XXXX",
    quotation_no: invoiceNumber || "INV-XXXX", // Re-using quotation_no field for FullTaxInvoiceA4 compatibility
    createdAt: todayDate,
    status: "Invoiced",
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
      salesDate: todayDate,
      manager: selectedManagerSignature,
      managerDate: todayDate,
    },
    paymentDetails: {
      paymentMethod,
      paymentCheckBank,
      paymentTransferDate,
      paymentTransferRef,
      paymentAmount: paymentAmount !== "" ? Number(paymentAmount) : grandTotal,
    }
  };

  // --- PDF Functions ---
  const handlePreviewPDF = () => {
    setShowPreview(true);
  };

  const uploadPDF = async (invoice_no) => {
    if (!componentRef.current) return null;
    
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

    const formData = new FormData();
    formData.append(
      "invoice_pdf",
      pdf.output("blob"),
      `${invoice_no}.pdf`
    );

    const response = await uploadInvoicePDF(formData).unwrap();
    pdf.save(`${invoice_no}.pdf`);
    return response.url;
  };

  const handleUpdateInvoice = async (id, invoice_no, pdfResponse) => {
    try {
      const payload = {
        invoice_no,
        invoice_pdf: pdfResponse,
        date: today,
        due_date,
        submit_price_within,
        number_of_credit_days,
        items: rows
          .filter((r) => r.product_id || r.description)
          .map((r) => ({ ...r, amount_money: r.qty * r.unit_price })),
        summary: {
          ...defaultSummary,
          sub_total: subTotal,
          total_after_discount: totalAfterDiscount,
          grand_total: grandTotal,
          total: grandTotal,
        },
        customer: customerInfo,
        signatures: {
          sales_person_signature: selectedSalesSignature,
          sales_manager_signature: selectedManagerSignature,
        },
      };
      await updateInvoiceByInvoiceNo({ id, ...payload }).unwrap();
    } catch (error) {
      toast.error("Failed to update invoice detail.");
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setIsProcessingPDF(true);
      const payload = {
        due_date,
        submit_price_within,
        number_of_credit_days,
        date: today,
        items: rows
          .filter((row) => row.product_id || row.description)
          .map((r) => ({
            ...r,
            qty: Number(r.qty),
            unit_price: Number(r.unit_price),
            amount_money: Number(r.qty) * Number(r.unit_price),
          })),
        customer: { ...customerInfo },
        summary: { ...defaultSummary, total: grandTotal },
        signatures: {
          sales_person_signature: selectedSalesSignature,
          sales_manager_signature: selectedManagerSignature,
        },
        payment_details: {
          paymentMethod,
          paymentCheckBank,
          paymentTransferDate,
          paymentTransferRef,
          paymentAmount: paymentAmount !== "" ? Number(paymentAmount) : grandTotal,
        },
        note: note,
        internal_note: internalNote,
        internal_contact_name: internalContactName,
        internal_contact_phone: internalContactPhone,
      };
      const result = await createInvoice(payload).unwrap();
      setInvoiceNumber(result.invoice_no);
      
      mappedOrder.id = result.invoice_no;
      mappedOrder.quotation_no = result.invoice_no;

      await new Promise(r => setTimeout(r, 100));

      const pdfResponse = await uploadPDF(result.invoice_no);
      if (pdfResponse) {
          await handleUpdateInvoice(result.invoice_no, result.invoice_no, pdfResponse);
      }
      toast.success("Invoice created successfully!");
      navigate("/admin/invoicelist");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create invoice.");
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleConfirmCreate = () => {
    handleCreateInvoice();
    handleCloseConfirm();
  };
  
  const isLoadingAll =
    isLoading || isLoadingCreate || isLoadingUpload || isLoadingUpdate || isLoadingNextNo || isLoadingQuotation || isProcessingPDF;

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
              <FaFilePdf className="me-2 text-danger" /> Create Invoice
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
              onClick={handleOpenConfirm}
            >
              <FaSave className="me-2" />
              Save & Create
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

          {/* Invoice Terms Form */}
          <Card className="shadow-sm border-0 mb-4 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h6 className="fw-bold mb-0 text-primary">เงื่อนไขการชำระเงิน (Payment Terms)</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">เครดิต (วัน)</Form.Label>
                    <Form.Control
                      type="number"
                      value={number_of_credit_days}
                      onChange={(e) => setnumber_of_credit_days(e.target.value)}
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
                    <Form.Label className="small fw-bold text-muted">หมายเหตุภายใน (Internal Note - ไม่แสดงในใบแจ้งหนี้)</Form.Label>
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
                      <Form.Label className="small fw-bold text-muted mb-0">ลายเซ็นผู้ขาย (Sales Person)</Form.Label>
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

          {/* Payment Configuration Form */}
          <Card className="shadow-sm border-0 mb-4 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0">
              <h6 className="fw-bold mb-0 text-primary">ข้อมูลการชำระเงิน (Payment Details)</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">วิธีชำระเงิน (Payment Method)</Form.Label>
                    <div className="d-flex gap-4">
                      <Form.Check
                        type="radio"
                        label="ยังไม่ระบุ (None)"
                        name="paymentMethod"
                        checked={paymentMethod === ""}
                        onChange={() => setPaymentMethod("")}
                      />
                      <Form.Check
                        type="radio"
                        label="เงินสด (Cash)"
                        name="paymentMethod"
                        checked={paymentMethod === "cash"}
                        onChange={() => setPaymentMethod("cash")}
                      />
                      <Form.Check
                        type="radio"
                        label="เช็คธนาคาร (Check)"
                        name="paymentMethod"
                        checked={paymentMethod === "check"}
                        onChange={() => setPaymentMethod("check")}
                      />
                      <Form.Check
                        type="radio"
                        label="เงินโอน (Transfer)"
                        name="paymentMethod"
                        checked={paymentMethod === "transfer"}
                        onChange={() => setPaymentMethod("transfer")}
                      />
                    </div>
                  </Form.Group>
                </Col>

                {paymentMethod === "check" && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">เช็คธนาคาร (Bank / Check Info)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="ระบุชื่อธนาคาร / สาขา / อื่นๆ"
                        value={paymentCheckBank}
                        onChange={(e) => setPaymentCheckBank(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                )}

                {paymentMethod === "transfer" && (
                  <>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">เงินโอนวันที่ (Transfer Date)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="เช่น 12/10/2566 หรือ 12 ต.ค. 66"
                          value={paymentTransferDate}
                          onChange={(e) => setPaymentTransferDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted">เลขที่ (Ref / Account No.)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="ระบุเลขที่อ้างอิง"
                          value={paymentTransferRef}
                          onChange={(e) => setPaymentTransferRef(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}

                {(paymentMethod !== "") && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">จำนวนเงิน (Amount - ว่างไว้เพื่อใช้ยอดสุทธิ)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="ระบุจำนวนเงินที่ชำระ (หรือปล่อยว่างเพื่อใช้ยอด Grand Total)"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                )}
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
                  isQuotation={false}
                  isAdmin={userInfo?.isAdmin}
                  docType="invoice"
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
                isQuotation={false}
                isAdmin={userInfo?.isAdmin}
                docType="invoice"
             />
           </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => { setShowPreview(false); handleOpenConfirm(); }}>
            Save & Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Modal */}
      <Modal show={showConfirm} onHide={handleCloseConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            <FaSave className="me-2" />
            Confirm Creation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to create and save this invoice?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCloseConfirm}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmCreate}>
            Yes, Create
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

export default InvoiceSetScreen;
