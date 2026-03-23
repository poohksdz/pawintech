import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useSelector } from 'react-redux'; 
import { Container, Form, Button, Alert, Image, Card, Table } from "react-bootstrap";
import { FaEdit, FaTrash } from 'react-icons/fa';
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify"; 
import { useGetAboutDetailsQuery, useUpdateAboutMutation, useUploadAboutImageMutation } from '../../slices/aboutApiSlice';
import { useGetAboutimagesQuery, useDeleteAboutimagesMutation, useUpdateShowFrontAboutimagesMutation} from "../../slices/aboutImageApiSlice";
import Loader from "../../components/Loader";
import ConfirmModle from '../../components/ConfirmModle';
import ConfirmModleChange from '../../components/ConfirmModleChange';

const AboutEditScreen = () => { 
  const { id: aboutId } = useParams(); 
  const [aboutContentEng, setAboutContentEng] = useState(""); 
  const [aboutContentThai, setaboutContentThai] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModalChange, setShowModalChange] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [aboutImageToDelete, setAboutImageToDelete] = useState(null);
  const [aboutImageToChange, setAboutImageToChange] = useState(null);

  const { data: about, refetch } = useGetAboutDetailsQuery(aboutId);
  const { data, isLoading, refetch: refetchAboutimages } = useGetAboutimagesQuery({});
  
  const [updateAbout] = useUpdateAboutMutation();
  const [updateShowFrontAboutimages] = useUpdateShowFrontAboutimagesMutation();
  const [uploadAboutImage] = useUploadAboutImageMutation();
  const [deleteAboutimages] = useDeleteAboutimagesMutation();
  const navigate = useNavigate();

  const [selectedAbouts, setSelectedAbouts] = useState({});
  
  const deleteHandler = (id) => {
    setAboutImageToDelete(id);
    setShowModal(true);
  };

  const changeHandler = (id) => {
    setAboutImageToChange(id);
    setShowModalChange(true);
  };

  const handleCheckboxChange = async (aboutId) => {
    const newSelectedState = selectedAbouts[aboutId] ? 0 : 1;
    const showFrontCount = Object.values(selectedAbouts).filter((value) => value === 1).length;

    if (newSelectedState === 1 && showFrontCount >= 7) {
      toast.error('Select display is already 7 blogs');
      return;
    }

    setSelectedAbouts((prevSelected) => ({
      ...prevSelected,
      [aboutId]: newSelectedState,
    }));

    try {
      await updateShowFrontAboutimages({ ID: aboutId, showFront: newSelectedState });
      toast.success('blog display status updated!');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update blog status');
    }
  };

  useEffect(() => {
    if (data) {
      const initialSelectedaboutimages = {};
      data.aboutimages.forEach((aboutimage) => {
        initialSelectedaboutimages[aboutimage.ID] = Number(aboutimage.showFront);
      });
      setSelectedAbouts(initialSelectedaboutimages);
    }
  }, [data]);

  const handleConfirmDelete = async () => {
    try {
      await deleteAboutimages(aboutImageToDelete);
      refetchAboutimages();
      setShowModal(false);
      toast.success('Deleted successfully!');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  const handleConfirmChange = async () => {
    try {
      refetchAboutimages();
      setShowModalChange(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelChange = () => {
    setShowModalChange(false);
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] },{ font: [] }],
        [{ color: [] }, { background: [] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        [{ script: "sub" }, { script: "super" }],
      ],
      handlers: {
        image: function () {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              const formData = new FormData();
              formData.append("image", file);
              try {
                const res = await uploadAboutImage(formData).unwrap();
                const editor = this.quill;
                const range = editor.getSelection();
                editor.insertEmbed(range.index, "image", res.image);
              } catch (err) {
                toast.error("Image upload failed");
              }
            }
          }; 
        },
        video: function () {
          const url = prompt("Enter YouTube URL:");
          if (url) {
            let videoId = null;
            if (url.includes("watch?v=")) {
              videoId = url.split("v=")[1]?.split("&")[0];
            } else if (url.includes("shorts/")) {
              videoId = url.split("shorts/")[1]?.split("?")[0];
            }
            if (videoId) {
              const videoUrl = `https://www.youtube.com/embed/${videoId}`;
              const editor = this.quill;
              const range = editor.getSelection();
              editor.insertEmbed(range.index, "video", videoUrl);
            } else {
              alert("Invalid YouTube URL. Please enter a valid link.");
            }
          }
        }        
      },
    },
  }), [uploadAboutImage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateAbout({
        aboutId,
        aboutContentEng, 
        aboutContentThai, 
      }).unwrap();
      toast.success("Updated successfully!");
      await refetch();
      navigate("/about");
    } catch (err) {
      setError("Failed to update. Please try again.");
      console.error("Error updating:", err);
    }
    setLoading(false);
  };

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      goBackLbl: 'Go Back',
      editBlogLbl: 'Edit About Post',
      contentLbl: 'Content in English',
      aboutContentThaiLbl: 'Content in Thai',
      imageLbl: 'Image (640x510)',
      updateLbl: 'Update',
      updatingLbl: 'Updating...',
      errorUpdatingPostLbl: 'Failed to update post. Please try again.',
      EDITLbl: 'Edit',
      DeleteLbl: 'Delete',
      showFrontlbl: 'Show'
    },
    thai: {
      goBackLbl: 'ย้อนกลับ',
      editBlogLbl: 'แก้ไขข้อมูล About',
      contentLbl: 'เนื้อหาภาษาอังกฤษ',
      aboutContentThaiLbl: 'เนื้อหาภาษาไทย',
      imageLbl: 'รูปภาพ (640x510)',
      updateLbl: 'อัปเดต',
      updatingLbl: 'กำลังอัปเดต...',
      errorUpdatingPostLbl: 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
      EDITLbl: 'แก้ไข',
      DeleteLbl: 'ลบ',
      showFrontlbl: 'แสดง'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (about) { 
      setAboutContentEng(about.aboutContentEng); 
      setaboutContentThai(about.aboutContentThai); 
    }
  }, [about]);

  return (
    <>
      {isLoading || loading ? (
        <Loader />
      ) : (
        <Container>
          <Link to='/about' className='btn btn-light my-3' style={{ color: '#303d4a' }}>
            {t.goBackLbl}
          </Link>
          <h2>{t.editBlogLbl}</h2>
          {error && <Alert variant="danger">{t.errorUpdatingPostLbl}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t.contentLbl}</Form.Label>
              <ReactQuill
                value={aboutContentEng}
                onChange={setAboutContentEng}
                modules={modules}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t.aboutContentThaiLbl}</Form.Label>
              <ReactQuill
                value={aboutContentThai}
                onChange={setaboutContentThai}
                modules={modules}
              />
            </Form.Group>
            <Button type="submit" disabled={loading}>
              {loading ? t.updatingLbl : t.updateLbl}
            </Button>
          </Form>

          <Table striped bordered hover responsive className="table-sm my-3">
            <thead style={{ fontSize: '25px', height: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
              <tr>
                <th>#</th> 
                <th>{t.imageLbl}</th> 
                <th>{t.EDITLbl}</th> 
                <th>{t.showFrontlbl}</th> 
              </tr> 
            </thead> 
            <tbody style={{ fontSize: '20px', textAlign: 'center' }}>
              {data && data.aboutimages.map((img, index) => (
                <tr key={img.ID}>
                  <td style={{ width: '80px', height: '100px' }}>{index + 1}</td>
                  <td style={{ width: '300px', height: '100px' }}>
                    <Card>
                      <Image src={img.images || '/default-image.jpg'} fluid />
                    </Card>
                  </td> 
                  <td style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <Button variant="info" onClick={() => changeHandler(img.ID)} className="btn-md mx-3">
                      <FaEdit style={{ color: 'white' }} />
                    </Button>
                    <Button variant="danger" className="btn-md mx-3" onClick={() => deleteHandler(img.ID)}> 
                      <FaTrash style={{ color: 'white' }} />
                    </Button>
                  </td>
                  <td style={{textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedAbouts[img.ID]}
                      onChange={() => handleCheckboxChange(img.ID)}
                    />
                  </td>
                </tr>
              ))}
            </tbody> 
          </Table>

          {showModal && (
            <ConfirmModle
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          )}

          {showModalChange && (
            <ConfirmModleChange
              show={showModalChange}
              onHide={handleCancelChange}
              onConfirm={handleConfirmChange}
              aboutImageId={aboutImageToChange}
            />
          )}
        </Container>
      )}
    </>
  );
};

export default AboutEditScreen;