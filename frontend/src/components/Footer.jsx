import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
    FaPhoneAlt, FaFacebook, FaLine, FaYoutube, FaChevronDown
} from 'react-icons/fa';
import { AiFillAppstore } from "react-icons/ai";
import {
    MdEmail, MdDesignServices, MdContactMail, MdViewCarousel
} from "react-icons/md";
import { TiInfo } from "react-icons/ti";
import { HiOutlineLocationMarker, HiOutlineIdentification } from "react-icons/hi";
import { motion, AnimatePresence } from 'framer-motion';

// API Slices
import { useGetServicesQuery } from '../slices/servicesApiSlice';
import { useGetProductsQuery } from '../slices/productsApiSlice';

const Footer = () => {
    const { pageNumber } = useParams();
    const { language } = useSelector((state) => state.language);
    const location = useLocation();
    const currentYear = new Date().getFullYear();

    // Fetching data
    useGetServicesQuery({ pageNumber });
    useGetProductsQuery({ pageNumber });

    // Translations
    const t = {
        en: {
            quickLinks: 'Navigation',
            home: 'Home',
            product: 'Products',
            service: 'Services',
            about: 'About Us',
            contact: 'Contact',
            companyName: 'Pawin Technology Co., Ltd.',
            slogan: 'Innovation and precision engineering for global electronics.',
            addressHeader: 'Location',
            addressText: '139/65 Soi Romklao 24, Bangkok 10510.',
            taxIDLbl: 'Tax ID',
            legal: 'Precision · Innovation · Sourcing',
            mapHeader: 'Our Office'
        },
        thai: {
            quickLinks: 'เมนูนำทาง',
            home: 'หน้าแรก',
            product: 'สินค้าแนะนำ',
            service: 'บริการของเรา',
            about: 'เกี่ยวกับเรา',
            contact: 'ติดต่อเรา',
            companyName: 'บริษัท ภาวินท์เทคโนโลยี จำกัด',
            slogan: 'ผู้เชี่ยวชาญด้านนวัตกรรมและวิศวกรรมอิเล็กทรอนิกส์ระดับสากล',
            addressHeader: 'ที่ตั้งสำนักงาน',
            addressText: '139/65 ซอยร่มเกล้า 24 กรุงเทพฯ 10510',
            taxIDLbl: 'เลขประจำตัวผู้เสียภาษี',
            legal: 'ความแม่นยำ · นวัตกรรม · การจัดหา',
            mapHeader: 'ที่ตั้งของเรา'
        }
    }[language || 'en'];

    // Accordion state for mobile
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const AccordionHeader = ({ id, title, icon: Icon }) => (
        <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between py-4 border-b border-slate-900 lg:hidden text-left"
        >
            <div className="flex items-center gap-3">
                <span className="text-indigo-500">{Icon}</span>
                <span className="text-xs font-black uppercase text-white tracking-widest">{title}</span>
            </div>
            <FaChevronDown
                size={10}
                className={`transition-transform duration-300 ${openSection === id ? 'rotate-180' : ''} text-slate-600`}
            />
        </button>
    );

    return (
        <footer className="bg-slate-950 text-slate-400 mt-20 pt-12 pb-8 border-t border-slate-900 selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto px-6">

                {/* --- Desktop: Compact 4-Column Grid | Mobile: Accordions --- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-0 lg:gap-y-12 pb-12">

                    {/* 🏢 Col 1: Brand (Always Visible) */}
                    <div className="py-6 lg:py-0">
                        <h2 className="text-white text-xl font-black uppercase tracking-tighter mb-4">
                            PAWIN<br />TECHNOLOGY
                        </h2>
                        <p className="text-xs leading-relaxed text-slate-500 mb-6 lg:max-w-[200px]">
                            {t.slogan}
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: <FaFacebook size={14} />, link: 'https://www.facebook.com/@electotronixth', color: 'hover:text-blue-500' },
                                { icon: <FaLine size={14} />, link: 'https://line.me/ti/p/@pwtech', color: 'hover:text-emerald-500' },
                                { icon: <FaYoutube size={14} />, link: 'https://www.youtube.com/@pawintechnology/featured', color: 'hover:text-rose-500' }
                            ].map((social, i) => (
                                <a key={i} href={social.link} target="_blank" rel="noopener noreferrer"
                                    className={`w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center transition-colors ${social.color}`}>
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* 🔗 Col 2: Navigation */}
                    <div className="lg:block">
                        <AccordionHeader id="links" title={t.quickLinks} icon={<MdViewCarousel size={16} />} />
                        <AnimatePresence initial={false}>
                            {(openSection === 'links' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-3 py-4 lg:py-0 overflow-hidden"
                                >
                                    <li className="lg:mb-6 hidden lg:block">
                                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest opacity-30">{t.quickLinks}</h4>
                                    </li>
                                    {[
                                        { to: '/', label: t.home },
                                        { to: '/product', label: t.product },
                                        { to: '/service', label: t.service },
                                        { to: '/about', label: t.about },
                                        { to: '/contact', label: t.contact }
                                    ].map((link, i) => (
                                        <li key={i}>
                                            <Link to={link.to} className="text-[13px] font-bold hover:text-indigo-400 transition-colors">
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 📍 Col 3: Contact */}
                    <div className="lg:block">
                        <AccordionHeader id="contact" title={t.contact} icon={<MdContactMail size={16} />} />
                        <AnimatePresence initial={false}>
                            {(openSection === 'contact' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-4 py-6 lg:py-0 overflow-hidden"
                                >
                                    <div className="lg:mb-6 hidden lg:block">
                                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest opacity-30">{t.contact}</h4>
                                    </div>
                                    <div className="space-y-4 text-[13px]">
                                        <a href="tel:0992263277" className="flex items-center gap-3 hover:text-white transition-colors">
                                            <FaPhoneAlt size={10} className="text-indigo-500" />
                                            <span className="font-bold">099 226 3277</span>
                                        </a>
                                        <a href="mailto:contact@pawin-tech.com" className="flex items-center gap-3 hover:text-white transition-colors">
                                            <MdEmail size={12} className="text-indigo-500" />
                                            <span className="font-bold">contact@pawin-tech.com</span>
                                        </a>
                                        <div className="pt-2">
                                            <p className="text-slate-500 leading-relaxed mb-2">{t.addressText}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t.taxIDLbl}</span>
                                                <span className="font-mono text-xs text-slate-400">0105562141221</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 🗺️ Col 4: Map */}
                    <div className="lg:block">
                        <AccordionHeader id="map" title={t.mapHeader} icon={<HiOutlineLocationMarker size={16} />} />
                        <AnimatePresence initial={false}>
                            {(openSection === 'map' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="py-6 lg:py-0 overflow-hidden"
                                >
                                    <div className="lg:mb-6 hidden lg:block">
                                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest opacity-30">{t.mapHeader}</h4>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-slate-900 lg:h-32 grayscale hover:grayscale-0 transition-all duration-700">
                                        <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.494839349668!2d100.7409649!3d13.7739481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311d65002f271673%3A0x99007c7b8a670c94!2z4Lit4Liy4LiH4Lih4LmB4Lil4Lix4LiZ4Lib4LmJ4Liz4LiB4LiyIOC5gOC4mOC5gOC4oeC4l-C4oiDguJrguLLguKXguLHguYHguK3guIfguIHguLHguILguKfguLUg4LiY4Li34Lij4LioIOC4lOC5gOC4lA!5e0!3m2!1sen!2sth!4v1694973134532!5m2!1sen!2sth"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen=""
                                            loading="lazy"
                                            title="Google Maps Location"
                                            className="opacity-50 hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* --- Bottom Bar --- */}
                <div className="pt-8 border-t border-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                    <p className="text-slate-600">
                        &copy; {currentYear} <span className="text-slate-400">{t.companyName}</span>
                    </p>
                    <div className="flex gap-6 text-slate-700">
                        <span className="hidden md:block">{t.legal}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
