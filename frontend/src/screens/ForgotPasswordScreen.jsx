import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useRequestPasswordResetMutation } from "../slices/usersApiSlice";
import { toast } from "react-toastify";
import { FaEnvelope, FaChevronLeft, FaCheckCircle } from "react-icons/fa";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [requestPasswordReset, { isLoading }] =
    useRequestPasswordResetMutation();
  const { state } = useLocation();
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: "Forgot Password",
      subtitle:
        "No worries! Enter your email and we'll send you instructions to reset your password.",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email",
      sendLink: "Send Reset Link",
      backToLogin: "Back to Sign In",
      successTitle: "Check your email",
      successDetail:
        "We have sent password recovery instructions to your email address.",
    },
    thai: {
      title: "ลืมรหัสผ่าน",
      subtitle:
        "ไม่ต้องกังวล! กรอกอีเมลของคุณแล้วเราจะส่งวิธีตั้งรหัสผ่านใหม่ไปให้ครับ",
      emailLabel: "อีเมลของคุณ",
      emailPlaceholder: "กรอกอีเมลของคุณที่นี่",
      sendLink: "ส่งลิงก์รีเซ็ต",
      backToLogin: "กลับไปหน้าเข้าสู่ระบบ",
      successTitle: "ตรวจสอบอีเมลของคุณ",
      successDetail:
        "เราได้ส่งขั้นตอนการกู้คืนรหัสผ่านไปยังที่อยู่อีเมลของคุณเรียบร้อยแล้ว",
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (state?.email) setEmail(state.email);
  }, [state]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(
        language === "thai" ? "กรุณากรอกอีเมล" : "Please enter your email",
      );
      return;
    }

    try {
      await requestPasswordReset({ email }).unwrap();
      setIsSubmitted(true);
    } catch (err) {
      toast.error(err?.data?.message || err.error || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-['Prompt']">
      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 animate__animated animate__fadeInLeft">
        <div className="w-full max-w-[450px] space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-8 group"
            >
              <FaChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              {t.backToLogin}
            </Link>

            <div className="mb-6">
              <img
                src="/image/favicon.ico"
                alt="Logo"
                className="h-12 w-auto mb-6 mx-auto lg:mx-0 object-contain"
              />
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                {isSubmitted ? t.successTitle : t.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {isSubmitted ? t.successDetail : t.subtitle}
              </p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="space-y-6 animate__animated animate__fadeInUp">
              <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8 text-center shadow-sm">
                <FaCheckCircle
                  size={64}
                  className="text-emerald-500 mx-auto mb-4"
                />
                <p className="text-emerald-800 font-bold">
                  {language === "thai"
                    ? "ส่งอีเมลเรียบร้อยแล้ว!"
                    : "Email Sent Successfully!"}
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            <form
              className="space-y-6 animate__animated animate__fadeInUp"
              onSubmit={submitHandler}
            >
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  {t.emailLabel}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FaEnvelope size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t.sendLink
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: IMAGE BANNER --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-100 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
          alt="Reset Password"
          className="absolute inset-0 w-full h-full object-cover animate__animated animate__fadeIn"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 to-indigo-900/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-20 text-white">
          <h3 className="text-5xl font-black mb-6 tracking-tighter leading-none uppercase">
            Secure Your
            <br />
            Future.
          </h3>
          <p className="text-xl text-slate-200 max-w-md font-medium leading-relaxed">
            Industry-standard encryption and security protocols protecting your
            account and data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
