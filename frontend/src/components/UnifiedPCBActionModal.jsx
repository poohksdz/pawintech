import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    useUpdatePCBManufactureingMutation,
    useUpdateDeliveryPCBOrderMutation
} from "../slices/orderpcbSlice";
import { useUpdateOrderpcbCartStatusMutation } from "../slices/orderpcbCartApiSlice";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { BASE_URL } from "../constants";

const UnifiedPCBActionModal = ({ show, handleClose, item, type, onConfirm }) => {
    const [inputValue, setInputValue] = useState("");
    const [remark, setRemark] = useState("");
    const [confirmedPrice, setConfirmedPrice] = useState("");

    const [updateCartStatus, { isLoading: isUpdateCartLoading }] = useUpdateOrderpcbCartStatusMutation();
    const [updateManufacture, { isLoading: isManufactureLoading }] = useUpdatePCBManufactureingMutation();
    const [updateDelivery, { isLoading: isDeliveryLoading }] = useUpdateDeliveryPCBOrderMutation();

    const { language } = useSelector((state) => state.language);
    const isLoading = isUpdateCartLoading || isManufactureLoading || isDeliveryLoading;

    useEffect(() => {
        if (item) {
            if (type === "review") {
                const initialPrice = (item.confirmed_price && Number(item.confirmed_price) > 0)
                    ? item.confirmed_price
                    : (item.price || "");
                setConfirmedPrice(initialPrice);
                setRemark(item.remark || "");
            } else {
                setInputValue("");
                setRemark("");
            }
        }
    }, [item, type]);

    const handleConfirm = async () => {
        if (!item) return;

        try {
            if (type === "review") {
                if (!confirmedPrice) {
                    toast.error("Please enter a confirmed price");
                    return;
                }
                await updateCartStatus({
                    id: item.id,
                    status: "accepted",
                    confirmed_price: confirmedPrice,
                    remark,
                }).unwrap();
                toast.success("Cart request approved");
            } else if (type === "manufacture") {
                if (!inputValue) {
                    toast.error("Manufacturing number is required");
                    return;
                }
                await updateManufacture({
                    pcborderId: String(item.id),
                    manufactureOrderNumber: inputValue,
                }).unwrap();
                toast.success("Order confirmed as manufacturing");
            } else if (type === "delivery") {
                if (!inputValue) {
                    toast.error("Tracking number is required");
                    return;
                }
                await updateDelivery({
                    pcborderId: String(item.id),
                    transferedNumber: inputValue,
                }).unwrap();
                toast.success("Order marked as delivered");
            }

            onConfirm();
            handleClose();
        } catch (err) {
            toast.error(err?.data?.message || "Action failed");
        }
    };

    const translations = {
        en: {
            review: "Review Gerber PCB Request",
            manufacture: "Confirm Manufacturing",
            delivery: "Confirm Delivery",
            project: "Project",
            orderId: "Order ID",
            qty: "Quantity",
            dimensions: "Dimensions",
            priceInput: "Confirmed Price (THB)",
            manufactureInput: "Manufacturing Number",
            deliveryInput: "Tracking / Transfer Number",
            remark: "Admin Remark",
            close: "Close",
            reject: "Reject",
            confirm: "Confirm Action",
            approve: "Approve",
        },
        thai: {
            review: "ตรวจสอบรายการ Gerber PCB",
            manufacture: "ยืนยันการผลิต",
            delivery: "ยืนยันการจัดส่ง",
            project: "โปรเจกต์",
            orderId: "เลขที่ออเดอร์",
            qty: "จำนวน",
            dimensions: "ขนาด",
            priceInput: "ราคายืนยัน (บาท)",
            manufactureInput: "หมายเลขการผลิต",
            deliveryInput: "หมายเลข Tracking / การโอน",
            remark: "หมายเหตุจากแอดมิน",
            close: "ปิด",
            reject: "ปฏิเสธ",
            confirm: "ยืนยันการดำเนินการ",
            approve: "อนุมัติขอการผลิต",
        },
    };

    const t = translations[language] || translations.en;
    if (!item) return null;

    const getFooter = () => (
        <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                {t.close}
            </Button>
            {type === "review" && (
                <Button
                    variant="danger"
                    onClick={async () => {
                        try {
                            await updateCartStatus({ id: item.id, status: "rejected", remark }).unwrap();
                            toast.success("Request rejected");
                            onConfirm();
                            handleClose();
                        } catch (e) { toast.error("Failed to reject"); }
                    }}
                    disabled={isLoading}
                >
                    {t.reject}
                </Button>
            )}
            <Button variant="warning" onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? "..." : type === "review" ? t.approve : t.confirm}
            </Button>
        </div>
    );

    return (
        <Modal show={show} onHide={handleClose} title={t[type] || t.confirm} size="lg" footer={getFooter()}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.project}</span>
                        <span className="font-bold text-slate-900 truncate block">{item.projectname || "-"}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.orderId}</span>
                        <span className="font-bold text-slate-900">{item.orderID || item.paymentComfirmID || "-"}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.qty}</span>
                        <span className="font-bold text-slate-900">{item.pcb_qty || "-"} PCS</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.dimensions}</span>
                        <span className="font-bold text-slate-900">{item.length_cm} x {item.width_cm} mm</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {type === "review" ? (
                        <Input
                            label={t.priceInput}
                            type="number"
                            placeholder="0.00"
                            value={confirmedPrice}
                            readOnly
                            disabled
                            className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-mono font-bold"
                        />
                    ) : (
                        <Input
                            label={type === "manufacture" ? t.manufactureInput : t.deliveryInput}
                            type="text"
                            placeholder="Enter value..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.remark}</label>
                        <textarea
                            rows={3}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none text-slate-900 font-medium"
                        />
                    </div>
                </div>

                {item.gerberZip && (
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gerber Archive</span>
                            <span className="text-xs font-bold text-emerald-700 truncate block">{item.gerberZip.split(/[/\\]/).pop()}</span>
                        </div>
                        <a
                            href={`${BASE_URL}/api/gerber/download/${item.gerberZip.split(/[/\\]/).pop()}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase ls-widest rounded-xl hover:bg-emerald-600 transition-all"
                        >
                            Download
                        </a>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default UnifiedPCBActionModal;
