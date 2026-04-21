import { format, isValid } from "date-fns";

const AbbreviatedTaxInvoice = ({ order, companyInfo, printMode }) => {
    const items = order.items || order.orderItems || [];
    if (!order || !companyInfo) return null;

    const formatDateThai = (dateString) => {
        const date = new Date(dateString);
        if (!isValid(date)) return "-";
        return format(date, "dd/MM/yyyy");
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        if (!isValid(date)) return "-";
        return format(date, "HH:mm");
    };

    return (
        <div className={`print-short-only ${printMode === "short" ? "print-block" : "hidden"} font-mono text-black p-4 bg-white w-[80mm] mx-auto text-[12px] leading-tight shadow-none border border-dashed border-gray-300`}>
            <div className="text-center mb-4">
                <h1 className="text-[14px] font-black uppercase mb-1">ใบกำกับภาษีอย่างย่อ</h1>
                <p className="text-[10px] uppercase mb-2">ABBREVIATED TAX INVOICE</p>
                <p className="font-bold text-[13px]">{companyInfo.company_name_thai || companyInfo.company_name}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {companyInfo.tax_id}</p>
            </div>

            <div className="mb-4 space-y-1 border-b border-dashed border-black pb-2">
                <p>เลขที่: {order.paymentComfirmID || order.id}</p>
                <div className="flex justify-between">
                    <span>วันที่: {formatDateThai(order.createdAt)}</span>
                    <span>เวลา: {formatTime(order.createdAt)}</span>
                </div>
            </div>

            <div className="mb-4 border-b border-dashed border-black pb-2">
                <table className="w-full">
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-1">
                                    <div>{item.name}</div>
                                    <div className="flex justify-between text-[11px] text-gray-600 pl-2">
                                        <span>{item.qty} x {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span>{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-1 mb-4 border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                    <span>รวมเงิน</span>
                    <span>{order.itemsPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                    <span>VAT 7%</span>
                    <span>{order.vatPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {order.shippingPrice > 0 && (
                    <div className="flex justify-between">
                        <span>ค่าจัดส่ง</span>
                        <span>{order.shippingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-[14px] pt-1">
                    <span>ยอดสุทธิ</span>
                    <span>{order.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</span>
                </div>
            </div>

            <div className="text-center mt-6 space-y-1">
                <p className="font-bold">ขอบคุณที่ใช้บริการ</p>
                <p className="text-[10px]">THANK YOU</p>
                <div className="pt-4 text-[9px] text-gray-400">
                    <p>Computer Generated Receipt</p>
                    <p>{format(new Date(), "dd/MM/yyyy HH:mm:ss")}</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .print-block {
                        display: block !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        padding: 10px !important;
                        border: none !important;
                    }
                }
            ` }} />
        </div>
    );
};

export default AbbreviatedTaxInvoice;