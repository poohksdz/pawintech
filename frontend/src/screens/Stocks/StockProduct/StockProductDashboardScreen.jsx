import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaShoppingCart,
  FaFilter,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaChevronDown,
  FaPlus,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { MdNotifications } from "react-icons/md";
import {
  useGetStockProductsQuery,
  useRateProductMutation,
} from "../../../slices/stockProductApiSlice";
import { addToStockCart } from "../../../slices/stockCartApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useGetStockSubcategoriesQuery } from "../../../slices/stockSubcategoryApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import { useGetStockFootprintsQuery } from "../../../slices/stockFootprintApiSlice";
import { useGetStockSuppliersQuery } from "../../../slices/stockSupplierApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetNotificationsQuery } from "../../../slices/notificationApiSlice";

// ============================================================================
// COMPONENT: MINIMALIST DROPDOWN WITH SEARCH
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
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  const selectedOption = options?.find(
    (o) => String(o.value) === String(value),
  );

  // Filter options based on search term
  const filteredOptions = options?.filter((opt) =>
    opt.label?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm("");
      // Focus search input after opening
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="mb-2 relative">
      <label className="text-[11px] font-semibold text-slate-500 mb-1 block tracking-wide">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={isOpen ? handleClose : handleOpen}
          className={`w-full bg-white dark:bg-[#111111] border ${isOpen ? "border-slate-400 dark:border-slate-600" : "border-slate-200 dark:border-white/10"} rounded-xl px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors hover:border-slate-300 dark:hover:border-white/20 outline-none ${disabled ? "opacity-40 cursor-not-allowed bg-slate-50 dark:bg-black/20" : "cursor-pointer"}`}
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
                onClick={handleClose}
              />
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute z-[120] w-full mt-1 bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-500"
              >
                {/* Search Input */}
                <div className="p-2 border-b border-slate-100 dark:border-white/10">
                  <div className="relative">
                    <FaSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={12}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={`Search ${label}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-slate-400 dark:focus:border-slate-500 placeholder:text-slate-400 transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSearchTerm(""); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <FaTimes size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <ul className="max-h-48 overflow-y-auto custom-scrollbar py-1.5">
                  <li
                    onClick={() => {
                      onChange({ target: { name, value: "" } });
                      handleClose();
                    }}
                    className="px-4 py-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-black/50 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors"
                  >
                    All {label}
                  </li>
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                      <li
                        key={String(opt.key)}
                        onClick={() => {
                          onChange({ target: { name, value: opt.value } });
                          handleClose();
                        }}
                        className={`px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-black/50 cursor-pointer transition-colors ${String(value) === String(opt.value) ? "text-slate-900 dark:text-white bg-slate-50 dark:bg-black/50 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
                      >
                        {opt.label}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-xs text-slate-400 text-center">
                      No results found
                    </li>
                  )}
                </ul>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
const StockProductDashboardScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error, refetch } = useGetStockProductsQuery();
  const { data: categoryData = [] } = useGetStockCategoriesQuery();
  const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const { data: footprintData = [] } = useGetStockFootprintsQuery();
  const { data: supplierData = [] } = useGetStockSuppliersQuery();
  const [rateProduct] = useRateProductMutation();

  const { data: userNotifications = [] } = useGetNotificationsQuery(undefined, { skip: !userInfo });

  const products = useMemo(() => data?.products || [], [data]);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reqqty, setReqqty] = useState({});

  const [showImportantModal, setShowImportantModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [reason, setReason] = useState("");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isUnmarking, setIsUnmarking] = useState(false);

  const [localProducts, setLocalProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 99999; // Show all products without pagination

  // Infinite scroll state
  const ITEMS_PER_BATCH = 50;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const sentinelRef = useRef(null);

  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    manufacturer: "",
    footprint: "",
    supplier: "",
    sortBy: "star-desc",
  });

  //  ระบบล็อคหน้าจอ (Scroll Lock) เมื่อเปิด Modal
  useEffect(() => {
    if (showDetailModal || showImportantModal || showMobileFilter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDetailModal, showImportantModal, showMobileFilter]);

  const { language } = useSelector((state) => state.language);

  // ตรวจสอบแจ้งเตือนให้ดาวที่เกิน 3 เดือน
  useEffect(() => {
    if (userNotifications?.length > 0 && userInfo) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const starReminder = userNotifications.find((n) => {
        if (n.type !== "star_expiration_warning") return false;
        const notifDate = new Date(n.created_at);
        return notifDate > threeMonthsAgo; // แจ้งเตือนภายใน 3 เดือนล่าสุด
      });

      if (starReminder && !starReminder.isRead) {
        toast.warning(starReminder.message || "กรุณาให้คะแนนสินค้าอีกครั้ง หลังจาก 3 เดือน", {
          autoClose: 5000,
        });
      }
    }
  }, [userNotifications, userInfo]);

  // TRANSLATIONS MOVED BELOW useMemo

  useEffect(() => {
    if (products) setLocalProducts(products);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = localProducts || [];
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
      filtered = filtered.filter((item) => {
        const epn = (item.electotronixPN || "").toLowerCase();
        const mpn = (item.manufacturePN || "").toLowerCase();
        const bc = (item.barcode || "").toLowerCase();
        const val = (item.value || "").toLowerCase();

        return epn.includes(query) || mpn.includes(query) || bc.includes(query) || val.includes(query);
      });
    }

    // Sorting Logic
    if (formData.sortBy === "star-asc") {
      filtered = [...filtered].sort(
        (a, b) => (a.starRating || 0) - (b.starRating || 0),
      );
    } else if (formData.sortBy === "star-desc") {
      filtered = [...filtered].sort(
        (a, b) => (b.starRating || 0) - (a.starRating || 0),
      );
    } else if (formData.sortBy === "id-desc") {
      filtered = [...filtered].sort((a, b) => b.ID - a.ID);
    }

    return filtered;
  }, [formData, searchQuery, localProducts]);

  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(ITEMS_PER_BATCH);
  }, [formData, searchQuery]);

  // ============================================================================
  // TRANSLATIONS
  // ============================================================================
  const t = {
    en: {
      title: "Inventory Catalog",
      subtitle: `Explore and manage ${filteredProducts?.length || 0} active components`,
      searchPlaceholder: "Search by MPN...",
      viewCart: "View Cart",
      filters: "Filters",
      clearAll: "Clear All",
      categoryLabel: "Category",
      subcategoryLabel: "Subcategory",
      manufacturerLabel: "Manufacturer",
      footprintLabel: "Footprint",
      supplierLabel: "Supplier",
      anyCategory: "Any Category",
      anySubcategory: "Any Subcategory",
      anyManufacturer: "Any Manufacturer",
      anyFootprint: "Any Footprint",
      anySupplier: "Any Supplier",
      sortBy: "Sort By",
      defaultSort: "Default Sorting",
      sortStarsLow: "Stars: Low to High",
      sortStarsHigh: "Stars: High to Low",
      sortNewest: "Newest First",
      noComponents: "No components found",
      adjustFilters: "Try adjusting your search or filters.",
      clearFilters: "Clear Filters",
      quickView: "Quick View",
      stock: "Stock",
      qtyPlaceholder: "Qty",
      addToCart: "Add to Cart",
      techSpecs: "Technical Specs",
      overview: "Overview",
      activityHistory: "Activity History",
      lastStarred: "Last starred",
      lastUnstarred: "Last unstarred",
      priorityFlag: "Priority Flag",
      removePriority: "Remove Priority Flag",
      markPriority: "Mark as Priority",
      confirm: "Confirm",
      cancel: "Cancel",
      reasonPlaceholder: "Brief reason for marking (optional)...",
      reasonsub: "Would you like to change the status for this component?",
      unit: "pcs",
      unitPrice: "Unit Price",
      warehousePos: "Warehouse Pos.",
      preferredSupplier: "Preferred Supplier",
      currentInventory: "Current Inventory",
      noDescription:
        "Detailed component specifications not available at this time.",
      searchMpn: "Search MPN",
      apply: "Apply",
      clear: "Clear",
      devUtils: "Dev Utilities",
      sendTestNoti: "Send Test Notification",
      sending: "Sending...",
    },
    thai: {
      title: "รายการพัสดุ/สินค้าคงคลัง",
      subtitle: `สำรวจและจัดการชิ้นส่วนอุปกรณ์ ${filteredProducts?.length || 0} รายการ`,
      searchPlaceholder: "ค้นหาด้วยรหัสสินค้า (MPN)...",
      viewCart: "ตะกร้าเบิก",
      filters: "ตัวกรอง",
      clearAll: "ล้างทั้งหมด",
      categoryLabel: "หมวดหมู่",
      subcategoryLabel: "หมวดหมู่ย่อย",
      manufacturerLabel: "ผู้ผลิต",
      footprintLabel: "Footprint",
      supplierLabel: "ผู้จัดจำหน่าย",
      anyCategory: "ทุกหมวดหมู่",
      anySubcategory: "ทุกหมวดหมู่ย่อย",
      anyManufacturer: "ทุกผู้ผลิต",
      anyFootprint: "ทุก Footprint",
      anySupplier: "ทุก Supplier",
      sortBy: "เรียงตาม",
      defaultSort: "ค่าเริ่มต้น",
      sortStarsLow: "คะแนนดาว: น้อยไปมาก",
      sortStarsHigh: "คะแนนดาว: มากไปน้อย",
      sortNewest: "ใหม่ล่าสุด",
      noComponents: "ไม่พบรายการสินค้า",
      adjustFilters: "ลองปรับการค้นหาหรือตัวกรองของคุณ",
      clearFilters: "ล้างตัวกรอง",
      quickView: "ดูรายละเอียด",
      stock: "คงเหลือ",
      qtyPlaceholder: "จำนวน",
      addToCart: "เพิ่มลงตะกร้า",
      techSpecs: "ข้อมูลทางเทคนิค",
      overview: "รายละเอียดโดยรวม",
      activityHistory: "ประวัติกิจกรรม",
      lastStarred: "ติดดาวล่าสุดเมื่อ",
      lastUnstarred: "ยกเลิกติดดาวล่าสุดเมื่อ",
      priorityFlag: "สถานะความสำคัญ",
      removePriority: "ยกเลิกเครื่องหมายสำคัญ",
      markPriority: "ทำเครื่องหมายสำคัญ",
      confirm: "ยืนยัน",
      cancel: "ยกเลิก",
      reasonPlaceholder: "ระบุเหตุผลสั้นๆ (ถ้ามี)...",
      reasonsub: "คุณต้องการเปลี่ยนสถานะความสำคัญของชิ้นส่วนนี้หรือไม่?",
      unit: "ชิ้น",
      unitPrice: "ราคาต่อหน่วย",
      warehousePos: "ตำแหน่งในคลัง",
      preferredSupplier: "ผู้จัดจำหน่ายหลัก",
      currentInventory: "จำนวนคงเหลือในคลัง",
      noDescription: "ยังไม่มีรายละเอียดข้อมูลทางเทคนิคของชิ้นส่วนนี้",
      searchMpn: "ค้นหา MPN",
      apply: "ตกลง",
      clear: "ล้าง",
      devUtils: "เครื่องมือพัฒนา",
      sendTestNoti: "ส่งการแจ้งเตือนทดสอบ",
      sending: "กำลังส่ง...",
    },
  }[language || "en"];

  // Auto-open Quick Look if barcode matches exactly (Scan support)
  useEffect(() => {
    if (filteredProducts.length === 1 && searchQuery.trim() !== "") {
      const p = filteredProducts[0];
      if (p.barcode === searchQuery.trim()) {
        setSelectedDetailProduct(p);
        setShowDetailModal(true);
      }
    }
  }, [filteredProducts, searchQuery]);

  const currentItems = (filteredProducts || []).slice(0, visibleCount);
  const hasMore = currentItems.length < (filteredProducts?.length || 0);

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

  const handleTriggerSearch = () => {
    setSearchQuery(searchInput);
    setShowMobileFilter(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleTriggerSearch();
  };
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleReset = () => {
    setSearchInput("");
    setSearchQuery("");
    setFormData({
      category: "",
      subcategory: "",
      manufacturer: "",
      footprint: "",
      supplier: "",
      sortBy: "",
    });
  };

  const addToStockCartHandler = (product, qty) => {
    if (!qty || Number(qty) < 1) {
      toast.error("กรุณาระบุจำนวนให้ถูกต้อง");
      return;
    }
    if (Number(qty) > product.quantity) {
      toast.error("จำนวนที่เบิกเกินกว่าสต็อกที่มีอยู่");
      return;
    }

    dispatch(
      addToStockCart({
        ...product,
        _id: String(product.ID),
        reqqty: parseInt(qty),
        important: !!product.important,
        note: "",
      }),
    );
    toast.success(`เพิ่มลงตะกร้า ${qty} รายการสำเร็จ`);
    setReqqty((prev) => ({ ...prev, [product.ID]: "" }));
  };

  const handleImportantClick = (e, product) => {
    e.stopPropagation();
    setCurrentProduct(product);
    setIsUnmarking(!!product.important);
    setShowImportantModal(true);
  };

  const handleUpdateImportant = (productWithReason) => {
    setLocalProducts((prev) =>
      prev.map((p) =>
        p.ID === productWithReason.ID
          ? { ...p, important: !p.important, reason: productWithReason.reason }
          : p,
      ),
    );
    toast.success(
      productWithReason.important
        ? "ยกเลิกการทำเครื่องหมายสำคัญแล้ว"
        : "ทำเครื่องหมายสำคัญสำเร็จ",
    );
  };

  const handleStarToggle = async (e, product) => {
    e.stopPropagation();
    if (!userInfo || (userInfo.role !== "admin" && userInfo.role !== "stock" && userInfo.role !== "staff")) {
      toast.error("คุณไม่มีสิทธิ์ดำเนินการส่วนนี้");
      return;
    }

    try {
      // ให้ดาว 5 ดวงเสมอ (คะแนนจะสะสมเฉลี่ย)
      await rateProduct({ productId: product.ID, rating: 5 }).unwrap();
      toast.success("ติดดาวสำเร็จ (คะแนนจะถูกคำนวณเฉลี่ย)");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleStarClick = async (e, product, clickedStar) => {
    e.stopPropagation();
    if (!userInfo || (userInfo.role !== "admin" && userInfo.role !== "stock" && userInfo.role !== "staff")) {
      toast.error("คุณไม่มีสิทธิ์ให้คะแนน");
      return;
    }

    try {
      // ถ้ายกเลิกดาวที่เลือกแล้ว ให้เป็น 0 (คลิกดาวเดิมซ้ำ)
      const newRating = product.starRating === clickedStar ? 0 : clickedStar;
      if (newRating === 0) {
        toast.warning("ไม่สามารถยกเลิกคะแนนได้ คะแนนจะถูกบันทึกถาวร");
        return;
      }
      await rateProduct({ productId: product.ID, rating: newRating }).unwrap();
      toast.success(
        newRating > 0 ? `ให้คะแนน ${newRating} ดาวสำเร็จ` : "ยกเลิกการให้คะแนนสำเร็จ",
      );
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error || "เกิดข้อผิดพลาด");
    }
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
      <div className="p-4 md:p-6 sm:p-10">
        <Message variant="danger">
          {error?.data?.message ||
            error.error ||
            "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
        </Message>
      </div>
    );

  return (
    <React.Fragment>
      {/* ============================================================================ */}
      {/* MAIN CONTENT (แยกออกจาก Modal ชัดเจน) */}
      {/* ============================================================================ */}
      <div className="bg-[#fdfdfd] dark:bg-black min-h-screen font-sans pb-24 text-slate-800 dark:text-white antialiased selection:bg-slate-200 dark:selection:bg-slate-700 relative transition-colors duration-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 relative z-10">
          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-10 pb-6 border-b border-slate-100">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1 transition-colors duration-500">
                {t.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium">{t.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex relative w-72">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-full text-sm dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <button
                onClick={() => setShowMobileFilter(true)}
                className="lg:hidden flex items-center justify-center w-11 h-11 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FaFilter size={14} />
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/componentcartlist")}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 h-11 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
              >
                <FaShoppingCart size={14} />
                <span className="hidden sm:inline">{t.viewCart}</span>
              </motion.button>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-10">
            {/* SIDEBAR FILTERS (DESKTOP) */}
            <aside className="w-64 shrink-0 hidden lg:block sticky top-8 self-start max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t.filters}
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {t.clearAll}
                  </button>
                </div>

                <div className="space-y-1">
                  <CustomDropdown
                    label={t.categoryLabel}
                    name="category"
                    value={formData.category}
                    options={categoryData?.map((c) => ({
                      key: c.ID,
                      value: c.category,
                      label: c.category,
                    }))}
                    placeholder={t.anyCategory}
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label={t.subcategoryLabel}
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
                    placeholder={t.anySubcategory}
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label={t.manufacturerLabel}
                    name="manufacturer"
                    value={formData.manufacturer}
                    options={manufactureData?.map((m) => ({
                      key: m.ID,
                      value: m.namemanufacture,
                      label: m.namemanufacture,
                    }))}
                    placeholder={t.anyManufacturer}
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label={t.footprintLabel}
                    name="footprint"
                    value={formData.footprint}
                    options={footprintData?.map((fp) => ({
                      key: fp.ID,
                      value: fp.namefootprint,
                      label: fp.namefootprint,
                    }))}
                    placeholder={t.anyFootprint}
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label={t.supplierLabel}
                    name="supplier"
                    value={formData.supplier}
                    options={supplierData?.map((s) => ({
                      key: s.ID,
                      value: s.namesupplier,
                      label: s.namesupplier,
                    }))}
                    placeholder={t.anySupplier}
                    onChange={handleChange}
                  />
                  <CustomDropdown
                    label={t.sortBy}
                    name="sortBy"
                    value={formData.sortBy}
                    options={[
                      {
                        key: "star-asc",
                        value: "star-asc",
                        label: t.sortStarsLow,
                      },
                      {
                        key: "star-desc",
                        value: "star-desc",
                        label: t.sortStarsHigh,
                      },
                      { key: "id-desc", value: "id-desc", label: t.sortNewest },
                    ]}
                    placeholder={t.defaultSort}
                    onChange={handleChange}
                  />
                </div>


              </div>
            </aside>

            {/* MAIN PRODUCT GRID */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {currentItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50"
                  >
                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <FaSearch className="text-slate-300" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {t.noComponents}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {t.adjustFilters}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-6 text-sm font-medium text-slate-900 border-b border-slate-900 pb-0.5 hover:text-slate-600 hover:border-slate-600 transition-colors"
                    >
                      {t.clearFilters}
                    </button>
                  </motion.div>
                ) : (
                  <div>
                    {/* DESKTOP VIEW (Modern Edge-to-Edge Table in Card) */}
                    <div className="hidden lg:block bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] rounded-[2rem] overflow-hidden transition-colors duration-500">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-black/50 transition-colors duration-500">
                            <th className="py-5 pl-8 pr-4 w-28 text-center">
                              Preview
                            </th>
                            <th className="py-5 px-4 w-16 text-center">
                              Star
                            </th>
                            <th className="py-5 px-4">Component Details</th>
                            <th className="py-5 px-4 w-48">Brand / MFR</th>
                            <th className="py-5 px-4 w-32 text-right">
                              {t.stock}
                            </th>
                            <th className="py-5 px-4 w-48 text-center">
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
                                    className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto overflow-hidden p-2 group-hover:shadow-sm transition-all cursor-pointer"
                                    style={{ backgroundColor: '#ffffff' }}
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
                                  <button
                                    onClick={(e) => handleImportantClick(e, p)}
                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white border ${p.important ? "text-red-500 border-red-100" : "text-slate-300 border-slate-100 hover:text-slate-500"}`}
                                    title={p.important ? t.removePriority : t.markPriority}
                                  >
                                    {p.important ? (
                                      <FaExclamationCircle size={10} />
                                    ) : (
                                      <FaCheckCircle size={10} />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      if (userInfo && (userInfo.role === "admin" || userInfo.role === "stock" || userInfo.role === "staff")) {
                                        handleStarToggle(e, p);
                                      }
                                    }}
                                    className={`transition-transform hover:scale-110 ${userInfo && (userInfo.role === "admin" || userInfo.role === "stock" || userInfo.role === "staff") ? "cursor-pointer" : "cursor-default"}`}
                                  >
                                    {p.isStarred ? (
                                      <FaStar className="text-amber-400" size={18} />
                                    ) : (
                                      <FaRegStar className="text-slate-300 hover:text-amber-400" size={18} />
                                    )}
                                  </button>
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
                                  {Number(p.quantity || 0).toLocaleString()} {t.unit}
                                </span>
                              </td>
                              <td className="py-4 px-4 w-48 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={p.quantity}
                                    value={reqqty[p.ID] || ""}
                                    onChange={(e) =>
                                      setReqqty((prev) => ({
                                        ...prev,
                                        [p.ID]: e.target.value,
                                      }))
                                    }
                                    placeholder={t.qtyPlaceholder}
                                    className="w-16 h-9 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                                  />
                                  <button
                                    onClick={() =>
                                      addToStockCartHandler(p, reqqty[p.ID])
                                    }
                                    className="h-9 px-3 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-sm text-xs font-bold"
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
                          className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col relative transition-colors duration-500"
                        >
                          {/* Top-Right Priority Toggle */}
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              onClick={(e) => handleImportantClick(e, p)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white border ${p.important ? "text-red-500 border-red-100" : "text-slate-300 border-slate-100"}`}
                            >
                              {p.important ? <FaExclamationCircle size={12} /> : <FaCheckCircle size={12} />}
                            </button>
                          </div>

                          <div className="flex gap-4 mb-4">
                            <div
                              className="w-20 h-20 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 p-2 cursor-pointer transition-colors duration-500"
                              style={{ backgroundColor: '#ffffff' }}
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

                          {/* Star Rating Mobile */}
                          <div className="flex items-center gap-1.5 mb-4 px-1">
                            <button
                              onClick={(e) => {
                                if (userInfo && (userInfo.role === "admin" || userInfo.role === "stock" || userInfo.role === "staff")) {
                                  handleStarToggle(e, p);
                                }
                              }}
                            >
                              {p.isStarred ? (
                                <FaStar className="text-amber-400" size={16} />
                              ) : (
                                <FaRegStar className="text-slate-300" size={16} />
                              )}
                            </button>
                            <div className="flex items-center gap-0.5 ml-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (userInfo && (userInfo.role === "admin" || userInfo.role === "stock" || userInfo.role === "staff")) {
                                      handleStarClick(e, p, star);
                                    }
                                  }}
                                >
                                  <span className={p.starRating >= star ? "text-amber-400" : "text-slate-200"}>
                                    {p.starRating >= star ? <FaStar size={10} /> : <FaRegStar size={10} />}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {p.starRating > 0 && <span className="text-[10px] text-slate-400 ml-1">({p.ratingCount})</span>}
                          </div>

                          <div className="flex justify-between items-end mb-4 px-1">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {t.stock}
                              </p>
                              <span
                                className={`text-sm font-black ${p.quantity > 0 ? "text-emerald-600" : "text-rose-600"} whitespace-nowrap`}
                              >
                                {Number(p.quantity || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{t.unit}</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Value
                              </p>
                              <span className="text-[11px] font-black text-indigo-600 truncate">
                                {p.value || "-"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-auto border-t border-slate-100 pt-4 items-center">
                            <input
                              type="number"
                              min="1"
                              max={p.quantity}
                              value={reqqty[p.ID] || ""}
                              onChange={(e) =>
                                setReqqty((prev) => ({
                                  ...prev,
                                  [p.ID]: e.target.value,
                                }))
                              }
                              placeholder={t.qtyPlaceholder}
                              className="w-16 flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-semibold text-slate-800 outline-none focus:border-slate-400"
                            />
                            <button
                              onClick={() => addToStockCartHandler(p, reqqty[p.ID])}
                              className="flex-[2] h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
                            >
                              <FaPlus className="mr-2" size={12} /> Add to Cart
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
      {/* MODALS & DRAWERS */}
      {/* ============================================================================ */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {/* Mobile Filter Drawer */}
            {showMobileFilter && (
              <div
                key="mobile-filter"
                className="fixed inset-0 z-[9999] flex justify-end"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileFilter(false)}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10"
                >
                  <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                      {t.filters}
                    </h2>
                    <button
                      onClick={() => setShowMobileFilter(false)}
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="mb-6">
                      <label className="text-[11px] font-semibold text-slate-500 mb-2 block tracking-wide">
                        {t.searchMpn}
                      </label>
                      <div className="relative">
                        <FaSearch
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={12}
                        />
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <CustomDropdown
                      label={t.categoryLabel}
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
                      label={t.subcategoryLabel}
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
                      label={t.manufacturerLabel}
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
                      label={t.footprintLabel}
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
                      label={t.supplierLabel}
                      name="supplier"
                      value={formData.supplier}
                      options={supplierData?.map((s) => ({
                        key: s.ID,
                        value: s.namesupplier,
                        label: s.namesupplier,
                      }))}
                      onChange={handleChange}
                    />
                    <CustomDropdown
                      label={t.sortBy}
                      name="sortBy"
                      value={formData.sortBy}
                      options={[
                        {
                          key: "star-asc",
                          value: "star-asc",
                          label: t.sortStarsLow,
                        },
                        {
                          key: "star-desc",
                          value: "star-desc",
                          label: t.sortStarsHigh,
                        },
                        {
                          key: "id-desc",
                          value: "id-desc",
                          label: t.sortNewest,
                        },
                      ]}
                      placeholder={t.defaultSort}
                      onChange={handleChange}
                    />


                  </div>
                  <div className="p-5 border-t border-slate-100 flex gap-3 bg-white">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                    >
                      {t.clear}
                    </button>
                    <button
                      onClick={handleTriggerSearch}
                      className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                    >
                      {t.apply}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedDetailProduct && (
              <div
                key="detail-modal"
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative bg-white dark:bg-[#0a0a0a] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row z-10 transition-colors duration-500"
                >
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <FaTimes size={14} />
                  </button>

                  {/* Image Side */}
                  <div className="w-full md:w-2/5 p-4 sm:p-10 bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 shrink-0 transition-colors duration-500">
                    <div
                      className="w-28 h-28 sm:w-56 sm:h-56 border border-slate-200 rounded-2xl p-4 flex items-center justify-center mb-4 sm:mb-6 shadow-sm shadow-slate-200/50 transition-colors duration-500"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      {selectedDetailProduct.img ? (
                        <img
                          src={selectedDetailProduct.img}
                          className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform hover:scale-110"
                          alt="product"
                        />
                      ) : (
                        <FaBoxOpen className="text-slate-200" size={48} />
                      )}
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white text-center mb-1 leading-tight px-4 transition-colors duration-500">
                      {selectedDetailProduct.electotronixPN && selectedDetailProduct.electotronixPN !== "-" ? selectedDetailProduct.electotronixPN : (selectedDetailProduct.barcode || "-")}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-[0.2em] text-center font-bold">
                      {selectedDetailProduct.manufacture}
                    </p>
                  </div>

                  {/* Data Side */}
                  <div className="flex-1 p-5 sm:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
                    <h4 className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-3 mb-5 flex items-center gap-2 transition-colors duration-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>{" "}
                      {t.techSpecs}
                    </h4>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-6 mb-8 sm:mb-10">
                      {[
                        {
                          label: t.categoryLabel,
                          value: selectedDetailProduct.category,
                        },
                        {
                          label: t.subcategoryLabel,
                          value: selectedDetailProduct.subcategory,
                        },
                        {
                          label: "MPN / PN",
                          value: selectedDetailProduct.manufacturePN,
                        },
                        {
                          label: t.footprintLabel,
                          value: selectedDetailProduct.footprint || "-",
                        },
                        {
                          label: t.warehousePos,
                          value: selectedDetailProduct.position || "-",
                        },
                        {
                          label: t.preferredSupplier,
                          value: selectedDetailProduct.supplier,
                        },
                        {
                          label: t.currentInventory,
                          value: `${Number(selectedDetailProduct.quantity || 0).toLocaleString()} ${t.unit}`,
                          highlight: true,
                        },
                        {
                          label: t.unitPrice,
                          value: formatPrice(selectedDetailProduct.price),
                        },
                      ].map((spec, i) => (
                        <div key={i} className="group">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 group-hover:text-slate-600 transition-colors">
                            {spec.label}
                          </span>
                          <span
                            className={`text-sm font-semibold break-words ${spec.highlight ? "text-slate-900" : "text-slate-700"}`}
                          >
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/10 pb-3 mb-4 flex items-center gap-2 transition-colors duration-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{" "}
                      {t.overview}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed font-medium bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 italic transition-colors duration-500">
                      {selectedDetailProduct.description || t.noDescription}
                    </p>

                    {(selectedDetailProduct.isStarred ||
                      selectedDetailProduct.lastStarredAt ||
                      selectedDetailProduct.lastUnstarredAt) && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {t.activityHistory}
                          </h4>
                          <div className="space-y-2">
                            {selectedDetailProduct.lastStarredAt && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <FaStar size={10} className="text-amber-400" />
                                <span>
                                  {t.lastStarred}:{" "}
                                  {new Date(
                                    selectedDetailProduct.lastStarredAt,
                                  ).toLocaleString()}
                                  {selectedDetailProduct.lastStarredBy && (
                                    <span className="font-bold text-slate-700 ml-1">
                                      โดย {selectedDetailProduct.lastStarredBy}
                                    </span>
                                  )}
                                  {selectedDetailProduct.lastRatingChange && (
                                    <span className={`ml-1 font-bold ${selectedDetailProduct.lastRatingChange === "increased" || selectedDetailProduct.lastRatingChange === "first_time"
                                      ? "text-green-600"
                                      : selectedDetailProduct.lastRatingChange === "decreased"
                                        ? "text-red-500"
                                        : "text-slate-400"
                                      }`}>
                                      ({selectedDetailProduct.lastRatingChange === "increased" ? "↑ เพิ่มขึ้น" :
                                        selectedDetailProduct.lastRatingChange === "decreased" ? "↓ ลดลง" :
                                          selectedDetailProduct.lastRatingChange === "first_time" ? "ครั้งแรก" : ""})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {selectedDetailProduct.lastUnstarredAt && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <FaRegStar size={10} className="text-slate-400" />
                                <span>
                                  {t.lastUnstarred}:{" "}
                                  {new Date(
                                    selectedDetailProduct.lastUnstarredAt,
                                  ).toLocaleString()}
                                  {selectedDetailProduct.lastUnstarredBy && (
                                    <span className="font-bold text-slate-700 ml-1">
                                      โดย {selectedDetailProduct.lastUnstarredBy}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Important Tag Modal */}
            {showImportantModal && currentProduct && (
              <div
                key="important-modal"
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowImportantModal(false)}
                  className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative bg-white dark:bg-[#111111] rounded-2xl w-full max-w-[320px] p-5 sm:p-6 shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/10 text-center z-10 transition-colors duration-500"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 bg-slate-50 border ${isUnmarking ? "text-red-500 border-red-100" : "text-slate-800 border-slate-200"}`}
                  >
                    {isUnmarking ? (
                      <FaExclamationCircle size={18} />
                    ) : (
                      <FaCheckCircle size={18} />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                    {isUnmarking ? t.removePriority : t.markPriority}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-5">
                    {t.reasonsub}
                  </p>

                  {!isUnmarking && (
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:border-slate-400 mb-5 placeholder:text-slate-400 resize-none font-medium"
                      placeholder={t.reasonPlaceholder}
                    />
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImportantModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateImportant({
                          ...currentProduct,
                          reason: isUnmarking ? null : reason,
                        });
                        setShowImportantModal(false);
                        setReason("");
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${isUnmarking ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}`}
                    >
                      {t.confirm}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Custom minimalist style & Toastify Overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

                /* Optimized Toast for Mobile */
                @media (max-width: 640px) {
                    .Toastify__toast-container {
                        width: calc(100% - 32px) !important;
                        left: 16px !important;
                        top: 16px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .Toastify__toast {
                        min-height: 48px !important;
                        border-radius: 12px !important;
                        margin-bottom: 12px !important;
                        padding: 12px 16px !important;
                        font-family: inherit !important;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
                    }
                    .Toastify__toast-body {
                        font-size: 13px !important;
                        font-weight: 500 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .Toastify__toast-icon {
                        width: 18px !important;
                        margin-right: 12px !important;
                        flex-shrink: 0 !important;
                    }
                    .Toastify__close-button {
                        padding: 0 !important;
                        margin-left: 8px !important;
                        opacity: 0.6 !important;
                    }
                }
            ` }} />
    </React.Fragment>
  );
};

export default StockProductDashboardScreen;
