import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import { useGetServicesQuery } from "../slices/servicesApiSlice";
import { motion, AnimatePresence } from "framer-motion";

const ServiceScreen = () => {
  const { pageNumber } = useParams();
  const location = useLocation();

  const { data, isLoading } = useGetServicesQuery({
    pageNumber,
  });

  const { language } = useSelector((state) => state.language);

  // เลื่อนหน้าจอขึ้นบนสุดเสมอเมื่อเปลี่ยนหน้า
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const translations = {
    en: {
      TextService: (
        <>
          <h4 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            Our Services
          </h4>
          <p className="mb-8 text-slate-600 leading-relaxed text-indent-8">
            &emsp; &emsp; We specialize in providing comprehensive services in
            designing and manufacturing custom electronics circuits tailored to
            the specific needs of our customers. Our main services include:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
            {data?.services?.map((service, index) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <div className="bg-white rounded-2xl p-4 md:p-6 h-full shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                  <div className="flex justify-center mb-6 h-40 bg-slate-50 rounded-xl p-4">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="max-h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-grow flex flex-col">
                    <h5 className="text-lg font-bold text-slate-800 mb-2">
                      {service.name}
                    </h5>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div>
            <p className="text-slate-600 leading-relaxed text-indent-8">
              &emsp; &emsp; Our services are designed to help customers develop
              products that meet market demands efficiently while reducing costs
              and increasing competitive advantages.
            </p>
          </div>
        </>
      ),
    },
    thai: {
      TextService: (
        <>
          <h4 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            บริการของเรา
          </h4>
          <p className="mb-8 text-slate-600 leading-relaxed text-indent-8">
            &emsp; &emsp;
            เรามีความเชี่ยวชาญในการให้บริการออกแบบและผลิตวงจรอิเล็กทรอนิกส์ที่ปรับแต่งตามความต้องการเฉพาะของลูกค้า
            บริการหลักของเราประกอบด้วย:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
            {data?.services?.map((service, index) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <div className="bg-white rounded-2xl p-4 md:p-6 h-full shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                  <div className="flex justify-center mb-6 h-40 bg-slate-50 rounded-xl p-4">
                    <img
                      src={service.image}
                      alt={service.nameThai}
                      className="max-h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-grow flex flex-col">
                    <h5 className="text-lg font-bold text-slate-800 mb-2">
                      {service.nameThai}
                    </h5>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {service.descriptionThai}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div>
            <p className="text-slate-600 leading-relaxed text-indent-8">
              &emsp; &emsp;
              บริการของเราถูกออกแบบมาเพื่อช่วยลูกค้าในการพัฒนาผลิตภัณฑ์ที่ตอบสนองความต้องการของตลาดได้อย่างมีประสิทธิภาพ
              ในขณะเดียวกันลดต้นทุนและเพิ่มความได้เปรียบในการแข่งขัน
            </p>
          </div>
        </>
      ),
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 md:py-10 font-prompt antialiased">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="py-4 md:py-6 text-lg text-justify text-slate-700">
            {t.TextService}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServiceScreen;
