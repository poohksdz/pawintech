import React, { useState, useEffect } from 'react'
import { Row, Col, Container, Image, Modal, Card, ListGroup, Spinner } from 'react-bootstrap'
import { useGetDefaultQuotationDetailsQuery } from '../../slices/quotationDefaultApiSlice'
import { useParams, Link } from 'react-router-dom'

const QuotationDefaultDetailScreen = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useGetDefaultQuotationDetailsQuery(id)

  const [modalShow, setModalShow] = useState(false)
  const [modalImage, setModalImage] = useState(null)

  const handlePreviewClick = (src) => {
    setModalImage(src)
    setModalShow(true)
  }

  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    )
  }

  if (error) {
    return <div className="text-danger text-center my-5">Failed to load quotation details.</div>
  }

  if (!data || !data.quotation) {
    return <div className="text-center my-5">No quotation found.</div>
  }

  const q = data.quotation

  return (
    <>
          <Link to='/admin/defaultquotations' className='btn btn-light my-3'>
            Go Back
          </Link>
    <Container className="my-3">
      <h2 className="mb-4">Quotation Details</h2>

      <Row className="mb-4">
        <Col md={9}>
          <Card>
            <Card.Header className='py-4'>
              <strong>Company Info</strong>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><strong>Company Name (EN):</strong> {q.company_name}</ListGroup.Item>
              <ListGroup.Item><strong>Company Name (TH):</strong> {q.company_name_thai}</ListGroup.Item>
              <ListGroup.Item><strong>Head Office (EN):</strong> {q.head_office}</ListGroup.Item>
              <ListGroup.Item><strong>Head Office (TH):</strong> {q.head_office_thai}</ListGroup.Item>
              <ListGroup.Item><strong>Tel:</strong> {q.tel}</ListGroup.Item>
              <ListGroup.Item><strong>Email:</strong> {q.email}</ListGroup.Item>
              <ListGroup.Item><strong>Tax ID:</strong> {q.tax_id}</ListGroup.Item>
              <ListGroup.Item><strong>Discount:</strong> {q.discount}%</ListGroup.Item>
              <ListGroup.Item><strong>VAT:</strong> {q.vat}%</ListGroup.Item>
              <ListGroup.Item><strong>Branch:</strong> {q.branch_name}</ListGroup.Item>
              <ListGroup.Item><strong>Bank Account Name:</strong> {q.bank_account_name || '-'}</ListGroup.Item>
              <ListGroup.Item><strong>Bank Account Number:</strong> {q.bank_account_number || '-'}</ListGroup.Item>
              <ListGroup.Item><strong>Deposit:</strong> {q.deposit ? `${q.deposit} %` : '-'}</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
 
        <Col md={3}  className="justify-content-center">
          <Card className="mx-auto">
              <Card.Header className="text-center py-4">
              <strong>Images</strong>
            </Card.Header> 
            <ListGroup variant="flush">
              {q.logo && (
                <ListGroup.Item className="text-center">
                  <strong>Company Logo:</strong><br />
                  <Image
                    src={q.logo}
                    thumbnail
                    style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                    onClick={() => handlePreviewClick(q.logo)}
                  />
                </ListGroup.Item>
              )}
              {q.buyer_approves && (
                <ListGroup.Item className="text-center">
                  <strong>Buyer Approves:</strong><br />
                  <Image
                    src={q.buyer_approves}
                    thumbnail
                    style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                    onClick={() => handlePreviewClick(q.buyer_approves)}
                  />
                </ListGroup.Item>
              )}
              {q.sales_person && (
                <ListGroup.Item className="text-center">
                  <strong>Sales Person:</strong><br />
                  <Image
                    src={q.sales_person}
                    thumbnail
                    style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                    onClick={() => handlePreviewClick(q.sales_person)}
                  />
                </ListGroup.Item>
              )}
              {q.sales_manager && (
                <ListGroup.Item className="text-center">
                  <strong>Sales Manager:</strong><br />
                  <Image
                    src={q.sales_manager}
                    thumbnail
                    style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                    onClick={() => handlePreviewClick(q.sales_manager)}
                  />
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col> 
      </Row>

      {/* Modal for zoom */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} size="lg" centered>
        <Modal.Body className="text-center">
          <Image src={modalImage} fluid />
        </Modal.Body>
      </Modal>
    </Container>
    </>
  )
} 

export default QuotationDefaultDetailScreen