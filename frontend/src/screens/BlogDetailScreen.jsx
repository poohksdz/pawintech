import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUserCircle,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  useGetBlogDetailsQuery,
  useGetBlogsQuery,
} from "../slices/blogsApiSlice";
import DOMPurify from "dompurify";
import Loader from "../components/Loader";
import Message from "../components/Message";

const BlogDetailScreen = () => {
  const { id: blogId } = useParams();
  const navigate = useNavigate();
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

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Message variant="danger">
          {error?.data?.message || "Error fetching blog"}
        </Message>
      </div>
    );
  if (!blog)
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        No content found.
      </div>
    );

  const title = isThai ? blog.titleThai : blog.title;
  const content = isThai ? blog.contentThai : blog.content;

  // จัดการรูปแบบ Content ที่ดึงมาจาก Editor
  const processContent = (html) => {
    if (!html) return "";
    let processed = html
      .replace(/src="(blogImages\/.*?)"/g, 'src="/$1"')
      .replace(
        /<img /g,
        '<img class="w-full h-auto rounded-[1.5rem] shadow-sm my-10 object-cover border border-slate-100 dark:border-zinc-800" ',
      )
      .replace(
        /<iframe /g,
        '<div class="aspect-video my-10 rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-zinc-800 bg-slate-900"><iframe class="w-full h-full" ',
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

  const t = {
    back: isThai ? "หน้าหลัก" : "Home",
    backBtn: isThai ? "ย้อนกลับ" : "Back",
    category: isThai ? "ข่าวสารและบทความ" : "News & Articles",
    related: isThai ? "บทความยอดนิยม" : "Popular Stories",
    author: "Editorial Team",
    endnote: isThai ? "จบการนำเสนอเนื้อหา" : "End of article",
  };

  return (
    <div className="bg-[#fcfcfc] dark:bg-black min-h-screen font-sans antialiased text-slate-900 dark:text-white selection:bg-indigo-100 dark:selection:bg-zinc-800 selection:text-indigo-900 dark:selection:text-white transition-colors duration-500">
      {/* --- Reading Progress Bar --- */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* --- Breadcrumb Navigation --- */}
      <nav className="max-w-6xl mx-auto px-4 pt-10 pb-6 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400 transition-all duration-300 active:scale-95 group shrink-0"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">
            {t.backBtn}
          </span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest overflow-hidden">
          <Link
            to="/"
            className="hover:text-indigo-600 transition-colors uppercase shrink-0"
          >
            {t.back}
          </Link>
          <FaChevronRight className="text-[10px] shrink-0" />
          <Link
            to="/blogs"
            className="hover:text-indigo-600 transition-colors uppercase truncate"
          >
            {t.category}
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        {/* --- Headline & Meta Info --- */}
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-[1.2] tracking-tight mb-8"
          >
            {title}
          </motion.h1>

          <div className="flex items-center gap-6 border-y border-slate-100 dark:border-zinc-800 py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center text-indigo-600">
                <FaUserCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1.5">
                  {t.author}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>
                    {new Date(
                      blog.createdAt || blog.created_at,
                    ).toLocaleDateString(isThai ? "th-TH" : "en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
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
              className="rounded-[2rem] overflow-hidden mb-12 shadow-md border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <img
                src={blog.image}
                alt={title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </motion.div>

            {/* Rich Text Body */}
            <div
              className="news-content prose prose-slate dark:prose-invert prose-lg max-w-none
              prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-[1.9] prose-p:mb-8
              prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-extrabold prose-headings:tracking-tight
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-zinc-900 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300
              prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: processContent(content) }}
            />
          </article>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <section className="bg-white dark:bg-zinc-900/40 rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-8 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-8">
                  {t.related}
                </h3>

                <div className="space-y-8">
                  {allBlogs?.blogs
                    ?.filter((b) => b._id !== blog._id)
                    .slice(0, 5)
                    .map((item, idx) => (
                      <Link
                        key={item._id}
                        to={`/blogs/${item._id || item.id}`}
                        className="group flex items-start gap-5 no-underline"
                      >
                        <span className="text-3xl font-black text-slate-100 dark:text-zinc-800 group-hover:text-indigo-200 dark:group-hover:text-indigo-900 transition-colors leading-none">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="mt-1">
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                            {isThai ? item.titleThai : item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(
                              item.createdAt || item.created_at,
                            ).toLocaleDateString(isThai ? "th-TH" : "en-US")}
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
      <footer className="border-t border-slate-100 dark:border-zinc-800 mt-10 py-16 bg-white dark:bg-black transition-colors">
        <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="w-12 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full mb-6"></div>
          <p className="text-xs font-black text-slate-300 dark:text-zinc-700 uppercase tracking-[0.3em]">
            {t.endnote}
          </p>
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
