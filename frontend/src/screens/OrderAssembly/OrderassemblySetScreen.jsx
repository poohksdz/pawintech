import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBoxOpen, FaIndustry, FaExchangeAlt, FaCheckCircle, FaArrowLeft, FaLayerGroup, FaTools } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Import Components
import OrderassemblyCartYouSupplyPartScreen from './OrderassemblyCartYouSupplyPartScreen';
import OrderassemblyCartWeSupplyPartScreen from './OrderassemblyCartWeSupplyPartScreen';
import OrderassemblyCartYouSupplySomePartWedotherestScreen from './OrderassemblyCartYouSupplySomePartWedotherestScreen';

const OrderassemblySetScreen = () => {
  const [activeCart, setActiveCart] = useState('youpart');
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: 'Assembly Solution',
      subtitle: 'Seamless component sourcing for your PCB production',
      youpart: 'Consigned',
      youpartFull: 'You Supply Parts',
      youpartDesc: 'Ship components to us',
      wepart: 'Turnkey',
      wepartFull: 'We Supply Parts',
      wepartDesc: 'We handle all sourcing',
      both: 'Hybrid',
      bothFull: 'Partial Sourcing',
      bothDesc: 'Mixed supply model',
    },
    thai: {
      title: 'รูปแบบการประกอบ',
      subtitle: 'เลือกวิธีจัดการชิ้นส่วนที่เหมาะกับโปรเจกต์ของคุณ',
      youpart: 'จัดหาเอง',
      youpartFull: 'ลูกค้าจัดหาชิ้นส่วน',
      youpartDesc: 'คุณส่งชิ้นส่วนมาให้เรา',
      wepart: 'ครบวงจร',
      wepartFull: 'เราจัดหาชิ้นส่วนให้',
      wepartDesc: 'เราดูแลการจัดซื้อให้ทั้งหมด',
      both: 'แบบผสม',
      bothFull: 'จัดหาบางส่วน',
      bothDesc: 'คุณส่งบางส่วน เราหาเพิ่มให้',
    },
  };

  const t = translations[language] || translations.en;

  const options = [
    { id: 'youpart', label: t.youpart, full: t.youpartFull, desc: t.youpartDesc, icon: <FaBoxOpen />, color: '#000000', bgLight: 'bg-black text-white' },
    { id: 'wepart', label: t.wepart, full: t.wepartFull, desc: t.wepartDesc, icon: <FaIndustry />, color: '#000000', bgLight: 'bg-black text-white' },
    { id: 'both', label: t.both, full: t.bothFull, desc: t.bothDesc, icon: <FaExchangeAlt />, color: '#000000', bgLight: 'bg-black text-white' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 font-sans antialiased selection:bg-black selection:text-white">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 py-8 mb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-black transition-colors mb-8 w-fit uppercase tracking-[0.2em]"
          >
            <FaArrowLeft /> BACK
          </button>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-3xl shrink-0">
              <FaLayerGroup />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter mb-1 uppercase">{t.title}</h1>
              <p className="text-sm text-slate-500 font-medium tracking-wide m-0">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector - แก้ปัญหา "ก้อนดำทับ" */}
      <div className="max-w-3xl mx-auto mb-10 md:mb-16">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex relative overflow-hidden">
          {options.map((opt) => {
            const isActive = activeCart === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveCart(opt.id)}
                className="relative flex-1 py-5 flex flex-col items-center justify-center transition-all duration-300 z-10 outline-none"
              >
                {/* พื้นหลังที่วิ่งตาม (LayoutId) */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className={`absolute inset-0 bg-black rounded-2xl z-0 shadow-lg shadow-black/20`}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}

                {/* ไอคอนและข้อความ */}
                <span className={`text-xl md:text-2xl mb-1 relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {opt.icon}
                </span>
                <span className={`text-[10px] md:text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info Badge */}
        <div className="mt-6 flex justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.div key={activeCart} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <FaCheckCircle className="shrink-0 text-black text-sm" />
                <span className="text-xs md:text-xs font-black text-black uppercase tracking-widest whitespace-nowrap">{options.find(o => o.id === activeCart).full}</span>
              </div>
              <span className="text-xs md:text-xs font-black text-slate-300 uppercase tracking-widest">{options.find(o => o.id === activeCart).desc}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-slate-100 min-h-[500px] overflow-hidden relative">
          {/* Top border effect */}
          <div className="h-1.5 w-full bg-black" />
          <div className="p-4 md:p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div key={activeCart} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                {activeCart === 'youpart' && <OrderassemblyCartYouSupplyPartScreen />}
                {activeCart === 'wepart' && <OrderassemblyCartWeSupplyPartScreen />}
                {activeCart === 'both' && <OrderassemblyCartYouSupplySomePartWedotherestScreen />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderassemblySetScreen;