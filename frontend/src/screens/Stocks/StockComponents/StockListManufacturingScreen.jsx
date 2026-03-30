import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import {
  useGetStockManufacturesQuery,
  useCreateStockManufactureMutation,
  useUpdateStockManufactureMutation,
  useDeleteStockManufactureMutation,
} from "../../../slices/stockManufactureApiSlice";

// Custom Tailwind Components
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Edit, Trash2, Plus } from "lucide-react";

const StockListManufacturingScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: manufactureData = [],
    isLoading,
    error,
    refetch,
  } = useGetStockManufacturesQuery();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedManufacture, setSelectedManufacture] = useState({});
  const [formData, setFormData] = useState({ namemanufacture: "" });

  const [createManufacture] = useCreateStockManufactureMutation();
  const [updateManufacture] = useUpdateStockManufactureMutation();
  const [deleteManufacture] = useDeleteStockManufactureMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    await createManufacture({
      ...formData,
      createuser: userInfo.name,
    });
    setShowCreateModal(false);
  };

  const handleEdit = async () => {
    await updateManufacture({
      id: selectedManufacture.ID,
      ...formData,
      createuser: userInfo.name,
    });
    setShowEditModal(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteManufacture(selectedManufacture.ID);
    setShowDeleteModal(false);
  };

  const openCreateModal = () => {
    setFormData({ namemanufacture: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (mfg) => {
    setSelectedManufacture(mfg);
    setFormData({ namemanufacture: mfg.namemanufacture });
    setShowEditModal(true);
  };

  const openDeleteModal = (mfg) => {
    setSelectedManufacture(mfg);
    setShowDeleteModal(true);
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pageFade">
      <Card>
        <CardHeader
          title="Manufacture List"
          action={
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={18} className="mr-2" />
              Create
            </Button>
          }
        />
        <CardBody className="p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>ID</Table.Head>
                <Table.Head>Manufacture ID</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Created By</Table.Head>
                <Table.Head className="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {manufactureData.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan="5"
                    className="text-center py-6 text-slate-500"
                  >
                    No manufactures found.
                  </Table.Cell>
                </Table.Row>
              ) : (
                manufactureData.map((mfg, index) => (
                  <Table.Row key={mfg.ID}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell className="font-mono text-slate-600">
                      {mfg.manufactureID}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-slate-800">
                      {mfg.namemanufacture}
                    </Table.Cell>
                    <Table.Cell>{mfg.createuser}</Table.Cell>
                    <Table.Cell className="text-right flex justify-end gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openEditModal(mfg)}
                        title="Edit"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openDeleteModal(mfg)}
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create Manufacture"
        footer={
          <>
            <Button variant="light" onClick={() => setShowCreateModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </>
        }
      >
        <Input
          label="Name Manufacture"
          name="namemanufacture"
          value={formData.namemanufacture}
          onChange={handleChange}
          placeholder="Enter manufacture name..."
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title={`Edit Manufacture [ID: ${selectedManufacture.manufactureID}]`}
        footer={
          <>
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleEdit}>
              Update
            </Button>
          </>
        }
      >
        <Input
          label="Name Manufacture"
          name="namemanufacture"
          value={formData.namemanufacture}
          onChange={handleChange}
          placeholder="Enter manufacture name..."
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title={`Confirm Delete [ID: ${selectedManufacture.manufactureID}]`}
        size="sm"
        footer={
          <>
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">
            {selectedManufacture.namemanufacture}
          </strong>
          ?
        </p>
      </Modal>
    </div>
  );
};

export default StockListManufacturingScreen;
