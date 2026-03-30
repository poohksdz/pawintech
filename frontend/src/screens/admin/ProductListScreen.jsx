import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaBoxOpen,
  FaSync,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import Paginate from "../../components/Paginate";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from "../../slices/productsApiSlice";

const ProductListScreen = () => {
  const { pageNumber } = useParams();
  const { language } = useSelector((state) => state.language);

  // ================= STATE =================
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // ================= API CALLS =================
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    keyword: searchTerm,
    pageNumber: pageNumber || 1,
  });

  const [deleteProduct, { isLoading: loadingDelete }] =
    useDeleteProductMutation();

  // ================= TRANSLATIONS =================
  const t = {
    en: {
      title: "Products",
      subtitle: "Manage your catalog and inventory",
      searchPlaceholder: "Search products...",
      createBtn: "New Product",
      headers: {
        image: "Image",
        name: "Product Info",
        price: "Price",
        category: "Category",
        brand: "Brand",
        actions: "Actions",
      },
      modal: {
        title: "Delete Product",
        body: "Are you sure you want to delete this product? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Delete",
      },
      btn: { edit: "Edit", delete: "Delete", refresh: "Refresh" },
      noData: "No products found.",
    },
    thai: {
      title: "จัดการสินค้า",
      subtitle: "จัดการรายการสินค้าและคลังสินค้า",
      searchPlaceholder: "ค้นหาสินค้า...",
      createBtn: "เพิ่มสินค้า",
      headers: {
        image: "รูปภาพ",
        name: "ข้อมูลสินค้า",
        price: "ราคา",
        category: "หมวดหมู่",
        brand: "แบรนด์",
        actions: "จัดการ",
      },
      modal: {
        title: "ยืนยันการลบ",
        body: "คุณแน่ใจหรือไม่ที่จะลบสินค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
        cancel: "ยกเลิก",
        confirm: "ลบสินค้า",
      },
      btn: { edit: "แก้ไข", delete: "ลบ", refresh: "รีเฟรช" },
      noData: "ไม่พบรายการสินค้า",
    },
  }[language || "en"];

  // ================= HANDLERS =================
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct(productToDelete._id).unwrap();
      toast.success("Product deleted successfully");
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black py-8 px-4 md:px-8 font-['Prompt',sans-serif] text-slate-800 dark:text-white flex justify-center w-full transition-colors duration-500">
      <div className="w-full max-w-[1280px] flex flex-col gap-6">
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
            {/* Search Box */}
            <form
              onSubmit={handleSearch}
              className="w-full sm:w-[260px] relative"
            >
              <FaSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-9 pr-9 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-zinc-800 focus:border-slate-400 dark:focus:border-zinc-700 transition-all placeholder:text-slate-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      refetch();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all"
                  >
                    <FaTimes size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* Actions */}
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={refetch}
                className="flex items-center justify-center p-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors shadow-sm"
                title={t.btn.refresh}
              >
                <FaSync
                  className={isLoading ? "animate-spin text-slate-800" : ""}
                  size={14}
                />
              </button>
              <Link
                to="/admin/product/create"
                className="flex-1 sm:flex-none bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <FaPlus size={12} /> {t.createBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        {isLoading || loadingDelete ? (
          <div className="py-24 flex justify-center">
            <Loader />
          </div>
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || "Failed to load products"}
          </Message>
        ) : (
          <div className="flex flex-col gap-6">
            {/* ---------- DESKTOP TABLE VIEW ---------- */}
            <div className="hidden md:block bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-x-auto transition-colors duration-500">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-4 px-6 w-20 text-center">
                      {t.headers.image}
                    </th>
                    <th className="py-4 px-6">{t.headers.name}</th>
                    <th className="py-4 px-6">{t.headers.category}</th>
                    <th className="py-4 px-6">{t.headers.brand}</th>
                    <th className="py-4 px-6 text-right">{t.headers.price}</th>
                    <th className="py-4 px-6 text-center">
                      {t.headers.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  <AnimatePresence>
                    {data.products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-16 text-center text-slate-400"
                        >
                          <FaBoxOpen className="mx-auto text-4xl mb-3 opacity-50" />
                          <p>{t.noData}</p>
                        </td>
                      </tr>
                    ) : (
                      data.products.map((product) => (
                        <motion.tr
                          key={product._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* Image */}
                          <td className="py-3 px-6 text-center">
                            <div className="w-12 h-12 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden mx-auto shadow-sm p-1">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <FaImage className="text-slate-200 text-xl" />
                              )}
                            </div>
                          </td>

                          {/* Name & ID */}
                          <td className="py-3 px-6">
                            <div
                              className="font-semibold text-slate-900 dark:text-white mb-0.5 truncate max-w-[250px] lg:max-w-[400px]"
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {String(product._id).substring(0, 10)}...
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-6">
                            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium">
                              {product.category}
                            </span>
                          </td>

                          {/* Brand */}
                          <td className="py-3 px-6">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {product.brand}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-6 text-right font-semibold text-slate-900 dark:text-white">
                            ฿{Number(product.price).toLocaleString()}
                          </td>

                          {/* Actions - ปุ่มมีสีสันชัดเจน */}
                          <td className="py-3 px-6">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Link Button */}
                              <Link
                                to={`/admin/product/${product._id}/edit`}
                                className="w-9 h-9 flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                                title={t.btn.edit}
                              >
                                <FaEdit size={14} />
                              </Link>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteClick(product)}
                                className="w-9 h-9 flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                                title={t.btn.delete}
                              >
                                <FaTrash size={13} />
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

            {/* ---------- MOBILE CARD VIEW ---------- */}
            <div className="md:hidden flex flex-col gap-4">
              <AnimatePresence>
                {data.products.length === 0 ? (
                  <div className="py-16 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl text-center text-slate-400 flex flex-col items-center">
                    <FaBoxOpen className="text-4xl mb-3 opacity-50" />
                    <p className="text-sm">{t.noData}</p>
                  </div>
                ) : (
                  data.products.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={product._id}
                      className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Image */}
                        <div className="w-16 h-16 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-lg flex items-center justify-center shrink-0 shadow-sm p-1.5">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FaImage className="text-slate-200 text-2xl" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 overflow-hidden">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mb-2">
                            ID: {String(product._id).substring(0, 8)}...
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            ฿{Number(product.price).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-medium">
                          {product.category}
                        </span>
                        <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md text-[11px] font-medium">
                          {product.brand}
                        </span>
                      </div>

                      {/* Mobile Actions - ปุ่มมีสีสันชัดเจน */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <Link
                          to={`/admin/product/${product._id}/edit`}
                          className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FaEdit size={13} /> {t.btn.edit}
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="flex-1 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FaTrash size={12} /> {t.btn.delete}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* ---------- PAGINATION ---------- */}
            {data.pages > 1 && (
              <div className="flex justify-center mt-4">
                <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 px-5 py-2 rounded-xl shadow-sm">
                  <Paginate
                    pages={data.pages}
                    page={data.page}
                    isAdmin={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= DELETE MODAL (Portal) ================= */}
      {typeof document !== "undefined" &&
        document.body &&
        createPortal(
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                {/* Modal Box */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                >
                  <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaTrash size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {t.modal.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                      {t.modal.body}
                    </p>

                    {/* Product Mini Preview */}
                    {productToDelete && (
                      <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl mb-2 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg flex items-center justify-center shrink-0 p-1">
                          {productToDelete.image ? (
                            <img
                              src={productToDelete.image}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                          ) : (
                            <FaImage className="text-slate-300" />
                          )}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="font-semibold text-slate-800 dark:text-white text-xs truncate">
                            {productToDelete.name}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                            ฿{Number(productToDelete.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-3.5 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors border-r border-slate-100"
                    >
                      {t.modal.cancel}
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="flex-1 py-3.5 text-rose-600 font-medium text-sm hover:bg-rose-100 transition-colors"
                    >
                      {t.modal.confirm}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default ProductListScreen;
