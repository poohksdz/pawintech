import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Button, Row, Col, Card, Container, InputGroup, Form, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaUserTie, FaMapMarkerAlt, FaIdCard, FaSync, FaTimes, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
// ✅ แก้ไขชื่อ Hook ให้ถูกต้อง (ตัว C ใหญ่)
import { useGetCustomersQuery, useDeleteCustomerMutation } from '../../slices/customersApiSlice';

const CustomerListScreen = () => {
  const { language } = useSelector((state) => state.language);
  
  // API Calls
  const { data: customersData, refetch, isLoading, error } = useGetCustomersQuery();
  const [deleteCustomer, { isLoading: loadingDelete }] = useDeleteCustomerMutation();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Translations
  const translations = {
    en: {
      title: 'Customer Management',
      subtitle: 'Manage customer information and addresses',
      searchPlaceholder: 'Search customer name or tax ID...',
      createBtn: 'Add Customer',
      headers: { name: 'Customer Name', contact: 'Contact / Tax ID', address: 'Address', actions: 'Actions' },
      modal: { title: 'Confirm Delete', body: 'Are you sure you want to delete this customer?', cancel: 'Cancel', confirm: 'Delete' },
      btn: { edit: 'Edit', delete: 'Delete', refresh: 'Refresh' },
      noData: 'No customers found.'
    },
    thai: {
      title: 'จัดการข้อมูลลูกค้า',
      subtitle: 'จัดการรายชื่อลูกค้าและที่อยู่สำหรับออกเอกสาร',
      searchPlaceholder: 'ค้นหาชื่อลูกค้า หรือเลขผู้เสียภาษี...',
      createBtn: 'เพิ่มลูกค้าใหม่',
      headers: { name: 'ชื่อลูกค้า', contact: 'ผู้ติดต่อ / เลขผู้เสียภาษี', address: 'ที่อยู่', actions: 'จัดการ' },
      modal: { title: 'ยืนยันการลบ', body: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลลูกค้ารายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', cancel: 'ยกเลิก', confirm: 'ลบข้อมูล' },
      btn: { edit: 'แก้ไข', delete: 'ลบ', refresh: 'รีเฟรช' },
      noData: 'ไม่พบข้อมูลลูกค้า'
    }
  };
  const t = translations[language] || translations.en;

  // --- Handlers ---
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCustomer(customerToDelete.id || customerToDelete._id).unwrap();
      toast.success('Customer deleted successfully');
      refetch();
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // --- Logic & Filter ---
  const filteredCustomers = useMemo(() => {
    // รองรับโครงสร้างข้อมูลแบบ { customers: [...] } หรือ [...]
    const customers = customersData?.customers || (Array.isArray(customersData) ? customersData : []) || [];
    
    if (!customers.length) return [];
    
    let processed = [...customers];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(c => 
        (c.customer_name && c.customer_name.toLowerCase().includes(lowerTerm)) || 
        (c.customer_vat && c.customer_vat.toLowerCase().includes(lowerTerm)) ||
        (c.customer_present_name && c.customer_present_name.toLowerCase().includes(lowerTerm))
      );
    }
    
    // เรียงลำดับล่าสุดก่อน (ถ้ามี field id หรือ created_at)
    processed.sort((a, b) => (b.id || 0) - (a.id || 0));

    return processed;
  }, [customersData, searchTerm]);

  return (
    <Container fluid className="py-4 font-prompt">
      
      {/* --- Header Section --- */}
      <Card className="shadow-sm border-0 mb-4 rounded-4 bg-white">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={5}>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle shadow-sm me-3 text-success border border-success border-opacity-10">
                    <FaUserTie size={24} />
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
                <Button as={Link} to="/admin/customers/set" variant="primary" className="shadow-sm d-flex align-items-center justify-content-center">
                    <FaPlus className="me-2" /> {t.createBtn}
                </Button>

                {/* Refresh */}
                <Button variant="white" className="shadow-sm border" onClick={refetch} title={t.btn.refresh}>
                    <FaSync className={isLoading ? 'fa-spin text-success' : 'text-success'} />
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* --- Content --- */}
      {isLoading ? (
        <div className="text-center py-5"><Loader /></div>
      ) : error ? (
        <Message variant="danger">{error?.data?.message || error.message || 'Error loading customers'}</Message>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border border-dashed">
            <FaUserTie size={40} className="text-secondary opacity-25 mb-3"/>
            <h5 className="mb-0 fw-normal">{t.noData}</h5>
        </div>
      ) : (
        <>
          {/* --- Desktop Table --- */}
          <Card className="shadow-sm border-0 rounded-4 d-none d-lg-block overflow-hidden">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 ps-4 text-secondary text-uppercase small border-0 fw-bold" style={{width: '25%'}}>{t.headers.name}</th>
                  <th className="py-3 text-secondary text-uppercase small border-0 fw-bold" style={{width: '20%'}}>{t.headers.contact}</th>
                  <th className="py-3 text-secondary text-uppercase small border-0 fw-bold" style={{width: '40%'}}>{t.headers.address}</th>
                  <th className="py-3 pe-4 text-end text-secondary text-uppercase small border-0 fw-bold">{t.headers.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id || index} className="border-bottom-0 row-hover">
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{customer.customer_name}</div>
                      <div className="text-muted small" style={{fontSize:'0.75rem'}}>ID: {customer.id}</div>
                    </td>
                    <td>
                        <div className="d-flex flex-column small">
                            {customer.customer_present_name && (
                                <span className="mb-1 text-dark fw-semibold"><FaUserTie className="me-1 text-primary opacity-50"/> {customer.customer_present_name}</span>
                            )}
                            {customer.customer_vat && (
                                <span className="text-muted font-monospace"><FaIdCard className="me-1 text-success opacity-50"/> {customer.customer_vat}</span>
                            )}
                        </div>
                    </td>
                    <td>
                        <div className="text-muted small d-flex">
                            <FaMapMarkerAlt className="me-2 text-danger opacity-50 mt-1 flex-shrink-0"/>
                            <span className="text-truncate-2-lines">{customer.customer_address}</span>
                        </div>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.edit}</Tooltip>}>
                            <Link to={`/admin/customers/${customer.id}/edit`}>
                                <Button variant="white" size="sm" className="btn-icon rounded-circle border shadow-sm text-secondary hover-primary">
                                    <FaEdit />
                                </Button>
                            </Link>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.delete}</Tooltip>}>
                            <Button variant="white" size="sm" className="btn-icon rounded-circle border shadow-sm text-secondary hover-danger" onClick={() => handleDeleteClick(customer)}>
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

          {/* --- Mobile Cards --- */}
          <div className="d-lg-none d-flex flex-column gap-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="shadow-sm border-0 rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-light p-2 rounded-circle me-3 border text-secondary">
                        <FaUserTie />
                    </div>
                    <div className="overflow-hidden">
                        <h6 className="fw-bold mb-0 text-truncate text-dark">{customer.customer_name}</h6>
                        <small className="text-muted font-monospace"><FaIdCard className="me-1 text-success opacity-50"/>{customer.customer_vat || '-'}</small>
                    </div>
                  </div>
                  
                  <div className="bg-light p-2 rounded-3 mb-3 small text-muted border border-light">
                    <div className="d-flex mb-1">
                        <FaUserTie className="me-2 text-primary opacity-50 mt-1"/> 
                        <span>{customer.customer_present_name || '-'}</span>
                    </div>
                    <div className="d-flex">
                        <FaMapMarkerAlt className="me-2 text-danger opacity-50 mt-1"/> 
                        <span>{customer.customer_address || '-'}</span>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Link to={`/admin/customers/${customer.id}/edit`} className="btn btn-outline-dark btn-sm flex-fill rounded-pill border-opacity-25">
                        <FaEdit className="me-1"/> {t.btn.edit}
                    </Link>
                    <Button variant="outline-danger" size="sm" className="flex-fill rounded-pill border-opacity-25" onClick={() => handleDeleteClick(customer)}>
                        <FaTrash className="me-1"/> {t.btn.delete}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="font-prompt">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="text-danger fw-bold fs-5"><FaTrash className="me-2"/>{t.modal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p className="text-muted mb-3">{t.modal.body}</p>
            {customerToDelete && (
                <div className="bg-light p-3 rounded-3 border">
                    <div className="fw-bold text-dark">{customerToDelete.customer_name}</div>
                    <div className="small text-muted">{customerToDelete.customer_vat}</div>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">{t.modal.cancel}</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="rounded-pill px-4 shadow-sm" disabled={loadingDelete}>
                {loadingDelete ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {t.modal.confirm}
            </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .row-hover:hover { background-color: #f8f9fa; transition: background-color 0.2s; }
        .text-truncate-2-lines { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .btn-icon { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .hover-primary:hover { color: #0d6efd !important; background-color: #f8f9fa; border-color: #0d6efd !important; }
        .hover-danger:hover { color: #dc3545 !important; background-color: #f8f9fa; border-color: #dc3545 !important; }
      `}</style>
    </Container>
  );
};

export default CustomerListScreen;