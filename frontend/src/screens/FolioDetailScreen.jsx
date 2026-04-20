import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import Loader from "../components/Loader";
import Message from "../components/Message";
import {
  useGetFolioDetailsQuery,
  useGetFoliosQuery,
} from "../slices/folioSlice";

// --- Static Configs ---
const TRANSLATIONS = {
  en: {
    goBackLbl: "Go Back",
    folioHeaderNoteContent: "More Projects",
    viewProject: "Details",
  },
  thai: {
    goBackLbl: "ย้อนกลับ",
    folioHeaderNoteContent: "โครงการอื่นๆ",
    viewProject: "รายละเอียด",
  },
};

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FolioDetailScreen = () => {
  const { id: folioId, pageNumber } = useParams();
  const { language } = useSelector((state) => state.language);
  const isThai = language === "thai";
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const { data: folio, isLoading, error } = useGetFolioDetailsQuery(folioId);
  const { data: foliosListData } = useGetFoliosQuery({ pageNumber });

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );

  // หากเกิด Error 500 จะแสดง Message สีแดงและปุ่มให้กดกลับ
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Message variant="danger">
          {error?.data?.message ||
            "Server Error (500): ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบ Backend"}
        </Message>
        <Link
          to="/folio"
          className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 font-bold"
        >
          <FaArrowLeft /> กลับไปหน้ารวมผลงาน
        </Link>
      </div>
    );

  const images = [folio?.imageOne, folio?.imageTwo, folio?.imageThree].filter(
    Boolean,
  );
  const foliosArray = Array.isArray(foliosListData)
    ? foliosListData
    : foliosListData?.folios || [];
  const relatedFolios = foliosArray
    .filter((f) => String(f.ID) !== String(folioId))
    .slice(0, 4);

  return (
    <div className="bg-[#FAFAFB] dark:bg-black min-h-screen py-4 md:py-6 md:py-12 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- Top Navigation --- */}
        <div className="mb-6 lg:mb-12">
          <Link
            to="/folio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs md:text-sm font-bold text-slate-600 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
          >
            <FaArrowLeft /> {t.goBackLbl}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-24 mb-16 items-start">
          {/* Gallery ด้านซ้าย */}
          <div className="lg:col-span-7 space-y-6">
            {images.map((img, idx) => (
              <img
                src={
                  typeof img === "string"
                    ? img
                    : img?.image ||
                    img?.path ||
                    img?.url ||
                    "/images/sample.jpg"
                }
                alt={`Work detail ${idx + 1}`}
                className="w-full h-auto object-cover"
              />
            ))}
          </div>

          {/* รายละเอียดด้านขวา (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <motion.div variants={FADE_UP} initial="hidden" animate="visible">
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                {isThai ? folio?.headerThaiOne : folio?.headerTextOne}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                {isThai ? folio?.bodyTextThaiOne : folio?.bodyTextOne}
              </p>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Project Info</h4>
                <div className="text-sm space-y-3">
                  <div className="flex justify-between border-b dark:border-zinc-800 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Category</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {folio?.category || "General"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Client</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {folio?.clientName || "Confidential"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- Related Folios (4 คอลัมน์บนมือถือตามสั่ง) --- */}
        {relatedFolios.length > 0 && (
          <div className="border-t border-slate-200 dark:border-zinc-800 pt-10">
            <h2 className="text-lg md:text-2xl font-bold mb-6 text-slate-900 dark:text-white">
              {t.folioHeaderNoteContent}
            </h2>
            <div className="grid grid-cols-4 gap-2 md:gap-6">
              {relatedFolios.map((f) => (
                <Link
                  key={f.ID}
                  to={`/${f.ID}`}
                  className="group bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors"
                >
                  <img
                    src={
                      typeof f.imageOne === "string"
                        ? f.imageOne
                        : f.imageOne?.image ||
                        f.imageOne?.path ||
                        f.imageOne?.url ||
                        "/images/sample.jpg"
                    }
                    alt="Related project"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-1.5 md:p-4">
                    <h4 className="text-[9px] md:text-sm font-bold truncate text-slate-900 dark:text-white">
                      {isThai ? f.headerThaiOne : f.headerTextOne}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolioDetailScreen;
