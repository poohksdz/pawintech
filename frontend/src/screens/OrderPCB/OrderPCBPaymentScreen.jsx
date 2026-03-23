import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { createPortal } from 'react-dom';

import CheckoutSteps from '../../components/CheckoutSteps';
import Loader from "../../components/Loader";

import { useUploadPaymentSlipImageMutation } from '../../slices/ordersApiSlice';
import { useCreateOrderPCBMutation } from '../../slices/orderpcbSlice';
import { savePaymentTransfer, resetPCBCart } from '../../slices/pcbCartSlice';
import { generateOrderID } from '../../utils/generateOrderID';

import {
    FaUniversity, FaFileUpload, FaReceipt,
    FaQrcode, FaCopy, FaShieldAlt, FaChevronRight, FaTags,
    FaCheckCircle, FaTrashAlt, FaExclamationTriangle, FaBoxOpen
} from 'react-icons/fa';

const SHOP_CONFIG = {
    promptPayID: "0632684099",
    bankName: "ธนาคารกสิกรไทย (KBANK)",
    accName: "บจก. พาวิน เทคโนโลยี",
    accNo: "012-3-45678-9"
};

const OrderPCBPaymentScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { id: paramId } = useParams();
    const searchParams = new URLSearchParams(location.search);
    const queryOrderId = searchParams.get('orderId');
    const urlOrderId = paramId || queryOrderId;

    const { userInfo } = useSelector((state) => state.auth);
    const { language } = useSelector((state) => state.language);

    // Get Cart Data
    const pcbcart = JSON.parse(localStorage.getItem('pcbcart')) || {};
    const { pcbOrderDetails, shippingAddress, billingAddress, receivePlace, shippingPrice, totalPrice } = pcbcart;

    const reduxOrders = useMemo(() => Array.isArray(pcbOrderDetails) ? pcbOrderDetails : (pcbOrderDetails ? [pcbOrderDetails] : []), [pcbOrderDetails]);
    const calculatedTotal = useMemo(() => reduxOrders.reduce((acc, item) => acc + Number(item.total_amount_cost || item.price || 0), 0), [reduxOrders]);

    const rawAmount = searchParams.get('amount') || "0";
    const cleanAmount = rawAmount.toString().replace(/[^0-9.]/g, '');
    const urlAmount = Number(cleanAmount) || 0;

    const finalAmount = urlAmount > 0 ? urlAmount : (calculatedTotal > 0 ? calculatedTotal : Number(totalPrice || 0));

    const [createOrderPCB, { isLoading: isCreatingOrder }] = useCreateOrderPCBMutation();
    const [uploadPaymentSlipImage, { isLoading: isImageUploading }] = useUploadPaymentSlipImageMutation();

    const getCurrentDateTime = () => {
        const now = new Date();
        const pad = (n) => n < 10 ? '0' + n : n;
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const [orderID, setOrderID] = useState('');
    const [displayOrderID, setDisplayOrderID] = useState('');
    const [transferedName, setTransferedName] = useState('');
    const [customerName, setCustomerName] = useState(userInfo?.name || '');
    const [image, setImage] = useState("");
    const [qrCodePayload, setQrCodePayload] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('promptpay');
    const [transferedDate] = useState(getCurrentDateTime());
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (!pcbOrderDetails || reduxOrders.length === 0) {
            navigate('/cart/pcbcart');
        } else {
            const firstItem = reduxOrders[0];
            const tempOrderID = firstItem?.id || firstItem?.orderID || urlOrderId || generateOrderID();
            setOrderID(tempOrderID);
            setDisplayOrderID(`REQ-${String(tempOrderID).slice(-5)}`);
        }

        if (finalAmount > 0) {
            const payload = generatePayload(SHOP_CONFIG.promptPayID, { amount: finalAmount });
            setQrCodePayload(payload);
        }
    }, [navigate, pcbOrderDetails, urlOrderId, finalAmount, reduxOrders]);

    const uploadPaymenSlipImageHandler = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            const formData = new FormData();
            formData.append("image", file);

            try {
                const res = await uploadPaymentSlipImage(formData).unwrap();
                let uploadedImagePath = res.image || res.path || res.url || res.filePath || res.data?.image || res;
                if (typeof uploadedImagePath !== 'string') {
                    uploadedImagePath = String(uploadedImagePath);
                }
                setImage(uploadedImagePath);
                toast.success(language === 'thai' ? 'อัปโหลดสลิปเรียบร้อย' : 'Slip uploaded successfully');
            } catch (err) {
                toast.error(err?.data?.message || err.error || 'Upload failed');
                setPreviewUrl(null);
                setImage("");
            }
        }
    };

    const submitHandler = async (e) => {
        if (e) e.preventDefault();

        if (!image) return toast.warning(language === 'thai' ? 'กรุณาอัปโหลดสลิปให้เสร็จสมบูรณ์' : 'Please upload slip');
        if (!transferedName) return toast.warning(language === 'thai' ? 'กรุณาเลือกบัญชีธนาคาร' : 'Please select bank');
        if (!orderID) return toast.error(language === 'thai' ? 'ไม่พบรหัสคำสั่งซื้อ' : 'Order ID not found');

        const mysqlFormattedDate = transferedDate.replace('T', ' ') + ':00';

        dispatch(savePaymentTransfer({
            orderID,
            paymentComfirmID: orderID,
            transferedAmount: finalAmount,
            transferedName,
            transferedDate: mysqlFormattedDate,
            image
        }));

        try {
            await createOrderPCB({
                orderItems: reduxOrders,
                useId: userInfo?._id,
                userName: customerName,
                shippingAddress,
                billingAddress,
                paymentResult: {
                    orderID,
                    paymentComfirmID: orderID,
                    transferedAmount: finalAmount,
                    transferedDate: mysqlFormattedDate,
                    transferedName,
                    image
                },
                receivePlace: receivePlace || 'bysending',
                itemsPrice: calculatedTotal,
                shippingPrice: shippingPrice || 0,
                totalPrice: finalAmount
            }).unwrap();

            dispatch(resetPCBCart());
            toast.success(language === 'thai' ? 'ชำระเงินสำเร็จ แอดมินกำลังตรวจสอบ' : 'Payment successful, waiting for review');
            navigate('/profile?tab=pcb');
        } catch (err) {
            console.error("💥 Error:", err);
            const errorMsg = err?.data?.message || err?.error || "Error saving order";
            toast.error(`Error: ${errorMsg}`);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success(language === 'thai' ? 'คัดลอกเลขบัญชีแล้ว!' : 'Account number copied!');
    };

    const isProcessing = isCreatingOrder || isImageUploading;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen py-12 px-4 font-prompt antialiased">
            <div className="max-w-7xl mx-auto text-start">
                <CheckoutSteps
                    step1 step2 step3
                    shippingPath={`/pcbshipping`}
                    paymentPath={`/pcbpayment`}
                />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 mb-12 text-center"
                >
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase mb-4">
                        {language === 'thai' ? 'ยืนยันการชำระเงิน' : 'Confirm Payment'}
                    </h1>
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                        <FaTags size={14} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                            {language === 'thai' ? 'สั่งผลิตแผ่นปริ้นท์ (Standard PCB)' : 'Standard PCB Manufacturing'}
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                    {/* 🔴 Left: QR & Bank Details */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                            <div className="p-3 flex gap-2 bg-slate-50/50 border-b border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('promptpay')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'promptpay' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <FaQrcode /> {language === 'thai' ? 'สแกนจ่าย (QR)' : 'Scan & Pay (QR)'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'bank' ? 'bg-white text-emerald-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <FaUniversity /> {language === 'thai' ? 'โอนผ่านบัญชี' : 'Bank Transfer'}
                                </button>
                            </div>

                            <div className="p-10 text-center">
                                <AnimatePresence mode="wait">
                                    {paymentMethod === 'promptpay' ? (
                                        <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                            {finalAmount > 0 ? (
                                                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-2xl inline-block mb-8 relative group transition-transform hover:scale-[1.02]">
                                                    <QRCodeCanvas value={qrCodePayload} size={240} className="rounded-xl" />
                                                </div>
                                            ) : (
                                                <div className="p-16 border-2 border-dashed border-rose-200 text-rose-400 rounded-[2.5rem] mb-8 font-black uppercase tracking-widest flex flex-col items-center gap-4">
                                                    <FaExclamationTriangle size={48} />
                                                    {language === 'thai' ? 'ไม่พบยอดเงิน' : 'Amount Not Found'}
                                                </div>
                                            )}
                                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                                                {Number(finalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
                                            </h3>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-3">
                                                {language === 'thai' ? 'สแกนเพื่อจ่ายยอดที่ถูกต้อง' : 'Scan to pay exact amount'}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2.5rem] text-start">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-200">K</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{language === 'thai' ? 'ชื่อธนาคาร' : 'Bank Name'}</p>
                                                        <p className="font-black text-xl text-slate-900">{SHOP_CONFIG.bankName}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl flex items-center justify-between border border-emerald-100 shadow-sm">
                                                    <span className="text-2xl font-black text-slate-900 font-mono tracking-wider">{SHOP_CONFIG.accNo}</span>
                                                    <button type="button" onClick={() => copyToClipboard(SHOP_CONFIG.accNo)} className="w-12 h-12 bg-slate-50 text-slate-300 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-inner"><FaCopy /></button>
                                                </div>
                                                <div className="mt-6 flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'thai' ? 'ชื่อบัญชี' : 'Account Name'}</span>
                                                    <span className="font-bold text-slate-800 text-lg">{SHOP_CONFIG.accName}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl shadow-slate-300 border border-slate-800">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{language === 'thai' ? 'รหัสอ้างอิง' : 'Order Reference'}</p>
                                <p className="font-mono font-black text-2xl tracking-tight text-blue-400 uppercase">{orderID || displayOrderID}</p>
                            </div>
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                <FaShieldAlt size={28} />
                            </div>
                        </div>
                    </motion.div>

                    {/* 🔵 Right: Form & Summary */}
                    <motion.div variants={itemVariants} className="lg:col-span-7 space-y-8">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                            <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner font-black uppercase text-[10px]">
                                        <FaReceipt />
                                    </div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest">{language === 'thai' ? 'ข้อมูลการชำระเงิน' : 'Payment Details'}</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm uppercase tracking-widest">
                                    {reduxOrders.length} {language === 'thai' ? 'รายการในคำสั่งซื้อ' : 'Items'}
                                </span>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'thai' ? 'ชื่อผู้โอน' : 'Transfered By'}</label>
                                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500/20 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all shadow-inner" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'thai' ? 'ธนาคารต้นทาง' : 'From Bank Account'}</label>
                                        <div className="relative">
                                            <select
                                                value={transferedName}
                                                onChange={(e) => setTransferedName(e.target.value)}
                                                required
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none appearance-none cursor-pointer focus:border-blue-500/20 transition-all shadow-inner pt-7"
                                            >
                                                <option value="" disabled>{language === 'thai' ? '-- เลือกธนาคารของคุณ --' : '-- Choose your bank --'}</option>
                                                <option value="Kasikorn Bank (KBANK)">Kasikorn Bank (KBANK)</option>
                                                <option value="Siam Commercial Bank (SCB)">Siam Commercial Bank (SCB)</option>
                                                <option value="Bangkok Bank (BBL)">Bangkok Bank (BBL)</option>
                                                <option value="Krung Thai Bank (KTB)">Krung Thai Bank (KTB)</option>
                                                <option value="PromptPay / Other">PromptPay / Other</option>
                                            </select>
                                            <div className="absolute top-4 left-6 text-[10px] font-black text-blue-500 uppercase tracking-widest pointer-events-none">{language === 'thai' ? 'เลือกธนาคาร' : 'Select Bank'}</div>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <FaChevronRight size={10} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'thai' ? 'ยอดที่ต้องโอน' : 'Amount Due'}</label>
                                        <div className="w-full bg-blue-50/50 border-2 border-blue-100 text-blue-600 rounded-2xl px-6 py-4 text-xl font-black shadow-inner flex items-baseline gap-1">
                                            {Number(finalAmount).toLocaleString()} <span className="text-xs uppercase">THB</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'thai' ? 'วันเวลาปัจจุบัน' : 'Current Time'}</label>
                                        <div className="w-full bg-white border-2 border-slate-50 text-slate-400 rounded-2xl px-6 py-4 text-sm font-black shadow-inner">
                                            {transferedDate.replace('T', ' ')}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'thai' ? 'หลักฐานการโอน (สลิป)' : 'Upload Payment Slip'} <span className="text-rose-500">*</span></label>
                                    <div className={`relative group border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 overflow-hidden ${image ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-white'}`}>
                                        <input type="file" onChange={uploadPaymenSlipImageHandler} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        {previewUrl ? (
                                            <div className="relative inline-block">
                                                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-3xl shadow-2xl border-4 border-white transform transition-transform group-hover:scale-[1.02]" />
                                                <div className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                    <FaCheckCircle />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-6 flex flex-col items-center gap-5">
                                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 group-hover:text-blue-500 group-hover:scale-110 group-hover:shadow-xl transition-all shadow-sm">
                                                    <FaFileUpload size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{language === 'thai' ? 'คลิกเพื่ออัปโหลด' : 'Click to Upload Slip'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'thai' ? 'รองรับ JPG, PNG, WEBP' : 'Supports JPG, PNG, WEBP'}</p>
                                                </div>
                                            </div>
                                        )}
                                        {isImageUploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl z-30"><Loader /></div>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing || !image || finalAmount <= 0}
                                    className={`w-full py-6 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] 
                                        ${!image || finalAmount <= 0 ? 'bg-slate-100 text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}
                                    `}
                                >
                                    {isCreatingOrder ? <Loader /> : <> {language === 'thai' ? 'ยืนยันการชำระเงิน' : 'Complete Payment'} <FaChevronRight size={14} /> </>}
                                </button>

                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">
                                        <FaShieldAlt className="text-blue-500" /> Fully Encrypted & Secure
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Confirm Payment Modal */}
            {showConfirmModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden" style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}>
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    </AnimatePresence>
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-sm p-12 text-center border border-white/20 font-prompt z-10">
                        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-100/50">
                            <FaShieldAlt size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">
                            {language === 'thai' ? 'ยืนยัน?"' : 'Confirm Order?'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">
                            {language === 'thai' ? 'กรุณาตรวจสอบข้อมูลและสลิปให้ถูกต้องก่อนกดยืนยัน' : 'Please ensure all payment details and the slip are correct before confirming.'}
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-2xl border-none">
                                {language === 'thai' ? 'ยกเลิก' : 'Cancel'}
                            </button>
                            <button onClick={submitHandler} disabled={isCreatingOrder} className="flex-1 py-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 rounded-2xl border-none">
                                {isCreatingOrder ? <Loader size="xs" /> : (language === 'thai' ? 'ยืนยัน' : 'Confirm')}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderPCBPaymentScreen;