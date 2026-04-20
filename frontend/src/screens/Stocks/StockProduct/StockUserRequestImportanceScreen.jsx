import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Modal,
  Form,
  Col,
  Row,
  InputGroup,
  Badge,
} from "react-bootstrap"; // ลบ Card ออกแล้ว
import { FaSearch, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import {
  useGetStockRequestImportanceQuery,
  useUpdateStockRequestCancelMutation,
} from "../../../slices/stockRequestApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { toast } from "react-toastify";

const StockUserRequestImportanceScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error } = useGetStockRequestImportanceQuery();
  const [updateStockRequestCancel] = useUpdateStockRequestCancelMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const products = useMemo(() => data?.requestimportances || [], [data]);

  useEffect(() => {
    let filtered = [...products];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.electotronixPN?.toLowerCase().includes(query) ||
          item.manufacturePN?.toLowerCase().includes(query) ||
          item.value?.toLowerCase().includes(query),
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedProductForCancel, setSelectedProductForCancel] =
    useState(null);
  const [cancelMessage, setCancelMessage] = useState("");

  const openCancelModal = (product) => {
    setSelectedProductForCancel(product);
    setCancelMessage("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedProductForCancel || !cancelMessage.trim()) {
      toast.error("Please fill in a reason for cancellation!");
      return;
    }
    try {
      await updateStockRequestCancel({
        id: selectedProductForCancel.ID,
        cancel_message: cancelMessage,
        updateCancelBy: userInfo.name,
        canceledUserId: userInfo._id,
      }).unwrap();
      toast.success("Cancel status updated");
      setShowCancelModal(false);
    } catch (err) {
      toast.error("Failed to update cancel status");
    }
  };

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const openDetailModal = (product) => {
    setSelectedDetailItem(product);
    setShowDetailModal(true);
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  return (
    <>
      <Row className="align-items-center justify-content-between mb-3 mt-3">
        <Col md="6">
          <h3>All Requested Importance</h3>
        </Col>
        <Col md="4">
          <InputGroup>
            <Form.Control
              placeholder="Search P/N, Value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="primary">
              <FaSearch />
            </Button>
          </InputGroup>
        </Col>
      </Row>

      <div style={{ height: "65vh", overflow: "auto" }}>
        <Table striped bordered hover className="table-sm align-middle">
          <thead className="bg-light sticky-top">
            <tr className="text-center">
              <th>#</th>
              <th>Image</th>
              <th>Part Info</th>
              <th>Quantities</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, index) => (
              <tr key={p.ID}>
                <td className="text-center">{index + 1}</td>
                <td className="text-center">
                  {p.img ? (
                    <img
                      src={p.img}
                      width="40"
                      alt="p"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <div className="fw-bold text-primary">{p.electotronixPN}</div>
                  <div className="small text-muted">Value: {p.value}</div>
                </td>
                <td className="text-center">
                  <Badge bg="primary">Req: {p.requestqty}</Badge>
                </td>
                <td className="text-center">
                  {p.process ? <Badge bg="info">{p.process}</Badge> : "-"}
                </td>
                <td className="text-center">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-1"
                    onClick={() => openDetailModal(p)}
                  >
                    <FaInfoCircle />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => openCancelModal(p)}
                  >
                    <FaTimesCircle />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDetailItem && (
            <Row>
              <Col md={6}>
                <strong>P/N:</strong> {selectedDetailItem.electotronixPN}
              </Col>
              <Col md={6}>
                <strong>Category:</strong> {selectedDetailItem.category}
              </Col>
              <Col md={6} className="mt-2">
                <strong>Manufacturer:</strong> {selectedDetailItem.manufacture}
              </Col>
              <Col md={12} className="mt-3">
                <strong>Description:</strong>{" "}
                <p>{selectedDetailItem.description || "-"}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="fw-bold">Reason for Cancellation</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
              placeholder="Reason..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StockUserRequestImportanceScreen;
