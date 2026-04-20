import React, { useState } from "react";
import { FaTrash, FaEdit, FaEye, FaCheckCircle, FaPlus } from "react-icons/fa";
import {
  useGetDefaultQuotationsQuery,
  useDeleteDefaultQuotationMutation,
  useUpdateUseingDefaultQuotationSetMutation,
} from "../../slices/quotationDefaultApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const QuotationDefaultListScreen = () => {
  const navigate = useNavigate();
  const [updateSet] = useUpdateUseingDefaultQuotationSetMutation();

  const { data, isLoading, error, refetch } = useGetDefaultQuotationsQuery();
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteDefaultQuotationMutation();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedId(null);
    setShowModal(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuotation(selectedId).unwrap();
      toast.success("Quotation deleted successfully");
      refetch();
    } catch (err) {
      toast.error("Failed to delete quotation");
    } finally {
      handleCloseModal();
    }
  };

  const handleSetAsDefault = async (quotationId) => {
    try {
      await updateSet({ defaultQuotationId: quotationId }).unwrap();
      toast.success("Quotation set as default!");
      refetch(); // Refresh the list to update checkboxes
    } catch (err) {
      console.error(err);
      toast.error("Failed to set as default");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="p-4">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  return (
    <div className="py-4 md:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-4 md:p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner">
              <FaCheckCircle size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                Default Quotations
              </h4>
              <p className="text-slate-500 font-medium mt-1">
                Manage quotation templates and settings
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto">
            <Link
              to="/admin/defaultquotations/set"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-blue-500/30 w-full"
            >
              <FaPlus /> Create Default
            </Link>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {data.quotations && data.quotations.length > 0 ? (
              data.quotations.map((q) => (
                <div
                  key={q.id}
                  className={`relative flex flex-col p-4 md:p-6 rounded-2xl border ${q.is_used === 1 ? "border-green-500 bg-green-50/30 shadow-md ring-1 ring-green-500/50" : "border-slate-200 bg-white shadow-sm hover:border-blue-300"} transition-all`}
                >
                  {/* Default Badge/Checkbox */}
                  <div className="absolute top-4 right-4">
                    <label
                      className="flex items-center cursor-pointer group"
                      title={
                        q.is_used === 1 ? "Current Default" : "Set as Default"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={q.is_used === 1}
                        onChange={() => handleSetAsDefault(q.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${q.is_used === 1 ? "bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/30" : "bg-slate-100 border-slate-300 text-transparent group-hover:border-green-400"}`}
                      >
                        <FaCheckCircle
                          size={14}
                          className={q.is_used === 1 ? "block" : "hidden"}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mb-4 pr-8">
                    <h5 className="text-lg font-bold text-slate-900 leading-tight">
                      {q.company_name}
                    </h5>
                  </div>

                  <div className="space-y-2 mb-6 flex-grow text-sm font-medium">
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="font-bold text-slate-400 min-w-[60px] uppercase text-[10px] tracking-wider mt-1">
                        Branch
                      </span>
                      <span className="text-slate-900">{q.branch_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="font-bold text-slate-400 min-w-[60px] uppercase text-[10px] tracking-wider mt-1">
                        Contact
                      </span>
                      <span className="text-slate-900">{q.tel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100/60 mt-auto">
                    <button
                      onClick={() =>
                        navigate(`/admin/defaultquotations/${q.id}`)
                      }
                      className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-colors border border-slate-200"
                    >
                      <FaEye /> View
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/admin/defaultquotations/${q.id}/edit`)
                      }
                      className="w-11 h-11 flex justify-center items-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors shrink-0"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleShowModal(q.id)}
                      disabled={isDeleting}
                      className="w-11 h-11 flex justify-center items-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                No default quotations found. Create your first template to get
                started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={
          <span className="flex items-center gap-2 text-rose-600">
            <FaTrash /> Confirm Delete
          </span>
        }
      >
        <div className="py-4 text-slate-600">
          <p className="mb-2 text-lg">
            Are you sure you want to delete this default quotation?
          </p>
          <p className="text-sm text-slate-500 font-medium">
            This action cannot be undone and will permanently remove this
            template from the system.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-4">
          <Button variant="outline" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!bg-rose-600 hover:!bg-rose-700 !shadow-rose-500/30"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Quotation"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default QuotationDefaultListScreen;
