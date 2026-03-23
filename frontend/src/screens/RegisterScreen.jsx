import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';

const RegisterScreen = () => {
  // --- Form States ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address States (ข้อมูลตามตาราง Users ใน DB ของคุณ)
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Error States
  const [fieldErrors, setFieldErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  const handleInputChange = (setter, fieldName, value) => {
    setter(value);
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // 1. ตรวจสอบรหัสผ่าน
    if (password !== confirmPassword) {
      const msg = language === 'thai' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match';
      toast.error(msg);
      setFieldErrors({ password: msg, confirmPassword: msg });
      return;
    }

    try {
      // 2. ส่งข้อมูล (Flat Structure ให้ตรงกับ Database ของคุณ)
      const res = await register({
        name,
        email,
        password,
        address,
        city,
        postalCode,
        country,
        phone,
      }).unwrap();

      dispatch(setCredentials({ ...res }));
      navigate(redirect);
      toast.success(language === 'thai' ? 'ลงทะเบียนสำเร็จ' : 'Registration Successful');
    } catch (err) {
      // 3. จัดการ Error
      let errorMessage = err?.data?.message || err.error || 'Registration failed';

      if (errorMessage.includes('Duplicate entry') || errorMessage === 'User already exists') {
        const emailMsg = language === 'thai' ? 'อีเมลนี้ถูกใช้งานไปแล้ว' : 'User already exists';
        setFieldErrors({ email: emailMsg });
        toast.error(emailMsg);
      } else {
        // กรณี Error เรื่อง Database (เช่น created_at) จะแสดงตรงนี้
        toast.error(errorMessage);
      }
      console.error("Registration Error:", err);
    }
  };

  // --- Translations ---
  const translations = {
    en: {
      title: 'Create Account',
      subtitle: 'Join us to get started with your shopping journey.',
      sectionAccount: 'Account Details',
      sectionShipping: 'Contact Information',
      logIn: 'Sign In',
      register: 'Create Account',
      nameLabel: 'Full Name',
      namePlaceholder: 'John Doe',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPassword: 'Confirm Password',
      addressLabel: 'Address',
      cityLabel: 'City',
      postalCodeLabel: 'Postal Code',
      countryLabel: 'Country',
      phoneLabel: 'Phone Number',
      alreadyHaveAccount: 'Already have an account?',
    },
    thai: {
      title: 'สร้างบัญชีใหม่',
      subtitle: 'ลงทะเบียนเพื่อเริ่มต้นการใช้งาน',
      sectionAccount: 'ข้อมูลบัญชี',
      sectionShipping: 'ข้อมูลการติดต่อ',
      logIn: 'เข้าสู่ระบบ',
      register: 'ลงทะเบียน',
      nameLabel: 'ชื่อ-นามสกุล',
      namePlaceholder: 'ชื่อ-นามสกุล',
      emailLabel: 'อีเมล',
      emailPlaceholder: 'name@example.com',
      password: 'รหัสผ่าน',
      passwordPlaceholder: '••••••••',
      confirmPassword: 'ยืนยันรหัสผ่าน',
      addressLabel: 'ที่อยู่',
      cityLabel: 'จังหวัด/เมือง',
      postalCodeLabel: 'รหัสไปรษณีย์',
      countryLabel: 'ประเทศ',
      phoneLabel: 'เบอร์โทรศัพท์',
      alreadyHaveAccount: 'มีบัญชีอยู่แล้ว?',
    },
  };

  const t = translations[language] || translations.en;

  // Input Style Helpers
  const inputClass = "block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    // ✅ แก้ไข 1: ใช้ flex-row และ min-h-screen ที่ body หลัก เพื่อให้ Scrollbar เป็นของ Browser ตัวเดียว
    <div className="flex flex-col lg:flex-row min-h-screen bg-white w-full">

      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-4 py-8 md:px-6 md:py-12 lg:px-16 xl:px-24 animate__animated animate__fadeIn">
        <div className="w-full max-w-2xl mx-auto">

          {/* Header & Logo */}
          <div className="mb-10 flex flex-col items-start">
            <Link to="/">
              <img
                className="h-8 md:h-10 w-auto mb-6 object-contain hover:opacity-80 transition-opacity"
                src="/image/favicon.ico"
                alt="Logo"
              />
            </Link>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {t.title}
            </h2>
            <p className="mt-2 text-slate-500 font-medium">
              {t.subtitle}
            </p>
          </div>

          <form onSubmit={submitHandler} className="space-y-8 text-left">

            {/* --- SECTION 1: ACCOUNT DETAILS --- */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">{t.sectionAccount}</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="name" className={labelClass}>{t.nameLabel}</label>
                  <input
                    type="text" id="name" required
                    value={name} placeholder={t.namePlaceholder}
                    className={inputClass}
                    onChange={(e) => handleInputChange(setName, 'name', e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="email" className={labelClass}>{t.emailLabel}</label>
                  <input
                    type="email" id="email" required
                    value={email} placeholder={t.emailPlaceholder}
                    className={`${inputClass} ${fieldErrors.email ? 'border-red-500 ring-red-100' : ''}`}
                    onChange={(e) => handleInputChange(setEmail, 'email', e.target.value)}
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className={labelClass}>{t.password}</label>
                  <input
                    type="password" id="password" required
                    value={password} placeholder="••••••••"
                    className={inputClass}
                    onChange={(e) => handleInputChange(setPassword, 'password', e.target.value)}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>{t.confirmPassword}</label>
                  <input
                    type="password" id="confirmPassword" required
                    value={confirmPassword} placeholder="••••••••"
                    className={inputClass}
                    onChange={(e) => handleInputChange(setConfirmPassword, 'confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* --- SECTION 2: CONTACT DETAILS --- */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">{t.sectionShipping}</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="address" className={labelClass}>{t.addressLabel}</label>
                  <input
                    type="text" id="address" required
                    value={address} placeholder={language === 'thai' ? 'บ้านเลขที่, ถนน, ซอย' : 'Street Address'}
                    className={inputClass}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* City & Postal Code */}
                <div>
                  <label htmlFor="city" className={labelClass}>{t.cityLabel}</label>
                  <input
                    type="text" id="city" required
                    value={city} placeholder={language === 'thai' ? 'กรุงเทพฯ' : 'City'}
                    className={inputClass}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className={labelClass}>{t.postalCodeLabel}</label>
                  <input
                    type="text" id="postalCode" required
                    value={postalCode} placeholder="10xxx"
                    className={inputClass}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                {/* Country & Phone */}
                <div>
                  <label htmlFor="country" className={labelClass}>{t.countryLabel}</label>
                  <input
                    type="text" id="country" required
                    value={country} placeholder={language === 'thai' ? 'ไทย' : 'Thailand'}
                    className={inputClass}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>{t.phoneLabel}</label>
                  <input
                    type="text" id="phone" required
                    value={phone} placeholder="08x-xxx-xxxx"
                    className={inputClass}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit" disabled={isLoading}
                className="w-full py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-base font-bold text-white bg-slate-900 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-1"
              >
                {isLoading ? "Creating Account..." : t.register}
              </button>
            </div>

            <div className="text-center pb-10">
              <p className="text-sm text-slate-500 font-medium">
                {t.alreadyHaveAccount}{' '}
                <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="text-blue-600 font-bold hover:underline">
                  {t.logIn}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* --- RIGHT SIDE: BANNER --- */}
      {/* ✅ แก้ไข 3: ใช้ sticky top-0 h-screen เพื่อให้รูปค้างอยู่หน้าจอขณะเลื่อนแบบฟอร์มลงมา */}
      <div className="hidden lg:block w-2/5 relative bg-slate-900">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* ✅ แก้ไข 4: ใช้ object-[center_30%] เพื่อขยับรูปให้โฟกัสต่ำลงมานิดนึงตามที่ขอ */}
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
            alt="Register Background"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%] opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div className="relative z-10 w-full h-full flex flex-col justify-end p-16 text-white text-left">
            <h3 className="text-5xl font-black mb-6 leading-tight tracking-tight">
              Build your <br />technology with us.
            </h3>
            <p className="text-xl text-slate-300 max-w-md leading-relaxed font-medium">
              Get specialized electronics sourcing and PCB design services from the experts.
            </p>
            <div className="mt-12 flex gap-4">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">PCB DESIGN</div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">SOURCING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;