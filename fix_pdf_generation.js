const fs = require('fs');
const path = require('path');

const filesToFix = [
  "frontend/src/screens/admin/AdminPaymentListScreen.jsx",
  "frontend/src/screens/CopyPCB/CopyPCBDetailScreen.jsx",
  "frontend/src/screens/CustomPCB/CustomPCBDetailScreen.jsx",
  "frontend/src/screens/Invoices/InvoiceDetailScreen.jsx",
  "frontend/src/screens/Invoices/InvoiceEditScreen.jsx",
  "frontend/src/screens/Invoices/InvoiceSetScreen.jsx",
  "frontend/src/screens/Invoices/InvoiceSetSelectedCustomerScreen.jsx",
  "frontend/src/screens/OrderAssembly/OrderassemblyDetailScreen.jsx",
  "frontend/src/screens/Quotation/QuotationEditScreen.jsx",
  "frontend/src/screens/Quotation/QuotationSetScreen.jsx",
  "frontend/src/screens/Quotation/QuotationSetSelectedCustomerScreen.jsx"
];

const searchPattern = /pdf\.addImage\(\s*imgData,\s*"PNG",\s*0,\s*0,\s*pdf\.internal\.pageSize\.getWidth\(\),\s*pdf\.internal\.pageSize\.getHeight\(\),?\s*\);/g;

const replaceContent = `const pdfWidth = pdf.internal.pageSize.getWidth();
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
    }`;

filesToFix.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.match(searchPattern)) {
    content = content.replace(searchPattern, replaceContent);
    fs.writeFileSync(fullPath, content);
    console.log("Fixed:", relPath);
  } else {
    // maybe it has single quotes or something different
    console.log("Not matched in:", relPath);
  }
});
