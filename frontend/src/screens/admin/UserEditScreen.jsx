import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card, Container } from "react-bootstrap";
import {
  FaUserEdit,
  FaTruck,
  FaFileInvoiceDollar,
  FaSave,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from "../../slices/usersApiSlice";

const UserEditScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  const { id: userId } = useParams();

  // --- State ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Roles
  const [isStore, setIsStore] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isPCBAdmin, setIsPCBAdmin] = useState(false);

  // Shipping
  const [shippingname, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  // Billing
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [tax, setTax] = useState("");

  // Control
  const [isEditable, setIsEditable] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // API Calls
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useGetUserDetailsQuery(userId);
  const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();

  // Translations
  const t = {
    en: {
      title: "Edit User Profile",
      subtitle: "Update user information and permissions",
      account: "Account Details",
      roles: "Permissions & Roles",
      shipping: "Shipping Address",
      billing: "Billing Address",
      btn: {
        edit: "Edit Profile",
        save: "Save Changes",
        cancel: "Cancel",
        back: "Back to List",
      },
      lbl: { name: "Name", email: "Email", tax: "Tax ID" },
      addr: {
        name: "Recipient Name",
        addr: "Address",
        city: "City",
        country: "Country",
        phone: "Phone",
        zip: "Postal Code",
      },
      role: { store: "Store Manager", pcb: "PCB Admin", staff: "Staff" },
    },
    thai: {
      title: "แก้ไขข้อมูลผู้ใช้งาน",
      subtitle: "จัดการข้อมูลส่วนตัวและสิทธิ์การใช้งาน",
      account: "ข้อมูลบัญชี",
      roles: "สิทธิ์การใช้งาน",
      shipping: "ที่อยู่จัดส่งสินค้า",
      billing: "ที่อยู่สำหรับออกใบกำกับภาษี",
      btn: {
        edit: "แก้ไขข้อมูล",
        save: "บันทึกข้อมูล",
        cancel: "ยกเลิก",
        back: "ย้อนกลับ",
      },
      lbl: {
        name: "ชื่อ-นามสกุล",
        email: "อีเมล",
        tax: "เลขประจำตัวผู้เสียภาษี",
      },
      addr: {
        name: "ชื่อผู้รับ",
        addr: "ที่อยู่",
        city: "จังหวัด/อำเภอ",
        country: "ประเทศ",
        phone: "เบอร์โทรศัพท์",
        zip: "รหัสไปรษณีย์",
      },
      role: { store: "ผู้จัดการร้านค้า", pcb: "ผู้ดูแล PCB", staff: "พนักงาน" },
    },
  }[language || "en"];

  // Load Data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setIsStore(user.isStore || false);
      setIsStaff(user.isStaff || false);
      setIsPCBAdmin(user.isPCBAdmin || false);

      // Shipping
      setShippingName(user.shippingAddress?.shippingname || "");
      setShippingAddress(user.shippingAddress?.address || "");
      setShippingCity(user.shippingAddress?.city || "");
      setShippingCountry(user.shippingAddress?.country || "");
      setShippingPhone(user.shippingAddress?.phone || "");
      setShippingPostalCode(user.shippingAddress?.postalCode || "");

      // Billing
      setBillingName(user.billingAddress?.billingName || "");
      setBillingAddress(user.billingAddress?.billinggAddress || "");
      setBillingCity(user.billingAddress?.billingCity || "");
      setBillingCountry(user.billingAddress?.billingCountry || "");
      setBillingPhone(user.billingAddress?.billingPhone || "");
      setBillingPostalCode(user.billingAddress?.billingPostalCode || "");
      setTax(user.billingAddress?.tax || "");
    }
  }, [user]);

  // Handlers
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setIsModified(true);
  };

  const handleCancel = () => {
    setIsEditable(false);
    setIsModified(false);
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setIsStore(user.isStore || false);
      // ... reset logic handled by re-render or explicit sets if needed
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateUser({
        userId,
        updateData: {
          name,
          email,
          isStore,
          isStaff,
          isPCBAdmin,
          shippingAddress: {
            shippingname,
            address: shippingAddress,
            city: shippingCity,
            country: shippingCountry,
            phone: shippingPhone,
            postalCode: shippingPostalCode,
          },
          billingAddress: {
            billingName,
            billinggAddress: billingAddress,
            billingCity,
            billingCountry,
            billingPhone,
            billingPostalCode,
            tax,
          },
        },
      }).unwrap();
      toast.success("User updated successfully");
      setIsEditable(false);
      setIsModified(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <Container className="py-4 font-prompt">
      <Link
        to="/admin/userlist"
        className="btn btn-light mb-3 shadow-sm border text-decoration-none"
      >
        <FaArrowLeft className="me-2" /> {t.btn.back}
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-primary">
            <FaUserEdit className="me-2" /> {t.title}
          </h2>
          <p className="text-muted mb-0">{t.subtitle}</p>
        </div>
        <div>
          {isEditable ? (
            <>
              <Button
                variant="light"
                className="me-2 shadow-sm border"
                onClick={handleCancel}
              >
                <FaTimes className="me-2" /> {t.btn.cancel}
              </Button>
              <Button
                variant="success"
                className="shadow-sm"
                onClick={handleSubmit}
                disabled={!isModified}
              >
                <FaSave className="me-2" /> {t.btn.save}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="shadow-sm px-4"
              onClick={() => setIsEditable(true)}
            >
              <FaUserEdit className="me-2" /> {t.btn.edit}
            </Button>
          )}
        </div>
      </div>

      {loadingUpdate && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            {/* Left Column: Account & Roles */}
            <Col lg={4}>
              <Card className="shadow-sm border-0 rounded-4 mb-4 h-100">
                <Card.Header className="bg-white border-0 pt-4 pb-0">
                  <h5 className="fw-bold text-dark mb-0 border-start border-4 border-primary ps-2">
                    {t.account}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-bold">
                      {t.lbl.name}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      disabled={!isEditable}
                      onChange={handleInputChange(setName)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-bold">
                      {t.lbl.email}
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      disabled={!isEditable}
                      onChange={handleInputChange(setEmail)}
                    />
                  </Form.Group>

                  <hr className="my-4 text-muted opacity-25" />

                  <h5 className="fw-bold text-dark mb-3 border-start border-4 border-warning ps-2">
                    {t.roles}
                  </h5>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check
                      type="switch"
                      id="isStore"
                      label={t.role.store}
                      checked={isStore}
                      disabled={!isEditable}
                      onChange={(e) => {
                        setIsStore(e.target.checked);
                        setIsModified(true);
                      }}
                      className="mb-2"
                    />
                    {userInfo?.isAdmin && (
                      <Form.Check
                        type="switch"
                        id="isPCBAdmin"
                        label={t.role.pcb}
                        checked={isPCBAdmin}
                        disabled={!isEditable}
                        onChange={(e) => {
                          setIsPCBAdmin(e.target.checked);
                          setIsModified(true);
                        }}
                        className="mb-2"
                      />
                    )}
                    <Form.Check
                      type="switch"
                      id="isStaff"
                      label={t.role.staff}
                      checked={isStaff}
                      disabled={!isEditable}
                      onChange={(e) => {
                        setIsStaff(e.target.checked);
                        setIsModified(true);
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column: Addresses */}
            <Col lg={8}>
              {/* Shipping Address */}
              <Card className="shadow-sm border-0 rounded-4 mb-4">
                <Card.Header className="bg-white border-0 pt-4 pb-0">
                  <h5 className="fw-bold text-dark mb-0 border-start border-4 border-success ps-2">
                    <FaTruck className="me-2 text-success" />
                    {t.shipping}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.name}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={shippingname}
                          disabled={!isEditable}
                          onChange={handleInputChange(setShippingName)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.phone}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={shippingPhone}
                          disabled={!isEditable}
                          onChange={handleInputChange(setShippingPhone)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-bold">
                      {t.addr.addr}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={shippingAddress}
                      disabled={!isEditable}
                      onChange={handleInputChange(setShippingAddress)}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.city}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={shippingCity}
                          disabled={!isEditable}
                          onChange={handleInputChange(setShippingCity)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.country}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={shippingCountry}
                          disabled={!isEditable}
                          onChange={handleInputChange(setShippingCountry)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.zip}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={shippingPostalCode}
                          disabled={!isEditable}
                          onChange={handleInputChange(setShippingPostalCode)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Billing Address */}
              <Card className="shadow-sm border-0 rounded-4">
                <Card.Header className="bg-white border-0 pt-4 pb-0">
                  <h5 className="fw-bold text-dark mb-0 border-start border-4 border-info ps-2">
                    <FaFileInvoiceDollar className="me-2 text-info" />
                    {t.billing}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.name}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={billingName}
                          disabled={!isEditable}
                          onChange={handleInputChange(setBillingName)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.phone}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={billingPhone}
                          disabled={!isEditable}
                          onChange={handleInputChange(setBillingPhone)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-bold">
                      {t.addr.addr}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={billingAddress}
                      disabled={!isEditable}
                      onChange={handleInputChange(setBillingAddress)}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.city}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={billingCity}
                          disabled={!isEditable}
                          onChange={handleInputChange(setBillingCity)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.country}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={billingCountry}
                          disabled={!isEditable}
                          onChange={handleInputChange(setBillingCountry)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-bold">
                          {t.addr.zip}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={billingPostalCode}
                          disabled={!isEditable}
                          onChange={handleInputChange(setBillingPostalCode)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted fw-bold">
                      {t.lbl.tax}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={tax}
                      disabled={!isEditable}
                      onChange={handleInputChange(setTax)}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      )}

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .form-control:disabled { background-color: #f8f9fa; border: 1px dashed #ced4da; opacity: 0.7; }
        .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1); border-color: #86b7fe; }
      `}</style>
    </Container>
  );
};

export default UserEditScreen;
