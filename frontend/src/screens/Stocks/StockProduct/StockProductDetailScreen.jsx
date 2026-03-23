import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetStockProductByIdQuery } from '../../../slices/stockProductApiSlice';
import { Row, Col, Image, Card, Button, Container, OverlayTrigger, Tooltip } from 'react-bootstrap'; // ลบ Badge ออกจากบรรทัดนี้แล้ว
import {
    FaArrowLeft, FaBox, FaRegCopy, FaCalendarAlt, FaIndustry, FaTag,
    FaLink, FaLayerGroup, FaWeightHanging, FaMapMarkerAlt, FaCheckCircle,
    FaDollarSign, FaMicrochip, FaCubes, FaClipboardList
} from 'react-icons/fa';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { toast } from 'react-toastify';

const StockProductDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading, isError } = useGetStockProductByIdQuery(id);

    if (isLoading) return <Loader />;
    if (isError) return <Message variant="danger">Error loading product details</Message>;

    // --- Helper: Smart Copy Component ---
    const CopyItem = ({ text, label, className = "" }) => {
        if (!text || text === '-') return <span className="text-muted">-</span>;

        const handleCopy = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text);
            toast.success(
                <div className="d-flex align-items-center">
                    <FaCheckCircle className="me-2 text-success" />
                    <span>Copied <strong>{label}</strong></span>
                </div>,
                { position: "bottom-center", autoClose: 1000, hideProgressBar: true, closeButton: false, className: 'custom-toast' }
            );
        };

        return (
            <OverlayTrigger placement="top" overlay={<Tooltip>Click to copy</Tooltip>}>
                <div
                    className={`smart-copy-wrapper ${className}`}
                    onClick={handleCopy}
                >
                    <span className="copy-text">{text}</span>
                    <FaRegCopy className="copy-icon" size={12} />
                </div>
            </OverlayTrigger>
        );
    };

    // --- Helper: Detail Row Layout ---
    const DetailRow = ({ icon, label, value, isLink = false, highlight = false }) => (
        <div className="detail-row-item">
            <div className="detail-label-group">
                {icon && <span className="detail-icon-wrapper">{icon}</span>}
                <span className="detail-label-text">{label}</span>
            </div>
            <div className={`detail-value-group ${highlight ? 'fw-bold text-dark' : ''}`}>
                {isLink && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="datasheet-btn">
                        Open Link <FaLink size={10} className="ms-1" />
                    </a>
                ) : (
                    <CopyItem text={value} label={label} />
                )}
            </div>
        </div>
    );

    return (
        <Container fluid className="stock-detail-page text-start">

            {/* --- Header Navigation --- */}
            <div className="page-header">
                <Button variant="link" className="btn-back-nav" onClick={() => navigate('/componenteditlist')}>
                    <div className="icon-circle"><FaArrowLeft size={12} /></div>
                    <span>Back to Product List</span>
                </Button>
            </div>

            {/* --- HERO SECTION --- */}
            <Card className="hero-card border-0 mb-4 shadow-sm">
                <Card.Body className="p-0">
                    <Row className="g-0">
                        <Col md={3} className="hero-image-section border-end bg-white d-flex align-items-center justify-content-center p-4">
                            <div className="image-container text-center">
                                {product.img ? (
                                    <Image src={`/componentImages${product.img}`} alt="Product" fluid style={{ maxHeight: '200px' }} />
                                ) : (
                                    <div className="no-image opacity-25">
                                        <FaBox size={40} className="mb-2" />
                                        <div className="small">No Image</div>
                                    </div>
                                )}
                            </div>
                        </Col>

                        <Col md={9} className="hero-info-section p-4 bg-white">
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                    <div className="badge-group mb-2">
                                        <span className="badge-pill bg-primary bg-opacity-10 text-primary small px-2 py-1 rounded me-2 fw-bold">{product.category}</span>
                                        <span className="text-muted small">/</span>
                                        <span className="badge-pill bg-light text-secondary small px-2 py-1 rounded ms-2 fw-bold">{product.subcategory}</span>
                                    </div>

                                    <h1 className="hero-mpn fw-bold mb-3 mt-2" style={{ fontSize: '2.5rem' }}>
                                        <CopyItem text={product.electotronixPN} label="Electotronix PN" />
                                    </h1>

                                    <div className="hero-value d-flex align-items-center">
                                        <span className="text-muted fw-bold small me-2">VALUE:</span>
                                        <span className="h5 mb-0 fw-bold text-primary"><CopyItem text={product.value} label="Value" /></span>
                                    </div>
                                </div>

                                <div className="qty-block bg-light p-3 rounded-4 text-center" style={{ minWidth: '160px' }}>
                                    <div className="small fw-bold text-muted mb-1">CURRENT STOCK</div>
                                    <div className={`h2 mb-0 fw-bold ${product.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                                        <CopyItem text={product.quantity} label="Quantity" />
                                    </div>
                                    <div className="small text-muted">UNITS AVAILABLE</div>
                                </div>
                            </div>

                            <div className="hero-description mt-4 pt-3 border-top">
                                <div className="small fw-bold text-muted mb-2">DESCRIPTION</div>
                                <p className="text-secondary mb-0">
                                    <CopyItem text={product.description} label="Description" />
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* --- DETAILS GRID --- */}
            <Row className="g-4">
                <Col lg={4}>
                    <Card className="info-card h-100 border-0 shadow-sm rounded-4">
                        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                            <div className="d-flex align-items-center">
                                <div className="bg-info bg-opacity-10 text-info p-2 rounded-3 me-3"><FaLayerGroup /></div>
                                <span className="fw-bold">Technical Specs</span>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <DetailRow icon={<FaMicrochip />} label="Footprint" value={product.footprint} />
                            <DetailRow icon={<FaMapMarkerAlt />} label="Position" value={product.position} />
                            <DetailRow icon={<FaIndustry />} label="Process" value={product.process} />
                            <DetailRow icon={<FaWeightHanging />} label="Weight" value={product.weight} />
                            <DetailRow icon={<FaTag />} label="Alternative" value={product.alternative} />
                            <DetailRow icon={<FaLink />} label="Datasheet/Link" value={product.link} isLink={true} />
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="info-card h-100 border-0 shadow-sm rounded-4">
                        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                            <div className="d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3"><FaIndustry /></div>
                                <span className="fw-bold">Supply Chain</span>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <DetailRow label="Manufacturer" value={product.manufacture} />
                            <DetailRow label="Mfg Part No." value={product.manufacturePN} />
                            <hr className="my-3 opacity-50" />
                            <DetailRow label="Supplier" value={product.supplier} />
                            <DetailRow label="Supplier PN" value={product.supplierPN} />
                            <DetailRow icon={<FaDollarSign />} label="Price" value={product.price} highlight={true} />

                            <Row className="mt-3 g-2">
                                <Col>
                                    <div className="bg-light p-2 rounded text-center">
                                        <span className="d-block small text-muted fw-bold">MOQ</span>
                                        <span className="fw-bold"><CopyItem text={product.moq} label="MOQ" /></span>
                                    </div>
                                </Col>
                                <Col>
                                    <div className="bg-light p-2 rounded text-center">
                                        <span className="d-block small text-muted fw-bold">SPQ</span>
                                        <span className="fw-bold"><CopyItem text={product.spq} label="SPQ" /></span>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="info-card h-100 border-0 shadow-sm rounded-4">
                        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                            <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3"><FaCubes /></div>
                                <span className="fw-bold">Inventory Info</span>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <DetailRow icon={<FaBox />} label="Total Quantity" value={product.quantity} highlight={true} />
                            <DetailRow icon={<FaCalendarAlt />} label="Date Added" value={product.date} />

                            <div className="mt-4 p-3 rounded-4 bg-warning bg-opacity-10 border-start border-4 border-warning">
                                <span className="d-block small fw-bold text-warning mb-1"><FaClipboardList className="me-1" /> NOTE</span>
                                <div className="text-dark small">
                                    <CopyItem text={product.note} label="Note" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StockProductDetailScreen;