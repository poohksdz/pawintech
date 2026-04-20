import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCartPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaTruck,
  FaShieldAlt,
  FaStar,
  FaPen,
  FaFileDownload,
  FaBook,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Components & Slices
import Rating from "../components/Rating";
import Loader from "../components/Loader";
import Message from "../components/Message";
import Meta from "../components/Meta";
import {
  useGetProductDetailsQuery,
  useCreateReviewMutation,
} from "../slices/productsApiSlice";
import { addToCart, syncCartDB } from "../slices/cartSlice";
import DOMPurify from "dompurify";

const ProductScreen = () => {
  const { id: productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [activeImage, setActiveImage] = useState("");

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProductDetailsQuery(productId);
  const [createReview, { isLoading: loadingReview }] =
    useCreateReviewMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.image];
    if (product.mutipleImage) {
      images.push(...product.mutipleImage.split(",").filter(Boolean));
    }
    return images;
  }, [product]);

  React.useEffect(() => {
    if (product && !activeImage) {
      setActiveImage(product.image);
    }
    // Also reset active image if product changes
    if (product && activeImage && !allImages.includes(activeImage)) {
      setActiveImage(product.image);
    }
  }, [product, activeImage, allImages]);

  // การจัดการวิดีโอแนะนำสินค้า
  const productVideos = {
    28: "0yW2HHGudno",
    29: "Cvmt9ax3VVU",
  };
  const videoId = productVideos[productId];

  // การจัดการข้อความ 2 ภาษา
  const t = {
    en: {
      addToCart: "Add to Cart",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      reviews: "Customer Reviews",
      writeReview: "Write a Review",
      submit: "Submit Review",
      goBack: "Back",
      loginReq: "Please sign in to review",
      noReviews: "No reviews yet",
      qty: "Quantity",
    },
    thai: {
      addToCart: "เพิ่มลงตะกร้า",
      inStock: "มีสินค้าพร้อมส่ง",
      outOfStock: "สินค้าหมด",
      reviews: "รีวิวจากลูกค้า",
      writeReview: "เขียนรีวิวสินค้า",
      submit: "ส่งรีวิว",
      goBack: "ย้อนกลับ",
      loginReq: "กรุณาเข้าสู่ระบบเพื่อรีวิว",
      noReviews: "ยังไม่มีรีวิวสำหรับสินค้านี้",
      qty: "จำนวน",
    },
  }[language || "en"];

  const getText = (en, th) => (language === "thai" ? th || en : en);

  // จัดการรูปแบบ Content
  const processContent = (html) => {
    if (!html) return "";
    let processed = html
      .replace(
        /<img /g,
        '<img class="w-full h-auto rounded-[1.5rem] shadow-sm my-8 object-cover border border-slate-100" ',
      )
      .replace(
        /<iframe /g,
        '<div class="aspect-video my-8 rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100 bg-slate-900"><iframe class="w-full h-full" ',
      )
      .replace(/<\/iframe>/g, "</iframe></div>");

    return DOMPurify.sanitize(processed, {
      ADD_TAGS: ["iframe", "div"],
      ADD_ATTR: [
        "allowfullscreen",
        "frameborder",
        "src",
        "class",
        "style",
        "target",
      ],
    });
  };

  const addToCartHandler = () => {
    dispatch(addToCart({ ...product, qty }));
    dispatch(syncCartDB());
    navigate("/cart");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await createReview({ productId, rating, comment }).unwrap();
      refetch();
      toast.success("Review Submitted");
      setRating(0);
      setComment("");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const reviewsSafe = useMemo(
    () => (Array.isArray(product?.reviews) ? product.reviews : []),
    [product],
  );

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );
  if (!product)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Message variant="info">Product not found</Message>
      </div>
    );

  return (
    <div className="bg-[#f8fafc] dark:bg-black min-h-screen pb-16 font-sans text-slate-800 dark:text-white antialiased transition-colors duration-500">
      <Meta title={getText(product?.name, product?.nameThai)} />

      {/* --- Sticky Back Button --- */}
      <div className="sticky top-0 z-50 bg-[#f8fafc]/80 dark:bg-black backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate("/product")}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-white hover:text-black dark:hover:text-white transition-colors"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
            {t.goBack}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        {/* --- Product Main Info --- */}
        <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden mb-12 transition-colors duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Product Image */}
            <div className="p-4 md:p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-zinc-800 bg-white dark:bg-black flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] group relative transition-colors duration-500">
              <div className="relative w-full h-full flex items-center justify-center flex-1">
                <img
                  src={activeImage || product?.image}
                  alt={product?.name}
                  className="max-h-[300px] sm:max-h-[450px] w-auto object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-xl"
                />
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="flex gap-4 mt-8 px-2 overflow-x-auto pb-4 hide-scrollbar justify-center w-full">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === img ? "border-indigo-600 scale-105 shadow-md" : "border-slate-100 hover:border-slate-300"}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Actions */}
            <div className="p-4 md:p-8 md:p-12 flex flex-col justify-center">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <span className="inline-block px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  {getText(product?.category, product?.categoryThai) ||
                    "Electronics"}
                </span>
                <div className="flex items-center gap-2">
                  <Rating
                    value={product?.rating}
                    className="flex text-yellow-500 gap-0.5 text-sm"
                  />
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                    ({product?.numReviews || 0}{" "}
                    {language === "thai" ? "รีวิว" : "reviews"})
                  </span>
                </div>
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6 mt-2 md:mt-0 transition-colors duration-500">
                {getText(product?.name, product?.nameThai)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-10 pb-10 border-b border-slate-100 dark:border-zinc-800 transition-colors duration-500">
                <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight transition-colors duration-500">
                  ฿{product?.price?.toLocaleString()}
                </h2>
                {product.countInStock > 0 ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                    <FaCheckCircle /> {t.inStock}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/50">
                    <FaTimesCircle /> {t.outOfStock}
                  </span>
                )}
              </div>

              {/* Action Area (Quantity & Cart) */}
              <div className="bg-slate-50 dark:bg-black p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-colors duration-500">
                {product.countInStock > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        {t.qty}
                      </label>
                      <div className="relative">
                        <select
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                          className="w-full appearance-none bg-white dark:bg-black border-2 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-bold rounded-xl h-14 text-center cursor-pointer focus:outline-none focus:border-black dark:focus:border-white focus:ring-4 focus:ring-black/10 dark:focus:ring-white/10 transition-all shadow-sm"
                        >
                          {[
                            ...Array(Math.min(product.countInStock, 15)).keys(),
                          ].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 opacity-0">
                        Action
                      </label>
                      <button
                        onClick={addToCartHandler}
                        className="w-full h-14 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-slate-200 text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/30 dark:shadow-white/10 active:scale-[0.98]"
                      >
                        <FaCartPlus className="text-lg" /> {t.addToCart}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-center py-4 rounded-xl font-bold">
                    {t.outOfStock}
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex justify-center gap-4 md:gap-6 mt-6 pt-6 border-t border-slate-200/60 dark:border-zinc-800/60 text-xs font-bold text-slate-500 dark:text-white transition-colors duration-500">
                  <span className="flex items-center gap-2">
                    <FaTruck className="text-black dark:text-white text-base transition-colors duration-500" />{" "}
                    {language === "thai" ? "จัดส่งรวดเร็ว" : "Fast Shipping"}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaShieldAlt className="text-black dark:text-white text-base transition-colors duration-500" />{" "}
                    {language === "thai" ? "รับประกัน 1 ปี" : "1 Year Warranty"}
                  </span>
                </div>

                {/* Documents / Datasheets */}
                {(product?.datasheet || product?.manual) && (
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-zinc-800/60 transition-colors duration-500">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">
                      {language === "thai"
                        ? "เอกสารอ้างอิงและคู่มือ"
                        : "Documentation & Manuals"}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {product.datasheet && (
                        <a
                          href={product.datasheet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-black hover:bg-black dark:hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                        >
                          <FaFileDownload />{" "}
                          {language === "thai"
                            ? "ดาต้าชีท (Datasheet)"
                            : "Datasheet"}
                        </a>
                      )}
                      {product.manual && (
                        <a
                          href={product.manual}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                        >
                          <FaBook />{" "}
                          {language === "thai"
                            ? "คู่มือการใช้งาน (Manual)"
                            : "User Manual"}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Product Detailed Description (Full Width) --- */}
        {product?.description && product.description !== "<p>--</p>" && (
          <div className="bg-white dark:bg-black rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden mb-12 p-4 md:p-8 md:p-12 lg:p-16 transition-colors duration-500">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-500">
                  {language === "thai" ? "รายละเอียดสินค้า" : "Product Details"}
                </h3>
              </div>
              <div
                className="text-slate-600 dark:text-white prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-strong:text-slate-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:ml-4 prose-li:my-2 transition-colors duration-500"
                dangerouslySetInnerHTML={{
                  __html: processContent(
                    getText(product?.description, product?.descriptionThai),
                  ),
                }}
              />
            </div>
          </div>
        )}

        {/* --- YouTube Video Section --- */}
        {videoId && (
          <div className="bg-white dark:bg-black rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden mb-12 p-4 md:p-8 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors duration-500">
                {language === "thai" ? "วิดีโอแนะนำสินค้า" : "Product Showcase"}
              </h3>
            </div>
            <div className="aspect-video w-full rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-900 group">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* --- Reviews Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 h-full overflow-hidden transition-colors duration-500">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-4 bg-slate-50/50 dark:bg-black transition-colors duration-500">
                <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full"></div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white m-0 flex items-center gap-2 transition-colors duration-500">
                  {t.reviews}{" "}
                  <span className="text-slate-400 font-medium text-sm">
                    ({reviewsSafe.length})
                  </span>
                </h4>
              </div>

              <div className="p-4 md:p-8">
                {reviewsSafe.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-black rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 transition-colors duration-500">
                    <p className="text-slate-500 font-medium">{t.noReviews}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-500">
                    {reviewsSafe.map((review) => (
                      <li
                        key={review._id}
                        className="py-4 md:py-6 first:pt-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-black text-black dark:text-white flex items-center justify-center font-black text-lg transition-colors duration-500">
                              {review.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white transition-colors duration-500">
                                {review.name}
                              </div>
                              <div className="text-xs text-slate-400 font-medium mt-0.5">
                                {String(review.createdAt).substring(0, 10)}
                              </div>
                            </div>
                          </div>
                          <Rating
                            value={review.rating}
                            className="flex text-yellow-500 gap-0.5 text-xs"
                          />
                        </div>
                        <p className="text-slate-600 dark:text-white leading-relaxed pl-[64px] transition-colors duration-500">
                          {review.comment}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 sticky top-[100px]">
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <FaPen className="text-black" />
                <h5 className="text-lg font-black text-slate-900 m-0">
                  {t.writeReview}
                </h5>
              </div>

              <div className="p-4 md:p-8">
                {userInfo ? (
                  <form onSubmit={submitHandler}>
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 dark:text-white uppercase tracking-widest mb-3 text-center transition-colors duration-500">
                        {language === "thai" ? "ให้คะแนนของคุณ" : "Your Rating"}
                      </label>
                      <div className="flex justify-center gap-2 p-4 bg-slate-50 dark:bg-black rounded-2xl transition-colors duration-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <FaStar
                              className={`text-3xl transition-colors duration-500 ${star <= rating ? "text-yellow-400 star-filled" : "text-slate-200 dark:text-zinc-800 star-empty"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 dark:text-white uppercase tracking-widest mb-3 transition-colors duration-500">
                        {language === "thai" ? "ความคิดเห็น" : "Comment"}
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={
                          language === "thai"
                            ? "แบ่งปันความคิดเห็นของคุณเกี่ยวกับสินค้านี้..."
                            : "Share your thoughts about this product..."
                        }
                        className="w-full bg-slate-50 dark:bg-black border border-transparent dark:border-zinc-800 text-slate-900 dark:text-white rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all resize-none shadow-inner"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingReview || rating === 0}
                      className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md"
                    >
                      {loadingReview
                        ? language === "thai"
                          ? "กำลังดำเนินการ..."
                          : "Processing..."
                        : t.submit}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4 md:py-6 md:py-10 bg-slate-50 dark:bg-black rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 px-4 md:px-6 transition-colors duration-500">
                    <p className="text-slate-500 dark:text-white mb-6 font-medium transition-colors duration-500">
                      {t.loginReq}
                    </p>
                    <Link
                      to="/login"
                      className="inline-block bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-slate-200 text-white dark:text-black font-bold py-3 px-4 md:px-8 rounded-full shadow-md transition-colors"
                    >
                      {language === "thai"
                        ? "เข้าสู่ระบบเพื่อเขียนรีวิว"
                        : "Sign in to review"}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductScreen;
