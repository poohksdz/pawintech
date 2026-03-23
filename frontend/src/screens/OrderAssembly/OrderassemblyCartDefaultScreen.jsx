import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, ListGroup, Button, Form } from 'react-bootstrap';
import {
  useGetAssemblycartDefaultQuery,
  useUpdateAssemblycartDefaultByIdMutation,
} from '../../slices/assemblypcbCartApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';

const OrderassemblyCartDefaultScreen = () => {
  const { data, isLoading, error } = useGetAssemblycartDefaultQuery();
  const [updateAssemblycartDefaultById, { isLoading: isUpdating }] =
    useUpdateAssemblycartDefaultByIdMutation();

  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({
    smd_price: '',
    tht_price: '',
    stencil_price: '',
    setup_price: '',
    delivery_price: '',
  });

  useEffect(() => {
    if (data?.data) {
      setFormState({
        smd_price: data.data.smd_price || '',
        tht_price: data.data.tht_price || '',
        stencil_price: data.data.stencil_price || '',
        setup_price: data.data.setup_price || '',
        delivery_price: data.data.delivery_price || '',
      });
    }
  }, [data]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateAssemblycartDefaultById({
        id: data.data.id,
        updatedData: formState,
      }).unwrap();
      setEditMode(false);
      toast.success('Updated successfully');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  // Internationalization setup
  const { language } = useSelector((state) => state.language);
   
  const translations = {
  en: {
    DefaultAssemblyPricesLbl: 'Default Assembly Prices',
    EditPrices: 'Edit Prices',
    SaveChanges: 'Save Changes',
    Cancel: 'Cancel',
    fieldLabels: {
      smd_price: 'SMD PRICE',
      tht_price: 'THT PRICE',
      stencil_price: 'STENCIL PRICE',
      setup_price: 'SETUP PRICE',
      delivery_price: 'DELIVERY PRICE',
    },
  },
  thai: {
    DefaultAssemblyPricesLbl: 'ราคาประกอบ PCB เริ่มต้น',
    EditPrices: 'แก้ไขราคา',
    SaveChanges: 'บันทึกการเปลี่ยนแปลง',
    Cancel: 'ยกเลิก',
    fieldLabels: {
      smd_price: 'ราคาประกอบ SMD',
      tht_price: 'ราคาประกอบ THT',
      stencil_price: 'ราคาสตีนซิล',
      setup_price: 'ราคาเซ็ทอัพ',
      delivery_price: 'ราคาค่าจัดส่ง',
    },
  },
};

  const t = translations[language] || translations.en;

  return (
    <>
      <h1>{t.DefaultAssemblyPricesLbl}</h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error?.data?.message || error.error}</Message>
      ) : (
        <>
          <Card className="p-3">
            <ListGroup variant="flush">
  {['smd_price', 'tht_price', 'stencil_price', 'setup_price', 'delivery_price'].map((field) => (
    <ListGroup.Item key={field}>
      <Row>
        <Col>{t.fieldLabels[field]}</Col>
        <Col>
          {editMode ? (
            <Form.Control
              type="number"
              step="0.01"
              value={formState[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          ) : (
            `$${parseFloat(formState[field] || 0).toFixed(2)}`
          )}
        </Col>
      </Row>
    </ListGroup.Item>
  ))}
</ListGroup>

          </Card>

          <div className="mt-3 d-flex justify-content-end">
            {editMode ? (
              <>
                <Button
                  variant="warning"
                  onClick={handleSubmit}
                  disabled={isUpdating}
                  className="me-2"
                >
                  {isUpdating ? 'Saving...' : t.SaveChanges}
                </Button>
                <Button variant="light" onClick={() => setEditMode(false)}>
                  {t.Cancel}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>{t.EditPrices}</Button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default OrderassemblyCartDefaultScreen;
