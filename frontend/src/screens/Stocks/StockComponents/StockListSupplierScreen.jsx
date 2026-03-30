import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import {
  useGetStockSuppliersQuery,
  useCreateStockSupplierMutation,
  useUpdateStockSupplierMutation,
  useDeleteStockSupplierMutation,
} from "../../../slices/stockSupplierApiSlice";

// Custom Tailwind Components
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Edit, Trash2, Plus } from "lucide-react";

const StockListSupplierScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: supplierData = [],
    isLoading,
    error,
    refetch,
  } = useGetStockSuppliersQuery();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState({});
  const [formData, setFormData] = useState({ namesupplier: "" });

  const [createSupplier] = useCreateStockSupplierMutation();
  const [updateSupplier] = useUpdateStockSupplierMutation();
  const [deleteSupplier] = useDeleteStockSupplierMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    await createSupplier({
      ...formData,
      createuser: userInfo.name,
    });
    setShowCreateModal(false);
  };

  const handleEdit = async () => {
    await updateSupplier({
      id: selectedSupplier.ID,
      ...formData,
      createuser: userInfo.name,
    });
    setShowEditModal(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteSupplier(selectedSupplier.ID);
    setShowDeleteModal(false);
  };

  const openCreateModal = () => {
    setFormData({ namesupplier: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (sup) => {
    setSelectedSupplier(sup);
    setFormData({ namesupplier: sup.namesupplier });
    setShowEditModal(true);
  };

  const openDeleteModal = (sup) => {
    setSelectedSupplier(sup);
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
          title="Supplier List"
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
                <Table.Head>Supplier ID</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Created By</Table.Head>
                <Table.Head className="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {supplierData.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan="5"
                    className="text-center py-6 text-slate-500"
                  >
                    No suppliers found.
                  </Table.Cell>
                </Table.Row>
              ) : (
                supplierData.map((sup, index) => (
                  <Table.Row key={sup.ID}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell className="font-mono text-slate-600">
                      {sup.supplierid}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-slate-800">
                      {sup.namesupplier}
                    </Table.Cell>
                    <Table.Cell>{sup.createuser}</Table.Cell>
                    <Table.Cell className="text-right flex justify-end gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openEditModal(sup)}
                        title="Edit"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openDeleteModal(sup)}
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
        title="Create Supplier"
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
          label="Supplier Name"
          name="namesupplier"
          value={formData.namesupplier}
          onChange={handleChange}
          placeholder="Enter supplier name..."
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title={`Edit Supplier [ID: ${selectedSupplier.supplierid}]`}
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
          label="Supplier Name"
          name="namesupplier"
          value={formData.namesupplier}
          onChange={handleChange}
          placeholder="Enter supplier name..."
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title={`Confirm Delete [ID: ${selectedSupplier.supplierid}]`}
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
            {selectedSupplier.namesupplier}
          </strong>
          ?
        </p>
      </Modal>
    </div>
  );
};

export default StockListSupplierScreen;
