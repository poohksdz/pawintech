import React from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { motion } from "framer-motion";
import { useGetServicesQuery } from "../slices/servicesApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";

const staticOptions = {
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
};

const ServiceAllScreen = () => {
  const { pageNumber = 1 } = useParams();
  const { language } = useSelector((state) => state.language);

  const { data, isLoading, error } = useGetServicesQuery(
    { pageNumber },
    staticOptions,
  );

  const translations = {
    en: {
      goBackLbl: "Home",
      ServicePosts: "Our Services",
      Subtitle: "Professional electronic and software solutions",
      ReadMore: "Details",
    },
    thai: {
      goBackLbl: "หน้าแรก",
      ServicePosts: "บริการของเรา",
      Subtitle: "รับออกแบบพัฒนาอิเล็กทรอนิกส์และซอฟต์แวร์",
      ReadMore: "รายละเอียด",
    },
  };

  const t = translations[language] || translations.en;

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#FAFAFB] dark:bg-black transition-colors duration-500">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Message variant="danger">{error?.data?.message || "Error"}</Message>
      </div>
    );

  return (
    <div className="bg-[#FAFAFB] dark:bg-black min-h-screen py-6 md:py-16 font-sans selection:bg-indigo-500 dark:selection:bg-zinc-800 selection:text-white transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- Header Section --- */}
        <div className="mb-8 md:mb-16 text-center md:text-left">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 md:mb-6 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            {t.goBackLbl}
          </Link>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 md:mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-400">
              {t.ServicePosts}
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed font-normal">
            {t.Subtitle}
          </p>
        </div>

        {/* --- Services Grid --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 items-stretch"
        >
          {data?.services?.map((service) => (
            <motion.div
              variants={itemVariants}
              key={service.ID}
              className="h-full"
            >
              <Link
                to={`/service/${service.ID}`}
                className="group block h-full bg-white dark:bg-zinc-900/40 rounded-2xl md:rounded-[1.5rem] p-2.5 sm:p-4 border border-slate-50 dark:border-zinc-800/50 shadow-sm hover:shadow-[0_12px_30px_rgba(79,70,229,0.1)] dark:hover:shadow-[0_12px_30px_rgba(79,70,229,0.05)] transition-all duration-300 flex flex-col"
              >
                {/* Image Wrapper - ใช้ 4:3 บนทุกขนาดจอเพื่อไม่ให้ยืดความสูง */}
                <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-3 sm:mb-5">
                  <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent z-10 transition-colors duration-500"></div>
                  <img
                    src={
                      typeof service.imageOne === "string"
                        ? service.imageOne
                        : service.imageOne?.image ||
                        service.imageOne?.path ||
                        service.imageOne?.url ||
                        "/images/sample.jpg"
                    }
                    alt={service.headerTextOne}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow px-1">
                  {/* Badge */}
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-3">
                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[9px] sm:text-xs uppercase tracking-wider truncate">
                      {service.deploymentTypes || "SERVICE"}
                    </span>
                  </div>

                  {/* Title - ปรับให้เล็กลงบนมือถือ */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg line-clamp-2 mb-1 sm:mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {language === "thai"
                      ? service.headerThaiOne
                      : service.headerTextOne}
                  </h3>

                  {/* Description - ซ่อนบนจอมือถือ (hidden) และโชว์เฉพาะจอ sm ขึ้นไป */}
                  <p className="hidden sm:line-clamp-2 md:line-clamp-3 text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed flex-grow font-normal">
                    {language === "thai"
                      ? service.bodyTextThaiOne
                      : service.bodyTextOne}
                  </p>

                  {/* Read More Link */}
                  <div className="mt-auto pt-2 border-t border-slate-50 dark:border-zinc-800/50">
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

        {/* --- Pagination --- */}
        {data?.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 md:mt-16 pb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[...Array(data.pages).keys()].map((x) => {
              const isActive = x + 1 === data.page;
              return (
                <Link
                  key={x + 1}
                  to={`/service/page/${x + 1}`}
                  className={`min-w-[36px] md:min-w-[40px] h-9 md:h-10 px-3 flex items-center justify-center rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200"
                    }`}
                >
                  {x + 1}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceAllScreen;
