import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, Modal, Form } from "react-bootstrap";
import { useUpdateDeliverycopyPCBMutation } from "../../slices/copypcbApiSlice";
import { toast } from "react-toastify";

const CopyPCBCartDeliveryModle = ({
  show,
  handleClose,
  orderId,
  onConfirm,
}) => {
  const [updateDeliverycopyPCB] = useUpdateDeliverycopyPCBMutation();
  const [transferedNumber, setTransferedNumber] = useState("");

  const handleConfirm = async () => {
    if (!orderId || !transferedNumber) {
      toast.error("Order transferred number is required");
      return;
    }
    try {
      await updateDeliverycopyPCB({
        pcborderId: orderId,
        transferedNumber,
      }).unwrap();
      toast.success("Order confirmed as delivered");
      setTransferedNumber("");
      onConfirm();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to confirm order");
    } finally {
      handleClose();
    }
  };

  const { language } = useSelector((state) => state.language);

  // Translation object
  const translations = {
    en: {
      ComfirmOrdersLbl: "Confirm Order",
      transferedNumberLbl: "Transfered Number",
      transferedNumberPlaceHolder: "Enter Transfered Number",
      NotificationText1Lbl: "Are you sure you want to confirm this order as",
      NotificationText2Lbl: "already delivered?",
      CloseLbl: "Close",
      DeliverLbl: "Delivery",
    },
    thai: {
      ComfirmOrdersLbl: "ยืนยันคำสั่งซื้อ",
      transferedNumberLbl: "หมายเลขที่โอน",
      transferedNumberPlaceHolder: "กรอกหมายเลขที่โอน",
      NotificationText1Lbl: "คุณแน่ใจหรือไม่ว่าต้องการยืนยันคำสั่งซื้อนี้ว่า",
      NotificationText2Lbl: "ได้จัดส่งแล้ว?",
      CloseLbl: "ปิด",
      DeliverLbl: "การจัดส่ง",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Modal show={show} onHide={handleClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{t.ComfirmOrdersLbl}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="transferedNumber">
            <Form.Label>{t.transferedNumberLbl}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t.transferedNumberPlaceHolder}
              value={transferedNumber}
              onChange={(e) => setTransferedNumber(e.target.value)}
            />
          </Form.Group>
        </Form>
        <p>
          {t.NotificationText1Lbl} <strong>{t.NotificationText2Lbl}</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={handleClose}>
          {t.CloseLbl}
        </Button>
        <Button variant="warning" onClick={handleConfirm}>
          {t.DeliverLbl}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CopyPCBCartDeliveryModle;
