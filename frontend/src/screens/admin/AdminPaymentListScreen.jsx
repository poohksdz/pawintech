import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCheck, FaTimes, FaEye, FaUser, FaCalendarAlt, FaSearch,
    FaFileInvoiceDollar, FaBoxOpen, FaTruck, FaStore,
    FaMapMarkerAlt, FaPhoneAlt, FaCheckCircle, FaClock,
    FaGlobe, FaDownload, FaFilter, FaChartLine,
    FaExclamationCircle, FaInfoCircle, FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-toastify';

import { useGetAllPaymentsQuery, useUpdatePaymentStatusMutation } from '../../slices/paymentApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { BASE_URL } from '../../constants';

// ==========================================
// 1. Helper Functions 
// ==========================================
const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + ' น.';
};

const checkIsPaid = (item) => {
    const s = item.status?.toLowerCase();
    return item.isPaid === true || item.isPaid === 1 || s === 'paid' || s === 'completed' || s === 'accepted';
};

const checkIsRejected = (item) => {
    const s = item.status?.toLowerCase();
    return s === 'reject' || s === 'rejected';
};

const getDetailLink = (item) => {
    const id = item._id;
    switch (item.orderType) {
        case 'product': return `/order/${id}`;
        case 'pcb': return `/copypcb/${id}`;
        case 'custom': return `/custompcb/${id}`;
        case 'assembly': return `/assemblypcb/${id}`;
        case 'orderpcb': return `/orderpcbs/${id}`;
        default: return '#';
    }
};

const getSlipUrl = (slipPath) => {
    if (!slipPath) return '';
    if (slipPath.startsWith('http')) return slipPath;
    let cleanPath = slipPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = `uploads/${cleanPath}`;
    return `${BASE_URL}/${cleanPath}`;
};

const tabOptions = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'product', label: 'สินค้าทั่วไป' },
    { id: 'custom', label: 'Custom PCB' },
    { id: 'pcb', label: 'Copy PCB' },
    { id: 'orderpcb', label: 'สั่งทำ PCB' },
    { id: 'assembly', label: 'งานประกอบ' },
];

const FaTimesCircle = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path>
    </svg>
);

// ==========================================
// 2. Sub-Components
// ==========================================
const StatCard = ({ title, count, amount, colorTheme }) => {
    const themes = {
        rose: { bg: 'bg-rose-50', text: 'text-rose-400', amountText: 'text-rose-600' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-400', amountText: 'text-emerald-600' }
    };
    const theme = themes[colorTheme];

    return (
        <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group min-w-[200px]">
            <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-full translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform duration-500 opacity-50`}></div>
            <p className={`text-[10px] font-black ${theme.text} uppercase tracking-widest mb-1 relative z-10`}>
                {title} ({count})
            </p>
            <p className={`text-2xl font-black ${theme.amountText} tracking-tight relative z-10`}>
                {Number(amount).toLocaleString()} <span className="text-sm font-bold opacity-70">฿</span>
            </p>
        </div>
    );
};

const PaymentTableRow = ({
    item, index, trackingInput, setTrackingInput,
    onShowSlip, onUpdateStatus, onShipOrder
}) => {
    const amount = item.amount || 0;
    const isPaid = checkIsPaid(item);
    const isRejected = checkIsRejected(item);
    const isAtCompany = item.receivePlace === 'atcompany';

    // เช็คว่าสถานะออเดอร์ถูกลูกค้ากดยืนยันแล้วหรือยัง (status เป็น completed)
    const isCompleted = item.status?.toLowerCase() === 'completed' || item.isReceived === true;

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-slate-50/70 transition-all group"
        >
            {/* Column 1: ข้อมูลออเดอร์ */}
            <td className="px-10 py-8 align-top">
                <div className="space-y-4 text-start">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {item.orderType}
                        </span>
                        <p className="text-sm font-black text-slate-900">#{String(item._id).slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="space-y-1.5 py-1">
                        <p className="text-2xl font-black text-blue-600 flex items-end gap-1">
                            {Number(amount).toLocaleString()} <span className="text-xs pb-1 font-bold opacity-60">THB</span>
                        </p>
                        <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-400 flex items-center gap-2">
                                <FaCalendarAlt className="shrink-0 text-blue-500 opacity-50" /> {formatDateTime(item.createdAt)}
                            </span>
                            {item.paymentDate && (
                                <span className="text-emerald-500 flex items-center gap-2">
                                    <FaClock className="shrink-0" /> {formatDateTime(item.paymentDate)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {item.paymentSlip ? (
                            <button
                                onClick={() => onShowSlip(item.paymentSlip)}
                                className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                                <FaEye className="shrink-0" /> ดูหลักฐาน
                            </button>
                        ) : (
                            <span className="bg-slate-100 text-slate-300 text-[10px] font-black px-4 py-2 rounded-xl border border-slate-200 border-dashed italic">
                                MISSING SLIP
                            </span>
                        )}
                        <a
                            href={getDetailLink(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                            <FaInfoCircle className="shrink-0" /> ดูออเดอร์
                        </a>
                    </div>
                </div>
            </td>

            {/* Column 2: รายละเอียดการจัดส่ง */}
            <td className="px-10 py-8 align-top min-w-[360px]">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm group-hover:shadow-lg transition-all duration-500 border-l-8 border-l-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isAtCompany ? 'text-amber-600' : 'text-blue-600'}`}>
                            {isAtCompany ? <><FaStore className="shrink-0" /> รับที่บริษัท</> : <><FaTruck className="shrink-0" /> จัดส่งพัสดุ</>}
                        </div>
                        {item.user?.email && (
                            <span className="text-[10px] font-bold text-slate-300 italic truncate max-w-[150px]">
                                {item.user.email}
                            </span>
                        )}
                    </div>
                    <div className="space-y-3 text-start">
                        <p className="font-black text-slate-900 flex items-center gap-4 text-sm">
                            <FaUser className="shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" size={12} />
                            {item.shippingName || item.user?.name || 'ลูกค้าโครงการ'}
                        </p>
                        <div className="flex items-start gap-4 text-xs font-bold text-slate-500 leading-relaxed">
                            <FaMapMarkerAlt className="mt-1 shrink-0 text-slate-400" size={12} />
                            <p>{item.shippingAddress || 'ไม่พบข้อมูลที่อยู่นัดรับหรือจัดส่ง'}</p>
                        </div>
                        <p className="font-black text-slate-900 flex items-center gap-4 text-sm">
                            <FaPhoneAlt className="shrink-0 text-slate-400" size={12} />
                            {item.shippingPhone || 'N/A'}
                        </p>
                    </div>
                </div>
            </td>

            {/* Column 3: จัดการรายการ */}
            <td className="px-10 py-8 align-middle">
                <div className="flex flex-col items-center justify-center w-full min-w-[300px]">

                    {/* Stage 1: ตรวจสอบสลิป */}
                    {!isPaid && !isRejected && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1 rounded-full">
                                ตรวจสอบรายการ
                            </p>
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.1, translateY: -4 }}
                                    whileActive={{ scale: 0.9 }}
                                    onClick={() => onUpdateStatus(item._id, 'Paid', item.orderType)}
                                    className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200 flex items-center justify-center text-2xl"
                                >
                                    <FaCheck />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, translateY: -4 }}
                                    whileActive={{ scale: 0.9 }}
                                    onClick={() => onUpdateStatus(item._id, 'Reject', item.orderType)}
                                    className="w-16 h-16 bg-rose-500 text-white rounded-[1.5rem] shadow-xl shadow-rose-200 flex items-center justify-center text-2xl"
                                >
                                    <FaTimes />
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* Stage 2: รอส่งของ / กรอกเลขพัสดุ / กำลังผลิต */}
                    {isPaid && !item.isDelivered && (
                        <div className="w-full max-w-[300px] space-y-4">
                            <p className={`text-center text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${item.isManufacting
                                ? 'text-blue-600 bg-blue-50 border-blue-100'
                                : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                }`}
                            >
                                {item.isManufacting ? 'กำลังผลิต • รอส่งมอบ' : 'อนุมัติแล้ว • รอส่งมอบ'}
                            </p>

                            {isAtCompany ? (
                                /* กรณีรับที่บริษัท จะมีแค่ปุ่มให้แอดมินกดยืนยันการส่งมอบให้ลูกค้า */
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileActive={{ scale: 0.98 }}
                                    onClick={() => onShipOrder(item._id, item.orderType, 'atcompany')}
                                    className="w-full bg-slate-900 text-white font-black py-4 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest"
                                >
                                    ยืนยันลูกค้ารับสินค้า <FaArrowRight />
                                </motion.button>
                            ) : (
                                <div className="bg-white p-4 border border-slate-200 rounded-[1.5rem] shadow-xl space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600 text-[11px] font-black uppercase whitespace-nowrap">
                                        <FaBoxOpen className="shrink-0" size={16} /> เลขติดตามพัสดุ
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="ระบุเลขพัสดุ..."
                                            className="w-full min-w-0 flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 placeholder:font-normal"
                                            value={trackingInput}
                                            onChange={(e) => setTrackingInput(item._id, e.target.value)}
                                        />
                                        <button
                                            onClick={() => onShipOrder(item._id, item.orderType, 'bysending')}
                                            className="shrink-0 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-[11px] font-black px-4 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-wide"
                                        >
                                            <FaTruck size={14} className="shrink-0" /> บันทึก
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stage 3: ส่งของเรียบร้อย (รอยืนยัน / หรือ จัดส่งสำเร็จ) */}
                    {item.isDelivered && (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-20 h-20 rounded-full flex items-center justify-center border-8 border-white shadow-2xl ${isAtCompany
                                        ? (isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')
                                        : 'bg-emerald-500 text-white'
                                    }`}
                            >
                                {isAtCompany
                                    ? (isCompleted ? <FaCheck size={32} /> : <FaClock size={32} />)
                                    : <FaCheck size={32} />
                                }
                            </motion.div>
                            <div className="text-center">
                                <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isAtCompany && !isCompleted ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {isAtCompany
                                        ? (isCompleted ? 'จัดส่งสำเร็จ' : 'รอลูกค้ายืนยัน')
                                        : 'ส่งของแล้ว'
                                    }
                                </p>
                                {!isAtCompany && (
                                    <span className="bg-slate-900 text-white font-mono font-black text-[11px] px-4 py-2 rounded-xl block shadow-lg mt-2">
                                        {item.deliveryID || item.transferedNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stage 4: ปฏิเสธรายการ */}
                    {isRejected && (
                        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 rounded-[2.5rem] w-full text-rose-500">
                            <FaTimesCircle className="text-4xl mb-3 shadow-xl rounded-full" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Rejected</span>
                        </div>
                    )}

                </div>
            </td>
        </motion.tr>
    );
};

// ==========================================
// 3. Main Component
// ==========================================
const AdminPaymentListScreen = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [showSlip, setShowSlip] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [trackingInputs, setTrackingInputs] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');

    const { data: payments, isLoading, error, refetch } = useGetAllPaymentsQuery();
    const [updatePayment] = useUpdatePaymentStatusMutation();

    useEffect(() => {
        document.body.style.overflow = showSlip ? 'hidden' : 'unset';
    }, [showSlip]);

    const handleUpdateStatus = async (id, status, type) => {
        const actionText = status === 'Paid' ? 'อนุมัติ' : 'ปฏิเสธ';
        if (window.confirm(`ยืนยันการ ${actionText} สลิปโอนเงินนี้ใช่หรือไม่ ? `)) {
            try {
                await updatePayment({ id, status, orderType: type }).unwrap();
                toast.success(`ทำรายการ ${actionText} สำเร็จ`);
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || err.error);
            }
        }
    };

    const handleShipOrder = async (id, type, receivePlace) => {
        const isPickUp = receivePlace === 'atcompany';
        const trackingNo = isPickUp ? 'PICKUP_AT_STORE' : trackingInputs[id];

        if (!isPickUp && !trackingNo) {
            return toast.warning('กรุณากรอกเลขพัสดุก่อนแจ้งจัดส่ง!');
        }

        // ปรับข้อความ Popup แจ้งเตือนแอดมินให้เข้าใจได้ชัดเจนเรื่องการกดยืนยัน 2 ขั้นตอน
        const confirmMsg = isPickUp
            ? 'ยืนยันว่าลูกค้ามารับสินค้าที่บริษัทแล้วใช่หรือไม่ ?\n(สถานะจะเปลี่ยนเป็น "รอลูกค้ายืนยัน" เพื่อให้ลูกค้ากดยืนยันในระบบอีกครั้ง)'
            : `ยืนยันจัดส่งพัสดุด้วยเลขติดตาม: ${trackingNo} ?`;

        if (window.confirm(confirmMsg)) {
            try {
                let endpoint = '';
                if (type === 'custom') endpoint = `/api/custompcbs/delivery/${id}`;
                else if (type === 'pcb') endpoint = `/api/pcbcopy/delivery/${id}`;
                else if (type === 'assembly') endpoint = `/api/pcbassembly/delivery/${id}`;
                else if (type === 'orderpcb') endpoint = `/api/orderpcbs/${id}/deliver`;
                else endpoint = `/api/orders/${id}/deliver`;

                if (endpoint) {
                    const res = await fetch(`${BASE_URL}${endpoint}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transferedNumber: trackingNo, isDelivered: true })
                    });

                    if (res.ok) {
                        toast.success(isPickUp ? 'ส่งมอบสำเร็จ! รอผู้ซื้อกดยืนยัน' : 'แจ้งเลขพัสดุสำเร็จ 🚚');
                        refetch();
                    } else {
                        const errorData = await res.json();
                        toast.error(errorData.message || 'ไม่สามารถอัปเดตข้อมูลได้');
                    }
                }
            } catch (err) {
                toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        }
    };

    const handleTrackingInputChange = (id, value) => {
        setTrackingInputs(prev => ({ ...prev, [id]: value }));
    };

    const filteredPayments = useMemo(() => {
        if (!payments) return [];
        let result = payments;

        if (activeTab !== 'all') result = result.filter(p => p.orderType === activeTab);

        if (statusFilter !== 'all') {
            result = result.filter(p => {
                const isPaid = checkIsPaid(p);
                const isRejected = checkIsRejected(p);
                if (statusFilter === 'pending') return !isPaid && !isRejected;
                if (statusFilter === 'paid') return isPaid;
                if (statusFilter === 'rejected') return isRejected;
                return true;
            });
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(p =>
                String(p._id).toLowerCase().includes(lowerSearch) ||
                (p.user?.name && p.user.name.toLowerCase().includes(lowerSearch)) ||
                (p.user?.email && p.user.email.toLowerCase().includes(lowerSearch)) ||
                (p.shippingName && p.shippingName.toLowerCase().includes(lowerSearch)) ||
                (p.shippingPhone && p.shippingPhone.toLowerCase().includes(lowerSearch))
            );
        }

        if (dateRange !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            result = result.filter(p => {
                const pDate = new Date(p.createdAt);
                if (dateRange === 'today') return pDate >= today;
                if (dateRange === 'week') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return pDate >= weekAgo;
                }
                if (dateRange === 'month') {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return pDate >= monthAgo;
                }
                return true;
            });
        }
        return result;
    }, [payments, activeTab, statusFilter, searchTerm, dateRange]);

    const stats = useMemo(() => {
        if (!payments) return { pending: 0, pendingAmount: 0, paid: 0, paidAmount: 0 };
        return payments.reduce((acc, p) => {
            const isPaid = checkIsPaid(p);
            const isRejected = checkIsRejected(p);
            const amt = Number(p.amount) || 0;
            if (!isPaid && !isRejected) {
                acc.pending++;
                acc.pendingAmount += amt;
            } else if (isPaid) {
                acc.paid++;
                acc.paidAmount += amt;
            }
            return acc;
        }, { pending: 0, pendingAmount: 0, paid: 0, paidAmount: 0 });
    }, [payments]);

    const handleExport = () => {
        if (filteredPayments.length === 0) return toast.info('ไม่มีข้อมูลสำหรับการส่งออก');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredPayments, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `payment_report_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success('ส่งออกข้อมูลสำเร็จ');
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 md:px-10 font-['Prompt'] antialiased text-start">
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-20 h-20 rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-2xl flex items-center justify-center text-white"
                        >
                            <FaFileInvoiceDollar size={36} />
                        </motion.div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">การเงิน & สลิป</h1>
                                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-blue-200 shadow-sm animate-pulse">Live</span>
                            </div>
                            <p className="text-slate-500 font-bold flex items-center gap-2">
                                <FaChartLine className="text-blue-500" /> จัดการธุรกรรมและตรวจสอบหลักฐานการโอนเงิน
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <StatCard title="รอตรวจสอบ" count={stats.pending} amount={stats.pendingAmount} colorTheme="rose" />
                        <StatCard title="อนุมัติแล้ว" count={stats.paid} amount={stats.paidAmount} colorTheme="emerald" />
                    </div>
                </div>

                {/* Content Section */}
                {isLoading ? <Loader /> : error ? <Message variant='danger'>{error?.data?.message || error.error}</Message> : (
                    <div className="space-y-8">

                        {/* Control Panel: Filters & Search */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            <div className="xl:col-span-8 space-y-4">

                                {/* Tabs */}
                                <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex items-center">
                                    <div className="flex overflow-x-auto hide-scrollbar scroll-smooth w-full p-1 gap-2">
                                        {tabOptions.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-1 px-2 md:px-4 py-3.5 rounded-2xl text-[12px] md:text-[13px] font-black text-center transition-all duration-500 whitespace-nowrap ${activeTab === tab.id
                                                    ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]'
                                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search & Filters */}
                                <div className="flex flex-col lg:flex-row gap-4">
                                    {/* 1. ช่องค้นหา */}
                                    <div className="relative group flex-1">
                                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="ค้นหา ชื่อ, ออเดอร์ไอดี, เบอร์โทร..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-full bg-white pl-14 pr-6 py-4 rounded-[1.5rem] border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm shadow-sm"
                                        />
                                    </div>

                                    {/* 2. ฟิลเตอร์สถานะและเวลา */}
                                    <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200 outline-none focus:border-blue-500 transition-all font-bold text-sm shadow-sm appearance-none cursor-pointer min-w-[160px]"
                                        >
                                            <option value="all">สถานะทั้งหมด</option>
                                            <option value="pending">รอตรวจสอบ</option>
                                            <option value="paid">ชำระแล้ว</option>
                                            <option value="rejected">ปฏิเสธแล้ว</option>
                                        </select>

                                        <select
                                            value={dateRange}
                                            onChange={(e) => setDateRange(e.target.value)}
                                            className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200 outline-none focus:border-blue-500 transition-all font-bold text-sm shadow-sm appearance-none cursor-pointer min-w-[160px]"
                                        >
                                            <option value="all">ช่วงเวลา: ทั้งหมด</option>
                                            <option value="today">วันนี้</option>
                                            <option value="week">สัปดาห์นี้</option>
                                            <option value="month">เดือนนี้</option>
                                        </select>
                                    </div>

                                    {/* 3. ปุ่มส่งออก */}
                                    <button
                                        onClick={handleExport}
                                        className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-[1.5rem] font-black text-sm hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 shrink-0 whitespace-nowrap"
                                    >
                                        <FaDownload /> ส่งออกข้อมูล
                                    </button>
                                </div>
                            </div>

                            {/* Info Quick Card */}
                            <div className="xl:col-span-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><FaInfoCircle size={120} /></div>
                                <h4 className="text-xl font-black mb-4 flex items-center gap-2 relative z-10">
                                    <FaFilter className="text-blue-400" /> วิธีการประมวลผล
                                </h4>
                                <ul className="space-y-4 text-xs font-bold text-slate-300 relative z-10 leading-relaxed">
                                    <li className="flex items-start gap-4">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">1</span>
                                        ตรวจสอบสลิปว่ายอดเงินและวันเวลาตรงตามที่แจ้ง หรือไม่
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">2</span>
                                        กดปุ่มอนุมัติ (เช็คถูก) เพื่อเข้าสู่ขั้นตอนเตรียมการจัดส่ง
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">3</span>
                                        ระบุเลขพัสดุและบันทึกข้อมูลเพื่อแจ้งเตือนไปยังลูกค้า
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Order Table */}
                        {filteredPayments.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[4rem] py-48 text-center border-2 border-dashed border-slate-100 shadow-inner"
                            >
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <FaSearch size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800">ไม่พบรายการที่คุณต้องการ</h3>
                                <p className="text-slate-400 font-bold mt-2">กรุณาลองปรับเปลี่ยนเงื่อนไขการค้นหาดูอีกครั้ง</p>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/5 text-slate-400 border-b border-slate-100">
                                                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-start">ข้อมูลออเดอร์ (Ticket)</th>
                                                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-start">รายละเอียดการจัดส่ง</th>
                                                <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-center">จัดการรายการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <AnimatePresence>
                                                {filteredPayments.map((item, index) => (
                                                    <PaymentTableRow
                                                        key={`${item._id}-${index}`}
                                                        item={item}
                                                        index={index}
                                                        trackingInput={trackingInputs[item._id] || ''}
                                                        setTrackingInput={handleTrackingInputChange}
                                                        onShowSlip={(slipPath) => { setSelectedSlip(slipPath); setShowSlip(true); }}
                                                        onUpdateStatus={handleUpdateStatus}
                                                        onShipOrder={handleShipOrder}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Slip Modal Preview */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showSlip && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
                            onClick={() => setShowSlip(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2.5rem] p-6 max-w-lg w-full relative shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6 px-3">
                                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">หลักฐานการโอนเงิน (Slip)</h4>
                                    <button
                                        onClick={() => setShowSlip(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-colors border border-slate-200"
                                    >
                                        <FaTimes size={20} />
                                    </button>
                                </div>
                                <img
                                    src={getSlipUrl(selectedSlip)}
                                    className="w-full h-auto rounded-[1.5rem] max-h-[70vh] object-contain shadow-inner border border-slate-100 bg-slate-50"
                                    alt="Slip Preview"
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>, document.body
            )}
        </div>
    );
};

export default AdminPaymentListScreen;