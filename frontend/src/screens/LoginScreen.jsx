import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

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

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === 'thai' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
    } catch (err) {
      const errorMessage = err?.data?.message || err?.error || 'An unknown error occurred';
      toast.error(errorMessage);
    }
  };

  const translations = {
    en: {
      welcome: 'Welcome back',
      subtitle: 'Welcome back! Please enter your details.',
      signIn: 'Sign in',
      register: 'Sign up for free',
      registerPrompt: "Don't have an account?",
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot password?',
    },
    thai: {
      welcome: 'ยินดีต้อนรับกลับมา',
      subtitle: 'กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ',
      signIn: 'เข้าสู่ระบบ',
      register: 'สมัครบัญชีผู้ใช้',
      registerPrompt: 'ยังไม่มีบัญชีผู้ใช้?',
      emailLabel: 'อีเมล',
      emailPlaceholder: 'กรอกอีเมลของคุณ',
      password: 'รหัสผ่าน',
      passwordPlaceholder: 'กรอกรหัสผ่าน',
      forgotPassword: 'ลืมรหัสผ่าน?',
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen flex w-full bg-white">

      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 animate__animated animate__fadeInLeft">
        <div className="w-full max-w-[450px] space-y-8">

          {/* Logo & Header */}
          <div className="text-center lg:text-left">
            <img
              className="h-10 md:h-12 w-auto mb-6 mx-auto lg:mx-0 object-contain"
              src="/image/favicon.ico"
              alt="Logo"
            />
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.welcome}
            </h2>
            <p className="mt-2 text-slate-500 text-sm">
              {t.subtitle}
            </p>
          </div>

          <form className="space-y-6" onSubmit={submitHandler}>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                {t.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* Email Icon */}
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* Lock Icon */}
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-2">
                <Link
                  to={redirect ? `/requestpasswordreset?redirect=${redirect}` : '/requestpasswordreset'}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t.forgotPassword}
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : (
                t.signIn
              )}
            </button>

            {/* Register Link */}
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">{t.registerPrompt}</span>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link
                to={redirect ? `/register?redirect=${redirect}` : '/register'}
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                {t.register}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* --- RIGHT SIDE: IMAGE BANNER --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative overflow-hidden">
        {/* รูปภาพพื้นหลัง: เปลี่ยน URL ได้ตามใจชอบ */}
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
          alt="Technology Background"
          className="absolute inset-0 w-full h-full object-cover animate__animated animate__fadeIn"
        />
        {/* Gradient Overlay เพื่อให้ดูแพงและอ่าน Text ได้ถ้ามี */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-indigo-900/40 backdrop-blur-[1px]"></div>

        {/* ข้อความบนรูปภาพ (Optional) */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-16 pb-24 text-white">
          <h3 className="text-4xl font-bold mb-4">Innovation for Future.</h3>
          <p className="text-lg text-blue-100 max-w-md">
            Experience the best technology solutions with our premium electronic services.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginScreen;