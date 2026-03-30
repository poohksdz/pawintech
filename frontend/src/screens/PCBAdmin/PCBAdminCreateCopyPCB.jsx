import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Card,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
  useCreatecopyPCBbyAdminMutation,
} from "../../slices/copypcbApiSlice";
import { useUploadPaymentSlipImageMutation } from "../../slices/ordersApiSlice";
import Loader from "../../components/Loader";

const PCBAdminCreateCopyPCB = () => {
  const { language } = useSelector((state) => state.language);
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    pcbQty: 5,
    projectname: "",
    zipFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [frontImages, setFrontImages] = useState([]); // [{file, url}]
  const [backImages, setBackImages] = useState([]);
  const [notes, setNotes] = useState("");

  // payment slip image path returned from server
  const [slipImagePath, setSlipImagePath] = useState("");

  const [status, setStatus] = useState("accepted");
  const [confirmedPrice, setConfirmedPrice] = useState("");
  const [confirmedReason, setConfirmedReason] = useState("");

  // transfer / payer info
  const [copyerName, setCopyerName] = useState("");
  const [transferedAmount, setTransferedAmount] = useState("");
  const [transferedDate, setTransferedDate] = useState("");
  const [transferedName, setTransferedName] = useState("");

  // Customer Information
  const [customerUserID, setCustomerUserID] = useState("");
  const [customerCompanyName, setCustomerCompanyName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmailAddress, setCustomerEmailAddress] = useState("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");

  // Shipping Address
  const [shippingname, setShippingname] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  // Billing Address
  const [billingName, setBillingName] = useState("");
  const [billinggAddress, setBillinggAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [tax, setTax] = useState("");

  const [isReceiveCompleteSelected, setIsReceiveCompleteSelected] =
    useState(false);
  const [isBillingCompleteSelected, setIsBillingCompleteSelected] =
    useState(false);

  const [createcopyPCBbyAdmin, { isLoading: creating }] =
    useCreatecopyPCBbyAdminMutation();
  const [uploadcopypcbZip] = useUploadcopypcbZipMutation();
  const [uploadMultipleCopyPCBImages] =
    useUploadMultipleCopyPCBImagesMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  useEffect(() => {
    return () => {
      // revoke created object URLs to avoid memory leaks
      frontImages.forEach((f) => f?.url && URL.revokeObjectURL(f.url));
      backImages.forEach((f) => f?.url && URL.revokeObjectURL(f.url));
    };
  }, [frontImages, backImages]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRadioReceiveChange = (e) =>
    setIsReceiveCompleteSelected(e.target.value === "atcompany");
  const handleRadioChange = (e) =>
    setIsBillingCompleteSelected(e.target.value === "complete");

  const handleImageUpload = (event, type) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    if (type === "front") setFrontImages((prev) => [...prev, ...previews]);
    else setBackImages((prev) => [...prev, ...previews]);

    // allow selecting same file again
    event.target.value = "";
  };

  const removeImage = (index, type) => {
    if (type === "front") {
      const item = frontImages[index];
      if (item?.url) URL.revokeObjectURL(item.url);
      setFrontImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const item = backImages[index];
      if (item?.url) URL.revokeObjectURL(item.url);
      setBackImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (images) => {
    if (!images || images.length === 0) return [];
    const form = new FormData();
    images.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleCopyPCBImages(form).unwrap();
    return (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
  };

  const uploadcopypcbZipHandler = async () => {
    if (!formData.zipFile) return null;
    const form = new FormData();
    form.append("copypcbZip", formData.zipFile);
    const res = await uploadcopypcbZip(form).unwrap();
    return res?.path || null;
  };

  const uploadPaymentSlipImageHandler = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);

    try {
      const res = await uploadPaymentSlipImage(form).unwrap();
      const path = res?.image?.path ?? res?.image ?? "";
      setSlipImagePath(path);
      toast.success(res?.message ?? "Slip uploaded");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to upload slip");
    }
  };

  const removeSlipImage = () => setSlipImagePath("");

  const orderNowHandler = async (e) => {
    e.preventDefault();

    if (!formData.projectname || !formData.projectname.trim()) {
      toast.error("Please enter a project name.");
      return;
    }

    if (frontImages.length < 1) {
      toast.error("Please upload at least 1 front PCB image.");
      return;
    }

    if (backImages.length < 1) {
      toast.error("Please upload at least 1 back PCB image.");
      return;
    }

    await checkoutHandler();
  };

  const checkoutHandler = async () => {
    try {
      setIsLoading(true);

      if (!userInfo) {
        navigate("/login");
        return;
      }

      const uploadedZipPath = await uploadcopypcbZipHandler();
      const uploadedFront = await uploadImages(frontImages);
      const uploadedBack = await uploadImages(backImages);

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
        receivePlace: isReceiveCompleteSelected ? "atcompany" : "bysending",
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

      const payload = {
        user_id: userInfo._id,
        projectname: formData.projectname,
        customerInfo,
        sellerInfo,
        pcb_qty: formData.pcbQty,
        paymentSlip: slipImagePath,
        notes,
        copypcbFrontImages: uploadedFront,
        copypcbBackImages: uploadedBack,
        copypcb_zip: uploadedZipPath,
        status,
        confirmed_price: status === "accepted" ? confirmedPrice : "-",
        confirmed_reason: confirmedReason,
        shippingAddress,
        billingAddress,
        transfer: {
          copyerName,
          transferedAmount,
          transferedName,
          transferedDate,
        },
      };

      await createcopyPCBbyAdmin(payload).unwrap();

      toast.success("Order placed successfully!");
      setIsLoading(false);
      // navigate('/cart/copypcbcart');
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  const translations = {
    en: {
      PleaseSelectReceiveAddressLabel: "Please select receive address",
      ReceiveProductBySendingLabel: "Receive product by sending",
      ReceiveProductAtCompanyLabel: "Receive product at company",
      PleaseSelectBillingAddressLabel: "Please select billing address",
      ShortBillingAddressLabel: "Short billing address",
      CompleteBillingAddressLabel: "Complete billing address",
      billingAddressLbl: "Billing Address",
      nameLabel: "Name",
      namePlaceholder: "Enter name",
      addressLabel: "Address",
      address: "Enter address",
      cityLabel: "City",
      city: "Enter city",
      postalCodeLabel: "Postal Code",
      postalCode: "Enter postal code",
      countryLabel: "Country",
      country: "Enter country",
      phoneLabel: "Phone",
      phone: "Enter phone",
      TaxLabel: "Tax ID",
      Tax: "Enter tax id",
      StatusLbl: "Status",
      AcceptLbl: "Accepted",
      RejectLbl: "Rejected",
      ConfirmedPriceLbl: "Confirmed Price",
      ConfirmedreasonLbl: "Confirmed Reason",
      copyerNameLbl: "Payer Name",
      transferAmountLbl: "Amount",
      transferDateLbl: "Transfer Date",
      transferAccountLbl: "Bank Account",
      bankAccountNamePlaceholder: "Select bank account",
      transferedAmountPlaceholder: "Enter amount",
    },
    thai: {
      PleaseSelectReceiveAddressLabel: "กรุณาเลือกที่อยู่สำหรับรับสินค้า",
      ReceiveProductBySendingLabel: "รับสินค้าทางจัดส่ง",
      ReceiveProductAtCompanyLabel: "รับสินค้าที่บริษัท",
      PleaseSelectBillingAddressLabel: "กรุณาเลือกที่อยู่สำหรับออกบิล",
      ShortBillingAddressLabel: "ที่อยู่บิลแบบสั้น",
      CompleteBillingAddressLabel: "ที่อยู่บิลแบบเต็ม",
      billingAddressLbl: "ที่อยู่สำหรับออกบิล",
      nameLabel: "ชื่อ",
      namePlaceholder: "กรอกชื่อ",
      addressLabel: "ที่อยู่",
      address: "กรอกที่อยู่",
      cityLabel: "เมือง/อำเภอ",
      city: "กรอกเมือง/อำเภอ",
      postalCodeLabel: "รหัสไปรษณีย์",
      postalCode: "กรอกรหัสไปรษณีย์",
      countryLabel: "ประเทศ",
      country: "กรอกประเทศ",
      phoneLabel: "เบอร์โทร",
      phone: "กรอกเบอร์โทร",
      TaxLabel: "เลขผู้เสียภาษี",
      Tax: "กรอกเลขผู้เสียภาษี",
      StatusLbl: "สถานะ",
      AcceptLbl: "รับออเดอร์",
      RejectLbl: "ปฏิเสธ",
      ConfirmedPriceLbl: "ราคายืนยัน",
      ConfirmedreasonLbl: "เหตุผล/หมายเหตุ",
      copyerNameLbl: "ชื่อผู้โอน",
      transferAmountLbl: "จำนวนเงิน",
      transferDateLbl: "วันที่โอน",
      transferAccountLbl: "บัญชีรับโอน",
      bankAccountNamePlaceholder: "เลือกบัญชีรับโอน",
      transferedAmountPlaceholder: "กรอกจำนวนเงิน",
    },
  };

  const t = (key, fallback = "") =>
    translations?.[language]?.[key] ?? translations.en[key] ?? fallback ?? key;

  return (
    <Container className="my-4">
      <Form onSubmit={orderNowHandler}>
        <h2 className="mb-4">Order Copy & Modify PCB</h2>

        <Row className="mb-4">
          <Col xl={8}>
            <Card className="p-3 mb-4">
              <Card.Title>Project Name</Card.Title>
              <Form.Control
                type="text"
                placeholder="Enter project name"
                value={formData.projectname}
                onChange={(e) => handleChange("projectname", e.target.value)}
              />
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Front PCB Photos (at least 1)</Card.Title>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, "front")}
              />
              <div className="d-flex flex-wrap mt-3 gap-2">
                {frontImages.map((img, idx) => (
                  <div key={img.url || idx} style={{ position: "relative" }}>
                    <Image
                      src={img.url}
                      alt={`Front ${idx + 1}`}
                      thumbnail
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ position: "absolute", top: 4, right: 4 }}
                      onClick={() => removeImage(idx, "front")}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Back PCB Photos (at least 1)</Card.Title>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, "back")}
              />
              <div className="d-flex flex-wrap mt-3 gap-2">
                {backImages.map((img, idx) => (
                  <div key={img.url || idx} style={{ position: "relative" }}>
                    <Image
                      src={img.url}
                      alt={`Back ${idx + 1}`}
                      thumbnail
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ position: "absolute", top: 4, right: 4 }}
                      onClick={() => removeImage(idx, "back")}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>ZIP File or RAR File (if available)</Card.Title>
              <Form.Control
                type="file"
                accept=".zip,.rar"
                onChange={(e) =>
                  handleChange("zipFile", e.target.files?.[0] || null)
                }
              />
              {formData.zipFile && (
                <div className="mt-2 text-muted">
                  Selected: {formData.zipFile.name}
                </div>
              )}
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Additional Notes</Card.Title>
              <Form.Control
                as="textarea"
                rows={7}
                placeholder="Enter any specific details or requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card>

            <hr />

            <Card className="p-3 mb-4">
              <Card.Title>Customer Information</Card.Title>

              <Form.Group className="my-2" controlId="customerUserID">
                <Form.Label>Customer User ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer user ID"
                  value={customerUserID}
                  onChange={(e) => setCustomerUserID(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerCompanyName">
                <Form.Label>Customer Company Name (optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer company name (or leave empty)"
                  value={customerCompanyName}
                  onChange={(e) => setCustomerCompanyName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerName">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerAddress">
                <Form.Label>Customer Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerEmailAddress">
                <Form.Label>Customer Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter customer email address"
                  value={customerEmailAddress}
                  onChange={(e) => setCustomerEmailAddress(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="my-2" controlId="customerPhoneNumber">
                <Form.Label>Customer Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter customer phone number"
                  value={customerPhoneNumber}
                  onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                  required
                />
              </Form.Group>
            </Card>
            <hr />

            {/* -- Address Section -- */}
            <Form.Group className="my-2" controlId="ReceiveSelect">
              <h5>
                {t(
                  "PleaseSelectReceiveAddressLabel",
                  "Please select receive address",
                )}
              </h5>
              <div className="d-flex justify-content-between">
                <Form.Check
                  type="radio"
                  label={t(
                    "ReceiveProductBySendingLabel",
                    "Receive product by sending",
                  )}
                  name="receiveAddressFormat"
                  id="receiveBySending"
                  value="bysending"
                  onChange={handleRadioReceiveChange}
                  checked={!isReceiveCompleteSelected}
                />
                <Form.Check
                  type="radio"
                  label={t(
                    "ReceiveProductAtCompanyLabel",
                    "Receive product at company",
                  )}
                  name="receiveAddressFormat"
                  id="receiveAtCompany"
                  value="atcompany"
                  onChange={handleRadioReceiveChange}
                  checked={isReceiveCompleteSelected}
                />
              </div>
            </Form.Group>

            {isReceiveCompleteSelected && (
              <div
                style={{ border: "2px solid gray", padding: 10 }}
                className="mb-3"
              >
                You selected to receive product at our company.
              </div>
            )}

            {!isReceiveCompleteSelected && (
              <>
                <Form.Group className="my-2" controlId="shippingname">
                  <Form.Label>{t("nameLabel", "Name")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("namePlaceholder", "Enter name")}
                    value={shippingname}
                    onChange={(e) => setShippingname(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="my-2" controlId="address">
                  <Form.Label>{t("addressLabel", "Address")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("address", "Enter address")}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="my-2" controlId="city">
                  <Form.Label>{t("cityLabel", "City")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("city", "Enter city")}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="my-2" controlId="postalCode">
                  <Form.Label>{t("postalCodeLabel", "Postal Code")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("postalCode", "Enter postal code")}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="my-2" controlId="country">
                  <Form.Label>{t("countryLabel", "Country")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("country", "Enter country")}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="my-2" controlId="phone">
                  <Form.Label>{t("phoneLabel", "Phone")}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t("phone", "Enter phone")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </Form.Group>

                <hr />

                <Form.Group className="my-2" controlId="BillingSelect">
                  <h5>
                    {t(
                      "PleaseSelectBillingAddressLabel",
                      "Please select billing address",
                    )}
                  </h5>
                  <div className="d-flex justify-content-between">
                    <Form.Check
                      type="radio"
                      label={t(
                        "ShortBillingAddressLabel",
                        "Short billing address",
                      )}
                      name="billingAddressFormat"
                      id="billingShort"
                      value="short"
                      onChange={handleRadioChange}
                      checked={!isBillingCompleteSelected}
                    />
                    <Form.Check
                      type="radio"
                      label={t(
                        "CompleteBillingAddressLabel",
                        "Complete billing address",
                      )}
                      name="billingAddressFormat"
                      id="billingComplete"
                      value="complete"
                      onChange={handleRadioChange}
                      checked={isBillingCompleteSelected}
                    />
                  </div>
                </Form.Group>

                <hr />

                {isBillingCompleteSelected && (
                  <>
                    <h5>{t("billingAddressLbl", "Billing Address")}</h5>
                    <Form.Group className="my-2" controlId="billingName">
                      <Form.Label>{t("nameLabel", "Name")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("namePlaceholder", "Enter name")}
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billinggAddress">
                      <Form.Label>{t("addressLabel", "Address")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("address", "Enter address")}
                        value={billinggAddress}
                        onChange={(e) => setBillinggAddress(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingCity">
                      <Form.Label>{t("cityLabel", "City")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("city", "Enter city")}
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingPostalCode">
                      <Form.Label>
                        {t("postalCodeLabel", "Postal Code")}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("postalCode", "Enter postal code")}
                        value={billingPostalCode}
                        onChange={(e) => setBillingPostalCode(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingCountry">
                      <Form.Label>{t("countryLabel", "Country")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("country", "Enter country")}
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="billingPhone">
                      <Form.Label>{t("phoneLabel", "Phone")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("phone", "Enter phone")}
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="my-2" controlId="tax">
                      <Form.Label>{t("TaxLabel", "Tax ID")}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("Tax", "Enter tax id")}
                        value={tax}
                        onChange={(e) => setTax(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </>
                )}
              </>
            )}
          </Col>

          <Col xl={4}>
            <Card className="p-4 mb-3 align-items-center">
              {/* <Form.Group as={Row} className="mb-3  w-100">
                <Form.Label>{t('copyerNameLbl')}</Form.Label> 
                  <Form.Control type="text" value={copyerName} onChange={(e) => setCopyerName(e.target.value)} required /> 
              </Form.Group> */}

              <Form.Group as={Row} className="mb-3  w-100">
                <Form.Label>{t("transferAmountLbl")}</Form.Label>
                <Form.Control
                  type="number"
                  placeholder={t("transferedAmountPlaceholder")}
                  value={transferedAmount}
                  onChange={(e) => setTransferedAmount(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group as={Row} className="mb-3  w-100">
                <Form.Label>{t("transferAccountLbl")}</Form.Label>
                <Form.Select
                  value={transferedName}
                  onChange={(e) => setTransferedName(e.target.value)}
                  required
                >
                  <option value="">{t("bankAccountNamePlaceholder")}</option>
                  <option value="082-0-74742-4 (KTB)">
                    082-0-74742-4 (KTB)
                  </option>
                  <option value="146-2-90304-4 (SCB)">
                    146-2-90304-4 (SCB)
                  </option>
                </Form.Select>
              </Form.Group>

              <Form.Group as={Row} className="mb-3  w-100">
                <Form.Label>{t("transferDateLbl")}</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={transferedDate}
                  onChange={(e) => setTransferedDate(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3 w-100" controlId="statusSelect">
                <Form.Label>{t("StatusLbl", "Status")}</Form.Label>
                <Form.Select
                  className="w-100"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="accepted">{t("AcceptLbl", "Accepted")}</option>
                  <option value="rejected">{t("RejectLbl", "Rejected")}</option>
                </Form.Select>
              </Form.Group>

              {status === "accepted" && (
                <Form.Group
                  className="mb-3 w-100"
                  controlId="confirmedPriceInput"
                >
                  <Form.Label>
                    {t("ConfirmedPriceLbl", "Confirmed Price")}
                  </Form.Label>
                  <Form.Control
                    className="w-100"
                    type="number"
                    min="0"
                    step="0.01"
                    value={confirmedPrice}
                    onChange={(e) => setConfirmedPrice(e.target.value)}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3 w-100" controlId="confirmedReason">
                <Form.Label>
                  {t("ConfirmedreasonLbl", "Confirmed Reason")}
                </Form.Label>
                <Form.Control
                  className="w-100"
                  as="textarea"
                  rows={5}
                  value={confirmedReason}
                  onChange={(e) => setConfirmedReason(e.target.value)}
                />
              </Form.Group>

              <Form.Group as={Row} className="mb-3" controlId="slipUpload">
                <Form.Label>Slip Image</Form.Label>
                <Col>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={uploadPaymentSlipImageHandler}
                  />
                  {isImageUploading && <Loader />}
                </Col>
              </Form.Group>

              {slipImagePath && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Image
                    src={slipImagePath}
                    alt="Slip"
                    thumbnail
                    style={{
                      width: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                    }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={removeSlipImage}
                    style={{ position: "absolute", top: 8, right: 8 }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <Form.Group className="mb-2 w-100">
                <Form.Label>PCB Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="5"
                  value={formData.pcbQty}
                  onChange={(e) =>
                    handleChange(
                      "pcbQty",
                      Math.max(5, parseInt(e.target.value || 0, 10)),
                    )
                  }
                />
                <Button
                  type="submit"
                  className="w-100 mt-3"
                  disabled={isLoading || creating}
                >
                  {isLoading || creating ? "Submitting ..." : "SUBMIT"}
                </Button>
              </Form.Group>

              <div
                className="mt-3 text-center text-muted"
                style={{ fontSize: "0.9rem" }}
              >
                After submitting, please wait for admin to accept the order and
                confirm the price.
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default PCBAdminCreateCopyPCB;
