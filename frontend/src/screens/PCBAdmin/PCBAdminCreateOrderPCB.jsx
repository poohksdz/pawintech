
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Card,
  ListGroup,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCheck } from 'react-icons/fa';
import JSZip from 'jszip';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useGetOwnShippingRatesQuery, useCreateOrderPCBbyAdminMutation
} from '../../slices/orderpcbSlice';
import {
  savePCBOrderDetails
} from '../../slices/pcbCartSlice';
import { useUploadPaymentSlipImageMutation } from '../../slices/ordersApiSlice';
import Loader from '../../components/Loader'
import Message from '../../components/Message';


const PCBAdminCreateOrderPCB = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const { data, isDataLoading, error } = useGetOwnShippingRatesQuery();

  const buildTime = data?.defaultPricing?.build_time ?? 0;
  const basePrice = data?.defaultPricing?.base_price ?? 0;
  const pricePerCm = data?.defaultPricing?.price_per_cm2 ?? 0;
  const extraServiceFee = data?.defaultPricing?.extra_service_fee ?? 0;
  const profitMargin = data?.defaultPricing?.profit_margin ?? 0;
  const exchangeRate = data?.defaultPricing?.exchange_rate ?? 0;
  const vat = data?.defaultPricing?.vat_percent ?? 0;
  const dhlServiceFixed = data?.defaultPricing?.dhl_service_fixed ?? 0;
  const baseMaterials = data?.baseMaterials || [];
  const surfaceFinishes = data?.surfaceFinishes || [];
  const copperWeights = data?.copperWeights || [];
  const pcbColors = data?.pcbColors || [
    { name: 'Green', price: 0 },
    { name: 'Purple', price: 1 },
    { name: 'Red', price: 1 },
    { name: 'Yellow', price: 1 },
    { name: 'Blue', price: 1 },
    { name: 'White', price: 1 },
    { name: 'Black', price: 1 }
  ];

  const [materialOptions, setMaterialOptions] = useState([]);
  const [finishOptions, setFinishOptions] = useState([]);
  const [copperOptions, setCopperOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);

  const { pcbOrderDetails } = useSelector((state) => state.cart);

  const shippingRates = data?.shippingRates || [];

  const groupedRates = {};

  shippingRates.forEach(rate => {
    const weight = parseFloat(rate.weight_kg).toFixed(1);

    if (!groupedRates[weight]) {
      groupedRates[weight] = {};
    }

    groupedRates[weight][rate.shipping_type] = rate.price;
  });

  const sortedWeightRates = Object.entries(groupedRates)
    .map(([weight, prices]) => ({
      weight,
      ems: prices['EMS'] ?? '-',
      dhl: prices['DHL'] ?? '-',
    }))
    .sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight));

  const [formData, setFormData] = useState({
    baseMaterial: 'FR-4',
    layers: 2,
    dimensions: { x: 0, y: 0, unit: 'mm' },
    pcbQty: 5,
    productType: 'Industrial/Consumer electronics',
    thickness: '1.6mm',
    pcbColor: 'Green',
    silkscreen: 'White',
    surfaceFinish: 'HASL(With lead)',
    copperWeight: '1 oz',
    viaCovering: 'Tented',
    tolerance: 'Regular',
    electricalTest: true,
    goldFingers: false,
    castellatedHoles: false,
    edgePlating: false,
    blindVias: false,
  });

  useEffect(() => {
    if (data) {
      setMaterialOptions(baseMaterials);
      setFinishOptions(surfaceFinishes);
      setCopperOptions(copperWeights);
      setColorOptions(pcbColors);
    }
  }, [data, baseMaterials, surfaceFinishes, copperWeights, pcbColors]);

  const getEmsDeliveryPrice = () => {
    const kg = parseFloat(getkilogram());

    // Sort EMS rates ascending by weight
    const emsRates = shippingRates
      .filter((rate) => rate.shipping_type === 'EMS')
      .sort((a, b) => parseFloat(a.weight_kg) - parseFloat(b.weight_kg));

    for (const rate of emsRates) {
      if (kg <= parseFloat(rate.weight_kg)) {
        return Number(rate.price);
      }
    }

    // If no match, return the last available rate (max weight)
    return emsRates.length > 0 ? Number(emsRates[emsRates.length - 1].price) : 0;
  };

  const getDhlDeliveryPrice = () => {
    const kg = parseFloat(getkilogram());

    const dhlRates = shippingRates
      .filter((rate) => rate.shipping_type === 'DHL')
      .sort((a, b) => parseFloat(a.weight_kg) - parseFloat(b.weight_kg));

    for (const rate of dhlRates) {
      if (kg <= parseFloat(rate.weight_kg)) {
        return Number(rate.price);
      }
    }

    return dhlRates.length > 0 ? Number(dhlRates[dhlRates.length - 1].price) : 0;
  };


  // payment slip image path returned from server
  const [slipImagePath, setSlipImagePath] = useState('');

  const [status, setStatus] = useState('accepted');
  const [confirmedPrice, setConfirmedPrice] = useState('');
  const [confirmedReason, setConfirmedReason] = useState('');

  // transfer / payer info
  const [copyerName, setCopyerName] = useState('');
  const [transferedAmount, setTransferedAmount] = useState('');
  const [transferedDate, setTransferedDate] = useState('');
  const [transferedName, setTransferedName] = useState('');

  // Customer Information
  const [customerUserID, setCustomerUserID] = useState('');
  const [customerCompanyName, setCustomerCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmailAddress, setCustomerEmailAddress] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');

  // Shipping Address
  const [shippingname, setShippingname] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Billing Address
  const [billingName, setBillingName] = useState('');
  const [billinggAddress, setBillinggAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [tax, setTax] = useState('');

  const [isReceiveCompleteSelected, setIsReceiveCompleteSelected] = useState(false);
  const [isBillingCompleteSelected, setIsBillingCompleteSelected] = useState(false);

  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] = useUploadPaymentSlipImageMutation();

  const handleRadioReceiveChange = (e) => setIsReceiveCompleteSelected(e.target.value === 'atcompany');
  const handleRadioChange = (e) => setIsBillingCompleteSelected(e.target.value === 'complete');

  const [zipFileName, setZipFileName] = useState('');
  const [gerberFiles, setGerberFiles] = useState([]);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [createOrderPCBbyAdmin, { isLoading }] = useCreateOrderPCBbyAdminMutation();

  const pcbQtyformData = formData.pcbQty;

  const getdimensionsPrice = () => {
    return formData.dimensions.x * formData.dimensions.y;
  }

  const getThicknessPrice = () => {
    return formData.thickness === '0.8mm' ? 0.5 : 1.0;
  };

  const getkilogram = () => {
    const area = formData.dimensions.x * formData.dimensions.y;
    const thickness = getThicknessPrice(); // ✅ invoke properly
    const weight = area * 0.0000035 * pcbQtyformData * thickness;
    const weightPack = weight + 0.3;
    return weightPack.toFixed(2);
  };

  const getColorPrice = () => {
    const selected = pcbColors.find((item) => item.name === formData.pcbColor);
    return Number(selected?.price) || 0;
  };

  const getSurfaceFinishPrice = () => {
    const selected = surfaceFinishes.find((s) => s.name === formData.surfaceFinish);
    return Number(selected?.price) || 0;
  };

  const getCopperWeightPrice = () => {
    const selected = copperWeights.find((c) => c.name === formData.copperWeight);
    return Number(selected?.price) || 0;
  };

  const getBaseMaterialPrice = () => {
    const selected = baseMaterials.find((m) => m.name === formData.baseMaterial);
    return Number(selected?.price) || 0;
  };

  const checkoutHandler = async () => {
    try {

      if (!userInfo) {
        navigate('/login');
        return;
      }

      const customerInfo = {
        customerUserID,
        customerCompanyName,
        customerName,
        customerAddress,
        customerEmailAddress,
        customerPhoneNumber,
      };

      const sellerInfo = {
        sellerUserID: userInfo._id,
        sellerName: userInfo.name,
        sellerAddress: userInfo.address,
        sellerCity: userInfo.city,
        sellerPostalCode: userInfo.postalCode,
        sellerCountry: userInfo.country,
        sellerEmailAddress: userInfo.email,
        sellerPhoneNumber: userInfo.phone,
      };

      const shippingAddress = {
        shippingname,
        address,
        city,
        postalCode,
        country,
        phone,
        receivePlace: isReceiveCompleteSelected ? 'atcompany' : 'bysending',
      };

      const billingAddress = {
        billingName,
        billinggAddress,
        billingCity,
        billingPostalCode,
        billingCountry,
        billingPhone,
        tax,
      };

      // const uploadedZipPath = await uploadgerberZipHandler(); 

      await createOrderPCBbyAdmin({
        orderData: {
          projectname: zipFileName.replace(/\.(zip|rar)$/i, ''),
          pcb_quantity: formData.pcbQty,
          length_cm: formData.dimensions.x,
          width_cm: formData.dimensions.y,
          base_material: formData.baseMaterial,
          layers: formData.layers,
          thickness_mm: formData.thickness,
          color: formData.pcbColor,
          silkscreen_color: formData.silkscreen,
          surface_finish: formData.surfaceFinish,
          copper_weight_oz: formData.copperWeight,
          gerberZip: gerberFiles[0],
          price: calculatedPrice,

          customerInfo,
          sellerInfo,
          shippingAddress,
          billingAddress,

          status,
          confirmedPrice,
          confirmedReason,
          transferedName,
          transferedDate,
          transferedAmount,
          paymentSlip: slipImagePath,
        },
      }).unwrap();
      toast.success('Order Created Successfully');
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error?.data?.message || error.error || 'Failed to create order');
    }
  };

  const uploadPaymentSlipImageHandler = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);

    try {
      const res = await uploadPaymentSlipImage(form).unwrap();
      const path = res?.image?.path ?? res?.image ?? '';
      setSlipImagePath(path);
      toast.success(res?.message ?? 'Slip uploaded');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to upload slip');
    }
  };

  const removeSlipImage = () => setSlipImagePath('');

  const getOptionAddOnTotal = () => {

    return (
      getBaseMaterialPrice() +
      getColorPrice() +
      getSurfaceFinishPrice() +
      getCopperWeightPrice()
    );
  };

  const getSubPrice = () => {
    const area = formData.dimensions.x * formData.dimensions.y;
    const qty = Number(pcbQtyformData);
    const priceCm = Number(pricePerCm);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const vatRate = Number(vat);
    const dhlRate = Number(getDhlDeliveryPrice());
    const dhlService = Number(dhlServiceFixed);
    const addons = getOptionAddOnTotal(); // เพิ่มตัวแปร addons

    if (area === 0) return "0.00";

    const totalArea = area * qty;
    const materialCost = (totalArea * priceCm) + extraFee;
    // นำ addons มารวมในต้นทุนหลัก
    const extratotal = materialCost + dhlRate + dhlService + addons;
    const withMargin = extratotal * (1 + margin / 100);
    const vatAmount = withMargin * (vatRate / 100);
    const withVat = withMargin + vatAmount;

    return withVat.toFixed(2);
  };

  const calculateTotalPrice = () => {
    const area = formData.dimensions.x * formData.dimensions.y;
    const qty = Number(pcbQtyformData);
    const priceCm = Number(pricePerCm);
    const base = Number(basePrice);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const vatRate = Number(vat);
    const dhlRate = Number(getDhlDeliveryPrice());
    const emsRate = Number(getEmsDeliveryPrice());
    const addons = getOptionAddOnTotal();
    const dhlService = Number(dhlServiceFixed);

    if (area === 0) return "0.00";

    const materialCost = (area * priceCm * qty) + extraFee + dhlRate + dhlService + addons;
    const withMargin = materialCost * (1 + margin / 100);
    const vatAmount = withMargin * (vatRate / 100);
    const withVat = withMargin + vatAmount + emsRate;
    const calculateTotal = withVat < base ? base : withVat;

    return calculateTotal.toFixed(2);
  };

  // 👇 Move this block below formData definition
  const calculateVatAmount = () => {
    const area = formData.dimensions.x * formData.dimensions.y;
    const qty = Number(pcbQtyformData);
    const priceCm = Number(pricePerCm);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const vatRate = Number(vat);
    const dhlRate = Number(getDhlDeliveryPrice());
    const dhlService = Number(dhlServiceFixed);
    const addons = getOptionAddOnTotal(); // เพิ่มตัวแปร addons

    if (area === 0) return "0.00";

    const totalArea = area * qty;
    const materialCost = (totalArea * priceCm) + extraFee;
    // นำ addons มารวมในต้นทุนหลัก
    const extratotal = materialCost + dhlRate + dhlService + addons;
    const withMargin = extratotal * (1 + margin / 100);
    const vatAmount = withMargin * (vatRate / 100);

    return vatAmount.toFixed(2);
  };

  const calculatedPrice = calculateTotalPrice();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];

    // Allow .zip or .rar (case-insensitive)
    if (!file || !/\.(zip|rar)$/i.test(file.name)) {
      alert('Please upload a valid .zip or .rar file.');
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
        setGerberFiles([`${result.path}`]);
      } else {
        setUploadSuccess(false);
        setUploadMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (err) {
      setUploadSuccess(false);
      setUploadMessage('❌ Failed to upload ZIP');
    }
  };

  const translations = {
    en: {
      PleaseSelectReceiveAddressLabel: 'Please select receive address',
      ReceiveProductBySendingLabel: 'Receive product by sending',
      ReceiveProductAtCompanyLabel: 'Receive product at company',
      PleaseSelectBillingAddressLabel: 'Please select billing address',
      ShortBillingAddressLabel: 'Short billing address',
      CompleteBillingAddressLabel: 'Complete billing address',
      billingAddressLbl: 'Billing Address',
      nameLabel: 'Name',
      namePlaceholder: 'Enter name',
      addressLabel: 'Address',
      address: 'Enter address',
      cityLabel: 'City',
      city: 'Enter city',
      postalCodeLabel: 'Postal Code',
      postalCode: 'Enter postal code',
      countryLabel: 'Country',
      country: 'Enter country',
      phoneLabel: 'Phone',
      phone: 'Enter phone',
      TaxLabel: 'Tax ID',
      Tax: 'Enter tax id',
      StatusLbl: 'Status',
      AcceptLbl: 'Accepted',
      RejectLbl: 'Rejected',
      ConfirmedPriceLbl: 'Confirmed Price',
      ConfirmedreasonLbl: 'Confirmed Reason',
      copyerNameLbl: 'Payer Name',
      transferAmountLbl: 'Amount',
      transferDateLbl: 'Transfer Date',
      transferAccountLbl: 'Bank Account',
      bankAccountNamePlaceholder: 'Select bank account',
      transferedAmountPlaceholder: 'Enter amount',
    },
    thai: {
      PleaseSelectReceiveAddressLabel: 'กรุณาเลือกที่อยู่สำหรับรับสินค้า',
      ReceiveProductBySendingLabel: 'รับสินค้าทางจัดส่ง',
      ReceiveProductAtCompanyLabel: 'รับสินค้าที่บริษัท',
      PleaseSelectBillingAddressLabel: 'กรุณาเลือกที่อยู่สำหรับออกบิล',
      ShortBillingAddressLabel: 'ที่อยู่บิลแบบสั้น',
      CompleteBillingAddressLabel: 'ที่อยู่บิลแบบเต็ม',
      billingAddressLbl: 'ที่อยู่สำหรับออกบิล',
      nameLabel: 'ชื่อ',
      namePlaceholder: 'กรอกชื่อ',
      addressLabel: 'ที่อยู่',
      address: 'กรอกที่อยู่',
      cityLabel: 'เมือง/อำเภอ',
      city: 'กรอกเมือง/อำเภอ',
      postalCodeLabel: 'รหัสไปรษณีย์',
      postalCode: 'กรอกรหัสไปรษณีย์',
      countryLabel: 'ประเทศ',
      country: 'กรอกประเทศ',
      phoneLabel: 'เบอร์โทร',
      phone: 'กรอกเบอร์โทร',
      TaxLabel: 'เลขผู้เสียภาษี',
      Tax: 'กรอกเลขผู้เสียภาษี',
      StatusLbl: 'สถานะ',
      AcceptLbl: 'รับออเดอร์',
      RejectLbl: 'ปฏิเสธ',
      ConfirmedPriceLbl: 'ราคายืนยัน',
      ConfirmedreasonLbl: 'เหตุผล/หมายเหตุ',
      copyerNameLbl: 'ชื่อผู้โอน',
      transferAmountLbl: 'จำนวนเงิน',
      transferDateLbl: 'วันที่โอน',
      transferAccountLbl: 'บัญชีรับโอน',
      bankAccountNamePlaceholder: 'เลือกบัญชีรับโอน',
      transferedAmountPlaceholder: 'กรอกจำนวนเงิน',
    },
  };

  const t = translations[language] || translations.en;

  const renderColorButtons = (field, options) => {
    const disableAllButFirst = ['surfaceFinish', 'copperWeight', 'baseMaterial'];

    if (isDataLoading) return <Loader />;
    if (error)
      return (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      );

    return (

      <div className="mb-3 d-flex flex-wrap justify-content-left">
        {options.map((option, index) => {
          const optionName = typeof option === 'object' ? option.name : option;
          const optionKey = typeof option === 'object' ? option.id : option;

          const isSelected = formData[field] === optionName;
          const isColor = /^(Green|Red|Blue|Yellow|Black|White|Purple)$/i.test(optionName);
          const backgroundColor = isColor ? optionName.toLowerCase() : undefined;
          const textColor = ['white', 'yellow', '#ffffff'].includes(backgroundColor)
            ? 'black'
            : 'white';

          const isDisabled = disableAllButFirst.includes(field) && index !== 0;

          return (
            <Button
              key={optionKey}
              variant={isColor ? undefined : 'outline-secondary'}
              className={`me-2 mb-2 px-3 py-2 border position-relative ${isSelected ? 'border-primary' : ''
                }`}
              disabled={isDisabled}
              style={{
                borderWidth: '2px',
                backgroundColor: isColor ? backgroundColor : undefined,
                color: isColor ? textColor : undefined,
                minWidth: '80px',
                minHeight: '40px',
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !isDisabled && handleChange(field, optionName)}
            >
              {optionName}
              {isSelected && !isDisabled && (
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

  const orderNowHandler = (e) => {
    e.preventDefault();

    if (!userInfo) {
      navigate('/login')
    }

    const shipping = userInfo.shippingAddress || {};
    const billing = userInfo.billingAddress || {};

    if (!zipFileName && (!gerberFiles || gerberFiles.length === 0)) {
      toast.error('Please upload a Gerber ZIP file before placing the order.');
      return;
    }

    const orderDetails = {
      projectname: zipFileName?.replace(/\.(zip|rar)$/i, ''),
      pcb_quantity: formData.pcbQty,
      length_cm: formData.dimensions.x,
      width_cm: formData.dimensions.y,
      base_material: formData.baseMaterial,
      layers: formData.layers,
      thickness_mm: parseFloat(formData.thickness),
      color: formData.pcbColor,
      silkscreen_color: formData.silkscreen,
      surface_finish: formData.surfaceFinish,
      copper_weight_oz: formData.copperWeight,
      gerberZip: `${gerberFiles[0]}`,
      price: calculatedPrice,

      user: {
        id: userInfo._id,
        name: userInfo.name,
        email: userInfo.email,
      },

      shippingAddress: {
        name: shipping.shippingname,
        address: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
      },

      billingAddress: {
        name: billing.billingName,
        address: billing.billingAddress,
        city: billing.billingCity,
        postalCode: billing.billingPostalCode,
        country: billing.billingCountry,
        phone: billing.billingPhone,
        tax: billing.tax || '',
      },
    };

    dispatch(savePCBOrderDetails(orderDetails)); // ID added in slice

    toast.success('Order PCB Add Cart!');
    localStorage.setItem('pcbcard', JSON.stringify(orderDetails));  // <-- Save here

    // navigate('/cart/pcbcart');
  };

  { renderColorButtons('baseMaterial', materialOptions) }
  { renderColorButtons('surfaceFinish', finishOptions) }
  { renderColorButtons('copperWeight', copperOptions) }
  { renderColorButtons('pcbColor', colorOptions) }
  {
    renderColorButtons('layers', [
      { id: 1, name: 1 },
      { id: 2, name: 2 },
    ])
  }
  {
    renderColorButtons('thickness', [
      { id: 1, name: '0.8mm' },
      { id: 2, name: '1.6mm' },
    ])
  }
  {
    renderColorButtons('silkscreen', [
      { id: 1, name: 'White' },
      { id: 2, name: 'Black' },
    ])
  }

  return (
    <Container className="my-4">
      <Form onSubmit={orderNowHandler}>
        <h2 className="mb-4">Order PCB</h2>

        {/* ZIP Upload Section */}
        <div className="position-relative text-center p-5 mb-4 bg-primary text-white">
          {previewURL ? (
            <>
              <Image src={previewURL} alt="Preview" style={{ maxHeight: '200px' }} />
              <p className="mt-2">{zipFileName}</p>
            </>
          ) : (
            <p>Upload Your Gerber ZIP File or RAR File</p>
          )}

          <Form.Control
            type="file"
            accept=".zip,.rar"
            onChange={handleZipUpload}
            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
          />

          {uploadMessage && (
            <div className="mt-3 text-white fw-bold">{uploadMessage}</div>
          )}
        </div>

        {gerberFiles.length > 0 && (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Project Name</Card.Title>
              <ListGroup variant="flush">
                {gerberFiles.map((file, idx) => (
                  <ListGroup.Item key={idx}>
                    {/* {file.replace(/^gerbers\//, '')} */}
                    {zipFileName?.replace(/\.zip$/i, '')}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        <Row className="justify-content-center">
          <Col xl={7}>
            <Card className="p-4">
              <div className="d-flex flex-column align-items-center">

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Base Material</Card.Title>
                  {renderColorButtons('baseMaterial', materialOptions)}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Layers</Card.Title>
                  {renderColorButtons('layers', [1, 2])}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Dimensions (mm)</Card.Title>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      min="0"
                      style={{ width: '100px' }}
                      value={formData.dimensions.x}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: {
                            ...formData.dimensions,
                            x: Math.max(parseInt(e.target.value)),
                          },
                        })
                      }
                    />
                    <span className="mx-2">×</span>
                    <Form.Control
                      type="number"
                      min="0"
                      style={{ width: '100px' }}
                      value={formData.dimensions.y}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: {
                            ...formData.dimensions,
                            y: Math.max(parseInt(e.target.value)),
                          },
                        })
                      }
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mt-4 mb-2 w-100">
                  <Card.Title>Thickness</Card.Title>
                  {renderColorButtons('thickness', ['0.8mm', '1.6mm'])}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Color</Card.Title>
                  {renderColorButtons('pcbColor', colorOptions)}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Silk Screen</Card.Title>
                  {renderColorButtons('silkscreen', ['White', 'Black'])}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>Surface Finish</Card.Title>
                  {renderColorButtons('surfaceFinish', finishOptions)}
                </Form.Group>

                <Form.Group className="mb-2 w-100">
                  <Card.Title>PCB Quantity</Card.Title>
                  <Form.Control
                    type="number"
                    className="w-100 w-xl-300"
                    min="5"
                    value={formData.pcbQty}
                    onChange={(e) =>
                      handleChange('pcbQty', Math.max(parseInt(e.target.value)))
                    }
                  />
                </Form.Group>

                <Form.Group className="mt-4 mb-2 w-100">
                  <Card.Title>Copper Weight</Card.Title>
                  {renderColorButtons('copperWeight', copperOptions)}
                </Form.Group>
              </div>
            </Card>

            <hr />

            <Card className="p-3 mb-4">
              <Card.Title>Customer Information</Card.Title>

              <Form.Group className="my-2" controlId="customerUserID">
                <Form.Label>Customer User ID</Form.Label>
                <Form.Control type="text" placeholder="Enter customer user ID" value={customerUserID} onChange={(e) => setCustomerUserID(e.target.value)} required />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerCompanyName">
                <Form.Label>Customer Company Name (optional)</Form.Label>
                <Form.Control type="text" placeholder="Enter customer company name (or leave empty)" value={customerCompanyName} onChange={(e) => setCustomerCompanyName(e.target.value)} />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerName">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control type="text" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerAddress">
                <Form.Label>Customer Address</Form.Label>
                <Form.Control type="text" placeholder="Enter customer address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerEmailAddress">
                <Form.Label>Customer Email Address</Form.Label>
                <Form.Control type="email" placeholder="Enter customer email address" value={customerEmailAddress} onChange={(e) => setCustomerEmailAddress(e.target.value)} required />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerPhoneNumber">
                <Form.Label>Customer Phone Number</Form.Label>
                <Form.Control type="text" placeholder="Enter customer phone number" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} required />
              </Form.Group>

            </Card>
            <hr />

            {/* -- Address Section -- */}
            <Form.Group className="my-2" controlId="ReceiveSelect">
              <h5><Form.Label>{t.PleaseSelectReceiveAddressLabel}</Form.Label></h5>
              <div className="d-flex justify-content-between">
                <Form.Check type="radio" label={t.ReceiveProductBySendingLabel} name="receiveAddressFormat" id="receiveBySending" value="bysending" onChange={handleRadioReceiveChange} checked={!isReceiveCompleteSelected} />
                <Form.Check type="radio" label={t.ReceiveProductAtCompanyLabel} name="receiveAddressFormat" id="receiveAtCompany" value="atcompany" onChange={handleRadioReceiveChange} checked={isReceiveCompleteSelected} />
              </div>
            </Form.Group>

            {isReceiveCompleteSelected && <div style={{ border: '2px solid gray', padding: 10 }} className="mb-3">You selected to receive product at our company.</div>}

            {!isReceiveCompleteSelected && (
              <>
                <Form.Group className="my-2" controlId="shippingname">
                  <Form.Label>{t.nameLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.namePlaceholder} value={shippingname} onChange={(e) => setShippingname(e.target.value)} required />
                </Form.Group>

                <Form.Group className="my-2" controlId="address">
                  <Form.Label>{t.addressLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.address} value={address} onChange={(e) => setAddress(e.target.value)} required />
                </Form.Group>

                <Form.Group className="my-2" controlId="city">
                  <Form.Label>{t.cityLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.city} value={city} onChange={(e) => setCity(e.target.value)} required />
                </Form.Group>

                <Form.Group className="my-2" controlId="postalCode">
                  <Form.Label>{t.postalCodeLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.postalCode} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                </Form.Group>

                <Form.Group className="my-2" controlId="country">
                  <Form.Label>{t.countryLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.country} value={country} onChange={(e) => setCountry(e.target.value)} required />
                </Form.Group>

                <Form.Group className="my-2" controlId="phone">
                  <Form.Label>{t.phoneLabel}</Form.Label>
                  <Form.Control type="text" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </Form.Group>

                <hr />

                <Form.Group className="my-2" controlId="BillingSelect">
                  <h5>{t.PleaseSelectBillingAddressLabel}</h5>
                  <div className="d-flex justify-content-between">
                    <Form.Check type="radio" label={t.ShortBillingAddressLabel} name="billingAddressFormat" id="billingShort" value="short" onChange={handleRadioChange} checked={!isBillingCompleteSelected} />
                    <Form.Check type="radio" label={t.CompleteBillingAddressLabel} name="billingAddressFormat" id="billingComplete" value="complete" onChange={handleRadioChange} checked={isBillingCompleteSelected} />
                  </div>
                </Form.Group>

                <hr />

                {isBillingCompleteSelected && (
                  <>
                    <h5>{t.billingAddressLbl}</h5>
                    <Form.Group className="my-2" controlId="billingName">
                      <Form.Label>{t.nameLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.namePlaceholder} value={billingName} onChange={(e) => setBillingName(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billinggAddress">
                      <Form.Label>{t.addressLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.address} value={billinggAddress} onChange={(e) => setBillinggAddress(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingCity">
                      <Form.Label>{t.cityLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.city} value={billingCity} onChange={(e) => setBillingCity(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingPostalCode">
                      <Form.Label>{t.postalCodeLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.postalCode} value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingCountry">
                      <Form.Label>{t.countryLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.country} value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingPhone">
                      <Form.Label>{t.phoneLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.phone} value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="tax">
                      <Form.Label>{t.TaxLabel}</Form.Label>
                      <Form.Control type="text" placeholder={t.Tax} value={tax} onChange={(e) => setTax(e.target.value)} required />
                    </Form.Group>
                  </>
                )}
              </>
            )}

          </Col>

          <Col xl={5}>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Summary Selected</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Base Material</span>
                    <span>{formData.baseMaterial}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Layers</span>
                    <span>{formData.layers}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Dimensions</span>
                    <span>
                      {formData.dimensions.x} × {formData.dimensions.y}{' '}
                      {formData.dimensions.unit}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Thickness</span>
                    <span>{formData.thickness}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Color</span>
                    <span>{formData.pcbColor}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Silkscreen</span>
                    <span>{formData.silkscreen}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Surface Finish</span>
                    <span>{formData.surfaceFinish}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Copper Weight</span>
                    <span>{formData.copperWeight}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>PCB Quantity</span>
                    <span>{formData.pcbQty}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>


            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Charge Details</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Price</span>
                    <span>{getSubPrice()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Base Material</span>
                    <span>{getBaseMaterialPrice().toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Surface Finish</span>
                    <span>{getSurfaceFinishPrice().toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Solder Mark Color</span>
                    <span>{getColorPrice().toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Copper Weight</span>
                    <span>{getCopperWeightPrice().toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  {/* <ListGroup.Item className="d-flex justify-content-between">
                    <span>Board</span>
                    <span>0.00 ฿</span>
                  </ListGroup.Item> */}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Build Time</span>
                    <span>{buildTime} days</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Delivery</span>
                    <span>{getEmsDeliveryPrice().toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Vat</span>
                    <span>{calculateVatAmount()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item variant="light" className="d-flex justify-content-between">
                    <span className="fw-bold">Total Price</span>
                    <span className="fw-bold">{calculatedPrice} ฿</span>
                  </ListGroup.Item>

                  <ListGroup.Item className="d-flex justify-content-between align-items-center text-center">
                    <strong>{t.transferAccountLbl}</strong>
                    <span>
                      <Form.Select value={transferedName} onChange={(e) => setTransferedName(e.target.value)} required>
                        <option value="">{t.bankAccountNamePlaceholder}</option>
                        <option value="082-0-74742-4 (KTB)">082-0-74742-4 (KTB)</option>
                        <option value="146-2-90304-4 (SCB)">146-2-90304-4 (SCB)</option>
                      </Form.Select> </span>
                  </ListGroup.Item>

                  <ListGroup.Item className="d-flex justify-content-between align-items-center text-center">
                    <strong>{t.transferDateLbl}</strong>
                    <span><Form.Control type="datetime-local" value={transferedDate} onChange={(e) => setTransferedDate(e.target.value)} required /> </span>
                  </ListGroup.Item>

                  <ListGroup.Item className="d-flex justify-content-between align-items-center text-center">
                    <strong>{t.StatusLbl}</strong>
                    <span>
                      <Form.Select className="w-100" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="accepted">{t.AcceptLbl}</option>
                        <option value="rejected">{t.RejectLbl}</option>
                      </Form.Select>
                    </span>
                  </ListGroup.Item>

                  {status === 'accepted' && (
                    <ListGroup.Item className="d-flex flex-column">
                      <strong>{t.ConfirmedPriceLbl}</strong>
                      <span><Form.Control className="w-100" type="number" min="0" step="0.01" value={confirmedPrice} onChange={(e) => setConfirmedPrice(e.target.value)} /></span>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item className="d-flex flex-column">
                    <strong>{t.ConfirmedreasonLbl}</strong>
                    <span><Form.Control className="w-100" as="textarea" rows={5} value={confirmedReason} onChange={(e) => setConfirmedReason(e.target.value)} /></span>
                  </ListGroup.Item>

                  <ListGroup.Item className="d-flex flex-column">
                    <Form.Label>Slip Image</Form.Label>
                    <Col>
                      <Form.Control type="file" accept="image/*" onChange={uploadPaymentSlipImageHandler} />
                      {isImageUploading && <Loader />}
                    </Col>

                    {slipImagePath && (
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <Image src={slipImagePath} alt="Slip" thumbnail style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                        <Button variant="danger" className='text-white' size="sm" onClick={removeSlipImage} style={{ position: 'absolute', top: 8, right: 8 }}>Remove</Button>
                      </div>
                    )}
                  </ListGroup.Item>

                </ListGroup>
                <div className="mx-3">
                  <Button type="submit" disabled={isLoading || isDataLoading} className="w-100 mt-3"
                    onClick={checkoutHandler}>
                    {isLoading ? 'Placing Order...' : 'ORDER NOW'}
                  </Button>

                  <div className="mt-2">
                    <small className="text-danger">
                      * If your order is lower than the minimum {Number(basePrice).toLocaleString()}฿ charge, the minimum charge will apply.
                    </small>
                  </div>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};



export default PCBAdminCreateOrderPCB