import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetStockCategoryDetailsQuery, useUpdateStockCategoryMutation } from '../../../slices/stockCategoryApiSlice';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';

// Custom Tailwind Components
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { RefreshCw } from 'lucide-react';

const StockEditCategoryScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetStockCategoryDetailsQuery(id);
  const [updateStockCategory, { isLoading: isUpdating, error: updateError }] = useUpdateStockCategoryMutation();

  const [formData, setFormData] = useState({
    category: '',
    createuser: ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        category: data.category,
        createuser: data.createuser
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateStockCategory({ id, ...formData });
  };

  if (isLoading) return <div className="mt-8 flex justify-center"><Loader /></div>;
  if (error) return <div className="mt-8"><Message variant="danger">{error?.data?.message || error.error}</Message></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pageFade">
      <Card>
        <CardHeader title="Edit Category" />
        <CardBody>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Category Name"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />

            <Input
              label="Create User"
              name="createuser"
              value={formData.createuser}
              onChange={handleChange}
            />

            <div className="pt-4 flex items-center gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? <><RefreshCw className="animate-spin mr-2" size={18} /> Updating...</> : 'Update Category'}
              </Button>
              <Button
                type="button"
                variant="light"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
            </div>

            {updateError && (
              <div className="pt-4">
                <Message variant="danger">{updateError?.data?.message || updateError.error}</Message>
              </div>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default StockEditCategoryScreen;
