import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Container, Row, Col, Form } from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaCheck,
  FaEdit,
  FaEye,
  FaSync,
  FaLayerGroup,
  FaChevronRight,
  FaBox,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetAllcopycartsQuery } from "../../slices/copypcbCartApiSlice";
import CopyPCBCartConfirmModle from "./CopyPCBCartConfirmModle";

const CopyPCBCartListScreen = () => {
  const { language } = useSelector((state) => state.language);
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useGetAllcopycartsQuery();

  // State for Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // State for Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Translations
  const translations = {
    en: {
      title: "Copy PCB Orders",
      searchPlaceholder: "Search project...",
      statusAll: "All Status",
      project: "Project",
      qty: "Qty",
      price: "Price",
      date: "Date",
      status: "Status",
      actions: "Actions",
      noData: "No orders found.",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      detail: "Detail",
      confirm: "Confirm",
      edit: "Edit",
    },
    thai: {
      title: "Copy PCB Orders",
      searchPlaceholder: "ค้นหาโปรเจกต์...",
      statusAll: "สถานะทั้งหมด",
      project: "โปรเจกต์",
      qty: "จำนวน",
      price: "ราคา",
      date: "วันที่",
      status: "สถานะ",
      actions: "จัดการ",
      noData: "ไม่พบรายการ",
      pending: "รอดำเนินการ",
      accepted: "อนุมัติแล้ว",
      rejected: "ปฏิเสธ",
      detail: "รายละเอียด",
      confirm: "อนุมัติ",
      edit: "แก้ไข",
    },
  };
  const t = translations[language] || translations.en;

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let orders = [];
    if (rawData) {
      if (Array.isArray(rawData)) orders = rawData;
      else if (Array.isArray(rawData.data)) orders = rawData.data;
    }

    return orders
      .filter((order) => {
        if (parseInt(order.pcb_qty) <= 0) return false;
        const matchesSearch =
          order.projectname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.toString().includes(searchTerm);
        const matchesStatus =
          filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [rawData, searchTerm, filterStatus]);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        icon: <FaClock className="animate-pulse" />,
        label: t.pending,
      },
      accepted: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        icon: <FaCheckCircle />,
        label: t.accepted,
      },
      rejected: {
        bg: "bg-rose-50",
        text: "text-rose-600",
        icon: <FaTimesCircle />,
        label: t.rejected,
      },
    };
    const config = configs[status] || configs.pending;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {config.icon}
        {config.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-prompt">
      <Container className="py-4 md:py-8">
        {/* Header & Controls */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8 mb-8">
          <Row className="align-items-center g-6">
            <Col lg={4}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                  <FaLayerGroup size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 m-0">
                    {t.title}
                  </h1>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    Management Dashboard
                  </p>
                </div>
              </div>
            </Col>
            <Col lg={8}>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {/* Search */}
                <div className="relative flex-grow max-w-xs">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <Form.Control
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 pl-11 pr-4 font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 transition-all shadow-none outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <FaFilter
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                    size={12}
                  />
                  <Form.Select
                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 pl-10 pr-10 font-bold text-slate-800 focus:bg-white focus:border-blue-500/50 transition-all shadow-none outline-none appearance-none cursor-pointer text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">{t.statusAll}</option>
                    <option value="pending">{t.pending}</option>
                    <option value="accepted">{t.accepted}</option>
                    <option value="rejected">{t.rejected}</option>
                  </Form.Select>
                </div>

                {/* Refresh */}
                <button
                  onClick={refetch}
                  className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-50 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/50 transition-all flex items-center justify-center shadow-sm"
                >
                  <FaSync className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.message}
          </Message>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 py-20 text-center">
            <FaLayerGroup className="mx-auto text-slate-100 mb-4" size={64} />
            <h5 className="text-slate-400 font-bold uppercase tracking-widest m-0">
              {t.noData}
            </h5>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 md:px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      Project Information
                    </th>
                    <th className="px-4 md:px-6 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      {t.qty}
                    </th>
                    <th className="px-4 md:px-6 py-5 text-end text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      {t.price}
                    </th>
                    <th className="px-4 md:px-6 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      {t.status}
                    </th>
                    <th className="px-4 md:px-8 py-5 text-end text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-4 md:px-8 py-4 md:py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 flex items-center justify-center transition-all">
                            <FaLayerGroup size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 mb-0.5">
                              {order.projectname}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              ID: {order.id}{" "}
                              <span className="text-slate-200">|</span>
                              {new Date(order.created_at).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold">
                          <FaBox size={10} className="text-slate-400" />
                          {order.pcb_qty}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-end font-bold text-slate-900">
                        {order.confirmed_price ? (
                          <span className="text-blue-600">
                            ฿
                            {parseFloat(order.confirmed_price).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic font-medium">
                            Pending Quote
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-6">
                        <div className="flex justify-end gap-2">
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleShowModal(order.id)}
                              className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title={t.confirm}
                            >
                              <FaCheck size={14} />
                            </button>
                          )}
                          <Link
                            to={`/admin/cartcopypcblist/${order.id}/edit`}
                            className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title={t.edit}
                          >
                            <FaEdit size={14} />
                          </Link>
                          <Link
                            to={`/copycartpcb/${order.id}`}
                            className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title={t.detail}
                          >
                            <FaEye size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
              {filteredData.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-6 overflow-hidden relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaLayerGroup size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 m-0">
                          {order.projectname}
                        </h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ID: {order.id}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {t.qty}
                      </p>
                      <p className="text-sm font-bold text-slate-900 m-0">
                        {order.pcb_qty} Pcs
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {t.price}
                      </p>
                      <p className="text-sm font-bold text-blue-600 m-0">
                        {order.confirmed_price
                          ? `฿${parseFloat(order.confirmed_price).toLocaleString()}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleShowModal(order.id)}
                        className="flex-grow py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <FaCheck /> {t.confirm}
                      </button>
                    )}
                    <Link
                      to={`/admin/cartcopypcblist/${order.id}/edit`}
                      className="flex-grow py-3.5 rounded-2xl bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 no-underline"
                    >
                      <FaEdit /> {t.edit}
                    </Link>
                    <Link
                      to={`/copycartpcb/${order.id}`}
                      className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center no-underline"
                    >
                      <FaChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Container>

      {/* Modal */}
      <CopyPCBCartConfirmModle
        show={showModal}
        handleClose={handleCloseModal}
        pcborderId={selectedOrderId}
        onConfirm={() => {
          refetch();
          handleCloseModal();
        }}
      />

      {/* Custom Scoped Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif !important; }
        .form-select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"); }
      ` }} />
    </div>
  );
};

export default CopyPCBCartListScreen;
