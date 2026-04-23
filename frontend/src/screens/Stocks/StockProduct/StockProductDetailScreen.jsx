import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaBox,
  FaRegCopy,
  FaCheck,
  FaTimes,
  FaExternalLinkAlt,
  FaStar,
  FaStar as FaStarOutline,
  FaImage,
  FaLink,
  FaCubes,
  FaWeight,
  FaMapMarker,
  FaIndustry,
  FaTag,
  FaDollarSign,
  FaLayerGroup,
  FaClipboard,
} from "react-icons/fa";
import {
  useGetStockProductByIdQuery,
  useRateProductMutation,
} from "../../../slices/stockProductApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { toast } from "react-toastify";
import { format } from "date-fns";

// Copy to clipboard helper
const CopyItem = ({ text, label }) => {
  if (!text || text === "-") return <span className="text-slate-400">-</span>;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(
      <div className="flex items-center">
        <FaCheck className="me-2 text-emerald-500" />
        <span>
          Copied <strong>{label}</strong>
        </span>
      </div>,
      {
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: true,
        closeButton: false,
      },
    );
  };

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-2 hover:text-indigo-600 transition-colors cursor-pointer"
      title="Click to copy"
    >
      <span className="text-slate-700 font-medium">{text}</span>
      <FaRegCopy className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={12} />
    </button>
  );
};

// Star Rating Component
const StarRating = ({ value, onRate, isLoading }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          disabled={isLoading}
          className="p-1 focus:outline-none transition-transform hover:scale-110 disabled:opacity-50"
        >
          {value >= star ? (
            <FaStar className="text-amber-400 text-xl" />
          ) : (
            <FaStarOutline className="text-slate-300 text-xl hover:text-amber-300 transition-colors" />
          )}
        </button>
      ))}
    </div>
  );
};

const StockProductDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  const { data: product, isLoading, isError, refetch } = useGetStockProductByIdQuery(id);
  const [rateProduct, { isLoading: isRating }] = useRateProductMutation();

  const handleRating = async (newRating) => {
    try {
      const finalRating = newRating;
      await rateProduct({ productId: id, rating: finalRating }).unwrap();
      toast.success(
        finalRating > 0 ? `Rated ${finalRating} stars` : "Rating cleared",
      );
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <Message variant="danger">Error loading product details</Message>;

  // Translations
  const t = {
    en: {
      back: "Back to Product List",
      stock: "Current Stock",
      units: "units available",
      description: "Description",
      technicalSpecs: "Technical Specifications",
      supplyChain: "Supply Chain",
      inventoryInfo: "Inventory Information",
      footprint: "Footprint",
      position: "Storage Position",
      process: "Process",
      weight: "Weight",
      alternative: "Alternative Part",
      datasheet: "Datasheet / Link",
      electotronixPN: "Electotronix P/N",
      barcode: "Barcode",
      manufacturer: "Manufacturer",
      mfgPartNo: "Mfg Part No.",
      supplier: "Supplier",
      supplierPN: "Supplier PN",
      price: "Unit Price",
      moq: "MOQ",
      spq: "SPQ",
      totalQty: "Total Quantity",
      dateAdded: "Date Added",
      note: "Internal Note",
      openLink: "Open Link",
      noDescription: "No description available",
    },
    thai: {
      back: "กลับไปรายการสินค้า",
      stock: "สต็อกปัจจุบัน",
      units: "ชิ้นพร้อมใช้งาน",
      description: "รายละเอียด",
      technicalSpecs: "ข้อมูลจำเพาะทางเทคนิค",
      supplyChain: "ห่วงโซ่อุปทาน",
      inventoryInfo: "ข้อมูลสต็อก",
      footprint: "Footprint",
      position: "ตำแหน่งจัดเก็บ",
      process: "กระบวนการ",
      weight: "น้ำหนัก",
      alternative: "อะไหล่ทดแทน",
      datasheet: "Datasheet / ลิงก์",
      electotronixPN: "รหัสสินค้า Electotronix",
      barcode: "Barcode",
      manufacturer: "ผู้ผลิต",
      mfgPartNo: "Part No. ผู้ผลิต",
      supplier: "ผู้จัดจำหน่าย",
      supplierPN: "Part No. ผู้จัดจำหน่าย",
      price: "ราคาต่อหน่วย",
      moq: "MOQ",
      spq: "SPQ",
      totalQty: "จำนวนรวม",
      dateAdded: "วันที่เพิ่ม",
      note: "บันทึกภายใน",
      openLink: "เปิดลิงก์",
      noDescription: "ไม่มีรายละเอียด",
    },
  }[language || "en"];

  // Format price
  const formatPrice = (price) => {
    const num = Number(price);
    return !isNaN(num) ? `฿${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "-";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <FaArrowLeft size={14} />
            </div>
            <span>{t.back}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Image Section */}
            <div className="lg:col-span-3 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 flex items-center justify-center">
              <div className="w-48 h-48 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                {product.img ? (
                  <img
                    src={product.img}
                    alt={product.electotronixPN}
                    className="w-full h-full object-contain p-4 mix-blend-multiply"
                  />
                ) : (
                  <div className="text-center text-slate-300">
                    <FaBox size={48} className="mx-auto mb-2" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-9 p-6 lg:p-8">
              {/* Category Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                  {product.category || "Uncategorized"}
                </span>
                {product.subcategory && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                      {product.subcategory}
                    </span>
                  </>
                )}
              </div>

              {/* Product Name / P/N */}
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <CopyItem
                  text={product.electotronixPN && product.electotronixPN !== "-" ? product.electotronixPN : (product.barcode || "-")}
                  label="Electotronix PN"
                />
              </h1>

              {/* Value */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Value:
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  <CopyItem text={product.value} label="Value" />
                </span>
              </div>

              {/* Stock & Price Row */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {/* Stock */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t.stock}
                  </div>
                  <div className={`text-3xl font-black ${product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {Number(product.quantity || 0).toLocaleString()}
                    <span className="text-sm font-normal text-slate-400 ml-2">{t.units}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t.price}
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Rating */}
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Rating
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={product.starRating || 0} onRate={handleRating} isLoading={isRating} />
                    {product.starRating > 0 && (
                      <span className="text-sm font-bold text-slate-600 ml-1">
                        {product.starRating}.0
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {t.description}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <CopyItem
                    text={product.description && product.description !== "No description available." ? product.description : product.value}
                    label="Description"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technical Specs Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FaLayerGroup size={18} />
              </div>
              <span className="font-bold text-slate-900">{t.technicalSpecs}</span>
            </div>
            <div className="p-6 space-y-5">
              <InfoRow icon={<FaLayerGroup size={14} />} label={t.footprint} value={product.footprint} />
              <InfoRow icon={<FaMapMarker size={14} />} label={t.position} value={product.position} />
              <InfoRow icon={<FaCubes size={14} />} label={t.process} value={product.process} />
              <InfoRow icon={<FaWeight size={14} />} label={t.weight} value={product.weight ? `${product.weight}g` : null} />
              <InfoRow icon={<FaTag size={14} />} label={t.alternative} value={product.alternative} />

              {/* Datasheet Link */}
              {product.link && (
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FaLink size={14} />
                    <span className="text-sm font-bold">{t.datasheet}</span>
                  </div>
                  <FaExternalLinkAlt size={12} />
                </a>
              )}

              {/* Electotronix P/N */}
              <div className="pt-4 border-t border-slate-100">
                <InfoRow label={t.electotronixPN} value={product.electotronixPN && product.electotronixPN !== "-" ? product.electotronixPN : (product.barcode || "-")} highlight />
              </div>
            </div>
          </div>

          {/* Supply Chain Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FaIndustry size={18} />
              </div>
              <span className="font-bold text-slate-900">{t.supplyChain}</span>
            </div>
            <div className="p-6 space-y-5">
              <InfoRow label={t.manufacturer} value={product.manufacture} />
              <InfoRow label={t.mfgPartNo} value={product.manufacturePN} />

              <div className="h-px bg-slate-100" />

              <InfoRow label={t.supplier} value={product.supplier} />
              <InfoRow label={t.supplierPN} value={product.supplierPN} />

              {/* Price Highlight */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {t.price}
                </div>
                <div className="text-2xl font-black">
                  {formatPrice(product.price)}
                </div>
              </div>

              {/* MOQ / SPQ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t.moq}
                  </div>
                  <CopyItem text={product.moq} label="MOQ" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t.spq}
                  </div>
                  <CopyItem text={product.spq} label="SPQ" />
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Info Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                <FaBox size={18} />
              </div>
              <span className="font-bold text-slate-900">{t.inventoryInfo}</span>
            </div>
            <div className="p-6 space-y-5">
              {/* Total Quantity */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {t.totalQty}
                </div>
                <div className={`text-3xl font-black ${product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {Number(product.quantity || 0).toLocaleString()}
                </div>
              </div>

              {/* Date Added */}
              <InfoRow
                label={t.dateAdded}
                value={product.date ? format(new Date(product.date), "dd MMM yyyy") : null}
              />

              {/* Note */}
              {product.note && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                  <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
                    <FaClipboard size={12} />
                    {t.note}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {product.note}
                  </p>
                </div>
              )}

              {/* Barcode */}
              {product.barcode && product.barcode !== "-" && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {t.barcode}
                  </div>
                  <CopyItem text={product.barcode} label="Barcode" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Info Row Component
const InfoRow = ({ icon, label, value, highlight }) => {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-400 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className={`text-sm font-semibold text-right ${highlight ? "text-slate-900" : "text-slate-700"}`}>
        <CopyItem text={value} label={label} />
      </div>
    </div>
  );
};

export default StockProductDetailScreen;
