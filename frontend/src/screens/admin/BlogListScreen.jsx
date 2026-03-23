import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button, Row, Col, Image, Card } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Message from '../../components/Message';
import ConfirmModle from '../../components/ConfirmModle';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import { useGetBlogsQuery, useDeleteBlogMutation , useUpdateShowFrontBlogMutation} from '../../slices/blogsApiSlice';
import { toast } from 'react-toastify';

const BlogListScreen = () => {
  const { pageNumber } = useParams();
  
  const [showModal, setShowModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [selectedBlogs, setSelectedBlogs] = useState({});

  const { data, isLoading, error, refetch } = useGetBlogsQuery({ pageNumber });
  const [deleteBlog, { isLoading: loadingDelete }] = useDeleteBlogMutation();
  const [updateShowFrontBlog] = useUpdateShowFrontBlogMutation();

  const deleteHandler = (id) => {
    setBlogToDelete(id);  // Store the blog ID to delete
    setShowModal(true);  // Show the confirmation modal
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBlog(blogToDelete);
      refetch();
      setShowModal(false);
      toast.success('Blog deleted successfully!');
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
      const showFrontCount = Object.values(selectedBlogs).filter((value) => value === 1).length;
    
      // Prevent selecting more than 7
      if (newSelectedState === 1 && showFrontCount >= 7) {
        toast.error('Select display is already 7 blogs');
        return;
      }
    
      setSelectedBlogs((prevSelected) => ({
        ...prevSelected,
        [blogId]: newSelectedState,
      }));
    
      try {
        await updateShowFrontBlog({ blogId, showFront: newSelectedState });
        toast.success('blog display status updated!');
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to update blog status');
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
      BlogsLbl: 'Blogs',
      createBlogLbl: 'Create Blog',
      imageLbl: 'Image',
      titleLbl: 'Title',
      titleThaiLbl: 'Title in Thai',
      EDITLbl: 'EDIT',
      SHOWCASELbl: 'SHOW'
    },
    thai: {
      BlogsLbl: 'บริการ',
      createBlogLbl: 'สร้างบริการ',
      imageLbl: 'รูปภาพ',
      titleLbl: 'ชื่อ',
      titleThaiLbl: 'ชื่อภาษาไทย',
      EDITLbl: 'แก้ไข',
      SHOWCASELbl: 'แสดง'
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.BlogsLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" as={Link} to="/admin/blogs/create">
            <FaPlus /> {t.createBlogLbl}
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
          <Table striped bordered hover responsive className="table-sm">
            <thead style={{ fontSize: '25px', height: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
              <tr>
                <th>#</th>
                <th>{t.imageLbl}</th>
                <th>{t.titleLbl}</th>
                <th>{t.EDITLbl}</th>
                <th>{t.SHOWCASELbl}</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '20px', textAlign: 'center' }}>
              {data.blogs.map((blog, index) => {
                const title = language === 'thai' ? blog.titleThai : blog.title;
                const imageSrc = blog.image || '/default-image.jpg';

                return (
                  <tr key={blog.id}>
                    <td style={{ width: '50px', height: '100px' }}>{index + 1}</td>
                    <td style={{ width: '150px', height: '100px' }}>
                      <Card>
                        <Image src={imageSrc} alt={title} fluid />
                      </Card>
                    </td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                      <div style={{ marginLeft: '30px' }}>{title}</div>
                    </td>
                    <td style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <Button
                        as={Link}
                        to={`/admin/blogs/${blog.id}/edit`}
                        variant="info"
                        className="btn-md mx-3"
                      >
                        <FaEdit style={{ color: 'white' }} />
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-md mx-3"
                        onClick={() => deleteHandler(blog.id)}
                      >
                        <FaTrash style={{ color: 'white' }} />
                      </Button>
                    </td>
                  <td  style={{textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedBlogs[blog.id]}
                      onChange={() => handleCheckboxChange(blog.id)}
                    />
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <Paginate pages={data.pages} page={data.page} isAdmin={true} />
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default BlogListScreen;
