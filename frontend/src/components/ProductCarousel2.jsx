import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Message from "./Message";
import { useGetShowcasesQuery } from "../slices/showcasesApiSlice";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./swiper-custom.css";

const ProductCarousel2 = () => {
  const { pageNumber } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetShowcasesQuery({ pageNumber });

  const handleNavigateLinkChange = (navigateLink) => {
    if (navigateLink) navigate(`${navigateLink}`);
  };

  if (isLoading) return null;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  const showcasesToShow = data
    ? data
        .filter((showcase) => showcase.present === "presentTwo")
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (showcasesToShow.length === 0) return null;

  return (
    //  ใช้ w-full h-full เพื่อให้ยืดเต็มพื้นที่ของ Parent
    <div className="w-full h-full">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={showcasesToShow.length > 1}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        className="w-full h-full"
      >
        {showcasesToShow.map((showcase) => (
          <SwiperSlide
            key={showcase._id}
            className="relative w-full h-full cursor-pointer"
            onClick={() => handleNavigateLinkChange(showcase.navigateLink)}
          >
            {/*  object-cover: ขยายรูปให้เต็มพื้นที่โดยไม่เสียสัดส่วน (อาจมีการตัดขอบบนล่างบ้าง)
                 w-full: กว้าง 100% ของจอ */}
            <img
              src={showcase.image}
              alt={showcase.name}
              className="w-full h-full object-cover block"
            />

            {/* ถ้าอยากให้รูปยืดจน "เพี้ยน/บีบ" เพื่อให้ครบทุกส่วน (ไม่แนะนำ) ให้แก้ object-cover เป็น object-fill */}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none"></div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductCarousel2;
