import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaFileInvoiceDollar,
  FaSearch,
  FaBox,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaChevronRight,
} from "react-icons/fa";
import { PiReceiptFill } from "react-icons/pi";

import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetInvoicesQuery,
  useDeleteInvoiceMutation,
} from "../../slices/invoicesApiSlice";

const InvoiceListEditScreen = () => {
  const {
    data: invoices,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetInvoicesQuery();
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices?.filter(
      (invoice) =>
        invoice.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_id?.toString().includes(searchTerm),
    );
  }, [invoices, searchTerm]);

  const confirmDelete = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(selectedInvoice.id).unwrap();
      toast.success("Invoice removed successfully");
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove invoice");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-vh-100 bg-slate-50/50">
        <Loader />
      </div>
    );

  if (isError)
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-24">
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 pt-6 px-4 md:px-8 font-prompt">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-2">
              <PiReceiptFill size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Invoice Management
            </h1>
            <p className="text-slate-500 font-medium">
              Create and track billing invoices for all branches
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
              />
            </div>
            <Link
              to="/admin/invoiceset"
              className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all active:scale-95 text-sm"
            >
              <FaPlus />
              New Invoice
            </Link>
          </motion.div>
        </div>

        {/* Desktop View Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 md:px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    #
                  </th>
                  <th className="px-4 md:px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Branch & Description
                  </th>
                  <th className="px-4 md:px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Quantity
                  </th>
                  <th className="px-4 md:px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                    Value
                  </th>
                  <th className="px-4 md:px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Date
                  </th>
                  <th className="px-4 md:px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {filteredInvoices?.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan="6" className="px-4 md:px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                            <FaBox size={24} />
                          </div>
                          <p className="text-slate-400 font-medium">
                            No invoices found matching your criteria
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredInvoices?.map((invoice, index) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={`desktop-${invoice.id}`}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-slate-800 tabular-nums">
                          {index + 1}
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                              {invoice.branch_name}
                            </span>
                            <span className="text-slate-400 text-sm font-medium line-clamp-1 truncate max-w-[300px]">
                              {invoice.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                          <span className="inline-flex px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-black uppercase tracking-wider">
                            {invoice.qty} {invoice.unit}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 text-right font-bold tabular-nums">
                          <div className="flex flex-col">
                            <span className="text-slate-900">
                              {parseFloat(invoice.grand_total).toLocaleString()}{" "}
                              ฿
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                              Incl. VAT
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-600 font-bold text-sm tracking-tight capitalize">
                              {new Date(invoice.created_at).toLocaleDateString(
                                "th-TH",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6">
                          <div className="flex justify-center items-center gap-3">
                            <Link
                              to={`/admin/invoicelist/${invoice.id}/edit`}
                              title="Edit Invoice"
                              className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                              <FaEdit size={16} />
                            </Link>
                            <button
                              onClick={() => confirmDelete(invoice)}
                              title="Delete Invoice"
                              className="w-10 h-10 flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Mobile View List */}
        <div className="md:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredInvoices?.map((invoice) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={`mobile-${invoice.id}`}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                      {invoice.branch_name}
                    </span>
                    <h3 className="font-bold text-slate-900 leading-tight pt-1">
                      {invoice.description}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/invoicelist/${invoice.id}/edit`}
                      className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl active:bg-indigo-600 active:text-white transition-colors shadow-sm"
                    >
                      <FaEdit size={14} />
                    </Link>
                    <button
                      onClick={() => confirmDelete(invoice)}
                      className="w-10 h-10 flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-600 rounded-xl active:bg-rose-600 active:text-white transition-colors shadow-sm"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-slate-50 pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Grand Total
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {parseFloat(invoice.grand_total).toLocaleString()}{" "}
                      <span className="text-sm font-bold text-slate-400 uppercase">
                        ฿
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] bg-slate-50 px-2 py-1 rounded-lg">
                      <FaCalendarAlt size={10} className="text-slate-400" />
                      {new Date(invoice.created_at).toLocaleDateString("th-TH")}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredInvoices?.length === 0 && (
            <div className="text-center py-20 px-4 md:px-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
              <FaBox size={32} className="mx-auto text-slate-200 mb-4" />
              <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">
                No matching invoices
              </p>
            </div>
          )}
        </div>

        {/* Floating Add Button for Mobile */}
        <Link
          to="/admin/invoiceset"
          className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-slate-900 flex items-center justify-center text-white rounded-2xl shadow-2xl shadow-slate-400 z-50 active:scale-90 transition-transform"
        >
          <FaPlus size={20} />
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-4 md:p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                  <FaTrash size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Remove Invoice?
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed px-4">
                    Are you sure you want to delete invoice{" "}
                    <span className="font-black text-indigo-600">
                      #{selectedInvoice?.invoice_id}
                    </span>
                    ? This action is permanent.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Now"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif; }
      ` }} />
    </div>
  );
};

export default InvoiceListEditScreen;
