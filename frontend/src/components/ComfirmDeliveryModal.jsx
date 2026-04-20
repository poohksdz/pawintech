import { useState } from "react";
import { useSelector } from "react-redux";
import { useDeliverOrderMutation } from "../slices/ordersApiSlice";
import { toast } from "react-toastify";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

const ComfirmDeliveryModal = ({ show, handleClose, orderId, onConfirm }) => {
  const [deliverOrder, { isLoading }] = useDeliverOrderMutation();
  const [transferedNumber, setTransferedNumber] = useState("");

  const handleConfirm = async () => {
    if (orderId && transferedNumber) {
      try {
        // Pass the transferedNumber along with the orderId
        await deliverOrder({
          orderId: String(orderId),
          transferedNumber,
        }).unwrap();
        toast.success("Order confirmed as delivered");
        onConfirm(); // Callback to refresh or update the UI
      } catch (error) {
        toast.error(error?.data?.message || "Failed to confirm order");
      }
    } else {
      toast.error("Order transfered number are required");
    }
    handleClose();
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
    <Modal isOpen={show} onClose={handleClose} title={t.ComfirmOrdersLbl}>
      <div className="p-4 md:p-6">
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
            {t.NotificationText1Lbl}{" "}
            <strong className="font-bold">{t.NotificationText2Lbl}</strong>
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t.CloseLbl}
          </Button>
          <Button
            variant="warning"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "..." : t.DeliverLbl}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ComfirmDeliveryModal;
