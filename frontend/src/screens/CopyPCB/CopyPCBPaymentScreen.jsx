import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";

import CheckoutSteps from "../../components/CheckoutSteps";
import Loader from "../../components/Loader";

import { useUploadPaymentSlipImageMutation } from "../../slices/ordersApiSlice";
import { useCreatecopyPCBMutation } from "../../slices/copypcbApiSlice";
import { useUpdateAmountcopycartMutation } from "../../slices/copypcbCartApiSlice";

import {
  FaUniversity,
  FaFileUpload,
  FaReceipt,
  FaQrcode,
  FaCopy,
  FaShieldAlt,
  FaChevronRight,
  FaTags,
} from "react-icons/fa";

const SHOP_CONFIG = {
  promptPayID: "0992263277",
  bankName: "ธนาคารกสิกรไทย (KBANK)",
  accName: "บจก. พาวิน เทคโนโลยี",
  accNo: "012-3-45678-9",
};

const CopyPCBPaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //  1. ดึงข้อมูลจาก URL อย่างแม่นยำ (รองรับทั้ง Path และ Query)
  const { id: paramId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const queryOrderId = searchParams.get("orderId");
  const orderId = paramId || queryOrderId; // ดึงจากไหนก็ได้ที่มีค่า

  //  2. แปลงยอดเงินให้เป็นตัวเลขที่ถูกต้อง (ตัดลูกน้ำทิ้ง)
  const rawAmount = searchParams.get("amount") || "0";
  const cleanAmount = rawAmount.toString().replace(/[^0-9.]/g, "");
  const urlAmount = Number(cleanAmount) || 0;

  const [createcopyPCB, { isLoading: isCreatingCopy }] =
    useCreatecopyPCBMutation();
  const [updateAmountcopycart] = useUpdateAmountcopycartMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const { shippingAddress, receivePlace } = cart;
  const { language } = useSelector((state) => state.language);

  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [displayOrderID, setDisplayOrderID] = useState("");
  const [transferedName, setTransferedName] = useState("");
  const [customerName, setCustomerName] = useState(userInfo?.name || "");
  const [image, setImage] = useState("");
  const [qrCodePayload, setQrCodePayload] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [transferedDate] = useState(getCurrentDateTime());

  useEffect(() => {
    // แจ้งเตือนหากข้อมูลมาไม่ครบ แต่ไม่เตะออกหน้าเว็บ
    if (!orderId) {
      toast.error("ไม่พบรหัสคำสั่งซื้อ กรุณากลับไปทำรายการใหม่");
    }

    setDisplayOrderID(`REQ-${(orderId || "00000").padStart(5, "0")}`);

    if (urlAmount > 0) {
      // Validation: เช็คจำนวนชุดและจำนวนรายการ (ถ้ามีข้อมูลใน State/URL)
      console.log(`[Validation] Copy PCB OrderID: ${orderId}, Amount: ${urlAmount}`);

      const payload = generatePayload(SHOP_CONFIG.promptPayID, {
        amount: urlAmount,
      });
      setQrCodePayload(payload);
    }
  }, [orderId, urlAmount]);

  const uploadPaymenSlipImageHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await uploadPaymentSlipImage(formData).unwrap();
        const uploadedImagePath =
          res.image || res.url || res.filePath || res.data?.image || res;
        setImage(uploadedImagePath);
        toast.success("อัปโหลดสลิปเรียบร้อย");
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
      toast.error("กรุณาแนบสลิปโอนเงิน");
      return;
    }
    if (!transferedName) {
      toast.error("กรุณาเลือกบัญชีธนาคาร");
      return;
    }
    if (!orderId) {
      toast.error("ไม่สามารถชำระเงินได้เนื่องจากไม่พบรหัสคำสั่งซื้อ");
      return;
    }

    try {
      await createcopyPCB({
        orderData: {
          cartId: orderId,
          userId: userInfo?._id,
          userName: customerName,
          userEmail: userInfo?.email,
          transferedAmount: urlAmount,
          transferedDate,
          transferedName,
          paymentSlip: image,
          receivePlace: receivePlace || "bysending",
          shippingName: shippingAddress?.shippingname || customerName,
          shippingPhone: shippingAddress?.phone || userInfo?.phone,
          shippingAddress: shippingAddress?.address,
          shippingCity: shippingAddress?.city,
          shippingPostalCode: shippingAddress?.postalCode,
          shippingCountry: shippingAddress?.country,
          orderType: "copy",
        },
      }).unwrap();

      await updateAmountcopycart({ id: orderId }).unwrap();

      toast.success("ชำระเงินสำเร็จ แอดมินกำลังตรวจสอบ");
      navigate("/profile?tab=copypcb");
    } catch (err) {
      toast.error(err?.data?.message || "Error updating payment");
      setImage("");
      setPreviewUrl(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกเลขบัญชีแล้ว!");
  };

  const isProcessing = isCreatingCopy || isImageUploading;

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-6 md:py-10 px-4 font-prompt antialiased">
      <div className="max-w-6xl mx-auto text-start">
        <CheckoutSteps
          step1
          step2
          step3
          shippingPath={`/copypcbshipping/${orderId}`}
          paymentPath={`/copypcbpayment/${orderId}`}
        />

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center mt-10 mb-8 tracking-tight uppercase">
          ยืนยันการชำระเงิน
        </h1>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-100 shadow-sm bg-indigo-50">
            <FaTags className="text-indigo-600" size={14} />
            <span className="text-sm font-black uppercase tracking-wider text-indigo-600">
              ชำระเงินสำหรับ : งานก๊อปปี้ Copy PCB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
              <div className="p-2 flex gap-1 bg-slate-50 border-b border-slate-100 relative z-20">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "promptpay" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaQrcode /> สแกนจ่าย (QR)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "bank" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaUniversity /> โอนผ่านบัญชี
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
                      {urlAmount > 0 ? (
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl inline-block mb-6 relative">
                          <QRCodeCanvas
                            value={qrCodePayload}
                            size={220}
                            className="rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="p-4 md:p-8 border-2 border-dashed border-red-200 text-red-400 rounded-3xl mb-6 font-bold">
                          ไม่สามารถสร้าง QR ได้
                          <br />
                          (ไม่พบยอดเงิน)
                        </div>
                      )}
                      <h3 className="text-3xl font-black text-slate-900">
                        {Number(urlAmount).toLocaleString()} ฿
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-2">
                        สแกนเพื่อจ่ายยอดที่ถูกต้อง
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
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 md:p-6 rounded-3xl text-start">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            K
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">
                              Bank Name
                            </p>
                            <p className="font-bold text-slate-800">
                              {SHOP_CONFIG.bankName}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {SHOP_CONFIG.accNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(SHOP_CONFIG.accNo)}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"
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

            <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white flex justify-between items-center shadow-xl shadow-slate-200">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  หมายเลขอ้างอิงชำระเงิน
                </p>
                <p className="font-mono font-bold text-lg">{displayOrderID}</p>
              </div>
              <FaShieldAlt className="text-indigo-500 text-2xl" />
            </div>
          </div>

          <div className="lg:col-span-7 text-start">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col relative z-10">
              <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <FaReceipt className="text-indigo-600" />{" "}
                <h3 className="font-bold text-slate-800">สรุปข้อมูลการชำระ</h3>
              </div>

              <form
                onSubmit={submitHandler}
                className="p-4 md:p-8 flex-grow flex flex-col gap-4 md:gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-start">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      ชื่อผู้โอน
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      โอนเข้าบัญชีธนาคาร
                    </label>
                    <select
                      value={transferedName}
                      onChange={(e) => setTransferedName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 transition-all"
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
                      ยอดเงินที่ต้องโอน
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-indigo-600">
                      {Number(urlAmount).toLocaleString()} ฿
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      วันเวลาที่โอน
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500">
                      {transferedDate.replace("T", " ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    แนบหลักฐานการโอน (สลิป){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`relative group border-2 border-dashed rounded-3xl p-4 md:p-8 text-center transition-all duration-300 ${image ? "border-green-400 bg-green-50/30" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400"}`}
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
                        <FaFileUpload className="mx-auto text-slate-300 text-4xl mb-4 group-hover:text-indigo-500 transition-colors" />
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
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-auto active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      ยืนยันการชำระเงิน <FaChevronRight />
                    </>
                  )}
                </button>
                <div className="mt-4 flex justify-center items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <FaShieldAlt className="text-indigo-500" /> Secure Payment
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

export default CopyPCBPaymentScreen;
