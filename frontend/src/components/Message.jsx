import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

const Message = ({ variant = "info", children }) => {
  const variants = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
  };

  const icons = {
    info: <Info size={20} className="text-blue-500 shrink-0" />,
    success: <CheckCircle size={20} className="text-emerald-500 shrink-0" />,
    warning: <AlertCircle size={20} className="text-amber-500 shrink-0" />,
    danger: <XCircle size={20} className="text-red-500 shrink-0" />,
  };

  // Handle case where react-bootstrap variant name 'danger' translates to 'red' or similar
  const colorClass = variants[variant] || variants.info;
  const IconClass = icons[variant] || icons.info;

  return (
    <div
      className={`flex gap-3 p-4 mb-4 text-sm border rounded-lg animate-slideDownPop ${colorClass}`}
      role="alert"
    >
      {IconClass}
      <div>{children}</div>
    </div>
  );
};

export default Message;
