import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  DropdownButton,
  Dropdown,
  InputGroup,
  Form,
} from "react-bootstrap";
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Message from "../../components/Message";
import Loader from "../../components/Loader";
import ConfirmModle from "../../components/ConfirmModle";

import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from "../../slices/usersApiSlice";

const UserAddressListCreateOrderScreen = () => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading, error, refetch } = useGetUsersQuery();

  const [deleteUser] = useDeleteUserMutation();

  // ---------------- DELETE ----------------
  const deleteHandler = (id) => {
    setUserToDelete(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete).unwrap();
      toast.success("User deleted successfully");
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  // ---------------- CREATE ORDER ----------------
  const handleSetOrder = ({ type, user }) => {
    const routes = {
      PRODUCT: "/createproductorder/set",
      "GERBER PCB": "/createorderpcb/set",
      "CUSTOM PCB": "/createcustomerpcb/set",
      "COPY PCB": "/createcopypcb/set",
      "ASSEMBLY PCB": "/createassemblypcb/set",
    };

    const path = routes[type];
    if (path) {
      navigate(path, { state: { user } });
    }
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ---------------- FILTER ----------------
  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email} ${u.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  // ---------------- RENDER ----------------
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          {/* HEADER */}
          <Row className="align-items-center mb-2 justify-content-between">
            {/* LEFT */}
            <Col md="6">
              <h1 className="mb-0">User Address List</h1>
            </Col>

            {/* RIGHT */}
            <Col
              md="6"
              className="d-flex justify-content-end align-items-center gap-2"
            >
              <Button
                className="text-white text-nowrap"
                variant="primary"
                onClick={() => navigate("/createnewuser/set")}
              >
                Create New User
              </Button>

              <InputGroup style={{ maxWidth: "280px" }}>
                <Form.Control
                  placeholder="Search name / email / phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
          </Row>

          <div style={{ height: "80vh", overflow: "auto" }}>
            <Table striped bordered hover size="sm" className="mb-0 table-wrap">
              {/* HEADER */}
              <thead
                className="text-nowrap position-sticky top-0"
                style={{ backgroundColor: "#33414f", color: "#fff", zIndex: 5 }}
              >
                <tr>
                  <th>#</th>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Email</th>

                  <th>Ship Name</th>
                  <th>Ship Address</th>
                  <th>Ship City</th>
                  <th>Ship Country</th>
                  <th>Ship Postal</th>
                  <th>Ship Phone</th>

                  <th>Bill Name</th>
                  <th>Bill Address</th>
                  <th>Bill City</th>
                  <th>Bill Country</th>
                  <th>Bill Postal</th>
                  <th>Bill Phone</th>
                  <th>Bill Tax</th>

                  <th>Action</th>
                </tr>
              </thead>

              {/* BODY (TEXT WRAP) */}
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td className="px-3 text-nowrap">{index + 1}</td>

                    <td className="px-1text-nowrap">
                      <DropdownButton
                        size="sm"
                        variant="primary"
                        title="Create Order"
                        onSelect={(type) => handleSetOrder({ type, user })}
                      >
                        <Dropdown.Item eventKey="PRODUCT">
                          Product Order
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="GERBER PCB">
                          Gerber PCB
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="CUSTOM PCB">
                          Custom PCB
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="COPY PCB">
                          Copy PCB
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="ASSEMBLY PCB">
                          Assembly PCB
                        </Dropdown.Item>
                      </DropdownButton>
                    </td>

                    <td className="px-3 text-nowrap">{user.name}</td>
                    <td className="px-3 text-nowrap">
                      <a href={`mailto:${user.email}`}>{user.email}</a>
                    </td>

                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.shippingname || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.address || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.city || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.country || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.postalCode || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.shippingAddress?.phone || "-"}
                    </td>

                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billingName || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billinggAddress || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billingCity || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billingCountry || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billingPostalCode || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.billingPhone || "-"}
                    </td>
                    <td className="px-3 text-nowrap">
                      {user.billingAddress?.tax || "-"}
                    </td>

                    <td className="text-nowrap px-3">
                      <Button
                        as={Link}
                        to={`/adminpcbedituser/${user._id}/edit`}
                        size="sm"
                        variant="light"
                        className="me-2"
                      >
                        <FaEdit />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        className="text-white"
                        onClick={() => deleteHandler(user._id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default UserAddressListCreateOrderScreen;
