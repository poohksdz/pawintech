import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaArrowLeft, FaShoppingBag, FaMicrochip,
    FaPuzzlePiece, FaCopy, FaRobot
} from 'react-icons/fa';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// Import Components
import Meta from '../components/Meta';
import Loader from '../components/Loader';

// Lazy load sub-screens to prevent potential circular dependency initialization issues
const OrderPCBCartScreen = React.lazy(() => import('./OrderPCB/OrderPCBCartScreen'));
const OrderAssemblyCartScreen = React.lazy(() => import('./OrderAssembly/OrderAssemblyCartScreen'));
const OrderProductCartScreen = React.lazy(() => import('./OrderProductCartScreen'));
const CustomPCBCartScreen = React.lazy(() => import('./CustomPCB/CustomPCBCartScreen'));
const CopyPCBCartScreen = React.lazy(() => import('./CopyPCB/CopyPCBCartScreen'));

const CartScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeCart, setActiveCart] = useState('productcart');
    const { language } = useSelector((state) => state.language);

    const t = {
        en: { title: 'Shopping Cart', productCart: 'Products', pcbCart: 'PCB Order', customPCBCart: 'Custom PCB', copyPCBCart: 'Copy PCB', assemblyCart: 'Assembly' },
        thai: { title: 'ตะกร้าสินค้า', productCart: 'สินค้าทั่วไป', pcbCart: 'สั่งทำ PCB', customPCBCart: 'กำหนดเอง', copyPCBCart: 'ก็อปปี้ PCB', assemblyCart: 'งานประกอบ' }
    }[language || 'en'];

    useEffect(() => {
        const subpath = location.pathname.split('/')[2] || 'productcart';
        setActiveCart(subpath);
    }, [location.pathname]);

    const handleTabChange = (key) => {
        if (key && activeCart !== key) {
            setActiveCart(key);
            navigate(`/cart/${key}`);
        }
    };

    const tabs = [
        { key: 'productcart', label: t.productCart, icon: <FaShoppingBag /> },
        { key: 'pcbcart', label: t.pcbCart, icon: <FaMicrochip /> },
        { key: 'custompcbcart', label: t.customPCBCart, icon: <FaPuzzlePiece /> },
        { key: 'copypcbcart', label: t.copyPCBCart, icon: <FaCopy /> },
        { key: 'assemblycart', label: t.assemblyCart, icon: <FaRobot /> },
    ];

    return (
        <div className="min-h-screen bg-[#fdfdfd] py-10 font-sans antialiased text-slate-800 overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto px-4">
                <Meta title={t.title} />

                {/* Header */}
                <header className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-6">
                        <Link to="/product" className="group">
                            <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:border-slate-900 transition-all shadow-sm">
                                <FaArrowLeft size={16} />
                            </div>
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-tight">
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
                <div className="mb-8 md:mb-12">
                    <nav className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 md:justify-center px-4 md:px-0 -mx-4 md:mx-0 pb-3">
                        <LayoutGroup>
                            {tabs.map((tab) => {
                                const isActive = activeCart === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className="relative shrink-0 px-5 sm:px-6 py-3.5 rounded-xl transition-all active:scale-95 flex items-center gap-2.5 overflow-hidden"
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-tab-bg"
                                                className="absolute inset-0 bg-slate-900 z-0"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className={`relative z-10 text-[16px] sm:text-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                            {tab.icon}
                                        </span>
                                        <span className={`relative z-10 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </LayoutGroup>
                    </nav>
                </div>

                {/* Content Area */}
                <main className="min-h-[600px] bg-white rounded-2xl md:rounded-[2.5rem] p-2 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 relative">
                    <React.Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><Loader /></div>}>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={activeCart}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeCart === 'productcart' && <OrderProductCartScreen />}
                                {activeCart === 'pcbcart' && <OrderPCBCartScreen />}
                                {activeCart === 'custompcbcart' && <CustomPCBCartScreen />}
                                {activeCart === 'copypcbcart' && <CopyPCBCartScreen />}
                                {activeCart === 'assemblycart' && <OrderAssemblyCartScreen />}
                            </motion.div>
                        </AnimatePresence>
                    </React.Suspense>
                </main>
            </div>
        </div>
    );
};

export default CartScreen;