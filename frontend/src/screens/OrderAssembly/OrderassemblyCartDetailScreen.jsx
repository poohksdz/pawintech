import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck,
  FaDownload,
  FaImage,
  FaArrowLeft,
  FaHashtag,
  FaLayerGroup,
  FaRulerCombined,
  FaMicrochip,
  FaRobot,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { TbExclamationMark } from "react-icons/tb";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetAssemblycartByIdQuery } from "../../slices/assemblypcbCartApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { FaPrint } from "react-icons/fa";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderassemblyCartDetailScreen = () => {
  const textareaRef = useRef();
  const { id } = useParams();
  const [zoomedImage, setZoomedImage] = useState(null);
  const { data, isLoading, isError, error } = useGetAssemblycartByIdQuery(id);
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);


  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    const path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;
    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) normalizedPath = "/" + normalizedPath;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : APP_BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const handleDownloadAll = async (e) => {
    e.preventDefault();
    if (!order) return;
    const zip = new JSZip();
    const folder = zip.folder(`${order.projectname || "project"}`);

    try {
      if (order.gerber_zip) {
        const zipUrl = getFullUrl(order.gerber_zip);
        const gerberResp = await fetch(zipUrl);
        const gerberBlob = await gerberResp.blob();
        folder.file(
          order.gerber_zip.split("/").pop() || "gerber.zip",
          gerberBlob,
        );
      }

      const imageFields = [
        "image_top_1",
        "image_top_2",
        "image_top_3",
        "image_top_4",
        "image_top_5",
        "image_top_6",
        "image_top_7",
        "image_top_8",
        "image_top_9",
        "image_top_10",
        "image_bottom_1",
        "image_bottom_2",
        "image_bottom_3",
        "image_bottom_4",
        "image_bottom_5",
        "image_bottom_6",
        "image_bottom_7",
        "image_bottom_8",
        "image_bottom_9",
        "image_bottom_10",
      ];

      for (const field of imageFields) {
        if (order[field]) {
          const url = getFullUrl(order[field]);
          const resp = await fetch(url);
          const blob = await resp.blob();
          folder.file(`${field}.jpg`, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${order.projectname || "project"}-packaging.zip`);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to create ZIP");
    }
  };

  const t = {
    en: {
      ProjectSpecs: "Project Specifications",
      ProjectName: "Project Name",
      Quantity: "Quantity",
      Note: "Note",
      BoardType: "Board Type",
      Dimensions: "Dimensions",
      SMDDetails: "SMD Assembly",
      THTDetails: "THT Assembly",
      Stencil: "Stencil Status",
      Files: "Files & Assets",
      Gallery: "Image Gallery",
      Estimated: "Estimated Cost",
      Confirmed: "Confirmed Price",
      Status: "Project Status",
    },
    thai: {
      ProjectSpecs: "ข้อมูลสรุปโปรเจกต์",
      ProjectName: "ชื่อโปรเจกต์",
      Quantity: "จำนวน",
      Note: "หมายเหตุ",
      BoardType: "ประเภทบอร์ด",
      Dimensions: "ขนาดบอร์ด",
      SMDDetails: "การประกอบ SMD",
      THTDetails: "การประกอบ THT",
      Stencil: "สถานะสเตนซิล",
      Files: "ไฟล์และเอกสาร",
      Gallery: "แกลเลอรีรูปภาพ",
      Estimated: "ราคาประเมิน",
      Confirmed: "ราคาสุทธิ",
      Status: "สถานะโปรเจกต์",
    },
  }[language || "en"];

  const order = data?.data;

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setZoomedImage(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (isError)
    return (
      <div className="p-4 md:p-8">
        <Message variant="danger">{error.message}</Message>
      </div>
    );

  const SpecItem = ({ label, value, confirmed, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            <Icon size={14} />
          </div>
        )}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
            {label}
          </p>
          <p className="text-[14px] font-bold text-slate-900 leading-tight">
            {value || "N/A"}
          </p>
        </div>
      </div>
      <div>
        {confirmed === 1 ? (
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
            <FaCheck size={10} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
            <TbExclamationMark size={14} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-8 font-prompt">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="space-y-4">
            <Link
              to="/cart/assemblycart"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[11px] uppercase tracking-widest"
            >
              <FaArrowLeft size={10} /> Back to Cart
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              {order.projectname}
              <span className="block text-lg font-bold text-slate-400 tracking-normal capitalize mt-1">
                Assembly Project Details
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadAll}
              className="px-4 md:px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center gap-3 active:scale-95"
            >
              <FaDownload size={12} /> Download Project Package
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 md:gap-10">
          {/* Main Content Areas */}
          <div className="lg:col-span-8 space-y-10">
            {/* Project Specs Grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <FaLayerGroup className="text-indigo-500" /> {t.ProjectSpecs}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpecItem
                  label={t.ProjectName}
                  value={order.projectname}
                  confirmed={order.confirmProjectName}
                  icon={FaHashtag}
                />
                <SpecItem
                  label={t.Quantity}
                  value={`${order.pcb_qty} PCS`}
                  confirmed={order.confirmQty}
                  icon={FaLayerGroup}
                />
                <SpecItem
                  label={t.BoardType}
                  value={order.board_types}
                  confirmed={order.confirmBoardType}
                  icon={FaLayerGroup}
                />
                <SpecItem
                  label={t.Dimensions}
                  value={`${order.width_mm} x ${order.high_mm} mm`}
                  confirmed={order.confirmWidth && order.confirmHeight}
                  icon={FaRulerCombined}
                />
                <SpecItem
                  label={t.SMDDetails}
                  value={`${order.count_smd} Parts / ${order.total_point_smd} Pins (${order.smd_side})`}
                  confirmed={order.confirmCountSmd}
                  icon={FaMicrochip}
                />
                <SpecItem
                  label={t.THTDetails}
                  value={`${order.count_tht} Parts / ${order.total_point_tht} Pins (${order.tht_side})`}
                  confirmed={order.confirmCountTht}
                  icon={FaRobot}
                />
              </div>
            </div>

            {/* Note & Reason Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                Notes & Evaluation
              </h2>
              <div className="bg-white rounded-[2rem] border border-slate-200/60 p-4 md:p-8 shadow-sm space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    Customer Note
                  </h4>
                  <p className="text-slate-600 font-medium leading-relaxed italic">
                    "{order.notes || "No notes provided"}"
                  </p>
                </div>
                {order.confirmed_reason && (
                  <div className="pt-8 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                      Engineer's Response
                    </h4>
                    <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-bold whitespace-pre-wrap leading-relaxed text-[13px]">
                      {order.confirmed_reason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Photo Gallery */}
          <div className="lg:col-span-4 space-y-10">
            {/* Status Summary Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-4 md:p-8 text-white shadow-2xl shadow-slate-200/50 space-y-8">
              <div className="space-y-1 border-b border-white/5 pb-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">
                  {t.Status}
                </h3>
                <p className="text-xl font-black capitalize">
                  {order.status || "Pending"}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {t.Estimated}
                  </p>
                  <p className="text-2xl font-black tabular-nums">
                    {order.estimatedCost || "-"}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                    {t.Confirmed}
                  </p>
                  <p className="text-3xl font-black tabular-nums text-white">
                    {order.confirmed_price
                      ? `฿${parseFloat(order.confirmed_price).toLocaleString()}`
                      : "Wait Quote"}
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <FaImage className="text-indigo-500" /> {t.Gallery}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(10)]
                  .flatMap((_, i) => [
                    `image_top_${i + 1}`,
                    `image_bottom_${i + 1}`,
                  ])
                  .filter((field) => order[field])
                  .slice(0, 8)
                  .map((field, idx) => (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={idx}
                      onClick={() => setZoomedImage(getFullUrl(order[field]))}
                      className="aspect-square bg-white rounded-2xl border border-slate-200/60 overflow-hidden cursor-zoom-in shadow-sm hover:shadow-md transition-all p-2"
                    >
                      <img
                        src={getFullUrl(order[field])}
                        alt="Project detail"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Portal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedImage}
              alt="Zoomed detail"
              className="max-w-full max-h-full rounded-3xl shadow-2xl border border-white/10"
            />
            <div className="absolute top-8 right-8 text-white/50 font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
              Press ESC to close{" "}
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                ?
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif; }
      ` }} />

    </div>
  );
};

export default OrderassemblyCartDetailScreen;
