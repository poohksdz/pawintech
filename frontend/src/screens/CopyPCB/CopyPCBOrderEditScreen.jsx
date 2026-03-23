import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Form, Button, Image, Card
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useGetcopyPCBByIdQuery,
  useUpdatecopyPCBMutation,
} from '../../slices/copypcbApiSlice';
import { BASE_URL } from '../../constants';

import {
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
} from '../../slices/copypcbCartApiSlice';


const CopyPCBOrderEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data } = useGetcopyPCBByIdQuery(id);
  const [updatecopyPCB, loading, error] = useUpdatecopyPCBMutation();
  const [uploadZip] = useUploadcopypcbZipMutation();
  const [uploadImages] = useUploadMultipleCopyPCBImagesMutation();

  const [formData, setFormData] = useState({
    projectname: '',
    pcbQty: 1,
    zipFile: null,
    notes: '',
    frontImages: [],
    backImages: [],
    billingName: '',
    billingPhone: '',
    billinggAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: '',
    billingTax: '',
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
    userName: '',
    userEmail: '',
    custom_price: '',
  });

  const [existingZip, setExistingZip] = useState(null);
  const [existingFront, setExistingFront] = useState([]); // string paths only
  const [existingBack, setExistingBack] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let normalizedPath = path.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : (BASE_URL || '');
    return `${baseUrl}${normalizedPath}`;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files).map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    if (type === 'front') {
      setFormData(prev => ({ ...prev, frontImages: [...prev.frontImages, ...files] }));
    } else {
      setFormData(prev => ({ ...prev, backImages: [...prev.backImages, ...files] }));
    }
  };

  const removeImage = (index, type) => {
    setFormData(prev => ({
      ...prev,
      [type === 'front' ? 'frontImages' : 'backImages']: prev[type === 'front' ? 'frontImages' : 'backImages'].filter((_, i) => i !== index)
    }));
  };

  const removeExistingImage = (index, type) => {
    if (type === 'front') {
      setExistingFront(prev => prev.filter((_, i) => i !== index));
    } else {
      setExistingBack(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImagesHandler = async (images) => {
    if (images.length === 0) return [];
    const form = new FormData();
    images.forEach((img) => form.append('images', img.file));
    const res = await uploadImages(form).unwrap();
    // Some controllers return strings, some return objects with a path property
    return (res?.images || []).map(img => typeof img === 'string' ? img : img.path);
  };

  const uploadZipHandler = async () => {
    if (!formData.zipFile) return existingZip || null;
    const form = new FormData();
    form.append('copypcbZip', formData.zipFile);
    const res = await uploadZip(form).unwrap();
    return res.path;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!formData.projectname.trim()) return toast.error('Project name required.');
    if (!userInfo) return navigate('/login');

    try {
      setIsLoading(true);
      const customPriceNumber = parseFloat(formData.custom_price);
      if (isNaN(customPriceNumber) || customPriceNumber <= 0) {
        toast.error('Custom price must be greater than zero.');
        return;
      }

      const frontPaths = await uploadImagesHandler(formData.frontImages);
      const backPaths = await uploadImagesHandler(formData.backImages);
      const zipPath = await uploadZipHandler();

      await updatecopyPCB({
        id,
        updatedData: {
          projectname: formData.projectname,
          pcbQty: formData.pcbQty,
          notes: formData.notes,
          custom_price: formData.custom_price,
          copypcbFrontImages: [
            ...existingFront,
            ...frontPaths,
          ],
          copypcbBackImages: [
            ...existingBack,
            ...backPaths,
          ],
          copypcb_zip: zipPath,
        },
      }).unwrap();

      toast.success('Order updated!');
      // navigate('/admin/copypcborders');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (data?.success && data.data) {
      const order = data.data;
      setFormData((prev) => ({
        ...prev,
        projectname: order.projectname || '',
        pcbQty: order.pcb_qty || 1,
        notes: order.notes || '',
        custom_price: order.custom_price || '',
        billingName: order.billingName || '',
        billingPhone: order.billingPhone || '',
        billinggAddress: order.billinggAddress || '',
        billingCity: order.billingCity || '',
        billingPostalCode: order.billingPostalCode || '',
        billingCountry: order.billingCountry || '',
        billingTax: order.billingTax || '',
        shippingName: order.shippingName || '',
        shippingPhone: order.shippingPhone || '',
        shippingAddress: order.shippingAddress || '',
        shippingCity: order.shippingCity || '',
        shippingPostalCode: order.shippingPostalCode || '',
        shippingCountry: order.shippingCountry || '',
        userName: order.userName || '',
        userEmail: order.userEmail || '',
      }));

      setExistingZip(order.copypcb_zip || null);

      const frontImgs = [];
      for (let i = 1; i <= 10; i++) {
        const key = `front_image_${i}`;
        if (order[key]) frontImgs.push(order[key]);
      }
      setExistingFront(frontImgs);

      const backImgs = [];
      for (let i = 1; i <= 10; i++) {
        const key = `back_image_${i}`;
        if (order[key]) backImgs.push(order[key]);
      }
      setExistingBack(backImgs);
    }
  }, [data]);

  return (
    <Container>
      <Form onSubmit={submitHandler}>
        <Row>
          <Col md={8}>
            <Card className="p-3 my-3">
              <Card.Title>Project Name</Card.Title>
              <Form.Control
                type="text"
                value={formData.projectname}
                onChange={(e) => handleChange('projectname', e.target.value)}
              />
            </Card>

            {/* New Front Images */}
            <Card className="p-3 my-3">
              <Card.Title>Add Front Images</Card.Title>
              <Form.Control type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'front')} />
              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.frontImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <Image src={img.url} thumbnail style={{ width: '100px', height: '100px' }} />
                    <Button variant="danger" size="sm" onClick={() => removeImage(idx, 'front')} style={{ position: 'absolute', top: 0, right: 0 }}>×</Button>
                  </div>
                ))}
              </div>

              {/* Existing Front Images */}
              <Card.Title>Existing Front Images</Card.Title>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {existingFront.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <Image src={getFullUrl(img)} thumbnail style={{ width: '100px', height: '100px' }} />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeExistingImage(idx, 'front')}
                      style={{ position: 'absolute', top: 0, right: 0 }}
                    >×</Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* New Back Images */}
            <Card className="p-3 my-3">
              <Card.Title>Add Back Images</Card.Title>
              <Form.Control type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'back')} />
              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.backImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <Image src={img.url} thumbnail style={{ width: '100px', height: '100px' }} />
                    <Button variant="danger" size="sm" onClick={() => removeImage(idx, 'back')} style={{ position: 'absolute', top: 0, right: 0 }}>×</Button>
                  </div>
                ))}
              </div>

              {/* Existing Back Images */}
              <Card.Title>Existing Back Images</Card.Title>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {existingBack.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <Image src={getFullUrl(img)} thumbnail style={{ width: '100px', height: '100px' }} />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeExistingImage(idx, 'back')}
                      style={{ position: 'absolute', top: 0, right: 0 }}
                    >×</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3 my-3">
              <Card.Title>ZIP File or RAR File</Card.Title>
              <Form.Control type="file" accept=".zip,.rar" onChange={(e) => handleChange('zipFile', e.target.files[0])} />
              {existingZip && !formData.zipFile && (
                <div className="text-muted mt-2">Existing ZIP: {existingZip.split('/').pop()}</div>
              )}
            </Card>

            <Card className="p-3 my-3">
              <Card.Title>Additional Notes</Card.Title>
              <Form.Control as="textarea" rows={4} value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>User Info</Card.Title>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" value={formData.userName} onChange={(e) => handleChange('userName', e.target.value)} />
                <Form.Label className="mt-2">Email</Form.Label>
                <Form.Control type="email" value={formData.userEmail} onChange={(e) => handleChange('userEmail', e.target.value)} />
              </Form.Group>
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Shipping Info</Card.Title>
              {['shippingName', 'shippingPhone', 'shippingAddress', 'shippingCity', 'shippingPostalCode', 'shippingCountry'].map((field) => (
                <Form.Group className="mb-2" key={field}>
                  <Form.Label>{field}</Form.Label>
                  <Form.Control value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} />
                </Form.Group>
              ))}
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Billing Info</Card.Title>
              {['billingName', 'billingPhone', 'billinggAddress', 'billingCity', 'billingPostalCode', 'billingCountry', 'billingTax'].map((field) => (
                <Form.Group className="mb-2" key={field}>
                  <Form.Label>{field}</Form.Label>
                  <Form.Control value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} />
                </Form.Group>
              ))}
            </Card>
          </Col>

          <Col md={4}>
            <Card className="p-3 my-3">
              <Card.Title>PCB Quantity</Card.Title>
              <Form.Control
                type="number"
                min={1}
                value={formData.pcbQty}
                onChange={(e) => handleChange('pcbQty', Math.max(parseInt(e.target.value)))}
              />
              <Card.Title className="mt-3">Custom Price
                <span>฿</span></Card.Title>
              <Form.Control
                type="number"
                name="custom_price"
                value={formData.custom_price}
                onChange={(e) => handleChange('custom_price', e.target.value)}
                min="0"
                step="0.01"
              />

              <Button type="submit" className="mt-3" disabled={isLoading || loading}>
                {isLoading || loading ? 'Updating...' : 'Update Order'}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CopyPCBOrderEditScreen;
