import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Image, InputGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaSave, FaBox, FaTags, FaInfoCircle, FaImage, FaMoneyBillWave, FaWarehouse, FaCloudUploadAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../../slices/productsApiSlice';

const ProductEditScreen = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');

  // API Hooks
  const { data: product, isLoading, error } = useGetProductDetailsQuery(productId);
  const [updateProduct, { isLoading: loadingUpdate }] = useUpdateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] = useUploadProductImageMutation();

  // Translations
  const t = {
    en: {
      title: 'Edit Product',
      subtitle: 'Update product details, pricing, and inventory',
      sections: {
        basic: 'Basic Information',
        pricing: 'Pricing & Inventory',
        media: 'Product Media',
        category: 'Organization'
      },
      lbl: {
        name: 'Product Name',
        desc: 'Description',
        price: 'Price (THB)',
        stock: 'Stock Quantity',
        image: 'Image URL',
        upload: 'Upload New Image',
        category: 'Category',
        brand: 'Brand'
      },
      btn: { save: 'Save Changes', back: 'Go Back', saving: 'Saving...' },
      placeholder: {
        name: 'Enter product name',
        image: 'Enter image url',
        category: 'e.g., Electronics',
        brand: 'e.g., Apple'
      }
    },
    thai: {
      title: 'แก้ไขข้อมูลสินค้า',
      subtitle: 'จัดการรายละเอียด ราคา และคลังสินค้า',
      sections: {
        basic: 'ข้อมูลพื้นฐาน',
        pricing: 'ราคาและคลังสินค้า',
        media: 'รูปภาพสินค้า',
        category: 'การจัดหมวดหมู่'
      },
      lbl: {
        name: 'ชื่อสินค้า',
        desc: 'รายละเอียดสินค้า',
        price: 'ราคาขาย (บาท)',
        stock: 'จำนวนในสต็อก',
        image: 'ลิงก์รูปภาพ',
        upload: 'อัปโหลดรูปภาพใหม่',
        category: 'หมวดหมู่',
        brand: 'แบรนด์'
      },
      btn: { save: 'บันทึกข้อมูล', back: 'ย้อนกลับ', saving: 'กำลังบันทึก...' },
      placeholder: {
        name: 'ระบุชื่อสินค้า',
        image: 'ระบุลิงก์รูปภาพ',
        category: 'เช่น อุปกรณ์อิเล็กทรอนิกส์',
        brand: 'เช่น Apple'
      }
    }
  }[language || 'en'];

  // Load Data
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price || 0);
      setImage(product.image || '');
      setBrand(product.brand || '');
      setCategory(product.category || '');
      setCountInStock(product.countInStock || 0);
      setDescription(product.description || '');
    }
  }, [product]);

  // Handlers
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateProduct({
        productId, name, price, image, brand, category, countInStock, description,
      }).unwrap();
      toast.success('Product updated successfully');
      navigate('/admin/productlist');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadFileHandler = async (e) => {
    if (!e.target.files[0]) return;
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      setImage(res.image);
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-4 font-prompt">
      <Container>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
                <Link to='/admin/productlist' className='btn btn-light border shadow-sm rounded-circle p-2 me-3'>
                    <FaArrowLeft />
                </Link>
                <div>
                    <h3 className="fw-bold mb-0 text-dark">{t.title}</h3>
                    <p className="text-muted mb-0 small">{t.subtitle}</p>
                </div>
            </div>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><Loader /></div>
        ) : error ? (
          <Message variant='danger'>{error?.data?.message || error.error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Row className="g-4">
              {/* Left Column: Info & Pricing */}
              <Col lg={8}>
                {/* Basic Info */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                  <Card.Header className="bg-white py-3 border-0">
                    <h5 className="mb-0 fw-bold text-primary border-start border-4 border-primary ps-2">
                      <FaInfoCircle className="me-2" /> {t.sections.basic}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">{t.lbl.name}</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder={t.placeholder.name}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="py-2"
                        required
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-muted">{t.lbl.desc}</Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="py-2"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Pricing & Stock */}
                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Header className="bg-white py-3 border-0">
                    <h5 className="mb-0 fw-bold text-success border-start border-4 border-success ps-2">
                      <FaMoneyBillWave className="me-2" /> {t.sections.pricing}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <Row>
                      <Col md={6}>
                        <Form.Label className="fw-bold small text-muted">{t.lbl.price}</Form.Label>
                        <InputGroup className="mb-3">
                          <InputGroup.Text className="bg-light border-end-0">฿</InputGroup.Text>
                          <Form.Control
                            type='number'
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border-start-0"
                            required
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-bold small text-muted">{t.lbl.stock}</Form.Label>
                        <InputGroup className="mb-3">
                          <InputGroup.Text className="bg-light border-end-0"><FaWarehouse /></InputGroup.Text>
                          <Form.Control
                            type='number'
                            value={countInStock}
                            onChange={(e) => setCountInStock(e.target.value)}
                            className="border-start-0"
                            required
                          />
                        </InputGroup>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Right Column: Image & Category */}
              <Col lg={4}>
                {/* Image */}
                <Card className="border-0 shadow-sm rounded-4 mb-4 text-center">
                  <Card.Header className="bg-white py-3 border-0 text-start">
                    <h5 className="mb-0 fw-bold text-warning border-start border-4 border-warning ps-2">
                      <FaImage className="me-2" /> {t.sections.media}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <div className="mb-3 bg-light rounded-3 d-flex align-items-center justify-content-center border border-dashed overflow-hidden position-relative" style={{ height: '250px' }}>
                      {image ? (
                        <Image src={image} fluid className="h-100 object-fit-contain" />
                      ) : (
                        <div className="text-muted opacity-50 d-flex flex-column align-items-center">
                            <FaBox size={40} className="mb-2"/>
                            <span className="small">No Image</span>
                        </div>
                      )}
                      {loadingUpload && (
                          <div className="position-absolute w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center">
                              <Loader />
                          </div>
                      )}
                    </div>
                    
                    <Form.Group className="mb-3 text-start">
                      <Form.Label className="small fw-bold text-muted">{t.lbl.upload}</Form.Label>
                      <div className="d-flex">
                        <Form.Control type='file' onChange={uploadFileHandler} className="form-control-sm" />
                        <Button variant="light" size="sm" className="ms-1 border">
                            <FaCloudUploadAlt />
                        </Button>
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="text-start">
                        <Form.Label className="small fw-bold text-muted">{t.lbl.image}</Form.Label>
                        <Form.Control
                        type='text'
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder={t.placeholder.image}
                        className="form-control-sm bg-light"
                        />
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Category */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                  <Card.Header className="bg-white py-3 border-0">
                    <h5 className="mb-0 fw-bold text-info border-start border-4 border-info ps-2">
                      <FaTags className="me-2" /> {t.sections.category}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">{t.lbl.category}</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder={t.placeholder.category}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-muted">{t.lbl.brand}</Form.Label>
                      <Form.Control
                        type='text'
                        placeholder={t.placeholder.brand}
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Submit Button */}
                <div className="d-grid">
                  <Button 
                    type='submit' 
                    variant='primary' 
                    size="lg"
                    className="rounded-pill shadow-sm fw-bold" 
                    disabled={loadingUpdate}
                  >
                    <FaSave className="me-2" /> 
                    {loadingUpdate ? t.btn.saving : t.btn.save}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1); border-color: #86b7fe; }
        .object-fit-contain { object-fit: contain; }
        .border-dashed { border-style: dashed !important; }
      `}</style>
    </div>
  );
};

export default ProductEditScreen;