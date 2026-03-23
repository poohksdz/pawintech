import { Row, Col, Image, Card, ListGroup, Spinner } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useGetDefaultInvoiceDetailsQuery } from '../../slices/defaultInvoicesApiSlice';
import Message from '../../components/Message';

const DefaultInvoiceDetailScreen = () => {
  const { id } = useParams();  
  const { data, isLoading, error } = useGetDefaultInvoiceDetailsQuery(id); 

  if (isLoading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Message variant="danger">{error.data?.message || error.message}</Message>;

  return (
    <>
    <Link to='/admin/defaultinvoicelist' className='btn btn-light my-3' style={{color: '#303d4a'}}>
            Go Back
          </Link>
    <Row className="justify-content-center">

      <Col md={8}>
        <Card className="shadow-sm">
          <Card.Header className="text-center bg-primary text-white">
            <h4>Default Invoice Details</h4>
          </Card.Header>
          <Card.Body>
            <div className="text-center mb-3">
              {data.logo && <Image src={data.logo} alt="Company Logo" fluid style={{ maxHeight: '100px' }} />}
            </div>
            <ListGroup variant="flush">
              <ListGroup.Item><strong>Company Name:</strong> {data.company_name}</ListGroup.Item>
              <ListGroup.Item><strong>Company Name (Thai):</strong> {data.company_name_thai}</ListGroup.Item>
              <ListGroup.Item><strong>Head Office:</strong> {data.head_office}</ListGroup.Item>
              <ListGroup.Item><strong>Head Office (Thai):</strong> {data.head_office_thai}</ListGroup.Item>
              <ListGroup.Item><strong>Branch Name:</strong> {data.branch_name || '-'}</ListGroup.Item>
              <ListGroup.Item><strong>Tel:</strong> {data.tel}</ListGroup.Item>
              <ListGroup.Item><strong>Email:</strong> {data.email}</ListGroup.Item>
              <ListGroup.Item><strong>Tax ID:</strong> {data.tax_id}</ListGroup.Item>
              <ListGroup.Item><strong>Discount (%):</strong> {data.discount}</ListGroup.Item>
              <ListGroup.Item><strong>VAT (%):</strong> {data.vat}</ListGroup.Item>
              <ListGroup.Item><strong>Is Head Office:</strong> {data.is_head_office ? 'Yes' : 'No'}</ListGroup.Item>
              <ListGroup.Item><strong>Is Branch:</strong> {data.is_branch ? 'Yes' : 'No'}</ListGroup.Item>
              <ListGroup.Item><strong>Default Invoice:</strong> {data.set_default ? 'Yes' : 'No'}</ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
    </Row>
          </>
  );
};

export default DefaultInvoiceDetailScreen;
