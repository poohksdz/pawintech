import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaShieldAlt,
  FaLightbulb,
  FaTools,
  FaArrowRight,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Loader from "../components/Loader";
import Message from "../components/Message";

import {
  useGetServiceDetailsQuery,
  useGetServicesQuery,
} from "../slices/servicesApiSlice";

const staticOptions = {
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
};

const ServiceScreen = () => {
  const { id: serviceID } = useParams();
  const { language } = useSelector((state) => state.language);

  const {
    data: service,
    isLoading,
    error,
  } = useGetServiceDetailsQuery(serviceID, staticOptions);
  const { data: services } = useGetServicesQuery(
    { pageNumber: 1 },
    staticOptions,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [serviceID]);

  const t = {
    back: language === "thai" ? "ย้อนกลับ" : "Back",
    features: language === "thai" ? "จุดเด่นบริการ" : "Key Features",
    process: language === "thai" ? "ขั้นตอนการทำงาน" : "Our Process",
    contact: language === "thai" ? "ปรึกษาเราตอนนี้" : "Contact Expert",
    related: language === "thai" ? "บริการที่เกี่ยวข้อง" : "Related Services",
    viewAll: language === "thai" ? "ดูทั้งหมด" : "View All",
  };

  // --- Premium Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  if (isLoading)
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto px-4 py-12">
        <Message variant="danger">
          {error?.data?.message || "Error loading service"}
        </Message>
      </div>
    );

  return (
    <motion.div
      key={serviceID}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-[#FAFAFB] dark:bg-black min-h-screen pb-16 font-sans selection:bg-indigo-500 dark:selection:bg-zinc-800 selection:text-white transition-colors duration-500"
    >
      {/* --- Premium Hero Section --- */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-950/20 border-b border-gray-100 dark:border-zinc-800 py-16 lg:py-24 mb-16 transition-colors">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-full blur-3xl opacity-70 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl opacity-70 z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div variants={itemFadeUp}>
            <Link
              to="/service"
              className="group inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full shadow-sm hover:shadow-md mb-10 transition-all duration-300"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="order-2 lg:order-1 lg:w-1/2 w-full text-center lg:text-left">
              <motion.div variants={itemFadeUp} className="space-y-6">
                <span className="inline-block px-4 py-1.5 rounded-full font-semibold text-xs uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-sm transition-colors">
                  {service.deploymentTypes || "SERVICE"}
                </span>

                <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.15] tracking-tight transition-colors">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-300 dark:to-slate-200">
                    {language === "thai"
                      ? service.headerThaiOne
                      : service.headerTextOne}
                  </span>
                </h1>

                <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0 transition-colors">
                  {language === "thai"
                    ? service.bodyTextThaiOne
                    : service.bodyTextOne}
                </p>

                <div className="pt-6 flex justify-center max-w-2xl mx-auto lg:mx-0">
                  <Link
                    to="/contact"
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-lg rounded-full px-4 md:px-10 py-4 shadow-lg shadow-indigo-500/30 font-semibold transition-all duration-300 hover:-translate-y-1"
                  >
                    {t.contact}
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2 lg:w-1/2 w-full relative">
              <motion.div
                variants={itemFadeUp}
                className="relative z-10 w-full max-w-lg mx-auto"
              >
                {/* Floating Image Effect */}
                <div className="animate-[float_6s_ease-in-out_infinite] shadow-2xl shadow-indigo-900/10 rounded-[2.5rem] overflow-hidden border-[6px] border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 transition-colors">
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
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-12">
        {/* --- Key Features Section --- */}
        <section className="mb-20">
          <motion.div
            variants={itemFadeUp}
            className="mb-10 text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <h3 className="font-extrabold text-3xl text-slate-900 dark:text-white transition-colors">
              {t.features}
            </h3>
            <div className="w-16 h-1.5 bg-indigo-600 rounded-full mt-4"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                icon: <FaShieldAlt />,
                t1: "High Performance",
                t2: "ประสิทธิภาพสูง",
                desc: "Optimized for speed, security, and absolute reliability in every aspect.",
              },
              {
                icon: <FaTools />,
                t1: "Expert Support",
                t2: "ดูแลโดยทีมวิศวกร",
                desc: "Professional technical team ready to assist and monitor your system.",
              },
              {
                icon: <FaLightbulb />,
                t1: "Custom Solution",
                t2: "ปรับแต่งตามหน้างาน",
                desc: "Flexible solutions specifically tailored to match your business requirements.",
              },
            ].map((f, i) => (
              <motion.div variants={itemFadeUp} key={i}>
                <div className="bg-white dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800 rounded-3xl p-4 md:p-8 h-full shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-2 group">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {f.icon}
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-xl transition-colors">
                    {language === "thai" ? f.t2 : f.t1}
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base transition-colors">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- Process Timeline Section --- */}
        <section className="mb-20 py-16 px-4 md:px-6 lg:px-12 bg-white dark:bg-zinc-950/20 rounded-[3rem] shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
          <motion.div variants={itemFadeUp} className="text-center mb-16">
            <h3 className="font-extrabold text-3xl text-slate-900 dark:text-white transition-colors">
              {t.process}
            </h3>
            <div className="w-16 h-1.5 bg-indigo-600 rounded-full mt-4 mx-auto"></div>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Dashed Connecting Line */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 dark:border-zinc-800 z-0 transition-colors"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:gap-10 lg:gap-6 justify-center">
              {[
                { s: "01", t: language === "thai" ? "วางแผน" : "Plan" },
                { s: "02", t: language === "thai" ? "ออกแบบ" : "Design" },
                { s: "03", t: language === "thai" ? "พัฒนา" : "Develop" },
                { s: "04", t: language === "thai" ? "ส่งมอบ" : "Deliver" },
              ].map((step, i) => (
                <div key={i} className="text-center relative z-10 group">
                  <motion.div variants={itemFadeUp}>
                    <div className="w-14 h-14 mx-auto bg-white dark:bg-zinc-900 border-[3px] border-indigo-100 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold text-xl mb-5 shadow-sm transition-all duration-300 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:-translate-y-1">
                      {step.s}
                    </div>
                    <h6 className="font-bold text-slate-900 dark:text-white text-lg transition-colors">
                      {step.t}
                    </h6>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Related Services Section --- */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h4 className="font-extrabold text-3xl text-slate-900 dark:text-white transition-colors">
                {t.related}
              </h4>
              <div className="w-12 h-1.5 bg-indigo-600 rounded-full mt-4"></div>
            </div>
            <Link
              to="/service"
              className="hidden sm:flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors group"
            >
              {t.viewAll}{" "}
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6">
              {services?.services
                ?.filter((s) => s._id !== service._id)
                .slice(0, 4)
                .map((item) => (
                  <motion.div
                    key={item._id}
                    variants={itemFadeUp}
                    className="min-w-[280px] md:min-w-0"
                  >
                    <Link to={`/${item.ID}`} className="block group">
                      <div className="bg-white dark:bg-zinc-900/40 rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-3 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-900/10 dark:hover:shadow-indigo-900/5">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden relative mb-4">
                          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent z-10 transition-colors duration-500"></div>
                          <img
                            src={
                              typeof item.imageOne === "string"
                                ? item.imageOne
                                : item.imageOne?.image ||
                                item.imageOne?.path ||
                                item.imageOne?.url ||
                                "/images/sample.jpg"
                            }
                            alt="service"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                        <div className="px-3 pb-3 flex flex-col h-full">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                            {item.deploymentTypes || "Service"}
                          </span>
                          <h5 className="font-bold text-slate-900 dark:text-white text-lg leading-snug line-clamp-2 transition-colors">
                            {language === "thai"
                              ? item.headerThaiOne
                              : item.headerTextOne}
                          </h5>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Mobile View All Button */}
          <div className="mt-4 text-center sm:hidden">
            <Link
              to="/service"
              className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-indigo-50 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-bold transition-colors"
            >
              {t.viewAll}
            </Link>
          </div>
        </section>
      </div>

      {/* Tailwind Custom Animation (Float) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      ` }} />
    </motion.div>
  );
};

export default ServiceScreen;
