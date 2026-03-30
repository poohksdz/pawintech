import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUpdateAssemblycartComfirmStatusMutation } from "../../slices/assemblypcbCartApiSlice";

const OrderassemblyCartConfirmModle = ({
  show,
  handleClose,
  pcborderId,
  onConfirm,
}) => {
  const [updateassemblycartComfirmStatus] =
    useUpdateAssemblycartComfirmStatusMutation();
  const { language } = useSelector((state) => state.language);

  const [status, setStatus] = useState("accepted");
  const [confirmedPrice, setConfirmedPrice] = useState("");
  const [confirmedReason, setConfirmedReason] = useState("");

  const handleConfirm = async () => {
    const updatedData = {
      status,
      confirmed_price: status === "accepted" ? confirmedPrice : "-",
      confirmed_reason: confirmedReason,
    };

    try {
      await updateassemblycartComfirmStatus({
        id: String(pcborderId),
        updatedData,
      }).unwrap();
      toast.success(`Order PCB marked as ${status}`);
      onConfirm();
      handleModalClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update order PCB status");
    }
  };

  const handleModalClose = () => {
    setConfirmedPrice("");
    setConfirmedReason("");
    handleClose();
  };

  const translations = {
    en: {
      ConfirmOrdersLbl: "Confirm Order",
      CloseLbl: "Close",
      StatusLbl: "Select Status",
      AcceptLbl: "Accepted",
      RejectLbl: "Rejected",
      ConfirmBtn: "Confirm",
      ConfirmedPriceLbl: "Confirmed Price (฿)",
      ConfirmedreasonLbl: "Confirmed Reason",
    },
    thai: {
      ConfirmOrdersLbl: "ยืนยันคำสั่งซื้อ",
      CloseLbl: "ปิด",
      StatusLbl: "เลือกสถานะ",
      AcceptLbl: "ยอมรับ",
      RejectLbl: "ปฏิเสธ",
      ConfirmBtn: "ยืนยัน",
      ConfirmedPriceLbl: "ราคายืนยัน (฿)",
      ConfirmedreasonLbl: "เหตุผลที่ยืนยัน",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Modal show={show} onHide={handleModalClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{t.ConfirmOrdersLbl}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="statusSelect">
            <Form.Label>{t.StatusLbl}</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="accepted">{t.AcceptLbl}</option>
              <option value="rejected">{t.RejectLbl}</option>
            </Form.Select>
          </Form.Group>

          {status === "accepted" && (
            <Form.Group className="mb-3" controlId="confirmedPriceInput">
              <Form.Label>{t.ConfirmedPriceLbl}</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter confirmed price"
                value={confirmedPrice}
                onChange={(e) => setConfirmedPrice(e.target.value)}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="confirmedReason">
            <Form.Label>{t.ConfirmedreasonLbl}</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Enter reason"
              value={confirmedReason}
              onChange={(e) => setConfirmedReason(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={handleModalClose}>
          {t.CloseLbl}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={status === "accepted" && !confirmedPrice}
        >
          {t.ConfirmBtn}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderassemblyCartConfirmModle;
