import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetStockCategoriesQuery,
  useUpdateStockCategoryMutation,
  useDeleteStockCategoryMutation,
  useCreateStockCategoryMutation,
} from "../../../slices/stockCategoryApiSlice";

import Loader from "../../../components/Loader";
import Message from "../../../components/Message";

// Custom Tailwind Components
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Edit, Trash2, Plus } from "lucide-react";

const StockListCategoryScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: categoryData = [],
    isLoading,
    error,
    refetch,
  } = useGetStockCategoriesQuery();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState({});
  const [formData, setFormData] = useState({ category: "", createuser: "" });

  const [createStockCategory] = useCreateStockCategoryMutation();
  const [updateStockCategory] = useUpdateStockCategoryMutation();
  const [deleteStockCategory] = useDeleteStockCategoryMutation();

  // Handle form changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Create Category
  const handleCreate = async () => {
    await createStockCategory({
      category: formData.category,
      createuser: userInfo.name,
    });
    setShowCreateModal(false);
    setFormData({ category: "" }); // reset form
  };

  // Edit Category
  const handleEdit = async () => {
    await updateStockCategory({
      id: selectedCategory.ID,
      category: formData.category,
      createuser: userInfo.name,
    });
    setShowEditModal(false);
    refetch(); // refresh the table automatically
  };

  // Delete Category
  const handleDelete = async () => {
    await deleteStockCategory(selectedCategory.ID);
    setShowDeleteModal(false);
  };

  // Open modals
  const openCreateModal = () => {
    setFormData({ category: "", createuser: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      category: category.category,
      createuser: category.createuser,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-pageFade">
      <Card>
        <CardHeader
          title="Category List"
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
                <Table.Head>Category ID</Table.Head>
                <Table.Head>Category</Table.Head>
                <Table.Head>Created By</Table.Head>
                <Table.Head className="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categoryData.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan="5"
                    className="text-center py-4 md:py-6 text-slate-500"
                  >
                    No categories found.
                  </Table.Cell>
                </Table.Row>
              ) : (
                categoryData.map((cat, index) => (
                  <Table.Row key={cat.ID}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell className="font-mono text-slate-600">
                      {cat.categoryid}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-slate-800">
                      {cat.category}
                    </Table.Cell>
                    <Table.Cell>{cat.createuser}</Table.Cell>
                    <Table.Cell className="text-right flex justify-end gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openEditModal(cat)}
                        title="Edit"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => openDeleteModal(cat)}
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
        title="Create Category"
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
          label="Category Name"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Enter category name..."
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title={`Edit Category [ID: ${selectedCategory.categoryid}]`}
        footer={
          <>
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowConfirmUpdate(true)}
            >
              Update
            </Button>
          </>
        }
      >
        <Input
          label="Category Name"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Enter category name..."
        />
      </Modal>

      {/* Small confirmation modal */}
      <Modal
        show={showConfirmUpdate}
        onHide={() => setShowConfirmUpdate(false)}
        title="Confirm Update"
        size="sm"
        footer={
          <>
            <Button variant="light" onClick={() => setShowConfirmUpdate(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleEdit();
                setShowConfirmUpdate(false);
              }}
            >
              Yes, Update
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to update{" "}
          <strong className="text-slate-900">{formData.category}</strong>?
        </p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title={`Confirm Delete [ID: ${selectedCategory.categoryid}]`}
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
            {selectedCategory.category}
          </strong>
          ?
        </p>
      </Modal>
    </div>
  );
};

export default StockListCategoryScreen;
