import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateStockFootprintMutation } from "../../../slices/stockFootprintApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// Custom Tailwind Components
import Input from "../../../components/ui/Input";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { FaSave, FaArrowLeft } from "react-icons/fa";

const StockCreateFootprintScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: categories = [], isLoading: isLoadingCategories } =
    useGetStockCategoriesQuery();
  const [createStockFootprint, { isLoading: isCreating }] =
    useCreateStockFootprintMutation();

  const [formData, setFormData] = useState({
    namefootprint: "",
    category: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.namefootprint || !formData.category) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createStockFootprint({
        ...formData,
        createuser: userInfo?.name || "Admin",
      }).unwrap();
      toast.success("Footprint created successfully");
      navigate("/admin/stock/footprints"); // Change to correct list path later if needed
    } catch (err) {
      toast.error(
        err?.data?.message || err.error || "Failed to create footprint",
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-pageFade">
      <Card>
        <CardHeader title="Create Footprint" />
        <CardBody>
          <form onSubmit={handleCreate} className="space-y-6">
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
                disabled={isCreating}
                className="px-4 md:px-6 py-2.5 rounded-xl font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    <FaSave size={16} /> Create Footprint
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

export default StockCreateFootprintScreen;
