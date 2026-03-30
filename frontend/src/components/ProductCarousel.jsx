import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Message from "./Message";
import { useGetShowcasesQuery } from "../slices/showcasesApiSlice";

const ProductCarousel = () => {
  const { pageNumber } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetShowcasesQuery({ pageNumber });

  const [activeIndex, setActiveIndex] = useState(0);

  const handleNavigateLinkChange = (navigateLink) => {
    if (navigateLink) navigate(`${navigateLink}`);
  };

  useEffect(() => {
    if (!data) return;

    const showcasesToShow = data.filter(
      (showcase) => showcase.present === "presentOne",
    );
    if (showcasesToShow.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) =>
        current === showcasesToShow.length - 1 ? 0 : current + 1,
      );
    }, 4000); // 4 seconds interval

    return () => clearInterval(interval);
  }, [data]);

  if (isLoading)
    return (
      <div className="animate-pulse w-full h-64 bg-slate-200 rounded-2xl mb-6"></div>
    );
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!data || data.filter((showcase) => showcase.present).length === 0)
    return <Message variant="info">No showcases available.</Message>;

  // Filter by present value and sort by displayOrder (0 if not set)
  const showcasesToShow = data
    .filter((showcase) => showcase.present === "presentOne")
    .sort((a, b) => {
      const orderA = a.displayOrder || 0;
      const orderB = b.displayOrder || 0;
      return orderA - orderB;
    });

  if (showcasesToShow.length === 0) return null;

  const nextSlide = () => {
    setActiveIndex((current) =>
      current === showcasesToShow.length - 1 ? 0 : current + 1,
    );
  };

  const prevSlide = () => {
    setActiveIndex((current) =>
      current === 0 ? showcasesToShow.length - 1 : current - 1,
    );
  };

  return (
    <div className="relative w-full overflow-hidden group bg-slate-100 h-auto">
      <div
        className="flex h-auto transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {showcasesToShow.map((showcase, index) => (
          <div
            key={showcase._id || index}
            className="w-full h-auto flex-shrink-0 relative cursor-pointer"
            onClick={() => handleNavigateLinkChange(showcase.navigateLink)}
          >
            <img
              src={
                typeof showcase.image === "string"
                  ? showcase.image
                  : showcase.image?.image ||
                    showcase.image?.path ||
                    showcase.image?.url ||
                    "/images/sample.jpg"
              }
              alt={showcase.name || "Showcase"}
              className="w-full h-auto block"
            />
            {/* Optional Overlay if text needs to be displayed over image */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div> */}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {showcasesToShow.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
          >
            <FaChevronLeft className="pr-1" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
          >
            <FaChevronRight className="pl-1" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {showcasesToShow.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeIndex === idx
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCarousel;
