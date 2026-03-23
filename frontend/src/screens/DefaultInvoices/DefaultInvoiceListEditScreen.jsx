import { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import {
  useGetDefaultInvoicesQuery,
  useDeleteDefaultInvoiceMutation,
  useUpdateUseingDefaultInvoiceMutation
} from '../../slices/defaultInvoicesApiSlice';
import { toast } from 'react-toastify';

const DefaultInvoiceListEditScreen = () => {
  const { pageNumber } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [pendingDefaultId, setPendingDefaultId] = useState(null);

  const [selectedInvoices, setSelectedInvoices] = useState({});

  const { data, isLoading, error, refetch } = useGetDefaultInvoicesQuery({ pageNumber });
  const [deleteDefaultInvoice, { isLoading: loadingDelete }] = useDeleteDefaultInvoiceMutation();
  const [updateUseingDefaultInvoice] = useUpdateUseingDefaultInvoiceMutation();


  // Initialize selectedInvoices from data
  useEffect(() => {
    if (data) {
      const initialSelected = {};
      data.invoices.forEach(inv => {
        initialSelected[inv.id] = inv.set_default === 1 ? 1 : 0;
      });
      setSelectedInvoices(initialSelected);
    }
  }, [data]);

  // Delete handlers
  const handleDeleteClick = (id) => {
    setInvoiceToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDefaultInvoice(invoiceToDelete).unwrap();
      setShowDeleteModal(false);
      refetch();
      toast.success('Invoice deleted successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleCancelDelete = () => setShowDeleteModal(false);

  // Checkbox click handler (prepares modal if changing default)
  const handleCheckboxChange = (invoiceId) => {
    if (selectedInvoices[invoiceId]) {
      // Unchecking current default
      setSelectedInvoices(prev => ({ ...prev, [invoiceId]: 0 }));
      updateUseingDefaultInvoice({ defaultInvoiceId: invoiceId, set_default: 0 });
    } else {
      // Trying to set a new default
      setPendingDefaultId(invoiceId);
      setShowDefaultModal(true);
    }
  };

  // Confirm default change
  const handleConfirmDefaultChange = async () => {
    try {
      // Unset all previous defaults
      const unsetPromises = Object.keys(selectedInvoices)
        .filter(id => selectedInvoices[id] === 1)
        .map(id => updateUseingDefaultInvoice({ defaultInvoiceId: id, set_default: 0 }));

      await Promise.all(unsetPromises);

      // Set the new default
      await updateUseingDefaultInvoice({ defaultInvoiceId: pendingDefaultId, set_default: 1 });

      // Update local state
      const newSelected = {};
      Object.keys(selectedInvoices).forEach(id => {
        newSelected[id] = id === pendingDefaultId ? 1 : 0;
      });
      setSelectedInvoices(newSelected);
      setShowDefaultModal(false);
      setPendingDefaultId(null);

      toast.success('Default invoice updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update default');
    }
  };

  const handleCancelDefaultChange = () => {
    setPendingDefaultId(null);
    setShowDefaultModal(false);
  };

  return (
    <>
      <Row className="align-items-center">
        <Col><h1>Default Invoices</h1></Col>
        <Col className="text-end">
          <Button as={Link} to="/admin/defaultinvoiceset" className="my-3">
            <FaPlus /> Create Default Invoice
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}
      {isLoading ? <Loader /> : error ? (
        <Message variant="danger">{error.data?.message || error.message}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr className="text-center align-middle" >
                <th>#</th>
                <th>Logo</th>
                <th>Company Name</th>
                <th>Company Name Thai</th>
                <th>Head Office</th>
                <th>Head Office Thai</th>
                <th>Detail</th>
                <th>Edit / Delete</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv, index) => (
                <tr key={inv.id}  className="text-center align-middle">
                  <td>{index + 1}</td>
                  <td>{inv.logo && <img src={inv.logo} alt="logo" width={50} />}</td>
                  <td>{inv.company_name}</td>
                  <td>{inv.company_name_thai}</td>
                  <td>{inv.head_office}</td>
                  <td>{inv.head_office_thai}</td>
                  <td>
                    <Button as={Link} to={`/admin/defaultinvoicelist/${inv.id}`} variant="info" className="btn-sm mx-1 text-white">
                      More
                    </Button> 
                  </td>
                  <td>
                    <Button as={Link} to={`/admin/defaultinvoicelist/${inv.id}/edit`} variant="light" className="btn-sm mx-1">
                      <FaEdit />
                    </Button>
                    <Button variant="danger" className="btn-sm" onClick={() => handleDeleteClick(inv.id)}>
                      <FaTrash style={{ color: 'white' }} />
                    </Button>
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={!!selectedInvoices[inv.id]}
                      onChange={() => handleCheckboxChange(inv.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Paginate pages={data.pages} page={data.page} isAdmin={true} />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete} >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this invoice?</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCancelDelete}>Cancel</Button>
          <Button variant="danger" className="text-white" onClick={handleConfirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Default Change Confirmation Modal */}
      <Modal show={showDefaultModal} onHide={handleCancelDefaultChange} >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Default Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to set this invoice as the default?</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCancelDefaultChange}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmDefaultChange}>Yes, Set Default</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DefaultInvoiceListEditScreen;
