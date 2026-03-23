import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// FIX: เปลี่ยนชื่อ Hook ให้ถูกต้อง
import { useGetStockRequestDetailsQuery } from '../../../slices/stockRequestApiSlice';
import { Row, Col, Image, Card, Button, Container, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    FaArrowLeft, FaBox, FaRegCopy, FaCalendarAlt, FaClock, FaIndustry,
    FaTag, FaLink, FaLayerGroup, FaWeightHanging, FaMapMarkerAlt,
    FaCheckCircle, FaDollarSign, FaClipboardList
} from 'react-icons/fa';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const StockRequestDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);

    // FIX: เรียกใช้ Hook ที่ถูกต้อง
    const { data: product, isLoading, isError } = useGetStockRequestDetailsQuery(id);

    if (isLoading) return <Loader />;
    if (isError) return <Message variant="danger">Error loading request details</Message>;

    const backLink = userInfo?.isStore ? '/componentrequestlist' : '/componentuserrequestlist';

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
                <div className={`smart-copy-wrapper ${className}`} onClick={handleCopy}>
                    <span className="copy-text">{text}</span>
                    <FaRegCopy className="copy-icon" size={12} />
                </div>
            </OverlayTrigger>
        );
    };

    const DetailRow = ({ icon, label, value, isLink = false }) => (
        <div className="detail-row-item">
            <div className="detail-label-group">
                {icon && <span className="detail-icon-wrapper">{icon}</span>}
                <span className="detail-label-text">{label}</span>
            </div>
            <div className="detail-value-group">
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
        <Container fluid className="stock-detail-page">
            <div className="page-header">
                <Button variant="link" className="btn-back-nav" onClick={() => navigate(backLink)}>
                    <div className="icon-circle"><FaArrowLeft size={12} /></div>
                    <span>Back to Request List</span>
                </Button>
            </div>

            <Card className="hero-card border-0">
                <Card.Body className="p-0">
                    <Row className="g-0">
                        <Col md={3} className="hero-image-section">
                            <div className="image-container">
                                {product.img ? (
                                    <Image src={`/componentImages${product.img}`} alt="Product" fluid />
                                ) : (
                                    <div className="no-image">
                                        <FaBox size={40} className="mb-2 opacity-25" />
                                        <span>No Image</span>
                                    </div>
                                )}
                            </div>
                        </Col>

                        <Col md={9} className="hero-info-section">
                            <div className="hero-top">
                                <div className="flex-grow-1">
                                    <div className="badge-group mb-2">
                                        <span className="badge-pill badge-blue">{product.category}</span>
                                        <span className="divider">/</span>
                                        <span className="badge-pill badge-gray">{product.subcategory}</span>
                                    </div>
                                    <h1 className="hero-mpn">
                                        <CopyItem text={product.electotronixPN || product.manufacturePN} label="MPN" />
                                    </h1>
                                    <div className="hero-value mt-2">
                                        <span className="label">VALUE:</span>
                                        <span className="value"><CopyItem text={product.value} label="Value" /></span>
                                    </div>
                                </div>
                                <div className="qty-block bg-primary bg-opacity-10 border-primary border-opacity-25">
                                    <div className="label text-primary">REQUESTED QTY</div>
                                    <div className="number text-primary">
                                        <CopyItem text={product.requestqty} label="Qty" />
                                    </div>
                                    <div className="unit text-primary opacity-75">UNITS</div>
                                </div>
                            </div>
                            <div className="hero-description mt-auto">
                                <div className="desc-label">DESCRIPTION</div>
                                <p className="desc-text">
                                    <CopyItem text={product.description} label="Description" />
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4">
                <Col lg={4}>
                    <Card className="info-card h-100">
                        <Card.Header className="info-header">
                            <div className="header-icon bg-primary-subtle text-primary"><FaClipboardList /></div>
                            <span className="header-title">Request Details</span>
                        </Card.Header>
                        <Card.Body className="p-4 pt-2">
                            <DetailRow icon={<FaClipboardList />} label="Request No." value={product.requestno} />
                            <DetailRow icon={<FaCalendarAlt />} label="Request Date" value={product.requestdate} />
                            <DetailRow icon={<FaClock />} label="Request Time" value={product.requesttime} />
                            <div className="note-container mt-4">
                                <span className="note-label">REQUEST NOTE</span>
                                <div className="note-content">
                                    <CopyItem text={product.note} label="Note" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="info-card h-100">
                        <Card.Header className="info-header">
                            <div className="header-icon bg-cyan-subtle text-info"><FaLayerGroup /></div>
                            <span className="header-title">Specifications</span>
                        </Card.Header>
                        <Card.Body className="p-4 pt-2">
                            <DetailRow icon={<FaMapMarkerAlt />} label="Footprint" value={product.footprint} />
                            <DetailRow icon={<FaMapMarkerAlt />} label="Position" value={product.position} />
                            <DetailRow icon={<FaIndustry />} label="Process" value={product.process} />
                            <DetailRow icon={<FaWeightHanging />} label="Weight" value={product.weight} />
                            <DetailRow icon={<FaTag />} label="Alternative" value={product.alternative} />
                            <DetailRow icon={<FaLink />} label="Datasheet" value={product.link} isLink={true} />
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="info-card h-100">
                        <Card.Header className="info-header">
                            <div className="header-icon bg-primary-subtle text-primary"><FaIndustry /></div>
                            <span className="header-title">Supply Chain</span>
                        </Card.Header>
                        <Card.Body className="p-4 pt-2">
                            <DetailRow label="Manufacturer" value={product.manufacture} />
                            <DetailRow label="Mfg Part No." value={product.manufacturePN} />
                            <div className="divider-line my-2"></div>
                            <DetailRow label="Supplier" value={product.supplier} />
                            <DetailRow label="Supplier PN" value={product.supplierPN} />
                            <DetailRow icon={<FaDollarSign />} label="Unit Price" value={product.unitprice || product.price} />
                            <Row className="mt-3 g-2">
                                <Col>
                                    <div className="mini-stat">
                                        <span className="label">MOQ</span>
                                        <span className="val"><CopyItem text={product.moq} label="MOQ" /></span>
                                    </div>
                                </Col>
                                <Col>
                                    <div className="mini-stat">
                                        <span className="label">SPQ</span>
                                        <span className="val"><CopyItem text={product.spq} label="SPQ" /></span>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StockRequestDetailScreen;