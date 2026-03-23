import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetStockIssueByIdQuery } from '../../../slices/stockIssueApiSlice';
import { Row, Col, Image, Card, Button, Container, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import {
    FaArrowLeft, FaBox, FaCalendarAlt, FaIndustry,
    FaMapMarkerAlt, FaLink, FaLayerGroup, FaWeightHanging, FaAlignLeft, FaRegCopy
} from 'react-icons/fa';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { toast } from 'react-toastify';

// Helper to format date nicely
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const StockIssueDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading, isError } = useGetStockIssueByIdQuery(id);

    if (isLoading) return <Loader />;
    if (isError) return <Message variant="danger">Error loading details</Message>;
    if (!product) return <Message variant="info">Product not found</Message>;

    // --- Copy Function ---
    const handleCopy = (e, text, label) => {
        e.stopPropagation(); // Prevent bubbling
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success(`Copied ${label}`, { autoClose: 1000, hideProgressBar: true, position: "bottom-center" });
        }
    };

    // --- Reusable Detail Row Component ---
    const DetailRow = ({ icon, label, value, isLink = false }) => (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
            <div className="d-flex align-items-center text-muted small" style={{ minWidth: '120px' }}>
                {icon && <span className="text-secondary opacity-75 me-2">{icon}</span>}
                <span className="fw-semibold">{label}</span>
            </div>
            <div className="d-flex align-items-center gap-2 text-dark text-end text-break">
                {isLink && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        Open Link <FaLink size={12} />
                    </a>
                ) : (
                    <span className="fw-medium">{value || '-'}</span>
                )}

                {/* Copy Button (only if value exists and is not a link) */}
                {value && value !== '-' && !isLink && (
                    <OverlayTrigger placement="top" overlay={<Tooltip>Copy</Tooltip>}>
                        <span
                            className="text-muted cursor-pointer hover-primary ms-1"
                            onClick={(e) => handleCopy(e, value, label)}
                            style={{ cursor: 'pointer' }}
                        >
                            <FaRegCopy size={14} />
                        </span>
                    </OverlayTrigger>
                )}
            </div>
        </div>
    );

    return (
        <Container fluid className="py-4 bg-light min-vh-100 font-sans">
            {/* Header / Back Button */}
            <div className="mb-4">
                <Button variant="link" className="text-decoration-none text-dark p-0 fw-bold d-flex align-items-center" onClick={() => navigate('/componentissuelist')}>
                    <div className="bg-white border rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm" style={{ width: 32, height: 32 }}>
                        <FaArrowLeft size={14} />
                    </div>
                    Back to List
                </Button>
            </div>

            <Row className="g-4 justify-content-center">
                {/* Left Column: Image & Status */}
                <Col lg={4} xl={3}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                        <div className="bg-white p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '300px', backgroundColor: '#f8f9fa' }}>
                            {product.img ? (
                                <Image src={`/componentImages${product.img}`} fluid style={{ maxHeight: '250px', objectFit: 'contain' }} />
                            ) : (
                                <div className="text-center text-muted opacity-50">
                                    <FaBox size={64} className="mb-2" />
                                    <p>No Image Available</p>
                                </div>
                            )}
                        </div>
                        <Card.Body className="border-top bg-white">
                            <div className="d-grid gap-2">
                                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                                    <span className="text-muted small fw-bold">ISSUED QUANTITY</span>
                                    <span className="fs-4 fw-bold text-success">{product.issueqty}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                                    <span className="text-muted small">Request Qty:</span>
                                    <span className="fw-bold">{product.requestqty}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column: Details */}
                <Col lg={8} xl={9}>
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body className="p-4">
                            {/* Header Info */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4">
                                <div style={{ flex: 1 }}> {/* Allow title to take space */}
                                    <Badge bg="primary" className="mb-2 bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold px-3 py-2">
                                        ISSUE NO: {product.issueno}
                                    </Badge>

                                    {/* Title with Copy Button */}
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <h2 className="fw-bold text-dark mb-0">{product.electotronixPN || product.manufacturePN}</h2>
                                        <OverlayTrigger overlay={<Tooltip>Copy Name</Tooltip>}>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="rounded-circle border d-flex align-items-center justify-content-center p-0"
                                                style={{ width: '28px', height: '28px' }}
                                                onClick={(e) => handleCopy(e, product.electotronixPN || product.manufacturePN, 'Product Name')}
                                            >
                                                <FaRegCopy className="text-secondary" size={14} />
                                            </Button>
                                        </OverlayTrigger>
                                    </div>

                                    <div className="d-flex gap-2 mt-2">
                                        {product.category && <Badge bg="light" text="dark" className="border fw-normal">{product.category}</Badge>}
                                        {product.subcategory && <Badge bg="light" text="dark" className="border fw-normal">{product.subcategory}</Badge>}
                                    </div>
                                </div>
                                <div className="text-md-end mt-3 mt-md-0">
                                    <div className="text-muted small mb-1">Issue Date</div>
                                    <div className="fw-bold d-flex align-items-center justify-content-md-end gap-2">
                                        <FaCalendarAlt className="text-primary" /> {formatDate(product.issuedate)}
                                    </div>
                                </div>
                            </div>

                            <hr className="text-muted opacity-25 my-4" />

                            {/* Description Section */}
                            <div className="mb-5">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center">
                                        <FaAlignLeft className="me-2" /> Description
                                    </h6>
                                    {/* Copy Description Button at Header */}
                                    {product.description && (
                                        <OverlayTrigger overlay={<Tooltip>Copy Description</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className="text-muted p-0 d-flex align-items-center text-decoration-none hover-primary"
                                                style={{ fontSize: '0.85rem' }}
                                                onClick={(e) => handleCopy(e, product.description, 'Description')}
                                            >
                                                <FaRegCopy className="me-1" /> Copy
                                            </Button>
                                        </OverlayTrigger>
                                    )}
                                </div>
                                <div className="text-dark bg-light p-3 rounded-3 position-relative">
                                    <p className="mb-0" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {product.description || <span className="text-muted fst-italic">No description provided.</span>}
                                    </p>
                                </div>
                            </div>

                            <Row className="g-4">
                                {/* Specifications */}
                                <Col md={6}>
                                    <Card className="h-100 border bg-white shadow-none">
                                        <Card.Header className="bg-white border-bottom py-3 fw-bold text-primary">
                                            <FaLayerGroup className="me-2" /> Specifications
                                        </Card.Header>
                                        <Card.Body className="p-3">
                                            <DetailRow icon={<FaMapMarkerAlt />} label="Footprint" value={product.footprint} />
                                            <DetailRow icon={<FaMapMarkerAlt />} label="Position" value={product.position} />
                                            <DetailRow icon={<FaWeightHanging />} label="Weight" value={product.weight} />
                                            <DetailRow icon={<FaBox />} label="Value" value={product.value} />
                                            <DetailRow icon={<FaLink />} label="Datasheet" value={product.link} isLink={true} />
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Supply Chain */}
                                <Col md={6}>
                                    <Card className="h-100 border bg-white shadow-none">
                                        <Card.Header className="bg-white border-bottom py-3 fw-bold text-success">
                                            <FaIndustry className="me-2" /> Supply Chain
                                        </Card.Header>
                                        <Card.Body className="p-3">
                                            <DetailRow label="Manufacturer" value={product.manufacture} />
                                            <DetailRow label="Mfg Part No." value={product.manufacturePN} />
                                            <DetailRow label="Supplier" value={product.supplier} />
                                            <DetailRow label="Supplier P/N" value={product.supplierPN} />
                                            <DetailRow label="Request No." value={product.requestno} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Note Section (if exists) */}
                            {product.note && (
                                <div className="mt-4 p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3">
                                    <h6 className="fw-bold text-warning-emphasis mb-1">Note:</h6>
                                    <p className="mb-0 text-dark small">{product.note}</p>
                                </div>
                            )}

                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style jsx>{`
        .font-sans { font-family: 'Inter', system-ui, sans-serif; }
        .hover-primary:hover { color: #0d6efd !important; transform: scale(1.05); transition: all 0.2s; }
      `}</style>
        </Container>
    );
};

export default StockIssueDetailScreen;