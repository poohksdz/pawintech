import React from "react";

const FullTaxInvoiceA4 = ({ order, companyInfo, printMode, isAdmin, docType }) => {
  return (
    <div className="p-4 print-only" style={{ fontFamily: "sans-serif" }}>
      <h3>Tax Invoice</h3>
      <p>Order: {order?._id || "N/A"}</p>
    </div>
  );
};

export default FullTaxInvoiceA4;
