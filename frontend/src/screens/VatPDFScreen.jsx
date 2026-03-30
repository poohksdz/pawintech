import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useGetDefaultInvoiceUsedQuery } from "../slices/defaultInvoicesApiSlice";

const VatPDFScreen = () => {
  const { data, isLoading, error } = useGetDefaultInvoiceUsedQuery({});
  const componentRef = useRef();

  if (isLoading) return <p className="text-center my-5">Loading...</p>;
  if (error)
    return (
      <p className="text-center my-5 text-danger">Error loading VAT data</p>
    );

  const vat = data;
  if (!vat) return <p className="text-center my-5">No VAT data found</p>;

  const handleGeneratePDF = async () => {
    const input = componentRef.current;
    // capturing at scale 2 for high resolution
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    window.open(pdf.output("bloburl"));
  };

  return (
    <>
      {/* Top Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={handleGeneratePDF}
          className="btn btn-primary shadow-sm rounded-pill px-4"
        >
          Generate PDF
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          backgroundColor: "#f0f0f0",
          padding: "20px 0",
        }}
      >
        <div
          ref={componentRef}
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            fontSize: "12px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="fw-bold">
              บริษัท อิเล็กโตทรอนิกซ์ จำกัด <br />
              ELECTOTRONIX CO. LTD.
            </h3>
            <p>
              สำนักงานใหญ่: 9 ซอยรามคำแหง 161/2 แขวงรัชดา เขตสะพานสูง กรุงเทพฯ
              10240 <br />
              Head Office: {vat.head_office} <br />
              โทร: {vat.tel} | Email: {vat.email} <br />
              เลขประจำตัวผู้เสียภาษี: {vat.tax_id}
            </p>
            <h5 className="border p-2 d-inline-block mt-1">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>ใบเสนอราคา</span>
                <span>QUOTATION</span>
              </div>
            </h5>
          </div>

          {/* Customer Info */}
          <div
            className="d-flex justify-content-between mb-2"
            style={{ width: "100%" }}
          >
            <div>
              <p>
                <strong style={{ width: "50%" }}>ผู้ติดต่อ:</strong> บริษัท
                เป็ปเป้ เอ็นจิเนียริ่ง จำกัด <br />
                <strong style={{ width: "50%" }}>ที่อยู่:</strong> 27/149 ม.5
                ต.บางละมุง อ.บางละมุง จ.ชลบุรี 20160
              </p>
            </div>

            <div>
              <p>
                <strong>เลขที่:</strong> {vat.quotation_no} <br />
                <strong>วันที่:</strong>{" "}
                {new Date(vat.date).toLocaleDateString("th-TH")} <br />
                <strong>ยืนราคาภายใน:</strong> <br />
                <strong>จำนวนวันเครดิต:</strong> <br />
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "8px",
              justifyContent: "flex-start",
              alignItems: "center",
              alignSelf: "flex-start",
              width: "100%",
            }}
          >
            <span>
              เลขประจำตัวผู้เสียภาษี ______________________________________{" "}
            </span>
            <label style={{ display: "flex", gap: "4px" }}>
              <input type="checkbox" readOnly /> สำนักงานใหญ่
            </label>
            <label style={{ display: "flex", gap: "4px" }}>
              <input type="checkbox" readOnly /> สาขาที่
            </label>
          </div>

          {/* Products Table */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.5fr 1fr 3fr 0.8fr 0.6fr 1.3fr 1.3fr",
              border: "1px solid #dee2e6",
              width: "100%",
              maxWidth: "180mm",
            }}
          >
            {/* Table Header */}
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
                  padding: "8px",
                  fontWeight: "bold",
                  alignContent: "center",
                  borderRight: i === 6 ? "none" : "1px solid #dee2e6",
                  boxSizing: "border-box",
                }}
              >
                {header}
              </div>
            ))}

            {/* Product Rows */}
            {data.vats &&
              data.vats.map((v, index) => (
                <React.Fragment key={index}>
                  <div
                    style={{
                      gridColumn: "1",
                      textAlign: "center",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      gridColumn: "2",
                      textAlign: "center",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {v.product_id || ""}
                  </div>
                  <div
                    style={{
                      gridColumn: "3",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {v.description}
                  </div>
                  <div
                    style={{
                      gridColumn: "4",
                      textAlign: "center",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {v.qty}
                  </div>
                  <div
                    style={{
                      gridColumn: "5",
                      textAlign: "center",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {v.unit || ""}
                  </div>
                  <div
                    style={{
                      gridColumn: "6",
                      textAlign: "right",
                      borderTop: "1px solid #dee2e6",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {parseFloat(v.unit_price).toFixed(2)}
                  </div>
                  <div
                    style={{
                      gridColumn: "7",
                      textAlign: "right",
                      borderTop: "1px solid #dee2e6",
                      padding: "8px",
                    }}
                  >
                    {parseFloat(v.unit_total).toFixed(2)}
                  </div>
                </React.Fragment>
              ))}

            {/* Summary Rows */}
            {[
              [
                "ตัวอักษร (หนึ่งหมื่นห้าพันเก้าร้อยสี่สิบสามบาทถ้วน)",
                <div>
                  <span>ส่วนลด</span>
                  <br />
                  <span style={{ fontSize: "10px" }}>DISCOUNT 0%</span>
                </div>,
                vat.discount,
              ],
              [
                "",
                <div>
                  <span>มูลค่าสินค้าหลังหักส่วนลด</span>
                  <br />
                  <span style={{ fontSize: "10px" }}>
                    TOTAL AMOUNT AFTER DISCOUNT
                  </span>
                </div>,
                vat.total_after_discount,
              ],
              [
                <div>
                  <span>ธนาคารกรุงไทย เลขที่บัญชี 082-0-74742-4</span>
                  <br />
                  <span>ชื่อบัญชี บริษัทอิเล็กโตทรอนิกซ์จำกัด</span>
                </div>,
                <div>
                  <span>รวมมูลค่าสินค้า</span>
                  <br />
                  <span style={{ fontSize: "10px" }}>TOTAL</span>
                </div>,
                vat.total_after_discount,
              ],
              [
                "",
                <div>
                  <span>ภาษีมูลค่าเพิ่ม</span>
                  <br />
                  <span style={{ fontSize: "10px" }}>VAT 7%</span>
                </div>,
                vat.vat,
              ],
              [
                "",
                <div>
                  <span>ยอดรวมสุทธิ</span>
                  <br />
                  <span style={{ fontSize: "10px" }}>GRAND TOTAL</span>
                </div>,
                vat.grand_total,
              ],
            ].map(([leftLabel, summaryLabel, value], i, arr) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    gridColumn: "1 / span 4",
                    textAlign: "center",
                    padding: "8px",
                    borderTop: i === 0 ? "1px solid #dee2e6" : "none",
                    borderRight: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  {leftLabel}
                </div>
                <div
                  style={{
                    gridColumn: "5 / span 2",
                    textAlign: "left",
                    borderTop: "1px solid #dee2e6",
                    borderRight: "1px solid #dee2e6",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {summaryLabel}
                </div>
                <div
                  style={{
                    gridColumn: "7",
                    textAlign: "right",
                    borderTop: "1px solid #dee2e6",
                    padding: "8px",
                    fontWeight: i === arr.length - 1 ? "bold" : "normal",
                  }}
                >
                  {parseFloat(value).toFixed(2)}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Footer Signature */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              width: "100%",
              marginTop: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ border: "1px solid #dee2e6", padding: "16px" }}>
              <p>ผู้ขอซื้อ ________________________</p>
              <p>ลงวันที่ ________________________</p>
            </div>
            <div style={{ border: "1px solid #dee2e6", padding: "16px" }}>
              <p>ผู้เสนอราคา ____________________</p>
              <p>ลงวันที่ _________________________</p>
            </div>
            <div style={{ border: "1px solid #dee2e6", padding: "16px" }}>
              <p>ผู้จัดการฝ่ายขาย _______________</p>
              <p>ลงวันที่ ________________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={handleGeneratePDF}
          className="btn btn-primary shadow-sm rounded-pill px-4"
        >
          Generate PDF
        </button>
      </div>
    </>
  );
};

export default VatPDFScreen;
