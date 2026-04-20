import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useResetPasswordMutation } from "../slices/usersApiSlice";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const navigate = useNavigate();
  const { search } = useLocation();
  const token = new URLSearchParams(search).get("token");

  const { language } = useSelector((state) => state.language);

  useEffect(() => {
    if (!token) {
      toast.error(
        language === "thai"
          ? "ไม่พบ Token สำหรับรีเซ็ต"
          : "Missing reset token",
      );
      navigate("/login");
    }
  }, [token, navigate, language]);

  const handleInputChange = (setter, fieldName, value) => {
    setter(value);
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const translations = {
    en: {
      title: "Set New Password",
      subtitle: "Must be at least 8 characters long.",
      newPassword: "New Password",
      newPasswordPlaceholder: "Enter new password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      resetting: "Saving...",
      resetPassword: "Save Password",
      fillFields: "Please fill in both password fields",
      passwordsMismatch: "Passwords do not match",
      successMessage: "Password updated successfully!",
      backToLogin: "Back to Sign In",
    },
    thai: {
      title: "ตั้งรหัสผ่านใหม่",
      subtitle: "รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร",
      newPassword: "รหัสผ่านใหม่",
      newPasswordPlaceholder: "กรอกรหัสผ่านใหม่",
      confirmPassword: "ยืนยันรหัสผ่าน",
      confirmPasswordPlaceholder: "ยืนยันรหัสผ่านอีกครั้ง",
      resetting: "กำลังบันทึก...",
      resetPassword: "ยืนยันเปลี่ยนรหัสผ่าน",
      fillFields: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
      passwordsMismatch: "รหัสผ่านใหม่ไม่ตรงกัน",
      successMessage: "เปลี่ยนรหัสผ่านสำเร็จแล้ว!",
      backToLogin: "กลับไปหน้าเข้าสู่ระบบ",
    },
  };

  const t = translations[language] || translations.en;

  const submitHandler = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!newPassword || !confirmPassword) {
      const msg = t.fillFields;
      toast.error(msg);
      setFieldErrors({
        newPassword: !newPassword ? msg : null,
        confirmPassword: !confirmPassword ? msg : null,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = t.passwordsMismatch;
      toast.error(msg);
      setFieldErrors({
        newPassword: msg,
        confirmPassword: msg,
      });
      return;
    }

    try {
      await resetPassword({ token, newPassword }).unwrap();
      toast.success(t.successMessage);
      navigate("/login");
    } catch (err) {
      const errorMsg = err?.data?.message || err.error || "Error occurred";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#F1F5F9] font-['Prompt'] antialiased">
      <div className="max-w-md w-full animate__animated animate__fadeInUp">
        <div className="bg-white shadow-2xl shadow-indigo-200/40 rounded-[2.5rem] p-4 md:p-8 md:p-12 border border-white">
          {/* Header & Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <FaShieldAlt size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {t.title}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-3">
              {t.subtitle}
            </p>
          </div>

          <form onSubmit={submitHandler} className="space-y-6">
            {/* New Password */}
            <div className="relative group">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                label={t.newPassword}
                placeholder={t.newPasswordPlaceholder}
                value={newPassword}
                onChange={(e) =>
                  handleInputChange(
                    setNewPassword,
                    "newPassword",
                    e.target.value,
                  )
                }
                error={fieldErrors.newPassword}
                className="pr-12 bg-white border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 rounded-2xl py-4"
                labelClassName="text-xs font-black text-slate-500 uppercase tracking-widest mb-2"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-[42px] text-slate-400 hover:text-indigo-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                label={t.confirmPassword}
                placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) =>
                  handleInputChange(
                    setConfirmPassword,
                    "confirmPassword",
                    e.target.value,
                  )
                }
                error={fieldErrors.confirmPassword}
                className="pr-12 bg-white border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 rounded-2xl py-4"
                labelClassName="text-xs font-black text-slate-500 uppercase tracking-widest mb-2"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-[42px] text-slate-400 hover:text-indigo-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-sm font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t.resetPassword
                )}
              </Button>
            </div>

            {/* Footer Link */}
            <div className="text-center mt-8 pt-4 border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                {t.backToLogin}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
