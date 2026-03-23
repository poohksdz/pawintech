import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaTrash, FaEye, FaBoxOpen, FaCalendarAlt, FaMicrochip, 
    FaCheckCircle, FaClock, FaTimesCircle, FaMapMarkerAlt, FaArrowLeft, FaChevronRight 
} from 'react-icons/fa';
import Message from '../../components/Message'; // ตรวจสอบ Path ให้ตรงกับโปรเจกต์พี่
import Loader from '../../components/Loader';

// 🔥 สมมติว่าพี่มี API Slice ชื่อ orderpcbCartApiSlice (เปลี่ยนชื่อ Hook ให้ตรงกับที่พี่สร้างไว้)
import {
    useGetAllOrderPCBCartsQuery,
    useDeleteOrderPCBCartMutation,
} from '../../slices/orderpcbCartApiSlice'; 
import { toast } from 'react-toastify';

const OrderPCBCartScreen = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // ดึงข้อมูลจากฐานข้อมูล
    const { data: cartItems, isLoading, error, refetch } = useGetAllOrderPCBCartsQuery();
    const [deleteCartItem, { isLoading: loadingDelete }] = useDeleteOrderPCBCartMutation();

    const handleDelete = async (id) => {
        try {
            await deleteCartItem(id).unwrap();
            toast.success('ลบรายการเรียบร้อยแล้ว');
            refetch();
            setShowConfirmModal(false);
        } catch (err) {
            toast.error(err?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
        }
    };

    // กรองเฉพาะรายการของ User ที่ Login อยู่
    const myCartItems = cartItems?.data
        ?.filter(item => item.user_id === userInfo?._id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest"><FaCheckCircle/> อนุมัติแล้ว</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black border border-rose-100 uppercase tracking-widest"><FaTimesCircle/> ปฏิเสธ</span>;
            case 'paid':
                return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-widest"><FaCheckCircle/> ชำระเงินแล้ว</span>;
            default:
                return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black border border-amber-100 uppercase tracking-widest"><FaClock/> รอตรวจสอบ</span>;
        }
    };

    if (isLoading) return <Loader />;
    if (error) return <div className="max-w-4xl mx-auto p-10"><Message variant="danger">{error?.data?.message || error.error}</Message></div>;

    if (myCartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center font-prompt text-center px-4">
                <div className="mb-6 bg-slate-50 p-10 rounded-full text-slate-300 shadow-inner">
                    <FaBoxOpen size={80} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">ไม่มีรายการออเดอร์ PCB</h3>
                <Link to="/orderpcb" className="mt-8 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                    สั่งออเดอร์แผ่น PCB <FaChevronRight />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-prompt text-start antialiased">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
                        <FaMicrochip className="text-emerald-600"/> ตะกร้าออเดอร์แผ่น (Order PCB)
                    </h2>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-[0.2em] text-[10px]">Manage your PCB Orders</p>
                </div>
                <Link to="/orderpcb" className="inline-flex items-center gap-2 text-emerald-600 font-black hover:text-emerald-800 transition-colors uppercase text-sm tracking-tighter">
                     <FaArrowLeft /> สั่งทำรายการอื่นเพิ่ม
                </Link>
            </div>

            {/* 💻 DESKTOP VIEW */}
            <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Details</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Qty</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Price</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {myCartItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-8 py-8">
                                    <p className="font-black text-slate-800 text-xl tracking-tighter leading-none mb-2">{item.projectname || 'Untitled Project'}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">ID: {item.id}</span>
                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                            <FaCalendarAlt size={10}/> {new Date(item.created_at).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-center">
                                    {/* 🔥 ดึงข้อมูลจำนวนจาก Database มาแสดงตรงๆ */}
                                    <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                                        <span className="text-xl font-black text-emerald-600 leading-none">{Number(item.pcb_qty)}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Unit</span>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-right">
                                    {item.confirmed_price ? (
                                        <span className="font-black text-slate-800 text-2xl tracking-tighter">
                                            ฿{parseFloat(item.confirmed_price).toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300 italic text-sm font-bold">รอประเมินราคา</span>
                                    )}
                                </td>
                                <td className="px-6 py-8 text-center">{getStatusBadge(item.status)}</td>
                                <td className="px-8 py-8 text-right">
                                    <div className="flex justify-end gap-3">
                                        {item.status === 'accepted' && (
                                            <Link to={`/shipping?type=orderpcb&orderId=${item.id}&amount=${item.confirmed_price}`} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                                                <FaMapMarkerAlt /> Checkout
                                            </Link>
                                        )}
                                        <Link to={`/orderpcb/${item.id}`} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm">
                                            <FaEye size={18} />
                                        </Link>
                                        <button onClick={() => { setDeleteTargetId(item.id); setShowConfirmModal(true); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm">
                                            <FaTrash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 📱 MOBILE VIEW */}
            <div className="grid grid-cols-1 gap-6 md:hidden relative z-10">
                {myCartItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h5 className="font-black text-slate-800 text-xl tracking-tighter leading-tight">{item.projectname || 'Untitled'}</h5>
                                <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-[0.2em]">Project ID: {item.id}</p>
                            </div>
                            {getStatusBadge(item.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="border-r border-slate-200 pr-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                                <p className="text-xl font-black text-slate-800 tracking-tighter">{Number(item.pcb_qty)} <span className="text-xs text-slate-400 ml-1">PCS</span></p>
                            </div>
                            <div className="text-right pl-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Price</p>
                                <p className="text-xl font-black text-emerald-600 tracking-tighter">
                                    {item.confirmed_price ? `฿${parseFloat(item.confirmed_price).toLocaleString()}` : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link to={`/orderpcb/${item.id}`} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center active:scale-95 transition-all">
                                Details
                            </Link>
                            {item.status === 'accepted' && (
                                <Link to={`/shipping?type=orderpcb&orderId=${item.id}&amount=${item.confirmed_price}`} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                                    Checkout
                                </Link>
                            )}
                            <button onClick={() => { setDeleteTargetId(item.id); setShowConfirmModal(true); }} className="w-14 h-14 flex items-center justify-center rounded-2xl border border-rose-100 text-rose-500 active:scale-95 transition-all">
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tailwind Confirm Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl overflow-hidden text-center">
                            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <FaTrash size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase">ลบรายการสั่งทำ?</h3>
                            <p className="text-slate-400 font-bold mb-10 text-sm px-4 uppercase tracking-tighter">ข้อมูลออเดอร์นี้จะถูกลบออกอย่างถาวร</p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95">
                                    ยกเลิก
                                </button>
                                <button onClick={() => handleDelete(deleteTargetId)} className="flex-1 py-5 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95">
                                    ยืนยันการลบ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderPCBCartScreen;