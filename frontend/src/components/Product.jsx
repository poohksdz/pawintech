import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Rating from "./Rating";

const Product = ({ product }) => {
  const { language } = useSelector((state) => state.language);

  // Define translation object
  const translations = {
    en: { productName: product.name, reviewsLbl: "reviews", currency: "฿" },
    thai: { productName: product.nameThai, reviewsLbl: "รีวิว", currency: "฿" },
  };

  const t = translations[language] || translations.en;

  // ฟังก์ชันจัดรูปแบบราคา (ใส่ลูกน้ำ)
  const formattedPrice = Number(product.price).toLocaleString();

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 ease-out h-full flex flex-col overflow-hidden transform hover:-translate-y-1">
      {/* --- Image Section --- */}
      <Link
        to={`/product/${product._id}`}
        className="relative block w-full overflow-hidden aspect-[4/5] bg-slate-50"
      >
        <img
          src={product.image}
          alt={t.productName}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105"
        />

        {/* Optional: Badge or Overlay could go here */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </Link>

      {/* --- Body Section --- */}
      <div className="p-4 flex flex-col flex-1">
        {/* Product Title */}
        <Link to={`/${product._id}`} className="block mb-2">
          <h3 className="text-base md:text-lg font-semibold text-slate-700 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {t.productName}
          </h3>
        </Link>

        {/* Rating Section */}
        <div className="mt-auto mb-3">
          {/* Rating Component should handle its own stars, here we style the container */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Rating
              value={product.rating}
              text={`${product.numReviews} ${t.reviewsLbl}`}
              color="#fbbf24" // Tailwind amber-400
            />
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Price
            </span>
            <span className="text-xl md:text-2xl font-bold text-slate-900">
              {t.currency}
              {formattedPrice}
            </span>
          </div>

          {/* Optional: Add Button Icon (Visual only) */}
          <Link
            to={`/product/${product._id}`}
      className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-colors duration-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </Link>
  </div>
      </div >
    </div >
  );
};

export default Product;
