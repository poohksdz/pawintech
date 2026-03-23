import { Modal, Button, Spinner } from 'react-bootstrap';
import { usePayOrderMutation } from '../slices/ordersApiSlice';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ConfirmPayModal = ({ show, handleClose, orderId, onConfirm }) => {
  const [payOrder, { isLoading }] = usePayOrderMutation();

  const handleConfirmPaid = async () => {
    if (!orderId) return;

    try {
      // ✅ ส่งข้อมูลแบบ Object ตามที่ Slice ต้องการ
      await payOrder({ 
          orderId, 
          details: { payer: 'Admin Manual Verify' } 
      }).unwrap();
      
      toast.success('Payment Verified Successfully! (ยืนยันยอดเงินแล้ว)');
      
      if (onConfirm) onConfirm();
      handleClose();
    } catch (error) {
      toast.error(error?.data?.message || error.error || 'ยืนยันไม่สำเร็จ');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered animation={true}>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-success d-flex align-items-center">
            <FaCheckCircle className="me-2" /> Confirm Payment
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="text-center py-4">
        <FaExclamationTriangle className="text-warning mb-3" size={40} />
        <p className="mb-2 text-secondary">
            Are you sure you want to mark Order 
            {/* 👇👇 แก้ไขตรงนี้ครับ ใส่เช็คว่ามี orderId ก่อนค่อย substring 👇👇 */}
            <strong className="text-dark mx-1">
                #{orderId ? orderId.toString().substring(0, 8) : '...'}
            </strong> 
            as paid?
        </p>
        <p className="small text-muted">
            (คุณกำลังยืนยันว่าได้รับเงินโอนถูกต้องแล้ว สถานะจะเปลี่ยนเป็น <span className="text-success fw-bold">Paid</span>)
        </p>
      </Modal.Body>
      
      <Modal.Footer className="border-0 justify-content-center pb-4">
        <Button variant="light" onClick={handleClose} className="rounded-pill px-4 border" disabled={isLoading}>
          <FaTimes className="me-1"/> Cancel
        </Button>
        <Button variant="success" onClick={handleConfirmPaid} className="rounded-pill px-4 fw-bold shadow-sm" disabled={isLoading}>
          {isLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2"/>Processing...</> : 'Yes, Confirm Paid'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmPayModal;