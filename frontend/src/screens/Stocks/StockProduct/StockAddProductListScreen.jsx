import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaShoppingCart, FaFilter, FaTimes,
    FaChevronLeft, FaChevronRight,
    FaBoxOpen, FaIndustry, FaPlus, FaMinus, FaChevronDown,
    FaWarehouse, FaMapMarkerAlt
} from 'react-icons/fa';
import { useGetStockProductsQuery } from '../../../slices/stockProductApiSlice';
import { useGetStockManufacturesQuery } from '../../../slices/stockManufactureApiSlice';
import { useGetStockCategoriesQuery } from '../../../slices/stockCategoryApiSlice';
import { useGetStockSubcategoriesQuery } from '../../../slices/stockSubcategoryApiSlice';
import { useGetStockFootprintsQuery } from '../../../slices/stockFootprintApiSlice';
import { useGetStockSuppliersQuery } from '../../../slices/stockSupplierApiSlice';
import { addToAdditionStockCart } from '../../../slices/stockAdditionApiSlice';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// ============================================================================
// COMPONENT: MINIMALIST DROPDOWN
// ============================================================================
const CustomDropdown = ({ label, name, value, options, disabled, placeholder, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options?.find(o => String(o.value) === String(value));

    return (
        <div className="mb-5 relative">
            <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block tracking-wide uppercase">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-white border ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 flex items-center justify-between transition-all hover:border-slate-300 outline-none ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
                >
                    <span className={`truncate mr-2 ${!selectedOption ? 'text-slate-400 font-normal' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                        <FaChevronDown className="text-slate-400" size={10} />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isOpen && !disabled && (
                        <React.Fragment key="dropdown-fragment">
                            <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
                            <motion.ul
                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-[120] w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                            >
                                <li
                                    onClick={() => { onChange({ target: { name, value: '' } }); setIsOpen(false); }}
                                    className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors uppercase tracking-wider"
                                >
                                    All {label}
                                </li>
                                {options?.map(opt => (
                                    <li
                                        key={String(opt.key)}
                                        onClick={() => { onChange({ target: { name, value: opt.value } }); setIsOpen(false); }}
                                        className={`px-4 py-2.5 text-sm font-medium hover:bg-indigo-50/50 hover:text-indigo-700 cursor-pointer transition-colors ${String(value) === String(opt.value) ? 'text-indigo-700 bg-indigo-50/50 font-semibold' : 'text-slate-600'}`}
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
    const { additionstockcartItems = [] } = useSelector((state) => state.additionstockcart || {});

    // API
    const { data: stockData, isLoading, error } = useGetStockProductsQuery();
    const { data: categoryData = [] } = useGetStockCategoriesQuery();
    const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
    const { data: manufactureData = [] } = useGetStockManufacturesQuery();
    const { data: footprintData = [] } = useGetStockFootprintsQuery();
    const { data: supplierData = [] } = useGetStockSuppliersQuery();

    const products = useMemo(() => stockData?.products || [], [stockData]);

    // UI States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [additionqty, setAdditionqty] = useState({});
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

    // Filter State
    const [formData, setFormData] = useState({
        category: '', subcategory: '', manufacturer: '', footprint: '', supplier: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 4 columns grid on large screens

    // Scroll Lock for Modals
    useEffect(() => {
        if (showDetailModal || showMobileFilter) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showDetailModal, showMobileFilter]);

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        let filtered = products || [];

        if (formData.category) filtered = filtered.filter(p => p.category === formData.category);
        if (formData.subcategory) filtered = filtered.filter(p => p.subcategory === formData.subcategory);
        if (formData.manufacturer) filtered = filtered.filter(p => p.manufacture === formData.manufacturer);
        if (formData.footprint) filtered = filtered.filter(p => p.footprint === formData.footprint);
        if (formData.supplier) filtered = filtered.filter(p => p.supplier === formData.supplier);

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                (item.electotronixPN || '').toLowerCase().includes(query) ||
                (item.manufacturePN || '').toLowerCase().includes(query) ||
                (item.description || '').toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [formData, searchQuery, products]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Handlers
    const handleTriggerSearch = () => { setSearchQuery(searchInput); setShowMobileFilter(false); setCurrentPage(1); };
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleTriggerSearch(); };
    const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); setCurrentPage(1); };
    const handleReset = () => {
        setSearchInput(''); setSearchQuery('');
        setFormData({ category: '', subcategory: '', manufacturer: '', footprint: '', supplier: '' });
        setCurrentPage(1);
    };

    // ปรับให้สามารถลดลงเหลือ 0 (เคลียร์ค่า) ได้
    const adjustQty = (id, amount) => {
        setAdditionqty(prev => {
            const current = parseInt(prev[id] || 0, 10) || 0;
            const next = current + amount;
            if (next <= 0) {
                return { ...prev, [id]: '' };
            }
            return { ...prev, [id]: next };
        });
    };

    const addToAdditionStockCartHandler = (product, qty) => {
        const quantity = Number(qty);
        if (!quantity || quantity < 1) { toast.error('กรุณาระบุจำนวนที่ถูกต้อง (มากกว่า 0)'); return; }

        dispatch(addToAdditionStockCart({
            ...product,
            _id: String(product.ID),
            additionqty: quantity
        }));
        toast.success(`เพิ่ม ${product.electotronixPN || product.manufacturePN} ลงตะกร้าเติมสต็อกแล้ว`);
        setAdditionqty(prev => ({ ...prev, [product.ID]: '' }));
    };

    const handleViewDetail = (product) => {
        setSelectedDetailProduct(product);
        setShowDetailModal(true);
    };

    const formatPrice = (price) => {
        const num = Number(price);
        return !isNaN(num) ? `฿${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-';
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader /></div>;
    if (error) return <div className="p-10"><Message variant="danger">{error?.data?.message || error.error || 'ERROR'}</Message></div>;

    return (
        <React.Fragment>
            <div className="bg-[#f9fafb] min-h-screen font-sans pb-24 text-slate-800 antialiased selection:bg-indigo-100 relative overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 relative z-10">

                    {/* ================= HEADER ================= */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
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
                                Select components to replenish your inventory from {filteredProducts.length} items.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search Bar (Desktop) */}
                            <div className="hidden lg:flex relative w-72">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
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
                                onClick={() => navigate('/componentaddcartlist')}
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

                    <div className="flex flex-col lg:flex-row gap-10">

                        {/* ================= SIDEBAR FILTERS (DESKTOP) ================= */}
                        <aside className="w-64 shrink-0 hidden lg:block">
                            <div className="sticky top-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-semibold text-slate-900">Filter Items</h3>
                                    <button onClick={handleReset} className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider">Reset</button>
                                </div>

                                <div className="space-y-2">
                                    <CustomDropdown label="Category" name="category" value={formData.category} options={categoryData?.map(c => ({ key: c.ID, value: c.category, label: c.category }))} placeholder="Any Category" onChange={handleChange} />
                                    <CustomDropdown label="Subcategory" name="subcategory" value={formData.subcategory} options={subcategoryData?.filter(s => formData.category && s.category === formData.category).map(s => ({ key: s.ID, value: s.subcategory, label: s.subcategory }))} disabled={!formData.category} placeholder="Any Subcategory" onChange={handleChange} />
                                    <CustomDropdown label="Manufacturer" name="manufacturer" value={formData.manufacturer} options={manufactureData?.map(m => ({ key: m.ID, value: m.namemanufacture, label: m.namemanufacture }))} placeholder="Any Manufacturer" onChange={handleChange} />
                                    <CustomDropdown label="Footprint" name="footprint" value={formData.footprint} options={footprintData?.map(fp => ({ key: fp.ID, value: fp.namefootprint, label: fp.namefootprint }))} placeholder="Any Footprint" onChange={handleChange} />
                                    <CustomDropdown label="Supplier" name="supplier" value={formData.supplier} options={supplierData?.map(s => ({ key: s.ID, value: s.namesupplier, label: s.namesupplier }))} placeholder="Any Supplier" onChange={handleChange} />
                                </div>
                            </div>
                        </aside>

                        {/* ================= MAIN PRODUCT GRID ================= */}
                        <main className="flex-1 min-w-0">
                            <AnimatePresence mode='wait'>
                                {currentItems.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
                                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                            <FaSearch className="text-slate-300" size={24} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800">No components found</h3>
                                        <p className="text-slate-500 text-sm mt-1">Try resetting your filters to explore everything.</p>
                                        <button onClick={handleReset} className="mt-6 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">Reset All Filters</button>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                                        {currentItems.map((p, index) => (
                                            <motion.div
                                                key={p.ID}
                                                layout
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: (index % itemsPerPage) * 0.03, ease: "easeOut" }}
                                                className="group bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-300"
                                            >
                                                {/* Image Area */}
                                                <div
                                                    className="relative aspect-[4/3] w-full bg-[#f8fafc] rounded-xl mb-4 flex items-center justify-center p-4 cursor-pointer overflow-hidden group-hover:bg-indigo-50/30 transition-colors"
                                                    onClick={() => handleViewDetail(p)}
                                                >
                                                    {p.img ? (
                                                        <motion.img
                                                            whileHover={{ scale: 1.05 }}
                                                            transition={{ duration: 0.4 }}
                                                            src={`/componentImages${p.img}`}
                                                            className="max-w-full max-h-full object-contain mix-blend-multiply"
                                                            alt="Product"
                                                        />
                                                    ) : (
                                                        <FaBoxOpen className="text-slate-200" size={40} />
                                                    )}
                                                </div>

                                                {/* Details Area */}
                                                <div className="flex flex-col flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate pr-2">{p.category}</p>
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{p.ID}</span>
                                                    </div>

                                                    <h3
                                                        className="text-[15px] font-bold text-slate-900 leading-tight mb-1 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                                        onClick={() => handleViewDetail(p)}
                                                        title={p.electotronixPN || p.manufacturePN}
                                                    >
                                                        {p.electotronixPN || p.manufacturePN}
                                                    </h3>

                                                    <div className="flex items-center gap-1.5 mb-4">
                                                        <FaIndustry className="text-slate-300" size={10} />
                                                        <p className="text-xs text-slate-500 truncate font-medium">{p.manufacture || 'Unknown MFR'}</p>
                                                    </div>

                                                    {/* Stock & Action Area */}
                                                    <div className="mt-auto pt-4 border-t border-slate-100/80 space-y-3">
                                                        <div className="flex justify-between items-end mb-1">
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Current Stock</p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {Number(p.quantity || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-500 lowercase">pcs</span>
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Cost</p>
                                                                <p className="text-sm font-bold text-slate-800">{formatPrice(p.price)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Input Group with separated Add Button */}
                                                        <div className="flex items-center gap-2">
                                                            {/* Stepper */}
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
                                                                    value={additionqty[p.ID] !== undefined ? additionqty[p.ID] : ''}
                                                                    onChange={(e) => setAdditionqty(prev => ({ ...prev, [p.ID]: e.target.value }))}
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

                                                            {/* Add Button */}
                                                            <button
                                                                onClick={() => addToAdditionStockCartHandler(p, additionqty[p.ID])}
                                                                className="flex-1 h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                                            >
                                                                <FaPlus size={10} /> Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* ================= PAGINATION ================= */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-white transition-all">
                                        <FaChevronLeft size={10} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                            const isPageDots = totalPages > 5 && (pageNum < currentPage - 1 || pageNum > currentPage + 1) && pageNum !== 1 && pageNum !== totalPages;
                                            if (isPageDots) {
                                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-slate-400 px-1 text-sm">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`min-w-[36px] h-9 px-2 rounded-full text-sm font-semibold transition-all ${currentPage === pageNum ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-white transition-all">
                                        <FaChevronRight size={10} />
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* MODALS & DRAWERS (PORTAL) */}
            {/* ============================================================================ */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>

                    {/* Mobile Filter Drawer */}
                    {showMobileFilter && (
                        <div className="fixed inset-0 z-[9999] flex justify-end">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowMobileFilter(false)}
                                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
                                className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10"
                            >
                                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                                    <h2 className="text-base font-bold text-slate-900">Filter Items</h2>
                                    <button onClick={() => setShowMobileFilter(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><FaTimes size={14} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                    <div className="mb-6">
                                        <label className="text-[11px] font-semibold text-slate-500 mb-2 block tracking-wide uppercase">Keyword Search</label>
                                        <div className="relative">
                                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="MPN, Brand, Desc..." className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 transition-all" />
                                        </div>
                                    </div>
                                    <CustomDropdown label="Category" name="category" value={formData.category} options={categoryData?.map(c => ({ key: c.ID, value: c.category, label: c.category }))} onChange={handleChange} />
                                    <CustomDropdown label="Subcategory" name="subcategory" value={formData.subcategory} options={subcategoryData?.filter(s => formData.category && s.category === formData.category).map(s => ({ key: s.ID, value: s.subcategory, label: s.subcategory }))} disabled={!formData.category} onChange={handleChange} />
                                    <CustomDropdown label="Manufacturer" name="manufacturer" value={formData.manufacturer} options={manufactureData?.map(m => ({ key: m.ID, value: m.namemanufacture, label: m.namemanufacture }))} onChange={handleChange} />
                                    <CustomDropdown label="Footprint" name="footprint" value={formData.footprint} options={footprintData?.map(fp => ({ key: fp.ID, value: fp.namefootprint, label: fp.namefootprint }))} onChange={handleChange} />
                                    <CustomDropdown label="Supplier" name="supplier" value={formData.supplier} options={supplierData?.map(s => ({ key: s.ID, value: s.namesupplier, label: s.namesupplier }))} onChange={handleChange} />
                                </div>
                                <div className="p-5 border-t border-slate-100 flex gap-3 bg-white">
                                    <button onClick={handleReset} className="flex-1 py-2.5 text-slate-600 bg-slate-100 text-sm font-bold hover:bg-slate-200 rounded-xl transition-all">Clear</button>
                                    <button onClick={handleTriggerSearch} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all">Apply</button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Detail Modal (Minimalist) */}
                    {showDetailModal && selectedDetailProduct && (
                        <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                                <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"><FaTimes size={14} /></button>

                                {/* Image Section */}
                                <div className="w-full md:w-2/5 p-8 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                                    <div className="w-40 h-40 bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-center mb-6 shadow-sm">
                                        {selectedDetailProduct.img ? <img src={`/componentImages${selectedDetailProduct.img}`} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="product" /> : <FaBoxOpen className="text-slate-200" size={60} />}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 text-center mb-1 leading-tight px-2">{selectedDetailProduct.electotronixPN || selectedDetailProduct.manufacturePN}</h3>
                                    <p className="text-xs text-indigo-500 font-semibold">{selectedDetailProduct.manufacture}</p>
                                </div>

                                {/* Details Section */}
                                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white flex flex-col">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-6">
                                        Specifications
                                    </h4>

                                    <div className="grid grid-cols-2 gap-y-6 gap-x-6 mb-8">
                                        {[
                                            { label: 'Category', value: selectedDetailProduct.category },
                                            { label: 'Subcategory', value: selectedDetailProduct.subcategory },
                                            { label: 'Part Number', value: selectedDetailProduct.manufacturePN },
                                            { label: 'Footprint', value: selectedDetailProduct.footprint || '-' },
                                            { label: 'Location', value: selectedDetailProduct.position || '-', icon: FaMapMarkerAlt },
                                            { label: 'Supplier', value: selectedDetailProduct.supplier },
                                            { label: 'Current Stock', value: `${Number(selectedDetailProduct.quantity || 0).toLocaleString()} pcs` },
                                            { label: 'Base Price', value: formatPrice(selectedDetailProduct.price) }
                                        ].map((spec, i) => (
                                            <div key={i}>
                                                <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wide">{spec.label}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {spec.icon && <spec.icon size={10} className="text-slate-400" />}
                                                    <span className="text-sm font-semibold text-slate-800 break-words">{spec.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                                        Description
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-8 flex-1">
                                        {selectedDetailProduct.description || 'No detailed specifications provided.'}
                                    </p>

                                    {/* Action Area */}
                                    <div className="mt-auto pt-6 border-t border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Add to Inbound List</label>
                                        <div className="flex gap-3">
                                            {/* Modal Minimal Input Group for QTY with Minus/Plus */}
                                            <div className="flex items-center w-36 h-11 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => adjustQty(selectedDetailProduct.ID, -1)}
                                                    className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                                                >
                                                    <FaMinus size={12} />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={additionqty[selectedDetailProduct.ID] !== undefined ? additionqty[selectedDetailProduct.ID] : ''}
                                                    onChange={(e) => setAdditionqty(prev => ({ ...prev, [selectedDetailProduct.ID]: e.target.value }))}
                                                    className="flex-1 w-full h-full text-center text-base font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-normal hide-arrows"
                                                    placeholder="Qty"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => adjustQty(selectedDetailProduct.ID, 1)}
                                                    className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                                                >
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => { addToAdditionStockCartHandler(selectedDetailProduct, additionqty[selectedDetailProduct.ID]); setShowDetailModal(false); }}
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
                document.body
            )}

            <style>{`
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
            `}</style>
        </React.Fragment>
    );
};

export default StockAddProductListScreen;