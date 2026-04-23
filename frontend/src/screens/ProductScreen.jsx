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
  FaTrash,
  FaImage,
  FaTimes,
  FaSort,
  FaFilter,
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
  useUpdateReviewMutation,
  useDeleteReviewMutation,
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
  const [reviewImages, setReviewImages] = useState([]);

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editImages, setEditImages] = useState([]);

  // Review sorting and filtering
  const [sortBy, setSortBy] = useState("latest");
  const [filterStar, setFilterStar] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const {
    data: product,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetProductDetailsQuery(productId, { refetchOnMountOrArgChange: true });

  const [createReview, { isLoading: loadingReview }] = useCreateReviewMutation();
  const [updateReview, { isLoading: loadingUpdateReview }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: loadingDeleteReview }] = useDeleteReviewMutation();

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
    if (product && activeImage && !allImages.includes(activeImage)) {
      setActiveImage(product.image);
    }
  }, [product, activeImage, allImages]);

  // Video handling
  const productVideos = {
    28: "0yW2HHGudno",
    29: "Cvmt9ax3VVU",
  };
  const videoId = productVideos[productId];

  // Language translations
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
      noReviews: "No reviews yet. Be the first to review!",
      qty: "Quantity",
      yourReview: "Your Review",
      postedBy: "Posted by",
      ratingRequired: "Please select a rating",
      reviewSuccess: "Review submitted successfully!",
      editReview: "Edit Review",
      deleteReview: "Delete Review",
      updateReview: "Update Review",
      cancel: "Cancel",
      addImages: "Add Images",
      removeImage: "Remove Image",
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
      noReviews: "ยังไม่มีรีวิว รีวิวแรกของคุณจะเป็นคนแรก!",
      qty: "จำนวน",
      yourReview: "รีวิวของคุณ",
      postedBy: "โพสต์โดย",
      ratingRequired: "กรุณาให้คะแนนก่อน",
      reviewSuccess: "ส่งรีวิวสำเร็จแล้ว!",
      editReview: "แก้ไขรีวิว",
      deleteReview: "ลบรีวิว",
      updateReview: "อัพเดทรีวิว",
      cancel: "ยกเลิก",
      addImages: "เพิ่มรูปภาพ",
      removeImage: "ลบรูปภาพ",
    },
  }[language || "en"];

  const getText = (en, th) => (language === "thai" ? th || en : en);

  // Process HTML content
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
      ADD_ATTR: ["allowfullscreen", "frameborder", "src", "class", "style", "target"],
    });
  };

  const addToCartHandler = async () => {
    dispatch(addToCart({ ...product, qty }));
    await dispatch(syncCartDB()).unwrap();
    navigate("/cart");
  };

  // Handle image upload for reviews
  const handleReviewImageUpload = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    const maxImages = isEdit ? 5 : 5;
    const currentImages = isEdit ? editImages : reviewImages;

    if (currentImages.length + files.length > maxImages) {
      toast.error(language === "thai" ? `สามารถอัพโหลดได้สูงสุด ${maxImages} รูป` : `Maximum ${maxImages} images allowed`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isEdit) {
          setEditImages((prev) => [...prev, event.target.result]);
        } else {
          setReviewImages((prev) => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setReviewImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error(t.ratingRequired);
      return;
    }

    try {
      await createReview({
        productId,
        rating,
        comment,
        images: reviewImages
      }).unwrap();
      toast.success(t.reviewSuccess);
      setRating(0);
      setComment("");
      setReviewImages([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const startEditReview = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditImages(review.images || []);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
    setEditImages([]);
  };

  const saveEditReview = async () => {
    if (editRating === 0) {
      toast.error(t.ratingRequired);
      return;
    }

    try {
      await updateReview({
        productId,
        reviewId: editingReviewId,
        rating: editRating,
        comment: editComment,
        images: editImages,
      }).unwrap();
      toast.success(language === "thai" ? "อัพเดทรีวิวสำเร็จ!" : "Review updated!");
      cancelEditReview();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(language === "thai" ? "ต้องการลบรีวิวนี้?" : "Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await deleteReview({ productId, reviewId }).unwrap();
      toast.success(language === "thai" ? "ลบรีวิวสำเร็จ!" : "Review deleted!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Safe reviews array
  const reviewsSafe = useMemo(
    () => (Array.isArray(product?.reviews) ? product.reviews : []),
    [product],
  );

  // Calculate star breakdown
  const starBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsSafe.forEach((review) => {
      const r = Math.round(review.rating || 0);
      if (breakdown[r] !== undefined) {
        breakdown[r]++;
      }
    });
    return breakdown;
  }, [reviewsSafe]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviewsSafe];

    // Filter by star rating
    if (filterStar > 0) {
      filtered = filtered.filter((r) => Math.round(r.rating) === filterStar);
    }

    // Sort reviews
    switch (sortBy) {
      case "latest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "highest":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [reviewsSafe, filterStar, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedReviews.length / reviewsPerPage);
  const paginatedReviews = filteredAndSortedReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Reset to page 1 when filter/sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStar, sortBy]);

  const isOwnReview = (review) => {
    return userInfo && review.user && review.user.toString() === userInfo._id.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Message variant="info">Product not found</Message>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-black min-h-screen pb-16 font-sans text-slate-800 dark:text-white antialiased transition-colors duration-500">
      <Meta title={getText(product?.name, product?.nameThai)} />

      {/* Sticky Back Button */}
      <div className="sticky top-0 z-50 bg-[#f8fafc]/80 dark:bg-black backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-slate-300 transition-colors duration-500"
          >
            <FaArrowLeft />
            {t.goBack}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors duration-500">
              <img
                src={activeImage || product.image}
                alt={getText(product.name, product.nameThai)}
                className="w-full h-full object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-500 ${activeImage === img
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-500">
                {getText(product.name, product.nameThai)}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors duration-500">
                {product.category && `${product.category}`}
                {product.brand && ` • ${product.brand}`}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <Rating value={product.rating || 0} />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors duration-500">
                ({product.numReviews || 0} {t.reviews})
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white transition-colors duration-500">
              ฿{product.price?.toLocaleString()}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.countInStock > 0 ? (
                <>
                  <FaCheckCircle className="text-green-500" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 transition-colors duration-500">
                    {t.inStock}
                  </span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-red-500" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 transition-colors duration-500">
                    {t.outOfStock}
                  </span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.countInStock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 transition-colors duration-500">
                  {t.qty}:
                </span>
                <select
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-500"
                >
                  {[...Array(product.countInStock).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>
                      {x + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCartHandler}
              disabled={product.countInStock === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-base transition-all duration-500 ${product.countInStock > 0
                ? "bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                }`}
            >
              <FaCartPlus />
              {t.addToCart}
            </button>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 transition-colors duration-500">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 transition-colors duration-500">
                <FaTruck className="text-lg text-slate-400" />
                <span className="font-medium">Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 transition-colors duration-500">
                <FaShieldAlt className="text-lg text-slate-400" />
                <span className="font-medium">2 Year Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {product.description && (
          <div className="mb-12">
            <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden transition-colors duration-500">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-black transition-colors duration-500">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-500">
                  <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full"></div>
                  Description
                </h3>
              </div>
              <div
                className="p-4 md:p-6 prose dark:prose-invert max-w-none text-slate-600 dark:text-white transition-colors duration-500"
                dangerouslySetInnerHTML={{ __html: processContent(product.description) }}
              />
            </div>
          </div>
        )}

        {/* Video Section */}
        {videoId && (
          <div className="mb-12">
            <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden transition-colors duration-500">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-black transition-colors duration-500">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-500">
                  <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full"></div>
                  Product Video
                </h3>
              </div>
              <div className="p-4 md:p-6">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Product Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 h-full overflow-hidden transition-colors duration-500">

              {/* Review Summary Header */}
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-black transition-colors duration-500">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Average Rating */}
                  <div className="flex flex-col items-center md:items-start">
                    <div className="text-5xl font-black text-slate-900 dark:text-white">
                      {(product.rating || 0).toFixed(1)}
                    </div>
                    <Rating value={product.rating || 0} className="mt-1" />
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {reviewsSafe.length} {language === "thai" ? "รีวิว" : "reviews"}
                    </div>
                  </div>

                  {/* Star Breakdown */}
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = starBreakdown[star] || 0;
                      const percentage = reviewsSafe.length > 0 ? (count / reviewsSafe.length) * 100 : 0;
                      return (
                        <div
                          key={star}
                          className={`flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 p-1 rounded transition-colors ${filterStar === star ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                          onClick={() => setFilterStar(filterStar === star ? 0 : star)}
                        >
                          <span className="text-sm font-medium w-8 text-slate-600 dark:text-slate-400">{star}</span>
                          <FaStar className="text-yellow-500 text-xs" />
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filter/Sort Controls */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
                  {/* Filter indicator */}
                  {filterStar > 0 && (
                    <button
                      onClick={() => setFilterStar(0)}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <FaFilter className="text-xs" />
                      {language === "thai" ? "กรอง" : "Filter"}: {filterStar} <FaStar className="text-xs" />
                      <FaTimes className="text-xs" />
                    </button>
                  )}

                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2">
                    <FaSort className="text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    >
                      <option value="latest">{language === "thai" ? "ล่าสุด" : "Latest"}</option>
                      <option value="oldest">{language === "thai" ? "เก่าสุด" : "Oldest"}</option>
                      <option value="highest">{language === "thai" ? "คะแนนสูงสุด" : "Highest"}</option>
                      <option value="lowest">{language === "thai" ? "คะแนนต่ำสุด" : "Lowest"}</option>
                    </select>
                  </div>

                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredAndSortedReviews.length} {language === "thai" ? "รีวิว" : "reviews"}
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="p-4 md:p-8">
                {filteredAndSortedReviews.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-black rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 transition-colors duration-500">
                    <p className="text-slate-500 font-medium">{t.noReviews}</p>
                  </div>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-500">
                      {paginatedReviews.map((review, index) => (
                        <li key={review._id || index} className="py-6 first:pt-0 last:pb-0">
                          {/* Review Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md transition-colors duration-500">
                                {(review.name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white transition-colors duration-500">
                                  {review.name || "Unknown User"}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Rating value={review.rating} className="flex text-yellow-500 gap-0.5 text-xs" />
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-400 font-medium">
                                    {new Date(review.createdAt).toLocaleDateString("th-TH", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isOwnReview(review) && (
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800 rounded-lg p-1">
                                <button
                                  onClick={() => startEditReview(review)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors duration-500"
                                  title={t.editReview}
                                >
                                  <FaPen className="text-sm" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review._id)}
                                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors duration-500"
                                  title={t.deleteReview}
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Review Comment - ข้อความอยู่ด้านบน */}
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed transition-colors duration-500 mb-4">
                            {review.comment}
                          </p>

                          {/* Review Images - รูปอยู่ด้านล่าง */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {review.images.map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img}
                                  alt={`Review image ${imgIndex + 1}`}
                                  className="w-24 h-24 object-cover rounded-xl shadow-sm flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer"
                                />
                              ))}
                            </div>
                          )}

                          {/* Edit Form (Inline) */}
                          {editingReviewId === review._id && (
                            <div className="mt-4 p-6 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-zinc-900 dark:to-indigo-900/20 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                  <FaPen />
                                </div>
                                <h5 className="font-bold text-slate-900 dark:text-white">{t.editReview}</h5>
                              </div>

                              {/* Rating */}
                              <div className="mb-4">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                  {language === "thai" ? "คะแนน" : "Rating"}
                                </label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditRating(star)}
                                      className="text-2xl p-1 hover:scale-110 transition-transform"
                                    >
                                      <FaStar
                                        className={star <= editRating ? "text-yellow-500" : "text-slate-200"}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Comment */}
                              <div className="mb-4">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                  {language === "thai" ? "รีวิว" : "Comment"}
                                </label>
                                <textarea
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  rows="4"
                                  className="w-full border border-slate-200 dark:border-zinc-600 rounded-xl px-4 py-3 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                />
                              </div>

                              {/* Images */}
                              <div className="mb-4">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                                  {t.addImages}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {editImages.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                      <img src={img} alt="" className="w-20 h-20 object-cover rounded-xl shadow" />
                                      <button
                                        onClick={() => removeReviewImage(idx, true)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <FaTimes className="text-xs" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                {editImages.length < 5 && (
                                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-zinc-600 rounded-xl cursor-pointer text-sm text-slate-500 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <FaImage />
                                    <span>{t.addImages}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => handleReviewImageUpload(e, true)}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-zinc-700">
                                <button
                                  onClick={saveEditReview}
                                  disabled={loadingUpdateReview}
                                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {loadingUpdateReview ? "..." : t.updateReview}
                                </button>
                                <button
                                  onClick={cancelEditReview}
                                  className="px-6 py-2.5 border border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  {t.cancel}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {language === "thai" ? "ก่อนหน้า" : "Previous"}
                        </button>

                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                ? "bg-indigo-600 text-white shadow-md"
                                : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {language === "thai" ? "ถัดไป" : "Next"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-black rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden sticky top-24 transition-colors duration-500">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-black dark:to-indigo-900/20 transition-colors duration-500">
                <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-500">
                  <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full"></div>
                  {t.writeReview}
                </h4>
              </div>

              <div className="p-4 md:p-6">
                {!userInfo ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaStar className="text-2xl text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium mb-4">{t.loginReq}</p>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors duration-500 shadow-lg"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={submitHandler} className="space-y-5">
                    {/* Rating */}
                    <div className="text-center p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 block">
                        {language === "thai" ? "ให้คะแนนสินค้า" : "Rate this product"}
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-4xl p-1 hover:scale-110 transition-transform"
                          >
                            <FaStar
                              className={`${star <= rating ? "text-yellow-500 drop-shadow-md" : "text-slate-200"} transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                          {rating === 5 && (language === "thai" ? "ดีเยี่ยม!" : "Excellent!")}
                          {rating === 4 && (language === "thai" ? "ดีมาก!" : "Very Good!")}
                          {rating === 3 && (language === "thai" ? "ดี" : "Good")}
                          {rating === 2 && (language === "thai" ? "พอใช้" : "Fair")}
                          {rating === 1 && (language === "thai" ? "ต้องปรับปรุง" : "Poor")}
                        </p>
                      )}
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        {t.yourReview}
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                        placeholder={language === "thai" ? "เขียนรีวิวของคุณ..." : "Write your review..."}
                        className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        required
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        {t.addImages} ({language === "thai" ? "ไม่บังคับ" : "optional"})
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {reviewImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl shadow" />
                            <button
                              type="button"
                              onClick={() => removeReviewImage(idx, false)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {reviewImages.length < 5 && (
                        <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-slate-300 dark:border-zinc-600 rounded-xl cursor-pointer text-sm text-slate-500 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <FaImage />
                          <span>{t.addImages}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleReviewImageUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loadingReview || rating === 0}
                      className="w-full py-3.5 bg-gradient-to-r from-black to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-black rounded-xl font-black text-base hover:shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingReview ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          ...
                        </span>
                      ) : t.submit}
                    </button>
                  </form>
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