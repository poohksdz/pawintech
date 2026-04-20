import React from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { FaTrash } from "react-icons/fa";

function ConfirmModle({
  onConfirm,
  onCancel,
  show = true,
  title = "Confirm Delete",
  text = "Are you sure you want to delete?",
}) {
  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title={
        <div className="flex items-center text-red-600">
          <FaTrash className="mr-2" />
          <span>{title}</span>
        </div>
      }
    >
      <div className="p-4 md:p-6">
        <p className="text-slate-600 mb-6">{text}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModle;
