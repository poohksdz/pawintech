import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useUpdateOrderpcbCartStatusMutation } from "../slices/orderpcbCartApiSlice";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { BASE_URL } from "../constants";

const ConfirmPCBCartReviewModal = ({ show, handleClose, cart, onConfirm }) => {
    const [confirmedPrice, setConfirmedPrice] = useState("");
    const [remark, setRemark] = useState("");
    const [updateStatus, { isLoading }] = useUpdateOrderpcbCartStatusMutation();
    const { language } = useSelector((state) => state.language);

    useEffect(() => {
        if (cart) {
            setConfirmedPrice(cart.confirmed_price || "");
            setRemark(cart.remark || "");
        }
    }, [cart]);

    const handleUpdateStatus = async (status) => {
        if (!confirmedPrice && status === "accepted") {
            toast.error("Please enter a confirmed price");
            return;
        }

        try {
            await updateStatus({
                id: cart.id,
                status,
                confirmed_price: confirmedPrice,
                remark,
            }).unwrap();
            toast.success(`Cart request ${status === "accepted" ? "approved" : "rejected"}`);
            onConfirm();
            handleClose();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update status");
        }
    };

    const translations = {
        en: {
            title: "Review Gerber PCB Request",
            project: "Project",
            qty: "Quantity",
            dimensions: "Dimensions",
            layers: "Layers",
            gerber: "Gerber File",
            price: "Confirmed Price (THB)",
            remark: "Admin Remark",
            close: "Close",
            reject: "Reject",
            approve: "Approve & Set Price",
        },
        thai: {
            title: "ตรวจสอบรายการ Gerber PCB",
            project: "โปรเจกต์",
            qty: "จำนวน",
            dimensions: "ขนาด",
            layers: "จำนวนเลเยอร์",
            gerber: "ไฟล์ Gerber",
            price: "ราคายืนยัน (บาท)",
            remark: "หมายเหตุจากแอดมิน",
            close: "ปิด",
            reject: "ปฏิเสธ",
            approve: "อนุมัติและตั้งราคา",
        },
    };

    const t = translations[language] || translations.en;

    if (!cart) return null;

    const footer = (
        <>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                {t.close}
            </Button>
            <Button
                variant="danger"
                onClick={() => handleUpdateStatus("rejected")}
                disabled={isLoading}
            >
                {t.reject}
            </Button>
            <Button
                variant="warning"
                onClick={() => handleUpdateStatus("accepted")}
                disabled={isLoading}
            >
                {t.approve}
            </Button>
        </>
    );

    return (
        <Modal show={show} onHide={handleClose} title={t.title} size="lg" footer={footer}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.project}
                        </span>
                        <span className="font-bold text-slate-900">{cart.projectname}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.qty}
                        </span>
                        <span className="font-bold text-slate-900">{cart.pcb_qty} PCS</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.dimensions}
                        </span>
                        <span className="font-bold text-slate-900">
                            {cart.length_cm} x {cart.width_cm} mm
                        </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.layers}
                        </span>
                        <span className="font-bold text-slate-900">{cart.layers}L</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {t.gerber}
                    </span>
                    <a
                        href={`${BASE_URL}/api/gerber/download/${cart.gerberZip?.split(/[/\\]/).pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold hover:underline"
                    >
                        {cart.gerberZip?.split(/[/\\]/).pop()}
                    </a>
                </div>

                <div className="space-y-4">
                    <Input
                        label={t.price}
                        type="number"
                        placeholder="0.00"
                        value={confirmedPrice}
                        onChange={(e) => setConfirmedPrice(e.target.value)}
                    />

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            {t.remark}
                        </label>
                        <textarea
                            rows={3}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none text-slate-900 font-medium"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmPCBCartReviewModal;
