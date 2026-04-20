import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaShoppingCart,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaIndustry,
  FaPlus,
  FaMinus,
  FaChevronDown,
  FaWarehouse,
  FaMapMarkerAlt,
  FaStar,
  FaRegStar,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import { useGetStockProductsQuery } from "../../../slices/stockProductApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useGetStockSubcategoriesQuery } from "../../../slices/stockSubcategoryApiSlice";
import { useGetStockFootprintsQuery } from "../../../slices/stockFootprintApiSlice";
import { useGetStockSuppliersQuery } from "../../../slices/stockSupplierApiSlice";
import { addToAdditionStockCart } from "../../../slices/stockAdditionApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ============================================================================
// COMPONENT: MINIMALIST DROPDOWN
// ============================================================================
const CustomDropdown = ({
  label,
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
    <div className="mb-2 relative">
      <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-white border ${isOpen ? "border-indigo-400 ring-2 ring-indigo-50" : "border-slate-200"} rounded-xl px-4 py-2 text-sm font-medium text-slate-800 flex items-center justify-between transition-all hover:border-slate-300 outline-none ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}`}
        >
          <span
            className={`truncate mr-2 ${!selectedOption ? "text-slate-400 font-normal" : ""}`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <FaChevronDown className="text-slate-400" size={10} />
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
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-[120] w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
              >
                <li
                  onClick={() => {
                    onChange({ target: { name, value: "" } });
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors uppercase tracking-wider"
                >
                  All {label}
                </li>
                {options?.map((opt) => (
                  <li
                    key={String(opt.key)}
                    onClick={() => {
                      onChange({ target: { name, value: opt.value } });
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm font-medium hover:bg-indigo-50/50 hover:text-indigo-700 cursor-pointer transition-colors ${String(value) === String(opt.value) ? "text-indigo-700 bg-indigo-50/50 font-semibold" : "text-slate-600"}`}
                  >
                    {opt.label}
                  </li>
                ))}
              </motion.ul>
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SCREEN: STOCK ADDITION DASHBOARD (Minimalist Style)
// ============================================================================
const StockAddProductListScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux
  const { additionstockcartItems = [] } = useSelector(
    (state) => state.additionstockcart || {},
  );

  // API
  const { data: stockData, isLoading, error } = useGetStockProductsQuery();
  const { data: categoryData = [] } = useGetStockCategoriesQuery();
  const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const { data: footprintData = [] } = useGetStockFootprintsQuery();
  const { data: supplierData = [] } = useGetStockSuppliersQuery();

  const products = useMemo(() => stockData?.products || [], [stockData]);

  // UI States
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [additionqty, setAdditionqty] = useState({});
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

  // Filter State
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    manufacturer: "",
    footprint: "",
    supplier: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 99999; // Show all products without pagination

  // Infinite scroll state
  const ITEMS_PER_BATCH = 50;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const sentinelRef = useRef(null);

  // Scroll Lock for Modals
  useEffect(() => {
    if (showDetailModal || showMobileFilter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDetailModal, showMobileFilter]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    if (formData.category)
      filtered = filtered.filter((p) => p.category === formData.category);
    if (formData.subcategory)
      filtered = filtered.filter((p) => p.subcategory === formData.subcategory);
    if (formData.manufacturer)
      filtered = filtered.filter(
        (p) => p.manufacture === formData.manufacturer,
      );
    if (formData.footprint)
      filtered = filtered.filter((p) => p.footprint === formData.footprint);
    if (formData.supplier)
      filtered = filtered.filter((p) => p.supplier === formData.supplier);

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.electotronixPN || "").toLowerCase().includes(query) ||
          (item.manufacturePN || "").toLowerCase().includes(query) ||
          (item.description || "").toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [formData, searchQuery, products]);

  const currentItems = filteredProducts.slice(0, visibleCount);
  const hasMore = currentItems.length < filteredProducts.length;

  // Infinite scroll: load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + ITEMS_PER_BATCH);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentItems.length]);

  // Handlers
  const handleTriggerSearch = () => {
    setSearchQuery(searchInput);
    setShowMobileFilter(false);
    setCurrentPage(1);
    setVisibleCount(ITEMS_PER_BATCH);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleTriggerSearch();
  };
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
    setVisibleCount(ITEMS_PER_BATCH);
  };
  const handleReset = () => {
    setSearchInput("");
    setSearchQuery("");
    setFormData({
      category: "",
      subcategory: "",
      manufacturer: "",
      footprint: "",
      supplier: "",
    });
    setCurrentPage(1);
    setVisibleCount(ITEMS_PER_BATCH);
  };

  // ปรับให้สามารถลดลงเหลือ 0 (เคลียร์ค่า) ได้
  const adjustQty = (id, amount) => {
    setAdditionqty((prev) => {
      const current = parseInt(prev[id] || 0, 10) || 0;
      const next = current + amount;
      if (next <= 0) {
        return { ...prev, [id]: "" };
      }
      return { ...prev, [id]: next };
    });
  };

  const addToAdditionStockCartHandler = (product, qty) => {
    const quantity = Number(qty);
    if (!quantity || quantity < 1) {
      toast.error("กรุณาระบุจำนวนที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    dispatch(
      addToAdditionStockCart({
        ...product,
        _id: String(product.ID),
        additionqty: quantity,
      }),
    );
    toast.success(
      `เพิ่ม ${product.electotronixPN || product.manufacturePN} ลงตะกร้าเติมสต็อกแล้ว`,
    );
    setAdditionqty((prev) => ({ ...prev, [product.ID]: "" }));
  };

  const handleViewDetail = (product) => {
    setSelectedDetailProduct(product);
    setShowDetailModal(true);
  };

  const formatPrice = (price) => {
    const num = Number(price);
    return !isNaN(num)
      ? `฿${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : "-";
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="p-4 md:p-6 lg:p-10">
        <Message variant="danger">
          {error?.data?.message || error.error || "ERROR"}
        </Message>
      </div>
    );

  return (
    <React.Fragment>
      <div className="bg-[#f9fafb] min-h-screen font-sans pb-24 text-slate-800 antialiased selection:bg-indigo-100 relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 relative z-10">
          {/* ================= HEADER ================= */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-10 pb-6 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <FaWarehouse size={18} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Stock Inbound
                </h1>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Select components to replenish your inventory from{" "}
                {filteredProducts.length} items.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar (Desktop) */}
              <div className="hidden lg:flex relative w-72">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search PN / MPN..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilter(true)}
                className="lg:hidden flex items-center justify-center w-11 h-11 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FaFilter size={14} />
              </button>

              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/componentaddcartlist")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 h-11 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                <FaShoppingCart size={14} />
                <span className="hidden sm:inline">Inbound List</span>
                {additionstockcartItems.length > 0 && (
                  <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center ml-0.5 shadow-sm">
                    {additionstockcartItems.length}
                  </span>
                )}
              </motion.button>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-10">
            {/* ================= SIDEBAR FILTERS (DESKTOP) ================= */}
            <aside className="w-64 shrink-0 hidden lg:block sticky top-8 self-start max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Filter Items
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-2">
                  <CustomDropdown
                    label="Category"
                    name="category"
                    value={formData.category}
                    options={categoryData?.map((c) => ({
                      key: c.ID,
                      value: c.category,
                      label: c.category,
                    }))}
                    placeholder="Any Category"
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label="Subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    options={subcategoryData
                      ?.filter(
                        (s) =>
                          formData.category && s.category === formData.category,
                      )
                      .map((s) => ({
                        key: s.ID,
                        value: s.subcategory,
                        label: s.subcategory,
                      }))}
                    disabled={!formData.category}
                    placeholder="Any Subcategory"
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    options={manufactureData?.map((m) => ({
                      key: m.ID,
                      value: m.namemanufacture,
                      label: m.namemanufacture,
                    }))}
                    placeholder="Any Manufacturer"
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label="Footprint"
                    name="footprint"
                    value={formData.footprint}
                    options={footprintData?.map((fp) => ({
                      key: fp.ID,
                      value: fp.namefootprint,
                      label: fp.namefootprint,
                    }))}
                    placeholder="Any Footprint"
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label="Supplier"
                    name="supplier"
                    value={formData.supplier}
                    options={supplierData?.map((s) => ({
                      key: s.ID,
                      value: s.namesupplier,
                      label: s.namesupplier,
                    }))}
                    placeholder="Any Supplier"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </aside>

            {/* ================= MAIN PRODUCT GRID ================= */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {currentItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50/50"
                  >
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <FaSearch className="text-slate-300" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      No components found
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Try resetting your filters to explore everything.
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-6 px-4 md:px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      Reset All Filters
                    </button>
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
                            <th className="py-5 px-4 w-16 text-center">
                              Star
                            </th>
                            <th className="py-5 px-4">Component Details</th>
                            <th className="py-5 px-4 w-48">Brand / MFR</th>
                            <th className="py-5 px-4 w-32 text-right">
                              Current Stock
                            </th>
                            <th className="py-5 px-4 w-32 text-right">
                              Cost
                            </th>
                            <th className="py-5 pr-8 pl-4 w-56 text-center">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {currentItems.map((p, index) => (
                            <tr
                              key={`p.ID ?? row-${index}`}
                              className="hover:bg-slate-50/50 transition-colors group"
                            >
                              <td className="py-4 pl-8 pr-4">
                                <div className="relative">
                                  <div
                                    className="w-14 h-14 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center justify-center mx-auto overflow-hidden p-2 group-hover:bg-white group-hover:shadow-sm transition-all cursor-pointer"
                                    onClick={() => handleViewDetail(p)}
                                  >
                                    {p.img ? (
                                      <img
                                        src={p.img}
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
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {p.isStarred ? (
                                    <FaStar className="text-amber-400" size={18} />
                                  ) : (
                                    <FaRegStar className="text-slate-300" size={18} />
                                  )}
                                  {p.starRating > 0 && (
                                    <span className="text-[9px] font-bold text-slate-400">
                                      {p.starRating} ({p.ratingCount})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 max-w-[300px]">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    {p.category}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">#{p.ID}</span>
                                  {p.important && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                      Priority
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="font-bold text-slate-900 leading-tight mb-0.5 cursor-pointer hover:text-slate-600 transition-colors truncate text-[15px]"
                                  onClick={() => handleViewDetail(p)}
                                  title={p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                                >
                                  {p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                                </div>
                                <div
                                  className="text-[10px] font-bold text-slate-400 mb-0.5 truncate"
                                  title={`MPN: ${p.manufacturePN}`}
                                >
                                  {p.manufacturePN || "-"}
                                </div>
                                <div
                                  className="text-[11px] font-black text-indigo-600 truncate"
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
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold ${p.quantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"} whitespace-nowrap`}
                                >
                                  {Number(p.quantity || 0).toLocaleString()} pcs
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-slate-800 text-sm">
                                {formatPrice(p.price)}
                              </td>
                              <td className="py-4 pr-8 pl-4 w-56 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all bg-white shadow-sm h-9 w-[100px] shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => adjustQty(p.ID, -1)}
                                      className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
                                    >
                                      <FaMinus size={10} />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={
                                        additionqty[p.ID] !== undefined
                                          ? additionqty[p.ID]
                                          : ""
                                      }
                                      onChange={(e) =>
                                        setAdditionqty((prev) => ({
                                          ...prev,
                                          [p.ID]: e.target.value,
                                        }))
                                      }
                                      placeholder="Qty"
                                      className="flex-1 w-full h-full px-0 text-center text-xs font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-normal hide-arrows"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => adjustQty(p.ID, 1)}
                                      className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
                                    >
                                      <FaPlus size={10} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() =>
                                      addToAdditionStockCartHandler(p, additionqty[p.ID])
                                    }
                                    className="h-9 px-3 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm text-xs font-bold"
                                  >
                                    <FaPlus className="mr-1" size={10} /> Add
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE LIST VIEW (Cards like EditList) */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentItems.map((p, index) => (
                        <div
                          key={`p.ID ?? card-${index}`}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative"
                        >
                          {p.important && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                                <FaExclamationCircle size={10} /> Priority
                              </span>
                            </div>
                          )}

                          <div className="flex gap-4 mb-4">
                            <div
                              className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2 cursor-pointer"
                              onClick={() => handleViewDetail(p)}
                            >
                              {p.img ? (
                                <img
                                  src={p.img}
                                  alt={p.electotronixPN}
                                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <FaBoxOpen className="text-slate-200" size={28} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                  {p.category}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  #{p.ID}
                                </span>
                              </div>
                              <h4
                                className="font-bold text-slate-900 truncate text-[15px] mb-1 cursor-pointer"
                                onClick={() => handleViewDetail(p)}
                                title={p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                              >
                                {p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}
                              </h4>
                              <div className="text-[10px] font-bold text-slate-400 mb-1 truncate">
                                {p.manufacturePN || "-"}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                  {p.manufacture || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mb-4 px-1">
                            {p.isStarred ? (
                              <FaStar className="text-amber-400" size={16} />
                            ) : (
                              <FaRegStar className="text-slate-300" size={16} />
                            )}
                            <div className="flex items-center gap-0.5 ml-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={p.starRating >= star ? "text-amber-400" : "text-slate-200"}>
                                  {p.starRating >= star ? <FaStar size={10} /> : <FaRegStar size={10} />}
                                </span>
                              ))}
                            </div>
                            {p.starRating > 0 && <span className="text-[10px] text-slate-400 ml-1">({p.ratingCount})</span>}
                          </div>

                          <div className="flex justify-between items-end mb-4 px-1">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Stock
                              </p>
                              <span
                                className={`text-sm font-black ${p.quantity > 0 ? "text-emerald-600" : "text-rose-600"} whitespace-nowrap`}
                              >
                                {Number(p.quantity || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Cost
                              </p>
                              <span className="text-sm font-black text-slate-800">
                                {formatPrice(p.price)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-auto border-t border-slate-100 pt-4 items-center">
                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all bg-white shadow-sm h-10 w-[110px] shrink-0">
                              <button
                                type="button"
                                onClick={() => adjustQty(p.ID, -1)}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
                              >
                                <FaMinus size={10} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={
                                  additionqty[p.ID] !== undefined
                                    ? additionqty[p.ID]
                                    : ""
                                }
                                onChange={(e) =>
                                  setAdditionqty((prev) => ({
                                    ...prev,
                                    [p.ID]: e.target.value,
                                  }))
                                }
                                placeholder="Qty"
                                className="flex-1 w-full h-full px-0 text-center text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-normal hide-arrows"
                              />
                              <button
                                type="button"
                                onClick={() => adjustQty(p.ID, 1)}
                                className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
                              >
                                <FaPlus size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => addToAdditionStockCartHandler(p, additionqty[p.ID])}
                              className="flex-[2] h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white active:scale-[0.98] transition-all text-sm font-bold shadow-sm uppercase tracking-wider"
                            >
                              <FaPlus className="mr-2" size={12} /> Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>

              {/* Infinite Scroll Sentinel */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center py-10"
                >
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    กำลังโหลดเพิ่มเติม...
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* MODALS & DRAWERS (PORTAL) */}
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
                  className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10"
                >
                  <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">
                      Filter Items
                    </h2>
                    <button
                      onClick={() => setShowMobileFilter(false)}
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="mb-6">
                      <label className="text-[11px] font-semibold text-slate-500 mb-2 block tracking-wide uppercase">
                        Keyword Search
                      </label>
                      <div className="relative">
                        <FaSearch
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          size={12}
                        />
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="MPN, Brand, Desc..."
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 transition-all"
                        />
                      </div>
                    </div>
                    <CustomDropdown
                      label="Category"
                      name="category"
                      value={formData.category}
                      options={categoryData?.map((c) => ({
                        key: c.ID,
                        value: c.category,
                        label: c.category,
                      }))}
                      onChange={handleChange}
                    />
                    <CustomDropdown
                      label="Subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      options={subcategoryData
                        ?.filter(
                          (s) =>
                            formData.category &&
                            s.category === formData.category,
                        )
                        .map((s) => ({
                          key: s.ID,
                          value: s.subcategory,
                          label: s.subcategory,
                        }))}
                      disabled={!formData.category}
                      onChange={handleChange}
                    />
                    <CustomDropdown
                      label="Manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      options={manufactureData?.map((m) => ({
                        key: m.ID,
                        value: m.namemanufacture,
                        label: m.namemanufacture,
                      }))}
                      onChange={handleChange}
                    />
                    <CustomDropdown
                      label="Footprint"
                      name="footprint"
                      value={formData.footprint}
                      options={footprintData?.map((fp) => ({
                        key: fp.ID,
                        value: fp.namefootprint,
                        label: fp.namefootprint,
                      }))}
                      onChange={handleChange}
                    />
                    <CustomDropdown
                      label="Supplier"
                      name="supplier"
                      value={formData.supplier}
                      options={supplierData?.map((s) => ({
                        key: s.ID,
                        value: s.namesupplier,
                        label: s.namesupplier,
                      }))}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="p-5 border-t border-slate-100 flex gap-3 bg-white">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 text-slate-600 bg-slate-100 text-sm font-bold hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleTriggerSearch}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Detail Modal (Minimalist) */}
            {showDetailModal && selectedDetailProduct && (
              <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailModal(false)}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row z-10"
                >
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <FaTimes size={14} />
                  </button>

                  {/* Image Section */}
                  <div className="w-full md:w-2/5 p-4 md:p-8 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                    <div className="w-40 h-40 bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-center mb-6 shadow-sm">
                      {selectedDetailProduct.img ? (
                        <img
                          src={selectedDetailProduct.img}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                          alt="product"
                        />
                      ) : (
                        <FaBoxOpen className="text-slate-200" size={60} />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 text-center mb-1 leading-tight px-2">
                      {selectedDetailProduct.electotronixPN ||
                        selectedDetailProduct.manufacturePN}
                    </h3>
                    <p className="text-xs text-indigo-500 font-semibold">
                      {selectedDetailProduct.manufacture}
                    </p>
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-white flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-6">
                      Specifications
                    </h4>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-6 mb-8">
                      {[
                        {
                          label: "Category",
                          value: selectedDetailProduct.category,
                        },
                        {
                          label: "Subcategory",
                          value: selectedDetailProduct.subcategory,
                        },
                        {
                          label: "Part Number",
                          value: selectedDetailProduct.manufacturePN,
                        },
                        {
                          label: "Footprint",
                          value: selectedDetailProduct.footprint || "-",
                        },
                        {
                          label: "Location",
                          value: selectedDetailProduct.position || "-",
                          icon: FaMapMarkerAlt,
                        },
                        {
                          label: "Supplier",
                          value: selectedDetailProduct.supplier,
                        },
                        {
                          label: "Current Stock",
                          value: `${Number(selectedDetailProduct.quantity || 0).toLocaleString()} pcs`,
                        },
                        {
                          label: "Base Price",
                          value: formatPrice(selectedDetailProduct.price),
                        },
                      ].map((spec, i) => (
                        <div key={i}>
                          <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wide">
                            {spec.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {spec.icon && (
                              <spec.icon size={10} className="text-slate-400" />
                            )}
                            <span className="text-sm font-semibold text-slate-800 break-words">
                              {spec.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                      Description
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8 flex-1">
                      {selectedDetailProduct.description ||
                        "No detailed specifications provided."}
                    </p>

                    {/* Action Area */}
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                        Add to Inbound List
                      </label>
                      <div className="flex gap-3">
                        {/* Modal Minimal Input Group for QTY with Minus/Plus */}
                        <div className="flex items-center w-36 h-11 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-inner">
                          <button
                            type="button"
                            onClick={() =>
                              adjustQty(selectedDetailProduct.ID, -1)
                            }
                            className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                          >
                            <FaMinus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={
                              additionqty[selectedDetailProduct.ID] !==
                                undefined
                                ? additionqty[selectedDetailProduct.ID]
                                : ""
                            }
                            onChange={(e) =>
                              setAdditionqty((prev) => ({
                                ...prev,
                                [selectedDetailProduct.ID]: e.target.value,
                              }))
                            }
                            className="flex-1 w-full h-full text-center text-base font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-normal hide-arrows"
                            placeholder="Qty"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              adjustQty(selectedDetailProduct.ID, 1)
                            }
                            className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            addToAdditionStockCartHandler(
                              selectedDetailProduct,
                              additionqty[selectedDetailProduct.ID],
                            );
                            setShowDetailModal(false);
                          }}
                          className="flex-1 h-11 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                          <FaPlus size={12} /> Confirm Inbound
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                /* ซ่อนลูกศรในช่อง input type number */
                .hide-arrows::-webkit-inner-spin-button,
                .hide-arrows::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .hide-arrows {
                    -moz-appearance: textfield; /* สำหรับ Firefox */
                }
            ` }} />
    </React.Fragment>
  );
};

export default StockAddProductListScreen;
