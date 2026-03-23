import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  ListGroup,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCheck } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetOrderPCBByIdQuery,
  useGetOwnShippingRatesQuery,
  useUpdateOrderPCBMutation,
} from '../../slices/orderpcbSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

const OrderPCBEditsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Removed unused dispatch
  const { userInfo } = useSelector((state) => state.auth);

  // API queries and mutation
  const {
    data: orderPCB,
    isLoading: isOrderLoading,
    error: orderError,
  } = useGetOrderPCBByIdQuery(id);

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
  } = useGetOwnShippingRatesQuery();

  const [updateOrderPCB, { isLoading: isUpdating }] = useUpdateOrderPCBMutation();

  // Form state
  const [formData, setFormData] = useState({
    projectname: '',
    pcbQty: 1,
    dimensions: { x: 10, y: 10, unit: 'cm' },
    baseMaterial: 'FR-4',
    layers: 2,
    thickness: '1.6mm',
    pcbColor: 'Green',
    silkscreen: 'White',
    surfaceFinish: 'HASL(With lead)',
    copperWeight: '1 oz',
    userName: '',
    userEmail: '',
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
    billingName: '',
    billingPhone: '',
    billinggAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: '',
    billingTax: '',
    custom_price: ''
  });

  // Gerber ZIP upload state
  const [zipFileName, setZipFileName] = useState('');
  const [gerberFiles, setGerberFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  // Removed unused 'uploadSuccess' variable, kept setter
  const [, setUploadSuccess] = useState(false);

  // Options from configData
  const baseMaterials = configData?.baseMaterials || [];
  const surfaceFinishes = configData?.surfaceFinishes || [];
  const copperWeights = configData?.copperWeights || [];
  const pcbColors = configData?.pcbColors || [];
  const shippingRates = configData?.shippingRates || [];

  // Default pricing values
  // Removed unused 'buildTime'
  const basePrice = Number(configData?.defaultPricing?.base_price ?? 0);
  const pricePerCm = Number(configData?.defaultPricing?.price_per_cm2 ?? 0);
  const extraServiceFee = Number(configData?.defaultPricing?.extra_service_fee ?? 0);
  const profitMargin = Number(configData?.defaultPricing?.profit_margin ?? 0);
  const vat = Number(configData?.defaultPricing?.vat_percent ?? 0);
  const dhlServiceFixed = Number(configData?.defaultPricing?.dhl_service_fixed ?? 0);

  // Load order data into form on fetch
  useEffect(() => {
    if (orderPCB) {
      // Get the original stored price from DB
      const storedPrice = Number(orderPCB.quoted_price_to_customer) || Number(orderPCB.total_amount_cost) || 0;

      setFormData((prev) => ({
        ...prev,
        projectname: orderPCB.projectname || '',
        pcbQty: orderPCB.pcb_quantity || 1,
        dimensions: {
          x: Number(orderPCB.length_cm) || 10,
          y: Number(orderPCB.width_cm) || 10,
          unit: 'cm',
        },
        baseMaterial: orderPCB.base_material || 'FR-4',
        layers: orderPCB.layers || 2,
        thickness: orderPCB.thickness_mm ? orderPCB.thickness_mm + 'mm' : '1.6mm',
        pcbColor: orderPCB.color || 'Green',
        silkscreen: orderPCB.silkscreen_color || 'White',
        surfaceFinish: orderPCB.surface_finish || 'HASL(With lead)',
        copperWeight: orderPCB.copper_weight_oz ? orderPCB.copper_weight_oz + ' oz' : '1 oz',
        userName: orderPCB.userName || '',
        userEmail: orderPCB.userEmail || '',
        shippingName: orderPCB.shippingName || '',
        shippingPhone: orderPCB.shippingPhone || '',
        shippingAddress: orderPCB.shippingAddress || '',
        shippingCity: orderPCB.shippingCity || '',
        shippingPostalCode: orderPCB.shippingPostalCode || '',
        shippingCountry: orderPCB.shippingCountry || '',
        billingName: orderPCB.billingName || '',
        billingPhone: orderPCB.billingPhone || '',
        billinggAddress: orderPCB.billinggAddress || '',
        billingCity: orderPCB.billingCity || '',
        billingPostalCode: orderPCB.billingPostalCode || '',
        billingCountry: orderPCB.billingCountry || '',
        billingTax: orderPCB.billingTax || '',
        // Initialize custom_price with the stored price from DB
        custom_price: storedPrice > 0 ? storedPrice : '',
      }));

      if (orderPCB.gerberZip) {
        setGerberFiles([orderPCB.gerberZip]);
        const zipName = orderPCB.gerberZip.split('/').pop();
        setZipFileName(zipName);
      }
    }
  }, [orderPCB]);

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle dimension changes separately for nested object
  const handleDimensionChange = (axis, value) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [axis]: value,
      },
    }));
  };

  // Calculate weight (kg) for shipping pricing
  const calculateWeightKg = () => {
    const areaCm2 = formData.dimensions.x * formData.dimensions.y;
    const thicknessNum = formData.thickness === '0.8mm' ? 0.8 : 1.6;
    const qty = Number(formData.pcbQty) || 1;

    // Rough weight calculation factor (you can adjust)
    const weight = areaCm2 * thicknessNum * 0.000035 * qty;
    // Add packing weight
    return weight + 0.3;
  };

  // Calculate delivery price from shipping rates (EMS or DHL)
  const getDeliveryPrice = (type) => {
    const weight = calculateWeightKg();

    const rates = shippingRates
      .filter((rate) => rate.shipping_type === type)
      .sort((a, b) => parseFloat(a.weight_kg) - parseFloat(b.weight_kg));

    for (const rate of rates) {
      if (weight <= parseFloat(rate.weight_kg)) {
        return Number(rate.price);
      }
    }

    return rates.length > 0 ? Number(rates[rates.length - 1].price) : 0;
  };

  // Price components from options
  const getOptionPrice = (options, nameField, selectedName) => {
    const found = options.find((opt) => opt.name === selectedName);
    return found ? Number(found.price) : 0;
  };

  const baseMaterialPrice = getOptionPrice(baseMaterials, 'name', formData.baseMaterial);
  const surfaceFinishPrice = getOptionPrice(surfaceFinishes, 'name', formData.surfaceFinish);
  const copperWeightPrice = getOptionPrice(copperWeights, 'name', formData.copperWeight);
  const colorPrice = getOptionPrice(pcbColors, 'name', formData.pcbColor);

  // Calculate total price
  const calculateTotalPrice = () => {
    const area = formData.dimensions.x * formData.dimensions.y;
    const qty = Number(formData.pcbQty);
    if (area === 0 || qty === 0) return '0.00';

    const materialCost = basePrice + area * qty * pricePerCm + extraServiceFee;
    const deliveryEms = getDeliveryPrice('EMS');
    const deliveryDhl = getDeliveryPrice('DHL');

    let total = materialCost + deliveryEms + deliveryDhl + dhlServiceFixed;

    total *= 1 + profitMargin / 100; // add profit margin
    total += total * (vat / 100); // add VAT
    total += baseMaterialPrice + surfaceFinishPrice + copperWeightPrice + colorPrice;

    return total.toFixed(2);
  };

  const totalPrice = calculateTotalPrice();

  // Handle Gerber ZIP upload
  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert('Please upload a valid .zip file.');
      return;
    }

    setZipFileName(file.name);

    const formDataUpload = new FormData();
    formDataUpload.append('gerberZip', file);

    try {
      const response = await fetch('/api/gerber/upload-zip', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadSuccess(true);
        setUploadMessage('✅ ZIP uploaded successfully and saved.');
        setGerberFiles([result.path]);
      } else {
        setUploadSuccess(false);
        setUploadMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadSuccess(false);
      setUploadMessage('❌ Failed to upload ZIP');
    }
  };

  // Render color/material option buttons
  const renderColorButtons = (field, options) => {
    if (isOrderLoading || isConfigLoading) return <Loader />;
    if (orderError || configError)
      return (
        <Message variant="danger">
          {orderError?.data?.message || orderError?.error || configError?.data?.message || configError?.error}
        </Message>
      );

    return (
      <div className="mb-3 d-flex flex-wrap justify-content-start">
        {options.map((option, idx) => {
          const optionName = typeof option === 'object' ? option.name : option;
          const isSelected = formData[field] === optionName;
          const isColor = /^(Green|Red|Blue|Yellow|Black|White|Purple)$/i.test(optionName);
          const backgroundColor = isColor ? optionName.toLowerCase() : undefined;
          const textColor = ['white', 'yellow', '#ffffff'].includes(backgroundColor) ? 'black' : 'white';

          // Disable conditions for specific options
          let isDisabled = false;
          if (field === 'baseMaterial' && optionName === 'Aluminum') {
            isDisabled = true;
          }
          if (field === 'surfaceFinish' && (optionName === 'LeadFree HASL' || optionName === 'ENIG')) {
            isDisabled = true;
          }
          if (field === 'copperWeight' && optionName === '2 oz') {
            isDisabled = true;
          }

          return (
            <Button
              key={idx}
              variant={isColor ? undefined : 'outline-secondary'}
              className={`me-2 mb-2 px-3 py-2 border position-relative ${isSelected ? 'border-primary' : ''
                }`}
              style={{
                borderWidth: '2px',
                backgroundColor: isColor ? backgroundColor : undefined,
                color: isColor ? textColor : undefined,
                minWidth: '80px',
                minHeight: '40px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onClick={() => !isDisabled && handleChange(field, optionName)}
              disabled={isDisabled}
            >
              {optionName}
              {isSelected && (
                <FaCheck
                  size={12}
                  className="position-absolute"
                  style={{ bottom: '4px', right: '4px', color: 'lime' }}
                />
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!userInfo) {
      navigate('/login');
      return;
    }

    if (!zipFileName && gerberFiles.length === 0) {
      toast.error('Please upload a Gerber ZIP file before submitting.');
      return;
    }

    if (!formData.custom_price || formData.custom_price === 0) {
      toast.error('Please enter a custom price before submitting.');
      return;
    }

    const payload = {
      id: orderPCB.id,
      updatedData: {
        projectname: formData.projectname,
        pcb_quantity: formData.pcbQty,
        length_cm: formData.dimensions.x.toString(),
        width_cm: formData.dimensions.y.toString(),
        base_material: formData.baseMaterial,
        layers: formData.layers,
        thickness_mm: parseFloat(formData.thickness),
        color: formData.pcbColor,
        silkscreen_color: formData.silkscreen,
        surface_finish: formData.surfaceFinish,
        copper_weight_oz: formData.copperWeight,
        gerberZip: gerberFiles[0],
        price: totalPrice,
        userName: formData.userName,
        userEmail: formData.userEmail,
        shippingName: formData.shippingName,
        shippingPhone: formData.shippingPhone,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingPostalCode: formData.shippingPostalCode,
        shippingCountry: formData.shippingCountry,
        billingName: formData.billingName,
        billingPhone: formData.billingPhone,
        billinggAddress: formData.billinggAddress,
        billingCity: formData.billingCity,
        billingPostalCode: formData.billingPostalCode,
        billingCountry: formData.billingCountry,
        billingTax: formData.billingTax,
        custom_price: formData.custom_price,
      }
    };

    try {
      await updateOrderPCB(payload).unwrap();

      toast.success('Order updated successfully!');
    } catch (err) {
      toast.error('Failed to update order.');
    }
  };

  if (isOrderLoading || isConfigLoading) return <Loader />;

  if (orderError || configError)
    return (
      <Message variant="danger">
        {orderError?.data?.message || orderError?.error || configError?.data?.message || configError?.error}
      </Message>
    );

  // Disable button conditions:
  // disable if loading, updating, or no gerber zip uploaded
  const isButtonDisabled = isOrderLoading || isConfigLoading || isUpdating || (!zipFileName && gerberFiles.length === 0);

  return (
    <Container className="my-4">
      <Form onSubmit={submitHandler}>
        <h2 className="mb-4">Edit PCB Order</h2>

        {/* ZIP Upload Section */}
        <div className="position-relative text-center p-5 mb-4 bg-primary text-white rounded">
          {zipFileName ? (
            <p>{zipFileName}</p>
          ) : (
            <p>Upload Your Gerber ZIP File</p>
          )}
          <Form.Control
            type="file"
            accept=".zip"
            onChange={handleZipUpload}
            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
          />
          {uploadMessage && <div className="mt-3 fw-bold">{uploadMessage}</div>}
        </div>

        {gerberFiles.length > 0 && (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Files in ZIP</Card.Title>
              <ListGroup variant="flush">
                {gerberFiles.map((file, idx) => (
                  <ListGroup.Item key={idx}>{file.replace(/^gerbers\//, '')}</ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        <Row>
          <Col xl={8}>
            <Card className="p-4 mb-4">
              <Form.Group className="mb-3">
                <Form.Label>Project Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.projectname}
                  onChange={(e) => handleChange('projectname', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Base Material</Form.Label>
                {renderColorButtons('baseMaterial', baseMaterials)}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Layers</Form.Label>
                {renderColorButtons('layers', [1, 2])}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Dimensions ({formData.dimensions.unit})</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.dimensions.x}
                    onChange={(e) => handleDimensionChange('x', Math.max(Number(e.target.value)))}
                    required
                  />
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.dimensions.y}
                    onChange={(e) => handleDimensionChange('y', Math.max(Number(e.target.value)))}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thickness</Form.Label>
                {renderColorButtons('thickness', ['0.8mm', '1.6mm'])}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>PCB Color</Form.Label>
                {renderColorButtons('pcbColor', pcbColors)}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Silkscreen Color</Form.Label>
                {renderColorButtons('silkscreen', ['White', 'Black'])}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Surface Finish</Form.Label>
                {renderColorButtons('surfaceFinish', surfaceFinishes)}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Copper Weight</Form.Label>
                {renderColorButtons('copperWeight', copperWeights)}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>PCB Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.pcbQty}
                  onChange={(e) => handleChange('pcbQty', Math.max(Number(e.target.value)))}
                />
              </Form.Group>

              <Card.Title>User Info</Card.Title>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" value={formData.userName} onChange={(e) => handleChange('userName', e.target.value)} required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={formData.userEmail} onChange={(e) => handleChange('userEmail', e.target.value)} required />
              </Form.Group>
            </Card>

            <Card className="p-4 mb-4">
              <Card.Title>Shipping Info</Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Recipient Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingName}
                  onChange={(e) => handleChange('shippingName', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingPhone}
                  onChange={(e) => handleChange('shippingPhone', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingAddress}
                  onChange={(e) => handleChange('shippingAddress', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingCity}
                  onChange={(e) => handleChange('shippingCity', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingPostalCode}
                  onChange={(e) => handleChange('shippingPostalCode', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.shippingCountry}
                  onChange={(e) => handleChange('shippingCountry', e.target.value)}
                  required
                />
              </Form.Group>
            </Card>

            <Card className="p-4 mb-4">
              <Card.Title>Billing Info</Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingName}
                  onChange={(e) => handleChange('billingName', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingPhone}
                  onChange={(e) => handleChange('billingPhone', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billinggAddress}
                  onChange={(e) => handleChange('billinggAddress', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingCity}
                  onChange={(e) => handleChange('billingCity', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingPostalCode}
                  onChange={(e) => handleChange('billingPostalCode', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingCountry}
                  onChange={(e) => handleChange('billingCountry', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tax Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.billingTax}
                  onChange={(e) => handleChange('billingTax', e.target.value)}
                />
              </Form.Group>
            </Card>
          </Col>

          {/* Summary Card */}
          <Col xl={4}>
            <Card className="p-3 sticky-top" style={{ top: '1rem' }}>
              <Card.Title>Order Summary</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Project Name:</strong>
                  <span>{formData.projectname || '-'}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Quantity:</strong>
                  <span>{formData.pcbQty}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Dimensions:</strong>
                  <span>{formData.dimensions.x} x {formData.dimensions.y} {formData.dimensions.unit}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Base Material:</strong>
                  <span>{formData.baseMaterial}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Thickness:</strong>
                  <span>{formData.thickness}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>PCB Color:</strong>
                  <span>{formData.pcbColor}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Surface Finish:</strong>
                  <span>{formData.surfaceFinish}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Copper Weight:</strong>
                  <span>{formData.copperWeight}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Gerber Archive File:</strong>
                  <span>{zipFileName || 'No file uploaded'}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Original DB Price:</strong>
                  <span className="text-primary fw-bold">
                    ฿{(Number(orderPCB?.quoted_price_to_customer) || Number(orderPCB?.total_amount_cost) || 0).toFixed(2)}
                  </span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Recalculated Price:</strong>
                  <span className="text-muted">${totalPrice}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-light">
                  <strong>Custom Price</strong>
                  <div className="d-flex align-items-center" style={{ gap: '5px' }}>
                    <Form.Group controlId="custom_price" className="mb-0">
                      <Form.Control
                        type="number"
                        name="custom_price"
                        min="0"
                        value={formData.custom_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleChange('custom_price', isNaN(val) ? 0 : val);
                        }}
                      />
                    </Form.Group>
                    <span>฿</span>
                  </div>
                </ListGroup.Item>


              </ListGroup>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isButtonDisabled}
                className="mt-3"
              >
                {isUpdating ? 'Updating...' : 'Update Order'}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default OrderPCBEditsScreen;