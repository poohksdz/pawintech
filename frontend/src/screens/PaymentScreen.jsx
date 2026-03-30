import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";

import CheckoutSteps from "../components/CheckoutSteps";
import Loader from "../components/Loader";
import { clearCartItems } from "../slices/cartSlice";
import {
  useCreateOrderMutation,
  useUploadPaymentSlipImageMutation,
} from "../slices/ordersApiSlice";

//  นำเข้า API ของ Custom PCB ให้ครบถ้วน
import { useCreateCustomPCBMutation } from "../slices/custompcbApiSlice";
import { useUpdateAmountCustomcartMutation } from "../slices/custompcbCartApiSlice";

import { generateOrderID } from "../utils/generateOrderID";
import {
  FaUniversity,
  FaMoneyBillWave,
  FaFileUpload,
  FaReceipt,
  FaQrcode,
  FaCopy,
  FaTimes,
  FaShieldAlt,
  FaChevronRight,
  FaTags,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";

const SHOP_CONFIG = {
  promptPayID: "0632684099", // เบอร์สำหรับเทสระบบ
  bankName: "ธนาคารกสิกรไทย (KBANK)",
  accName: "บจก. พาวิน เทคโนโลยี",
  accNo: "012-3-45678-9",
};

const PaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  //  1. ระบบแยกประเภท Order จาก URL Parameters
  const searchParams = new URLSearchParams(location.search);
  const orderType = searchParams.get("type") || "product";
  const urlOrderId = searchParams.get("orderId") || "";
  const urlAmount = Number(searchParams.get("amount")) || 0;

  //  เรียกใช้ API Hooks
  const [createOrder, { isLoading: isCreatingProductOrder }] =
    useCreateOrderMutation();
  const [createCustomPCB, { isLoading: isCreatingCustom }] =
    useCreateCustomPCBMutation();
  const [updateAmountCustomcart] = useUpdateAmountCustomcartMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  //  ดึงข้อมูลที่อยู่และวิธีรับของที่เพิ่งเลือกมาจากหน้า Shipping (ใน Redux)
  const { shippingAddress, receivePlace } = cart;
  const { language } = useSelector((state) => state.language);

  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // State
  const [orderID, setOrderID] = useState("");
  const [paymentComfirmID, setPaymentComfirmID] = useState("");
  const [transferedName, setTransferedName] = useState("");
  const [customerName, setCustomerName] = useState(userInfo?.name || "");
  const [image, setImage] = useState("");
  const [qrCodePayload, setQrCodePayload] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [transferedDate, setTransferedDate] = useState(getCurrentDateTime());

  //  กำหนดยอดเงิน
  const transferedAmount =
    orderType === "product" ? cart.totalPrice : urlAmount;

  useEffect(() => {
    if (orderType === "product") {
      if (!cart.cartItems || cart.cartItems.length === 0) {
        navigate("/cart");
        return;
      } else if (!cart.shippingAddress?.address) {
        navigate("/shipping");
        return;
      }
      const tempOrderID = `PWT-${generateOrderID()}`;
      setOrderID(tempOrderID);
      setPaymentComfirmID(tempOrderID);
    } else {
      if (!urlOrderId || urlAmount <= 0) {
        toast.error("ข้อมูลคำสั่งซื้อไม่สมบูรณ์");
        navigate("/");
        return;
      }
      setOrderID(`REQ-${urlOrderId.padStart(5, "0")}`);
      setPaymentComfirmID(urlOrderId);
    }

    // สร้าง QR Code
    const rawAmount = String(transferedAmount).replace(/[^0-9.]/g, "");
    const amountToPay = parseFloat(rawAmount) || 0;
    if (amountToPay > 0) {
      const payload = generatePayload(SHOP_CONFIG.promptPayID, {
        amount: amountToPay,
      });
      setQrCodePayload(payload);
    }
  }, [cart, navigate, orderType, urlOrderId, transferedAmount, urlAmount]);

  const uploadPaymenSlipImageHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await uploadPaymentSlipImage(formData).unwrap();
        setImage(res.image);
        toast.success("อัปโหลดสลิปเรียบร้อย ระบบกำลังรอการยืนยัน");
      } catch (err) {
        toast.error(err?.data?.message || err.error);
        setPreviewUrl(null);
        setImage("");
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error(
        language === "thai"
          ? "กรุณาแนบสลิปโอนเงิน"
          : "Please upload payment slip",
      );
      return;
    }
    if (!transferedName) {
      toast.error(
        language === "thai"
          ? "กรุณาเลือกบัญชีธนาคาร"
          : "Please select a bank account",
      );
      return;
    }

    if (orderType === "product") {
      //  กรณี: สินค้าทั่วไป
      try {
        const cleanedOrderItems = cart.cartItems.map((item) => ({
          name: item.name,
          qty: Number(item.qty),
          image: item.image,
          price: Number(item.price),
          product: item.product,
        }));

        const res = await createOrder({
          orderItems: cleanedOrderItems,
          shippingAddress: cart.shippingAddress,
          billingAddress: cart.billingAddress,
          paymentResult: {
            paymentComfirmID,
            transferedName,
            transferedAmount: Number(transferedAmount),
            transferedDate,
            image,
            status: "COMPLETED",
            email_address: userInfo.email,
          },
          receivePlace: cart.receivePlace,
          itemsPrice: Number(cart.itemsPrice),
          shippingPrice: Number(cart.shippingPrice),
          totalPrice: Number(cart.totalPrice),
        }).unwrap();

        dispatch(clearCartItems());
        navigate(`/order/${res._id}`);
      } catch (err) {
        toast.error(err?.data?.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์");
        setImage("");
        setPreviewUrl(null);
      }
    } else if (orderType === "custom") {
      // ️ กรณี: งานสั่งทำ (Custom PCB) - ส่งข้อมูลที่อยู่ใหม่พ่วงไปด้วย
      try {
        await createCustomPCB({
          orderData: {
            cartId: urlOrderId,
            userId: userInfo?._id,
            userName: customerName,
            userEmail: userInfo?.email,
            transferedAmount,
            transferedDate,
            transferedName,
            paymentSlip: image,

            //  หัวใจสำคัญ: ส่งที่อยู่ที่ "เพิ่งกรอกใหม่" จากหน้า Shipping ไปยัง Backend
            receivePlace: receivePlace || "bysending",
            shippingName: shippingAddress?.shippingname || customerName,
            shippingPhone: shippingAddress?.phone || userInfo?.phone,
            shippingAddress: shippingAddress?.address,
            shippingCity: shippingAddress?.city,
            shippingPostalCode: shippingAddress?.postalCode,
            shippingCountry: shippingAddress?.country,
          },
        }).unwrap();

        // อัปเดตสถานะบิลในตะกร้า
        await updateAmountCustomcart({ id: urlOrderId }).unwrap();

        toast.success("ชำระเงินสำเร็จ แอดมินกำลังตรวจสอบ");
        navigate("/profile");
      } catch (err) {
        toast.error(err?.data?.message || "Error updating payment");
        setImage("");
        setPreviewUrl(null);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกเลขบัญชีแล้ว!");
  };

  const t = {
    en: {
      stepTitle: "Confirm Payment",
      scanQR: "PromptPay QR",
      bankTransfer: "Bank Account",
      amount: "Amount to Transfer",
      date: "Transaction Date",
      customer: "Payer Name",
      upload: "Upload Slip",
      confirm: "Confirm Payment",
      summary: "Payment Info",
      total: "Net Amount",
      selectMethod: "Choose Method",
      scanHint: "Scan to pay exact amount",
      account: "Transfer Account",
    },
    thai: {
      stepTitle: "ยืนยันการชำระเงิน",
      scanQR: "สแกนจ่าย (QR)",
      bankTransfer: "โอนผ่านบัญชี",
      amount: "ยอดเงินที่ต้องโอน",
      date: "วันเวลาที่โอน",
      customer: "ชื่อผู้โอน",
      upload: "แนบหลักฐานการโอน (สลิป)",
      confirm: "ยืนยันการชำระเงิน",
      summary: "สรุปข้อมูลการชำระ",
      total: "ยอดรวมสุทธิ",
      selectMethod: "เลือกวิธีชำระเงิน",
      scanHint: "สแกนเพื่อจ่ายยอดที่ถูกต้อง",
      account: "โอนเข้าบัญชีธนาคาร",
    },
  }[language || "en"];

  const getCategoryName = (type) => {
    switch (type) {
      case "product":
        return {
          name: "สินค้าทั่วไป (Cart)",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "custom":
        return {
          name: "สั่งทำ Custom PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "pcb":
        return {
          name: "ก๊อปปี้ Copy PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "assembly":
        return {
          name: "งานประกอบ (Assembly)",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "orderpcb":
        return {
          name: "ออเดอร์แผ่น PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      default:
        return {
          name: "รายการอื่นๆ",
          color: "text-slate-600",
          bg: "bg-slate-50",
        };
    }
  };
  const categoryInfo = getCategoryName(orderType);
  const isProcessing =
    isCreatingProductOrder || isCreatingCustom || isImageUploading;

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-10 px-4 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        {orderType === "product" && <CheckoutSteps step1 step2 step3 />}

        <h1 className="text-2xl md:text-4xl font-black text-slate-900 text-center mt-6 md:mt-10 mb-6 md:mb-8 tracking-tight uppercase">
          {t.stepTitle}
        </h1>

        <div className="flex justify-center mb-8 md:mb-12 px-2">
          <div
            className={`inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full border border-slate-100 shadow-sm ${categoryInfo.bg}`}
          >
            <FaTags className={categoryInfo.color} size={14} />
            <span
              className={`text-[10px] md:text-sm font-black uppercase tracking-wider ${categoryInfo.color}`}
            >
              ชำระเงินสำหรับ : {categoryInfo.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Payment Methods */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
              <div className="p-2 flex gap-1 bg-slate-50 border-b border-slate-100 relative z-20">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "promptpay" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaQrcode /> {t.scanQR}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "bank" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaUniversity /> {t.bankTransfer}
                </button>
              </div>

              <div className="p-4 md:p-8 text-center">
                <AnimatePresence mode="wait">
                  {paymentMethod === "promptpay" ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl inline-block mb-6 relative">
                        <QRCodeCanvas
                          value={qrCodePayload}
                          size={220}
                          className="rounded-lg"
                        />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900">
                        {Number(transferedAmount).toLocaleString()} ฿
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-2">
                        {t.scanHint}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-start">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            K
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                              Bank Name
                            </p>
                            <p className="font-bold text-slate-800">
                              {SHOP_CONFIG.bankName}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {SHOP_CONFIG.accNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(SHOP_CONFIG.accNo)}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-black rounded-xl transition-all"
                          >
                            <FaCopy />
                          </button>
                        </div>
                        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Account: {SHOP_CONFIG.accName}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white flex justify-between items-center shadow-xl shadow-slate-200">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  หมายเลขอ้างอิงชำระเงิน
                </p>
                <p className="font-mono font-bold text-lg">{orderID}</p>
              </div>
              <FaShieldAlt className="text-black text-2xl" />
            </div>
          </div>

          {/* RIGHT: Confirmation Form */}
          <div className="lg:col-span-7 text-start">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col relative z-10">
              <div className="bg-slate-50/50 px-6 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center gap-3">
                <FaReceipt className="text-black" />{" "}
                <h3 className="font-bold text-slate-800 text-sm md:text-base">
                  {t.summary}
                </h3>
              </div>

              <form
                onSubmit={submitHandler}
                className="p-6 md:p-8 flex-grow flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.customer}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.account}
                    </label>
                    <select
                      value={transferedName}
                      onChange={(e) => setTransferedName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-blue-500 transition-all"
                    >
                      <option value="" disabled>
                        -- เลือกบัญชีธนาคารที่คุณโอนเงินเข้า --
                      </option>
                      <option value="082-0-74742-4 (KTB)">
                        KTB ธ.กรุงไทย - 082-0-74742-4
                      </option>
                      <option value="146-2-90304-4 (SCB)">
                        SCB ธ.ไทยพาณิชย์ - 146-2-90304-4
                      </option>
                      <option value="PromptPay QR">
                        พร้อมเพย์ สแกน QR Code
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.amount}
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-black">
                      {Number(transferedAmount).toLocaleString()} ฿
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.date}
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500">
                      {transferedDate.replace("T", " ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {t.upload} <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`relative group border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${image ? "border-green-400 bg-green-50/30" : "border-slate-200 bg-slate-50/50 hover:border-blue-400"}`}
                  >
                    <input
                      type="file"
                      onChange={uploadPaymenSlipImageHandler}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-2xl shadow-lg border border-white"
                      />
                    ) : (
                      <div className="py-4">
                        <FaFileUpload className="mx-auto text-slate-300 text-4xl mb-4 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm font-bold text-slate-500">
                          คลิกเพื่ออัปโหลดสลิปโอนเงิน
                        </p>
                      </div>
                    )}
                    {isImageUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-30">
                        <Loader size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !image}
                  className="w-full bg-black hover:bg-black/90 disabled:bg-slate-200 text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-auto active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {t.confirm} <FaChevronRight />
                    </>
                  )}
                </button>
                <div className="mt-4 flex justify-center items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <FaShieldAlt className="text-black" /> Secure Payment
                  Processing
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
