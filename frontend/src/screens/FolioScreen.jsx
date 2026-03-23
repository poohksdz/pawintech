import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useGetFoliosQuery } from "../slices/folioSlice";

const FolioScreen = () => {
  const { pageNumber } = useParams();
  const { language } = useSelector((state) => state.language);
  const [scrollDir, setScrollDir] = useState("down");
  const { data, isLoading, error } = useGetFoliosQuery({ pageNumber });

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setScrollDir("down"); // Scrolling Down
      } else {
        setScrollDir("up"); // Scrolling Up
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const translations = {
    en: {
      goBackLbl: 'Home',
      FolioPosts: 'Our Folios',
      Subtitle: 'Explore our latest works and creative projects',
      ReadMore: 'View Project'
    },
    thai: {
      goBackLbl: 'หน้าแรก',
      FolioPosts: 'ผลงานของเรา',
      Subtitle: 'รวบรวมผลงานและโปรเจกต์ต่างๆ ที่เราภาคภูมิใจ',
      ReadMore: 'ดูโปรเจกต์',
    },
  };

  const t = translations[language] || translations.en;

  // Animation Variants สำหรับ Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // ✅ ดักจับข้อมูลว่าเป็น Array หรือ Object จะได้ map ข้อมูลออกมาชัวร์ๆ
  const foliosArray = Array.isArray(data) ? data : (data?.folios || []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#FAFAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#FAFAFB]">
        <div className="bg-rose-50 text-rose-500 px-6 py-4 rounded-xl border border-rose-100 font-bold">
          Error: {error?.data?.message || "Something went wrong"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFB] min-h-screen py-8 md:py-16 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- Header Section --- */}
        <div className="mb-10 md:mb-16 text-center md:text-left">
          <Link
            to='/home'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            {t.goBackLbl}
          </Link>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">
              {t.FolioPosts}
            </span>
          </h1>
          <p className="text-slate-500 text-sm md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
            {t.Subtitle}
          </p>
        </div>

        {/* --- Folios Grid --- */}
        {foliosArray.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            ไม่มีข้อมูลผลงานในขณะนี้
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch"
          >
            {foliosArray.map((folio) => (
              <motion.div variants={itemVariants} key={folio._id || folio.ID} className="h-full">
                <Link
                  to={`/folio/${folio.ID}`}
                  className="group block h-full bg-white rounded-2xl md:rounded-[1.5rem] p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-900/10 transition-all duration-300 flex flex-col"
                >
                  {/* Image Wrapper */}
                  <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-3 sm:mb-5">
                    {/* Overlay ตอน Hover */}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 z-10 transition-colors duration-500"></div>
                    <img
                      src={folio.imageOne || '/images/sample.jpg'}
                      alt={language === 'thai' ? folio.headerThaiOne : folio.headerTextOne}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow px-1">
                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-sm sm:text-lg line-clamp-2 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                      {language === 'thai' ? folio.headerThaiOne : folio.headerTextOne}
                    </h3>

                    {/* Read More Link */}
                    <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-50">
                      <span className="inline-flex items-center text-[11px] sm:text-sm font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                        {t.ReadMore}
                        <HiOutlineArrowNarrowRight className="ml-1 sm:ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FolioScreen;