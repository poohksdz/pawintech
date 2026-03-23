import React from "react";
import { useSelector } from 'react-redux';
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useGetBlogsQuery } from "../slices/blogsApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";

const BlogScreen = () => {
  const { pageNumber } = useParams();
  const { language } = useSelector((state) => state.language);
  const { data, isLoading, error } = useGetBlogsQuery({ pageNumber });

  const translations = {
    en: {
      goBackLbl: 'Back to Home',
      BlogPosts: 'Latest Articles',
      Subtitle: 'Explore our latest news, updates, and technical insights.',
      ReadMore: 'Read Article',
      Empty: 'No blogs found.'
    },
    thai: {
      goBackLbl: 'กลับหน้าแรก',
      BlogPosts: 'บทความล่าสุด',
      Subtitle: 'อัปเดตข่าวสารและสาระความรู้ทางเทคโนโลยีล่าสุดจากเรา',
      ReadMore: 'อ่านรายละเอียด',
      Empty: 'ไม่พบบทความในขณะนี้'
    },
  };

  const t = translations[language] || translations.en;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  if (isLoading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <Loader />
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Message variant='danger'>{error?.data?.message || "Error loading blogs"}</Message>
    </div>
  );

  return (
    <div className="bg-[#FAFAFB] min-h-screen py-10 md:py-16 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- Header Section --- */}
        <div className="mb-12 md:mb-16">
          <Link to='/'>
            <motion.button
              whileHover={{ x: -4 }}
              className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-6 transition-colors"
            >
              <FaArrowLeft className="text-xs" /> {t.goBackLbl}
            </motion.button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                {t.BlogPosts}
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                {t.Subtitle}
              </p>
            </div>
            <div className="hidden md:block h-1 w-24 bg-indigo-600 rounded-full mb-2"></div>
          </div>
        </div>

        {/* --- Blog Content --- */}
        {(!data?.blogs || data.blogs.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FaBookOpen className="text-slate-300 text-3xl" />
            </div>
            <p className="text-slate-400 font-medium text-lg">{t.Empty}</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
          >
            {data.blogs.map((blog) => (
              <motion.div key={blog._id} variants={itemVariants}>
                <Link to={`/blogs/${blog.id}`} className="group block h-full">
                  <article className="bg-white h-full rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col transform group-hover:-translate-y-2">

                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Date Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-2xl shadow-sm text-[10px] font-bold flex items-center gap-1.5">
                          <FaCalendarAlt className="text-indigo-600" />
                          {new Date(blog.createdAt).toLocaleDateString(language === 'thai' ? 'th-TH' : 'en-US', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h2 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {language === 'thai' ? blog.titleThai : blog.title}
                      </h2>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-indigo-600 font-bold text-sm tracking-wide">
                          {t.ReadMore}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300">
                          <FaChevronRight className="text-xs text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlogScreen;