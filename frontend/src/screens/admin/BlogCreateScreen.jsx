import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import {
  useCreateBlogMutation,
  useUploadBlogImageMutation,
} from "../../slices/blogsApiSlice";
import Loader from "../../components/Loader";
import FormContainer from "../../components/FormContainer";

const BlogCreateScreen = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleThai, setTitleThai] = useState("");
  const [contentThai, setContentThai] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();
  const [uploadBlogImage, { isLoading: isUploading }] =
    useUploadBlogImageMutation();

  // ** Image Upload Handler **
  const uploadBlogImageHandler = async (e) => {
    const formData = new FormData();
    formData.append("image", e.target.files[0]);

    try {
      const res = await uploadBlogImage(formData).unwrap();
      toast.success("Image uploaded successfully!");
      setImage(res.image); // Set uploaded image URL
    } catch (err) {
      toast.error("Failed to upload image.");
    }
  };

  // ** ReactQuill Modules for Rich Text Editing **
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }, { font: [] }],
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
                  const res = await uploadBlogImage(formData).unwrap();
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
          },
        },
      },
    }),
    [uploadBlogImage],
  ); // Added uploadBlogImage as dependency

  // ** Handle Blog Creation **
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createBlog({
        title,
        content,
        titleThai,
        contentThai,
        image,
      }).unwrap();
      toast.success("Blog created successfully!");
      navigate("/admin/bloglist"); // Redirect to blog list
    } catch (err) {
      setError("Failed to create blog. Please try again.");
      console.error("Error creating blog:", err);
    }

    setLoading(false);
  };

  const { language } = useSelector((state) => state.language);

  // ** Translation Support **
  const translations = {
    en: {
      goBackLbl: "Go Back",
      createBlogLbl: "Create Blog Post",
      titleLbl: "Title in English",
      enterTitleLbl: "Enter title in English",
      contentLbl: "Content in English",
      enterContentLbl: "Enter content in English",
      titleThaiLbl: "Title in Thai",
      enterTitleThaiLbl: "Enter title in Thai",
      contentThaiLbl: "Content in Thai",
      enterContentThaiLbl: "Enter content in Thai",
      imageLbl: "Image (640x510)",
      chooseImageLbl: "Choose an image",
      previewImageLbl: "Preview Image (640x510)",
      createLbl: "Create",
      creatingLbl: "Creating...",
      errorCreatingPostLbl: "Failed to create post. Please try again.",
    },
    thai: {
      goBackLbl: "ย้อนกลับ",
      createBlogLbl: "สร้างบล็อกโพสต์",
      titleLbl: "ชื่อภาษาอังกฤษ",
      enterTitleLbl: "กรอกชื่อภาษาอังกฤษ",
      contentLbl: "เนื้อหาภาษาอังกฤษ",
      enterContentLbl: "กรอกเนื้อหาภาษาอังกฤษ",
      titleThaiLbl: "ชื่อภาษาไทย",
      enterTitleThaiLbl: "กรอกชื่อภาษาไทย",
      contentThaiLbl: "เนื้อหาภาษาไทย",
      enterContentThaiLbl: "กรอกเนื้อหาภาษาไทย",
      imageLbl: "รูปภาพ (640x510)",
      chooseImageLbl: "เลือกภาพ",
      previewImageLbl: "แสดงตัวอย่างภาพ (640x510)",
      createLbl: "สร้าง",
      creatingLbl: "กำลังสร้าง...",
      errorCreatingPostLbl: "ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่อีกครั้ง",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Link
        to="/admin/bloglist"
        className="btn btn-light my-3"
        style={{ color: "#303d4a" }}
      >
        {t.goBackLbl}
      </Link>
      <FormContainer>
        <h2>{t.createBlogLbl}</h2>
        {error && <Alert variant="danger">{t.errorCreatingPostLbl}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{t.titleLbl}</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t.enterTitleLbl}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t.contentLbl}</Form.Label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t.titleThaiLbl}</Form.Label>
            <Form.Control
              type="text"
              value={titleThai}
              onChange={(e) => setTitleThai(e.target.value)}
              required
              placeholder={t.enterTitleThaiLbl}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t.contentThaiLbl}</Form.Label>
            <ReactQuill
              value={contentThai}
              onChange={setContentThai}
              modules={modules}
            />
          </Form.Group>

          <Form.Group controlId="image" className="my-3">
            <Form.Label>{t.imageLbl}</Form.Label>
            <Form.Control type="file" onChange={uploadBlogImageHandler} />
            {isUploading && <Loader />}
          </Form.Group>

          <Button type="submit" disabled={loading || isCreating}>
            {loading || isCreating ? t.creatingLbl : t.createLbl}
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default BlogCreateScreen;
