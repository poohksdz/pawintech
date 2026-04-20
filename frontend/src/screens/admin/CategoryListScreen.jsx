import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  Card,
  Container,
  InputGroup,
  Form,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaTags,
  FaSync,
  FaTimes,
  FaLayerGroup,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetCategorysQuery,
  useDeleteCategoryMutation,
} from "../../slices/categorySlice";

const CategoryListScreen = () => {
  const { language } = useSelector((state) => state.language);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // API Calls
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useGetCategorysQuery({
    keyword: searchTerm,
  });

  const [deleteCategory, { isLoading: loadingDelete }] =
    useDeleteCategoryMutation();

  // Translations
  const t = {
    en: {
      title: "Category Management",
      subtitle: "Organize your products with categories",
      searchPlaceholder: "Search category...",
      createBtn: "Add Category",
      headers: {
        nameEn: "Category Name (EN)",
        nameTh: "Category Name (TH)",
        id: "ID",
        actions: "Actions",
      },
      modal: {
        title: "Confirm Delete",
        body: "Are you sure you want to delete this category?",
        cancel: "Cancel",
        confirm: "Delete",
      },
      btn: { edit: "Edit", delete: "Delete", refresh: "Refresh" },
      noData: "No categories found.",
    },
    thai: {
      title: "จัดการหมวดหมู่",
      subtitle: "จัดระเบียบสินค้าด้วยหมวดหมู่",
      searchPlaceholder: "ค้นหาหมวดหมู่...",
      createBtn: "เพิ่มหมวดหมู่",
      headers: {
        nameEn: "ชื่อหมวดหมู่ (อังกฤษ)",
        nameTh: "ชื่อหมวดหมู่ (ไทย)",
        id: "รหัส",
        actions: "จัดการ",
      },
      modal: {
        title: "ยืนยันการลบ",
        body: "คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
        cancel: "ยกเลิก",
        confirm: "ลบหมวดหมู่",
      },
      btn: { edit: "แก้ไข", delete: "ลบ", refresh: "รีเฟรช" },
      noData: "ไม่พบหมวดหมู่",
    },
  }[language || "en"];

  // Handlers
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(
        categoryToDelete._id || categoryToDelete.id,
      ).unwrap();
      toast.success("Category deleted successfully");
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories;
  }, [categories]);

  return (
    <Container fluid className="py-4 font-prompt dark:bg-black transition-colors duration-500">
      {/* Header Section */}
      <Card className="shadow-sm border-0 mb-4 rounded-4 bg-white dark:bg-zinc-900/50 dark:border dark:border-zinc-800 transition-colors duration-500">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={5}>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 dark:bg-opacity-20 p-3 rounded-circle shadow-sm me-3 text-info border border-info border-opacity-10 dark:border-opacity-20">
                  <FaLayerGroup size={24} />
                </div>
                <div>
                  <h4 className="mb-1 fw-bold text-dark dark:text-white">{t.title}</h4>
                  <p className="mb-0 text-muted dark:text-slate-400 small">{t.subtitle}</p>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="d-flex flex-column flex-md-row gap-2 justify-content-lg-end">
                {/* Search */}
                <InputGroup className="shadow-sm" style={{ maxWidth: "350px" }}>
                  <InputGroup.Text className="bg-white dark:bg-zinc-950 border-end-0 dark:border-zinc-800">
                    <FaSearch className="text-muted dark:text-slate-400" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder={t.searchPlaceholder}
                    className="border-start-0 ps-0 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder:text-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="white"
                      className="border-top border-bottom border-end dark:border-zinc-800 dark:bg-zinc-950"
                      onClick={() => setSearchTerm("")}
                    >
                      <FaTimes className="text-muted dark:text-slate-400" />
                    </Button>
                  )}
                </InputGroup>

                {/* Create Button */}
                <Link
                  to="/admin/category/create"
                  className="btn btn-primary shadow-sm d-flex align-items-center justify-content-center text-decoration-none"
                >
                  <FaPlus className="me-2" /> {t.createBtn}
                </Link>

                <Button
                  variant="white"
                  className="shadow-sm border dark:bg-zinc-950 dark:border-zinc-800 dark:text-info"
                  onClick={refetch}
                  title={t.btn.refresh}
                >
                  <FaSync
                    className={isLoading ? "fa-spin text-info" : "text-info"}
                  />
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Content */}
      {
        isLoading ? (
          <div className="text-center py-5">
            <Loader />
          </div>
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.error || "Error loading categories"}
          </Message>
        ) : !filteredCategories || filteredCategories.length === 0 ? (
          <div className="text-center py-5 text-muted dark:text-slate-400 bg-white dark:bg-zinc-900/30 rounded-4 shadow-sm border border-dashed dark:border-zinc-800">
            <FaTags size={40} className="text-secondary opacity-25 mb-3" />
            <h5 className="mb-0 fw-normal">{t.noData}</h5>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="shadow-sm border-0 rounded-4 d-none d-lg-block overflow-hidden dark:bg-zinc-900/30 dark:border dark:border-zinc-800">
              <Table hover responsive className="mb-0 align-middle dark:text-white">
                <thead className="bg-[#f8fafc] dark:bg-zinc-950 text-slate-600 dark:text-slate-400 border-b dark:border-zinc-800">
                  <tr>
                    <th
                      className="py-3 ps-4 text-start text-secondary text-uppercase small border-0 fw-bold"
                      style={{ width: "35%" }}
                    >
                      {t.headers.nameEn}
                    </th>
                    <th
                      className="py-3 text-start text-secondary text-uppercase small border-0 fw-bold"
                      style={{ width: "35%" }}
                    >
                      {t.headers.nameTh}
                    </th>
                    <th className="py-3 text-center text-secondary text-uppercase small border-0 fw-bold">
                      {t.headers.id}
                    </th>
                    <th className="py-3 pe-4 text-end text-secondary text-uppercase small border-0 fw-bold">
                      {t.headers.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredCategories.map((category, index) => (
                    <tr
                      key={category._id || category.id || index}
                      className="border-bottom-0 row-hover"
                    >
                      <td className="ps-4 py-3 text-start fw-bold text-primary dark:text-blue-400">
                        {category.categoryName}
                      </td>
                      <td className="text-start dark:text-slate-300">
                        {category.categoryNameThai || "-"}
                      </td>
                      <td className="text-center text-muted dark:text-slate-400 small font-monospace">
                        {String(category._id || category.id).substring(0, 10)}...
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{t.btn.edit}</Tooltip>}
                          >
                            <Link
                              to={`/admin/category/${category._id || category.id}/edit`}
                            >
                              <Button
                                variant="white"
                                size="sm"
                                className="btn-icon rounded-circle border shadow-sm text-secondary hover-primary"
                              >
                                <FaEdit />
                              </Button>
                            </Link>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{t.btn.delete}</Tooltip>}
                          >
                            <Button
                              variant="white"
                              size="sm"
                              className="btn-icon rounded-circle border shadow-sm text-secondary hover-danger"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <FaTrash />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            {/* Mobile Cards */}
            <div className="d-lg-none d-flex flex-column gap-3">
              {filteredCategories.map((category, index) => (
                <Card
                  key={category._id || category.id || index}
                  className="shadow-sm border-0 rounded-4"
                >
                  <Card.Body className="p-3 bg-white dark:bg-zinc-900/50 rounded-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light dark:bg-zinc-950 p-2 rounded-circle me-3 border dark:border-zinc-800 text-secondary dark:text-slate-400">
                        <FaTags />
                      </div>
                      <div className="overflow-hidden">
                        <h6 className="fw-bold mb-0 text-truncate text-primary dark:text-blue-400">
                          {category.categoryName}
                        </h6>
                        <small className="text-muted dark:text-slate-400">
                          {category.categoryNameThai || "-"}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/admin/category/${category._id || category.id}/edit`}
                        className="btn btn-outline-dark btn-sm flex-fill rounded-pill border-opacity-25"
                      >
                        <FaEdit className="me-1" /> {t.btn.edit}
                      </Link>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="flex-fill rounded-pill border-opacity-25"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <FaTrash className="me-1" /> {t.btn.delete}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </>
        )
      }

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="font-prompt"
      >
        <Modal.Header closeButton className="border-0 pb-0 dark:bg-zinc-950 dark:text-white">
          <Modal.Title className="text-danger fw-bold fs-5">
            <FaTrash className="me-2" />
            {t.modal.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="dark:bg-zinc-950 dark:text-slate-300">
          <p className="text-muted dark:text-slate-400 mb-3">{t.modal.body}</p>
          {categoryToDelete && (
            <div className="bg-light dark:bg-zinc-900 p-3 rounded-3 border dark:border-zinc-800">
              <div className="fw-bold text-dark dark:text-white">
                {categoryToDelete.categoryName}
              </div>
              <small className="text-muted dark:text-slate-400">
                {categoryToDelete.categoryNameThai}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 dark:bg-zinc-950">
          <Button
            variant="light"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-pill px-4"
          >
            {t.modal.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            className="rounded-pill px-4 shadow-sm"
            disabled={loadingDelete}
          >
            {loadingDelete ? "Deleting..." : t.modal.confirm}
          </Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .row-hover:hover { background-color: #f8f9fa; transition: background-color 0.2s; }
        .btn-icon { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .hover-primary:hover { color: #0d6efd !important; background-color: #f8f9fa; border-color: #0d6efd !important; }
        .hover-danger:hover { color: #dc3545 !important; background-color: #f8f9fa; border-color: #dc3545 !important; }
      ` }} />
    </Container >
  );
};

export default CategoryListScreen;
