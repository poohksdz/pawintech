import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaTrashAlt, FaRegCopy, FaCalendarAlt, FaHistory,
    FaBoxOpen, FaPlus, FaStickyNote, FaMicrochip, FaSpinner,
    FaHashtag, FaCheckCircle, FaInbox, FaChevronDown
} from 'react-icons/fa';
import { useGetStockRequestUserQuery, useUpdateStockRequestCancelMutation } from '../../../slices/stockRequestApiSlice';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';

const StockUserRequestDashboardScreen = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);

    const { data: requestData, isLoading, error } = useGetStockRequestUserQuery(userInfo._id);
    const [updateStockRequestCancel, { isLoading: isCancelling }] = useUpdateStockRequestCancelMutation();

    const products = useMemo(() => requestData || [], [requestData]);

    const { language } = useSelector((state) => state.language);

    const t = {
        en: {
            title: 'My Requests',
            subtitle: 'Track the history and status of your requested components.',
            searchPlaceholder: 'Search Ref No or details...',
            newRequest: 'New Request',
            totalRequests: 'Total Requests',
            thisWeek: 'This Week',
            systemStatus: 'System Status',
            upToDate: 'Up to Date',
            filterBy: 'Filter By:',
            all: 'All',
            items: 'items',
            recent: 'recent',
            noRecords: 'No records found',
            noRecordsDesc: "We couldn't find any component requests matching your search criteria.",
            clearSearch: 'Clear Search',
            headers: {
                idDate: 'Request ID / Date',
                preview: 'Preview',
                details: 'Component Details',
                qty: 'Quantity',
                remarks: 'Remarks',
                action: 'Action'
            },
            modal: {
                cancelTitle: 'Cancel Request?',
                cancelRef: 'Ref:',
                cancelReason: 'Reason for cancellation',
                reasonPlaceholder: 'Please provide a valid reason...',
                keepIt: 'Keep It',
                confirmCancel: 'Confirm Cancel',
                provideReason: 'Please provide a reason for cancellation'
            },
            toast: {
                copied: 'Copied',
                cancelled: 'Request cancelled successfully'
            }
        },
        thai: {
            title: 'รายการเบิกของฉัน',
            subtitle: 'ติดตามประวัติและสถานะของส่วนประกอบที่คุุณเบิก',
            searchPlaceholder: 'ค้นหาเลขที่อ้างอิงหรือรายละเอียด...',
            newRequest: 'เบิกพัสดุใหม่',
            totalRequests: 'รายการทั้งหมด',
            thisWeek: 'สัปดาห์นี้',
            systemStatus: 'สถานะระบบ',
            upToDate: 'เป็นปัจจุบัน',
            filterBy: 'กรองโดย:',
            all: 'ทั้งหมด',
            items: 'รายการ',
            recent: 'ล่าสุด',
            noRecords: 'ไม่พบข้อมูล',
            noRecordsDesc: 'ไม่พบรายการเบิกพัสดุที่ตรงกับเงื่อนไขการค้นหาของคุณ',
            clearSearch: 'ล้างการค้นหา',
            headers: {
                idDate: 'เลขที่เบิก / วันที่',
                preview: 'รูปภาพ',
                details: 'รายละเอียดพัสดุ',
                qty: 'จำนวน',
                remarks: 'หมายเหตุ',
                action: 'จัดการ'
            },
            modal: {
                cancelTitle: 'ยกเลิกรายการเบิก?',
                cancelRef: 'อ้างอิง:',
                cancelReason: 'เหตุผลในการยกเลิก',
                reasonPlaceholder: 'โปรดระบุเหตุผลที่สมควร...',
                keepIt: 'เก็บไว้',
                confirmCancel: 'ยืนยันการยกเลิก',
                provideReason: 'โปรดระบุเหตุผลในการยกเลิก'
            },
            toast: {
                copied: 'คัดลอกแล้ว',
                cancelled: 'ยกเลิกรายการเบิกสำเร็จ'
            }
        }
    }[language || 'en'];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filteredProducts, setFilteredProducts] = useState(products);

    const categories = useMemo(() => {
        const unique = new Set(products.map(p => p.category || 'Other'));
        return ['All', ...Array.from(unique).sort()];
    }, [products]);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cancelMessage, setCancelMessage] = useState('');

    // Scroll Lock
    useEffect(() => {
        if (showCancelModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showCancelModal]);

    useEffect(() => {
        let filtered = [...products];

        // Search Filter
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                (item.requestno || '').toLowerCase().includes(lowerQuery) ||
                (item.electotronixPN || '').toLowerCase().includes(lowerQuery) ||
                (item.description || '').toLowerCase().includes(lowerQuery)
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p => (p.category || 'Other') === selectedCategory);
        }

        filtered.sort((a, b) => moment(b.requestdate).valueOf() - moment(a.requestdate).valueOf());
        setFilteredProducts(filtered);
    }, [searchQuery, products, selectedCategory]);

    const handleCopy = (e, text) => {
        e.stopPropagation();
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success(`${t.toast.copied} ${text}`, { icon: '📋', position: 'bottom-center' });
        }
    };

    const handleCancel = async () => {
        if (!cancelMessage.trim()) return toast.error(t.modal.provideReason);
        try {
            await updateStockRequestCancel({
                id: selectedProduct.ID,
                cancel_message: cancelMessage,
                updateCancelBy: userInfo.name,
                canceledUserId: userInfo._id
            }).unwrap();
            toast.success(t.toast.cancelled);
            setShowCancelModal(false);
            setCancelMessage('');
            setSelectedProduct(null);
        } catch (err) {
            toast.error(err?.data?.message || err.error || 'Failed to cancel request');
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]"><Loader /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]"><Message variant="danger">{error?.data?.message || error.error}</Message></div>;

    const totalRequests = products.length;
    const thisWeekCount = products.filter(r => moment().diff(moment(r.requestdate), 'days') <= 7).length;

    const CancelButton = ({ p, isMobile = false }) => (
        <button
            onClick={() => { setSelectedProduct(p); setCancelMessage(''); setShowCancelModal(true); }}
            className={isMobile
                ? "w-full py-2.5 mt-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                : "w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm flex items-center justify-center transition-all mx-auto"}
            title={t.modal.cancelTitle}
        >
            <FaTrashAlt size={isMobile ? 12 : 12} />
            {isMobile && t.modal.confirmCancel}
        </button>
    );

    return (
        <React.Fragment>
            <div className="bg-[#F8FAFC] min-h-screen font-sans pb-24 text-slate-800 antialiased selection:bg-indigo-100 relative overflow-hidden">

                {/* Subtle Background Elements */}
                <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-indigo-50/40 to-transparent pointer-events-none -z-10" />

                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 relative z-10">

                    {/* ================= HEADER ================= */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                                    <FaInbox size={20} />
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                    {t.title}
                                </h1>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-2">
                                {t.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder={t.searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-400 shadow-sm"
                                />
                            </div>

                            {/* Create Request Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/componentcartlist')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 h-11 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md"
                            >
                                <FaPlus size={12} />
                                <span>{t.newRequest}</span>
                            </motion.button>
                        </div>
                    </header>

                    {/* ================= CATEGORY FILTER ================= */}
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Filter By:</span>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <FaChevronDown size={10} />
                            </div>
                        </div>
                    </div>

                    {/* ================= QUICK STATS ================= */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10">
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-500 flex items-center justify-center shrink-0">
                                <FaHistory size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.totalRequests}</p>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{totalRequests} <span className="text-xs font-semibold text-slate-500">{t.items}</span></h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-500 flex items-center justify-center shrink-0">
                                <FaCalendarAlt size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.thisWeek}</p>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{thisWeekCount} <span className="text-xs font-semibold text-slate-500">{t.recent}</span></h3>
                            </div>
                        </div>

                        <div className="hidden lg:flex bg-slate-900 rounded-2xl p-6 shadow-md items-center justify-between relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                                <FaBoxOpen size={100} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.systemStatus}</p>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FaCheckCircle className="text-emerald-400" size={16} /> {t.upToDate}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* ================= MAIN LIST ================= */}
                    <main>
                        <AnimatePresence mode='wait'>
                            {filteredProducts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-dashed border-slate-300 shadow-sm"
                                >
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <FaSearch className="text-slate-300" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">{t.noRecords}</h3>
                                    <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                                        {t.noRecordsDesc}
                                    </p>
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="mt-8 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                                            {t.clearSearch}
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <div>
                                    {/* --- DESKTOP TABLE VIEW --- */}
                                    <div className="hidden lg:block bg-white border border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                                    <th className="py-4 pl-6 pr-4 w-48">{t.headers.idDate}</th>
                                                    <th className="py-4 px-4 w-20 text-center">{t.headers.preview}</th>
                                                    <th className="py-4 px-4">{t.headers.details}</th>
                                                    <th className="py-4 px-4 w-28 text-center">{t.headers.qty}</th>
                                                    <th className="py-4 px-4 w-64">{t.headers.remarks}</th>
                                                    <th className="py-4 pr-6 pl-4 w-24 text-center">{t.headers.action}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100/60">
                                                {filteredProducts.map((p, index) => (
                                                    <motion.tr
                                                        key={p.ID}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, delay: index * 0.02, ease: "easeOut" }}
                                                        className="hover:bg-slate-50/50 transition-colors group"
                                                    >
                                                        {/* Ref & Date */}
                                                        <td className="py-4 pl-6 pr-4 align-middle">
                                                            <div className="flex flex-col gap-1.5">
                                                                <div
                                                                    className="inline-flex items-center gap-1.5 font-bold text-xs text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm w-max group/ref"
                                                                    onClick={(e) => handleCopy(e, p.requestno)}
                                                                    title="Copy Ref Number"
                                                                >
                                                                    <FaHashtag className="text-slate-400 group-hover/ref:text-indigo-400" size={10} />
                                                                    {p.requestno}
                                                                    <FaRegCopy className="opacity-0 group-hover/ref:opacity-100 transition-opacity ml-1" size={10} />
                                                                </div>
                                                                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 pl-1">
                                                                    <FaCalendarAlt className="text-slate-300" size={10} />
                                                                    {moment(p.requestdate).format('DD MMM YY')}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Image */}
                                                        <td className="py-4 px-4 align-middle">
                                                            <div className="w-12 h-12 rounded-xl bg-[#f8fafc] border border-slate-100 flex items-center justify-center mx-auto overflow-hidden p-1.5 shadow-sm">
                                                                {p.img ? <img src={`/componentImages${p.img}`} alt={p.electotronixPN} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" /> : <FaMicrochip className="text-slate-200" size={20} />}
                                                            </div>
                                                        </td>

                                                        {/* Details */}
                                                        <td className="py-4 px-4 align-middle max-w-[300px]">
                                                            <div className="font-bold text-slate-900 text-sm mb-1 truncate" title={p.electotronixPN}>
                                                                {p.electotronixPN}
                                                            </div>
                                                            <div className="text-xs font-medium text-slate-500 truncate" title={p.description}>
                                                                {p.description || "No description provided."}
                                                            </div>
                                                        </td>

                                                        {/* QTY */}
                                                        <td className="py-4 px-4 text-center align-middle">
                                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs shadow-sm">
                                                                {p.requestqty}
                                                            </span>
                                                        </td>

                                                        {/* Notes */}
                                                        <td className="py-4 px-4 align-middle">
                                                            {p.note && p.note.trim() !== '' ? (
                                                                <div className="flex items-start gap-2 bg-amber-50/80 p-2.5 rounded-xl border border-amber-100/50">
                                                                    <FaStickyNote className="text-amber-400 shrink-0 mt-0.5" size={12} />
                                                                    <span className="text-[11px] font-medium text-slate-600 leading-snug line-clamp-2" title={p.note}>
                                                                        {p.note}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-300 italic">-</span>
                                                            )}
                                                        </td>

                                                        {/* Action */}
                                                        <td className="py-4 pr-6 pl-4 text-center align-middle">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CancelButton p={p} />
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* --- MOBILE CARD VIEW --- */}
                                    <div className="lg:hidden space-y-4">
                                        {filteredProducts.map((p, index) => (
                                            <motion.div
                                                key={p.ID}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative"
                                            >
                                                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                                                    <div
                                                        className="inline-flex items-center gap-1.5 font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
                                                        onClick={(e) => handleCopy(e, p.requestno)}
                                                    >
                                                        <FaHashtag className="text-slate-400" size={10} />
                                                        {p.requestno}
                                                    </div>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                                        <FaCalendarAlt size={10} /> {moment(p.requestdate).format('DD MMM YY')}
                                                    </span>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2 shrink-0">
                                                        {p.img ? <img src={`/componentImages${p.img}`} alt={p.electotronixPN} className="max-w-full max-h-full object-contain mix-blend-multiply" /> : <FaMicrochip className="text-slate-300" size={24} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">
                                                            {p.electotronixPN}
                                                        </h4>
                                                        <p className="text-xs font-medium text-slate-500 truncate mb-2">
                                                            {p.description || "No description"}
                                                        </p>
                                                        <div className="inline-block bg-slate-900 px-3 py-1 rounded-lg text-white font-bold text-xs shadow-sm">
                                                            {t.headers.qty}: {p.requestqty}
                                                        </div>
                                                    </div>
                                                </div>

                                                {p.note && p.note.trim() !== '' && (
                                                    <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                                        <FaStickyNote className="text-amber-400 shrink-0 mt-0.5" size={12} />
                                                        <p className="text-[11px] font-medium text-slate-600 leading-snug italic">
                                                            {p.note}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-4 pt-2 border-t border-slate-100">
                                                    <CancelButton p={p} isMobile={true} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                    {/* ================= CATEGORY FILTER ================= */}
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Filter By:</span>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <FaChevronDown size={10} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* MODALS (PORTAL) */}
            {/* ============================================================================ */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showCancelModal && selectedProduct && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                                onClick={() => !isCancelling && setShowCancelModal(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }} transition={{ duration: 0.2 }}
                                className="relative bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl z-10 border border-slate-100 text-center"
                            >
                                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full border border-rose-100 flex items-center justify-center shrink-0 mx-auto mb-4">
                                    <FaTrashAlt size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{t.modal.cancelTitle}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6">
                                    {t.modal.cancelRef} <strong className="text-slate-700">{selectedProduct.requestno}</strong>
                                </p>

                                <div className="mb-6 text-left">
                                    <label className="text-[11px] font-bold text-slate-500 mb-2 block tracking-wider uppercase">
                                        {t.modal.cancelReason} <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder={t.modal.reasonPlaceholder}
                                        value={cancelMessage}
                                        onChange={(e) => setCancelMessage(e.target.value)}
                                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm font-medium outline-none focus:border-rose-400 focus:bg-white transition-all shadow-inner resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        disabled={isCancelling}
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        {t.modal.keepIt}
                                    </button>
                                    <button
                                        disabled={isCancelling}
                                        onClick={handleCancel}
                                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isCancelling ? <FaSpinner className="animate-spin" /> : t.modal.confirmCancel}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </React.Fragment>
    );
};

export default StockUserRequestDashboardScreen;