import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaUserCircle, FaChevronRight } from 'react-icons/fa';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useGetBlogDetailsQuery, useGetBlogsQuery } from "../slices/blogsApiSlice";
import DOMPurify from "dompurify";
import Loader from "../components/Loader";
import Message from "../components/Message";

const BlogDetailScreen = () => {
  const { id: blogId } = useParams();
  const { language } = useSelector((state) => state.language);
  const isThai = language === "thai";

  // Reading Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const { data: blog, isLoading, error } = useGetBlogDetailsQuery(blogId);
  const { data: allBlogs } = useGetBlogsQuery({ pageNumber: 1 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [blogId]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Loader /></div>;
  if (error) return <div className="max-w-4xl mx-auto px-4 py-20"><Message variant='danger'>{error?.data?.message || "Error fetching blog"}</Message></div>;
  if (!blog) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">No content found.</div>;

  const title = isThai ? blog.titleThai : blog.title;
  const content = isThai ? blog.contentThai : blog.content;

  // จัดการรูปแบบ Content ที่ดึงมาจาก Editor
  const processContent = (html) => {
    if (!html) return "";
    let processed = html
      .replace(/src="(blogImages\/.*?)"/g, 'src="/$1"')
      .replace(/<img /g, '<img class="w-full h-auto rounded-[1.5rem] shadow-sm my-10 object-cover border border-slate-100" ')
      .replace(/<iframe /g, '<div class="aspect-video my-10 rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100 bg-slate-900"><iframe class="w-full h-full" ')
      .replace(/<\/iframe>/g, '</iframe></div>');

    return DOMPurify.sanitize(processed, {
      ADD_TAGS: ["iframe", "div"],
      ADD_ATTR: ["allowfullscreen", "frameborder", "src", "class", "style", "target"],
    });
  };

  const t = {
    back: isThai ? "หน้าหลัก" : "Home",
    category: isThai ? "ข่าวสารและบทความ" : "News & Articles",
    related: isThai ? "บทความยอดนิยม" : "Popular Stories",
    author: "Editorial Team",
    endnote: isThai ? "จบการนำเสนอเนื้อหา" : "End of article"
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans antialiased text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* --- Reading Progress Bar --- */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-50 origin-left" style={{ scaleX }} />

      {/* --- Breadcrumb Navigation --- */}
      <nav className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-indigo-600 transition-colors">{t.back}</Link>
          <FaChevronRight className="text-[10px]" />
          <Link to="/blogs" className="hover:text-indigo-600 transition-colors">{t.category}</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {/* --- Headline & Meta Info --- */}
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-8"
          >
            {title}
          </motion.h1>

          <div className="flex items-center gap-6 border-y border-slate-100 py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FaUserCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none mb-1.5">{t.author}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>{new Date(blog.createdAt || blog.created_at).toLocaleDateString(isThai ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* --- 2-Column News Layout (Main Content / Sidebar) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Main Article Content (Left) */}
          <article className="lg:col-span-8">
            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-[2rem] overflow-hidden mb-12 shadow-md border border-slate-100 bg-white"
            >
              <img src={blog.image} alt={title} className="w-full h-auto object-cover max-h-[500px]" />
            </motion.div>

            {/* Rich Text Body */}
            <div
              className="news-content prose prose-slate prose-lg max-w-none
              prose-p:text-slate-600 prose-p:leading-[1.9] prose-p:mb-8
              prose-headings:text-slate-900 prose-headings:font-extrabold prose-headings:tracking-tight
              prose-strong:text-slate-900
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:bg-slate-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-slate-700
              prose-a:text-indigo-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: processContent(content) }}
            />
          </article>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <section className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-8">
                  {t.related}
                </h3>

                <div className="space-y-8">
                  {allBlogs?.blogs?.filter(b => b._id !== blog._id).slice(0, 5).map((item, idx) => (
                    <Link key={item._id} to={`/blogs/${item._id || item.id}`} className="group flex items-start gap-5 no-underline">
                      <span className="text-3xl font-black text-slate-100 group-hover:text-indigo-200 transition-colors leading-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="mt-1">
                        <h4 className="text-base font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                          {isThai ? item.titleThai : item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(item.createdAt || item.created_at).toLocaleDateString(isThai ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      {/* --- Footer Endnote --- */}
      <footer className="border-t border-slate-100 mt-10 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="w-12 h-1 bg-slate-200 rounded-full mb-6"></div>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">{t.endnote}</p>
        </div>
      </footer>

      {/* --- Custom Editor Styles --- */}
      <style>{`
        .news-content h2 { font-size: 1.875rem !important; margin-top: 3rem !important; margin-bottom: 1.5rem !important; }
        .news-content h3 { font-size: 1.5rem !important; margin-top: 2.5rem !important; margin-bottom: 1rem !important; }
        .news-content p { font-size: 1.125rem !important; }
        .news-content ul li::marker { color: #4f46e5; }
      `}</style>
    </div>
  );
};

export default BlogDetailScreen;