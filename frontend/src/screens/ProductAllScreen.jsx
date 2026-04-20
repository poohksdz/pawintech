import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "animate.css";
import TrackVisibility from "react-on-screen";
import { useGetProductsQuery } from "../slices/productsApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";
import Paginate from "../components/Paginate";
import Meta from "../components/Meta";
import SearchBox from "../components/SearchBox";

const ProductAllScreen = () => {
  const { pageNumber, keyword } = useParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data, isLoading, error } = useGetProductsQuery({
    keyword,
    pageNumber,
    category: selectedCategory,
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const categoryFromUrl = searchParams.get("category");

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("");
    }
  }, [categoryFromUrl]);

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      allProduct: "All Products",
      goBackLbl: "Go Back",
      categoryLbl: "Category",
      filteredResults: "Filtered Products",
    },
    thai: {
      allProduct: "สินค้าทั้งหมด",
      goBackLbl: "ย้อนกลับ",
      categoryLbl: "หมวดหมู่",
      filteredResults: "สินค้าที่กรองแล้ว",
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (data?.products) {
      const uniqueCategories = [
        { label: language === "thai" ? "ทั้งหมด" : "All", value: "" },
        ...Array.from(
          new Set(
            data.products.map(
              (product) =>
                product[language === "thai" ? "categoryThai" : "category"],
            ),
          ),
        ).map((category) => ({
          label: category,
          value: category,
        })),
      ];
      setCategories(uniqueCategories);
    }
  }, [data, language]);

  useEffect(() => {
    if (data?.products) {
      const filtered =
        selectedCategory && selectedCategory !== ""
          ? data.products.filter(
            (product) =>
              product[language === "thai" ? "categoryThai" : "category"] ===
              selectedCategory,
          )
          : data.products;
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, data, language]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <>
      <SearchBox />

      {!keyword ? (
        <div className="flex flex-col md:flex-row md:items-center mt-4">
          <div className="md:w-3/4">
            <h1 className="text-xl md:text-3xl font-black mb-4 md:mb-0 uppercase tracking-tight text-slate-900 dark:text-white transition-colors duration-500">
              {selectedCategory ? t.filteredResults : t.allProduct}
            </h1>
          </div>
          <div className="md:w-1/4">
            <div className="my-3 flex items-center">
              <label className="mr-3 mb-0 font-semibold text-[#555] dark:text-white whitespace-nowrap transition-colors duration-500">
                {t.categoryLbl}
              </label>
              <div className="relative grow">
                <div
                  className="relative z-20"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between pr-4 pl-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black h-[45px] font-bold text-slate-700 dark:text-white cursor-pointer transition-all duration-300 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm"
                  >
                    <span className="truncate">
                      {categories.find((c) => c.value === selectedCategory)
                        ?.label || (language === "thai" ? "ทั้งหมด" : "All")}
                    </span>
                    <motion.span
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      className="text-indigo-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-2xl shadow-indigo-200/50 dark:shadow-none overflow-hidden py-2"
                      >
                        {categories.map((category) => (
                          <button
                            key={category.value}
                            className={`w-full text-left px-4 py-3 text-[14px] font-bold transition-colors flex items-center justify-between ${selectedCategory === category.value
                                ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                : "text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            onClick={() => {
                              setSelectedCategory(category.value);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {category.label}
                            {selectedCategory === category.value && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to="/product"
          className="inline-block my-3 px-4 py-2 bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-slate-700 text-black dark:text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          {t.goBackLbl}
        </Link>
      )}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Meta />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10 my-8 items-start">
            {(selectedCategory ? filteredProducts : data.products).length >
              0 ? (
              (selectedCategory ? filteredProducts : data.products).map(
                (product) => (
                  <div key={product._id} className="w-full">
                    <TrackVisibility once partialVisibility>
                      {({ isVisible }) => (
                        <div
                          className={`${isVisible
                              ? "animate__animated animate__fadeInUp"
                              : "opacity-0"
                            }`}
                        >
                          <Link
                            to={`/${product._id}`}
                            className="block group no-underline flex flex-col h-full"
                          >
                            {/* 1. กล่องรูปภาพ */}
                            <div className="bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-center aspect-[4/3] overflow-hidden transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:border-slate-200 dark:group-hover:border-slate-700">
                              <img
                                src={
                                  typeof product.image === "string"
                                    ? product.image
                                    : product.image?.image ||
                                    product.image?.path ||
                                    product.image?.url ||
                                    "/images/sample.jpg"
                                }
                                alt={product.name}
                                className={typeof product.image === "string" ? "w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" : "w-full h-full object-contain"}
                              />
                            </div>

                            {/* 2. รายละเอียดสินค้า (ชื่อ, ดาว, ราคา) */}
                            <div className="mt-4 px-1 flex flex-col flex-grow">
                              {/* ชื่อสินค้า */}
                              <h3 className="text-black dark:text-white font-bold text-[15px] sm:text-[16px] leading-[1.4] line-clamp-2 transition-colors duration-500">
                                {product.name}
                              </h3>

                              {/* ดาวและจำนวนรีวิว */}
                              <div className="flex items-center gap-1 mt-2">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, index) => (
                                    <svg
                                      key={index}
                                      className={`w-4 h-4 ${product.rating >= index + 1 ? "text-yellow-400" : "text-gray-300"} fill-current`}
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                  ({product.numReviews || 0})
                                </span>
                              </div>

                              {/* ราคา */}
                              <div className="mt-2 text-[18px] font-extrabold text-black dark:text-white transition-colors duration-500">
                                ฿{product.price?.toLocaleString()}
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}
                    </TrackVisibility>
                  </div>
                ),
              )
            ) : (
              <div className="col-span-full">
                <Message variant="info">
                  {selectedCategory
                    ? language === "thai"
                      ? "ไม่พบสินค้าในหมวดหมู่ที่เลือก"
                      : "No products found in this category."
                    : language === "thai"
                      ? "ยังไม่มีสินค้าให้เลือกชมในขณะนี้"
                      : "No products available."}
                </Message>
              </div>
            )}
          </div>

          <Paginate
            pages={data.pages}
            page={data.page}
            keyword={keyword ? keyword : ""}
          />
        </>
      )}
    </>
  );
};

export default ProductAllScreen;
