import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBoxOpen,
    FaCopy,
    FaTrashAlt,
    FaShieldAlt,
    FaChevronRight,
    FaExclamationTriangle
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import CustomCheckbox from '../../components/CustomCheckbox';
import {
    useGetcopyCartByUserIDQuery,
    useDeletecopycartMutation
} from '../../slices/copypcbCartApiSlice';
import { toast } from 'react-toastify';
import { BASE_URL as APP_BASE_URL } from '../../constants';

const CopyPCBCartScreen = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const { language } = useSelector((state) => state.language);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const { data, isLoading, error, refetch } = useGetcopyCartByUserIDQuery(userInfo?._id, {
        skip: !userInfo?._id,
        refetchOnMountOrArgChange: true,
    });

    const [deleteCartItem] = useDeletecopycartMutation();

    const validOrders = useMemo(() => data?.data
        ?.filter((order) => order.pcb_qty > 0)
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [], [data]);

    // Initialize selection: select all ONLY on first load of items
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (validOrders && validOrders.length > 0 && !isInitialized) {
            setSelectedIds(validOrders.map(item => item.id));
            setIsInitialized(true);
        }
    }, [validOrders, isInitialized]);

    // Calculate Summary Locally based on selection
    const selectedItems = validOrders.filter(item => selectedIds.includes(item.id));
    const totalConfirmedPrice = selectedItems.reduce((acc, order) => acc + (parseFloat(order.confirmed_price) || 0), 0);
    const acceptedItems = selectedItems.filter(o => o.status === 'accepted');

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === validOrders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(validOrders.map(item => item.id));
        }
    };

    const handleCancel = async (id) => {
        try {
            await deleteCartItem(id).unwrap();
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
            refetch();
            setShowConfirmModal(false);
            toast.success(language === 'thai' ? 'ลบรายการเรียบร้อยแล้ว' : 'Item removed successfully');
        } catch (err) {
            toast.error(err?.data?.message || 'ไม่สามารถลบรายการได้');
        }
    };

    const checkoutHandler = () => {
        if (selectedIds.length === 0) {
            toast.warning(language === 'thai' ? 'กรุณาเลือกรายการที่ต้องการชำระเงิน' : 'Please select items to checkout');
            return;
        }
        if (acceptedItems.length === 0) {
            toast.info(language === 'thai' ? 'รายการที่เลือกยังไม่ได้รับการอนุมัติ' : "Selected items are not approved yet.");
            return;
        }
        // Proceed with the first accepted item from the selection
        navigate(`/login?redirect=/copypcbshipping/${acceptedItems[0].id}?amount=${acceptedItems[0].confirmed_price}`);
    };

    const formatPrice = (price, status) => {
        if (price === undefined || price === null || isNaN(price) || price === 0) {
            if (status === 'accepted' || status === 'paid') return '฿0.00';
            return language === 'thai' ? 'รอประเมินราคา' : 'Wait for Quotation';
        }
        return `฿${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getFullUrl = (pathInput) => {
        if (!pathInput) return null;
        const path = typeof pathInput === 'object' ? (pathInput.path || pathInput.url) : pathInput;
        if (!path || typeof path !== 'string') return null;
        if (path.startsWith('http')) return path;
        let normalizedPath = path.replace(/\\/g, '/');
        if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : (APP_BASE_URL || '');
        return `${baseUrl}${normalizedPath}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
    };

    if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-[#fcfdfe]"><Loader /></div>;

    return (
        <div className="font-sans text-slate-800 bg-[#fdfdfd] md:bg-[#fdfdfd] min-h-[400px] py-2 md:py-10 px-0 md:px-8 flex justify-center w-full text-start">
            <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-0 md:border md:border-slate-200/60 md:shadow-md md:rounded-2xl overflow-hidden">

                {/* 🔴 Left Column: Project Items */}
                <div className="flex-1 p-0 md:p-8 bg-white text-start">
                    <div className="hidden md:grid grid-cols-12 pb-3 mb-6 border-b border-slate-200 text-[13px] uppercase tracking-wide">
                        <div className="col-span-1 flex items-center justify-center">
                            <CustomCheckbox
                                checked={validOrders.length > 0 && selectedIds.length === validOrders.length}
                                onChange={toggleSelectAll}
                            />
                        </div>
                        <div className="col-span-11 grid grid-cols-11 pl-4 gap-3 md:gap-4">
                            <div className="col-span-1 md:col-span-4 font-bold text-slate-500 text-start uppercase tracking-wider">{language === 'thai' ? 'รายการสั่งทำ Copy PCB' : 'Standard Copy PCB Order'}</div>
                            <div className="col-span-1 md:col-span-1 text-right font-bold pr-4 text-slate-500 uppercase tracking-wider">{language === 'thai' ? 'จำนวน' : 'Qty'}</div>
                            <div className="col-span-1 md:col-span-3 text-center font-bold text-slate-500 uppercase tracking-wider">{language === 'thai' ? 'สถานะ' : 'Status'}</div>
                            <div className="col-span-1 md:col-span-3 text-right font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{language === 'thai' ? 'ราคา' : 'Price'}</div>
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6 min-h-[200px]">
                        {error ? (
                            <Message variant="danger">{error?.data?.message || error.error}</Message>
                        ) : validOrders.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-24"
                            >
                                <div className="w-20 h-20 flex items-center justify-center text-slate-200 mb-4">
                                    <FaBoxOpen size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 capitalize m-0 tracking-tight text-center mb-2">
                                    {language === 'thai' ? 'ไม่มีสินค้าในตะกร้าของคุณ' : 'Your cart is empty'}
                                </h3>
                                <Link to="/copypcb" className="mt-8 text-blue-600 font-bold text-sm hover:underline hover:text-blue-700 transition-all">
                                    {language === 'thai' ? 'เริ่มสั่งผลิตใหม่' : 'Start New Order'}
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-6"
                            >
                                {validOrders.map((order, index) => {
                                    return (
                                        <motion.div
                                            key={`${order.id}-${index}`}
                                            variants={itemVariants}
                                            layout
                                            className="border-b border-slate-100 pb-4 md:pb-6 relative group"
                                        >
                                            <div className="flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                                                {/* Checkbox */}
                                                <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                                                    <CustomCheckbox
                                                        checked={selectedIds.includes(order.id)}
                                                        onChange={() => toggleSelect(order.id)}
                                                    />
                                                </div>

                                                {/* Unified Content Container */}
                                                <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-3 md:gap-4 min-w-0">

                                                    {/* Image and Details Stack */}
                                                    <div className="col-span-4 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                                                        {/* Top row: Image + Name/SKU */}
                                                        <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                                                            {/* Image */}
                                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                                {order.front_image_1 ? (
                                                                    <img
                                                                        src={getFullUrl(order.front_image_1)}
                                                                        alt="PCB"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <FaCopy size={24} className="text-slate-200 md:hidden" />
                                                                )}
                                                                <div className="hidden md:block">
                                                                    {!order.front_image_1 && <FaCopy size={32} className="text-slate-200" />}
                                                                </div>
                                                            </div>

                                                            {/* Details Context */}
                                                            <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                                                                <Link to={`/copycartpcb/${order.id}`} className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase hover:text-blue-600 transition-colors leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0">
                                                                    {order.projectname || 'UNTITLED PROJECT'}
                                                                </Link>
                                                                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate block w-full">
                                                                    ID: {order.id} • {language === 'thai' ? 'สั่งทำตามตัวอย่าง' : 'COPY PCB'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* --- MOBILE ONLY ACTION BOX (separate row) --- */}
                                                        <div className="flex md:hidden items-center justify-between w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[8px] font-black tracking-[0.15em] uppercase text-slate-400 mb-0.5">{language === 'thai' ? 'ยอดที่อนุมัติ' : 'Confirmed'}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-[14px] text-slate-900 leading-none">
                                                                        {formatPrice(order.confirmed_price, order.status)}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-slate-400">/ {order.pcb_qty} PCS</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-shrink-0 scale-90 origin-right">
                                                                    {order.status === 'accepted' ? (
                                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-900 border border-slate-200 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                                                            <FaShieldAlt size={8} /> {language === 'thai' ? 'อนุมัติแล้ว' : 'Approved'}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                                                            {language === 'thai' ? 'รอตรวจสอบ' : 'Pending'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setCancelTargetId(order.id);
                                                                        setShowConfirmModal(true);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg border border-rose-100 active:bg-rose-100 transition-colors"
                                                                >
                                                                    <FaTrashAlt size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* --- DESKTOP ONLY COLUMNS --- */}
                                                    <div className="hidden md:block col-span-1 text-right pr-4">
                                                        <span className="font-bold text-[14px] text-slate-900">
                                                            {order.pcb_qty} PCS
                                                        </span>
                                                    </div>

                                                    <div className="hidden md:flex col-span-3 justify-center">
                                                        {order.status === 'accepted' ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                                                <FaShieldAlt size={8} /> {language === 'thai' ? 'อนุมัติแล้ว' : 'Approved'}
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                                                {language === 'thai' ? 'รอตรวจสอบ' : 'Pending Review'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="hidden md:flex col-span-3 items-center justify-end gap-3 text-right">
                                                        <span className="font-bold text-[16px] text-slate-900 leading-none whitespace-nowrap">
                                                            {formatPrice(order.confirmed_price, order.status)}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setCancelTargetId(order.id);
                                                                setShowConfirmModal(true);
                                                            }}
                                                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                                                            title="Remove Item"
                                                        >
                                                            <FaTrashAlt size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <Link to="/copypcb" className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.1em] flex items-center gap-2">
                            + {language === 'thai' ? 'เพิ่มรายการ Copy PCB อื่น' : 'ADD ANOTHER COPY PCB'}
                        </Link>
                    </div>
                </div>

                {/* 🔵 Right Column: Summary */}
                <div className="w-full lg:w-[350px] bg-white border-l border-slate-200/60 p-8 lg:p-10 shrink-0 flex flex-col text-start">
                    <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-[0.2em] mb-10">
                        {language === 'thai' ? 'SUMMARY' : 'SUMMARY'}
                    </h2>

                    <div className="flex flex-col flex-grow relative z-10">
                        <div className="space-y-6 mb-10">
                            <div className="flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>{language === 'thai' ? 'SUBTOTAL' : 'SUBTOTAL'}</span>
                                <span className="text-slate-800">{formatPrice(totalConfirmedPrice)}</span>
                            </div>

                            <div className="pt-6">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 block">
                                    {language === 'thai' ? `SELECTED ${selectedIds.length} ITEMS` : `SELECTED ${selectedIds.length} ITEMS`}
                                </span>

                                <button
                                    onClick={checkoutHandler}
                                    disabled={selectedIds.length === 0 || acceptedItems.length === 0}
                                    className={`w-full py-4 rounded-lg text-[13px] font-bold tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-3 mb-8
                                        ${selectedIds.length > 0 && acceptedItems.length > 0
                                            ? 'bg-slate-900 text-white hover:bg-black shadow-lg hover:shadow-xl active:scale-[0.98]'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {language === 'thai' ? 'ชำระเงินตามที่เลือก' : 'Checkout Selected'}
                                </button>
                            </div>

                            {/* Evaluation Info Box */}
                            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-6 space-y-4">
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                    {language === 'thai' ? 'การประเมินเบื้องต้น' : 'ASSEMBLY EVALUATION'}
                                </h4>
                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-wide">
                                    {language === 'thai'
                                        ? 'ช่างเทคนิคของเราต้องตรวจสอบไฟล์ด้วยตนเองเพื่อให้ใบเสนอราคาที่ถูกต้องในขั้นตอนสุดท้าย'
                                        : 'Our technicians must manually verify the files to provide a final accurate quotation.'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                    {language === 'thai' ? 'โดยปกติจะเสร็จสิ้นภายใน 24-48 ชั่วโมง' : 'USUALLY COMPLETED WITHIN 24-48 HOURS.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-slate-800 uppercase tracking-[0.15em]">{language === 'thai' ? 'ORDER TOTAL' : 'ORDER TOTAL'}</span>
                                <span className="font-bold text-slate-900 text-2xl tracking-tighter">
                                    {formatPrice(totalConfirmedPrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            {showConfirmModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden" style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}>
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    </AnimatePresence>
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-sm p-12 text-center border border-white/20 font-prompt z-10">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100/50">
                            <FaExclamationTriangle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">
                            {language === 'thai' ? 'ลบรายการ?' : 'Remove Item?'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">
                            {language === 'thai' ? 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้ออกจากตะกร้า?' : 'Are you sure you want to remove this project from your cart?'}
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-2xl border-none">
                                {language === 'thai' ? 'ยกเลิก' : 'Cancel'}
                            </button>
                            <button onClick={() => handleCancel(cancelTargetId)} className="flex-1 py-4 bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 rounded-2xl border-none">
                                {language === 'thai' ? 'ยืนยันการลบ' : 'Remove'}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CopyPCBCartScreen;