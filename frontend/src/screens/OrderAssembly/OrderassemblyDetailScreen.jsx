import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDownload,
  FaBox,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaCalculator,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaImage,
  FaReceipt,
  FaMicrochip,
  FaSearchPlus,
  FaClock,
  FaPenNib,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaUpload,
  FaTools,
  FaShippingFast,
} from "react-icons/fa";
import { useGetAssemblyPCBByIdQuery, useUpdateAssemblyPCBMutation, useUpdatePCBManufactureAssemblyMutation } from "../../slices/assemblypcbApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import {
  useGetSignaturesQuery,
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
  useDeleteSignatureMutation,
  uploadSignatureImage,
} from "../../slices/signatureApiSlice";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import AbbreviatedTaxInvoice from "../../components/AbbreviatedTaxInvoice";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderassemblyDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { userInfo } = useSelector((state) => state.auth);
  const { data: order, isLoading, error, refetch } = useGetAssemblyPCBByIdQuery(id);
  const [updateAssemblyPCB] = useUpdateAssemblyPCBMutation();
  const [updatePCBManufactureAssembly] = useUpdatePCBManufactureAssemblyMutation();
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();
  const { data: signaturesData, refetch: refetchSignatures } = useGetSignaturesQuery();
  const [createSignature] = useCreateSignatureMutation();
  const [deleteSignature] = useDeleteSignatureMutation();
  const [updateSignature] = useUpdateSignatureMutation();

  const orderData = order?.data;

  const [zoomedImage, setZoomedImage] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Signature management
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState({
    slot_buyer: null, slot_cashier: null, slot_manager: null, slot_sender: null,
    slot_quo_buyer: null, slot_quo_sales: null, slot_quo_manager: null,
  });
  const [savingSlots, setSavingSlots] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const fileInputRef = useRef(null);

  // Admin panel
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminPrice, setAdminPrice] = useState("");
  const [deliveryTracking, setDeliveryTracking] = useState("");
  const [manufactureNumber, setManufactureNumber] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  useEffect(() => {
    if (orderData) {
      const top = [], bottom = [];
      for (let i = 1; i <= 10; i++) {
        if (orderData[`image_top_${i}`]) top.push({ url: getFullUrl(orderData[`image_top_${i}`]) });
        if (orderData[`image_bottom_${i}`]) bottom.push({ url: getFullUrl(orderData[`image_bottom_${i}`]) });
      }
      setTopImages(top);
      setBottomImages(bottom);
      setAdminStatus(orderData.status || "");
      setAdminPrice(orderData.confirmed_price || "");
      setDeliveryTracking(orderData.transferedNumber || orderData.deliveryID || "");
      setManufactureNumber(orderData.manufactureOrderNumber || "");
      setSelectedSlots({
        slot_buyer: orderData.slot_buyer || null,
        slot_cashier: orderData.slot_cashier || null,
        slot_manager: orderData.slot_manager || null,
        slot_sender: orderData.slot_sender || null,
        slot_quo_buyer: orderData.slot_quo_buyer || null,
        slot_quo_sales: orderData.slot_quo_sales || null,
        slot_quo_manager: orderData.slot_quo_manager || null,
      });
    }
  }, [orderData]);

  const handleSaveSlots = async () => {
    try { setSavingSlots(true); await updateAssemblyPCB({ id, updatedData: selectedSlots }); toast.success(language === "thai" ? "บันทึกลายเซ็นสำเร็จ" : "Signatures saved"); }
    catch (err) { toast.error(err?.data?.message || err.error); } finally { setSavingSlots(false); }
  };

  const getSignatureList = () => { if (!signaturesData) return []; return signaturesData.map((sig) => ({ id: sig._id, name: sig.name, image_path: sig.image_path })); };
  const getSignatureUrl = (sigId) => { if (!sigId) return null; const found = getSignatureList().find((s) => String(s.id) === String(sigId)); return found ? getFullUrl(found.image_path) : null; };

  const handleUploadSignature = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sigName = window.prompt("ตั้งชื่อลายเซ็น:", file.name.split(".")[0]);
    if (!sigName?.trim()) return;
    try { setUploadingSig(true); const result = await uploadSignatureImage(file); if (result.image_path) { await createSignature({ name: sigName.trim(), image_path: result.image_path }); refetchSignatures(); } }
    catch (err) { alert("อัปโหลดล้มเหลว: " + (err.message || "ไม่ทราบสาเหตุ")); } finally { setUploadingSig(false); }
  };

  const handleDeleteSignature = async (sigId) => {
    if (!window.confirm("ลบลายเซ็นนี้?")) return;
    try { await deleteSignature(sigId); refetchSignatures(); const newSlots = { ...selectedSlots }; Object.keys(newSlots).forEach((key) => { if (newSlots[key] === sigId) newSlots[key] = null; }); setSelectedSlots(newSlots); }
    catch (err) { console.error(err); }
  };

  const handleRenameSignature = async (sigId, currentName) => {
    const newName = window.prompt("แก้ไขชื่อลายเซ็น:", currentName);
    if (!newName?.trim() || newName === currentName) return;
    try { await updateSignature({ id: sigId, name: newName.trim() }); refetchSignatures(); } catch (err) { console.error(err); }
  };

  const slotLabels = {
    slot_buyer: "ผู้ซื้อ (Invoice/Receipt)", slot_cashier: "ผู้รับเงิน (Cashier)", slot_manager: "ผู้มีอำนาจ (Manager)",
    slot_sender: "ผู้ส่งสินค้า (Sender)", slot_quo_buyer: "ผู้ขอซื้อ (Quotation Buyer)", slot_quo_sales: "ผู้ขาย (Quotation Sales)", slot_quo_manager: "ผู้จัดการฝ่ายขาย (Quotation Manager)",
  };

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setIsGeneratingPDF(true);
    setTimeout(() => {
      import("html2pdf.js").then(({ default: html2pdf }) => {
        const container = document.getElementById(mode === "full" ? "full-tax-invoice-container" : "short-tax-invoice-container");
        const element = container?.firstElementChild;
        if (element) {
          const opt = { margin: 0, filename: `${mode === "full" ? "TaxInvoice" : "Receipt"}_${orderData?.paymentComfirmID || orderData?.orderID || "Doc"}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } };
          html2pdf().set(opt).from(element).save().then(() => { setPrintMode(null); setIsGeneratingPDF(false); }).catch(() => { setPrintMode(null); setIsGeneratingPDF(false); });
        } else { setPrintMode(null); setIsGeneratingPDF(false); }
      });
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

  useEffect(() => {
    if (orderData) {
      const top = [],
        bottom = [];
      for (let i = 1; i <= 10; i++) {
        if (orderData[`image_top_${i}`])
          top.push({ url: getFullUrl(orderData[`image_top_${i}`]) });
        if (orderData[`image_bottom_${i}`])
          bottom.push({ url: getFullUrl(orderData[`image_bottom_${i}`]) });
      }
      setTopImages(top);
      setBottomImages(bottom);
    }
  }, [orderData]);

  const handleDownloadZip = async (type) => {
    const zip = new JSZip();
    const folder = zip.folder(orderData.projectname || "project");

    if (type === "images") {
      const images = [...topImages, ...bottomImages];
      await Promise.all(
        images.map(async (img, i) => {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          folder.file(`image-${i}.jpg`, blob);
        }),
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${orderData.projectname}-images.zip`);
    }
  };

  const t = {
    en: {
      title: "Order Details",
      shipping: "Shipping Info",
      billing: "Billing Info",
      delivery: "Delivery Status",
      cost: "Cost Analysis",
      projectName: "Project Name",
      qty: "Quantity",
      notes: "Notes",
      downloadProj: "Download Project",
      notDelivered: "Not Delivered",
      deliveredOn: "Delivered on",
      summary: "Summary",
      smd: "SMD Details",
      tht: "THT Details",
      total: "Grand Total",
      pickup: "Pickup at Company",
    },
    thai: {
      title: "รายละเอียดคำสั่งซื้อ",
      shipping: "ข้อมูลจัดส่ง",
      billing: "ข้อมูลใบกำกับภาษี",
      delivery: "สถานะการจัดส่ง",
      cost: "สรุปค่าใช้จ่าย",
      projectName: "ชื่อโปรเจกต์",
      qty: "จำนวน",
      notes: "หมายเหตุ",
      downloadProj: "ดาวน์โหลดโปรเจกต์",
      notDelivered: "ยังไม่ได้จัดส่ง",
      deliveredOn: "จัดส่งเมื่อ",
      summary: "สรุปรายการ",
      smd: "รายละเอียด SMD",
      tht: "รายละเอียด THT",
      total: "ยอดรวมสุทธิ",
      pickup: "รับที่บริษัท",
    },
  }[language || "en"];

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">Data not found</Message>;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased font-prompt selection:bg-blue-100 uppercase">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12 no-print">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link
            to={userInfo?.isAdmin ? "/admin/orderassemblypcblist" : "/profile?tab=pcbassembly"}
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
              <button onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
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
            <button
              onClick={() => handleDownloadZip("images")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <FaDownload /> {t.downloadProj}
            </button>
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
                {orderData.created_at || orderData.createdAt ? format(new Date(orderData.created_at || orderData.createdAt), "PPP p") : "-"}
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
                <p className="text-xl font-black text-slate-900 uppercase">{orderData.board_types || "Assembly"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Price</p>
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
          {/* Left Column: Details & Specs */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FaMicrochip size={18} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest m-0">Assembly Specifications</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                  <h6 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Surface Mount (SMD)
                  </h6>
                  <div className="space-y-2">
                    <p className="text-xs flex justify-between"><span className="text-slate-500">Side:</span> <span className="font-bold">{orderData.smd_side}</span></p>
                    <p className="text-xs flex justify-between"><span className="text-slate-500">Components:</span> <span className="font-bold">{orderData.count_smd}</span></p>
                    <p className="text-xs flex justify-between border-t border-blue-100 pt-2 mt-2"><span className="text-slate-500">Total Points:</span> <span className="font-bold">{orderData.total_point_smd}</span></p>
                  </div>
                </div>
                <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                  <h6 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Through-Hole (THT)
                  </h6>
                  <div className="space-y-2">
                    <p className="text-xs flex justify-between"><span className="text-slate-500">Side:</span> <span className="font-bold">{orderData.tht_side}</span></p>
                    <p className="text-xs flex justify-between"><span className="text-slate-500">Components:</span> <span className="font-bold">{orderData.count_tht}</span></p>
                    <p className="text-xs flex justify-between border-t border-amber-100 pt-2 mt-2"><span className="text-slate-500">Total Points:</span> <span className="font-bold">{orderData.total_point_tht}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Notes</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{orderData.notes || "No additional notes provided."}</p>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Design Previews</p>
                  <div className="flex flex-wrap gap-3">
                    {[...topImages, ...bottomImages].map((img, i) => (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileActive={{ scale: 0.95 }}
                        key={i}
                        onClick={() => setZoomedImage(img.url)}
                        className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm group"
                      >
                        <img
                          src={img.url}
                          alt="pcb"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <FaSearchPlus size={16} className="text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaMapMarkerAlt className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaMapMarkerAlt />
                  </span>
                  {t.shipping}
                </h6>
                {orderData.receivePlace === "bysending" ? (
                  <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                    <p className="font-black text-slate-900 text-lg mb-1">{orderData.shippingName}</p>
                    <p className="mb-2 text-black font-bold">{orderData.shippingPhone}</p>
                    <p className="m-0 text-sm">
                      {orderData.shippingAddress}, {orderData.shippingCity} {orderData.shippingPostalCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                    <span className="font-black text-black uppercase tracking-widest">
                      {t.pickup}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaFileInvoice className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaFileInvoice />
                  </span>
                  {t.billing}
                </h6>
                <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                  <p className="font-black text-slate-900 text-lg mb-1">{orderData.billingName}</p>
                  <p className="mb-4 text-sm text-slate-500">
                    {orderData.billingAddress}
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
                <h5 className="font-black text-slate-800 text-xl tracking-tight mb-8 uppercase">Summary</h5>
                <div className="space-y-4 mb-8 pt-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">Assembly SMD</span>
                    <span className="font-bold text-slate-700">฿{(Number(orderData.smdCost || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">Assembly THT</span>
                    <span className="font-bold text-slate-700">฿{(Number(orderData.thtCost || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">Stencil & Setup</span>
                    <span className="font-bold text-slate-700">฿{(Number(orderData.stencil_price || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-blue-500 pt-4 border-t border-slate-100">
                    <span className="uppercase tracking-widest font-black">VAT (7%)</span>
                    <span className="font-black">฿{(Number(orderData.vatPrice || 0)).toLocaleString()}</span>
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
      </div>

      {/* Admin Management Panel */}
      {userInfo?.isAdmin && (
        <div className="mt-8 no-print">
          <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-200 overflow-hidden">
            <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-indigo-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><FaTools size={18} /></div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-start">{language === "thai" ? "จัดการออเดอร์ (Admin)" : "Order Management (Admin)"}</h3>
              </div>
              <FaChevronDown className={`text-slate-400 transition-transform ${showAdminPanel ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showAdminPanel && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="p-6 md:p-8 border-t border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest">{language === "thai" ? "สถานะ & ราคา" : "Status & Price"}</h4>
                      <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                        <option value="pending">Pending</option><option value="paid">Paid</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
                      </select>
                      <input type="number" value={adminPrice} onChange={(e) => setAdminPrice(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="ราคา (บาท)" />
                      <button onClick={async () => { try { setSavingAdmin(true); if (adminPrice !== String(orderData.confirmed_price || "")) await updateAssemblyPCB({ id, updatedData: { confirmed_price: Number(adminPrice) } }); if (adminStatus !== (orderData.status || "")) await updateAssemblyPCB({ id, updatedData: { status: adminStatus } }); refetch(); toast.success(language === "thai" ? "อัปเดตสำเร็จ" : "Updated"); } catch (err) { toast.error(err?.data?.message || err.error); } finally { setSavingAdmin(false); } }} disabled={savingAdmin} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
                        <FaCheckCircle /> {savingAdmin ? (language === "thai" ? "กำลังบันทึก..." : "Saving...") : (language === "thai" ? "บันทึก" : "Save")}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest"><FaShippingFast className="inline mr-2" />{language === "thai" ? "ข้อมูลจัดส่ง" : "Delivery Info"}</h4>
                      <input type="text" value={deliveryTracking} onChange={(e) => setDeliveryTracking(e.target.value)} placeholder={language === "thai" ? "เลขพัสดุ..." : "Tracking number..."} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      <button onClick={async () => { try { setSavingAdmin(true); await updateAssemblyPCB({ id, updatedData: { transferedNumber: deliveryTracking.trim(), isDelivered: 1 } }); refetch(); toast.success(language === "thai" ? "จัดส่งสำเร็จ" : "Delivered"); } catch (err) { toast.error(err?.data?.message || err.error); } finally { setSavingAdmin(false); } }} disabled={savingAdmin} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 text-sm">
                        <FaShippingFast /> {language === "thai" ? "ยืนยันจัดส่ง" : "Mark Delivered"}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest"><FaTools className="inline mr-2" />{language === "thai" ? "ใบสั่งผลิต" : "Manufacture Order"}</h4>
                      <input type="text" value={manufactureNumber} onChange={(e) => setManufactureNumber(e.target.value)} placeholder={language === "thai" ? "เลขที่ใบสั่งผลิต..." : "Manufacture order..."} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      <button onClick={async () => { try { setSavingAdmin(true); await updatePCBManufactureAssembly({ pcborderId: id, manufactureOrderNumber: manufactureNumber.trim() }); refetch(); toast.success(language === "thai" ? "บันทึกสำเร็จ" : "Saved"); } catch (err) { toast.error(err?.data?.message || err.error); } finally { setSavingAdmin(false); } }} disabled={savingAdmin} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 text-sm">
                        <FaCheckCircle /> {language === "thai" ? "บันทึก" : "Save"}
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
      <div className="mt-8 no-print">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <button onClick={() => setShowSignaturePanel(!showSignaturePanel)} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100"><FaPenNib size={18} /></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-start">{language === "thai" ? "จัดการลายเซ็น & ช่องเซ็น" : "Manage Signatures & Slots"}</h3>
            </div>
            <FaChevronDown className={`text-slate-400 transition-transform ${showSignaturePanel ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showSignaturePanel && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="p-6 md:p-8 border-t border-slate-100">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-700">{language === "thai" ? "คลังลายเซ็น" : "Signature Library"}</h4>
                      <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleUploadSignature} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingSig} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold hover:bg-purple-700 disabled:opacity-50">
                          <FaPlus /> {uploadingSig ? (language === "thai" ? "กำลังอัปโหลด..." : "Uploading...") : (language === "thai" ? "เพิ่มลายเซ็น" : "Add Signature")}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {getSignatureList().map((sig) => (
                        <div key={sig.id} className="relative group w-32">
                          <div onClick={() => setZoomedImage(getFullUrl(sig.image_path))} className="w-32 h-20 rounded-xl border-2 border-slate-200 bg-white overflow-hidden cursor-zoom-in flex items-center justify-center hover:border-purple-300 transition-colors shadow-sm">
                            <img src={getFullUrl(sig.image_path)} alt={sig.name} className="max-h-16 max-w-full object-contain p-1" />
                          </div>
                          <p className="text-xs text-center text-slate-500 mt-1 truncate px-1">{sig.name}</p>
                          <div className="absolute -top-2 -right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                            <button onClick={() => handleRenameSignature(sig.id, sig.name)} className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 shadow-sm text-xs">✎</button>
                            <button onClick={() => handleDeleteSignature(sig.id)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"><FaTrash size={10} /></button>
                          </div>
                        </div>
                      ))}
                      {(!signaturesData || signaturesData.length === 0) && (
                        <div className="w-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                          <FaUpload size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{language === "thai" ? "ยังไม่มีลายเซ็น" : "No signatures yet"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-700 mb-4">{language === "thai" ? "เลือกช่องลายเซ็น" : "Select Signature Slots"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(slotLabels).map((slotKey) => (
                        <div key={slotKey} className="flex items-center gap-3">
                          <label className="text-sm font-medium text-slate-600 min-w-[150px]">{slotLabels[slotKey]}</label>
                          <select value={selectedSlots[slotKey] || ""} onChange={(e) => setSelectedSlots((prev) => ({ ...prev, [slotKey]: e.target.value ? Number(e.target.value) : null }))} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                            <option value="">— {language === "thai" ? "ไม่ใส่ลายเซ็น" : "No signature"} —</option>
                            {getSignatureList().map((sig) => (<option key={sig.id} value={sig.id}>{sig.name}</option>))}
                          </select>
                          {selectedSlots[slotKey] && (
                            <div className="w-16 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
                              <img src={getSignatureUrl(selectedSlots[slotKey])} alt="Preview" className="max-h-8 max-w-full object-contain" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={handleSaveSlots} disabled={savingSlots} className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 text-sm">
                      <FaCheckCircle /> {savingSlots ? (language === "thai" ? "กำลังบันทึก..." : "Saving...") : (language === "thai" ? "บันทึกการตั้งค่าช่องเซ็น" : "Save Signature Settings")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Document Preview */}
      <div className="mt-12 no-print">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#5F9EA0]/10 text-[#5F9EA0] flex items-center justify-center border border-[#5F9EA0]/20"><FaFileInvoice size={18} /></div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest m-0">Document Preview</h3>
        </div>
        <div className="flex justify-center w-full bg-slate-200 py-8 rounded-[2.5rem] border border-slate-300 overflow-visible shadow-inner">
          <FullTaxInvoiceA4
            order={orderData ? { id: orderData.id || orderData._id, status: orderData.status, createdAt: orderData.created_at || orderData.createdAt, paymentMethod: "Bank Transfer",
              billingName: orderData.billingName, billinggAddress: orderData.billinggAddress || orderData.billingAddress, billingCity: orderData.billingCity, billingPostalCode: orderData.billingPostalCode, billingTax: orderData.billingTax, billingBranch: orderData.billingBranch,
              shippingName: orderData.shippingName, shippingPhone: orderData.shippingPhone,
              items: [{ name: `Assembly PCB: ${orderData.projectname}`, qty: orderData.pcb_qty, price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty }],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07, vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07, shippingPrice: 0, totalPrice: Number(orderData.confirmed_price || 0), paymentComfirmID: orderData.paymentComfirmID || orderData.orderID, isPaid: orderData.status === 'paid' } : null}
            companyInfo={companyInfo} printMode={printMode}
            slotSignatures={{ buyer: getSignatureUrl(selectedSlots.slot_buyer), cashier: getSignatureUrl(selectedSlots.slot_cashier), manager: getSignatureUrl(selectedSlots.slot_manager), sender: getSignatureUrl(selectedSlots.slot_sender), quoBuyer: getSignatureUrl(selectedSlots.slot_quo_buyer), quoSales: getSignatureUrl(selectedSlots.slot_quo_sales), quoManager: getSignatureUrl(selectedSlots.slot_quo_manager) }}
          />
          <AbbreviatedTaxInvoice
            order={orderData ? { id: orderData.id || orderData._id, createdAt: orderData.created_at || orderData.createdAt, paymentMethod: "Bank Transfer",
              billingName: orderData.billingName, billinggAddress: orderData.billinggAddress || orderData.billingAddress, billingCity: orderData.billingCity, billingPostalCode: orderData.billingPostalCode, billingTax: orderData.billingTax,
              shippingName: orderData.shippingName, shippingPhone: orderData.shippingPhone,
              items: [{ name: `Assembly PCB: ${orderData.projectname}`, qty: orderData.pcb_qty, price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty }],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07, vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07, shippingPrice: 0, totalPrice: Number(orderData.confirmed_price || 0), paymentComfirmID: orderData.paymentComfirmID || orderData.orderID } : null}
            companyInfo={companyInfo} printMode={printMode}
          />
        </div>
      </div>

      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        )}
      </AnimatePresence>

      {/* Print containers for PDF generation */}
      <div className={isGeneratingPDF ? "fixed -left-[9999px] top-0 w-[210mm] bg-white z-[0]" : "hidden"}>
        <div id="full-tax-invoice-container" className={printMode === "full" ? "block" : "hidden"}>
          <FullTaxInvoiceA4
            order={orderData ? { id: orderData.id || orderData._id, status: orderData.status, createdAt: orderData.created_at || orderData.createdAt, paymentMethod: "Bank Transfer",
              billingName: orderData.billingName, billinggAddress: orderData.billinggAddress || orderData.billingAddress, billingCity: orderData.billingCity, billingPostalCode: orderData.billingPostalCode, billingTax: orderData.billingTax, billingBranch: orderData.billingBranch,
              shippingName: orderData.shippingName, shippingPhone: orderData.shippingPhone,
              items: [{ name: `Assembly PCB: ${orderData.projectname}`, qty: orderData.pcb_qty, price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty }],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07, vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07, shippingPrice: 0, totalPrice: Number(orderData.confirmed_price || 0), paymentComfirmID: orderData.paymentComfirmID || orderData.orderID, isPaid: orderData.status === 'paid' } : null}
            companyInfo={companyInfo} printMode={printMode}
            slotSignatures={{ buyer: getSignatureUrl(selectedSlots.slot_buyer), cashier: getSignatureUrl(selectedSlots.slot_cashier), manager: getSignatureUrl(selectedSlots.slot_manager), sender: getSignatureUrl(selectedSlots.slot_sender), quoBuyer: getSignatureUrl(selectedSlots.slot_quo_buyer), quoSales: getSignatureUrl(selectedSlots.slot_quo_sales), quoManager: getSignatureUrl(selectedSlots.slot_quo_manager) }}
          />
        </div>
        <div id="short-tax-invoice-container" className={printMode === "short" ? "block" : "hidden"}>
          <AbbreviatedTaxInvoice
            order={orderData ? { id: orderData.id || orderData._id, createdAt: orderData.created_at || orderData.createdAt, paymentMethod: "Bank Transfer",
              billingName: orderData.billingName, billinggAddress: orderData.billinggAddress || orderData.billingAddress, billingCity: orderData.billingCity, billingPostalCode: orderData.billingPostalCode, billingTax: orderData.billingTax,
              shippingName: orderData.shippingName, shippingPhone: orderData.shippingPhone,
              items: [{ name: `Assembly PCB: ${orderData.projectname}`, qty: orderData.pcb_qty, price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty }],
              itemsPrice: Number(orderData.confirmed_price || 0) / 1.07, vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07, shippingPrice: 0, totalPrice: Number(orderData.confirmed_price || 0), paymentComfirmID: orderData.paymentComfirmID || orderData.orderID } : null}
            companyInfo={companyInfo} printMode={printMode}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; padding: 0 !important; }
        }
      ` }} />
    </div>
  );
};

export default OrderassemblyDetailScreen;
