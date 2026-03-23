import React, { useState, useMemo } from 'react';
import { Table, Button, Row, Col, Card, Container, InputGroup, Form, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTags, FaSync, FaTimes, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetCategorysQuery, useDeleteCategoryMutation } from '../../slices/categorySlice';

const CategoryListScreen = () => {
  const { language } = useSelector((state) => state.language);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // API Calls
  const { data: categories, isLoading, error, refetch } = useGetCategorysQuery({ 
    keyword: searchTerm 
  });
  
  const [deleteCategory, { isLoading: loadingDelete }] = useDeleteCategoryMutation();

  // Translations
  const t = {
    en: {
      title: 'Category Management',
      subtitle: 'Organize your products with categories',
      searchPlaceholder: 'Search category...',
      createBtn: 'Add Category',
      headers: { nameEn: 'Category Name (EN)', nameTh: 'Category Name (TH)', id: 'ID', actions: 'Actions' },
      modal: { title: 'Confirm Delete', body: 'Are you sure you want to delete this category?', cancel: 'Cancel', confirm: 'Delete' },
      btn: { edit: 'Edit', delete: 'Delete', refresh: 'Refresh' },
      noData: 'No categories found.'
    },
    thai: {
      title: 'จัดการหมวดหมู่',
      subtitle: 'จัดระเบียบสินค้าด้วยหมวดหมู่',
      searchPlaceholder: 'ค้นหาหมวดหมู่...',
      createBtn: 'เพิ่มหมวดหมู่',
      headers: { nameEn: 'ชื่อหมวดหมู่ (อังกฤษ)', nameTh: 'ชื่อหมวดหมู่ (ไทย)', id: 'รหัส', actions: 'จัดการ' },
      modal: { title: 'ยืนยันการลบ', body: 'คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? การกระทำนี้ไม่สามารถย้อนกลับได้', cancel: 'ยกเลิก', confirm: 'ลบหมวดหมู่' },
      btn: { edit: 'แก้ไข', delete: 'ลบ', refresh: 'รีเฟรช' },
      noData: 'ไม่พบหมวดหมู่'
    }
  }[language || 'en'];

  // Handlers
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(categoryToDelete._id || categoryToDelete.id).unwrap();
      toast.success('Category deleted successfully');
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
    <Container fluid className="py-4 font-prompt">
      
      {/* Header Section */}
      <Card className="shadow-sm border-0 mb-4 rounded-4 bg-white">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={5}>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle shadow-sm me-3 text-info border border-info border-opacity-10">
                    <FaLayerGroup size={24} />
                </div>
                <div>
                    <h4 className="mb-1 fw-bold text-dark">{t.title}</h4>
                    <p className="mb-0 text-muted small">{t.subtitle}</p>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="d-flex flex-column flex-md-row gap-2 justify-content-lg-end">
                {/* Search */}
                <InputGroup className="shadow-sm" style={{ maxWidth: '350px' }}>
                    <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                    <Form.Control
                        placeholder={t.searchPlaceholder}
                        className="border-start-0 ps-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <Button variant="white" className="border-top border-bottom border-end" onClick={() => setSearchTerm('')}>
                            <FaTimes className="text-muted" />
                        </Button>
                    )}
                </InputGroup>

                {/* Create Button */}
                <Link to="/admin/category/create" className="btn btn-primary shadow-sm d-flex align-items-center justify-content-center text-decoration-none">
                    <FaPlus className="me-2" /> {t.createBtn}
                </Link>

                {/* Refresh */}
                <Button variant="white" className="shadow-sm border" onClick={refetch} title={t.btn.refresh}>
                    <FaSync className={isLoading ? 'fa-spin text-info' : 'text-info'} />
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-5"><Loader /></div>
      ) : error ? (
        <Message variant="danger">{error?.data?.message || error.error || 'Error loading categories'}</Message>
      ) : !filteredCategories || filteredCategories.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border border-dashed">
            <FaTags size={40} className="text-secondary opacity-25 mb-3"/>
            <h5 className="mb-0 fw-normal">{t.noData}</h5>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="shadow-sm border-0 rounded-4 d-none d-lg-block overflow-hidden">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 ps-4 text-start text-secondary text-uppercase small border-0 fw-bold" style={{width: '35%'}}>{t.headers.nameEn}</th>
                  <th className="py-3 text-start text-secondary text-uppercase small border-0 fw-bold" style={{width: '35%'}}>{t.headers.nameTh}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0 fw-bold">{t.headers.id}</th>
                  <th className="py-3 pe-4 text-end text-secondary text-uppercase small border-0 fw-bold">{t.headers.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCategories.map((category, index) => (
                  <tr key={category._id || category.id || index} className="border-bottom-0 row-hover">
                    <td className="ps-4 py-3 text-start fw-bold text-primary">
                      {category.categoryName}
                    </td>
                    <td className="text-start">
                      {category.categoryNameThai || '-'}
                    </td>
                    <td className="text-center text-muted small font-monospace">
                      {String(category._id || category.id).substring(0, 10)}...
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.edit}</Tooltip>}>
                            <Link to={`/admin/category/${category._id || category.id}/edit`}>
                                <Button variant="white" size="sm" className="btn-icon rounded-circle border shadow-sm text-secondary hover-primary">
                                    <FaEdit />
                                </Button>
                            </Link>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.delete}</Tooltip>}>
                            <Button variant="white" size="sm" className="btn-icon rounded-circle border shadow-sm text-secondary hover-danger" onClick={() => handleDeleteClick(category)}>
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
              <Card key={category._id || category.id || index} className="shadow-sm border-0 rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-light p-2 rounded-circle me-3 border text-secondary">
                        <FaTags />
                    </div>
                    <div className="overflow-hidden">
                        <h6 className="fw-bold mb-0 text-truncate text-primary">{category.categoryName}</h6>
                        <small className="text-muted">{category.categoryNameThai || '-'}</small>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Link to={`/admin/category/${category._id || category.id}/edit`} className="btn btn-outline-dark btn-sm flex-fill rounded-pill border-opacity-25">
                        <FaEdit className="me-1"/> {t.btn.edit}
                    </Link>
                    <Button variant="outline-danger" size="sm" className="flex-fill rounded-pill border-opacity-25" onClick={() => handleDeleteClick(category)}>
                        <FaTrash className="me-1"/> {t.btn.delete}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="font-prompt">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="text-danger fw-bold fs-5"><FaTrash className="me-2"/>{t.modal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p className="text-muted mb-3">{t.modal.body}</p>
            {categoryToDelete && (
                <div className="bg-light p-3 rounded-3 border">
                    <div className="fw-bold text-dark">{categoryToDelete.categoryName}</div>
                    <small className="text-muted">{categoryToDelete.categoryNameThai}</small>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">{t.modal.cancel}</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="rounded-pill px-4 shadow-sm" disabled={loadingDelete}>
                {loadingDelete ? 'Deleting...' : t.modal.confirm}
            </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .row-hover:hover { background-color: #f8f9fa; transition: background-color 0.2s; }
        .btn-icon { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .hover-primary:hover { color: #0d6efd !important; background-color: #f8f9fa; border-color: #0d6efd !important; }
        .hover-danger:hover { color: #dc3545 !important; background-color: #f8f9fa; border-color: #dc3545 !important; }
      `}</style>
    </Container>
  );
};

export default CategoryListScreen;