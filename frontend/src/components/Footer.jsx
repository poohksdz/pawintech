import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  FaPhoneAlt,
  FaFacebook,
  FaLine,
  FaYoutube,
  FaChevronDown,
} from "react-icons/fa";
import { MdEmail, MdContactMail, MdViewCarousel } from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

// API Slices
import { useGetServicesQuery } from "../slices/servicesApiSlice";
import { useGetProductsQuery } from "../slices/productsApiSlice";

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
      quickLinks: "Navigation",
      home: "Home",
      product: "Products",
      service: "Services",
      about: "About Us",
      contact: "Contact",
      companyName: "Pawin Technology Co., Ltd.",
      slogan: "Precision engineering for global electronics.",
      addressHeader: "Location",
      addressText: "124 Soi Rom Klao 24, Min Buri, Bangkok, 10510",
      taxIDLbl: "Tax ID",
      legal: "Precision · Innovation",
      mapHeader: "Our Office",
      newsletter: "Exclusive Insights",
      newsletterSub: "Don't miss out on exclusive updates and offers for our partners.",
      subscribe: "Subscribe",
      placeholder: "Enter your email",
    },
    thai: {
      quickLinks: "เมนูนำทาง",
      home: "หน้าแรก",
      product: "สินค้าแนะนำ",
      service: "บริการของเรา",
      about: "เกี่ยวกับเรา",
      contact: "ติดต่อเรา",
      companyName: "บริษัท ภาวินท์เทคโนโลยี จำกัด",
      slogan: "ผู้เชี่ยวชาญด้านนวัตกรรมและวิศวกรรมอิเล็กทรอนิกส์",
      addressHeader: "ที่ตั้งสำนักงาน",
      addressText: "124 ซอยร่มเกล้า 24 กรุงเทพฯ 10510",
      taxIDLbl: "เลขประจำตัวผู้เสียภาษี",
      legal: "ความแม่นยำ · นวัตกรรม",
      mapHeader: "แผนที่",
      newsletter: "รับสิทธิประโยชน์พิเศษ",
      newsletterSub: "ไม่พลาดทุกความเคลื่อนไหวและข้อเสนอสุดเอ็กซ์คลูซีฟสำหรับพาร์ทเนอร์ของเรา",
      subscribe: "สมัครสมาชิก",
      placeholder: "ใส่อีเมลของคุณ",
    },
  }[language || "en"];

  // Accordion state for mobile
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const AccordionHeader = ({ id, title, icon: Icon }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-5 border-b border-zinc-900 lg:hidden text-left group"
    >
      <div className="flex items-center gap-4">
        <span className="text-blue-500/80 group-hover:text-blue-400 transition-colors">
          {Icon}
        </span>
        <span className="text-[11px] font-bold uppercase text-white tracking-[0.2em] transition-colors">
          {title}
        </span>
      </div>
      <FaChevronDown
        size={10}
        className={`transition-all duration-500 ${openSection === id ? "rotate-180 text-blue-400" : "text-zinc-600"}`}
      />
    </button>
  );

  return (
    <footer className="relative bg-[#020617] text-zinc-400 mt-32 pt-20 pb-12 border-t border-blue-900/30 overflow-hidden selection:bg-blue-500/20 print:hidden">
      {/* --- Ambient Background Glow --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* --- Top Section: Brand & Newsletter --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">
          <div className="lg:col-span-5">
            <Link to="/" className="inline-block group mb-8">
              <h2 className="text-white text-3xl font-black uppercase tracking-[-0.04em] leading-[0.85] transition-all duration-500 group-hover:text-blue-400">
                PAWIN
                <span className="block text-zinc-700 tracking-[0.1em] text-sm mt-1 transition-colors group-hover:text-zinc-500">
                  TECHNOLOGY
                </span>
              </h2>
            </Link>
            <p className="text-[14px] leading-relaxed text-zinc-500 mb-10 max-w-sm font-medium">
              {t.slogan}
            </p>
            <div className="flex gap-4">
              {[
                {
                  icon: <FaFacebook size={16} />,
                  link: "https://www.facebook.com/@electotronixth",
                  color: "hover:bg-blue-600 hover:shadow-blue-500/20",
                },
                {
                  icon: <FaLine size={16} />,
                  link: "https://line.me/ti/p/@pwtech",
                  color: "hover:bg-emerald-600 hover:shadow-emerald-500/20",
                },
                {
                  icon: <FaYoutube size={16} />,
                  link: "https://www.youtube.com/@pawintechnology/featured",
                  color: "hover:bg-rose-600 hover:shadow-rose-500/20",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center transition-all duration-500 text-zinc-400 hover:text-white hover:-translate-y-1 shadow-lg ${social.color}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 lg:block border-l border-zinc-900/50 hidden" />

          <div className="lg:col-span-6 flex flex-col justify-center">
            <h3 className="text-white text-lg font-bold mb-3 tracking-tight">
              {t.newsletter}
            </h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-md">
              {t.newsletterSub}
            </p>
            <form
              className="relative flex items-center max-w-md group"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={t.placeholder}
                className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-2xl py-4 pl-6 pr-32 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-500 placeholder:text-zinc-600 hover:bg-zinc-900/50"
              />
              <button className="absolute right-2 bg-white text-black text-[12px] font-black uppercase tracking-wider px-4 md:px-6 py-2.5 rounded-xl transition-all duration-500 hover:bg-blue-500 hover:text-white active:scale-95 shadow-xl">
                {t.subscribe}
              </button>
            </form>
          </div>
        </div>

        {/* --- Main Navigation Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-12 gap-y-0 lg:gap-y-12 pb-16 border-t border-zinc-900/50 pt-16">
          {/*   Navigation */}
          <div className="lg:block">
            <AccordionHeader
              id="links"
              title={t.quickLinks}
              icon={<MdViewCarousel size={18} />}
            />
            <AnimatePresence initial={false}>
              {(openSection === "links" ||
                (typeof window !== "undefined" &&
                  window.innerWidth >= 1024)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="py-4 md:py-8 lg:py-0 overflow-hidden"
                  >
                    <div className="lg:mb-8 hidden lg:block">
                      <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">
                        {t.quickLinks}
                      </h4>
                    </div>
                    <ul className="space-y-4">
                      {[
                        { to: "/", label: t.home },
                        { to: "/product", label: t.product },
                        { to: "/service", label: t.service },
                        { to: "/about", label: t.about },
                        { to: "/contact", label: t.contact },
                      ].map((link, i) => (
                        <li key={i}>
                          <Link
                            to={link.to}
                            className="text-[14px] font-medium text-zinc-500 hover:text-white transition-all duration-300 flex items-center gap-2 group"
                          >
                            <span className="w-0 h-px bg-blue-500 transition-all duration-500 group-hover:w-4" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/*   Contact */}
          <div className="lg:block">
            <AccordionHeader
              id="contact"
              title={t.contact}
              icon={<MdContactMail size={18} />}
            />
            <AnimatePresence initial={false}>
              {(openSection === "contact" ||
                (typeof window !== "undefined" &&
                  window.innerWidth >= 1024)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="py-4 md:py-8 lg:py-0 overflow-hidden"
                  >
                    <div className="lg:mb-8 hidden lg:block">
                      <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">
                        {t.contact}
                      </h4>
                    </div>
                    <div className="space-y-6 text-[14px]">
                      <a
                        href="tel:0992263277"
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-colors group-hover:bg-blue-500/10 group-hover:border-blue-500/30">
                          <FaPhoneAlt size={10} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <span className="font-semibold text-zinc-500 group-hover:text-white transition-colors">099 226 3277</span>
                      </a>
                      <a
                        href="mailto:contact@pawin-tech.com"
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-colors group-hover:bg-blue-500/10 group-hover:border-blue-500/30">
                          <MdEmail size={12} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <span className="font-semibold text-zinc-500 group-hover:text-white transition-colors">contact@pawin-tech.com</span>
                      </a>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/*   Address */}
          <div className="lg:block">
            <AccordionHeader
              id="location"
              title={t.addressHeader}
              icon={<HiOutlineLocationMarker size={18} />}
            />
            <AnimatePresence initial={false}>
              {(openSection === "location" ||
                (typeof window !== "undefined" &&
                  window.innerWidth >= 1024)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="py-4 md:py-8 lg:py-0 overflow-hidden"
                  >
                    <div className="lg:mb-8 hidden lg:block">
                      <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">
                        {t.addressHeader}
                      </h4>
                    </div>
                    <p className="text-zinc-500 text-[14px] leading-relaxed mb-6 font-medium">
                      {t.addressText}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest px-2 py-1 bg-zinc-900 border border-zinc-800 rounded">
                        {t.taxIDLbl}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        0105562141221
                      </span>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Map */}
          <div className="lg:block">
            <AccordionHeader
              id="map"
              title={t.mapHeader}
              icon={<HiOutlineLocationMarker size={18} />}
            />
            <AnimatePresence initial={false}>
              {(openSection === "map" ||
                (typeof window !== "undefined" &&
                  window.innerWidth >= 1024)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="py-4 md:py-8 lg:py-0 overflow-hidden"
                  >
                    <div className="lg:mb-8 hidden lg:block">
                      <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">
                        {t.mapHeader}
                      </h4>
                    </div>
                    <div className="relative group">
                      <div className="rounded-2xl overflow-hidden border border-zinc-900 h-28 lg:h-32 transition-all duration-700 group-hover:border-blue-500/30 group-hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.494839349668!2d100.7409649!3d13.7739481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311d65002f271673%3A0x99007c7b8a670c94!2z4Lit4Liy4LiH4Lih4LmB4Lil4Lix4LiZ4Lib4LmJ4Liz4LiB4LiyIOC5gOC4mOC5gOC4oeC4l-C4oiDguJrguLLguKXguLHguYHguK3guIfguIHguLHguILguKfguLUg4LiY4Li34Lij4LioIOC4lOC5gOC4lA!5e0!3m2!1sen!2sth!4v1694973134532!5m2!1sen!2sth"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          title="Google Maps Location"
                          className="transition-all duration-1000 group-hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] opacity-80 group-hover:opacity-100"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="pt-10 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
          <p className="text-zinc-600 text-[11px] font-medium tracking-tight">
            &copy; {currentYear}{" "}
            <span className="text-zinc-400 font-bold ml-1">{t.companyName}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-zinc-900" />
            <span className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">{t.legal}</span>
            <span className="h-px w-8 bg-zinc-900" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
