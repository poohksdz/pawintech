import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaSave,
  FaPlus,
  FaFileInvoiceDollar,
  FaRegBuilding,
  FaListAlt,
  FaHashtag,
  FaTag,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";
import { PiReceiptFill } from "react-icons/pi";
import { useCreateInvoiceMutation } from "../../slices/invoicesApiSlice";
import Loader from "../../components/Loader";

const InvoiceSetScreen = () => {
  const navigate = useNavigate();
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();

  const [formData, setFormData] = useState({
    branch_name: "",
    description: "",
    qty: "",
    unit: "",
    unit_price: "",
    grand_total: "",
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    userId: 1, // Default or select from users
  });

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };

    // Auto-calculate grand total if qty and price are present
    if (field === "qty" || field === "unit_price") {
      const q = field === "qty" ? value : formData.qty;
      const p = field === "unit_price" ? value : formData.unit_price;
      if (q && p) {
        updated.grand_total = (parseFloat(q) * parseFloat(p)).toFixed(2);
      }
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvoice(formData).unwrap();
      toast.success("Invoice created successfully");
      navigate("/admin/invoicelist");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create invoice");
    }
  };

  const InputField = ({
    label,
    icon: Icon,
    value,
    onChange,
    type = "text",
    placeholder = "",
    required = true,
    step = "any",
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
        <Icon size={12} className="text-slate-400" />
        {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 pt-6 px-4 md:px-8 font-prompt">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link
          to="/admin/invoicelist"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all">
            <FaArrowLeft size={12} />
          </div>
          Back to List
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-2"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-lg mb-2">
            <FaPlus size={20} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Create New Invoice
          </h1>
          <p className="text-slate-500 font-medium">
            Issue a new billing record for a project or service
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-4 md:p-8 md:p-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Basic Info Section */}
              <div className="space-y-8">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                    01
                  </span>
                  General Information
                </h2>

                <InputField
                  label="Branch Name"
                  icon={FaRegBuilding}
                  value={formData.branch_name}
                  onChange={(val) => handleChange("branch_name", val)}
                  placeholder="e.g. Bangkok Main Branch"
                />

                <InputField
                  label="Customer Name"
                  icon={FaFileInvoiceDollar}
                  value={formData.customerName}
                  onChange={(val) => handleChange("customerName", val)}
                  placeholder="Client or Company name"
                />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    <FaListAlt size={12} className="text-slate-400" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Provide details about the service or product..."
                    rows="4"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
                  />
                </div>
              </div>

              {/* Pricing & Details Section */}
              <div className="space-y-8">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                    02
                  </span>
                  Billing Details
                </h2>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <InputField
                    label="Quantity"
                    icon={FaHashtag}
                    type="number"
                    value={formData.qty}
                    onChange={(val) => handleChange("qty", val)}
                    placeholder="0"
                  />
                  <InputField
                    label="Unit"
                    icon={FaTag}
                    value={formData.unit}
                    onChange={(val) => handleChange("unit", val)}
                    placeholder="pcs/set"
                  />
                </div>

                <InputField
                  label="Unit Price"
                  icon={FaMoneyBillWave}
                  type="number"
                  value={formData.unit_price}
                  onChange={(val) => handleChange("unit_price", val)}
                  placeholder="0.00"
                />

                <div className="pt-4 border-t border-slate-50">
                  <InputField
                    label="Grand Total (Calculated)"
                    icon={FaMoneyBillWave}
                    type="number"
                    value={formData.grand_total}
                    onChange={(val) => handleChange("grand_total", val)}
                    placeholder="0.00"
                  />
                </div>

                <InputField
                  label="Invoice Date"
                  icon={FaCalendarAlt}
                  type="date"
                  value={formData.date}
                  onChange={(val) => handleChange("date", val)}
                />
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-end">
              <Link
                to="/admin/invoicelist"
                className="w-full md:w-auto px-4 md:px-8 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-4 md:px-10 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size="sm" /> Creating...
                  </>
                ) : (
                  <>
                    <FaSave /> Create Invoice
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif; }
      ` }} />
    </div>
  );
};

export default InvoiceSetScreen;
