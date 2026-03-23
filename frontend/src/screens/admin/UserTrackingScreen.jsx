import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaFileInvoice, FaCog, FaTruck, FaTimesCircle, FaBoxOpen, FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
const UserTrackingScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ดึงข้อมูล User ที่ล็อกอินอยู่จาก Redux
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchMyOrders = async () => {
            if (!userInfo) return;
            try {
                // เรียกใช้ API ดึงข้อมูลออเดอร์ของตัวเอง (ที่เราทำเตรียมไว้ใน Backend แล้ว)
                const res = await fetch(`/api/custompcbs/user/${userInfo._id}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                const data = await res.json();

                if (data.success) {
                    setOrders(data.data);
                } else {
                    setError('ไม่สามารถดึงข้อมูลออเดอร์ได้');
                }
            } catch (err) {
                setError('การเชื่อมต่อเซิร์ฟเวอร์ขัดข้อง');
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [userInfo]);

    const handleCopyTracking = (trackingNo) => {
        navigator.clipboard.writeText(trackingNo);
        toast.success('คัดลอกเลขพัสดุแล้ว!');
    };

    // ฟังก์ชันเช็คว่าผ่าน Step ไหนมาแล้วบ้าง
    const getStepStatus = (order) => {
        const isRejected = order.status === 'rejected' || order.status === 'Reject';
        const isAccepted = order.status === 'accepted' || order.status === 'Paid';
        const isDelivered = order.isDelivered === 1 || order.isDelivered === true;

        if (isRejected) return 'rejected';
        if (isDelivered) return 'delivered'; // Step 3
        if (isAccepted) return 'accepted';   // Step 2
        return 'pending';                    // Step 1
    };

    if (!userInfo) {
        return <div className="min-h-screen flex items-center justify-center font-['Prompt']">กรุณาล็อกอินเพื่อดูสถานะออเดอร์</div>;
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 md:px-8 font-['Prompt']">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <FaBoxOpen size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">การซื้อของฉัน</h1>
                        <p className="text-slate-500 font-medium text-sm">ติดตามสถานะออเดอร์ Custom PCB ของคุณ</p>
                    </div>
                </div>

                {loading ? <Loader /> : error ? (
                    <div className="p-4 bg-rose-100 text-rose-600 rounded-xl font-bold">{error}</div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl py-20 text-center shadow-sm border border-slate-100">
                        <FaFileInvoice className="mx-auto text-slate-200 mb-4" size={50} />
                        <h2 className="text-xl font-bold text-slate-700">คุณยังไม่มีคำสั่งซื้อ</h2>
                        <Link to="/custompcb" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 transition">
                            เริ่มสั่งทำ PCB เลย
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const currentStatus = getStepStatus(order);

                            return (
                                <div key={order._id} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">

                                    {/* Order Info Header */}
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-8 border-b border-slate-100 pb-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Order ID</p>
                                            <p className="text-lg font-black text-slate-800 font-mono">{order.orderID}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">ยอดสุทธิ</p>
                                            <p className="text-xl font-black text-blue-600">{Number(order.transferedAmount || order.confirmed_price).toLocaleString()} ฿</p>
                                        </div>
                                    </div>

                                    {/* 🔴 กรณีโดนปฏิเสธสลิป */}
                                    {currentStatus === 'rejected' ? (
                                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                                            <FaTimesCircle size={40} className="mx-auto text-rose-500 mb-3" />
                                            <h3 className="text-lg font-bold text-rose-700">สลิปการโอนเงินไม่ถูกต้อง / ถูกปฏิเสธ</h3>
                                            <p className="text-sm text-rose-500 mt-1">กรุณาติดต่อแอดมินผ่านไลน์เพื่อตรวจสอบข้อมูลอีกครั้ง</p>
                                        </div>
                                    ) : (
                                        /* 🟢 Timeline Stepper (Flow Shopee) */
                                        <div className="relative pt-4 pb-2">
                                            {/* เส้น Background (เส้นสีเทา) */}
                                            <div className="absolute top-10 left-[10%] right-[10%] h-1.5 bg-slate-100 rounded-full z-0 hidden md:block"></div>

                                            {/* เส้น Progress (เส้นสีฟ้า) */}
                                            <div
                                                className="absolute top-10 left-[10%] h-1.5 bg-blue-500 rounded-full z-0 transition-all duration-500 hidden md:block"
                                                style={{ width: currentStatus === 'delivered' ? '80%' : currentStatus === 'accepted' ? '40%' : '0%' }}
                                            ></div>

                                            <div className="relative z-10 flex justify-between items-center w-full">

                                                {/* Step 1: รอตรวจสอบสลิป */}
                                                <div className="flex flex-col items-center gap-3 flex-1">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${['pending', 'accepted', 'delivered'].includes(currentStatus) ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}>
                                                        <FaFileInvoice size={20} />
                                                    </div>
                                                    <p className={`text-xs md:text-sm font-bold text-center ${['pending', 'accepted', 'delivered'].includes(currentStatus) ? 'text-slate-800' : 'text-slate-400'}`}>รอตรวจสลิป</p>
                                                </div>

                                                {/* Step 2: กำลังจัดเตรียม */}
                                                <div className="flex flex-col items-center gap-3 flex-1">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${['accepted', 'delivered'].includes(currentStatus) ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                                        <FaCog size={20} className={currentStatus === 'accepted' ? 'animate-spin-slow' : ''} />
                                                    </div>
                                                    <p className={`text-xs md:text-sm font-bold text-center ${['accepted', 'delivered'].includes(currentStatus) ? 'text-slate-800' : 'text-slate-400'}`}>เตรียมสินค้า</p>
                                                </div>

                                                {/* Step 3: จัดส่งแล้ว */}
                                                <div className="flex flex-col items-center gap-3 flex-1">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${currentStatus === 'delivered' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                                        <FaTruck size={20} />
                                                    </div>
                                                    <p className={`text-xs md:text-sm font-bold text-center ${currentStatus === 'delivered' ? 'text-emerald-600' : 'text-slate-400'}`}>จัดส่งสำเร็จ</p>
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                    {/* 📦 โชว์เลขพัสดุเมื่อส่งแล้ว */}
                                    {currentStatus === 'delivered' && order.deliveryID && (
                                        <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                                    <FaTruck size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-600 uppercase">พัสดุของคุณถูกจัดส่งแล้ว</p>
                                                    <p className="text-sm font-medium text-slate-600 mt-0.5">หมายเลขพัสดุ (Tracking No.)</p>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => handleCopyTracking(order.deliveryID)}
                                                className="flex items-center gap-3 bg-white border border-emerald-200 px-5 py-3 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                                            >
                                                <span className="font-mono font-black text-emerald-700 text-lg tracking-wider">{order.deliveryID}</span>
                                                <FaCopy className="text-emerald-400 group-hover:text-emerald-600" />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default UserTrackingScreen;