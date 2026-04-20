import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetStockFootprintDetailsQuery,
  useUpdateStockFootprintMutation,
} from "../../../slices/stockFootprintApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import Loader from "../../../components/Loader";
import Message from "../../../components/Message";

// Custom Tailwind Components
import Input from "../../../components/ui/Input";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { FaSave, FaArrowLeft, FaSyncAlt } from "react-icons/fa";

const StockEditFootprintScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: footprint,
    isLoading,
    error,
  } = useGetStockFootprintDetailsQuery(id);
  const { data: categories = [], isLoading: isLoadingCategories } =
    useGetStockCategoriesQuery();

  const [updateStockFootprint, { isLoading: isUpdating }] =
    useUpdateStockFootprintMutation();

  const [formData, setFormData] = useState({
    namefootprint: "",
    category: "",
  });

  useEffect(() => {
    if (footprint) {
      setFormData({
        namefootprint: footprint.namefootprint || "",
        category: footprint.category || "",
      });
    }
  }, [footprint]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.namefootprint || !formData.category) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateStockFootprint({
        id,
        ...formData,
        createuser: userInfo?.name || footprint?.createuser || "Admin",
      }).unwrap();
      toast.success("Footprint updated successfully");
      navigate(-1); // Go back to footprint list or previous page
    } catch (err) {
      toast.error(
        err?.data?.message || err.error || "Failed to update footprint",
      );
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="max-w-3xl mx-auto py-4 md:py-6 md:py-10 px-4">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-pageFade">
      <Card>
        <CardHeader title={`Edit Footprint: ${footprint?.footprintID || id}`} />
        <CardBody>
          <form onSubmit={handleUpdate} className="space-y-6">
            <Input
              label="Footprint Name"
              name="namefootprint"
              value={formData.namefootprint}
              onChange={handleChange}
              placeholder="e.g. 0805, 1206..."
              required
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 tracking-wide">
                Category
              </label>
              <select
                name="category"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 font-medium bg-white appearance-none"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isLoadingCategories}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.ID} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 md:px-6 py-2.5 rounded-xl font-bold bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <FaArrowLeft size={14} /> Back
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 md:px-6 py-2.5 rounded-xl font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <FaSyncAlt size={14} className="animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <FaSave size={16} /> Update Footprint
                  </>
                )}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default StockEditFootprintScreen;
