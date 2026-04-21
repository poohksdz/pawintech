import React from "react";

const AbbreviatedTaxInvoice = ({ order, companyInfo, printMode }) => {
  return (
    <div className="p-4 print-only" style={{ fontFamily: "sans-serif" }}>
      <h3>Abbreviated Tax Invoice</h3>
      <p>Order: {order?._id || "N/A"}</p>
    </div>
  );
};

export default AbbreviatedTaxInvoice;
