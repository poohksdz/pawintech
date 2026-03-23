import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useUpdateDeliveryPCBOrderMutation } from '../slices/orderpcbSlice';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';

const ComfirmPCBDeliveryModle = ({ show, handleClose, pcborderId, onConfirm }) => {
  const [transferedNumber, setTransferedNumber] = useState('');
  const [updatePCBDelivery, { isLoading }] = useUpdateDeliveryPCBOrderMutation();
  const { language } = useSelector((state) => state.language);

  const handleConfirm = async () => {
    if (pcborderId && transferedNumber) {
      try {
        await updatePCBDelivery({ pcborderId: String(pcborderId), transferedNumber }).unwrap();
        toast.success('Order PCB marked as delivered');
        setTransferedNumber('');
        onConfirm();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to update delivery');
      }
    } else {
      toast.error('Transfered number is required');
    }

    setTransferedNumber('');
    handleClose();
  };

  const translations = {
    en: {
      ComfirmOrdersLbl: 'Confirm Delivery',
      transferedNumberLbl: 'Transfered Number',
      transferedNumberPlaceHolder: 'Enter Transfered Number',
      NotificationText1Lbl: 'Are you sure you want to confirm this order as',
      NotificationText2Lbl: 'already delivered?',
      CloseLbl: 'Close',
      DeliverLbl: 'Confirm',
    },
    thai: {
      ComfirmOrdersLbl: 'ยืนยันการจัดส่ง',
      transferedNumberLbl: 'หมายเลขการโอน (Tracking No.)',
      transferedNumberPlaceHolder: 'กรอกหมายเลข Tracking No.',
      NotificationText1Lbl: 'คุณแน่ใจหรือไม่ว่าต้องการยืนยันคำสั่งซื้อนี้ว่า',
      NotificationText2Lbl: 'ได้จัดส่งแล้ว?',
      CloseLbl: 'ปิด',
      DeliverLbl: 'ยืนยัน',
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      title={t.ComfirmOrdersLbl}
    >
      <div className="p-6">
        <form className="mb-6 space-y-4">
          <Input
            label={t.transferedNumberLbl}
            type="text"
            placeholder={t.transferedNumberPlaceHolder}
            value={transferedNumber}
            onChange={(e) => setTransferedNumber(e.target.value)}
          />
        </form>

        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200/50 mb-6">
          <p className="text-sm">
            {t.NotificationText1Lbl} <strong className="font-bold">{t.NotificationText2Lbl}</strong>
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {t.CloseLbl}
          </Button>
          <Button variant="warning" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? '...' : t.DeliverLbl}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ComfirmPCBDeliveryModle;
