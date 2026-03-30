import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import FormContainer from "../../components/FormContainer";
import { toast } from "react-toastify";
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from "../../slices/usersApiSlice";

const UserEditPCBAdminScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { id: userId } = useParams();

  // Removed unused updateUserID state

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useGetUserDetailsQuery(userId);

  const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();
  // Removed unused updateUserStaff mutation hook
  // Removed unused navigate hook

  // Control form editability & modification tracking
  const [isEditable, setIsEditable] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Toggle edit mode or submit update
  const handleToggleEdit = async () => {
    if (!isEditable) {
      setIsEditable(true);
      return;
    }

    if (!isModified) {
      // Cancel edit mode without saving
      setIsEditable(false);
      return;
    }

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
      });
      toast.success("User updated successfully");
      setIsEditable(false);
      setIsModified(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Load user data into form
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsStore(user.isStore);
      setIsStaff(user.isStaff);
      setIsPCBAdmin(user.isPCBAdmin);
      // setUpdateUserID(user._id); // Removed unused setter

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

  const { language } = useSelector((state) => state.language);

  // Translation object
  const translations = {
    en: {
      goBackLbl: "Go Back",
      editUserLbl: "Edit User",
      changeDataLbl: "Change Data",
      cancelLbl: "Cancel",
      nameLbl: "Name",
      enterNameLbl: "Enter Name",
      emailLbl: "Email Address",
      enterEmailLbl: "Enter Email Address",
      userRolesLbl: "User Roles",
      isStoreLbl: "Is Store",
      isStaffLbl: "Is Staff",
      isPCBAdminLbl: "Is PCB Admin",
      updateLbl: "Update",
      shippingSectionLbl: "Shipping Address",
      shippingNameLbl: "Shipping Name",
      shippingAddressLbl: "Address",
      shippingCityLbl: "City",
      shippingCountryLbl: "Country",
      shippingPhoneLbl: "Phone",
      shippingPostalCodeLbl: "Postal Code",
      billingSectionLbl: "Billing Address",
      billingNameLbl: "Billing Name",
      billingAddressLbl: "Address",
      billingCityLbl: "City",
      billingCountryLbl: "Country",
      billingPhoneLbl: "Phone",
      billingPostalCodeLbl: "Postal Code",
      tax: "Tax",
    },
    thai: {
      goBackLbl: "ย้อนกลับ",
      editUserLbl: "แก้ไขผู้ใช้",
      changeDataLbl: "เปลี่ยนข้อมูล",
      cancelLbl: "ยกเลิก",
      nameLbl: "ชื่อ",
      enterNameLbl: "กรอกชื่อ",
      emailLbl: "ที่อยู่อีเมล",
      enterEmailLbl: "กรอกที่อยู่อีเมล",
      isStoreLbl: "เป็นผู้ดูแลร้านค้า",
      isStaffLbl: "เป็นพนักงาน",
      isPCBAdminLbl: "เป็นผู้ดูแล PCB",
      userRolesLbl: "บทบาทผู้ใช้",
      updateLbl: "อัปเดต",
      shippingSectionLbl: "ที่อยู่จัดส่ง",
      shippingNameLbl: "ชื่อผู้รับ",
      shippingAddressLbl: "ที่อยู่",
      shippingCityLbl: "เมือง",
      shippingCountryLbl: "ประเทศ",
      shippingPhoneLbl: "เบอร์โทรศัพท์",
      shippingPostalCodeLbl: "รหัสไปรษณีย์",
      billingSectionLbl: "ที่อยู่ออกบิล",
      billingNameLbl: "ชื่อผู้เรียกเก็บเงิน",
      billingAddressLbl: "ที่อยู่",
      billingCityLbl: "เมือง",
      billingCountryLbl: "ประเทศ",
      billingPhoneLbl: "เบอร์โทรศัพท์",
      billingPostalCodeLbl: "รหัสไปรษณีย์",
      tax: "ภาษี",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <style>{`
        .user-edit-screen .form-control:disabled,
        .user-edit-screen .form-control[disabled] {
          background-color: #fff !important;
          opacity: 1 !important;
          color: #c4c4c4;
        }
      `}</style>
      <Link
        to="/useraddresslistcreateorder/set"
        className="btn btn-light my-3"
        style={{ color: "#303d4a" }}
      >
        {t.goBackLbl}
      </Link>

      <FormContainer>
        <div className="user-edit-screen">
          <h1>{t.editUserLbl}</h1>
          {loadingUpdate && <Loader />}
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Message variant="danger">
              {error?.data?.message || error.error}
            </Message>
          ) : (
            <Form>
              {/* Name */}
              <Form.Group className="my-2" controlId="name">
                <Form.Label>{t.nameLbl}</Form.Label>
                <Form.Control
                  type="name"
                  placeholder={t.enterNameLbl}
                  value={name}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>

              {/* Email */}
              <Form.Group className="my-2" controlId="email">
                <Form.Label>{t.emailLbl}</Form.Label>
                <Form.Control
                  type="email"
                  placeholder={t.enterEmailLbl}
                  value={email}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>

              {/* Roles */}
              <Form.Group className="my-3" controlId="userRoles">
                <div className="d-flex gap-4 flex-end">
                  <Form.Check
                    type="checkbox"
                    id="isStore"
                    label={t.isStoreLbl}
                    checked={isStore}
                    disabled={!isEditable}
                    onChange={(e) => {
                      const checked = e.target.checked ? 1 : 0;
                      setIsStore(checked);
                      setIsModified(true);
                      if (checked) {
                        setIsStaff(0);
                        setIsPCBAdmin(0);
                      }
                    }}
                  />

                  {/* Fixed Strict Equality Check (===) */}
                  {userInfo.isAdmin === 1 && (
                    <Form.Check
                      type="checkbox"
                      id="isPCBAdmin"
                      label={t.isPCBAdminLbl}
                      checked={isPCBAdmin}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const checked = e.target.checked ? 1 : 0;
                        setIsPCBAdmin(checked);
                        setIsModified(true);
                        if (checked) {
                          setIsStaff(0);
                          setIsStore(0);
                        }
                      }}
                    />
                  )}

                  <Form.Check
                    type="checkbox"
                    id="isStaff"
                    label={t.isStaffLbl}
                    checked={isStaff}
                    disabled={!isEditable}
                    onChange={(e) => {
                      const checked = e.target.checked ? 1 : 0;
                      setIsStaff(checked);
                      setIsModified(true);
                      if (checked) {
                        setIsStore(0);
                        setIsPCBAdmin(0);
                      }
                    }}
                  />
                </div>
              </Form.Group>

              <hr />
              <h5>{t.shippingSectionLbl}</h5>

              {/* Shipping Fields */}
              <Form.Group className="my-2" controlId="shippingname">
                <Form.Label>{t.shippingNameLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingname}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingName(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="shippingAddress">
                <Form.Label>{t.shippingAddressLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingAddress}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="shippingCity">
                <Form.Label>{t.shippingCityLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingCity}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingCity(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="shippingCountry">
                <Form.Label>{t.shippingCountryLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingCountry}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingCountry(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="shippingPhone">
                <Form.Label>{t.shippingPhoneLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingPhone}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingPhone(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="shippingPostalCode">
                <Form.Label>{t.shippingPostalCodeLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={shippingPostalCode}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setShippingPostalCode(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>

              <hr />
              <h5>{t.billingSectionLbl}</h5>

              {/* Billing Fields */}
              <Form.Group className="my-2" controlId="billingName">
                <Form.Label>{t.billingNameLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingName}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingName(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="billingAddress">
                <Form.Label>{t.billingAddressLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingAddress}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingAddress(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="billingCity">
                <Form.Label>{t.billingCityLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingCity}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingCity(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="billingCountry">
                <Form.Label>{t.billingCountryLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingCountry}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingCountry(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="billingPhone">
                <Form.Label>{t.billingPhoneLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingPhone}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingPhone(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2" controlId="billingPostalCode">
                <Form.Label>{t.billingPostalCodeLbl}</Form.Label>
                <Form.Control
                  type="text"
                  value={billingPostalCode}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setBillingPostalCode(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>
              <Form.Group className="my-2 mb-3" controlId="tax">
                <Form.Label>{t.tax}</Form.Label>
                <Form.Control
                  type="text"
                  value={tax}
                  disabled={!isEditable}
                  onChange={(e) => {
                    setTax(e.target.value);
                    setIsModified(true);
                  }}
                />
              </Form.Group>

              {/* Toggle Edit / Update / Cancel Button */}
              <Button
                type="button"
                variant="primary"
                onClick={handleToggleEdit}
              >
                {!isEditable
                  ? t.changeDataLbl || "Change Data"
                  : isModified
                    ? t.updateLbl || "Update"
                    : t.cancelLbl || "Cancel"}
              </Button>
            </Form>
          )}
        </div>
      </FormContainer>
    </>
  );
};

export default UserEditPCBAdminScreen;
