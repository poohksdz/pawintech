import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetStockFootprintsQuery,
  useCreateStockFootprintMutation,
  useUpdateStockFootprintMutation,
  useDeleteStockFootprintMutation,
} from "../../../slices/stockFootprintApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";

import Loader from "../../../components/Loader";
import Message from "../../../components/Message";

// Custom Tailwind Components
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Edit, Trash2, Plus } from "lucide-react";

const StockListFootprintScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: footprintData = [],
    isLoading,
    error,
    refetch,
  } = useGetStockFootprintsQuery();
  const { data: categories = [] } = useGetStockCategoriesQuery();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedFootprint, setSelectedFootprint] = useState({});
  const [formData, setFormData] = useState({ namefootprint: "", category: "" });

  const [createFootprint] = useCreateStockFootprintMutation();
  const [updateFootprint] = useUpdateStockFootprintMutation();
  const [deleteFootprint] = useDeleteStockFootprintMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    await createFootprint({ ...formData, createuser: userInfo.name });
    setShowCreateModal(false);
  };

  const handleEdit = async () => {
    await updateFootprint({
      id: selectedFootprint.ID,
      ...formData,
      createuser: userInfo.name,
    });
    setShowEditModal(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteFootprint(selectedFootprint.ID);
    setShowDeleteModal(false);
  };

  const openCreateModal = () => {
    setFormData({ namefootprint: "", category: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (fp) => {
    setSelectedFootprint(fp);
    setFormData({ namefootprint: fp.namefootprint, category: fp.category });
    setShowEditModal(true);
  };

  const openDeleteModal = (fp) => {
    setSelectedFootprint(fp);
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
          title="Footprint List"
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
                <Table.Head>Footprint ID</Table.Head>
                <Table.Head>Name Footprint</Table.Head>
                <Table.Head>Category</Table.Head>
                <Table.Head>Created By</Table.Head>
                <Table.Head className="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {footprintData.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan="6"
                    className="text-center py-6 text-slate-500"
                  >
                    No footprints found.
                  </Table.Cell>
                </Table.Row>
              ) : (
                footprintData.map((fp, index) => (
                  <Table.Row key={fp.ID}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell className="font-mono text-slate-600">
                      {fp.footprintID}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-slate-800">
                      {fp.namefootprint}
                    </Table.Cell>
                    <Table.Cell>{fp.category?.trim()}</Table.Cell>
                    <Table.Cell>{fp.createuser}</Table.Cell>
                    <Table.Cell className="text-right flex justify-end gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openEditModal(fp)}
                        title="Edit"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openDeleteModal(fp)}
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
        title="Create Footprint"
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
        <div className="space-y-4">
          <Input
            label="Name Footprint"
            name="namefootprint"
            value={formData.namefootprint}
            onChange={handleChange}
            placeholder="Enter footprint name..."
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.ID} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title={`Edit Footprint [ID: ${selectedFootprint.footprintID}]`}
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
        <div className="space-y-4">
          <Input
            label="Name Footprint"
            name="namefootprint"
            value={formData.namefootprint}
            onChange={handleChange}
            placeholder="Enter footprint name..."
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.ID} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title={`Confirm Delete [ID: ${selectedFootprint.footprintID}]`}
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
            {selectedFootprint.namefootprint}
          </strong>
          ?
        </p>
      </Modal>
    </div>
  );
};

export default StockListFootprintScreen;
