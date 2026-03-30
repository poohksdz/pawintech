import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaShoppingBag,
  FaMicrochip,
  FaPuzzlePiece,
  FaCopy,
  FaRobot,
} from "react-icons/fa";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Import Components
import Meta from "../components/Meta";
import Loader from "../components/Loader";

// Lazy load sub-screens to prevent potential circular dependency initialization issues
const OrderPCBCartScreen = React.lazy(
  () => import("./OrderPCB/OrderPCBCartScreen"),
);
const OrderAssemblyCartScreen = React.lazy(
  () => import("./OrderAssembly/OrderAssemblyCartScreen"),
);
const OrderProductCartScreen = React.lazy(
  () => import("./OrderProductCartScreen"),
);
const CustomPCBCartScreen = React.lazy(
  () => import("./CustomPCB/CustomPCBCartScreen"),
);
const CopyPCBCartScreen = React.lazy(
  () => import("./CopyPCB/CopyPCBCartScreen"),
);

const CartScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCart, setActiveCart] = useState("productcart");
  const { language } = useSelector((state) => state.language);

  const t = {
    en: {
      title: "Shopping Cart",
      productCart: "Products",
      pcbCart: "PCB Order",
      customPCBCart: "Custom PCB",
      copyPCBCart: "Copy PCB",
      assemblyCart: "Assembly",
    },
    thai: {
      title: "ตะกร้าสินค้า",
      productCart: "สินค้าทั่วไป",
      pcbCart: "สั่งทำ PCB",
      customPCBCart: "กำหนดเอง",
      copyPCBCart: "ก็อปปี้ PCB",
      assemblyCart: "งานประกอบ",
    },
  }[language || "en"];

  useEffect(() => {
    const subpath = location.pathname.split("/")[2] || "productcart";
    setActiveCart(subpath);
  }, [location.pathname]);

  const handleTabChange = (key) => {
    if (key && activeCart !== key) {
      setActiveCart(key);
      navigate(`/cart/${key}`);
    }
  };

  const tabs = [
    { key: "productcart", label: t.productCart, icon: <FaShoppingBag /> },
    { key: "pcbcart", label: t.pcbCart, icon: <FaMicrochip /> },
    { key: "custompcbcart", label: t.customPCBCart, icon: <FaPuzzlePiece /> },
    { key: "copypcbcart", label: t.copyPCBCart, icon: <FaCopy /> },
    { key: "assemblycart", label: t.assemblyCart, icon: <FaRobot /> },
  ];

  return (
    <div className="min-h-screen bg-[#fdfdfd] dark:bg-black py-20 font-sans antialiased text-slate-800 dark:text-white overflow-x-hidden transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-4">
        <Meta title={t.title} />

        {/* Header */}
        <header className="flex items-center justify-between mb-16 border-b border-slate-100 dark:border-zinc-800 pb-10 transition-colors duration-500">
          <div className="flex items-center gap-6">
            <Link to="/product" className="group">
              <div className="w-12 h-12 bg-white dark:bg-black rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white group-hover:border-slate-900 dark:group-hover:border-white transition-all shadow-sm">
                <FaArrowLeft size={16} />
              </div>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-tight transition-colors duration-500">
              {t.title}
            </h1>
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              PAWIN TECHNOLOGY • SECURE CHECKOUT
            </p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-8 md:mb-12 px-2 md:px-0">
          {/* DESKTOP NAVIGATION (Original Style) */}
          <nav className="hidden md:flex flex-nowrap justify-center gap-3 pb-3">
            <LayoutGroup id="desktop-tabs">
              {tabs.map((tab) => {
                const isActive = activeCart === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className="relative px-6 py-3.5 rounded-xl transition-all active:scale-95 flex items-center gap-2.5 overflow-hidden group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-bg-desktop"
                        className="absolute inset-0 bg-slate-900 dark:bg-black z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative z-10 text-[18px] shrink-0 transition-colors duration-500 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 appearance-none"}`}>
                      {tab.icon}
                    </span>
                    <span className={`relative z-10 text-[12px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </LayoutGroup>
          </nav>

          {/* MOBILE NAVIGATION (New Premium SaaS Style) */}
          <nav className="md:hidden bg-slate-50 border border-slate-100 p-1.5 rounded-[1.5rem] flex items-center justify-between gap-1 shadow-inner relative z-10">
            <LayoutGroup id="mobile-tabs">
              {tabs.map((tab) => {
                const isActive = activeCart === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`
                      relative flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300
                      ${isActive ? "shadow-lg shadow-slate-200" : "hover:bg-white/50 active:scale-95"}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-bg-mobile"
                        className="absolute inset-0 bg-slate-900 z-0 rounded-2xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative z-10 text-[16px] shrink-0 transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400"}`}>
                      {tab.icon}
                    </span>
                    <span className={`relative z-10 text-[7.5px] font-black uppercase tracking-[0.05em] leading-none text-center transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </LayoutGroup>
          </nav>
        </div>

        {/* Content Area */}
        <main className="min-h-[600px] bg-white dark:bg-black rounded-2xl md:rounded-[2.5rem] p-2 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 dark:border-zinc-800 relative transition-colors duration-500">
          <React.Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center">
                <Loader />
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCart}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeCart === "productcart" && <OrderProductCartScreen />}
                {activeCart === "pcbcart" && <OrderPCBCartScreen />}
                {activeCart === "custompcbcart" && <CustomPCBCartScreen />}
                {activeCart === "copypcbcart" && <CopyPCBCartScreen />}
                {activeCart === "assemblycart" && <OrderAssemblyCartScreen />}
              </motion.div>
            </AnimatePresence>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default CartScreen;
