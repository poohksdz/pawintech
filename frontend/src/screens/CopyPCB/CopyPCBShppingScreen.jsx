import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import CheckoutSteps from "../../components/CheckoutSteps";
import {
  saveShippingAddress,
  saveBillingAddress,
} from "../../slices/cartSlice";
import { useProfileShippingMutation } from "../../slices/usersApiSlice";
import { setCredentials } from "../../slices/authSlice";

import {
  FaTruck,
  FaBuilding,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaInfoCircle,
  FaCheckCircle,
  FaUser,
  FaIdCard,
  FaEdit,
  FaPhone,
  FaChevronRight,
} from "react-icons/fa";

const InputField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  fullWidth = false,
  disabled = false,
  isError = false,
  isTextArea = false,
}) => (
  <div
    id={`field-${id}`}
    className={`flex flex-col gap-1.5 transition-all duration-300 ${fullWidth ? "md:col-span-2" : ""}`}
  >
    <label
      className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isError ? "text-red-500" : "text-slate-400"}`}
    >
      {label} {isError && "*"}
    </label>
    {isTextArea ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className={`w-full border rounded-[1.25rem] px-5 py-4 text-sm transition-all duration-300 outline-none shadow-sm resize-none
                ${disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : isError
              ? "bg-red-50 border-red-500 ring-4 ring-red-500/10"
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:shadow-lg"
          }`}
      />
    ) : (
      <motion.input
        animate={isError ? { x: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.4 }}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border rounded-[1.25rem] px-5 py-4 text-sm transition-all duration-300 outline-none shadow-sm
                ${disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : isError
              ? "bg-red-50 border-red-500 ring-4 ring-red-500/10"
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:shadow-lg"
          }`}
      />
    )}
  </div>
);

const SelectionCard = ({ icon, title, active, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-5 group active:scale-[0.98] ${active
      ? "border-teal-600 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl shadow-teal-900/20 scale-[1.02]"
      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:scale-[1.01]"}`}
  >
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? "bg-white text-teal-600 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-teal-600"
        }`}
    >
      {icon}
    </div>
    <div className="flex flex-grow items-center justify-between">
      <span
        className={`font-black text-sm uppercase tracking-wider transition-colors duration-500 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`}
      >
        {title}
      </span>
      {active && <FaCheckCircle className="text-emerald-400 animate-bounce-slow" />}
    </div>
  </div>
);

const CopyPCBShippingScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  //  ดึง ID จาก Path โดยตรง (เพราะเราส่งมาจากหน้า Cart แบบมี /id)
  const { id: orderId } = useParams();
  const searchParams = new URLSearchParams(location.search);

  const { userInfo } = useSelector((state) => state.auth);

  const [updateProfileShipping] = useProfileShippingMutation();

  const [shippingname, setShippingname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [tax, setTax] = useState("N/A");
  const [companyName, setCompanyName] = useState("");
  const [branch, setBranch] = useState("");
  const [isCompanyOrder, setIsCompanyOrder] = useState(false);

  const [billingName, setBillingName] = useState("");
  const [billinggAddress, setBillinggAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingPhone, setBillingPhone] = useState("");

  const [isReceiveCompleteSelected, setIsReceiveCompleteSelected] =
    useState(false);
  const [addressSource, setAddressSource] = useState("profile");
  const [isBillingCompleteSelected, setIsBillingCompleteSelected] =
    useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userInfo && addressSource === "profile") {
      setShippingname(
        userInfo.shippingAddress?.shippingname || userInfo.name || "",
      );
      setPhone(userInfo.shippingAddress?.phone || userInfo.phone || "");
      setAddress(userInfo.shippingAddress?.address || "");
      setCity(userInfo.shippingAddress?.city || "");
      setPostalCode(userInfo.shippingAddress?.postalCode || "");
      setCountry(userInfo.shippingAddress?.country || "");
    }
  }, [userInfo, addressSource]);

  // Sync Billing Data when user selects "Full Tax Invoice" or "Buy as Company"
  useEffect(() => {
    if (isBillingCompleteSelected && !isCompanyOrder) {
      setBillingName((p) => p || shippingname || userInfo?.name || "");
      setBillingPhone((p) => p || phone || userInfo?.phone || "");
      setBillinggAddress((p) => p || address || "");
      setBillingCity((p) => p || city || "");
      setBillingPostalCode((p) => p || postalCode || "");
      setBillingCountry((p) => p || country || "Thailand");
    }
  }, [isBillingCompleteSelected, isCompanyOrder, shippingname, phone, address, city, postalCode, country, userInfo]);

  const validateAndScroll = () => {
    const newErrors = {};
    if (!isReceiveCompleteSelected && addressSource === "manual") {
      if (!shippingname) newErrors.shippingname = true;
      if (!phone) newErrors.phone = true;
      if (!address) newErrors.address = true;
      if (!city) newErrors.city = true;
      if (!postalCode) newErrors.postalCode = true;
    }
    if (isBillingCompleteSelected) {
      if (!billingName) newErrors.billingName = true;
      // Only require Tax ID if it's a company order
      if (isCompanyOrder && !tax) newErrors.tax = true;
      if (!billingPhone) newErrors.billingPhone = true;
      if (!billinggAddress) newErrors.billinggAddress = true;
      if (!billingCity) newErrors.billingCity = true;
      if (!billingPostalCode) newErrors.billingPostalCode = true;
    }
    setErrors(newErrors);

    const errorFields = Object.keys(newErrors);
    if (errorFields.length > 0) {
      const firstErrorId = `field-${errorFields[0]}`;
      const element = document.getElementById(firstErrorId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน");
      return false;
    }
    return true;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validateAndScroll()) return;

    setIsProcessing(true);

    try {
      const finalShippingAddress = isReceiveCompleteSelected
        ? {
          shippingname: userInfo?.name || "",
          phone: userInfo?.phone || "",
          address: "Pickup at Company",
          city: "Thailand",
          postalCode: "00000",
          country: "TH",
        }
        : addressSource === "profile"
          ? { ...userInfo.shippingAddress }
          : { shippingname, phone, address, city, postalCode, country };

      const finalBillingAddress = isBillingCompleteSelected
        ? {
          billingName: isCompanyOrder ? companyName : shippingname,
          billinggAddress: isCompanyOrder ? billinggAddress : address,
          billingCity: isCompanyOrder ? billingCity : city,
          billingPostalCode: isCompanyOrder ? billingPostalCode : postalCode,
          billingCountry: isCompanyOrder ? billingCountry : country,
          billingPhone: isCompanyOrder ? billingPhone : phone,
          tax: isCompanyOrder ? tax : "N/A",
          branch: isCompanyOrder ? branch : "",
        }
        : {
          billingName: shippingname,
          billinggAddress: address,
          billingCity: city,
          billingPostalCode: postalCode,
          billingCountry: country,
          billingPhone: phone,
          tax: "N/A",
          branch: "",
        };

      dispatch(
        saveShippingAddress({
          ...finalShippingAddress,
          receivePlace: isReceiveCompleteSelected ? "atcompany" : "bysending",
        }),
      );
      dispatch(saveBillingAddress(finalBillingAddress));

      try {
        const res = await updateProfileShipping({
          shippingAddress: finalShippingAddress,
          billingAddress: finalBillingAddress,
        }).unwrap();
        dispatch(setCredentials({ ...userInfo, ...res }));
      } catch (err) {
        console.warn("Skip Profile Update", err);
      }

      const amount = searchParams.get("amount") || 0;

      //  พระเอกอยู่ตรงนี้: ส่ง ID ต่อไปใน URL เลย (เพื่อไม่ให้หน้า Payment เด้งออก)
      if (orderId) {
        navigate(`/copypcbpayment/${orderId}?amount=${amount}`);
      } else {
        toast.error("ข้อผิดพลาด: ไม่พบ ID คำสั่งซื้อ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการประมวลผล");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-6 md:py-10 px-4 font-prompt antialiased">
      <div className="max-w-3xl mx-auto text-start">
        <CheckoutSteps
          step1
          step2
          shippingPath={`/${orderId}`}
          paymentPath={`/${orderId}`}
        />
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center mt-10 mb-8 tracking-tight uppercase">
          การจัดส่ง (Copy PCB)
        </h1>

        <form onSubmit={submitHandler} className="space-y-6">
          <motion.div
            layout
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
              <FaTruck className="text-blue-600" />{" "}
              <h3 className="font-bold text-slate-800">
                เลือกวิธีการรับสินค้า
              </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectionCard
                icon={<FaTruck />}
                title="จัดส่งตามที่อยู่"
                active={!isReceiveCompleteSelected}
                onClick={() => setIsReceiveCompleteSelected(false)}
              />
              <SelectionCard
                icon={<FaBuilding />}
                title="รับสินค้าที่บริษัท"
                active={isReceiveCompleteSelected}
                onClick={() => setIsReceiveCompleteSelected(true)}
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isReceiveCompleteSelected ? (
              <motion.div
                key="sending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-start"
              >
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectionCard
                      icon={<FaIdCard />}
                      title="ใช้ที่อยู่ในโปรไฟล์"
                      active={addressSource === "profile"}
                      onClick={() => setAddressSource("profile")}
                    />
                    <SelectionCard
                      icon={<FaEdit />}
                      title="เพิ่มที่อยู่ใหม่"
                      active={addressSource === "manual"}
                      onClick={() => setAddressSource("manual")}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
                    <FaMapMarkerAlt className="text-rose-500" />{" "}
                    <h3 className="font-bold text-slate-800">ที่อยู่จัดส่ง</h3>
                  </div>
                  <div className="p-4 md:p-8 text-start">
                    {addressSource === "profile" ? (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-6 relative overflow-hidden group text-start">
                        <div className="relative z-10 space-y-3 font-medium text-start">
                          <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                            ที่อยู่ในโปรไฟล์
                          </p>
                          <div className="flex items-center gap-3 text-slate-900 font-bold">
                            <FaUser className="text-blue-400 text-xs" />{" "}
                            {userInfo.shippingAddress?.shippingname ||
                              userInfo.name}
                          </div>
                          <div className="flex items-center gap-3 text-slate-700">
                            <FaPhone className="text-blue-400 text-xs" />{" "}
                            {userInfo.shippingAddress?.phone || userInfo.phone}
                          </div>
                          <div className="flex items-start gap-3 text-slate-500 text-sm leading-relaxed text-start">
                            <FaMapMarkerAlt className="text-blue-400 text-xs mt-1 shrink-0" />
                            {userInfo.shippingAddress?.address
                              ? `${userInfo.shippingAddress.address}, ${userInfo.shippingAddress.city}, ${userInfo.shippingAddress.postalCode}`
                              : "⚠️ No address set in profile"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-start">
                        <InputField
                          id="shippingname"
                          label="ชื่อ-นามสกุล"
                          value={shippingname}
                          onChange={(e) => setShippingname(e.target.value)}
                          isError={errors.shippingname}
                        />
                        <InputField
                          id="phone"
                          label="เบอร์โทรศัพท์"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          isError={errors.phone}
                        />
                        <InputField
                          id="address"
                          label="ที่อยู่"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          isError={errors.address}
                          fullWidth
                        />
                        <InputField
                          id="city"
                          label="จังหวัด/เมือง"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          isError={errors.city}
                        />
                        <InputField
                          id="postalCode"
                          label="รหัสไปรษณีย์"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          isError={errors.postalCode}
                        />
                        <InputField
                          id="country"
                          label="ประเทศ"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pickup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-8 space-y-6 text-start"
              >
                <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl text-sm font-bold animate-pulse text-start">
                  <FaInfoCircle />{" "}
                  กรุณาตรวจสอบชื่อและเบอร์โทรศัพท์สำหรับติดต่อรับสินค้า
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60 text-start">
                  <InputField
                    label="ชื่อ-นามสกุล"
                    value={userInfo.name}
                    disabled
                  />
                  <InputField
                    label="เบอร์โทรศัพท์"
                    value={userInfo.phone || "N/A"}
                    disabled
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
              <FaFileInvoice className="text-emerald-500" />{" "}
              <h3 className="font-bold text-slate-800">ใบกำกับภาษี</h3>
            </div>
            <div className="p-4 md:p-8 space-y-6 text-start">
              {/* Buy as Company Toggle */}
              <div
                onClick={() => {
                  const newState = !isCompanyOrder;
                  setIsCompanyOrder(newState);
                  if (newState) {
                    setIsBillingCompleteSelected(true);
                    if (userInfo?.billingAddress) {
                      setBillingName(userInfo.billingAddress.companyName || "");
                      setTax(userInfo.billingAddress.tax || "");
                      setCompanyName(userInfo.billingAddress.companyName || "");
                      setBranch(userInfo.billingAddress.branch || "");
                      setBillinggAddress(userInfo.billingAddress.address || "");
                      setBillingCity(userInfo.billingAddress.city || "");
                      setBillingPostalCode(userInfo.billingAddress.postalCode || "");
                      setBillingCountry(userInfo.billingAddress.country || "Thailand");
                      setBillingPhone(userInfo.billingAddress.phone || "");
                    }
                  }
                }}
                className={`relative overflow-hidden flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer group shadow-sm active:scale-[0.98] ${isCompanyOrder
                  ? "border-teal-600 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl shadow-teal-900/20"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  }`}
              >
                {/* Subtle Glow Effect for Active State */}
                {isCompanyOrder && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 ${isCompanyOrder ? "bg-white text-teal-600 rotate-3 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-teal-600 shadow-inner"
                    }`}>
                    <FaBuilding size={24} />
                  </div>
                  <div>
                    <p className={`font-black text-base uppercase tracking-wider mb-0.5 transition-colors duration-500 ${isCompanyOrder ? "text-white" : "text-slate-800"}`}>
                      สั่งซื้อในนามนิติบุคคล / บริษัท
                    </p>
                    <p className={`text-[11px] font-medium leading-tight tracking-wide transition-colors duration-500 ${isCompanyOrder ? "text-teal-200" : "text-slate-400 font-bold"}`}>
                      {isCompanyOrder
                        ? "✓ Verified corporate billing data active"
                        : "( Pull company info automatically from your profile )"}
                    </p>
                  </div>
                </div>

                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10 ${isCompanyOrder
                  ? "border-emerald-400 bg-emerald-400 text-slate-900 scale-110 shadow-lg shadow-emerald-500/30"
                  : "border-slate-200 bg-transparent group-hover:border-slate-300 group-hover:scale-105"
                  }`}>
                  {isCompanyOrder ? <FaCheckCircle size={20} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                  icon={<FaFileInvoice />}
                  title="ใบเสร็จรับเงินย่อ"
                  active={!isBillingCompleteSelected}
                  onClick={() => setIsBillingCompleteSelected(false)}
                />
                <SelectionCard
                  icon={<FaBuilding />}
                  title="ใบกำกับภาษีเต็มรูป"
                  active={isBillingCompleteSelected}
                  onClick={() => setIsBillingCompleteSelected(true)}
                />
              </div>
              <AnimatePresence>
                {isBillingCompleteSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pt-6 border-t border-slate-100 space-y-6 overflow-hidden text-start"
                  >
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] pt-2 text-start">
                      ข้อมูลใบกำกับภาษีเต็มรูป
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 text-start">
                      <InputField
                        id="billingName"
                        label="ชื่อ-นามสกุล/บริษัท"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        isError={errors.billingName}
                        fullWidth
                      />
                      <InputField
                        label="เลขประจำตัวผู้เสียภาษี"
                        id="tax"
                        value={tax}
                        onChange={(e) => setTax(e.target.value)}
                        placeholder="Tax ID (13 หลัก)"
                        isError={errors.tax}
                      />
                      <InputField
                        label="สาขา (ถ้ามี)"
                        id="branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="สำนักงานใหญ่ / สาขาที่..."
                      />
                      <InputField
                        id="billingPhone"
                        label="เบอร์โทรศัพท์"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        isError={errors.billingPhone}
                        fullWidth
                      />
                      <InputField
                        id="billinggAddress"
                        label="ที่อยู่"
                        value={billinggAddress}
                        onChange={(e) => setBillinggAddress(e.target.value)}
                        isError={errors.billinggAddress}
                        fullWidth
                        isTextArea
                      />
                      <InputField
                        id="billingCity"
                        label="จังหวัด/เมือง"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        isError={errors.billingCity}
                      />
                      <InputField
                        id="billingPostalCode"
                        label="รหัสไปรษณีย์"
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        isError={errors.billingPostalCode}
                      />
                      <InputField
                        id="billingCountry"
                        label="ประเทศ"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        fullWidth
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-slate-900 hover:bg-black text-white font-black text-lg py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-400 group"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                ดำเนินการชำระเงิน
                <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CopyPCBShippingScreen;
