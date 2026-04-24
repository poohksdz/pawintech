import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import CheckoutSteps from "../components/CheckoutSteps";
import {
  saveShippingAddress,
  saveBillingAddress,
  updateCartPrice,
} from "../slices/cartSlice";
import { useProfileShippingMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import { useGetTransportationPriceQuery } from "../slices/ordersApiSlice";
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
} from "react-icons/fa";

//  1. InputField (Stable Component - รับค่าช่อง Input เมื่อได้ Focus)
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
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-black/5 focus:border-black focus:shadow-lg"
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
              : "bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-black/5 focus:border-black focus:shadow-lg"
          }`}
      />
    )}
  </div>
);

//  2. SelectionCard
const SelectionCard = ({ icon, title, active, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-5 group active:scale-[0.98] ${active
      ? "border-black bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]"
      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:scale-[1.01]"}`}
  >
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? "bg-white text-black shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-black"
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

const ShippingScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); //  ใช้ useLocation เพื่อดึง Parameter จาก URL
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  const cart = useSelector((state) => state.cart);

  const [updateProfileShipping] = useProfileShippingMutation();
  const { data: transportationPrice } = useGetTransportationPriceQuery();

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

  //  Sync Profile Data
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
      // For personal billing, fill from shipping if blank
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
      stepTitle: "Shipping & Billing",
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
    },
    thai: {
      stepTitle: "การจัดส่งและใบกำกับภาษี",
      receiveMethod: "เลือกวิธีรับสินค้า",
      addressSource: "เลือกที่อยู่จัดส่ง",
      useProfile: "ใช้ที่อยู่จากโปรไฟล์",
      useCustom: "เพิ่มที่อยู่ใหม่",
      shippingDetails: "ที่อยู่จัดส่ง",
      billingDetails: "ใบกำกับภาษี",
      continueLbl: "ดำเนินการชำระเงิน",
      nameLabel: "ชื่อ-นามสกุล",
      phoneLabel: "เบอร์โทรศัพท์",
      addressLabel: "ที่อยู่",
      cityLabel: "จังหวัด/เขต",
      postalCodeLabel: "รหัสไปรษณีย์",
      countryLabel: "ประเทศ",
      TaxLabel: "เลขประจำตัวผู้เสียภาษี",
      sendOption: "จัดส่งตามที่อยู่",
      pickupOption: "รับที่บริษัท",
      pickupInfo: "กรุณาตรวจสอบชื่อและเบอร์โทรศัพท์สำหรับรับสินค้าที่บริษัท",
      fillBilling: "ข้อมูลใบกำกับภาษี",
      profileAddrTitle: "ที่อยู่ในโปรไฟล์",
      errFillAll: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
      phName: "เช่น สมชาย ทองหลาง",
      phPhone: "เช่น 0812345678",
      phAddr: "123/4 หมู่ 5 ถนนสุขุมวิท...",
      phCity: "เช่น กรุงเทพฯ",
      phZip: "10xxx",
      phCountry: "ประเทศไทย",
      phTax: "เลขประจำตัวผู้เสียภาษี 13 หลัก",
    },
  }[language || "en"];

  //  ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลและเลื่อนหน้าจอ
  const validateAndScroll = () => {
    const newErrors = {};
    if (!isReceiveCompleteSelected) {
      // ตรวจสอบที่อยู่จัดส่ง (ไม่ว่าจะเป็น profile หรือ manual)
      if (addressSource === "profile") {
        // ถ้าใช้ที่อยู่จากโปรไฟล์ ต้องตรวจสอบว่ามีข้อมูลครบ
        if (!userInfo?.shippingAddress?.address && !userInfo?.address) {
          newErrors.profileAddress = true;
        }
      } else {
        // ถ้าใส่ที่อยู่เอง ต้องกรอกให้ครบทุกช่อง
        if (!shippingname) newErrors.shippingname = true;
        if (!phone) newErrors.phone = true;
        if (!address) newErrors.address = true;
        if (!city) newErrors.city = true;
        if (!postalCode) newErrors.postalCode = true;
      }
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
          shippingname: userInfo.name,
          phone: userInfo.phone || "",
          address: "รับที่บริษัท",
          city: "ปทุมวัน",
          postalCode: "10400",
          country: "TH",
        }
        : addressSource === "profile"
          ? {
            shippingname: userInfo.shippingAddress?.shippingname || userInfo.name,
            phone: userInfo.shippingAddress?.phone || userInfo.phone,
            address: userInfo.shippingAddress?.address || "",
            city: userInfo.shippingAddress?.city || "",
            postalCode: userInfo.shippingAddress?.postalCode || "",
            country: userInfo.shippingAddress?.country || "",
          }
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

      // 1. บันทึกข้อมูลที่อยู่จัดส่งลงใน Cart (Redux)
      dispatch(
        saveShippingAddress({
          ...finalShippingAddress,
          receivePlace: isReceiveCompleteSelected ? "atcompany" : "bysending",
        }),
      );
      dispatch(saveBillingAddress(finalBillingAddress));

      // 2. อัพเดทราคาสินค้าและค่าจัดส่ง
      // คำนวณ itemsPrice: Buy Now ใช้ URL params, ปกติใช้สินค้าที่เลือกในตะกร้า
      const searchParamsTemp = new URLSearchParams(location.search);
      const isBuyNowFlow = searchParamsTemp.get("type") === "buynow";
      let itemsPrice;
      if (isBuyNowFlow) {
        const buyPrice = Number(searchParamsTemp.get("price") || 0);
        const buyQty = Number(searchParamsTemp.get("qty") || 1);
        itemsPrice = buyPrice * buyQty;
      } else {
        const selectedItems = cart.cartItems?.filter(item => item.isSelected !== false) || [];
        itemsPrice = selectedItems.reduce(
          (acc, item) => acc + (Number(item.price) * Number(item.qty)),
          0
        );
      }
      const transportCost = isReceiveCompleteSelected
        ? 0
        : parseFloat(transportationPrice?.transportationPrice || 0);
      const vatPrice = itemsPrice * 0.07;
      const totalPrice = itemsPrice + vatPrice + transportCost;

      console.log("[ShippingScreen] itemsPrice:", itemsPrice, "shipping:", transportCost, "total:", totalPrice);

      dispatch(
        updateCartPrice({
          receivePlace: isReceiveCompleteSelected ? "atcompany" : "bysending",
          shippingPrice: transportCost,
          totalPrice: totalPrice,
          vatPrice: vatPrice,
        }),
      );

      // 3. อัพเดทโปรไฟล์และส่งข้อมูลให้ Admin (Merge ข้อมูลใหม่)
      const res = await updateProfileShipping({
        shippingAddress: finalShippingAddress,
        billingAddress: finalBillingAddress,
      }).unwrap();
      dispatch(setCredentials({ ...userInfo, ...res }));

      //  4. ดึง Parameter จาก URL และส่งไปยังหน้า Payment
      const searchParams = new URLSearchParams(location.search);
      const type = searchParams.get("type");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (type === "buynow") {
        // Buy Now flow: ส่งข้อมูลสินค้าชิ้นเดียวไปหน้า Payment
        const productId = searchParams.get("productId");
        const buyQty = searchParams.get("qty");
        const buyPrice = searchParams.get("price");
        const buyName = searchParams.get("name") || "";
        const buyImage = searchParams.get("image") || "";
        navigate(`/payment?type=buynow&productId=${productId}&qty=${buyQty}&price=${buyPrice}&name=${encodeURIComponent(buyName)}&image=${encodeURIComponent(buyImage)}`);
      } else if (type && orderId) {
        // ถ้ามี type และ orderId แสดงว่าเป็นการแก้ไขออร์เดอร์ PCB ที่มีอยู่แล้ว
        navigate(`/payment?type=${type}&orderId=${orderId}&amount=${amount}`);
      } else {
        // ถ้าไม่มี แสดงว่าเป็นออร์เดอร์ใหม่ ให้ไปยังหน้า payment โดยตรง
        navigate("/payment");
      }
    } catch (error) {
      toast.error("Error processing order");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-6 md:py-10 px-4">
      <div className="max-w-3xl mx-auto text-start">
        <CheckoutSteps step1 step2 />
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 text-center mt-6 md:mt-10 mb-6 md:mb-8 tracking-tight uppercase">
          {t.stepTitle}
        </h1>

        <form onSubmit={submitHandler} className="space-y-6">
          {/* Method Selection */}
          <motion.div
            layout
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
              <FaTruck className="text-black" />{" "}
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
                    <FaMapMarkerAlt className="text-black" />{" "}
                    <h3 className="font-bold text-slate-800">
                      {t.shippingDetails}
                    </h3>
                  </div>
                  <div className="p-4 md:p-8 text-start">
                    {addressSource === "profile" ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-6 relative overflow-hidden group text-start">
                        <div className="relative z-10 space-y-3 font-medium text-start">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t.profileAddrTitle}
                          </p>
                          <div className="flex items-center gap-3 text-slate-900 font-bold">
                            <FaUser className="text-black text-xs" />{" "}
                            {userInfo.shippingAddress?.shippingname ||
                              userInfo.name}
                          </div>
                          <div className="flex items-center gap-3 text-slate-700">
                            <FaPhone className="text-black text-xs" />{" "}
                            {userInfo.shippingAddress?.phone || userInfo.phone}
                          </div>
                          <div className="flex items-start gap-3 text-slate-500 text-sm leading-relaxed text-start">
                            <FaMapMarkerAlt className="text-black text-xs mt-1 shrink-0" />
                            {userInfo.shippingAddress?.address
                              ? `${userInfo.shippingAddress.address}, ${userInfo.shippingAddress.city}, ${userInfo.shippingAddress.postalCode}`
                              : "âš ï¸ No address set in profile"}
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
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-sm font-bold animate-pulse text-start">
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
                    value={userInfo?.shippingAddress?.phone || userInfo?.phone || "N/A"}
                    disabled
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Billing Section */}
          <motion.div
            layout
            className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
              <FaFileInvoice className="text-black" />{" "}
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
                      setBillingName(userInfo.billingAddress.companyName || userInfo.billingAddress.billingName || "");
                      setTax(userInfo.billingAddress.tax || "");
                      setCompanyName(userInfo.billingAddress.companyName || userInfo.billingAddress.billingName || "");
                      setBranch(userInfo.billingAddress.branch || "");
                      setBillinggAddress(userInfo.billingAddress.billinggAddress || userInfo.billingAddress.address || "");
                      setBillingCity(userInfo.billingAddress.billingCity || "");
                      setBillingPostalCode(userInfo.billingAddress.billingPostalCode || userInfo.billingAddress.postalCode || "");
                      setBillingCountry(userInfo.billingAddress.billingCountry || userInfo.billingAddress.country || "Thailand");
                      setBillingPhone(userInfo.billingAddress.billingPhone || userInfo.billingAddress.phone || "");
                    }
                  } else {
                    setBillingName(userInfo.shippingAddress?.shippingname || userInfo.name || "");
                    setTax("N/A");
                    setBranch("");
                    setBillinggAddress(userInfo.billingAddress?.billinggAddress || userInfo.billingAddress?.address || userInfo.shippingAddress?.address || "");
                    setBillingCity(userInfo.billingAddress?.billingCity || userInfo.shippingAddress?.city || "");
                    setBillingPostalCode(userInfo.billingAddress?.billingPostalCode || userInfo.shippingAddress?.postalCode || "");
                    setBillingCountry(userInfo.billingAddress?.billingCountry || userInfo.shippingAddress?.country || "Thailand");
                    setBillingPhone(userInfo.billingAddress?.billingPhone || userInfo.shippingAddress?.phone || "");
                  }
                }}
                className={`relative overflow-hidden flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer group shadow-sm active:scale-[0.98] ${isCompanyOrder
                  ? "border-black bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white shadow-xl shadow-slate-900/20"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  }`}
              >
                {/* Subtle Glow Effect for Active State */}
                {isCompanyOrder && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 ${isCompanyOrder ? "bg-white text-black rotate-3 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-black shadow-inner"
                    }`}>
                    <FaBuilding size={24} />
                  </div>
                  <div>
                    <p className={`font-black text-base uppercase tracking-wider mb-0.5 transition-colors duration-500 ${isCompanyOrder ? "text-white" : "text-slate-800"}`}>
                      ออกใบเสร็จรับเงิน / ซื้อในนามบริษัท
                    </p>
                    <p className={`text-[11px] font-medium leading-tight tracking-wide transition-colors duration-500 ${isCompanyOrder ? "text-slate-400" : "text-slate-400 font-bold"}`}>
                      {isCompanyOrder
                        ? "✓ ข้อมูลบริษัทที่ตรวจสอบแล้ว"
                        : "( ดึงข้อมูลบริษัทจากโปรไฟล์ของคุณ )"}
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
                  title="ใบเสร็จรับเงินอย่างย่อ"
                  active={!isBillingCompleteSelected}
                  onClick={() => setIsBillingCompleteSelected(false)}
                />
                <SelectionCard
                  icon={<FaBuilding />}
                  title="ใบกำกับภาษีแบบเต็ม"
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
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] pt-2 text-start">
                      {t.fillBilling}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 text-start">
                      <InputField
                        id="billingName"
                        label={t.nameLabel}
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
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
                        id="billingPostalCode"
                        label={t.postalCodeLabel}
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        placeholder={t.phZip || t.phPostal}
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

const FaChevronRight = ({ className }) => (
  <svg
    className={className}
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path>
  </svg>
);

export default ShippingScreen;
