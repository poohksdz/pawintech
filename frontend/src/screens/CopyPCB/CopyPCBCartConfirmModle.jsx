import { useState } from "react";
import { useSelector } from "react-redux";
import { Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaShieldAlt } from "react-icons/fa";
import { useUpdatecopycartComfirmStatusMutation } from "../../slices/copypcbCartApiSlice";

const CopyPCBCartConfirmModle = ({
  show,
  handleClose,
  pcborderId,
  onConfirm,
}) => {
  const [updatecopycartComfirmStatus] =
    useUpdatecopycartComfirmStatusMutation();
  const { language } = useSelector((state) => state.language);

  const [status, setStatus] = useState("accepted");
  const [confirmedPrice, setConfirmedPrice] = useState("");

  const handleConfirm = async () => {
    const updatedData = {
      status,
      confirmed_price: status === "accepted" ? confirmedPrice : "-",
    };

    try {
      await updatecopycartComfirmStatus({
        id: String(pcborderId),
        updatedData,
      }).unwrap();

      toast.success(`Order marked as ${status}`);
      onConfirm();
      handleClose();
      setConfirmedPrice("");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update order status");
    }
  };

  const translations = {
    en: {
      ConfirmOrdersLbl: "Verify Order",
      CloseLbl: "Cancel",
      StatusLbl: "Decision",
      AcceptLbl: "Approve & Quote",
      RejectLbl: "Reject Order",
      ConfirmBtn: "Execute Decision",
      ConfirmedPriceLbl: "Final Quote (฿)",
    },
    thai: {
      ConfirmOrdersLbl: "ยืนยันและประเมินราคา",
      CloseLbl: "ยกเลิก",
      StatusLbl: "การตัดสินใจ",
      AcceptLbl: "ใบเสนอราคา",
      RejectLbl: "ปฏิเสธคำสั่งซื้อ",
      ConfirmBtn: "ยืนยันการดำเนินการ",
      ConfirmedPriceLbl: "ราคาสุทธิ (฿)",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      animation={true}
      centered
      contentClassName="rounded-[2.5rem] border-none shadow-2xl font-prompt"
    >
      <Modal.Header closeButton className="border-b border-slate-50 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FaShieldAlt size={18} />
          </div>
          <div>
            <Modal.Title className="text-xl font-bold text-slate-900">
              {t.ConfirmOrdersLbl}
            </Modal.Title>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Admin Review Session
            </p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body className="p-8">
        <Form>
          <div className="space-y-6">
            <div>
              <Form.Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                {t.StatusLbl}
              </Form.Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("accepted")}
                  className={`flex-grow py-4 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                    status === "accepted"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  <FaCheckCircle size={14} /> {t.AcceptLbl}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("rejected")}
                  className={`flex-grow py-4 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                    status === "rejected"
                      ? "bg-rose-50 border-rose-500 text-rose-700"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  <FaTimesCircle size={14} /> {t.RejectLbl}
                </button>
              </div>
            </div>

            {status === "accepted" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Form.Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                  {t.ConfirmedPriceLbl}
                </Form.Label>
                <div className="relative">
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-4 font-bold text-slate-800 focus:bg-white focus:border-emerald-500/50 transition-all outline-none"
                    placeholder="0.00"
                    value={confirmedPrice}
                    onChange={(e) => setConfirmedPrice(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    THB
                  </div>
                </div>
              </div>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-t border-slate-50 p-8 flex gap-3">
        <button
          onClick={handleClose}
          className="flex-grow py-4 rounded-2xl bg-white border-2 border-slate-50 text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all"
        >
          {t.CloseLbl}
        </button>
        <button
          onClick={handleConfirm}
          disabled={status === "accepted" && !confirmedPrice}
          className={`flex-grow py-4 rounded-2xl font-bold text-sm shadow-xl transition-all disabled:opacity-50 disabled:shadow-none ${
            status === "accepted"
              ? "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"
              : "bg-rose-600 text-white shadow-rose-100 hover:bg-rose-700"
          }`}
        >
          {t.ConfirmBtn}
        </button>
      </Modal.Footer>
      <style>{`.font-prompt { font-family: 'Prompt', sans-serif !important; }`}</style>
    </Modal>
  );
};

export default CopyPCBCartConfirmModle;
