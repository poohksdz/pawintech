import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaCheck, FaTimes, FaEdit, FaBoxOpen, FaUser,
    FaMicrochip, FaCalendarAlt, FaShoppingCart, FaInbox,
    FaExclamationTriangle, FaArrowRight, FaChevronDown, FaRegClock
} from 'react-icons/fa';
import { useGetStockRequestQuery, useUpdateStockRequestQtyMutation, useUpdateStockRequestCancelMutation } from '../../../slices/stockRequestApiSlice';
import { addToStockIssueCart } from '../../../slices/stockIssueCartApiSlice';
import { useGetStockProductsQuery } from '../../../slices/stockProductApiSlice';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';

const StockRequestDashboardScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const { data, isLoading, error } = useGetStockRequestQuery();
    const { data: existingQtyData } = useGetStockProductsQuery();
    const [updateStockRequestQty] = useUpdateStockRequestQtyMutation();
    const [updateStockRequestCancel] = useUpdateStockRequestCancelMutation();

    const products = useMemo(() => data?.requestgoods || [], [data]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [showQtyModal, setShowQtyModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newQty, setNewQty] = useState(0);
    const [cancelMessage, setCancelMessage] = useState('');

    const { language } = useSelector((state) => state.language);

    const t = {
        en: {
            title: 'Pending Requests',
            subtitle: 'Review and process component request queues.',
            searchPlaceholder: 'Ref No, P/N, User...',
            issueCart: 'Issue Cart',
            totalPending: 'Total Pending',
            criticalStock: 'Critical Stock',
            stockAccess: 'Stock Access',
            adminPanel: 'Admin Panel',
            filterBy: 'Filter By:',
            all: 'All',
            items: 'items',
            alerts: 'alerts',
            noRecords: 'No records found',
            noRecordsDesc: "We couldn't find any pending requests matching your current filters.",
            headers: {
                reqInfo: 'Req Info',
                requester: 'Requester',
                component: 'Component',
                qtyStock: 'Qty / Stock',
                note: 'Note',
                actions: 'Actions'
            },
            actions: {
                approve: 'Approve',
                editQty: 'Edit Qty',
                reject: 'Reject'
            },
            modal: {
                updateQty: 'Update Quantity',
                saveChanges: 'Save Changes',
                rejectRequest: 'Reject Request',
                rejectReason: 'Please provide a reason for rejection.',
                reasonPlaceholder: 'Enter reason...',
                rejectNow: 'Reject Now',
                cancel: 'Cancel'
            },
            toast: {
                addedToCart: 'Added to Issue Cart',
                qtyUpdated: 'Quantity updated successfully',
                qtyUpdateFailed: 'Failed to update quantity',
                rejected: 'Request Rejected successfully',
                rejectFailed: 'Failed to cancel request',
                provideReason: 'Please provide a reason'
            }
        },
        thai: {
            title: 'รายการรออนุมัติ',
            subtitle: 'ตรวจสอบและดำเนินการคิวการเบิกส่วนประกอบ',
            searchPlaceholder: 'เลขที่อ้างอิง, P/N, ผู้เบิก...',
            issueCart: 'ตะกร้าจ่ายของ',
            totalPending: 'รออนุมัติทั้งหมด',
            criticalStock: 'สต็อกวิกฤต',
            stockAccess: 'การเข้าถึงสต็อก',
            adminPanel: 'แผงควบคุม',
            filterBy: 'กรองโดย:',
            all: 'ทั้งหมด',
            items: 'รายการ',
            alerts: 'แจ้งเตือน',
            noRecords: 'ไม่พบข้อมูล',
            noRecordsDesc: 'ไม่พบรายการเบิกพัสดุที่รอการอนุมัติที่ตรงกับตัวกรองของคุณ',
            headers: {
                reqInfo: 'ข้อมูลการเบิก',
                requester: 'ผู้เบิก',
                component: 'ส่วนประกอบ',
                qtyStock: 'จำนวน / สต็อก',
                note: 'บันทึก',
                actions: 'จัดการ'
            },
            actions: {
                approve: 'อนุมัติ',
                editQty: 'แก้ไขจำนวน',
                reject: 'ปฏิเสธ'
            },
            modal: {
                updateQty: 'แก้ไขจำนวน',
                saveChanges: 'บันทึกการเปลี่ยนแปลง',
                rejectRequest: 'ปฏิเสธการเบิก',
                rejectReason: 'โปรดระบุเหตุผลในการปฏิเสธรายการนี้',
                reasonPlaceholder: 'ระบุเหตุผล...',
                rejectNow: 'ปฏิเสธทันที',
                cancel: 'ยกเลิก'
            },
            toast: {
                addedToCart: 'เพิ่มลงตะกร้าจ่ายพัสดุแล้ว',
                qtyUpdated: 'อัปเดตจำนวนสำเร็จ',
                qtyUpdateFailed: 'อัปเดตจำนวนไม่สำเร็จ',
                rejected: 'ปฏิเสธรายการสำเร็จ',
                rejectFailed: 'ปฏิเสธรายการไม่สำเร็จ',
                provideReason: 'โปรดระบุเหตุผล'
            }
        }
    }[language || 'en'];

    const categories = useMemo(() => {
        const unique = new Set(products.map(p => p.category || 'Other'));
        return ['All', ...Array.from(unique).sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Search Filter
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.requestno?.toLowerCase().includes(q) ||
                p.electotronixPN?.toLowerCase().includes(q) ||
                p.requestedUser?.toLowerCase().includes(q)
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p => (p.category || 'Other') === selectedCategory);
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => moment(b.requestdate).valueOf() - moment(a.requestdate).valueOf());
    }, [searchQuery, products, selectedCategory]);

    const stats = useMemo(() => ({
        pending: products.length,
        critical: (existingQtyData?.products || []).filter(p => p.quantity <= (p.minStock || 5)).length
    }), [products, existingQtyData]);

    const addToStockIssueHandler = (product) => {
        dispatch(addToStockIssueCart(product));
        toast.success(t.toast.addedToCart, { position: 'bottom-center' });
    };

    const handleSaveQty = async () => {
        try {
            await updateStockRequestQty({ id: selectedProduct.ID, qty: newQty }).unwrap();
            toast.success(t.toast.qtyUpdated);
            setShowQtyModal(false);
        } catch (err) {
            toast.error(t.toast.qtyUpdateFailed);
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancelMessage.trim()) return toast.error(t.toast.provideReason);
        try {
            await updateStockRequestCancel({
                id: selectedProduct.ID,
                cancel_message: cancelMessage,
                updateCancelBy: userInfo.name,
                canceledUserId: userInfo._id
            }).unwrap();
            toast.success(t.toast.rejected);
            setShowCancelModal(false);
        } catch (err) {
            toast.error(t.toast.rejectFailed);
        }
    };

    if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-[#FDFDFD]"><Loader /></div>;
    if (error) return <div className="min-h-screen flex justify-center items-center bg-[#FDFDFD]"><Message variant="danger">{error?.data?.message || 'Error occurred'}</Message></div>;

    return (
        <div className="bg-[#F8FAFC] min-h-screen font-sans pb-24 text-slate-800 antialiased selection:bg-indigo-100 relative overflow-hidden">
            {/* Background Gradient */}
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

                        {/* Issue Cart Link */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/componentissuecartlist')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 h-11 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md"
                        >
                            <FaShoppingCart size={14} />
                            <span>{t.issueCart}</span>
                        </motion.button>
                    </div>
                </header>

                {/* ================= QUICK STATS ================= */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-500 flex items-center justify-center shrink-0">
                            <FaRegClock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.totalPending}</p>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{stats.pending} <span className="text-xs font-semibold text-slate-500">{t.items}</span></h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 text-amber-500 flex items-center justify-center shrink-0">
                            <FaExclamationTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.criticalStock}</p>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{stats.critical} <span className="text-xs font-semibold text-slate-500">{t.alerts}</span></h3>
                        </div>
                    </div>

                    <div className="hidden lg:flex bg-slate-900 rounded-2xl p-6 shadow-md items-center justify-between relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                            <FaBoxOpen size={100} />
                        </div>
                        <div className="relative z-10 text-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.stockAccess}</p>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FaArrowRight className="text-indigo-400" size={16} /> {t.adminPanel}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* ================= CATEGORY FILTER ================= */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{t.filterBy}</span>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'All' ? t.all : cat}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <FaChevronDown size={10} />
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
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Desktop Table */}
                                <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <th className="px-6 py-5">{t.headers.reqInfo}</th>
                                                <th className="px-6 py-5">{t.headers.requester}</th>
                                                <th className="px-6 py-5">{t.headers.component}</th>
                                                <th className="px-6 py-5 text-center">{t.headers.qtyStock}</th>
                                                <th className="px-6 py-5">{t.headers.note}</th>
                                                <th className="px-6 py-5 text-center">{t.headers.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProducts.map((p, idx) => {
                                                const stock = existingQtyData?.products?.find(e => e.electotronixPN === p.electotronixPN)?.quantity || 0;
                                                const isEnough = stock >= p.requestqty;
                                                return (
                                                    <motion.tr
                                                        key={p.ID}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        className="group hover:bg-indigo-50/30 transition-colors"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="font-bold text-slate-900 text-sm">{p.requestno}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                                                                <FaCalendarAlt size={10} /> {moment(p.requestdate).format('DD MMM YYYY')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                                    <FaUser size={12} />
                                                                </div>
                                                                <span className="text-sm font-semibold text-slate-700">{p.requestedUser}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 shadow-sm">
                                                                    {p.img ? (
                                                                        <img src={`/componentImages${p.img}`} alt="pic" className="max-w-full max-h-full object-contain" />
                                                                    ) : (
                                                                        <FaMicrochip className="text-slate-300" />
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-900 tracking-tight">{p.electotronixPN}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className={`inline-flex flex-col items-center px-3 py-1 rounded-xl text-[11px] font-bold ${isEnough ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                <span>{p.requestqty} Req</span>
                                                                <span className="opacity-60 text-[9px] uppercase">Stock: {stock}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="text-xs text-slate-500 font-medium max-w-[150px] truncate" title={p.note}>
                                                                {p.note || '-'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => addToStockIssueHandler(p)}
                                                                    className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all shadow-sm"
                                                                    title={t.actions.approve}
                                                                >
                                                                    <FaCheck size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedProduct(p); setNewQty(p.requestqty); setShowQtyModal(true) }}
                                                                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                                                                    title={t.actions.editQty}
                                                                >
                                                                    <FaEdit size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedProduct(p); setCancelMessage(''); setShowCancelModal(true) }}
                                                                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-rose-400 hover:text-rose-600 transition-all shadow-sm"
                                                                    title={t.actions.reject}
                                                                >
                                                                    <FaTimes size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="lg:hidden space-y-4">
                                    {filteredProducts.map((p) => {
                                        const stock = existingQtyData?.products?.find(e => e.electotronixPN === p.electotronixPN)?.quantity || 0;
                                        const isEnough = stock >= p.requestqty;
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={p.ID}
                                                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{p.requestno}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                                                            <FaCalendarAlt size={10} /> {moment(p.requestdate).format('DD MMM YYYY')}
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-xl text-[11px] font-bold ${isEnough ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {p.requestqty} Req
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
                                                    <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                        {p.img ? (
                                                            <img src={`/componentImages${p.img}`} alt="pic" className="max-w-full max-h-full object-contain" />
                                                        ) : (
                                                            <FaMicrochip className="text-slate-300" size={24} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">{p.electotronixPN}</div>
                                                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                                            <FaUser className="text-slate-400" size={10} /> {p.requestedUser}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Stock: {stock}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => addToStockIssueHandler(p)}
                                                        className="flex-1 h-11 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                                                    >
                                                        <FaCheck size={12} /> {t.actions.approve}
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedProduct(p); setNewQty(p.requestqty); setShowQtyModal(true) }}
                                                        className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedProduct(p); setCancelMessage(''); setShowCancelModal(true) }}
                                                        className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600"
                                                    >
                                                        <FaTimes size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* ================= MODALS ================= */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showQtyModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQtyModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100">
                                <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{t.modal.updateQty}</h3>
                                <input
                                    type="number"
                                    value={newQty}
                                    onChange={e => setNewQty(e.target.value)}
                                    className="w-full text-center text-5xl font-black text-slate-900 bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-100 mb-8"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowQtyModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors uppercase text-[11px] tracking-widest">{t.modal.cancel}</button>
                                    <button onClick={handleSaveQty} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors uppercase text-[11px] tracking-widest shadow-lg shadow-slate-200">{t.modal.saveChanges}</button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {showCancelModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCancelModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100">
                                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaTimes size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{t.modal.rejectRequest}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6">{t.modal.rejectReason}</p>
                                <textarea
                                    rows={3}
                                    value={cancelMessage}
                                    onChange={e => setCancelMessage(e.target.value)}
                                    placeholder={t.modal.reasonPlaceholder}
                                    className="w-full text-sm font-medium bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-100 mb-6 resize-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors uppercase text-[11px] tracking-widest">{t.modal.cancel}</button>
                                    <button onClick={handleConfirmCancel} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-colors uppercase text-[11px] tracking-widest shadow-lg shadow-rose-100">{t.modal.rejectNow}</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default StockRequestDashboardScreen;