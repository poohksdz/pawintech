import { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Spinner, Image } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useUpdateDefaultInvoiceMutation,
  useUploadDefaultInvoiceImageMutation,
  useGetDefaultInvoiceDetailsQuery
} from '../../slices/defaultInvoicesApiSlice';
import { toast } from 'react-toastify';
import Message from '../../components/Message';

const DefaultInvoiceEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, refetch, isLoading: loadingInvoice, error: errorInvoice } = useGetDefaultInvoiceDetailsQuery(id);
  const [updateDefaultInvoice, { isLoading: loadingUpdate, error: errorUpdate }] = useUpdateDefaultInvoiceMutation();
  const [uploadDefaultInvoiceImage] = useUploadDefaultInvoiceImageMutation();

  const [companyName, setCompanyName] = useState('');
  const [companyNameThai, setCompanyNameThai] = useState('');
  const [headOffice, setHeadOffice] = useState('');
  const [headOfficeThai, setHeadOfficeThai] = useState('');
  const [branchName, setBranchName] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [discount, setDiscount] = useState('');
  const [vat, setVat] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [isBranch, setIsBranch] = useState(false);
  const [logo, setLogo] = useState('');
  const [uploading, setUploading] = useState(false);

  // Prefill form when invoice data loads
  useEffect(() => {
    if (data) {
      setCompanyName(data.company_name);
      setCompanyNameThai(data.company_name_thai);
      setHeadOffice(data.head_office);
      setHeadOfficeThai(data.head_office_thai);
      setBranchName(data.branch_name);
      setTel(data.tel);
      setEmail(data.email);
      setTaxId(data.tax_id);
      setDiscount(data.discount);
      setVat(data.vat);
      setIsHeadOffice(data.is_head_office === 1);
      setIsBranch(data.is_branch === 1);
      setLogo(data.logo);
    }
  }, [data]);

  // // File upload handler
  // const handleFileChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   setUploading(true);
  //   const formData = new FormData();
  //   formData.append('image', file);

  //   try {
  //     const res = await uploadDefaultInvoiceImage(formData).unwrap();
  //     setLogo(res.image || res.url);
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
  formData.append('image', file);

  try {
    const res = await uploadDefaultInvoiceImage(formData).unwrap();
    // Prepend 'images/' if your backend saves files there
    const uploadedLogo = res.image.startsWith('http') ? res.image : `/images/${res.image}`;
    setLogo(uploadedLogo);
    toast.success(res.message || 'Logo uploaded successfully!');
  } catch (err) {
    toast.error(err?.data?.message || 'Failed to upload logo');
  } finally {
    setUploading(false);
  }
};

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!logo) {
      toast.error('Please upload a logo first');
      return;
    }

    try {
      await updateDefaultInvoice({
        id,
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

    refetch();
      toast.success('Default invoice updated successfully!');
      navigate('/admin/defaultinvoicelist');
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to update invoice');
    }
  };

  if (loadingInvoice) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (errorInvoice) return <Message variant="danger">{errorInvoice.data?.message || errorInvoice.message}</Message>;

  return (
    <>
      <Link to="/admin/defaultinvoicelist" className="btn btn-light my-3">
        Go Back
      </Link>

      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="text-center bg-primary text-white">
              <h4 className="pt-3">Edit Default Invoice</h4>
            </Card.Header>
            <Card.Body>
              {loadingUpdate && <Spinner animation="border" className="d-block mx-auto mb-3" />}
              {errorUpdate && <Message variant="danger">{errorUpdate.data?.message || errorUpdate.message}</Message>}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="logo" className="mb-2">
                  <Form.Label>Company Logo</Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} />
                  {uploading && <Spinner animation="border" size="sm" className="mt-2" />}
                  {logo && (
                    <Image
                      src={logo} // now points to correct path
                      alt="Logo Preview"
                      fluid
                      style={{ maxHeight: '100px' }}
                      className="mt-2"
                    />
                  )} 
                </Form.Group>

                <Form.Group controlId="companyName" className="mb-2">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </Form.Group>

                <Form.Group controlId="companyNameThai" className="mb-2">
                  <Form.Label>Company Name (Thai)</Form.Label>
                  <Form.Control type="text" value={companyNameThai} onChange={(e) => setCompanyNameThai(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="headOffice" className="mb-2">
                  <Form.Label>Head Office</Form.Label>
                  <Form.Control type="text" value={headOffice} onChange={(e) => setHeadOffice(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="headOfficeThai" className="mb-2">
                  <Form.Label>Head Office (Thai)</Form.Label>
                  <Form.Control type="text" value={headOfficeThai} onChange={(e) => setHeadOfficeThai(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="branchName" className="mb-2">
                  <Form.Label>Branch Name</Form.Label>
                  <Form.Control type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="tel" className="mb-2">
                  <Form.Label>Tel</Form.Label>
                  <Form.Control type="text" value={tel} onChange={(e) => setTel(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="email" className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="taxId" className="mb-2">
                  <Form.Label>Tax ID</Form.Label>
                  <Form.Control type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="discount" className="mb-2">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </Form.Group>

                <Form.Group controlId="vat" className="mb-2">
                  <Form.Label>VAT (%)</Form.Label>
                  <Form.Control type="number" value={vat} onChange={(e) => setVat(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Is Head Office" checked={isHeadOffice} onChange={(e) => setIsHeadOffice(e.target.checked)} />
                  <Form.Check type="checkbox" label="Is Branch" checked={isBranch} onChange={(e) => setIsBranch(e.target.checked)} />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100">
                  Update Default Invoice
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DefaultInvoiceEditScreen;
