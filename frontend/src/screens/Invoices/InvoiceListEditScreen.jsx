import React, { useState, useMemo } from "react";
import {
  FaTrash,
  FaEdit,
  FaSearch,
  FaPlus,
  FaFilePdf,
  FaUser,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaFilter,
  FaSync,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetInvoicesQuery,
  useDeleteInvoiceByInvoiceIdMutation,
} from "../../slices/invoicesApiSlice";

import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const InvoiceListEditScreen = () => {
  // --- API Hooks ---
  const { data: invoicesData, isLoading, isError, error, refetch } = useGetInvoicesQuery();
  const [deleteInvoiceByInvoiceId, { isLoading: isDeleting }] =
    useDeleteInvoiceByInvoiceIdMutation();

  // --- State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPresenter, setFilterPresenter] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // --- Handlers ---
  const handleViewPdf = (pdfPath) => {
    if (!pdfPath) return;
    const baseUrl =
      process.env.REACT_APP_BASE_URL ||
      `${window.location.protocol}//${window.location.host}`;
    const url = pdfPath.startsWith("http") ? pdfPath : `${baseUrl}${pdfPath}`;
    window.open(url, "_blank");
  };

  const confirmDelete = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteInvoiceByInvoiceId(selectedInvoice.invoice_no).unwrap();
      toast.success(
        `Invoice ${selectedInvoice.invoice_no} deleted successfully`,
      );
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete invoice");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterCustomer("");
    setFilterPresenter("");
    setFilterDate("");
  };

  // --- Data Logic (Memoized for performance) ---

  // 1. Filter unique invoices first (Group by invoice_no)
  const uniqueInvoices = useMemo(() => {
    // If backend returns an array directly or inside an object property
    // Check if it's an array or object
    const list = Array.isArray(invoicesData) ? invoicesData : invoicesData?.invoices || [];
    return (
      list.filter(
        (inv, index, self) =>
          index ===
          self.findIndex((item) => item.invoice_no === inv.invoice_no),
      ) || []
    );
  }, [invoicesData]);

  // 2. Apply search and filters
  const displayedInvoices = useMemo(() => {
    return uniqueInvoices.filter((inv) => {
      const matchCustomer =
        !filterCustomer || inv.customer_name === filterCustomer;
      const matchPresenter =
        !filterPresenter || inv.customer_present_name === filterPresenter;
      const matchDate =
        !filterDate ||
        new Date(inv.date).toLocaleDateString() ===
          new Date(filterDate).toLocaleDateString();

      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        inv.customer_name?.toLowerCase().includes(searchLower) ||
        inv.customer_present_name?.toLowerCase().includes(searchLower) ||
        inv.invoice_no?.toLowerCase().includes(searchLower);

      return matchCustomer && matchPresenter && matchDate && matchSearch;
    });
  }, [
    uniqueInvoices,
    filterCustomer,
    filterPresenter,
    filterDate,
    searchQuery,
  ]);

  // Get Lists for Dropdowns
  const customerList = useMemo(
    () => Array.from(new Set(uniqueInvoices.map((inv) => inv.customer_name).filter(Boolean))),
    [uniqueInvoices],
  );
  const presenterList = useMemo(
    () =>
      Array.from(new Set(uniqueInvoices.map((inv) => inv.customer_present_name).filter(Boolean))),
    [uniqueInvoices],
  );

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (isError)
    return (
      <div className="p-4">
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      </div>
    );

  return (
    <div className="py-4 md:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Header Section */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-4 md:p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-inner">
              <FaFileInvoiceDollar size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                Invoices
              </h4>
              <p className="text-slate-500 font-medium mt-1">
                Manage your billing invoices
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={refetch}
              title="Refresh Data"
              className="flex items-center justify-center p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
            >
              <FaSync className={isLoading ? "animate-spin" : ""} size={18} />
            </button>
            <Link
              to="/admin/invoiceset"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-500/30 w-full sm:w-auto"
            >
              <FaPlus /> New Invoice
            </Link>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-12 lg:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Invoice No, Customer..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Customer Filter */}
            <div className="md:col-span-4 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Customer
              </label>
              <div className="relative group">
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none cursor-pointer group-hover:bg-slate-100/50"
                >
                  <option value="">All Customers</option>
                  {customerList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
            </div>

            {/* Presenter Filter */}
            <div className="md:col-span-4 lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Presenter
              </label>
              <div className="relative group">
                <select
                  value={filterPresenter}
                  onChange={(e) => setFilterPresenter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none cursor-pointer group-hover:bg-slate-100/50"
                >
                  <option value="">All Presenters</option>
                  {presenterList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="md:col-span-4 lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Reset Button */}
            <div className="md:col-span-12 lg:col-span-1 flex items-end">
              <button
                onClick={resetFilters}
                title="Reset Filters"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-rose-500 transition-colors text-sm font-semibold"
              >
                <FaFilter /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* 3. DESKTOP VIEW (Table) */}
        <div className="hidden lg:block bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-4 md:px-6 py-4">No.</th>
                  <th className="px-4 md:px-6 py-4">Invoice ID</th>
                  <th className="px-4 md:px-6 py-4">Customer Info</th>
                  <th className="px-4 md:px-6 py-4 text-center">Date</th>
                  <th className="px-4 md:px-6 py-4 text-right">Total Amount</th>
                  <th className="px-4 md:px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 md:px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  displayedInvoices.map((inv, index) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Invoice No */}
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-indigo-100 text-indigo-800 font-bold uppercase tracking-wider rounded-md font-mono text-sm px-2.5 py-1">
                            {inv.invoice_no}
                          </span>
                          {inv.invoice_pdf && (
                            <button
                              className="text-rose-500 hover:text-rose-600 hover:scale-110 transition-transform focus:outline-none"
                              onClick={() => handleViewPdf(inv.invoice_pdf)}
                              title="View PDF"
                            >
                              <FaFilePdf size={20} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 md:px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {inv.customer_name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                          <FaUser className="text-slate-400" />{" "}
                          {inv.customer_present_name}
                        </div>
                        {inv.internal_note && (
                          <div className="text-xs text-amber-600 mt-2 font-medium italic line-clamp-2 bg-amber-50 p-1 rounded border border-amber-100">
                            <span className="font-bold">Internal Note:</span> {inv.internal_note}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 md:px-6 py-4 text-center text-sm font-medium text-slate-600">
                        {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }) : "-"}
                      </td>

                      {/* Amount */}
                      <td className="px-4 md:px-6 py-4 text-right font-black text-slate-900 text-lg tracking-tight">
                        {parseFloat(inv.grand_total || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ฿
                      </td>

                      {/* Actions */}
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex justify-center items-center gap-2 transition-opacity">
                          <Link
                            to={`/admin/invoicelist/${inv.invoice_no}`}
                            title="View Invoice"
                          >
                            <button className="w-9 h-9 flex items-center justify-center bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white rounded-full transition-colors shadow-sm">
                              <FaEye size={14} />
                            </button>
                          </Link>

                          <Link
                            to={`/admin/customers/selectedcustomer/${inv.id}/setinvoice`}
                            title="Duplicate / Create New Invoice"
                          >
                            <button className="w-9 h-9 flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-full transition-colors shadow-sm">
                              <FaPlus size={14} />
                            </button>
                          </Link>

                          <Link
                            to={`/admin/invoicelist/${inv.invoice_no}/edit`}
                            title="Edit"
                          >
                            <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-full transition-colors shadow-sm">
                              <FaEdit size={14} />
                            </button>
                          </Link>

                          <button
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-full transition-colors shadow-sm focus:outline-none"
                            onClick={() => confirmDelete(inv)}
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. MOBILE / TABLET VIEW (Cards) */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedInvoices.length === 0 ? (
            <div className="col-span-full bg-white p-4 md:p-8 rounded-3xl text-center text-slate-500 font-medium shadow-sm border border-slate-200">
              No invoices found.
            </div>
          ) : (
            displayedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex flex-col hover:border-indigo-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-100 text-indigo-800 font-bold uppercase tracking-wider rounded-md font-mono text-sm px-2.5 py-1">
                      {inv.invoice_no}
                    </span>
                    {inv.invoice_pdf && (
                      <button
                        onClick={() => handleViewPdf(inv.invoice_pdf)}
                        className="text-rose-500 p-1 hover:text-rose-600 focus:outline-none"
                      >
                        <FaFilePdf size={18} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <FaCalendarAlt className="text-slate-400" />
                    {inv.date ? new Date(inv.date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    }) : "-"}
                  </span>
                </div>

                <div className="mb-4">
                  <h6 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                    {inv.customer_name}
                  </h6>
                  <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <FaUser className="text-slate-400" />
                    {inv.customer_present_name}
                  </div>
                  {inv.internal_note && (
                    <div className="text-xs text-amber-600 mt-2 font-medium italic line-clamp-2 bg-amber-50 p-1.5 rounded border border-amber-100">
                      <span className="font-bold">Internal Note:</span> {inv.internal_note}
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Grand Total
                    </span>
                    <span className="font-black text-slate-900 text-xl tracking-tight leading-none">
                      {parseFloat(inv.grand_total || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/admin/customers/selectedcustomer/${inv.id}/setinvoice`}
                      className="flex-1"
                    >
                      <button className="w-full flex justify-center items-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200">
                        <FaPlus /> Duplicate
                      </button>
                    </Link>
                    <Link to={`/admin/invoicelist/${inv.invoice_no}`}>
                      <button className="w-10 h-10 flex justify-center items-center bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl transition-colors">
                        <FaEye size={16} />
                      </button>
                    </Link>
                    <Link to={`/admin/invoicelist/${inv.invoice_no}/edit`}>
                      <button className="w-10 h-10 flex justify-center items-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors">
                        <FaEdit size={16} />
                      </button>
                    </Link>
                    <button
                      onClick={() => confirmDelete(inv)}
                      className="w-10 h-10 flex justify-center items-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors focus:outline-none"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={
          <span className="flex items-center gap-2 text-rose-600">
            <FaTrash /> Delete Invoice
          </span>
        }
      >
        <div className="py-4 text-slate-600">
          <p className="mb-2 text-lg">
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 font-mono">
              {selectedInvoice?.invoice_no}
            </strong>
            ?
          </p>
          <p className="text-sm text-slate-500 font-medium">
            This action cannot be undone and will permanently remove this
            invoice from the system.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-4">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!bg-rose-600 hover:!bg-rose-700 !shadow-rose-500/30"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceListEditScreen;
