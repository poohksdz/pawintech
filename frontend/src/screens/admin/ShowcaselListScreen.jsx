import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Row,
  Col,
  Image,
  Card,
  Modal,
  Form,
} from "react-bootstrap";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { Link, useParams } from "react-router-dom";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import Paginate from "../../components/Paginate";
import ConfirmModle from "../../components/ConfirmModle";
import {
  useGetShowcasesQuery,
  useDeleteShowcaseMutation,
  useUpdateOrderPresentShowcaseMutation,
} from "../../slices/showcasesApiSlice";
import { toast } from "react-toastify";

const ShowcaselListScreen = () => {
  const { pageNumber } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [showcaseToDelete, setShowcaseToDelete] = useState(null);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [selectedPresent, setSelectedPresent] = useState("");

  const { data, isLoading, error, refetch } = useGetShowcasesQuery({
    pageNumber,
  });

  const [deleteShowcase, { isLoading: loadingDelete }] =
    useDeleteShowcaseMutation();

  const [updateOrderPresentShowcase] = useUpdateOrderPresentShowcaseMutation();

  const deleteHandler = (id) => {
    setShowcaseToDelete(id); // Store the Showcase ID to delete
    setShowModal(true); // Show the confirmation modal
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteShowcase(showcaseToDelete);
      refetch();
      setShowModal(false);
      toast.success("Showcase deleted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  // Removed unused createShowcaseMutation and handler

  useEffect(() => {
    // Refetch products when pageNumber changes
    refetch();
  }, [pageNumber, refetch]);

  const { language } = useSelector((state) => state.language);

  // Define translation object
  const translations = {
    en: {
      showcasesLbl: "Showcases",
      createShowcaseLbl: "Create Showcase",
      imageLbl: "Image",
      nameLbl: "Name",
      nameThaiLbl: "Name in Thai",
      presentLbl: "Present Cases",
    },
    thai: {
      showcasesLbl: "โชว์เคส",
      createShowcaseLbl: "สร้างโชว์เคส",
      imageLbl: "รูปภาพ",
      nameLbl: "ชื่อ",
      nameThaiLbl: "ชื่อภาษาไทย",
      presentLbl: "แสดง เคส",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.showcasesLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" as={Link} to={`/admin/showcase/create`}>
            <FaPlus /> {t.createShowcaseLbl}
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error.data.message}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm">
            <thead
              style={{
                fontSize: "25px",
                height: "70px",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              <tr>
                <th>#</th>
                <th>{t.imageLbl}</th>
                <th>{t.nameLbl}</th>
                <th>{t.nameThaiLbl}</th>
                <th>{t.presentLbl}</th>
                <th></th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "20px", textAlign: "center" }}>
              {data.map((showcase, index) => {
                const name =
                  language === "thai" ? showcase.nameThai : showcase.name;
                return (
                  <tr key={showcase._id}>
                    <td style={{ width: "50px", height: "100px" }}>
                      {index + 1}
                    </td>
                    <td style={{ width: "150px", height: "100px" }}>
                      <Card>
                        <Image
                          src={showcase.image}
                          alt={name}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                          fluid
                        />
                      </Card>
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <div> {showcase.name}</div>
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <div> {showcase.nameThai}</div>
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <div>
                        {showcase.present}{" "}
                        {showcase.displayOrder !== 0 &&
                          `(${showcase.displayOrder})`}
                        <Button
                          variant="primary"
                          className="btn-md mx-3"
                          onClick={() => {
                            setSelectedShowcase(showcase);
                            setNewDisplayOrder(showcase.displayOrder || 0); // current order
                            setSelectedPresent(showcase.present || ""); // set current present
                            setShowOrderModal(true);
                          }}
                        >
                          <IoSettingsOutline style={{ color: "white" }} />
                        </Button>
                      </div>
                    </td>
                    <td
                      style={{
                        width: "300px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      <Button
                        as={Link}
                        to={`/admin/showcase/${showcase._id}/edit`}
                        variant="info"
                        className="btn-md mx-3"
                      >
                        <FaEdit style={{ color: "white" }} />
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-md  mx-3"
                        onClick={() => deleteHandler(showcase._id)}
                      >
                        <FaTrash style={{ color: "white" }} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Paginate pages={data.pages} page={data.page} isAdmin={true} />
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {showOrderModal && (
        <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Display Order & Present</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Display Order (0-50)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={50}
                value={newDisplayOrder}
                onChange={(e) => setNewDisplayOrder(parseInt(e.target.value))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t.presentLbl}</Form.Label>
              <Form.Select
                value={selectedPresent}
                onChange={(e) => setSelectedPresent(e.target.value)}
              >
                <option value="">Null</option>
                <option value="presentOne">Present One พรีเซนต์หนึ่ง</option>
                <option value="presentTwo">Present Two พรีเซนต์สอง</option>
                <option value="presentThree">Present Three พรีเซนต์สาม</option>
                <option value="presentFour">Present Four พรีเซนต์สี่</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowOrderModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await updateOrderPresentShowcase({
                    showcaseId: selectedShowcase._id,
                    displayOrder: newDisplayOrder,
                    present: selectedPresent || null,
                  });
                  setShowOrderModal(false);
                  refetch();
                  toast.success("Showcase updated!");
                } catch (err) {
                  toast.error(err?.data?.message || err.error);
                }
              }}
            >
              Update
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default ShowcaselListScreen;
