import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAssemblyPCBByIdQuery } from "../../slices/assemblypcbApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderassemblyDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { data: order, isLoading, error } = useGetAssemblyPCBByIdQuery(id);

  const orderData = order?.data;

  const [zoomedImage, setZoomedImage] = useState(null);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);

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
    },
  }[language || "en"];

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">Data not found</Message>;

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-12 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              #{orderData.orderID}
            </h1>
            <p className="text-slate-500 font-medium">
              {t.title} - {orderData.projectname}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/pcbassemblycart")}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              <FaArrowLeft />{" "}
              {language === "thai" ? "กลับไปยังหน้าตะกร้า" : "Back to Cart"}
            </button>
            <button
              onClick={() => handleDownloadZip("images")}
              className="flex items-center gap-2 bg-blue-600 px-5 py-2 rounded-xl text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <FaDownload /> {t.downloadProj}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Client Info */}
          <div className="lg:col-span-7 space-y-8">
            {/* Project Details Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <FaBox className="text-blue-400" /> Project Info
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {orderData.board_types}
                </span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.projectName}
                  </p>
                  <p className="text-slate-900 font-bold">
                    {orderData.projectname}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.qty}
                  </p>
                  <p className="text-slate-900 font-bold">
                    {orderData.pcb_qty} Pcs
                  </p>
                </div>
                <div className="md:col-span-2 space-y-1 border-t border-slate-50 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.notes}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {orderData.notes || "No additional notes"}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping & Billing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipping */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> {t.shipping}
                </h4>
                {orderData.receivePlace === "bysending" ? (
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>{orderData.shippingName}</strong>
                    </p>
                    <p className="text-slate-500">{orderData.shippingPhone}</p>
                    <p className="text-slate-500 leading-relaxed">
                      {orderData.shippingAddress}, {orderData.shippingCity},{" "}
                      {orderData.shippingPostalCode}
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-xs font-bold border border-emerald-100">
                    * Customer will pickup at company
                  </div>
                )}
              </div>
              {/* Billing */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FaFileInvoice className="text-blue-500" /> {t.billing}
                </h4>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>{orderData.billingName}</strong>
                  </p>
                  <p className="text-slate-500">
                    Tax ID: {orderData.billingTax}
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    {orderData.billingAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Status */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" /> {t.delivery}
              </h4>
              {orderData.isDelivered ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                    <FaCheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-emerald-900 font-bold">
                      {t.deliveredOn}
                    </p>
                    <p className="text-emerald-600 text-sm">
                      {format(new Date(orderData.deliveryAt), "PPpp")} • Track:{" "}
                      {orderData.transferedNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                    <FaTimesCircle size={24} />
                  </div>
                  <p className="text-rose-900 font-bold">{t.notDelivered}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Spec & Calculation */}
          <div className="lg:col-span-5 space-y-8">
            {/* Spec Summary Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 font-bold text-slate-800">
                Component Specifications
              </div>
              <div className="p-6 space-y-6">
                {/* SMD Section */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <h5 className="text-blue-700 font-black text-xs uppercase tracking-widest mb-3">
                    Surface Mount (SMD)
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Side:</span>{" "}
                      <span className="font-bold">{orderData.smd_side}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Count:</span>{" "}
                      <span className="font-bold">{orderData.count_smd}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Total Points:</span>{" "}
                      <span className="font-bold">
                        {orderData.total_point_smd}
                      </span>
                    </div>
                  </div>
                </div>
                {/* THT Section */}
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  <h5 className="text-amber-700 font-black text-xs uppercase tracking-widest mb-3">
                    Through-Hole (THT)
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Side:</span>{" "}
                      <span className="font-bold">{orderData.tht_side}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Count:</span>{" "}
                      <span className="font-bold">{orderData.count_tht}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Total Points:</span>{" "}
                      <span className="font-bold">
                        {orderData.total_point_tht}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Visuals */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Top & Bottom Previews
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...topImages, ...bottomImages].map((img, i) => (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        key={i}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm shadow-slate-100"
                        onClick={() => setZoomedImage(img.url)}
                      >
                        <img
                          src={img.url}
                          alt="pcb"
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Summary Card */}
            <div className="bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 overflow-hidden ring-1 ring-white/10">
              <div className="p-8">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                  <FaCalculator className="text-blue-500" /> {t.cost}
                </h3>

                <div className="space-y-4 border-b border-white/10 pb-6 mb-6 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assembly Cost (SMD)</span>
                    <span className="font-bold">{orderData.smdCost} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assembly Cost (THT)</span>
                    <span className="font-bold">{orderData.thtCost} ฿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stencil & Setup</span>
                    <span className="font-bold">
                      {orderData.stencil_price} ฿
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>VAT (7%)</span>
                    <span>{orderData.vatPrice} ฿</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest">
                      Total Confirmed Price
                    </p>
                    <p className="text-4xl font-black text-white">
                      {orderData.confirmed_price || "Pending"}
                    </p>
                  </div>
                  <span className="text-slate-400 font-bold text-sm">THB</span>
                </div>

                {/* Payment Slip Display */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Payment Reference
                    </p>
                    <p className="text-xs truncate text-slate-300">
                      {format(new Date(orderData.transferedDate), "PPpp")}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative shrink-0 w-20 h-24 rounded-lg overflow-hidden border border-white/20 cursor-pointer shadow-lg"
                    onClick={() =>
                      setZoomedImage(getFullUrl(orderData.paymentSlip))
                    }
                  >
                    <img
                      src={getFullUrl(orderData.paymentSlip)}
                      alt="slip"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <FaImage className="text-white" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 bg-slate-900/95 z-[100] backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedImage}
              alt="Fullscreen View"
              className="max-w-full max-h-full rounded-2xl shadow-2xl ring-4 ring-white/10"
            />
            <button className="fixed top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition-all">
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderassemblyDetailScreen;
