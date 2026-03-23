import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Tab, Tabs, Row, Col, Card, Container, Image } from 'react-bootstrap';
// ❌ ลบ FaHeading, FaParagraph ออกแล้ว
import { FaArrowLeft, FaSave, FaImage, FaLanguage, FaTools } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import {
  useCreateServiceMutation,
  useUploadServiceImageMutation
} from '../../slices/servicesApiSlice';

const ServiceCreateScreen = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // State Hooks
  const [headerTextOne, setHeaderTextOne] = useState('');
  const [headerTextTwo, setHeaderTextTwo] = useState('');
  const [headerTextThree, setHeaderTextThree] = useState('');
  const [headerTextFour, setHeaderTextFour] = useState('');
  const [headerTextFive, setHeaderTextFive] = useState('');
  
  const [bodyTextOne, setBodyTextOne] = useState('');
  const [bodyTextTwo, setBodyTextTwo] = useState('');
  const [bodyTextThree, setBodyTextThree] = useState('');
  const [bodyTextFour, setBodyTextFour] = useState('');
  const [bodyTextFive, setBodyTextFive] = useState('');
  
  const [headerThaiOne, setHeaderThaiOne] = useState('');
  const [headerThaiTwo, setHeaderThaiTwo] = useState('');
  const [headerThaiThree, setHeaderThaiThree] = useState('');
  const [headerThaiFour, setHeaderThaiFour] = useState('');
  const [headerThaiFive, setHeaderThaiFive] = useState('');
  
  const [bodyTextThaiOne, setBodyTextThaiOne] = useState('');
  const [bodyTextThaiTwo, setBodyTextThaiTwo] = useState('');
  const [bodyTextThaiThree, setBodyTextThaiThree] = useState('');
  const [bodyTextThaiFour, setBodyTextThaiFour] = useState('');
  const [bodyTextThaiFive, setBodyTextThaiFive] = useState('');
  
  const [imageOne, setImageOne] = useState('');
  const [imageTwo, setImageTwo] = useState('');
  const [imageThree, setImageThree] = useState('');
  const [imageFour, setImageFour] = useState('');
  const [imageFive, setImageFive] = useState(''); 
  
  const [deploymentType, setDeploymentType] = useState('Hardware Deployment');
  const [key, setKey] = useState('section1');

  // API Hooks
  const [createService, { isLoading }] = useCreateServiceMutation();
  const [uploadServiceImage, { isLoading: loadingUpload }] = useUploadServiceImageMutation();

  // Handlers
  const uploadFileHandler = async (e, setImage) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadServiceImage(formData).unwrap();
      toast.success(res.message);
      setImage(res.image);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await createService({
        headerTextOne, headerTextTwo, headerTextThree, headerTextFour, headerTextFive,
        bodyTextOne, bodyTextTwo, bodyTextThree, bodyTextFour, bodyTextFive,
        headerThaiOne, headerThaiTwo, headerThaiThree, headerThaiFour, headerThaiFive,
        bodyTextThaiOne, bodyTextThaiTwo, bodyTextThaiThree, bodyTextThaiFour, bodyTextThaiFive,
        imageOne, imageTwo, imageThree, imageFour, imageFive,
        deploymentTypes: deploymentType
      }).unwrap();
      toast.success('Service created successfully');
      navigate('/admin/servicelist');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Translations
  const t = {
    en: {
      title: 'Create New Service',
      subtitle: 'Add details for your new service offering',
      btnBack: 'Go Back',
      btnCreate: 'Create Service',
      tabs: { s1: 'Section 1 (Main)', s2: 'Section 2', s3: 'Section 3', s4: 'Section 4', s5: 'Section 5' },
      lbl: {
        headerEn: 'Header (English)', bodyEn: 'Body Text (English)',
        headerTh: 'Header (Thai)', bodyTh: 'Body Text (Thai)',
        img: 'Upload Image', type: 'Deployment Type'
      },
      ph: { header: 'Enter header text', body: 'Enter detailed description' }
    },
    thai: {
      title: 'สร้างบริการใหม่',
      subtitle: 'เพิ่มรายละเอียดสำหรับบริการใหม่ของคุณ',
      btnBack: 'ย้อนกลับ',
      btnCreate: 'บันทึกบริการ',
      tabs: { s1: 'ส่วนที่ 1 (หลัก)', s2: 'ส่วนที่ 2', s3: 'ส่วนที่ 3', s4: 'ส่วนที่ 4', s5: 'ส่วนที่ 5' },
      lbl: {
        headerEn: 'หัวข้อ (ภาษาอังกฤษ)', bodyEn: 'เนื้อหา (ภาษาอังกฤษ)',
        headerTh: 'หัวข้อ (ภาษาไทย)', bodyTh: 'เนื้อหา (ภาษาไทย)',
        img: 'อัปโหลดรูปภาพ', type: 'ประเภทบริการ'
      },
      ph: { header: 'กรอกชื่อหัวข้อ', body: 'กรอกรายละเอียดเนื้อหา' }
    }
  }[language || 'en'];

  // Helper Component for Form Section
  const renderSection = (num, headerEn, setHeaderEn, bodyEn, setBodyEn, headerTh, setHeaderTh, bodyTh, setBodyTh, image, setImage) => (
    <Row className="g-4">
        {/* English Content */}
        <Col md={6}>
            <Card className="h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                    <h6 className="fw-bold text-primary mb-3"><FaLanguage className="me-2"/>English Content</h6>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">{t.lbl.headerEn}</Form.Label>
                        <Form.Control type="text" placeholder={t.ph.header} value={headerEn} onChange={(e) => setHeaderEn(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">{t.lbl.bodyEn}</Form.Label>
                        <Form.Control as="textarea" rows={5} placeholder={t.ph.body} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
                    </Form.Group>
                </Card.Body>
            </Card>
        </Col>

        {/* Thai Content */}
        <Col md={6}>
            <Card className="h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                    <h6 className="fw-bold text-success mb-3"><FaLanguage className="me-2"/>Thai Content</h6>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">{t.lbl.headerTh}</Form.Label>
                        <Form.Control type="text" placeholder={t.ph.header} value={headerTh} onChange={(e) => setHeaderTh(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">{t.lbl.bodyTh}</Form.Label>
                        <Form.Control as="textarea" rows={5} placeholder={t.ph.body} value={bodyTh} onChange={(e) => setBodyTh(e.target.value)} />
                    </Form.Group>
                </Card.Body>
            </Card>
        </Col>

        {/* Image Upload */}
        <Col md={12}>
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <h6 className="fw-bold text-secondary mb-3"><FaImage className="me-2"/>{t.lbl.img}</h6>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <Form.Control type="file" onChange={(e) => uploadFileHandler(e, setImage)} />
                            <Form.Control type="text" value={image} readOnly className="mt-2 text-muted small" placeholder="Image URL will appear here" />
                        </Col>
                        <Col md={4} className="text-center">
                            {image ? (
                                <Image src={image} alt="Preview" thumbnail style={{maxHeight: '100px'}} />
                            ) : (
                                <div className="bg-light rounded p-3 text-muted border border-dashed text-center small">No Image Selected</div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Col>
    </Row>
  );

  return (
    <Container fluid className="py-4 font-prompt">
      <Link to="/admin/servicelist" className="btn btn-light mb-3 shadow-sm border">
        <FaArrowLeft className="me-2"/> {t.btnBack}
      </Link>

      <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-bottom-0 p-4 pb-0">
            <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
                    <FaTools size={24} />
                </div>
                <div>
                    <h4 className="fw-bold mb-0 text-dark">{t.title}</h4>
                    <p className="text-muted mb-0">{t.subtitle}</p>
                </div>
            </div>
        </Card.Header>
        
        <Card.Body className="p-4">
            {(isLoading || loadingUpload) && <Loader />}
            
            <Form onSubmit={submitHandler}>
                
                {/* Deployment Type Selection */}
                <Card className="border border-primary border-opacity-25 bg-primary bg-opacity-10 mb-4 shadow-sm">
                    <Card.Body>
                        <Form.Group controlId="deploymentType">
                            <Form.Label className="fw-bold text-primary"><FaTools className="me-2"/>{t.lbl.type}</Form.Label>
                            <Form.Select 
                                value={deploymentType} 
                                onChange={(e) => setDeploymentType(e.target.value)}
                                className="form-select-lg border-0 shadow-sm"
                            >
                                <option value="Hardware Deployment">Hardware Deployment</option>
                                <option value="Software Deployment">Software Deployment</option>
                            </Form.Select>
                        </Form.Group>
                    </Card.Body>
                </Card>

                <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-4 custom-tabs nav-fill">
                    <Tab eventKey="section1" title={t.tabs.s1}>
                        {renderSection(1, headerTextOne, setHeaderTextOne, bodyTextOne, setBodyTextOne, headerThaiOne, setHeaderThaiOne, bodyTextThaiOne, setBodyTextThaiOne, imageOne, setImageOne)}
                    </Tab>
                    <Tab eventKey="section2" title={t.tabs.s2}>
                        {renderSection(2, headerTextTwo, setHeaderTextTwo, bodyTextTwo, setBodyTextTwo, headerThaiTwo, setHeaderThaiTwo, bodyTextThaiTwo, setBodyTextThaiTwo, imageTwo, setImageTwo)}
                    </Tab>
                    <Tab eventKey="section3" title={t.tabs.s3}>
                        {renderSection(3, headerTextThree, setHeaderTextThree, bodyTextThree, setBodyTextThree, headerThaiThree, setHeaderThaiThree, bodyTextThaiThree, setBodyTextThaiThree, imageThree, setImageThree)}
                    </Tab>
                    <Tab eventKey="section4" title={t.tabs.s4}>
                        {renderSection(4, headerTextFour, setHeaderTextFour, bodyTextFour, setBodyTextFour, headerThaiFour, setHeaderThaiFour, bodyTextThaiFour, setBodyTextThaiFour, imageFour, setImageFour)}
                    </Tab>
                    <Tab eventKey="section5" title={t.tabs.s5}>
                        {renderSection(5, headerTextFive, setHeaderTextFive, bodyTextFive, setBodyTextFive, headerThaiFive, setHeaderThaiFive, bodyTextThaiFive, setBodyTextThaiFive, imageFive, setImageFive)}
                    </Tab>
                </Tabs>

                <div className="d-grid mt-4">
                    <Button type="submit" variant="primary" size="lg" className="shadow-sm fw-bold">
                        <FaSave className="me-2" /> {t.btnCreate}
                    </Button>
                </div>
            </Form>
        </Card.Body>
      </Card>

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .custom-tabs .nav-link { color: #6c757d; font-weight: 600; border: none; border-bottom: 3px solid transparent; }
        .custom-tabs .nav-link.active { color: #0d6efd; border-bottom-color: #0d6efd; background: transparent; }
        .custom-tabs .nav-link:hover { color: #0d6efd; }
      `}</style>
    </Container>
  );
};

export default ServiceCreateScreen;