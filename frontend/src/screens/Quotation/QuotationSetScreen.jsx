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
  useCreateQuotationMutation,
  useUpdateQuotationByQuotationNoMutation,
  useUploadQuotationPDFMutation,
  useGetNextQuotationNumberQuery,
} from "../../slices/quotationApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaFilePdf, FaSave, FaEye, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { useSelector } from "react-redux";

const QuotationSetSelectedCustomerScreen = () => {
  const componentRef = useRef();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  // --- State ---
  const [showConfirm, setShowConfirm] = useState(false);
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  const [showPreview, setShowPreview] = useState(false);

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");

  // --- API Hooks ---
  const { data: defaultData, isLoading } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const { data: invoiceCompanyInfo } = useGetDefaultInvoiceUsedQuery();
  const { data: nextNoData, isLoading: isLoadingNextNo } = useGetNextQuotationNumberQuery();

  const [createQuotation, { isLoading: isLoadingCreate }] =
    useCreateQuotationMutation();
  const [uploadQuotationPDF, { isLoading: isLoadingUpload }] =
    useUploadQuotationPDFMutation();
  const [updateQuotationByQuotationNo, { isLoading: isLoadingUpdate }] =
    useUpdateQuotationByQuotationNoMutation();

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

  // --- Effects ---
  useEffect(() => {
    if (defaultSelected) {
      setRows((prevRows) => {
        const initialRows = (defaultSelected.items || []).map((item) => ({
          ...item,
          qty: parseFloat(item.qty) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
        }));
        return initialRows.length > 0 ? initialRows : prevRows;
      });

      setDefaultSummary({
        ...defaultSelected,
        discount: parseFloat(defaultSelected.discount) || 0,
        vat: parseFloat(defaultSelected.vat) || 7, // Default VAT 7%
        deposit: parseFloat(defaultSelected.deposit) || 0,
      });
    }
  }, [defaultSelected]);

  useEffect(() => {
    if (nextNoData && nextNoData.nextQuotationNo && !quotationNumber) {
      setQuotationNumber(nextNoData.nextQuotationNo);
    }
  }, [nextNoData, quotationNumber]);

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
  const totalDiscount = parseFloat(defaultSummary.discount || 0);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat = totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const now = new Date();
  const todayDate = new Date();
  const today = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear() + 543}`;

  const mappedOrder = {
    id: quotationNumber || "QT-XXXX",
    quotation_no: quotationNumber || "QT-XXXX",
    createdAt: todayDate,
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
    signatures: {
      sales: defaultSelected?.sales_person,
      manager: defaultSelected?.sales_manager,
    }
  };

  // --- PDF Functions ---
  const handlePreviewPDF = () => {
    setShowPreview(true);
  };

  const uploadPDF = async (quotation_no) => {
    if (!componentRef.current) return null;
    
    // Temporarily hide the no-print class elements if any exist in the componentRef, 
    // though FullTaxInvoiceA4 handles print styling itself.
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

  const handleUpdateQuotation = async (id, quotation_no, pdfResponse) => {
    try {
      const payload = {
        quotation_no,
        quotation_pdf: pdfResponse,
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
          sales_person_signature: defaultSelected?.sales_person,
          sales_manager_signature: defaultSelected?.sales_manager,
        },
      };
      await updateQuotationByQuotationNo({ id, ...payload }).unwrap();
    } catch (error) {
      toast.error("Failed to update quotation detail.");
    }
  };

  const handleCreateQuotation = async () => {
    try {
      // Create first to get the ID and Number
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
          sales_person_signature: defaultSelected?.sales_person,
          sales_manager_signature: defaultSelected?.sales_manager,
        },
      };
      const result = await createQuotation(payload).unwrap();
      setQuotationNumber(result.quotation_no);
      
      // Update the mapped order object with the new quotation number so it renders in the PDF correctly
      mappedOrder.id = result.quotation_no;
      mappedOrder.quotation_no = result.quotation_no;

      // Force a tiny wait so React can render the preview with the new quotation_no if it was visible
      await new Promise(r => setTimeout(r, 100));

      const pdfResponse = await uploadPDF(result.quotation_no);
      if (pdfResponse) {
          await handleUpdateQuotation(result.id, result.quotation_no, pdfResponse);
      }
      toast.success("Quotation created successfully!");
      navigate("/admin/quotations");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create quotation.");
    }
  };

  const handleConfirmCreate = () => {
    handleCreateQuotation();
    handleCloseConfirm();
  };
  const isLoadingAll =
    isLoading || isLoadingCreate || isLoadingUpload || isLoadingUpdate || isLoadingNextNo;

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
              <FaFilePdf className="me-2 text-danger" /> Create Quotation
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
                    <span className="text-muted fw-bold">ส่วนลด</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="text-end"
                      style={{ width: "100px" }}
                      value={defaultSummary.discount}
                      onChange={(e) =>
                        setDefaultSummary({ ...defaultSummary, discount: e.target.value })
                      }
                    />
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-muted fw-bold">ราคาหลังหักส่วนลด</span>
                    <span className="fw-bold">{totalAfterDiscount.toFixed(2)}</span>
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
          Are you sure you want to create and save this quotation?
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

    </Container>
  );
};

export default QuotationSetSelectedCustomerScreen;
