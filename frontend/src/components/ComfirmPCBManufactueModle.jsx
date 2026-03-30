import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useUpdatePCBManufactureingMutation } from "../slices/orderpcbSlice";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

const ComfirmPCBManufactueModle = ({
  show,
  handleClose,
  pcborderId,
  onConfirm,
}) => {
  const [manufactureOrderNumber, setManufactureOrderNumber] = useState("");
  const [updatePCBManufactureing, { isLoading }] =
    useUpdatePCBManufactureingMutation();
  const { language } = useSelector((state) => state.language);

  const handleConfirm = async () => {
    if (pcborderId && manufactureOrderNumber) {
      try {
        await updatePCBManufactureing({
          pcborderId: String(pcborderId),
          manufactureOrderNumber,
        }).unwrap();
        toast.success("Order PCB confirmed as manufacturing");
        onConfirm();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to confirm manufacturing");
      }
    } else {
      toast.error("Manufacturing number is required");
    }

    setManufactureOrderNumber("");
    handleClose();
  };

  const translations = {
    en: {
      ComfirmOrdersLbl: "Confirm Manufacturing",
      ManufacturingNumberLbl: "Manufacturing Number",
      ManufacturingNumberPlaceHolder: "Enter Manufacturing Number",
      NotificationText1Lbl: "Are you sure you want to confirm this order as",
      NotificationText2Lbl: "in manufacturing process?",
      CloseLbl: "Close",
      DeliverLbl: "Confirm",
    },
    thai: {
      ComfirmOrdersLbl: "ยืนยันการผลิต",
      ManufacturingNumberLbl: "หมายเลขการผลิต",
      ManufacturingNumberPlaceHolder: "กรอกหมายเลขการผลิต",
      NotificationText1Lbl: "คุณแน่ใจหรือไม่ว่าต้องการยืนยันคำสั่งซื้อนี้ว่า",
      NotificationText2Lbl: "อยู่ในกระบวนการผลิต?",
      CloseLbl: "ปิด",
      DeliverLbl: "ยืนยัน",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Modal show={show} onHide={handleClose} title={t.ComfirmOrdersLbl}>
      <div className="p-6">
        <form className="mb-6 space-y-4">
          <Input
            label={t.ManufacturingNumberLbl}
            type="text"
            placeholder={t.ManufacturingNumberPlaceHolder}
            value={manufactureOrderNumber}
            onChange={(e) => setManufactureOrderNumber(e.target.value)}
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

export default ComfirmPCBManufactueModle;
