import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileInvoice,
  FaReceipt,
  FaArrowLeft,
  FaMicrochip,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaSearchPlus,
  FaDownload,
  FaClock,
  FaPenNib,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaUpload,
  FaShippingFast,
  FaTools,
} from "react-icons/fa";
import { useGetCustomPCBByIdQuery, useUpdateCustomPCBMutation, useUpdateDeliveryCustomPCBMutation, useUpdatePCBManufactureMutation } from "../../slices/custompcbApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import { toast } from "react-toastify";
import {
  useGetSignaturesQuery,
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
  uploadSignatureImage,
} from "../../slices/signatureApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import AbbreviatedTaxInvoice from "../../components/AbbreviatedTaxInvoice";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const CustomPCBDetailScreen = () => {
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { userInfo } = useSelector((state) => state.auth);
  const { data: order, isLoading, error } = useGetCustomPCBByIdQuery(id);
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();
  const { data: signaturesData, refetch: refetchSignatures } = useGetSignaturesQuery();
  const [updateCustomPCB] = useUpdateCustomPCBMutation();
  const [updateDeliveryCustomPCB] = useUpdateDeliveryCustomPCBMutation();
  const [updatePCBManufacture] = useUpdatePCBManufactureMutation();
  const [createSignature] = useCreateSignatureMutation();
  const [deleteSignature] = useDeleteSignatureMutation();
  const [updateSignature] = useUpdateSignatureMutation();

  const orderData = order?.data;

  const [zoomedImage, setZoomedImage] = useState(null);
  const [printMode, setPrintMode] = useState(null);

  // Signature state
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState({
    slot_buyer: null,
    slot_cashier: null,
    slot_manager: null,
    slot_sender: null,
    slot_quo_buyer: null,
    slot_quo_sales: null,
    slot_quo_manager: null,
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  // Admin management state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminPrice, setAdminPrice] = useState("");
  const [deliveryTracking, setDeliveryTracking] = useState("");
  const [manufactureNumber, setManufactureNumber] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (orderData) {
      setSelectedSlots({
        slot_buyer: orderData.slot_buyer || null,
        slot_cashier: orderData.slot_cashier || null,
        slot_manager: orderData.slot_manager || null,
        slot_sender: orderData.slot_sender || null,
        slot_quo_buyer: orderData.slot_quo_buyer || null,
        slot_quo_sales: orderData.slot_quo_sales || null,
        slot_quo_manager: orderData.slot_quo_manager || null,
      });
      // Sync admin fields
      setAdminStatus(orderData.status || "");
      setAdminPrice(orderData.confirmed_price || "");
      setDeliveryTracking(orderData.transferedNumber || orderData.deliveryID || "");
      setManufactureNumber(orderData.manufactureOrderNumber || "");
    }
  }, [orderData]);

  const handleSaveSlots = async () => {
    try {
      setSavingSlots(true);
      await updateCustomPCB({ id, updatedData: selectedSlots });
    } catch (err) {
      console.error("Failed to save signature slots:", err);
    } finally {
      setSavingSlots(false);
    }
  };

  // Admin: Save order info (price, status, delivery tracking)
  const handleSaveAdminInfo = async () => {
    try {
      setSavingAdmin(true);
      if (adminPrice !== String(orderData.confirmed_price || "")) {
        await updateCustomPCB({ id, updatedData: { confirmed_price: Number(adminPrice) } });
      }
      if (adminStatus !== (orderData.status || "")) {
        await updateCustomPCB({ id, updatedData: { status: adminStatus } });
      }
      toast.success(language === "thai" ? "อัปเดตข้อมูลสำเร็จ" : "Order info updated");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Update failed");
    } finally {
      setSavingAdmin(false);
    }
  };

  // Admin: Mark as delivered
  const handleMarkDelivered = async () => {
    if (!deliveryTracking.trim()) {
      toast.error(language === "thai" ? "กรุณาใส่เลขพัสดุ" : "Please enter tracking number");
      return;
    }
    try {
      setSavingAdmin(true);
      await updateDeliveryCustomPCB({ pcborderId: id, transferedNumber: deliveryTracking.trim() });
      setShowAdminPanel(false);
      toast.success(language === "thai" ? "จัดส่งสำเร็จแล้ว" : "Marked as delivered");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Update failed");
    } finally {
      setSavingAdmin(false);
    }
  };

  // Admin: Update manufacture order number
  const handleSaveManufacture = async () => {
    try {
      setSavingAdmin(true);
      await updatePCBManufacture({ pcborderId: id, manufactureOrderNumber: manufactureNumber.trim() });
      toast.success(language === "thai" ? "เลขที่ใบสั่งผลิตอัปเดตแล้ว" : "Manufacture order updated");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Update failed");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleUploadSignature = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sigName = window.prompt("ตั้งชื่อลายเซ็น:", file.name.split(".")[0]);
    if (!sigName || sigName.trim() === "") {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploadingSig(true);
      const result = await uploadSignatureImage(file);
      if (result.image_path) {
        await createSignature({
          name: sigName.trim(),
          image_path: result.image_path,
        });
        refetchSignatures();
      }
    } catch (err) {
      alert("อัปโหลดล้มเหลว: " + (err.message || "ไม่ทราบสาเหตุ"));
      console.error("Failed to upload signature:", err);
    } finally {
      setUploadingSig(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteSignature = async (sigId) => {
    if (!window.confirm("ลบลายเซ็นนี้?")) return;
    try {
      await deleteSignature(sigId);
      refetchSignatures();
      // Clear any slots that used this signature
      const newSlots = { ...selectedSlots };
      Object.keys(newSlots).forEach((key) => {
        if (newSlots[key] === sigId) newSlots[key] = null;
      });
      setSelectedSlots(newSlots);
    } catch (err) {
      console.error("Failed to delete signature:", err);
    }
  };

  const handleRenameSignature = async (sigId, currentName) => {
    const newName = window.prompt("แก้ไขชื่อลายเซ็น:", currentName);
    if (!newName || newName.trim() === "" || newName === currentName) return;
    try {
      await updateSignature({ id: sigId, name: newName.trim() });
      refetchSignatures();
    } catch (err) {
      console.error("Failed to rename signature:", err);
    }
  };

  const getSignatureList = () => {
    if (!signaturesData) return [];
    return signaturesData.map((sig) => ({
      id: sig._id,
      name: sig.name,
      image_path: sig.image_path,
    }));
  };

  const getSignatureUrl = (sigId) => {
    if (!sigId) return null;
    const list = getSignatureList();
    const found = list.find((s) => String(s.id) === String(sigId));
    return found ? getFullUrl(found.image_path) : null;
  };

  const slotLabels = {
    slot_buyer: "ผู้ซื้อ (Invoice/Receipt)",
    slot_cashier: "ผู้รับเงิน (Cashier)",
    slot_manager: "ผู้มีอำนาจ (Manager)",
    slot_sender: "ผู้ส่งสินค้า (Sender)",
    slot_quo_buyer: "ผู้ขอซื้อ (Quotation Buyer)",
    slot_quo_sales: "ผู้ขาย (Quotation Sales)",
    slot_quo_manager: "ผู้จัดการฝ่ายขาย (Quotation Manager)",
  };

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setIsGeneratingPDF(true);

    // Give React time to render the hidden container
    setTimeout(() => {
      const containerId = mode === "full" ? "full-tax-invoice-container" : "short-tax-invoice-container";
      const container = document.getElementById(containerId);
      const element = container ? container.firstElementChild : null;

      if (element) {
        const docName = mode === "full" ? "TaxInvoice" : "Receipt";
        const invoiceNo = orderData?.paymentComfirmID || orderData?.orderID || orderData?.id || "Document";

        const opt = {
          margin: 0,
          filename: `${docName}_${invoiceNo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
          setPrintMode(null);
          setIsGeneratingPDF(false);
        }).catch(err => {
          console.error("PDF Generation Error", err);
          setPrintMode(null);
          setIsGeneratingPDF(false);
        });
      } else {
        setPrintMode(null);
        setIsGeneratingPDF(false);
      }
    }, 500);
  };

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    const path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : APP_BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const imageFields = [
    "dirgram_image_1",
    "dirgram_image_2",
    "dirgram_image_3",
    "dirgram_image_4",
    "dirgram_image_5",
    "dirgram_image_6",
    "dirgram_image_7",
    "dirgram_image_8",
    "dirgram_image_9",
    "dirgram_image_10",
  ];

  const t = {
    en: {
      details: "PCB Order Details",
      shipping: "Shipping Info",
      billing: "Billing Info",
      user: "User Info",
      cost: "Cost & Calculation",
      quantity: "Quantity",
      length: "Length",
      width: "Width",
      areaPerBoard: "Area/Board",
      totalArea: "Total Area",
      layers: "Layers",
      material: "Base Material",
      thickness: "Thickness",
      color: "Color",
      silkscreen: "Silkscreen",
      surfaceFinish: "Surface Finish",
      copperWeight: "Copper Weight",
      created: "Created",
      delivery: "Delivery",
      deliveryID: "Delivery ID",
      deliveryat: "Delivered At",
      deliveredAt: "Delivered At",
      isDelivered: "Delivered",
      notDeliveredLbl: "Not Delivered",
      deliveredOnLbl: "Delivered on",
      weightPerBoard: "Weight/Board",
      totalWeight: "Total Weight",
      pricePerCm2: "Price/cm²",
      extraServiceCost: "Extra Service Cost",
      pcbCost: "PCB Cost",
      deliveryDHL: "Delivery DHL",
      serviceDHL: "Service DHL",
      ems: "EMS",
      totalCost: "Total Cost",
      profitMargin: "Profit Margin (%)",
      priceBeforeVat: "Price Before VAT",
      pricePerBoard: "Price/Board",
      vat: "VAT (%)",
      quotedPrice: "Quoted Price",
      name: "Name",
      phone: "Phone",
      email: "Email",
      address: "Address",
      city: "City",
      postal: "Postal Code",
      country: "Country",
      tax: "Tax ID",
      shippingAddressLbl: "Shipping Address",
      billingAddressLbl: "Billing Address",
      nameLbl: "Name",
      phoneLbl: "Phone",
      emailLbl: "Email",
      addressLbl: "Address",
      taxLbl: "Tax ID",
      orderItemsLbl: "Order Items",
      orderIsEmptyLbl: "Order is empty",
      gerberFile: "Gerber File",
      goBackLbl: "Go Back",
      ImageLbl: "Slip Image",
      uniquePrice: "Unit Price",
      customerselectedtoreceiveatcompanyLbl:
        "Customer selected to receive at company",
    },
    thai: {
      details: "รายละเอียดคำสั่งซื้อ PCB",
      shipping: "ข้อมูลจัดส่ง",
      billing: "ข้อมูลใบกำกับภาษี",
      user: "ข้อมูลผู้ใช้",
      cost: "ต้นทุน & การคำนวณ",
      quantity: "จำนวน",
      length: "ความยาว",
      width: "ความกว้าง",
      areaPerBoard: "พื้นที่/บอร์ด",
      totalArea: "พื้นที่รวม",
      layers: "จำนวนชั้น",
      material: "วัสดุ",
      thickness: "ความหนา",
      color: "สี",
      silkscreen: "ซิลค์สกรีน",
      surfaceFinish: "พื้นผิว",
      copperWeight: "น้ำหนักทองแดง",
      created: "วันที่สร้าง",
      delivery: "การจัดส่ง",
      deliveryID: "รหัสพัสดุ",
      deliveryat: "วันที่จัดส่ง",
      deliveredAt: "วันที่จัดส่ง",
      isDelivered: "จัดส่งแล้ว",
      notDeliveredLbl: "ยังไม่ได้จัดส่ง",
      deliveredOnLbl: "จัดส่งเมื่อ",
      weightPerBoard: "น้ำหนัก/บอร์ด",
      totalWeight: "น้ำหนักรวม",
      pricePerCm2: "ราคา/cm²",
      extraServiceCost: "ค่าบริการเสริม",
      pcbCost: "ต้นทุน PCB",
      deliveryDHL: "DHL",
      serviceDHL: "ค่าบริการ DHL",
      ems: "EMS",
      totalCost: "ต้นทุนรวม",
      profitMargin: "กำไร (%)",
      priceBeforeVat: "ราคารวมก่อน VAT",
      pricePerBoard: "ราคา/บอร์ด",
      vat: "VAT (%)",
      quotedPrice: "ราคาที่เสนอ",
      name: "ชื่อ",
      phone: "เบอร์โทร",
      email: "อีเมล",
      address: "ที่อยู่",
      city: "เมือง",
      postal: "รหัสไปรษณีย์",
      country: "ประเทศ",
      tax: "เลขประจำตัวผู้เสียภาษี",
      shippingAddressLbl: "ที่อยู่สำหรับจัดส่ง",
      billingAddressLbl: "ที่อยู่ใบกำกับภาษี",
      nameLbl: "ชื่อ",
      phoneLbl: "เบอร์โทร",
      emailLbl: "อีเมล",
      addressLbl: "ที่อยู่",
      taxLbl: "เลขผู้เสียภาษี",
      orderItemsLbl: "รายการคำสั่งซื้อ",
      orderIsEmptyLbl: "ไม่มีรายการสั่งซื้อ",
      gerberFile: "ไฟล์ Gerber",
      goBackLbl: "กลับ",
      ImageLbl: "รูปภาพ Slip",
      uniquePrice: "ราคาต่อชิ้น",
      customerselectedtoreceiveatcompanyLbl: "ลูกค้าเลือกมารับที่บริษัท",
    },
  }[language || "en"];

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">No data found</Message>;

  const handleDownloadAll = async () => {
    const zip = new JSZip();

    // Add Gerber ZIP file (first type)
    if (orderData.dirgram_zip) {
      const zipUrl = getFullUrl(orderData.dirgram_zip);
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(
            orderData.dirgram_zip.split("/").pop() || "technical-files.zip",
            blob,
          );
        }
      } catch (err) {
        console.error("Failed to fetch Tech ZIP:", err);
      }
    }

    // Add Gerber ZIP file (second type)
    if (orderData.gerber_zip) {
      const zipUrl = getFullUrl(orderData.gerber_zip);
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(orderData.gerber_zip.split("/").pop() || "gerber.zip", blob);
        }
      } catch (error) {
        console.error("Error fetching zip zip:", error);
      }
    }

    // Add image files to an "images" folder
    const imageFolder = zip.folder("images");

    const fields = imageFields
      .map(
        (key, i) =>
          orderData[key] && {
            file: orderData[key],
            name: `diagram-${i + 1}.jpg`,
          },
      )
      .filter(Boolean);

    for (const { file, name } of fields) {
      const url = getFullUrl(file);
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          imageFolder.file(name, blob);
        }
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
      }
    }

    // Generate final ZIP and download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(
      content,
      `${orderData.projectname || "project"}-project-pawin-tech.zip`,
    );
  };

  const handleDownloadPreviewPDF = async (e) => {
    e.preventDefault();
    if (!imageFields.some(key => orderData[key])) {
      alert("No preview images found to download.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let firstPage = true;

      for (const key of imageFields) {
        if (!orderData[key]) continue;
        const url = getFullUrl(orderData[key]);

        try {
          const response = await fetch(url);
          if (!response.ok) continue;

          const blob = await response.blob();
          const imgData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const img = new Image();
          img.src = imgData;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          if (!firstPage) {
            doc.addPage();
          }
          firstPage = false;

          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = doc.internal.pageSize.getHeight();
          const imgRatio = img.width / img.height;
          const pdfRatio = pdfWidth / pdfHeight;

          let finalWidth, finalHeight;
          if (imgRatio > pdfRatio) {
            finalWidth = pdfWidth;
            finalHeight = pdfWidth / imgRatio;
          } else {
            finalHeight = pdfHeight;
            finalWidth = pdfHeight * imgRatio;
          }

          const x = (pdfWidth - finalWidth) / 2;
          const y = (pdfHeight - finalHeight) / 2;

          doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
        } catch (err) {
          console.error(`Failed to process image ${url} for PDF`, err);
        }
      }

      if (!firstPage) {
        doc.save(`${orderData.projectname || "document"}-preview.pdf`);
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased font-prompt selection:bg-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12 no-print">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link
            to={userInfo?.isAdmin ? "/admin/custompcblist" : "/profile?tab=custompcb"}
            className="inline-flex items-center gap-3 text-slate-500 hover:text-blue-600 font-bold transition-all group active:scale-95"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:shadow-md transition-all">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="hidden sm:inline-block tracking-wide uppercase text-sm">
              {language === "thai" ? "ย้อนกลับ" : "Back"}
            </span>
          </Link>

          <div className="flex flex-wrap gap-3">
            {userInfo?.isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                <FaTools /> {language === "thai" ? "จัดการออเดอร์" : "Admin Panel"}
              </button>
            )}
            {(userInfo?.isAdmin || (orderData.billingTax && orderData.billingTax !== "N/A")) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint("full")}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  <FaFileInvoice /> {isGeneratingPDF && printMode === "full" ? "Generating PDF..." : "Full Invoice (PDF)"}
                </button>
                <button
                  onClick={() => handlePrint("short")}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-bold shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  <FaReceipt /> {isGeneratingPDF && printMode === "short" ? "Generating PDF..." : "Short Receipt"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black">
            <div>
              <h4 className="text-2xl font-black mb-1 flex items-center gap-3 tracking-tight uppercase">
                {orderData.orderID}
              </h4>
              <span className="text-white/60 text-sm font-medium tracking-wide">
                {orderData.created_at ? format(new Date(orderData.created_at), "PPP p") : "-"}
              </span>
            </div>
            <div>
              {orderData.isDelivered ? (
                <span className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                  <FaCheckCircle /> {language === "thai" ? "จัดส่งสำเร็จ" : "Delivered"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-md text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/30">
                  <FaClock className="animate-pulse" /> {language === "thai" ? "รอจัดส่ง" : "Processing"}
                </span>
              )}
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">
              {orderData.projectname}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                <p className="text-xl font-black text-slate-900">{orderData.pcb_qty} PCS</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Type</p>
                <p className="text-xl font-black text-slate-900 uppercase">Custom PCB</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</p>
                <p className="text-xl font-black text-blue-600 tracking-tighter">฿{Number(orderData.confirmed_price || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">฿{(Number(orderData.confirmed_price || 0) / (orderData.pcb_qty || 1)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details & Docs */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FaMicrochip size={18} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest m-0">Project Technicals</h3>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Requirements</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{orderData.notes || "No special requirements provided."}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {orderData.dirgram_zip && (
                    <a
                      href={getFullUrl(orderData.dirgram_zip)}
                      download
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <FaDownload />
                        </div>
                        <span className="text-sm font-bold text-slate-700 tracking-tight">Main Technical Files</span>
                      </div>
                      <FaArrowLeft className="scale-x-[-1] text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                  )}
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                        <FaDownload />
                      </div>
                      <span className="text-sm font-bold text-slate-700 tracking-tight text-start">Full Project Bundle (ZIP)</span>
                    </div>
                    <FaArrowLeft className="scale-x-[-1] text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </button>

                  <button
                    onClick={handleDownloadPreviewPDF}
                    className="flex items-center justify-between p-4 bg-white border border-rose-200 rounded-2xl hover:border-rose-300 hover:shadow-md transition-all group lg:col-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <FaFileInvoice />
                      </div>
                      <span className="text-sm font-bold text-slate-700 tracking-tight text-start">Document Preview (PDF)</span>
                    </div>
                    <FaArrowLeft className="scale-x-[-1] text-slate-300 group-hover:text-rose-500 transition-colors" />
                  </button>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-start">Uploaded Project Previews</p>
                  <div className="flex flex-wrap gap-3">
                    {imageFields.map((field, idx) =>
                      orderData[field] ? (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileActive={{ scale: 0.95 }}
                          key={idx}
                          onClick={() => setZoomedImage(getFullUrl(orderData[field]))}
                          className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm shadow-slate-100 group"
                        >
                          <img
                            src={getFullUrl(orderData[field])}
                            alt={`${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <FaSearchPlus size={16} className="text-white" />
                          </div>
                        </motion.div>
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaMapMarkerAlt className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10 text-start">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaMapMarkerAlt />
                  </span>
                  {language === "thai" ? "ที่อยู่จัดส่ง" : "Shipping"}
                </h6>
                {orderData.receivePlace === "bysending" ? (
                  <div className="relative z-10 text-slate-600 font-medium leading-relaxed text-start">
                    <p className="font-black text-slate-900 text-lg mb-1">{orderData.shippingName}</p>
                    <p className="mb-2 text-black font-bold">{orderData.shippingPhone}</p>
                    <p className="m-0 text-sm">
                      {orderData.shippingAddress}, {orderData.shippingCity} {orderData.shippingPostalCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                    <span className="font-black text-black uppercase tracking-widest">
                      {language === "thai" ? "รับสินค้าหน้าร้าน" : "Pickup Info"}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaFileInvoice className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10 text-start">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaFileInvoice />
                  </span>
                  {language === "thai" ? "ที่อยู่ใบกำกับภาษี" : "Billing"}
                </h6>
                <div className="relative z-10 text-slate-600 font-medium leading-relaxed text-start">
                  <p className="font-black text-slate-900 text-lg mb-1">{orderData.billingName}</p>
                  <p className="mb-4 text-sm text-slate-500">
                    {orderData.billinggAddress}, {orderData.billingCity} {orderData.billingPostalCode}
                  </p>
                  {orderData.billingTax && (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-black uppercase tracking-widest border border-slate-200">
                      TAX ID: {orderData.billingTax}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial & Proof */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden sticky top-8">
              <div className="p-8">
                <h5 className="font-black text-slate-800 text-xl tracking-tight mb-8 uppercase text-start">Summary</h5>
                <div className="space-y-4 mb-8 pt-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span className="font-bold text-slate-700 tracking-tighter">฿{(Number(orderData.confirmed_price || 0) / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">VAT (7%)</span>
                    <span className="font-bold text-slate-700 tracking-tighter">฿{(Number(orderData.confirmed_price || 0) * 0.07 / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 border-dashed pt-6 flex justify-between items-end mb-8">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-xs mb-1">Total Amount</span>
                  <span className="font-black text-black text-4xl tracking-tighter leading-none">฿{Number(orderData.confirmed_price || 0).toLocaleString()}</span>
                </div>

                <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col items-center gap-3 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-0">Payment Proof</p>
                  {orderData.paymentSlip ? (
                    <button
                      type="button"
                      className="w-full h-48 rounded-2xl border border-slate-200 relative overflow-hidden group cursor-zoom-in block bg-white"
                      onClick={() => setZoomedImage(getFullUrl(orderData.paymentSlip))}
                    >
                      <img
                        src={getFullUrl(orderData.paymentSlip)}
                        alt="Payment Slip"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                          <FaSearchPlus size={20} />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl py-8 w-full flex flex-col items-center justify-center border-2 border-slate-100 border-dashed text-slate-400">
                      <FaClock size={32} className="mb-3 opacity-30 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Pending Slip Upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Management Panel */}
        {userInfo?.isAdmin && (
          <div className="mt-8 no-print">
            <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-200 overflow-hidden">
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-indigo-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <FaTools size={18} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-start">
                    {language === "thai" ? "จัดการออเดอร์ (Admin)" : "Order Management (Admin)"}
                  </h3>
                </div>
                <FaChevronDown className={`text-slate-400 transition-transform ${showAdminPanel ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showAdminPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 md:p-8 border-t border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                      {/* Status & Price */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">
                          {language === "thai" ? "สถานะ & ราคา" : "Status & Price"}
                        </h4>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            {language === "thai" ? "สถานะ" : "Status"}
                          </label>
                          <select
                            value={adminStatus}
                            onChange={(e) => setAdminStatus(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            {language === "thai" ? "ราคาที่ยืนยัน (บาท)" : "Confirmed Price (THB)"}
                          </label>
                          <input
                            type="number"
                            value={adminPrice}
                            onChange={(e) => setAdminPrice(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            min={0}
                          />
                        </div>
                        <button
                          onClick={handleSaveAdminInfo}
                          disabled={savingAdmin}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
                        >
                          <FaCheckCircle /> {savingAdmin ? (language === "thai" ? "กำลังบันทึก..." : "Saving...") : (language === "thai" ? "บันทึกข้อมูล" : "Save Info")}
                        </button>
                      </div>

                      {/* Delivery */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">
                          <FaShippingFast className="inline mr-2" />
                          {language === "thai" ? "ข้อมูลจัดส่ง" : "Delivery Info"}
                        </h4>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            {language === "thai" ? "เลขพัสดุ / Tracking Number" : "Tracking Number"}
                          </label>
                          <input
                            type="text"
                            value={deliveryTracking}
                            onChange={(e) => setDeliveryTracking(e.target.value)}
                            placeholder={language === "thai" ? "กรอกเลขพัสดุ..." : "Enter tracking number..."}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {orderData.isDelivered ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <FaCheckCircle /> {language === "thai" ? "จัดส่งแล้ว" : "Delivered"}: {orderData.deliveryOn ? format(new Date(orderData.deliveryOn), "PP p") : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                              <FaClock className="animate-pulse" /> {language === "thai" ? "ยังไม่ได้จัดส่ง" : "Not delivered"}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleMarkDelivered}
                          disabled={savingAdmin || orderData.isDelivered}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
                        >
                          <FaShippingFast /> {language === "thai" ? "ยืนยันจัดส่ง" : "Mark as Delivered"}
                        </button>
                      </div>

                      {/* Manufacture Order */}
                      <div className="space-y-4">
                        <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">
                          <FaTools className="inline mr-2" />
                          {language === "thai" ? "ใบสั่งผลิต" : "Manufacture Order"}
                        </h4>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            {language === "thai" ? "เลขที่ใบสั่งผลิต" : "Manufacture Order Number"}
                          </label>
                          <input
                            type="text"
                            value={manufactureNumber}
                            onChange={(e) => setManufactureNumber(e.target.value)}
                            placeholder={language === "thai" ? "กรอกเลขที่ใบสั่งผลิต..." : "Enter manufacture order number..."}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <FaClock /> {language === "thai" ? "ใช้สำหรับติดตามการผลิต" : "For internal production tracking"}
                        </div>
                        <button
                          onClick={handleSaveManufacture}
                          disabled={savingAdmin}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                        >
                          <FaCheckCircle /> {language === "thai" ? "บันทึกใบสั่งผลิต" : "Save Manufacture Order"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Signature Management */}
        <div className="mt-12 no-print">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowSignaturePanel(!showSignaturePanel)}
              className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <FaPenNib size={18} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-start">จัดการลายเซ็น &amp; ช่องเซ็น</h3>
              </div>
              <FaChevronDown className={`text-slate-400 transition-transform ${showSignaturePanel ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showSignaturePanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 md:p-8 border-t border-slate-100">
                    {/* Signature Library */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700">คลังลายเซ็น</h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleUploadSignature}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingSig}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            <FaPlus /> {uploadingSig ? "กำลังอัปโหลด..." : "เพิ่มลายเซ็น"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {getSignatureList().map((sig) => (
                          <div key={sig.id} className="relative group w-32">
                            <div
                              onClick={() => setZoomedImage(getFullUrl(sig.image_path))}
                              className="w-32 h-20 rounded-xl border-2 border-slate-200 bg-white overflow-hidden cursor-zoom-in flex items-center justify-center hover:border-purple-300 transition-colors shadow-sm"
                            >
                              <img
                                src={getFullUrl(sig.image_path)}
                                alt={sig.name}
                                className="max-h-16 max-w-full object-contain p-1"
                              />
                            </div>
                            <p className="text-xs text-center text-slate-500 mt-1 truncate px-1">{sig.name}</p>
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleRenameSignature(sig.id, sig.name)}
                                className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 shadow-sm"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteSignature(sig.id)}
                                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!signaturesData || signaturesData.length === 0) && (
                          <div className="w-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <FaUpload size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">ยังไม่มีลายเซ็น — อัปโหลดลายเซ็นแรกของคุณ</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slot Selectors */}
                    <div className="mb-6">
                      <h4 className="font-bold text-slate-700 mb-4">เลือกช่องลายเซ็น</h4>
                      <p className="text-xs text-slate-500 mb-4">แต่ละช่องสามารถเลือกที่จะใส่ลายเซ็นหรือไม่ใส่ก็ได้</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(slotLabels).map((slotKey) => (
                          <div key={slotKey} className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-600 min-w-[150px]">
                              {slotLabels[slotKey]}
                            </label>
                            <select
                              value={selectedSlots[slotKey] || ""}
                              onChange={(e) =>
                                setSelectedSlots((prev) => ({
                                  ...prev,
                                  [slotKey]: e.target.value ? Number(e.target.value) : null,
                                }))
                              }
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            >
                              <option value="">— ไม่ใส่ลายเซ็น —</option>
                              {getSignatureList().map((sig) => (
                                <option key={sig.id} value={sig.id}>
                                  {sig.name}
                                </option>
                              ))}
                            </select>
                            {selectedSlots[slotKey] && (
                              <div className="w-16 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img
                                  src={getSignatureUrl(selectedSlots[slotKey])}
                                  alt="Preview"
                                  className="max-h-8 max-w-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSaveSlots}
                        disabled={savingSlots}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                      >
                        <FaCheckCircle /> {savingSlots ? "กำลังบันทึก..." : "บันทึกการตั้งค่าช่องเซ็น"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Unified Document Vista (A4 Preview) */}
        <div className="mt-12 no-print">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#5F9EA0]/10 text-[#5F9EA0] flex items-center justify-center border border-[#5F9EA0]/20">
              <FaFileInvoice size={18} />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest m-0">Document Preview</h3>
          </div>

          <div className="flex justify-center w-full bg-slate-200 py-8 rounded-[2.5rem] border border-slate-300 overflow-visible shadow-inner">
            <FullTaxInvoiceA4
              order={orderData ? {
                id: orderData.id || orderData._id,
                status: orderData.status,
                createdAt: orderData.created_at || orderData.createdAt,
                paymentMethod: "Bank Transfer",
                billingAddress: {
                  billingName: orderData.billingName,
                  billinggAddress: orderData.billinggAddress,
                  billingCity: orderData.billingCity,
                  billingPostalCode: orderData.billingPostalCode,
                  tax: orderData.billingTax,
                  branch: orderData.billingBranch,
                },
                shippingAddress: {
                  shippingname: orderData.shippingName,
                  phone: orderData.shippingPhone,
                },
                items: [
                  {
                    product_id: orderData.id || orderData._id,
                    name: `Custom PCB: ${orderData.projectname}`,
                    qty: orderData.pcb_qty,
                    price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty,
                  }
                ],
                itemsPrice: Number(orderData.confirmed_price || 0) / 1.07,
                vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07,
                shippingPrice: 0,
                totalPrice: Number(orderData.confirmed_price || 0),
                paymentComfirmID: orderData.paymentComfirmID || orderData.orderID,
                isPaid: orderData.status === 'paid',
              } : null}
              companyInfo={companyInfo}
              printMode={printMode}
              slotSignatures={{
                buyer: getSignatureUrl(selectedSlots.slot_buyer),
                cashier: getSignatureUrl(selectedSlots.slot_cashier),
                manager: getSignatureUrl(selectedSlots.slot_manager),
                sender: getSignatureUrl(selectedSlots.slot_sender),
                quoBuyer: getSignatureUrl(selectedSlots.slot_quo_buyer),
                quoSales: getSignatureUrl(selectedSlots.slot_quo_sales),
                quoManager: getSignatureUrl(selectedSlots.slot_quo_manager),
              }}
            />
          </div>
        </div>
      </div>

      {zoomedImage && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setZoomedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex justify-center pointer-events-none"
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto z-10"
              >
                &times;
              </button>
              <img
                src={zoomedImage}
                alt="Zoomed View"
                className="rounded-2xl shadow-2xl max-h-[85vh] object-contain pointer-events-auto border-2 border-white/10"
              />
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Print Components */}
      <div className={isGeneratingPDF ? "fixed -left-[9999px] top-0 w-[210mm] bg-white z-[0]" : "hidden print:block"}>
        <div id="full-tax-invoice-container" className={printMode === "full" ? "block" : "hidden"}>
          <FullTaxInvoiceA4
            order={orderData ? {
              id: orderData.id || orderData._id,
              createdAt: orderData.created_at || orderData.createdAt,
              status: orderData.status,
              paymentMethod: "Bank Transfer",
              billingAddress: {
                billingName: orderData.billingName,
                billinggAddress: orderData.billinggAddress,
                billingCity: orderData.billingCity,
                billingPostalCode: orderData.billingPostalCode,
                tax: orderData.billingTax,
                branch: orderData.billingBranch,
              },
              shippingAddress: {
                shippingname: orderData.shippingName,
                phone: orderData.shippingPhone,
              },
              items: [
                {
                  product_id: orderData.id || orderData._id,
                  name: `Custom PCB: ${orderData.projectname || 'Untitled Project'}`,
                  qty: orderData.pcb_qty || 1,
                  price: (Number(orderData.confirmed_price || 0) / 1.07) / (orderData.pcb_qty || 1),
                }
              ],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07,
              vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07,
              shippingPrice: 0,
              totalPrice: Number(orderData.confirmed_price || 0),
              paymentComfirmID: orderData.paymentComfirmID || orderData.orderID,
              isPaid: orderData.status === 'paid',
            } : null}
            companyInfo={companyInfo}
            printMode={printMode}
            slotSignatures={{
              buyer: getSignatureUrl(selectedSlots.slot_buyer),
              cashier: getSignatureUrl(selectedSlots.slot_cashier),
              manager: getSignatureUrl(selectedSlots.slot_manager),
              sender: getSignatureUrl(selectedSlots.slot_sender),
              quoBuyer: getSignatureUrl(selectedSlots.slot_quo_buyer),
              quoSales: getSignatureUrl(selectedSlots.slot_quo_sales),
              quoManager: getSignatureUrl(selectedSlots.slot_quo_manager),
            }}
          />
        </div>
        <div id="short-tax-invoice-container" className={printMode === "short" ? "block" : "hidden"}>
          <AbbreviatedTaxInvoice
            order={orderData ? {
              id: orderData.id || orderData._id,
              createdAt: orderData.created_at || orderData.createdAt,
              paymentMethod: "Bank Transfer",
              billingAddress: {
                billingName: orderData.billingName,
                billinggAddress: orderData.billinggAddress,
                billingCity: orderData.billingCity,
                billingPostalCode: orderData.billingPostalCode,
                tax: orderData.billingTax,
                branch: orderData.billingBranch,
              },
              shippingAddress: {
                shippingname: orderData.shippingName,
                phone: orderData.shippingPhone,
              },
              items: [
                {
                  product_id: orderData.id || orderData._id,
                  name: `Custom PCB: ${orderData.projectname || 'Untitled Project'}`,
                  qty: orderData.pcb_qty || 1,
                  price: (Number(orderData.confirmed_price || 0) / 1.07) / (orderData.pcb_qty || 1),
                }
              ],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07,
              vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07,
              shippingPrice: 0,
              totalPrice: Number(orderData.confirmed_price || 0),
              paymentComfirmID: orderData.paymentComfirmID || orderData.orderID,
              isPaid: orderData.status === 'paid',
            } : null}
            companyInfo={companyInfo}
            printMode={printMode}
            slotSignatures={{
              buyer: getSignatureUrl(selectedSlots.slot_buyer),
              cashier: getSignatureUrl(selectedSlots.slot_cashier),
              manager: getSignatureUrl(selectedSlots.slot_manager),
              sender: getSignatureUrl(selectedSlots.slot_sender),
              quoBuyer: getSignatureUrl(selectedSlots.slot_quo_buyer),
              quoSales: getSignatureUrl(selectedSlots.slot_quo_sales),
              quoManager: getSignatureUrl(selectedSlots.slot_quo_manager),
            }}
          />
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; padding: 0 !important; }
        }
      ` }} />
      </div>
    </div>
  );
};

export default CustomPCBDetailScreen;
