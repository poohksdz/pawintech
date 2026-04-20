import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Modal } from "react-bootstrap";
import { useGetDefaultQuotationUsedQuery } from "../../slices/quotationDefaultApiSlice";
import {
  useCreateQuotationMutation,
  useGetQuotationDetailsQuery,
  useUpdateQuotationByQuotationNoMutation,
  useUploadQuotationPDFMutation,
  useGetQuotationByQuotationNoQuery,
} from "../../slices/quotationApiSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const QuotationSetSelectedCustomerScreen = () => {
  const componentRef = useRef();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data,
    isLoading: isLoadingData,
  } = useGetQuotationDetailsQuery(id);

  const customerInfo = data?.quotation || null;

  const [showConfirm, setShowConfirm] = useState(false);

  const [create_date, setcreate_date] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear() + 543; // Thai year
    return `${day} / ${month} / ${year}`; // e.g., "25 / 09 / 2568"
  });

  const [today, setToday] = useState(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")} / ${String(now.getMonth() + 1).padStart(2, "0")} / ${now.getFullYear() + 543}`;
  });

  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  const [quotationNumber, setQuotationNumber] = useState("");
  const [due_date, setdue_date] = useState("");
  const [submit_price_within, setsubmit_price_within] = useState("");
  const [number_of_credit_days, setnumber_of_credit_days] = useState("");

  const {
    data: defaultData,
    isLoading,
    isError,
    error,
  } = useGetDefaultQuotationUsedQuery();
  const defaultSelected = defaultData?.quotations?.[0] || null;

  const [
    createQuotation,
    { isLoading: isLoadingCreateQuotation },
  ] = useCreateQuotationMutation();
  const [
    uploadQuotationPDF,
    { isLoading: isLoadingUploadQuotationPDF },
  ] = useUploadQuotationPDFMutation();
  const [
    updateQuotationByQuotationNo,
    { isLoading: isLoadingUpdateQuotationByQuotationNo },
  ] = useUpdateQuotationByQuotationNoMutation();

  const [numRows, setNumRows] = useState(10); // default 10 rows
  const [rows, setRows] = useState(
    Array.from({ length: numRows }, () => ({
      product_id: "",
      description: "",
      qty: 0,
      unit: "",
      unit_price: 0,
    })),
  );

  // // Generate 10 default rows
  // const defaultRows = Array.from({ length: 10 }, (_, i) => ({
  //   product_id: `P${String(i + 1).padStart(3, "0")}`,
  //   description: `Product description ${i + 1}`,
  //   qty: Math.floor(Math.random() * 10) + 1,
  //   unit: "pcs",
  //   unit_price: parseFloat((Math.random() * 100).toFixed(2)),
  // }));
  const [defaultSummary, setDefaultSummary] = useState({});

  const [editableCustomer, setEditableCustomer] = useState({
    customer_name: customerInfo?.customer_name || "",
    customer_present_name: customerInfo?.customer_present_name || "",
    customer_address: customerInfo?.customer_address || "",
    customer_vat: customerInfo?.customer_vat || "",
  });

  useEffect(() => {
    if (customerInfo) {
      setEditableCustomer({
        customer_name: customerInfo.customer_name || "",
        customer_present_name: customerInfo.customer_present_name || "",
        customer_address: customerInfo.customer_address || "",
        customer_vat: customerInfo.customer_vat || "",
      });
    }
  }, [customerInfo]);

  const handleCustomerChange = (field, value) => {
    setEditableCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
    const hasData = Object.values(lastRow).some(
      (val) => val !== "" && val !== 0,
    );
    if (hasData) {
      setRows((prev) => [
        ...prev,
        { product_id: "", description: "", qty: 0, unit: "", unit_price: 0 },
      ]);
    }
  };

  useEffect(() => {
    if (defaultSelected) {
      const initialRows = (defaultSelected.items || []).map((item) => ({
        product_id: item.product_id || "",
        description: item.description || "",
        qty: parseFloat(item.qty) || 0,
        unit: item.unit || "",
        unit_price: parseFloat(item.unit_price) || 0,
      }));
      setRows(initialRows.length > 0 ? initialRows : rows);

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
  }, [defaultData]);

  if (isLoading) return <p>Loading...</p>;
  if (isError)
    return <p>Error: {error?.message || "Failed to load default quotation"}</p>;

  const subTotal = rows.reduce((acc, r) => acc + r.qty * r.unit_price, 0);
  const totalDiscount =
    subTotal * (parseFloat(defaultSummary.discount || 0) / 100);
  const totalAfterDiscount = subTotal - totalDiscount;
  const totalVat =
    totalAfterDiscount * (parseFloat(defaultSummary.vat || 0) / 100);
  const grandTotal = totalAfterDiscount + totalVat;

  const autoGrow = (e) => {
    e.target.style.height = "20px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handlePreviewPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const tableEl = componentRef.current;
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

  const handleAutoDownloadPDF = async (quotation_no) => {
    if (!componentRef.current) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const tableEl = componentRef.current;
    const canvas = await html2canvas(tableEl, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    // Fit the image into the PDF page
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Use quotation_no in filename
    pdf.save(`quotation_${quotation_no || Date.now()}.pdf`);
  };

  const uploadPDF = async (quotation_no) => {
    if (!componentRef.current) return;

    // Force the quotation number to appear in the DOM immediately
    const numberSpan = document.getElementById("quotation_no_span");
    if (numberSpan) numberSpan.textContent = quotation_no;

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvas = await html2canvas(componentRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const pdfBlob = pdf.output("blob");
    const formData = new FormData();
    formData.append(
      "quotationPDF",
      pdfBlob,
      `Quotation_${quotation_no || Date.now()}.pdf`,
    );

    const response = await uploadQuotationPDF(formData).unwrap();
    // console.log("PDF uploaded:", response);

    return response.url;
  };

  const handleUpdateQuotation = async (quotation_no, pdfPath) => {
    try {
      const payload = {
        quotation_no,
        quotation_pdf: pdfPath,
        date: create_date,
        due_date,
        submit_price_within,
        number_of_credit_days,
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
          vat: defaultSummary.vat,
          deposit: defaultSummary.deposit,
          grand_total: grandTotal,
          total: grandTotal,
          bank_account_name: defaultSummary.bank_account_name,
          bank_account_number: defaultSummary.bank_account_number,
        },
        customer: {
          customer_name: editableCustomer.customer_name,
          customer_present_name: editableCustomer.customer_present_name,
          customer_address: editableCustomer.customer_address,
          customer_vat: editableCustomer.customer_vat,
        },
        signatures: {
          buyer_approves_signature:
            customerInfo.buyer_approves_signature || null,
          buyer_approves_signature_date:
            customerInfo.buyer_approves_signature_date || null,
          sales_person_signature: defaultSelected?.sales_person || null,
          sales_person_signature_date:
            defaultSelected?.sales_person_signature_date || null,
          sales_manager_signature: defaultSelected?.sales_manager || null,
          sales_manager_signature_date:
            defaultSelected?.sales_manager_signature_date || null,
        },
      };

      await updateQuotationByQuotationNo({ id, ...payload }).unwrap();
      await handleAutoDownloadPDF(quotation_no);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload quotation.");
    }
  };

  const handleCreateQuotation = async () => {
    try {
      // 1. Prepare payload WITHOUT PDF first
      const payload = {
        date: create_date,
        due_date,
        submit_price_within,
        number_of_credit_days,
        items: rows
          .filter((row) => row.product_id || row.description)
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
          vat: defaultSummary.vat,
          deposit: defaultSummary.deposit,
          total_after_discount: totalAfterDiscount,
          grand_total: grandTotal,
          bank_account_name: defaultSummary.bank_account_name,
          bank_account_number: defaultSummary.bank_account_number,
        },
        customer: {
          customer_name: editableCustomer.customer_name,
          customer_present_name: editableCustomer.customer_present_name,
          customer_address: editableCustomer.customer_address,
          customer_vat: editableCustomer.customer_vat,
        },
        signatures: {
          buyer_approves_signature:
            customerInfo.buyer_approves_signature || null,
          buyer_approves_signature_date:
            customerInfo.buyer_approves_signature_date || null,
          sales_person_signature: defaultSelected?.sales_person || null,
          sales_person_signature_date:
            defaultSelected?.sales_person_signature_date || null,
          sales_manager_signature: defaultSelected?.sales_manager || null,
          sales_manager_signature_date:
            defaultSelected?.sales_manager_signature_date || null,
        },
      };

      // 1. Create quotation
      const result = await createQuotation(payload).unwrap();

      // 2. Immediately set the quotation number in state
      setQuotationNumber(result.quotation_no);

      // 3. Wait for the state to be applied (or just pass quotation_no directly)
      const pdfResponse = await uploadPDF(result.quotation_no); // pass number explicitly

      // 4. Update quotation with PDF path
      await handleUpdateQuotation(result.quotation_no, pdfResponse);

      toast.success("Quotation created successfully!");

      // navigate("/admin/quotations")
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast.error("Failed to create quotation.");
    }
  };

  const handleConfirmCreate = () => {
    handleCreateQuotation(); // call your actual function
    handleCloseConfirm(); // close the modal
  };

  return (
    <>
      {isLoading ||
      isLoadingData ||
      isLoadingCreateQuotation ||
      isLoadingUploadQuotationPDF ||
      isLoadingUpdateQuotationByQuotationNo ? (
        <Loader />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              backgroundColor: "#f0f0f0",
              padding: "5px 0",
            }}
          >
            <div
              ref={componentRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "3mm 20mm 5mm",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                fontSize: "12px",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: 30, left: 0 }}>
                  <img
                    src={defaultSelected?.logo}
                    alt="Logo"
                    style={{ maxHeight: "35px", objectFit: "contain" }}
                  />
                </div>
                <div style={{ display: "inline-block", marginTop: "10px" }}>
                  <h3 className="fw-bold">
                    {defaultSummary.company_name_thai}
                    <br />
                    {defaultSummary.company_name}
                  </h3>
                  <p>
                    <strong>
                      สำนักงานใหญ่: {defaultSummary.head_office_thai}
                      <br />
                      Head Office: {defaultSummary.head_office}
                      <br />
                      โทร: {defaultSummary.tel} | Email: {defaultSummary.email}
                      <br />
                      เลขประจำตัวผู้เสียภาษี: {defaultSummary.tax_id}
                    </strong>
                  </p>
                  <h5 className="border p-1 d-inline-block mt-1">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>ใบเสนอราคา</span>
                      <span>QUOTATION</span>
                    </div>
                  </h5>
                </div>
              </div>

              {/* Customer Info */}
              <div
                className="d-flex justify-content-between"
                style={{ width: "100%" }}
              >
                <div>
                  <p style={{ lineHeight: 2 }}>
                    <strong>ติดต่อจาก:</strong>
                    <input
                      type="text"
                      value={editableCustomer.customer_name}
                      onChange={(e) =>
                        handleCustomerChange("customer_name", e.target.value)
                      }
                      style={{
                        border: "none",
                        marginLeft: "5px",
                        width: "370px",
                      }}
                    />
                    <br />
                    <strong>ผู้มาติดต่อ:</strong>
                    <input
                      type="text"
                      value={editableCustomer.customer_present_name}
                      onChange={(e) =>
                        handleCustomerChange(
                          "customer_present_name",
                          e.target.value,
                        )
                      }
                      style={{
                        border: "none",
                        marginLeft: "5px",
                        width: "370px",
                      }}
                    />
                    <br />
                    <strong>ที่อยู่:</strong>
                    <input
                      type="text"
                      value={editableCustomer.customer_address}
                      onChange={(e) =>
                        handleCustomerChange("customer_address", e.target.value)
                      }
                      style={{
                        border: "none",
                        marginLeft: "5px",
                        width: "400px",
                      }}
                    />
                    <br />
                    <strong>เลขประจำตัวผู้เสียภาษี:</strong>
                    <input
                      type="text"
                      value={editableCustomer.customer_vat}
                      onChange={(e) =>
                        handleCustomerChange("customer_vat", e.target.value)
                      }
                      style={{
                        border: "none",
                        marginLeft: "5px",
                        width: "300px",
                      }}
                    />
                    <br />
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ marginTop: "7px" }}
                    />{" "}
                    <strong>สำนักงานใหญ่</strong>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ marginLeft: "12px", marginTop: "7px" }}
                    />{" "}
                    <strong>สาขา</strong>
                    <div style={{ marginBottom: "1px" }}>
                      <label>
                        <strong>Number of rows: </strong>
                      </label>
                      <select
                        value={numRows}
                        style={{ border: "none" }}
                        onChange={(e) => {
                          const newCount = parseInt(e.target.value);
                          setNumRows(newCount);
                          setRows(
                            Array.from(
                              { length: newCount },
                              (_, i) =>
                                rows[i] || {
                                  product_id: "",
                                  description: "",
                                  qty: 0,
                                  unit: "",
                                  unit_price: 0,
                                },
                            ),
                          );
                        }}
                      >
                        {Array.from({ length: 200 }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <p>
                    <strong>เลขที่: </strong>
                    <span
                      style={{
                        borderBottom: "1px solid #7b8a8b",
                        minWidth: "100px",
                        display: "inline-block",
                        textAlign: "center",
                      }}
                      id="quotation_no_span"
                    >
                      {quotationNumber || " "}
                    </span>
                    <br />
                    <strong>วันที่: </strong>
                    <input
                      type="date"
                      value={(() => {
                        const [day, month, year] = create_date.split(" / ");
                        return `${year}-${month}-${day}`; // convert Thai year to Gregorian YYYY-MM-DD
                      })()}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const day = String(selectedDate.getDate()).padStart(
                          2,
                          "0",
                        );
                        const month = String(
                          selectedDate.getMonth() + 1,
                        ).padStart(2, "0");
                        const year = selectedDate.getFullYear() + 543; // convert to Thai year
                        setcreate_date(`${day} / ${month} / ${year}`);
                      }}
                      style={{
                        width: "100px",
                        border: "none",
                        outline: "none",
                        marginLeft: "20px",
                        backgroundColor: "transparent",
                        lineHeight: "2",
                      }}
                    />
                    <br />
                    <strong>วันที่กำหนดส่ง:</strong>
                    <input
                      type="number"
                      value={due_date}
                      onChange={(e) => setdue_date(e.target.value)}
                      style={{
                        width: "40px",
                        border: "none",
                        outline: "none",
                        marginLeft: "5px",
                        backgroundColor: "transparent",
                        lineHeight: "2",
                      }}
                    />{" "}
                    วัน
                    <br />
                    <strong>ยืนราคาภายใน:</strong>
                    <input
                      type="number"
                      value={submit_price_within}
                      onChange={(e) => setsubmit_price_within(e.target.value)}
                      style={{
                        width: "40px",
                        border: "none",
                        outline: "none",
                        marginLeft: "5px",
                        backgroundColor: "transparent",
                        lineHeight: "2",
                      }}
                    />{" "}
                    วัน
                    <br />
                    <strong>จำนวนวันเคดิต:</strong>
                    <input
                      type="number"
                      value={number_of_credit_days}
                      onChange={(e) => setnumber_of_credit_days(e.target.value)}
                      style={{
                        width: "40px",
                        border: "none",
                        outline: "none",
                        marginLeft: "5px",
                        backgroundColor: "transparent",
                        lineHeight: "2",
                      }}
                    />{" "}
                    วัน
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div style={{ flexGrow: 1 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.5fr 1fr 2.7fr 0.7fr 0.7fr 1fr 1fr",
                    border: "1px solid #dee2e6",
                    width: "100%",
                    maxWidth: "180mm",
                  }}
                >
                  {[
                    "ลำดับ",
                    "รหัสสินค้า",
                    "รายละเอียด",
                    "จำนวน",
                    "หน่วย",
                    "ราคาต่อหน่วย",
                    "จำนวนเงิน",
                  ].map((header, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: "2px 4px",
                        fontWeight: "bold",
                        borderRight: i === 6 ? "none" : "1px solid #dee2e6",
                        fontSize: "12px",
                      }}
                    >
                      {header}
                    </div>
                  ))}
                  {rows.map((row, index) => (
                    <React.Fragment key={index}>
                      <div
                        style={{
                          gridColumn: "1",
                          textAlign: "center",
                          alignContent: "start",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "2px 4px",
                          fontSize: "12px",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        style={{
                          gridColumn: "2",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "0px 4px", // increased top/bottom padding for PDF
                          alignContent: "start",
                        }}
                      >
                        <input
                          value={row.product_id}
                          onChange={(e) =>
                            handleChange(index, "product_id", e.target.value)
                          }
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            height: "24px", // slightly taller for PDF
                            border: "none",
                            outline: "none",
                            lineHeight: "22px", // matches height
                            padding: "0", // remove inner padding
                          }}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "3",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "0px 3px",
                          alignContent: "start",
                        }}
                      >
                        <textarea
                          value={row.description}
                          onChange={(e) =>
                            handleChange(index, "description", e.target.value)
                          }
                          onInput={autoGrow}
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            minHeight: "24px",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            overflow: "hidden",
                            lineHeight: "22px",
                            padding: "0",
                          }}
                          rows={1}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "4",
                          textAlign: "center",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "0px 3px",
                          alignContent: "start",
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          value={row.qty || ""}
                          onChange={(e) =>
                            handleChange(index, "qty", e.target.value)
                          }
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            textAlign: "center",
                            height: "24px",
                            border: "none",
                            outline: "none",
                            lineHeight: "22px",
                            padding: "0",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "5",
                          textAlign: "center",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "0px 3px",
                          alignContent: "start",
                        }}
                      >
                        <input
                          value={row.unit}
                          onChange={(e) =>
                            handleChange(index, "unit", e.target.value)
                          }
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            textAlign: "center",
                            height: "24px",
                            border: "none",
                            outline: "none",
                            lineHeight: "22px",
                            padding: "0",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "6",
                          textAlign: "right",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          padding: "0px 3px",
                          alignContent: "start",
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          value={row.unit_price || ""}
                          onChange={(e) =>
                            handleChange(index, "unit_price", e.target.value)
                          }
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            textAlign: "right",
                            height: "24px",
                            border: "none",
                            outline: "none",
                            lineHeight: "22px",
                            padding: "0px 4px",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "7",
                          textAlign: "right",
                          alignContent: "start",
                          borderTop: "1px solid #dee2e6",
                          padding: "2px 3px",
                          fontSize: "12px",
                        }}
                      >
                        {row.qty && row.unit_price
                          ? (
                              parseFloat(row.qty) * parseFloat(row.unit_price)
                            ).toFixed(2)
                          : ""}
                      </div>
                    </React.Fragment>
                  ))}

                  {/* Summary Rows */}
                  {[
                    [
                      `*** มัดจำ ${defaultSummary.deposit} % ***`,
                      `ส่วนลด ${defaultSummary.discount || ""} %`,
                      totalDiscount,
                    ],
                    [
                      `${defaultSummary.bank_account_name || ""}\n${defaultSummary.bank_account_number || ""}`,
                      "มูลค่าสินค้าหลังหักส่วนลด",
                      totalAfterDiscount,
                    ],
                    [
                      "",
                      `ภาษีมูลค่าเพิ่ม ${defaultSummary.vat || ""} %`,
                      totalVat,
                    ],
                    ["", "ยอดรวมสุทธิ", grandTotal],
                  ].map(([note, label, value], i) => (
                    <React.Fragment key={i}>
                      <div
                        style={{
                          gridColumn: "1 / span 4",
                          textAlign: "center",
                          padding: "2px 4px",
                          borderTop: i === 0 ? "1px solid #dee2e6" : "none",
                          borderRight: "1px solid #dee2e6",
                          fontWeight: "normal",
                          fontSize: "12px",
                        }}
                      >
                        {note}
                      </div>
                      <div
                        style={{
                          gridColumn: "5 / span 2",
                          textAlign: "left",
                          padding: "2px 4px",
                          borderTop: "1px solid #dee2e6",
                          borderRight: "1px solid #dee2e6",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          gridColumn: "7",
                          textAlign: "right",
                          padding: "2px 4px",
                          borderTop: "1px solid #dee2e6",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        {parseFloat(value).toFixed(2)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Footer / Signatures */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: "5px",
                  marginBottom: "0",
                }}
              >
                {["buyer_approves", "sales_person", "sales_manager"].map(
                  (role, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: "30%", // fixed width for even spacing
                        border: "1px solid #dee2e6",
                        padding: "0px 15px 10px 15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100px",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          marginBottom: "2px",
                        }}
                      >
                        <span
                          style={{
                            flex: "0 0 50%",
                            textAlign: "left",
                            alignSelf: "flex-end",
                          }}
                        >
                          {role === "buyer_approves"
                            ? "ผู้ขอซื้อ"
                            : role === "sales_person"
                              ? "ผู้เสนอราคา"
                              : "ผู้จัดการฝ่ายขาย"}
                        </span>

                        <div
                          style={{
                            flex: "0 0 90px",
                            borderBottom: "1px solid #7b8a8b",
                            height: "50px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            marginLeft:
                              role === "buyer_approves" ? "-10px" : "0", // shift only buyer_approves
                          }}
                        >
                          {role !== "buyer_approves" && (
                            <img
                              src={defaultSelected?.[role]}
                              alt={`${role} Signature`}
                              style={{
                                maxHeight: "35px",
                                objectFit: "contain",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          marginTop: "2px",
                        }}
                      >
                        <span style={{ flex: "0 0 25%", textAlign: "left" }}>
                          ลงวันที่
                        </span>
                        <div
                          style={{
                            flex: "1",
                            borderBottom: "1px solid #7b8a8b",
                            height: "25px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {today}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <Row style={{ margin: "16px 0 32px", width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Button onClick={handlePreviewPDF}>Preview PDF</Button>
              <Button onClick={handleOpenConfirm}>Create Quotation</Button>
            </div>
          </Row>

          <Modal show={showConfirm} onHide={handleCloseConfirm}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to create this quotation?
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
        </>
      )}
    </>
  );
};

export default QuotationSetSelectedCustomerScreen;
