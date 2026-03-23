import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrashAlt, FaCheckCircle, FaBoxOpen, FaArrowLeft, FaArrowRight, FaMinus, FaPlus
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { useCreateStockIssueMutation, useGetStockIssueQuery } from '../../../slices/stockIssueApiSlice';
import { useGetStockRequestQuery } from '../../../slices/stockRequestApiSlice';
import { removeStockFromIssueCart } from '../../../slices/stockIssueCartApiSlice';
import { useGetStockProductsQuery } from '../../../slices/stockProductApiSlice';
import { createPortal } from 'react-dom';

const StockListForIssueScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth);

  const stockIssueCartState = useSelector(state => state.stockissuecart);
  const stockissuecartItems = useMemo(() => stockIssueCartState.stockissuecartItems || [], [stockIssueCartState]);

  const [issueqty, setIssueqty] = useState({});
  const [issuenote, setIssuenote] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showIssueConfirm, setShowIssueConfirm] = useState(false);

  const { refetch: refetchExistingQty } = useGetStockProductsQuery();
  const { refetch: refetchStockIssues } = useGetStockIssueQuery();
  const { refetch: refetchStocks } = useGetStockRequestQuery();
  const [createStockIssue, { isLoading }] = useCreateStockIssueMutation();

  useEffect(() => {
    const initialQty = {};
    const initialNotes = {};
    const initialSelected = [];
    stockissuecartItems.forEach(item => {
      initialQty[item.ID] = item.requestqty ?? 1;
      initialNotes[item.ID] = item.note ?? '';
      initialSelected.push(item.ID);
    });
    setIssueqty(initialQty);
    setIssuenote(initialNotes);
    setSelectedItems(initialSelected);
  }, [stockissuecartItems]);

  const toggleSelect = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === stockissuecartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(stockissuecartItems.map(item => item.ID));
    }
  };

  const updateIssueQty = (item, newQty) => {
    const val = Math.max(Number(newQty), 0);
    setIssueqty(prev => ({ ...prev, [item.ID]: val }));
  };

  const updateIssueNote = (item, note) => {
    setIssuenote(prev => ({ ...prev, [item.ID]: note }));
  };

  const issueNowHandler = async () => {
    try {
      const itemsToIssue = stockissuecartItems
        .filter(item => selectedItems.includes(item.ID))
        .map(item => ({
          ...item,
          issueqty: issueqty[item.ID] ?? 0,
          note: issuenote[item.ID] ?? ''
        }));

      if (itemsToIssue.length === 0) {
        toast.error("Please select items to issue.", { position: 'bottom-right' });
        return;
      }

      await createStockIssue({
        items: itemsToIssue,
        issueUser: userInfo.name,
        userId: userInfo._id
      }).unwrap();

      itemsToIssue.forEach(item => {
        dispatch(removeStockFromIssueCart(item.ID));
      });

      toast.success("Successfully issued selected items!");
      await Promise.all([refetchStockIssues(), refetchStocks(), refetchExistingQty()]);

      if (stockissuecartItems.length === itemsToIssue.length) {
        navigate('/componentrequestlist');
      }

    } catch (error) {
      toast.error(error?.data?.message || "Failed to issue items");
    }
  };

  const removeHandler = id => { setItemToRemove(id); setShowConfirmModal(true); };
  const confirmRemove = () => { if (itemToRemove) dispatch(removeStockFromIssueCart(itemToRemove)); setShowConfirmModal(false); };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader /></div>;

  const totalIssueQty = Object.entries(issueqty)
    .filter(([id]) => selectedItems.includes(Number(id) || id)) // Handle string/num ID matches if necessary
    .reduce((a, [, b]) => a + Number(b), 0);

  return (
    <div className="font-sans text-gray-800 bg-white min-h-[600px] py-10 px-4 md:px-8 flex justify-center w-full text-start">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-0 border border-gray-200/60 shadow-sm rounded-md overflow-hidden bg-white">

        {/* 🔴 Left Column: Cart Items */}
        <div className="flex-1 p-6 md:p-8 bg-white text-start">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 border-b border-gray-200 pb-6">
            <h1 className="text-[18px] font-black text-gray-900 uppercase tracking-tight">Component Issue Cart</h1>
          </div>

          <div className="hidden md:grid grid-cols-12 pb-3 mb-6 border-b border-gray-100 text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold items-center">
            <div className="col-span-8 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === stockissuecartItems.length && stockissuecartItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer accent-black"
              />
              <span>Component Info</span>
            </div>
            <div className="col-span-4 text-center">Issue Units</div>
          </div>

          <div className="space-y-6 min-h-[350px]">
            <AnimatePresence>
              {stockissuecartItems.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center justify-center">
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-[14px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Your issue cart is empty</h3>
                  <Link to="/componentrequestlist" className="text-gray-500 hover:text-black mt-4 tracking-wide uppercase font-bold text-[12px] flex items-center gap-2 transition-colors">
                    <FaArrowLeft size={10} /> Back to Requests
                  </Link>
                </motion.div>
              ) : (
                stockissuecartItems.map((p) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={p.ID}
                    className={`border p-5 rounded-md relative group transition-all duration-300 ${selectedItems.includes(p.ID) ? 'border-gray-800 shadow-sm bg-gray-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-center">

                      {/* 1. Part Info */}
                      <div className="col-span-1 md:col-span-8 flex gap-4 items-start md:items-center w-full">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(p.ID)}
                          onChange={() => toggleSelect(p.ID)}
                          className="w-4 h-4 mt-8 md:mt-0 cursor-pointer accent-black shrink-0 relative z-10"
                        />
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-[#f3f4f6] shrink-0 flex items-center justify-center overflow-hidden rounded-md border border-gray-100 p-2 relative">
                          {p.img ? (
                            <img src={`/componentImages${p.img}`} alt={p.electotronixPN} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <FaBoxOpen size={30} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col pt-1 text-start w-full overflow-hidden">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[14px] font-bold text-gray-900 uppercase leading-snug truncate pr-4">
                              {p.electotronixPN}
                            </span>
                            <button
                              onClick={() => removeHandler(p.ID)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0 bg-white border border-gray-200 hover:border-red-200 rounded-sm shadow-sm"
                              title="Remove"
                            >
                              <FaTrashAlt size={12} />
                            </button>
                          </div>

                          <span className="text-[12px] text-gray-500 font-medium leading-relaxed mb-3 line-clamp-1 truncate">{p.description || "No description provided"}</span>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-sm shadow-sm text-[11px] font-bold uppercase tracking-wider">
                              Req {p.requestno}
                            </span>
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-sm shadow-sm text-[11px] font-bold uppercase tracking-wider">
                              Target {p.requestqty}
                            </span>
                          </div>

                          <div className="w-full max-w-sm mt-auto relative">
                            <input
                              type="text"
                              className="w-full bg-white border border-gray-200 py-2.5 px-3 pb-2 text-[12px] font-medium text-gray-700 rounded-sm outline-none focus:border-black transition-colors shadow-sm"
                              placeholder="Add related issue note..."
                              value={issuenote[p.ID] ?? ''}
                              onChange={e => updateIssueNote(p, e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 pointer-events-none uppercase tracking-widest font-bold">
                              Note
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Quantity Control */}
                      <div className="col-span-1 md:col-span-4 flex md:justify-center items-center mt-2 md:mt-0 ml-8 md:ml-0">
                        <div className="flex w-[120px] h-[40px] border border-gray-300 rounded-sm overflow-hidden bg-white shadow-sm">
                          <button
                            onClick={() => updateIssueQty(p, Number(issueqty[p.ID]) - 1)}
                            disabled={issueqty[p.ID] <= 0}
                            className="w-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 bg-white border-r border-gray-300 disabled:opacity-30 transition-colors"
                          >
                            <FaMinus size={10} />
                          </button>
                          <input
                            type="number"
                            value={issueqty[p.ID] ?? ''}
                            onChange={e => updateIssueQty(p, e.target.value)}
                            className="flex-1 w-full text-center text-[14px] font-bold text-gray-900 bg-transparent outline-none border-none hide-scrollbar"
                          />
                          <button
                            onClick={() => updateIssueQty(p, Number(issueqty[p.ID]) + 1)}
                            className="w-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 bg-white border-l border-gray-300 transition-colors"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 flex flex-col sm:flex-row gap-6">
            <button onClick={() => navigate(-1)} className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2 w-fit">
              <FaArrowLeft size={10} /> Back to dashboard
            </button>
          </div>
        </div>

        {/* 🔵 Right Column: Summary */}
        <div className="w-full lg:w-[350px] bg-[#f8f8f8] p-6 lg:p-8 shrink-0 flex flex-col text-start border-t lg:border-t-0 lg:border-l border-gray-200/50">
          <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-6">Issue Summary</h2>

          <button
            onClick={() => setShowIssueConfirm(true)}
            disabled={selectedItems.length === 0}
            className={`w-full py-4 mb-8 rounded-md text-[13px] font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-3 ${selectedItems.length > 0 ? 'bg-[#222] text-white hover:bg-black border border-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
              }`}
          >
            Confirm Issue <FaArrowRight size={12} />
          </button>

          <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4 text-[13px] border-b border-gray-200/60 pb-4">
              <span className="text-gray-500 uppercase tracking-wider font-bold">Selected Items</span>
              <span className="text-gray-900 font-bold bg-white border border-gray-200 shadow-sm px-2.5 py-0.5 rounded-sm">{selectedItems.length}</span>
            </div>
            <div className="flex justify-between items-center mb-10 text-[13px]">
              <span className="text-gray-500 uppercase tracking-wider font-bold">Total Units Issued</span>
              <span className="text-gray-900 font-black text-[24px] tracking-tighter">{totalIssueQty.toLocaleString()}</span>
            </div>

            <div className="mt-auto">
              <div className="bg-white border border-dashed border-gray-300 rounded-sm p-6 shadow-sm">
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                  <strong className="text-gray-900 uppercase tracking-widest block mb-2 text-[10px]">Issue Policy</strong>
                  Once confirmed, stock quantities will be permanently deducted based on the values provided above.
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  Ensure all quantities and components are correct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals using Portal */}
      {typeof document !== 'undefined' && document.body && createPortal(
        <AnimatePresence>
          {showIssueConfirm && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIssueConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-sm shadow-2xl w-full max-w-sm p-8 text-center border-t-4 border-black font-sans">
                <div className="mx-auto w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-6">
                  <FaCheckCircle className="text-green-600 text-3xl" />
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2 uppercase tracking-tight">Confirm Issuance</h3>
                <p className="text-[14px] text-gray-500 mb-8 font-medium">You are about to perfectly issue <strong className="text-black bg-gray-100 px-1 rounded">{selectedItems.length}</strong> selected component(s) from inventory.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowIssueConfirm(false)} className="flex-1 py-3.5 border border-gray-300 bg-white text-gray-800 font-bold text-[13px] uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm shadow-sm">Cancel</button>
                  <button onClick={() => { setShowIssueConfirm(false); issueNowHandler(); }} className="flex-1 py-3.5 border border-black bg-[#222] text-white font-bold text-[13px] uppercase tracking-widest hover:bg-black transition-colors shadow-sm rounded-sm">Confirm</button>
                </div>
              </motion.div>
            </div>
          )}

          {showConfirmModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-sm shadow-2xl w-full max-w-sm p-8 text-center border-t-4 border-black font-sans">
                <div className="mx-auto w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <FaTrashAlt className="text-red-500 text-2xl" />
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2 uppercase tracking-tight">Remove Item</h3>
                <p className="text-[14px] text-gray-500 mb-8 font-medium">Are you sure you want to remove this item from the issue list?</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3.5 border border-gray-300 bg-white text-gray-800 font-bold text-[13px] uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm shadow-sm">Cancel</button>
                  <button onClick={confirmRemove} className="flex-1 py-3.5 border border-red-600 bg-red-600 text-white font-bold text-[13px] uppercase tracking-widest hover:bg-red-700 hover:border-red-700 transition-colors shadow-sm rounded-sm">Remove</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style>{`
            .hide-scrollbar::-webkit-inner-spin-button, 
            .hide-scrollbar::-webkit-outer-spin-button { 
               -webkit-appearance: none; 
               margin: 0; 
            }
         `}</style>
    </div>
  );
};

export default StockListForIssueScreen;