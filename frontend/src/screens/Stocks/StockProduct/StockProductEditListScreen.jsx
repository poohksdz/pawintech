import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilter,
  FaBoxOpen,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaIndustry,
  FaTimes,
  FaCogs,
  FaChevronDown,
  FaEye,
  FaLink,
  FaRegCopy,
} from "react-icons/fa";
import {
  useGetStockProductsQuery,
  useDeleteStockProductMutation,
} from "../../../slices/stockProductApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ============================================================================
// INLINE DROPDOWN COMPONENT (For Top Bar)
// ============================================================================
const InlineDropdown = ({
  icon: Icon,
  name,
  value,
  options,
  disabled,
  placeholder,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options?.find(
    (o) => String(o.value) === String(value),
  );

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 px-4 bg-white border ${isOpen ? "border-indigo-400 ring-4 ring-indigo-50" : "border-slate-200"} rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-between min-w-[200px] transition-all hover:border-slate-300 outline-none ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer shadow-sm"}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon
            className={selectedOption ? "text-indigo-500" : "text-slate-400"}
            size={14}
          />
          <span
            className={`truncate ${!selectedOption ? "text-slate-400 font-medium" : ""}`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-slate-400 ml-2" size={10} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <React.Fragment key="dropdown-fragment">
            <div
              className="fixed inset-0 z-[110]"
              onClick={() => setIsOpen(false)}
            />
            <motion.ul
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 z-[120] w-[240px] mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
            >
              <li
                onClick={() => {
                  onChange({ target: { name, value: "" } });
                  setIsOpen(false);
                }}
                className="px-5 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors uppercase tracking-wider"
              >
                All {placeholder}
              </li>
              {options?.map((opt) => (
                <li
                  key={String(opt.key)}
                  onClick={() => {
                    onChange({ target: { name, value: opt.value } });
                    setIsOpen(false);
                  }}
                  className={`px-5 py-3 text-sm font-medium hover:bg-indigo-50/50 hover:text-indigo-700 cursor-pointer transition-colors flex items-center gap-2 ${String(value) === String(opt.value) ? "text-indigo-700 bg-indigo-50/50 font-bold" : "text-slate-700"}`}
                >
                  {opt.label}
                </li>
              ))}
            </motion.ul>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// MAIN SCREEN: STOCK PRODUCT EDIT LIST
// ============================================================================
// Quick Look Modal Component
const QuickLookModal = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  const DetailItem = ({ label, value, fullWidth, isBarcode }) => (
    <div className={`${fullWidth ? "col-span-2" : "col-span-1"}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-sm font-bold ${isBarcode ? "font-mono text-indigo-600 tracking-wider" : "text-slate-800"} break-words`}>
        {value || "-"}
      </p>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl z-10 border border-slate-100"
          >
            {/* Header */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">
                  Component Quick Look
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {product.electotronixPN && product.electotronixPN !== "-" ? product.electotronixPN : (product.barcode || "-")}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white text-slate-400 hover:text-rose-500 hover:shadow-md rounded-2xl flex items-center justify-center transition-all border border-slate-200"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: Image */}
                <div className="md:col-span-4">
                  <div className="aspect-square rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-6 mb-4 overflow-hidden shadow-inner">
                    {product.img ? (
                      <img
                        src={`/componentImages${product.img}`}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <FaBoxOpen className="text-slate-200" size={60} />
                    )}
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                      Current Stock
                    </p>
                    <p className="text-2xl font-black text-indigo-700">
                      {Number(product.quantity || 0).toLocaleString()}{" "}
                      <span className="text-sm font-bold opacity-60">pcs</span>
                    </p>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="md:col-span-8 grid grid-cols-2 gap-y-6 gap-x-4">
                  <DetailItem label="Value" value={product.value} />
                  <DetailItem
                    label="Manufacturer"
                    value={product.manufacture}
                  />
                  <DetailItem label="Category" value={product.category} />
                  <DetailItem
                    label="Subcategory"
                    value={product.subcategory}
                  />
                  <DetailItem label="Footprint" value={product.footprint} />
                  <DetailItem label="MPN" value={product.manufacturePN} />
                  <DetailItem label="Supplier" value={product.supplier} />
                  <DetailItem label="Supplier PN" value={product.supplierPN} />
                  <DetailItem
                    label="Price"
                    value={`${Number(product.price || 0).toFixed(4)} ฿`}
                  />
                  <DetailItem label="Position" value={product.position} />
                  <DetailItem label="Electotronix P/N" value={product.electotronixPN && product.electotronixPN !== "-" ? product.electotronixPN : (product.barcode || "-")} />

                  {product.link && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Datasheet / Link
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/link truncate"
                        >
                          <FaLink size={12} className="shrink-0" />
                          <span className="truncate">{product.link}</span>
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(product.link);
                            toast.success("Link copied to clipboard", {
                              position: "bottom-center",
                              autoClose: 1000,
                              hideProgressBar: true,
                              closeButton: false,
                            });
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-slate-200 rounded-xl transition-all shrink-0"
                          title="Copy Link"
                        >
                          <FaRegCopy size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <hr className="col-span-2 border-slate-100 my-1" />

                  <DetailItem
                    label="Description"
                    value={product.description && product.description !== "No description available." ? product.description : product.value}
                    fullWidth
                  />
                  <DetailItem label="Note" value={product.note} fullWidth />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

const StockProductEditListScreen = () => {
  const navigate = useNavigate();

  // API
  const {
    data: stockData,
    isLoading,
    error,
    refetch,
  } = useGetStockProductsQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const [deleteStockProduct, { isLoading: loadingDelete }] =
    useDeleteStockProductMutation();

  const products = useMemo(() => stockData?.products || [], [stockData]);

  // UI States
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ manufacturer: "" });

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showQuickLook, setShowQuickLook] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Scroll Lock
  useEffect(() => {
    if (showMobileFilter || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilter, showDeleteModal]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    if (formData.manufacturer)
      filtered = filtered.filter(
        (p) => p.manufacture === formData.manufacturer,
      );
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.electotronixPN || "").toLowerCase().includes(query) ||
          (item.manufacturePN || "").toLowerCase().includes(query) ||
          (item.value || "").toLowerCase().includes(query) ||
          (item.description || "").toLowerCase().includes(query) ||
          (item.category || "").toLowerCase().includes(query) ||
          (item.subcategory || "").toLowerCase().includes(query) ||
          (item.manufacture || "").toLowerCase().includes(query) ||
          (item.footprint || "").toLowerCase().includes(query) ||
          (item.supplier || "").toLowerCase().includes(query) ||
          (item.barcode || "").toLowerCase().includes(query) ||
          (item.note || "").toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [products, formData, searchQuery]);

  // Auto-open Quick Look if barcode matches exactly
  useEffect(() => {
    if (filteredProducts.length === 1 && searchQuery.trim() !== "") {
      const p = filteredProducts[0];
      if (p.barcode === searchQuery.trim()) {
        setSelectedProduct(p);
        setShowQuickLook(true);
      }
    }
  }, [filteredProducts, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handlers
  const handleTriggerSearch = () => {
    setSearchQuery(searchInput);
    setShowMobileFilter(false);
    setCurrentPage(1);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleTriggerSearch();
  };
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchQuery("");
    setFormData({ manufacturer: "" });
    setCurrentPage(1);
    setShowMobileFilter(false);
  };

  const confirmDeleteHandler = async () => {
    if (productToDelete) {
      try {
        await deleteStockProduct(productToDelete.ID).unwrap();
        toast.success("Product deleted successfully");
        setShowDeleteModal(false);
        setProductToDelete(null);
        refetch();
      } catch (err) {
        toast.error(
          err?.data?.message || err.error || "Failed to delete product",
        );
      }
    }
  };

  const formatPrice = (price) => {
    const num = Number(price);
    return !isNaN(num)
      ? `฿${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : "-";
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  const isFilterActive = searchQuery !== "" || formData.manufacturer !== "";

  return (
    <React.Fragment>
      <div className="bg-[#F8FAFC] min-h-screen font-sans pb-24 text-slate-800 antialiased selection:bg-indigo-100 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10" />

        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 relative z-10">
          {/* ================= PAGE HEADER ================= */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                  <FaCogs size={20} />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                    Configuration
                  </h1>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-2">
                จัดการและแก้ไขข้อมูลสินค้าในคลังทั้งหมด {products.length} รายการ
              </p>
            </div>

            {/* Top Action Bar (Desktop) */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Input */}
              <div className="relative w-64 xl:w-80">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, MPN, รายละเอียด..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Dropdown Filter */}
              <InlineDropdown
                icon={FaIndustry}
                name="manufacturer"
                value={formData.manufacturer}
                options={manufactureData?.map((m) => ({
                  key: m.ID,
                  value: m.namemanufacture,
                  label: m.namemanufacture,
                }))}
                placeholder="Manufacturer"
                onChange={handleChange}
              />

              {/* Clear Filter Button */}
              <AnimatePresence>
                {isFilterActive && (
                  <motion.button
                    initial={{ opacity: 0, width: 0, padding: 0 }}
                    animate={{
                      opacity: 1,
                      width: "auto",
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                    exit={{ opacity: 0, width: 0, padding: 0 }}
                    onClick={handleReset}
                    className="h-11 whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors overflow-hidden"
                  >
                    Clear
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="w-px h-8 bg-slate-200 mx-1"></div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/componenteditlist/set")}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 h-11 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
              >
                <FaPlus size={12} />
                <span>Create New</span>
              </motion.button>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-3 w-full">
              <div className="relative flex-1">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 h-12 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowMobileFilter(true)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shadow-sm border ${isFilterActive ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-600 border-slate-200"}`}
              >
                <FaFilter size={14} />
              </button>
              <button
                onClick={() => navigate("/componenteditlist/set")}
                className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md"
              >
                <FaPlus size={14} />
              </button>
            </div>
          </header>

          {/* ================= MAIN CONTENT ================= */}
          <main>
            <AnimatePresence mode="wait">
              {currentItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <FaSearch className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    ไม่พบสินค้า
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    ไม่พบข้อมูลสินค้าที่ตรงกับคำค้นหาหรือตัวกรองของคุณ
                    กรุณาลองใหม่อีกครั้ง
                  </p>
                  {isFilterActive && (
                    <button
                      onClick={handleReset}
                      className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </motion.div>
              ) : (
                <div>
                  {/* DESKTOP VIEW (Modern Edge-to-Edge Table in Card) */}
                  <div className="hidden lg:block bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="py-5 pl-8 pr-4 w-28 text-center">
                            Preview
                          </th>
                          <th className="py-5 px-4">Component Details</th>
                          <th className="py-5 px-4 w-48">Brand / MFR</th>
                          <th className="py-5 px-4 w-32 text-right">
                            Inventory
                          </th>
                          <th className="py-5 px-4 w-32 text-right">
                            Unit Price
                          </th>
                          <th className="py-5 pr-8 pl-4 w-36 text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/80">
                        {currentItems.map((p, index) => (
                          <motion.tr
                            key={p.ID}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.02,
                              ease: "easeOut",
                            }}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-4 pl-8 pr-4">
                              <div className="w-14 h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center justify-center mx-auto overflow-hidden p-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                {p.img ? (
                                  <img
                                    src={`/componentImages${p.img}`}
                                    alt={p.electotronixPN}
                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <FaBoxOpen
                                    className="text-slate-200"
                                    size={24}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 max-w-[300px]">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  {p.category}
                                </span>
                              </div>
                              <div
                                className="font-bold text-slate-900 truncate text-[15px]"
                                title={p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                              >
                                {p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                              </div>
                              <div
                                className="text-[11px] font-black text-indigo-600 truncate mt-0.5"
                                title={p.value}
                              >
                                {p.value}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                {p.manufacture || "-"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span
                                className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold ${p.quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                              >
                                {Number(p.quantity || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-slate-800 text-sm">
                              {formatPrice(p.price)}
                            </td>
                            <td className="py-4 pr-8 pl-4">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setShowQuickLook(true);
                                  }}
                                  className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white hover:shadow-md flex items-center justify-center transition-all"
                                  title="Quick Look"
                                >
                                  <FaEye size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/componenteditlist/${p.ID}/edit`)
                                  }
                                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md flex items-center justify-center transition-all"
                                  title="Edit Configuration"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setProductToDelete(p);
                                    setShowDeleteModal(true);
                                  }}
                                  className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-md flex items-center justify-center transition-all"
                                  title="Delete Product"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE LIST VIEW */}
                  <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentItems.map((p, index) => (
                      <motion.div
                        key={p.ID}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative"
                      >
                        <div className="flex gap-4 mb-4">
                          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                            {p.img ? (
                              <img
                                src={`/componentImages${p.img}`}
                                alt={p.electotronixPN}
                                className="max-w-full max-h-full object-contain mix-blend-multiply"
                              />
                            ) : (
                              <FaBoxOpen className="text-slate-200" size={28} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                {p.category}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                #{p.ID}
                              </span>
                            </div>
                            <h4
                              className="font-bold text-slate-900 truncate text-[15px] mb-1"
                              title={p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                            >
                              {p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                            </h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                {p.manufacture || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-end mb-5 px-1">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Stock
                            </p>
                            <span
                              className={`text-sm font-black ${p.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {Number(p.quantity || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Price
                            </p>
                            <span className="text-sm font-black text-slate-800">
                              {formatPrice(p.price)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-auto border-t border-slate-100 pt-4">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowQuickLook(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center transition-all"
                            title="Quick Look"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/componenteditlist/${p.ID}/edit`)
                            }
                            className="flex-1 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <FaEdit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setShowDeleteModal(true);
                            }}
                            className="flex-1 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <FaTrash size={14} /> Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => c - 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
                >
                  <FaChevronLeft size={10} />
                </button>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      const isPageDots =
                        totalPages > 5 &&
                        (pageNum < currentPage - 1 ||
                          pageNum > currentPage + 1) &&
                        pageNum !== 1 &&
                        pageNum !== totalPages;
                      if (isPageDots) {
                        if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        )
                          return (
                            <span
                              key={pageNum}
                              className="text-slate-400 px-2 text-xs font-bold"
                            >
                              ...
                            </span>
                          );
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[32px] h-8 px-2 rounded-full text-xs font-bold transition-all ${currentPage === pageNum ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => c + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* MODALS (PORTAL) */}
      {/* ============================================================================ */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {/* Mobile Filter Drawer */}
            {showMobileFilter && (
              <div className="fixed inset-0 z-[9999] flex justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileFilter(false)}
                  className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="relative w-[85%] max-w-sm bg-[#f8fafc] h-full shadow-2xl flex flex-col z-10"
                >
                  <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                    <h2 className="text-base font-bold text-slate-900">
                      Filters
                    </h2>
                    <button
                      onClick={() => setShowMobileFilter(false)}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-6">
                      <label className="text-[11px] font-bold text-slate-500 mb-2 block tracking-widest uppercase">
                        Search Product
                      </label>
                      <div className="relative">
                        <FaSearch
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={12}
                        />
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="MPN, Brand, Desc..."
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 shadow-sm bg-white"
                        />
                      </div>
                    </div>
                    <InlineDropdown
                      icon={FaIndustry}
                      name="manufacturer"
                      value={formData.manufacturer}
                      options={manufactureData?.map((m) => ({
                        key: m.ID,
                        value: m.namemanufacture,
                        label: m.namemanufacture,
                      }))}
                      onChange={handleChange}
                      placeholder="Manufacturer"
                    />
                  </div>
                  <div className="p-6 border-t border-slate-200 flex gap-3 bg-white">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 text-slate-600 bg-slate-100 text-sm font-bold hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleTriggerSearch}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md transition-all"
                    >
                      Apply Results
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && productToDelete && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => !loadingDelete && setShowDeleteModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="relative bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center z-10 border border-slate-100"
                >
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaTrash size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Delete Configuration?
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                    You are about to permanently delete{" "}
                    <strong className="text-slate-800">
                      {productToDelete.electotronixPN ||
                        productToDelete.manufacturePN}
                    </strong>
                    .<br />
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      disabled={loadingDelete}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={loadingDelete}
                      onClick={confirmDeleteHandler}
                      className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loadingDelete ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <QuickLookModal
              isOpen={showQuickLook}
              onClose={() => {
                setShowQuickLook(false);
                setSelectedProduct(null);
              }}
              product={selectedProduct}
            />
          </AnimatePresence>,
          document.body,
        )}

      <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
    </React.Fragment>
  );
};

export default StockProductEditListScreen;
