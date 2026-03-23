import React, {useState} from 'react';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import Message from '../../components/Message'; 
import { Table, Button, Row, Col } from 'react-bootstrap';
import { PiCircuitryFill } from 'react-icons/pi';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom'; 
import { useGetAllAssemblyPCBsQuery  } from '../../slices/assemblypcbApiSlice';
import { useNavigate } from 'react-router-dom'; 

import OrderassemblyDelieveryModle from './OrderassemblyDelieveryModle'; 


const OrderassemblyOrderListScreen = () => {
    const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
 
  const {
    data,
    isLoading,
    error,
    refetch,  
  } = useGetAllAssemblyPCBsQuery( ); 

  // State for modal visibility and selected order id
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

const { language } = useSelector((state) => state.language);

const translations = {
  en: {
    AssemblyOrderListsLbl: 'Assembly PCB Order Lists',
    ErrorMessageLbl: 'No custom PCB orders found.',
    projectIDLbl: 'Project ID',
    projectnameLbl: 'Project Name',
    QtyLbl: 'Quantity',
    TotalPriceLbl: 'Total Price (฿)',
    DATELbl: 'Date',
    DeliveryLbl: 'Delivery',
    ConfirmLbl: 'Confirm',
    CancelLbl: 'Cancel',
    DetailLbl: 'Details',
    DefaultAssemblyPrice: 'Default Assembly Price',
  },
  thai: {
    AssemblyOrderListsLbl: 'รายการคำสั่งซื้อ PCB แบบกำหนดเอง',
    ErrorMessageLbl: 'ไม่พบคำสั่งซื้อ PCB แบบกำหนดเอง',
    projectIDLbl: 'รหัสโปรเจกต์', 
    projectnameLbl: 'ชื่อโปรเจกต์',
    QtyLbl: 'จำนวน',
    TotalPriceLbl: 'ราคารวม (฿)',
    DATELbl: 'วันที่',
    DeliveryLbl: 'การจัดส่ง',
    ConfirmLbl: 'ยืนยัน',
    CancelLbl: 'ยกเลิก',
    DetailLbl: 'รายละเอียด',
    DefaultAssemblyPrice: 'ราคาการประกอบมาตรฐาน',
  },
};

const t = translations[language] || translations.en; 

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.AssemblyOrderListsLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" as={Link} to='/admin/assemblyboardeditd'>
            <PiCircuitryFill size={20} /> {t.DefaultAssemblyPrice}
          </Button>
        </Col>
      </Row>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      ) : Array.isArray(data?.data) && data.data.length === 0 ? (
        <Message variant="info">{t.ErrorMessageLbl}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>#</th>
              <th>{t.projectIDLbl}</th>
              <th>{t.projectnameLbl}</th>
              <th>{t.QtyLbl}</th>
              <th>{t.TotalPriceLbl}</th>
              <th>{t.DATELbl}</th> 
              <th>{t.DeliveryLbl}</th>
              <th></th>
            </tr> 
          </thead>
          <tbody> 
           {data.data.map((order, index) => (
  <tr key={order.id}>
    <td>{index + 1}</td>
        <td>
          <Button
            size="sm"
            variant="success"
            className="text-white"
            onClick={() => navigate(`/reorderassemblypcb/${order.orderID}/set`)}
          >
            Reorder
          </Button>
        </td>
    <td>{order.orderID}</td>
    <td>{order.projectname}</td>
    <td>{order.pcb_qty}</td>
    <td>{order.confirmed_price ? parseFloat(order.confirmed_price).toFixed(2) : '-'}</td>
    <td>{new Date(order.created_at).toLocaleDateString()}</td>

    <td className="text-center">
       {order.isDelivered ? (
                          <FaCheck style={{ color: 'green' }} />
                        ) : (
                          <Button
        variant="light"
        className="btn-sm btn-lime"
        onClick={() => handleShowModal(order.id)}
      >
        {t.ConfirmLbl}
      </Button>
                        )}
      
    </td>

    <td className="text-center">
      <Button
                            as={Link}
                            to={`/assemblypcb/${order.id}`}
                            variant="light"
                            className="btn-sm"
                          >
                            {t.DetailLbl}
                          </Button>
    </td>
  </tr>
))}
          </tbody>
        </Table>
      )}

     {/* Modal Component */}
      <OrderassemblyDelieveryModle
  show={showModal}
  handleClose={handleCloseModal}
  orderId={selectedOrderId}  // change from pcborderId to orderId
  onConfirm={() => {
    refetch();
    handleCloseModal();
  }}
/>

    </>
  );
};
 

export default OrderassemblyOrderListScreen