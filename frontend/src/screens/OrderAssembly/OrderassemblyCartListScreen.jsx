import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Button, Row, Col, Card, Container, Badge, InputGroup, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCheck, FaEdit, FaSearch, FaCogs, FaTimes, FaFilter, FaSync } from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetAllAssemblycartsQuery } from '../../slices/assemblypcbCartApiSlice';
import OrderassemblyCartConfirmModle from './OrderassemblyCartConfirmModle';

const OrderassemblyCartListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  
  // เรียก API Get All
  const { data: rawData, isLoading, error, refetch } = useGetAllAssemblycartsQuery(userInfo?._id, {
    skip: !userInfo?._id,
  });

  // State
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Translations
  const translations = {
    en: {
      title: 'Assembly PCB Orders',
      subtitle: 'Review & Approve Assembly Requests',
      searchPlaceholder: 'Search project...',
      statusAll: 'All Status',
      headers: { id: '#', project: 'Project Name', type: 'Type', qty: 'Qty', price: 'Price', date: 'Date', status: 'Status', actions: 'Actions' },
      status: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
      noData: 'No assembly orders found.',
      btn: { confirm: 'Approve', edit: 'Edit' },
      est: '(Est.)',
    },
    thai: {
      title: 'รายการคำสั่งซื้องานประกอบ (Assembly)',
      subtitle: 'ตรวจสอบและอนุมัติงานประกอบแผงวงจร',
      searchPlaceholder: 'ค้นหาชื่อโปรเจกต์...',
      statusAll: 'สถานะทั้งหมด',
      headers: { id: '#', project: 'ชื่อโปรเจกต์', type: 'ประเภท', qty: 'จำนวน', price: 'ราคาประเมิน', date: 'วันที่', status: 'สถานะ', actions: 'จัดการ' },
      status: { pending: 'รอตรวจสอบ', accepted: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' },
      noData: 'ไม่พบรายการคำสั่งซื้อ',
      btn: { confirm: 'อนุมัติ', edit: 'แก้ไข' },
      est: '(ประเมิน)',
    }
  };
  const t = translations[language] || translations.en;

  // --- Handlers ---
  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  // --- Logic ---
  const filteredOrders = useMemo(() => {
    const orders = rawData?.data || (Array.isArray(rawData) ? rawData : []) || [];
    if (!Array.isArray(orders)) return [];

    let processed = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(item => item.projectname?.toLowerCase().includes(lowerTerm));
    }

    if (filterStatus !== 'all') {
      processed = processed.filter(item => item.status === filterStatus);
    }

    return processed.filter(item => item.pcb_qty && parseInt(item.pcb_qty) > 0);
  }, [rawData, searchTerm, filterStatus]);

  // --- UI Components ---
  const StatusBadge = ({ status }) => {
    let variant = 'secondary';
    let text = status;
    let icon = null;

    if (status === 'pending') {
      variant = 'warning';
      text = t.status.pending;
      icon = <span className="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true" style={{width:'0.5rem', height:'0.5rem'}}></span>;
    } else if (status === 'accepted') {
      variant = 'success';
      text = t.status.accepted;
      icon = <FaCheck className="me-1" />;
    } else if (status === 'rejected') {
      variant = 'danger';
      text = t.status.rejected;
      icon = <FaTimes className="me-1" />;
    }

    return (
      <Badge bg={variant} text={variant === 'warning' ? 'dark' : 'white'} className="px-3 py-2 rounded-pill d-inline-flex align-items-center fw-normal shadow-sm">
        {icon} {text}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const AssemblyTypeBadge = ({ smd, tht }) => (
    <div className="d-flex gap-1 justify-content-center flex-wrap">
      {(smd && smd > 0) ? <Badge bg="info" className="text-dark bg-opacity-25 border border-info px-2" style={{fontSize:'0.65rem'}}>SMD</Badge> : null}
      {(tht && tht > 0) ? <Badge bg="warning" className="text-dark bg-opacity-25 border border-warning px-2" style={{fontSize:'0.65rem'}}>THT</Badge> : null}
      {(!smd && !tht) && <span className="text-muted small">-</span>}
    </div>
  );

  return (
    <Container fluid className="py-4 font-prompt">
      <Card className="shadow-sm border-0 mb-4 rounded-4 bg-white">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={5}>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle shadow-sm me-3 text-primary border border-primary border-opacity-10">
                    <FaCogs size={24} />
                </div>
                <div>
                    <h4 className="mb-1 fw-bold text-dark">{t.title}</h4>
                    <p className="mb-0 text-muted small">{t.subtitle}</p>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="d-flex flex-column flex-md-row gap-2 justify-content-lg-end">
                <InputGroup className="shadow-sm" style={{ maxWidth: '300px' }}>
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control
                    placeholder={t.searchPlaceholder}
                    className="border-start-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <InputGroup className="shadow-sm" style={{ maxWidth: '200px' }}>
                  <InputGroup.Text className="bg-white border-end-0"><FaFilter className="text-muted" /></InputGroup.Text>
                  <Form.Select 
                    className="border-start-0 cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">{t.statusAll}</option>
                    <option value="pending">{t.status.pending}</option>
                    <option value="accepted">{t.status.accepted}</option>
                    <option value="rejected">{t.status.rejected}</option>
                  </Form.Select>
                </InputGroup>

                <Button variant="white" className="shadow-sm border bg-white" onClick={refetch} title="Refresh">
                    <FaSync className={isLoading ? 'fa-spin text-primary' : 'text-primary'} />
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5"><Loader /></div>
      ) : error ? (
        <Message variant="danger">{error?.data?.message || error.message || 'Error loading data'}</Message>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border border-dashed">
            <FaCogs size={40} className="text-secondary opacity-25 mb-3"/>
            <h5 className="mb-0 fw-normal">{t.noData}</h5>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="shadow-sm border-0 rounded-4 d-none d-lg-block overflow-hidden">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 ps-4 text-secondary text-uppercase small border-0">#</th>
                  <th className="py-3 text-secondary text-uppercase small border-0">{t.headers.project}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0">{t.headers.type}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0">{t.headers.qty}</th>
                  <th className="py-3 text-end text-secondary text-uppercase small border-0">{t.headers.price}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0">{t.headers.date}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0">{t.headers.status}</th>
                  <th className="py-3 text-center text-secondary text-uppercase small border-0">{t.headers.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredOrders.map((order, index) => (
                  <tr key={order.id || index} className="border-bottom-0 row-hover">
                    <td className="ps-4 fw-bold text-muted">{index + 1}</td>
                    <td>
                        <div className="fw-bold text-dark text-truncate" style={{maxWidth:'200px'}}>{order.projectname}</div>
                        <small className="text-muted" style={{fontSize:'0.75rem'}}>ID: {order.id}</small>
                    </td>
                    <td className="text-center">
                        <AssemblyTypeBadge smd={order.count_smd} tht={order.count_tht} />
                    </td>
                    <td className="text-center">
                        <Badge bg="light" text="dark" className="border px-3">{order.pcb_qty}</Badge>
                    </td>
                    <td className="text-end fw-bold text-primary">
                      {order.confirmed_price ? formatCurrency(order.confirmed_price) : formatCurrency(order.estimatedCost)}
                      {!order.confirmed_price && <small className="d-block text-muted" style={{fontSize:'0.6rem'}}>{t.est}</small>}
                    </td>
                    <td className="text-center text-muted small">
                      {new Date(order.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        {order.status === 'pending' ? (
                           <>
                            {/* ปุ่ม Approve */}
                            <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.confirm}</Tooltip>}>
                                <Button variant="outline-success" size="sm" className="rounded-circle btn-icon" onClick={() => handleShowModal(order.id)}>
                                    <FaCheck />
                                </Button>
                            </OverlayTrigger>
                           </>
                        ) : (
                           // ถ้าสถานะไม่ใช่ Pending แสดงไอคอนสถานะจางๆ
                           <div className="btn-icon rounded-circle">
                             {order.status === 'rejected' ? <FaTimes className="text-danger opacity-25"/> : <FaCheck className="text-success opacity-25"/>}
                           </div>
                        )}
                        
                        {/* ปุ่ม Edit */}
                        <OverlayTrigger placement="top" overlay={<Tooltip>{t.btn.edit}</Tooltip>}>
                            <Link to={`/admin/cartassemblypcblist/${order.id}/edit`}>
                                <Button variant="outline-primary" size="sm" className="rounded-circle btn-icon">
                                    <FaEdit />
                                </Button>
                            </Link>
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
            {filteredOrders.map((order) => (
              <Card key={order.id} className="shadow-sm border-0 rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 flex-shrink-0">
                            <FaCogs />
                        </div>
                        <div className="text-truncate">
                            <h6 className="fw-bold mb-0 text-truncate">{order.projectname}</h6>
                            <small className="text-muted" style={{fontSize: '0.7rem'}}>{new Date(order.created_at).toLocaleDateString('th-TH')}</small>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ms-2">
                        <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <Row className="g-2 mb-3 bg-light p-2 rounded-3 mx-0 border border-light">
                    <Col xs={6}>
                        <small className="text-muted d-block" style={{fontSize:'0.7rem'}}>{t.headers.qty}</small>
                        <span className="fw-bold">{order.pcb_qty}</span>
                    </Col>
                    <Col xs={6} className="text-end">
                        <small className="text-muted d-block" style={{fontSize:'0.7rem'}}>{t.headers.price}</small>
                        <span className="fw-bold text-primary">
                            {order.confirmed_price ? formatCurrency(order.confirmed_price) : formatCurrency(order.estimatedCost)}
                        </span>
                    </Col>
                    <Col xs={12} className="border-top mt-2 pt-2 d-flex justify-content-between align-items-center">
                        <small className="text-muted">Type:</small>
                        <AssemblyTypeBadge smd={order.count_smd} tht={order.count_tht} />
                    </Col>
                  </Row>
                  <div className="d-flex gap-2">
                    {order.status === 'pending' && (
                       <>
                        <Button variant="success" size="sm" className="flex-grow-1 rounded-3" onClick={() => handleShowModal(order.id)}>
                            <FaCheck className="me-1"/> {t.btn.confirm}
                        </Button>
                       </>
                    )}
                    
                    <Link to={`/admin/cartassemblypcblist/${order.id}/edit`} className="btn btn-outline-primary btn-sm flex-grow-1 rounded-3 d-flex align-items-center justify-content-center">
                        <FaEdit className="me-1"/> {t.btn.edit}
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </>
      )}

      <OrderassemblyCartConfirmModle
        show={showModal}
        handleClose={handleCloseModal}
        pcborderId={selectedOrderId}
        onConfirm={() => {
            refetch();
            handleCloseModal();
        }}
      />

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .row-hover:hover { background-color: #f8f9fa; transition: background-color 0.2s; }
        .btn-icon { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon:hover { transform: scale(1.1); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </Container>
  );
};

export default OrderassemblyCartListScreen;