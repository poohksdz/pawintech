import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import CheckoutSteps from '../components/CheckoutSteps';
import { saveShippingAddress, saveBillingAddress, updateCartPrice } from '../slices/cartSlice';
import { useProfileShippingMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { useGetTransportationPriceQuery } from '../slices/ordersApiSlice';
import {
    FaTruck, FaBuilding, FaMapMarkerAlt, FaFileInvoice,
    FaInfoCircle, FaCheckCircle, FaUser, FaIdCard, FaEdit, FaPhone
} from 'react-icons/fa';

// ✅ 1. InputField (Stable Component - แก้ปัญหาหลุด Focus)
const InputField = ({ id, label, value, onChange, placeholder, type = "text", fullWidth = false, disabled = false, isError = false }) => (
    <div id={`field-${id}`} className={`flex flex-col gap-1.5 transition-all duration-300 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isError ? 'text-red-500' : 'text-slate-400'}`}>
            {label} {isError && '*'}
        </label>
        <motion.input
            animate={isError ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ duration: 0.4 }}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full border rounded-xl px-4 py-3 text-sm transition-all outline-none 
                ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' :
                    isError ? 'bg-red-50 border-red-500 ring-4 ring-red-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-black/10 focus:border-black'}`}
        />
    </div>
);

// ✅ 2. SelectionCard
const SelectionCard = ({ icon, title, active, onClick }) => (
    <div onClick={onClick} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${active ? 'border-black bg-slate-50 shadow-md scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 hover:scale-[1.01]'}`}>
        <div className={`p-3 rounded-xl transition-colors duration-300 ${active ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}>{icon}</div>
        <div className="flex flex-grow items-center justify-between">
            <span className={`font-bold text-sm transition-colors duration-300 ${active ? 'text-black' : 'text-slate-500'}`}>{title}</span>
            {active && <FaCheckCircle className="text-black" />}
        </div>
    </div>
);

const ShippingScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // 🔥 เพิ่ม useLocation สำหรับดึงค่า URL Parameter
    const { userInfo } = useSelector((state) => state.auth);
    const { language } = useSelector((state) => state.language);

    const [updateProfileShipping] = useProfileShippingMutation();
    const { data: transportationPrice } = useGetTransportationPriceQuery();

    // --- Form States ---
    const [shippingname, setShippingname] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');

    const [billingName, setBillingName] = useState('');
    const [billinggAddress, setBillinggAddress] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingPostalCode, setBillingPostalCode] = useState('');
    const [billingCountry, setBillingCountry] = useState('');
    const [billingPhone, setBillingPhone] = useState('');
    const [tax, setTax] = useState('');

    // --- UI Logic States ---
    const [isReceiveCompleteSelected, setIsReceiveCompleteSelected] = useState(false);
    const [addressSource, setAddressSource] = useState('profile');
    const [isBillingCompleteSelected, setIsBillingCompleteSelected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // ✅ Sync Profile Data
    useEffect(() => {
        if (userInfo && addressSource === 'profile') {
            setShippingname(userInfo.shippingAddress?.shippingname || userInfo.name || '');
            setPhone(userInfo.shippingAddress?.phone || userInfo.phone || '');
            setAddress(userInfo.shippingAddress?.address || '');
            setCity(userInfo.shippingAddress?.city || '');
            setPostalCode(userInfo.shippingAddress?.postalCode || '');
            setCountry(userInfo.shippingAddress?.country || '');
        }
    }, [userInfo, addressSource]);

    const t = {
        en: {
            stepTitle: 'Shipping & Billing',
            receiveMethod: 'Delivery Method', addressSource: 'Address Selection',
            useProfile: 'Use Profile Address', useCustom: 'Add New Address',
            shippingDetails: 'Shipping Address', billingDetails: 'Billing & Tax Invoice',
            continueLbl: 'Proceed to Payment', nameLabel: 'Full Name',
            phoneLabel: 'Phone Number', addressLabel: 'Address', cityLabel: 'City',
            postalCodeLabel: 'Postal Code', countryLabel: 'Country', TaxLabel: 'Tax ID',
            sendOption: 'Ship to Address', pickupOption: 'Pick up at Company',
            pickupInfo: 'Verify your contact info for pickup.', fillBilling: 'Tax Invoice Details',
            profileAddrTitle: 'Profile Address', errFillAll: 'Please fill in all required fields',
            phName: 'e.g. John Doe', phPhone: 'e.g. 0812345678', phAddr: '123/4 Moo 5, Sukhumvit Rd...',
            phCity: 'e.g. Bangkok', phZip: '10xxx', phCountry: 'Thailand',
            phTax: '13-digit identification number'
        },
        thai: {
            stepTitle: 'การจัดส่งและใบกำกับภาษี',
            receiveMethod: 'เลือกวิธีการรับสินค้า', addressSource: 'เลือกที่อยู่จัดส่ง',
            useProfile: 'ใช้ที่อยู่ในโปรไฟล์', useCustom: 'เพิ่มที่อยู่ใหม่',
            shippingDetails: 'ที่อยู่จัดส่ง', billingDetails: 'ใบกำกับภาษี',
            continueLbl: 'ดำเนินการชำระเงิน', nameLabel: 'ชื่อ-นามสกุล',
            phoneLabel: 'เบอร์โทรศัพท์', addressLabel: 'ที่อยู่', cityLabel: 'จังหวัด/เมือง',
            postalCodeLabel: 'รหัสไปรษณีย์', countryLabel: 'ประเทศ', TaxLabel: 'เลขประจำตัวผู้เสียภาษี',
            sendOption: 'จัดส่งตามที่อยู่', pickupOption: 'รับสินค้าที่บริษัท',
            pickupInfo: 'กรุณาตรวจสอบชื่อและเบอร์โทรศัพท์สำหรับติดต่อรับสินค้า',
            fillBilling: 'ข้อมูลใบกำกับภาษีเต็มรูป', profileAddrTitle: 'ที่อยู่ในโปรไฟล์',
            errFillAll: 'กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน',
            phName: 'เช่น สมชาย ใจดี', phPhone: 'เช่น 0812345678', phAddr: '123/4 หมู่ 5 ซอยสุขุมวิท...',
            phCity: 'เช่น กรุงเทพฯ', phZip: '10xxx', phCountry: 'ประเทศไทย',
            phTax: 'เลขประจำตัวผู้เสียภาษี 13 หลัก'
        }
    }[language || 'en'];

    // ✅ ฟังก์ชันตรวจเช็คข้อมูลและเลื่อนหน้าจอ
    const validateAndScroll = () => {
        const newErrors = {};
        if (!isReceiveCompleteSelected && addressSource === 'manual') {
            if (!shippingname) newErrors.shippingname = true;
            if (!phone) newErrors.phone = true;
            if (!address) newErrors.address = true;
            if (!city) newErrors.city = true;
            if (!postalCode) newErrors.postalCode = true;
        }
        if (isBillingCompleteSelected) {
            if (!billingName) newErrors.billingName = true;
            if (!tax) newErrors.tax = true;
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
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                ? { shippingname: userInfo.name, phone: userInfo.phone || '', address: 'Pickup at Company', city: 'Thailand', postalCode: '00000', country: 'TH' }
                : (addressSource === 'profile' ? { ...userInfo.shippingAddress } : { shippingname, phone, address, city, postalCode, country });

            const finalBillingAddress = isBillingCompleteSelected
                ? { billingName, billinggAddress, billingCity, billingPostalCode, billingCountry, billingPhone, tax }
                : { billingName: finalShippingAddress.shippingname, billinggAddress: finalShippingAddress.address, billingCity: finalShippingAddress.city, billingPostalCode: finalShippingAddress.postalCode, billingCountry: finalShippingAddress.country, billingPhone: finalShippingAddress.phone, tax: 'N/A' };

            // 1. บันทึกข้อมูลที่อยู่ลง Cart (Redux)
            dispatch(saveShippingAddress({ ...finalShippingAddress, receivePlace: isReceiveCompleteSelected ? 'atcompany' : 'bysending' }));
            dispatch(saveBillingAddress(finalBillingAddress));

            // 2. คำนวณราคาขนส่งและยอดรวม
            let localCart = JSON.parse(localStorage.getItem('cart')) || {};
            const transportCost = isReceiveCompleteSelected ? 0 : parseFloat(transportationPrice?.transportationPrice || 0);
            const itemsPrice = parseFloat(localCart.itemsPrice || 0);

            dispatch(updateCartPrice({
                receivePlace: isReceiveCompleteSelected ? 'atcompany' : 'bysending',
                shippingPrice: transportCost,
                totalPrice: +(itemsPrice * 1.07 + transportCost).toFixed(2),
                vatPrice: +(itemsPrice * 0.07).toFixed(2)
            }));

            // 3. ✅ อัปเดตโปรไฟล์และรักษาเมนู Admin (Merge ข้อมูลเดิม)
            const res = await updateProfileShipping({ shippingAddress: finalShippingAddress, billingAddress: finalBillingAddress }).unwrap();
            dispatch(setCredentials({ ...userInfo, ...res }));

            // 🔥 4. ดึง Parameter จาก URL และส่งต่อไปหน้า Payment
            const searchParams = new URLSearchParams(location.search);
            const type = searchParams.get('type');
            const orderId = searchParams.get('orderId');
            const amount = searchParams.get('amount');

            if (type && orderId) {
                // ถ้ามี type และ orderId แปลว่ามาจากงานสั่งทำ PCB ให้ส่งค่าตามไปด้วย
                navigate(`/payment?type=${type}&orderId=${orderId}&amount=${amount}`);
            } else {
                // ถ้าไม่มีค่า แปลว่ามาจากระบบซื้อสินค้าทั่วไป ให้ไปหน้า payment ธรรมดา
                navigate('/payment');
            }

        } catch (error) {
            toast.error("Error processing order");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen py-10 px-4">
            <div className="max-w-3xl mx-auto text-start">
                <CheckoutSteps step1 step2 />
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 text-center mt-6 md:mt-10 mb-6 md:mb-8 tracking-tight uppercase">{t.stepTitle}</h1>

                <form onSubmit={submitHandler} className="space-y-6">
                    {/* Method Selection */}
                    <motion.div layout className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
                            <FaTruck className="text-black" /> <h3 className="font-bold text-slate-800">{t.receiveMethod}</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectionCard icon={<FaTruck />} title={t.sendOption} active={!isReceiveCompleteSelected} onClick={() => setIsReceiveCompleteSelected(false)} />
                            <SelectionCard icon={<FaBuilding />} title={t.pickupOption} active={isReceiveCompleteSelected} onClick={() => setIsReceiveCompleteSelected(true)} />
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!isReceiveCompleteSelected ? (
                            <motion.div key="sending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-6 text-start">
                                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SelectionCard icon={<FaIdCard />} title={t.useProfile} active={addressSource === 'profile'} onClick={() => setAddressSource('profile')} />
                                        <SelectionCard icon={<FaEdit />} title={t.useCustom} active={addressSource === 'manual'} onClick={() => setAddressSource('manual')} />
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
                                        <FaMapMarkerAlt className="text-black" /> <h3 className="font-bold text-slate-800">{t.shippingDetails}</h3>
                                    </div>
                                    <div className="p-4 md:p-8 text-start">
                                        {addressSource === 'profile' ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden group text-start">
                                                <div className="relative z-10 space-y-3 font-medium text-start">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.profileAddrTitle}</p>
                                                    <div className="flex items-center gap-3 text-slate-900 font-bold"><FaUser className="text-black text-xs" /> {userInfo.shippingAddress?.shippingname || userInfo.name}</div>
                                                    <div className="flex items-center gap-3 text-slate-700"><FaPhone className="text-black text-xs" /> {userInfo.shippingAddress?.phone || userInfo.phone}</div>
                                                    <div className="flex items-start gap-3 text-slate-500 text-sm leading-relaxed text-start">
                                                        <FaMapMarkerAlt className="text-black text-xs mt-1 shrink-0" />
                                                        {userInfo.shippingAddress?.address ? `${userInfo.shippingAddress.address}, ${userInfo.shippingAddress.city}, ${userInfo.shippingAddress.postalCode}` : "⚠️ No address set in profile"}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-start">
                                                <InputField id="shippingname" label={t.nameLabel} value={shippingname} onChange={(e) => setShippingname(e.target.value)} placeholder={t.phName} isError={errors.shippingname} />
                                                <InputField id="phone" label={t.phoneLabel} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phPhone} isError={errors.phone} />
                                                <InputField id="address" label={t.addressLabel} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.phAddr} isError={errors.address} fullWidth />
                                                <InputField id="city" label={t.cityLabel} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.phCity} isError={errors.city} />
                                                <InputField id="postalCode" label={t.postalCodeLabel} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t.phZip} isError={errors.postalCode} />
                                                <InputField id="country" label={t.countryLabel} value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t.phCountry} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="pickup" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-8 space-y-6 text-start">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-sm font-bold animate-pulse text-start"><FaInfoCircle /> {t.pickupInfo}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60 text-start">
                                    <InputField label={t.nameLabel} value={userInfo.name} disabled />
                                    <InputField label={t.phoneLabel} value={userInfo.phone || 'N/A'} disabled />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Billing Section */}
                    <motion.div layout className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3 text-start">
                            <FaFileInvoice className="text-black" /> <h3 className="font-bold text-slate-800">{t.billingDetails}</h3>
                        </div>
                        <div className="p-4 md:p-8 space-y-6 text-start">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectionCard icon={<FaFileInvoice />} title="ใบเสร็จรับเงินย่อ" active={!isBillingCompleteSelected} onClick={() => setIsBillingCompleteSelected(false)} />
                                <SelectionCard icon={<FaBuilding />} title="ใบกำกับภาษีเต็มรูป" active={isBillingCompleteSelected} onClick={() => setIsBillingCompleteSelected(true)} />
                            </div>
                            <AnimatePresence>
                                {isBillingCompleteSelected && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-6 border-t border-slate-100 space-y-6 overflow-hidden text-start">
                                        <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] pt-2 text-start">{t.fillBilling}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 text-start">
                                            <InputField id="billingName" label={t.nameLabel} value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder={t.phName} isError={errors.billingName} fullWidth />
                                            <InputField id="tax" label={t.TaxLabel} value={tax} onChange={(e) => setTax(e.target.value)} placeholder={t.phTax} isError={errors.tax} />
                                            <InputField id="billingPhone" label={t.phoneLabel} value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} placeholder={t.phPhone} isError={errors.billingPhone} />
                                            <InputField id="billinggAddress" label={t.addressLabel} value={billinggAddress} onChange={(e) => setBillinggAddress(e.target.value)} placeholder={t.phAddr} isError={errors.billinggAddress} fullWidth />
                                            <InputField id="billingCity" label={t.cityLabel} value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder={t.phCity} isError={errors.billingCity} />
                                            <InputField id="billingPostalCode" label={t.postalCodeLabel} value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} placeholder={t.phZip} isError={errors.billingPostalCode} />
                                            <InputField label={t.countryLabel} value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} placeholder={t.phCountry} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 hover:bg-black text-white font-black text-lg py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-400 group">
                        {isProcessing ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (
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
    <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path></svg>
);

export default ShippingScreen;