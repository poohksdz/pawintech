import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Table, Button, Row, Col, Image, Card } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import Message from "../../components/Message";
import ConfirmModle from "../../components/ConfirmModle";
import Loader from "../../components/Loader";
import Paginate from "../../components/Paginate";
import {
  useGetBlogsQuery,
  useDeleteBlogMutation,
  useUpdateShowFrontBlogMutation,
} from "../../slices/blogsApiSlice";
import { toast } from "react-toastify";

const BlogListScreen = () => {
  const { pageNumber } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [selectedBlogs, setSelectedBlogs] = useState({});

  const { data, isLoading, error, refetch } = useGetBlogsQuery({ pageNumber }, { skip: !userInfo });
  const [deleteBlog, { isLoading: loadingDelete }] = useDeleteBlogMutation();
  const [updateShowFrontBlog] = useUpdateShowFrontBlogMutation();

  const deleteHandler = (id) => {
    setBlogToDelete(id); // Store the blog ID to delete
    setShowModal(true); // Show the confirmation modal
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBlog(blogToDelete);
      refetch();
      setShowModal(false);
      toast.success("Blog deleted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  const handleCheckboxChange = async (blogId) => {
    const newSelectedState = selectedBlogs[blogId] ? 0 : 1; // Toggle between 1 and 0

    // Count blogs currently set to showFront = 1
    const showFrontCount = Object.values(selectedBlogs).filter(
      (value) => value === 1,
    ).length;

    // Prevent selecting more than 7
    if (newSelectedState === 1 && showFrontCount >= 7) {
      toast.error("Select display is already 7 blogs");
      return;
    }

    setSelectedBlogs((prevSelected) => ({
      ...prevSelected,
      [blogId]: newSelectedState,
    }));

    try {
      await updateShowFrontBlog({ blogId, showFront: newSelectedState });
      toast.success("blog display status updated!");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update blog status");
    }
  };

  useEffect(() => {
    // Refetch products when pageNumber changes
    refetch();
  }, [pageNumber, refetch]);

  useEffect(() => {
    if (data) {
      const initialSelectedBlogs = {};
      data.blogs.forEach((blog) => {
        initialSelectedBlogs[blog.id] = blog.showFront;
      });
      setSelectedBlogs(initialSelectedBlogs);
    }
  }, [data]);

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      BlogsLbl: "Blogs",
      createBlogLbl: "Create Blog",
      imageLbl: "Image",
      titleLbl: "Title",
      titleThaiLbl: "Title in Thai",
      EDITLbl: "EDIT",
      SHOWCASELbl: "SHOW",
    },
    thai: {
      BlogsLbl: "บริการ",
      createBlogLbl: "สร้างบริการ",
      imageLbl: "รูปภาพ",
      titleLbl: "ชื่อ",
      titleThaiLbl: "ชื่อภาษาไทย",
      EDITLbl: "แก้ไข",
      SHOWCASELbl: "แสดง",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black py-4 md:py-8 px-4 md:px-8 font-prompt transition-colors duration-500">
      <Row className="align-items-center mb-6">
        <Col>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.BlogsLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="bg-slate-900 dark:bg-white text-white dark:text-black border-0 px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all font-medium" as={Link} to="/admin/blogs/create">
            <FaPlus className="me-2" /> {t.createBlogLbl}
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error.data.message}</Message>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-500">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-4 px-4 md:px-6 w-20 text-center">#</th>
                  <th className="py-4 px-4 md:px-6 w-32">{t.imageLbl}</th>
                  <th className="py-4 px-4 md:px-6">{t.titleLbl}</th>
                  <th className="py-4 px-4 md:px-6 text-center">{t.EDITLbl}</th>
                  <th className="py-4 px-4 md:px-6 text-center">{t.SHOWCASELbl}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm text-slate-700 dark:text-slate-300">
                {data.blogs.map((blog, index) => {
                  const title = language === "thai" ? blog.titleThai : blog.title;
                  const imageSrc = blog.image || "/default-image.jpg";

                  return (
                    <tr key={blog.id}>
                      <td className="py-4 px-4 md:px-6 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="w-20 h-20 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden shadow-sm p-1">
                          <Image src={imageSrc} alt={title} className="w-full h-full object-cover" fluid />
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {title}
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/blogs/${blog.id}/edit`}
                            className="w-9 h-9 flex items-center justify-center bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white rounded-lg transition-all shadow-sm"
                            title={t.EDITLbl}
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button
                            onClick={() => deleteHandler(blog.id)}
                            className="w-9 h-9 flex items-center justify-center bg-rose-50 dark:bg-zinc-800 border border-rose-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm"
                            title="Delete"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-950 cursor-pointer"
                          checked={!!selectedBlogs[blog.id]}
                          onChange={() => handleCheckboxChange(blog.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="flex justify-center mt-6">
              <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 px-5 py-2 rounded-xl shadow-sm">
                <Paginate pages={data.pages} page={data.page} isAdmin={true} />
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default BlogListScreen;
