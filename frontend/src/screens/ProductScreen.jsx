import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaCartPlus, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaTruck, FaShieldAlt, FaStar, FaPen } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Components & Slices
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { useGetProductDetailsQuery, useCreateReviewMutation } from '../slices/productsApiSlice';
import { addToCart, syncCartDB } from '../slices/cartSlice';

const ProductScreen = () => {
  const { id: productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: product, isLoading, error, refetch } = useGetProductDetailsQuery(productId);
  const [createReview, { isLoading: loadingReview }] = useCreateReviewMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // การจัดการข้อความ 2 ภาษา
  const t = {
    en: { addToCart: 'Add to Cart', inStock: 'In Stock', outOfStock: 'Out of Stock', reviews: 'Customer Reviews', writeReview: 'Write a Review', submit: 'Submit Review', goBack: 'Back', loginReq: 'Please sign in to review', noReviews: 'No reviews yet', qty: 'Quantity' },
    thai: { addToCart: 'เพิ่มลงตะกร้า', inStock: 'มีสินค้าพร้อมส่ง', outOfStock: 'สินค้าหมด', reviews: 'รีวิวจากลูกค้า', writeReview: 'เขียนรีวิวสินค้า', submit: 'ส่งรีวิว', goBack: 'ย้อนกลับ', loginReq: 'กรุณาเข้าสู่ระบบเพื่อรีวิว', noReviews: 'ยังไม่มีรีวิวสำหรับสินค้านี้', qty: 'จำนวน' }
  }[language || 'en'];

  const getText = (en, th) => (language === 'thai' ? (th || en) : en);

  const addToCartHandler = () => {
    dispatch(addToCart({ ...product, qty }));
    dispatch(syncCartDB());
    navigate('/cart');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await createReview({ productId, rating, comment }).unwrap();
      refetch();
      toast.success('Review Submitted');
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const reviewsSafe = useMemo(() => Array.isArray(product?.reviews) ? product.reviews : [], [product]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Loader /></div>;
  if (error) return <div className="max-w-7xl mx-auto px-4 py-12"><Message variant='danger'>{error?.data?.message || error.error}</Message></div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-12"><Message variant='info'>Product not found</Message></div>;

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-16 font-sans text-slate-800 antialiased">
      <Meta title={getText(product?.name, product?.nameThai)} />

      {/* --- Sticky Back Button --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/product')}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-colors"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> {t.goBack}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        {/* --- Product Main Info --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Left: Product Image */}
            <div className="p-6 md:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white flex items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] group">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={product?.image}
                  alt={product?.name}
                  className="max-h-[300px] sm:max-h-[450px] w-auto object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-xl"
                />
              </div>
            </div>

            {/* Right: Product Details & Actions */}
            <div className="p-8 md:p-12 flex flex-col justify-center">

              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <span className="inline-block px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  {getText(product?.category, product?.categoryThai) || 'Electronics'}
                </span>
                <div className="flex items-center gap-2">
                  <Rating value={product?.rating} className="flex text-amber-400 gap-0.5 text-sm" />
                  <span className="text-slate-400 text-sm font-medium">({product?.numReviews || 0} {language === 'thai' ? 'รีวิว' : 'reviews'})</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6 mt-2 md:mt-0">
                {getText(product?.name, product?.nameThai)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">
                  ฿{product?.price?.toLocaleString()}
                </h2>
                {product.countInStock > 0 ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                    <FaCheckCircle /> {t.inStock}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                    <FaTimesCircle /> {t.outOfStock}
                  </span>
                )}
              </div>

              {product?.description && product.description !== '<p>--</p>' && (
                <div className="text-slate-500 mb-10 flex-grow prose prose-slate max-w-none">
                  <p className="leading-relaxed">
                    {getText(product?.description, product?.descriptionThai)}
                  </p>
                </div>
              )}

              {/* Action Area (Quantity & Cart) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {product.countInStock > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t.qty}</label>
                      <div className="relative">
                        <select
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                          className="w-full appearance-none bg-white border-2 border-slate-200 text-slate-900 font-bold rounded-xl h-14 text-center cursor-pointer focus:outline-none focus:border-black focus:ring-4 focus:ring-black/10 transition-all shadow-sm"
                        >
                          {[...Array(Math.min(product.countInStock, 15)).keys()].map(x => (
                            <option key={x + 1} value={x + 1}>{x + 1}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 opacity-0">Action</label>
                      <button
                        onClick={addToCartHandler}
                        className="w-full h-14 bg-black hover:bg-black/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/30 active:scale-[0.98]"
                      >
                        <FaCartPlus className="text-lg" /> {t.addToCart}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 text-center py-4 rounded-xl font-bold">
                    {t.outOfStock}
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-slate-200/60 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-2"><FaTruck className="text-black text-base" /> {language === 'thai' ? 'จัดส่งรวดเร็ว' : 'Fast Shipping'}</span>
                  <span className="flex items-center gap-2"><FaShieldAlt className="text-black text-base" /> {language === 'thai' ? 'รับประกัน 1 ปี' : '1 Year Warranty'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- Reviews Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Reviews List */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="w-1.5 h-6 bg-black rounded-full"></div>
                <h4 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
                  {t.reviews} <span className="text-slate-400 font-medium text-sm">({reviewsSafe.length})</span>
                </h4>
              </div>

              <div className="p-6 md:p-8">
                {reviewsSafe.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">{t.noReviews}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {reviewsSafe.map((review) => (
                      <li key={review._id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-black flex items-center justify-center font-black text-lg">
                              {review.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{review.name}</div>
                              <div className="text-xs text-slate-400 font-medium mt-0.5">
                                {String(review.createdAt).substring(0, 10)}
                              </div>
                            </div>
                          </div>
                          <Rating value={review.rating} className="flex text-amber-400 gap-0.5 text-xs" />
                        </div>
                        <p className="text-slate-600 leading-relaxed pl-[64px]">
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
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <FaPen className="text-black" />
                <h5 className="text-lg font-black text-slate-900 m-0">{t.writeReview}</h5>
              </div>

              <div className="p-6 md:p-8">
                {userInfo ? (
                  <form onSubmit={submitHandler}>
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">{language === 'thai' ? 'ให้คะแนนของคุณ' : 'Your Rating'}</label>
                      <div className="flex justify-center gap-2 p-4 bg-slate-50 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <FaStar
                              className={`text-3xl ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{language === 'thai' ? 'ความคิดเห็น' : 'Comment'}</label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={language === 'thai' ? 'แบ่งปันความคิดเห็นของคุณเกี่ยวกับสินค้านี้...' : 'Share your thoughts about this product...'}
                        className="w-full bg-slate-50 border-0 text-slate-900 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none shadow-inner"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingReview || rating === 0}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md"
                    >
                      {loadingReview ? (language === 'thai' ? 'กำลังดำเนินการ...' : 'Processing...') : t.submit}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-6">
                    <p className="text-slate-500 mb-6 font-medium">{t.loginReq}</p>
                    <Link to="/login" className="inline-block bg-black hover:bg-black/90 text-white font-bold py-3 px-8 rounded-full shadow-md transition-colors">
                      {language === 'thai' ? 'เข้าสู่ระบบเพื่อเขียนรีวิว' : 'Sign in to review'}
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