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

//  นำเข้า API ของ Custom PCB
import { useUpdateCustomShippingRatesMutation } from "../../slices/custompcbCartApiSlice";

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

// --- 1. InputField Component ---
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
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:shadow-lg"
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
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:shadow-lg"
          }`}
      />
    )}
  </div>
);

// --- 2. SelectionCard Component ---
const SelectionCard = ({ icon, title, active, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-5 group active:scale-[0.98] ${active
      ? "border-blue-600 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white shadow-xl shadow-blue-900/20 scale-[1.02]"
      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:scale-[1.01]"}`}
  >
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? "bg-white text-blue-600 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-600"
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

const CustomPCBShippingScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  //  รับค่า ID ทั้งจาก Path และ Query Parameter
  const { id: paramId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const queryOrderId = searchParams.get("orderId");
  const orderId = paramId || queryOrderId;

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [updateProfileShipping] = useProfileShippingMutation();
  const [updateCustomShippingRates] = useUpdateCustomShippingRatesMutation();

  // --- Form States ---
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

  // --- UI Logic States ---
  const [isReceiveCompleteSelected, setIsReceiveCompleteSelected] =
    useState(false);
  const [addressSource, setAddressSource] = useState("profile");
  const [isBillingCompleteSelected, setIsBillingCompleteSelected] =
    useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync Profile Data
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

  const t = {
    en: {
      stepTitle: "Shipping & Billing (Custom PCB)",
      receiveMethod: "Delivery Method",
      addressSource: "Address Selection",
      useProfile: "Use Profile Address",
      useCustom: "Add New Address",
      shippingDetails: "Shipping Address",
      billingDetails: "Billing & Tax Invoice",
      continueLbl: "Proceed to Payment",
      nameLabel: "Full Name",
      phoneLabel: "Phone Number",
      addressLabel: "Address",
      cityLabel: "City",
      postalCodeLabel: "Postal Code",
      countryLabel: "Country",
      TaxLabel: "Tax ID",
      sendOption: "Ship to Address",
      pickupOption: "Pick up at Company",
      pickupInfo: "Verify your contact info for pickup.",
      fillBilling: "Tax Invoice Details",
      profileAddrTitle: "Profile Address",
      errFillAll: "Please fill in all required fields",
      phName: "e.g. John Doe",
      phPhone: "e.g. 0812345678",
      phAddr: "123/4 Moo 5, Sukhumvit Rd...",
      phCity: "e.g. Bangkok",
      phZip: "10xxx",
      phCountry: "Thailand",
      phTax: "13-digit identification number",
      receiptShort: "Short Receipt",
      receiptFull: "Full Tax Invoice",
      noAddress: "No address set in profile",
      orderIdNotFound: "Error: Order ID not found",
      processingError: "An error occurred during processing",
    },
    thai: {
      stepTitle: "การจัดส่ง (Custom PCB)",
      receiveMethod: "เลือกวิธีการรับสินค้า",
      addressSource: "เลือกที่อยู่จัดส่ง",
      useProfile: "ใช้ที่อยู่ในโปรไฟล์",
      useCustom: "เพิ่มที่อยู่ใหม่",
      shippingDetails: "ที่อยู่จัดส่ง",
      billingDetails: "ใบกำกับภาษี",
      continueLbl: "ดำเนินการชำระเงิน",
      nameLabel: "ชื่อ-นามสกุล",
      phoneLabel: "เบอร์โทรศัพท์",
      addressLabel: "ที่อยู่",
      cityLabel: "จังหวัด/เมือง",
      postalCodeLabel: "รหัสไปรษณีย์",
      countryLabel: "ประเทศ",
      TaxLabel: "เลขประจำตัวผู้เสียภาษี",
      sendOption: "จัดส่งตามที่อยู่",
      pickupOption: "รับสินค้าที่บริษัท",
      pickupInfo: "กรุณาตรวจสอบชื่อและเบอร์โทรศัพท์สำหรับติดต่อรับสินค้า",
      fillBilling: "ข้อมูลใบกำกับภาษีเต็มรูป",
      profileAddrTitle: "ที่อยู่ในโปรไฟล์",
      errFillAll: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
      phName: "เช่น สมชาย ใจดี",
      phPhone: "เช่น 0812345678",
      phAddr: "123/4 หมู่ 5 ซอยสุขุมวิท...",
      phCity: "เช่น กรุงเทพฯ",
      phZip: "10xxx",
      phCountry: "ประเทศไทย",
      phTax: "เลขประจำตัวผู้เสียภาษี 13 หลัก",
      receiptShort: "ใบเสร็จรับเงินย่อ",
      receiptFull: "ใบกำกับภาษีเต็มรูป",
      noAddress: "ไม่พบที่อยู่ในโปรไฟล์",
      orderIdNotFound: "ข้อผิดพลาด: ไม่พบ ID คำสั่งซื้อ",
      processingError: "เกิดข้อผิดพลาดในการประมวลผล",
    },
  }[language || "en"];

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
      toast.error(t.errFillAll);
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
          address: "รับที่บริษัท",
          city: "ปทุมวัน",
          postalCode: "10400",
          country: "TH",
          receivePlace: "atcompany",
        }
        : addressSource === "profile"
          ? { ...userInfo.shippingAddress, receivePlace: "bysending" }
          : {
            shippingname,
            phone,
            address,
            city,
            postalCode,
            country,
            receivePlace: "bysending",
          };

      const finalBillingAddress = isBillingCompleteSelected
        ? {
          billingName: isCompanyOrder ? companyName : billingName,
          billinggAddress: isCompanyOrder ? billinggAddress : billinggAddress,
          billingCity: isCompanyOrder ? billingCity : billingCity,
          billingPostalCode: isCompanyOrder ? billingPostalCode : billingPostalCode,
          billingCountry: isCompanyOrder ? billingCountry : billingCountry,
          billingPhone: isCompanyOrder ? billingPhone : billingPhone,
          tax: isCompanyOrder ? tax : "N/A",
          branch: isCompanyOrder ? branch : "",
        }
        : {
          billingName: finalShippingAddress.shippingname,
          billinggAddress: finalShippingAddress.address,
          billingCity: finalShippingAddress.city,
          billingPostalCode: finalShippingAddress.postalCode,
          billingCountry: finalShippingAddress.country,
          billingPhone: finalShippingAddress.phone,
          tax: "N/A",
          branch: "",
        };

      // 1. อัปเดตลง Redux Cart
      dispatch(saveShippingAddress(finalShippingAddress));
      dispatch(saveBillingAddress(finalBillingAddress));

      // 2. อัปเดต Profile พื้นฐาน
      try {
        const res = await updateProfileShipping({
          shippingAddress: finalShippingAddress,
          billingAddress: finalBillingAddress,
        }).unwrap();
        dispatch(setCredentials({ ...userInfo, ...res }));
      } catch (err) {
        console.warn("Skip Profile Update", err);
      }

      // 3.  อัปเดตเข้าฐานข้อมูลของ Custom PCB โดยตรง
      if (orderId) {
        await updateCustomShippingRates({
          orderId: orderId,
          rateData: {
            userName: userInfo.name,
            userEmail: userInfo.email,
            shippingaddress: finalShippingAddress,
            billingaddress: finalBillingAddress,
          },
        }).unwrap();
      }

      const amount = searchParams.get("amount") || 0;

      // 4. ไปหน้า Payment
      if (orderId) {
        navigate(`/custompcbpayment/${orderId}?amount=${amount}`);
      } else {
        toast.error(t.orderIdNotFound);
      }
    } catch (error) {
      toast.error(error?.data?.message || t.processingError);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-6 md:py-10 px-4 font-prompt antialiased">
      <div className="max-w-3xl mx-auto text-start">
        {/*  ใช้ Dynamic Path สำหรับ Custom PCB */}
        <CheckoutSteps
          step1
          step2
          shippingPath={`/${orderId}`}
          paymentPath={`/${orderId}`}
        />

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center mt-10 mb-8 tracking-tight uppercase">
          {t.stepTitle}
        </h1>

        <form onSubmit={submitHandler} className="space-y-6">
          <motion.div
            layout
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
              <FaTruck className="text-blue-600" />{" "}
              <h3 className="font-bold text-slate-800">{t.receiveMethod}</h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectionCard
                icon={<FaTruck />}
                title={t.sendOption}
                active={!isReceiveCompleteSelected}
                onClick={() => setIsReceiveCompleteSelected(false)}
              />
              <SelectionCard
                icon={<FaBuilding />}
                title={t.pickupOption}
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
                      title={t.useProfile}
                      active={addressSource === "profile"}
                      onClick={() => setAddressSource("profile")}
                    />
                    <SelectionCard
                      icon={<FaEdit />}
                      title={t.useCustom}
                      active={addressSource === "manual"}
                      onClick={() => setAddressSource("manual")}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
                    <FaMapMarkerAlt className="text-rose-500" />{" "}
                    <h3 className="font-bold text-slate-800">
                      {t.shippingDetails}
                    </h3>
                  </div>
                  <div className="p-4 md:p-8 text-start">
                    {addressSource === "profile" ? (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-6 relative overflow-hidden group text-start">
                        <div className="relative z-10 space-y-3 font-medium text-start">
                          <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                            {t.profileAddrTitle}
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
                              : `⚠️ ${t.noAddress}`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-start">
                        <InputField
                          id="shippingname"
                          label={t.nameLabel}
                          value={shippingname}
                          onChange={(e) => setShippingname(e.target.value)}
                          placeholder={t.phName}
                          isError={errors.shippingname}
                        />
                        <InputField
                          id="phone"
                          label={t.phoneLabel}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.phPhone}
                          isError={errors.phone}
                        />
                        <InputField
                          id="address"
                          label={t.addressLabel}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t.phAddr}
                          isError={errors.address}
                          fullWidth
                        />
                        <InputField
                          id="city"
                          label={t.cityLabel}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={t.phCity}
                          isError={errors.city}
                        />
                        <InputField
                          id="postalCode"
                          label={t.postalCodeLabel}
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder={t.phZip}
                          isError={errors.postalCode}
                        />
                        <InputField
                          id="country"
                          label={t.countryLabel}
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder={t.phCountry}
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
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-sm font-bold animate-pulse text-start">
                  <FaInfoCircle /> {t.pickupInfo}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60 text-start">
                  <InputField
                    label={t.nameLabel}
                    value={userInfo.name}
                    disabled
                  />
                  <InputField
                    label={t.phoneLabel}
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
              <h3 className="font-bold text-slate-800">{t.billingDetails}</h3>
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
                  ? "border-blue-600 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white shadow-xl shadow-blue-900/20"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  }`}
              >
                {/* Subtle Glow Effect for Active State */}
                {isCompanyOrder && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 ${isCompanyOrder ? "bg-white text-blue-600 rotate-3 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-600 shadow-inner"
                    }`}>
                    <FaBuilding size={24} />
                  </div>
                  <div>
                    <p className={`font-black text-base uppercase tracking-wider mb-0.5 transition-colors duration-500 ${isCompanyOrder ? "text-white" : "text-slate-800"}`}>
                      สั่งซื้อในนามนิติบุคคล / บริษัท
                    </p>
                    <p className={`text-[11px] font-medium leading-tight tracking-wide transition-colors duration-500 ${isCompanyOrder ? "text-blue-200" : "text-slate-400 font-bold"}`}>
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
                  title={t.receiptShort}
                  active={!isBillingCompleteSelected}
                  onClick={() => setIsBillingCompleteSelected(false)}
                />
                <SelectionCard
                  icon={<FaBuilding />}
                  title={t.receiptFull}
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
                      {t.fillBilling}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 text-start">
                      <InputField
                        id="billingName"
                        label={t.nameLabel}
                        value={isCompanyOrder ? companyName : billingName}
                        onChange={(e) => isCompanyOrder ? setCompanyName(e.target.value) : setBillingName(e.target.value)}
                        placeholder={t.phName}
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
                        label={t.phoneLabel}
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        placeholder={t.phPhone}
                        isError={errors.billingPhone}
                        fullWidth
                      />
                      <InputField
                        id="billinggAddress"
                        label={t.addressLabel}
                        value={billinggAddress}
                        onChange={(e) => setBillinggAddress(e.target.value)}
                        placeholder={t.phAddr}
                        isError={errors.billinggAddress}
                        fullWidth
                        isTextArea
                      />
                      <InputField
                        id="billingCity"
                        label={t.cityLabel}
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder={t.phCity}
                        isError={errors.billingCity}
                      />
                      <InputField
                        id="postalCode"
                        label={t.postalCodeLabel}
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        placeholder={t.phZip}
                        isError={errors.billingPostalCode}
                      />
                      <InputField
                        id="billingCountry"
                        label={t.countryLabel}
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        placeholder={t.phCountry}
                        isError={errors.billingCountry}
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
                {t.continueLbl}
                <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomPCBShippingScreen;
