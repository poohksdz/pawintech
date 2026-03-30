import { useState } from "react";
import { Row, Col, Form, Button, Card, Spinner, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  useCreateDefaultInvoiceMutation,
  useUploadDefaultInvoiceImageMutation,
} from "../../slices/defaultInvoicesApiSlice";
import { toast } from "react-toastify";
import Message from "../../components/Message";

const DefaultInvoiceCreateScreen = () => {
  const navigate = useNavigate();
  const [createDefaultInvoice, { isLoading, error }] =
    useCreateDefaultInvoiceMutation();
  const [uploadDefaultInvoiceImage] = useUploadDefaultInvoiceImageMutation();

  const [companyName, setCompanyName] = useState("");
  const [companyNameThai, setCompanyNameThai] = useState("");
  const [headOffice, setHeadOffice] = useState("");
  const [headOfficeThai, setHeadOfficeThai] = useState("");
  const [branchName, setBranchName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [isBranch, setIsBranch] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [logo, setLogo] = useState(""); // uploaded logo URL

  //   // File upload handler
  //   const handleFileChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   setUploading(true);
  //   const formData = new FormData();
  //   formData.append('image', file);

  //   try {
  //     const res = await uploadDefaultInvoiceImage(formData).unwrap();
  //     setLogo(res.image || res.url); // <- set logo state here
  //     toast.success(res.message || 'Logo uploaded successfully!');
  //   } catch (err) {
  //     toast.error(err?.data?.message || 'Failed to upload logo');
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await uploadDefaultInvoiceImage(formData).unwrap();
      // Prepend 'images/' if your backend saves files there
      const uploadedLogo = res.image.startsWith("http")
        ? res.image
        : `/images/${res.image}`;
      setLogo(uploadedLogo);
      toast.success(res.message || "Logo uploaded successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!logo) {
      toast.error("Please upload a logo first");
      return;
    }

    try {
      await createDefaultInvoice({
        logo,
        company_name: companyName,
        company_name_thai: companyNameThai,
        head_office: headOffice,
        head_office_thai: headOfficeThai,
        branch_name: branchName,
        tel,
        email,
        tax_id: taxId,
        discount,
        vat,
        is_head_office: isHeadOffice ? 1 : 0,
        is_branch: isBranch ? 1 : 0,
      }).unwrap();

      toast.success("Default invoice created successfully!");
      navigate("/admin/defaultinvoicelist");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to create invoice");
    }
  };

  return (
    <>
      <Link to="/admin/defaultinvoicelist" className="btn btn-light my-3">
        Go Back
      </Link>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="text-center bg-primary text-white">
              <h4 className="pt-3">Create New Default Invoice</h4>
            </Card.Header>
            <Card.Body>
              {isLoading && (
                <Spinner animation="border" className="d-block mx-auto mb-3" />
              )}
              {error && (
                <Message variant="danger">
                  {error.data?.message || error.message}
                </Message>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="logo" className="mb-2">
                  <Form.Label>Company Logo</Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} />
                  {uploading && (
                    <Spinner animation="border" size="sm" className="mt-2" />
                  )}
                  {logo && (
                    <Image
                      src={logo}
                      alt="Logo Preview"
                      fluid
                      style={{ maxHeight: "100px" }}
                      className="mt-2"
                    />
                  )}
                </Form.Group>

                <Form.Group controlId="companyName" className="mb-2">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="companyNameThai" className="mb-2">
                  <Form.Label>Company Name (Thai)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Thai name"
                    value={companyNameThai}
                    onChange={(e) => setCompanyNameThai(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="headOffice" className="mb-2">
                  <Form.Label>Head Office</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter head office"
                    value={headOffice}
                    onChange={(e) => setHeadOffice(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="headOfficeThai" className="mb-2">
                  <Form.Label>Head Office (Thai)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter head office Thai"
                    value={headOfficeThai}
                    onChange={(e) => setHeadOfficeThai(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="branchName" className="mb-2">
                  <Form.Label>Branch Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter branch name"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="tel" className="mb-2">
                  <Form.Label>Tel</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter telephone"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="email" className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="taxId" className="mb-2">
                  <Form.Label>Tax ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter tax ID"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="discount" className="mb-2">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="vat" className="mb-2">
                  <Form.Label>VAT (%)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter VAT"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Is Head Office"
                    checked={isHeadOffice}
                    onChange={(e) => setIsHeadOffice(e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Is Branch"
                    checked={isBranch}
                    onChange={(e) => setIsBranch(e.target.checked)}
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100">
                  Create Default Invoice
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DefaultInvoiceCreateScreen;
