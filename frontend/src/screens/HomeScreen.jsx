import React from "react";
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import 'animate.css';
import TrackVisibility from 'react-on-screen';
import { FaArrowRight } from "react-icons/fa6";

// Import Slices
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useGetShowcasesQuery } from '../slices/showcasesApiSlice';
import { useGetServicesQuery } from '../slices/servicesApiSlice';
import { useGetBlogsQuery } from "../slices/blogsApiSlice";
import { useGetFoliosQuery } from "../slices/folioSlice";

// Import Components
import Loader from '../components/Loader';
import Paginate from '../components/Paginate';
import ProductCarousel from '../components/ProductCarousel';
import ProductCarousel2 from '../components/ProductCarousel2';
import ProductCarousel3 from "../components/ProductCarousel3";
import ProductCarousel4 from "../components/ProductCarousel4";
import Meta from '../components/Meta';

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();
  const { language } = useSelector((state) => state.language);

  // --- API Fetching ---
  const { data: productData, isLoading: productLoading, error: productError } = useGetProductsQuery({ keyword, pageNumber });
  const { data: blogData, isLoading: blogLoading, error: blogError } = useGetBlogsQuery({ pageNumber });
  const { data: serviceData, isLoading: serviceLoading, error: serviceError } = useGetServicesQuery({ pageNumber });
  const { data: folioData, isLoading: folioLoading, error: folioError } = useGetFoliosQuery({ pageNumber });
  const { data: showcaseData, isLoading: showcaseLoading, error: showcaseError } = useGetShowcasesQuery({ pageNumber });

  const shouldShowCarousel = (presentType) => {
    if (showcaseLoading || showcaseError || !showcaseData) return false;
    return showcaseData.some(item => item.present === presentType);
  };

  const t = {
    en: {
      productsLbl: 'Featured Products', productsSub: 'Our Selection', showAllProduct: 'View All',
      serviceShowCase: 'Our Services', serviceSub: 'Solutions', showAllService: 'View All',
      blogsLbl: 'Latest Articles', blogsSub: 'Updates', showAllBlogs: 'Read More',
      foliosLbl: 'Portfolio', foliosSub: 'Our Works', showAllFolios: 'View Works',
      acknowledge: 'Knowledge Base', ackSub: 'Learn'
    },
    thai: {
      productsLbl: 'สินค้าแนะนำ', productsSub: 'สินค้าที่เราคัดสรร', showAllProduct: 'ดูทั้งหมด',
      serviceShowCase: 'บริการของเรา', serviceSub: 'โซลูชันของเรา', showAllService: 'ดูทั้งหมด',
      blogsLbl: "บทความล่าสุด", blogsSub: "อัปเดตใหม่", showAllBlogs: "อ่านเพิ่มเติม",
      foliosLbl: 'ผลงานของเรา', foliosSub: 'ผลงานที่ผ่านมา', showAllFolios: 'ดูผลงาน',
      acknowledge: "คลังความรู้", ackSub: "เรียนรู้เพิ่มเติม"
    },
  }[language || 'en'];

  // --- Reusable Section Component ---
  const SectionRenderer = ({
    title, subtitle, data, loading, error, basePath, detailPath, linkText, config,
    bgClass = "bg-white", footerComponent = null,
    gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  }) => {
    if (loading) return <div className="py-32 flex justify-center"><Loader size="40px" /></div>;
    if (error || !data) return null;

    const items = Array.isArray(data) ? data : (data?.products || data?.services || data?.folios || data?.blogs || []);
    const filteredItems = items.filter(item => item.showFront === 1 || item.showFront === true).slice(0, 8);

    if (filteredItems.length === 0) return null;

    return (
      <section className={`py-8 md:py-16 lg:py-24 ${bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-2">
              {/* Subtitle: ปรับให้ดูพรีเมียมด้วยการเพิ่ม letter-spacing และสีที่นุ่มขึ้น */}
              <span className="text-black/60 text-[11px] md:text-xs font-bold uppercase tracking-[0.25em] block pl-1">
                {subtitle}
              </span>
              {/* Title: ใช้ฟอนต์หนาพิเศษ และสีดำสนิทเพื่อให้อ่านชัด */}
              <h2 className="text-2xl md:text-4xl lg:text-[2.75rem] font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h2>
            </div>
            {/* Link Button: ปรับแต่งให้ดูโมเดิร์น */}
            <Link to={basePath} className="group inline-flex items-center gap-3 text-slate-500 hover:text-black font-semibold text-sm transition-all pb-2 md:pb-0">
              <span className="relative">
                {linkText}
                <span className="absolute left-0 -bottom-1 w-full h-px bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 group-hover:border-black group-hover:bg-black flex items-center justify-center transition-all duration-300 shadow-sm">
                <FaArrowRight size={12} className="text-slate-400 group-hover:text-white group-hover:-rotate-45 transition-transform duration-300" />
              </div>
            </Link>
          </div>

          {/* Grid Layout */}
          <div className={`grid gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:gap-x-8 md:gap-y-12 ${gridCols}`}>
            {filteredItems.map((item) => {
              const itemId = item[config.id] || item.id || item._id;
              const imageUrl = item[config.image] || item.imageOne;
              const nameEn = item[config.nameEn] || item.headerTextOne || item.title;
              const nameTh = item[config.nameTh] || item.headerThaiOne || item.title;
              const displayName = language === 'thai' ? (nameTh || nameEn) : nameEn;

              return (
                <TrackVisibility key={itemId} once partialVisibility offset={50}>
                  {({ isVisible }) => (
                    <div className={`${isVisible ? "animate__animated animate__fadeInUp" : "opacity-0"}`}>
                      <Link to={`${detailPath}/${itemId}`} className="group block h-full flex flex-col">
                        {/* Image Wrapper */}
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white aspect-square mb-4 sm:mb-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_40px_rgba(8,_112,_184,_0.1)] group-hover:-translate-y-1.5 transition-all duration-500 ease-out">
                          <img
                            src={
                              typeof imageUrl === 'string'
                                ? imageUrl
                                : (imageUrl?.image || imageUrl?.path || imageUrl?.url || '/images/sample.jpg')
                            }
                            alt={displayName}
                            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                            loading="lazy"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/400?text=No+Image" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Content: จัด Typography ใหม่ */}
                        <div className="flex-1 flex flex-col">
                          {/* Tag (สมมติว่าเป็น Category ถ้ามี) - ถ้าไม่มีข้อมูลก็เว้นว่างไว้ */}
                          {/* <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Category</span> */}

                          <h3 className="font-bold text-slate-800 text-sm sm:text-lg md:text-[1.15rem] leading-[1.4] line-clamp-2 group-hover:text-black transition-colors duration-300">
                            {displayName}
                          </h3>

                          {/* Price or Date (ถ้ามี) */}
                          {/* <p className="mt-2 text-slate-500 text-sm font-medium">$199.00</p> */}
                        </div>
                      </Link>
                    </div>
                  )}
                </TrackVisibility>
              );
            })}
          </div>

          {footerComponent && <div className="mt-20 flex justify-center">{footerComponent}</div>}
        </div>
      </section>
    );
  };

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans"> {/* ใช้ font-sans และพื้นหลังโทนอ่อนนุ่ม */}
      <Meta />

      {/* --- HERO (Banner) --- */}
      {shouldShowCarousel("presentOne") && (
        // 👇 ปรับให้ยืดสุดตามขนาดรูปภาพจริง ไม่มีการบังคับความสูง
        <div className="w-full h-auto bg-white overflow-hidden animate__animated animate__fadeIn relative z-10">

          {/* Container ชั้นใน: บังคับให้ Carousel ยืดเต็มกรอบ */}
          <div className="w-full h-full">
            <ProductCarousel />
          </div>

        </div>
      )}

      {/* --- PRODUCTS --- */}
      <SectionRenderer
        title={t.productsLbl}
        subtitle={t.productsSub}
        data={productData}
        loading={productLoading}
        error={productError}
        basePath="/product"
        detailPath="/product"
        linkText={t.showAllProduct}
        config={{ id: '_id', image: 'image', nameEn: 'name', nameTh: 'nameThai' }}
        footerComponent={<Paginate pages={productData?.pages} page={productData?.page} keyword={keyword ? keyword : ''} />}
      />

      {/* --- CAROUSEL 2 (Full Width Screen) --- */}
      {shouldShowCarousel("presentTwo") && (
        // 1. เปลี่ยนจาก py-16 เป็น py-0 (หรือตามชอบ) และเอา border ออกถ้าต้องการความเนียน
        <div className="w-full bg-white border-y border-slate-100">

          {/* 2. ❌ ลบ class: "max-w-7xl mx-auto px-4..." ทิ้งไป เพราะมันคือตัวบีบความกว้าง */}
          <div className="w-full m-0 p-0">

            {/* 3. ✅ ใช้ w-full และลบ rounded-[2.5rem] ออก เพื่อให้ภาพชนขอบจอเป๊ะๆ ไม่มีความโค้ง */}
            <div className="relative w-full h-[120px] md:h-[500px] overflow-hidden bg-white shadow-md">

              <div className="absolute inset-0 w-full h-full">
                <ProductCarousel2 />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- SERVICES --- */}
      <SectionRenderer
        title={t.serviceShowCase}
        subtitle={t.serviceSub}
        data={serviceData}
        loading={serviceLoading}
        error={serviceError}
        basePath="/service"
        detailPath="/service"
        linkText={t.showAllService}
        config={{ id: 'ID', image: 'imageOne', nameEn: 'headerTextOne', nameTh: 'headerThaiOne' }}
        bgClass="bg-slate-50 relative z-0"
      />

      {/* --- CAROUSEL 3 (Mid-Section Highlight) --- */}
      {shouldShowCarousel("presentThree") && (
        <div className="w-full bg-slate-50 relative z-10">
          <div className="w-full">
            <div className="relative w-full h-[120px] md:h-[500px] overflow-hidden shadow-2xl shadow-slate-900/5 bg-white">
              <div className="absolute inset-0 w-full h-full">
                <ProductCarousel3 />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FOLIOS (Portfolio) --- */}
      <SectionRenderer
        title={t.foliosLbl}
        subtitle={t.foliosSub}
        data={folioData}
        loading={folioLoading}
        error={folioError}
        basePath="/folio"
        detailPath="/folio"
        linkText={t.showAllFolios}
        config={{ id: 'ID', image: 'imageOne', nameEn: 'headerTextOne', nameTh: 'headerThaiOne' }}
        gridCols="grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
        bgClass="bg-white"
      />

      {/* --- CAROUSEL 4 (Final Banner) --- */}
      {shouldShowCarousel("presentFour") && (
        <section className="w-full bg-slate-900 border-t border-slate-700/50">
          <div className="w-full">
            <div className="relative w-full h-[200px] md:h-[500px] overflow-hidden bg-slate-800 shadow-inner">
              <div className="absolute inset-0 w-full h-full">
                <ProductCarousel4 />
              </div>
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_-40px_100px_rgba(0,0,0,0.6)]"></div>
            </div>
          </div>
        </section>
      )}

      {/* --- BLOGS (Articles) --- */}
      <SectionRenderer
        title={t.acknowledge}
        subtitle={t.ackSub}
        data={blogData}
        loading={blogLoading}
        error={blogError}
        basePath="/blogs"
        detailPath="/blogs"
        linkText={t.showAllBlogs}
        config={{ id: 'id', image: 'image', nameEn: 'title', nameTh: 'title' }}
        bgClass="bg-slate-50/80"
        gridCols="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
};

export default HomeScreen;