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
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetQuotationsQuery,
  useDeleteQuotationByQuotationNoMutation,
} from "../../slices/quotationApiSlice";

import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

const QuotationListScreen = () => {
  // --- API Hooks ---
  const { data, isLoading, isError, error, refetch } = useGetQuotationsQuery();
  const [deleteQuotationByQuotationNo, { isLoading: isDeleting }] =
    useDeleteQuotationByQuotationNoMutation();

  // --- State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

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

  const confirmDelete = (quotation) => {
    setSelectedQuotation(quotation);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteQuotationByQuotationNo(
        selectedQuotation.quotation_no,
      ).unwrap();
      toast.success(
        `Quotation ${selectedQuotation.quotation_no} deleted successfully`,
      );
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete quotation");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterCustomer("");
    setFilterPresenter("");
    setFilterDate("");
  };

  // --- Data Logic (Memoized for performance) ---

  // 1. Filter unique quotations first
  const uniqueQuotations = useMemo(() => {
    return (
      data?.quotations?.filter(
        (q, index, self) =>
          index ===
          self.findIndex((item) => item.quotation_no === q.quotation_no),
      ) || []
    );
  }, [data]);

  // 2. Apply search and filters
  const displayedQuotations = useMemo(() => {
    return uniqueQuotations.filter((q) => {
      const matchCustomer =
        !filterCustomer || q.customer_name === filterCustomer;
      const matchPresenter =
        !filterPresenter || q.customer_present_name === filterPresenter;
      const matchDate =
        !filterDate ||
        new Date(q.date).toLocaleDateString() ===
          new Date(filterDate).toLocaleDateString();

      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        q.customer_name.toLowerCase().includes(searchLower) ||
        q.customer_present_name.toLowerCase().includes(searchLower) ||
        q.quotation_no.toLowerCase().includes(searchLower);

      return matchCustomer && matchPresenter && matchDate && matchSearch;
    });
  }, [
    uniqueQuotations,
    filterCustomer,
    filterPresenter,
    filterDate,
    searchQuery,
  ]);

  // Get Lists for Dropdowns
  const customerList = useMemo(
    () => Array.from(new Set(uniqueQuotations.map((q) => q.customer_name))),
    [uniqueQuotations],
  );
  const presenterList = useMemo(
    () =>
      Array.from(new Set(uniqueQuotations.map((q) => q.customer_present_name))),
    [uniqueQuotations],
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
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Header Section */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner">
              <FaFileInvoiceDollar size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                Quotations
              </h4>
              <p className="text-slate-500 font-medium mt-1">
                Manage your sales quotations
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={refetch}
              title="Refresh Data"
              className="flex items-center justify-center p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              <FaSync className={isLoading ? "animate-spin" : ""} size={18} />
            </button>
            <Link
              to="/admin/quotations/set"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-blue-500/30 w-full sm:w-auto"
            >
              <FaPlus /> New Quotation
            </Link>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6">
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
                  placeholder="Search Quotation No, Customer..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">All Customers</option>
                {customerList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Presenter Filter */}
            <div className="md:col-span-4 lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Presenter
              </label>
              <select
                value={filterPresenter}
                onChange={(e) => setFilterPresenter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">All Presenters</option>
                {presenterList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                  <th className="px-6 py-4">No.</th>
                  <th className="px-6 py-4">Quotation ID</th>
                  <th className="px-6 py-4">Customer Info</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedQuotations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                    >
                      No quotations found.
                    </td>
                  </tr>
                ) : (
                  displayedQuotations.map((q, index) => (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Quotation No */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 font-bold uppercase tracking-wider rounded-md font-mono text-sm px-2.5 py-1">
                            {q.quotation_no}
                          </span>
                          {q.quotation_pdf && (
                            <button
                              className="text-rose-500 hover:text-rose-600 hover:scale-110 transition-transform focus:outline-none"
                              onClick={() => handleViewPdf(q.quotation_pdf)}
                              title="View PDF"
                            >
                              <FaFilePdf size={20} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {q.customer_name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                          <FaUser className="text-slate-400" />{" "}
                          {q.customer_present_name}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                        {new Date(q.date).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-lg tracking-tight">
                        {parseFloat(q.grand_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ฿
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/customers/selectedcustomer/${q.id}/set`}
                            title="Duplicate / Create New"
                          >
                            <button className="w-9 h-9 flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-full transition-colors shadow-sm">
                              <FaPlus size={14} />
                            </button>
                          </Link>

                          <Link
                            to={`/admin/quotations/${q.quotation_no}/edit`}
                            title="Edit"
                          >
                            <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-full transition-colors shadow-sm">
                              <FaEdit size={14} />
                            </button>
                          </Link>

                          <button
                            className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-full transition-colors shadow-sm focus:outline-none"
                            onClick={() => confirmDelete(q)}
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
          {displayedQuotations.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-3xl text-center text-slate-500 font-medium shadow-sm border border-slate-200">
              No quotations found.
            </div>
          ) : (
            displayedQuotations.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex flex-col hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 font-bold uppercase tracking-wider rounded-md font-mono text-sm px-2.5 py-1">
                      {q.quotation_no}
                    </span>
                    {q.quotation_pdf && (
                      <button
                        onClick={() => handleViewPdf(q.quotation_pdf)}
                        className="text-rose-500 p-1 hover:text-rose-600 focus:outline-none"
                      >
                        <FaFilePdf size={18} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <FaCalendarAlt className="text-slate-400" />
                    {new Date(q.date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                </div>

                <div className="mb-4">
                  <h6 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                    {q.customer_name}
                  </h6>
                  <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <FaUser className="text-slate-400" />
                    {q.customer_present_name}
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Grand Total
                    </span>
                    <span className="font-black text-slate-900 text-xl tracking-tight leading-none">
                      {parseFloat(q.grand_total).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/admin/customers/selectedcustomer/${q.id}/set`}
                      className="flex-1"
                    >
                      <button className="w-full flex justify-center items-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200">
                        <FaPlus /> Duplicate
                      </button>
                    </Link>
                    <Link to={`/admin/quotations/${q.quotation_no}/edit`}>
                      <button className="w-10 h-10 flex justify-center items-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors">
                        <FaEdit size={16} />
                      </button>
                    </Link>
                    <button
                      onClick={() => confirmDelete(q)}
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
            <FaTrash /> Delete Quotation
          </span>
        }
      >
        <div className="py-4 text-slate-600">
          <p className="mb-2 text-lg">
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 font-mono">
              {selectedQuotation?.quotation_no}
            </strong>
            ?
          </p>
          <p className="text-sm text-slate-500 font-medium">
            This action cannot be undone and will permanently remove this
            quotation from the system.
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

export default QuotationListScreen;
