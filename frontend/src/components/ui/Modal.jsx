import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const Modal = ({
  show,
  isOpen,
  onHide,
  onClose,
  title,
  children,
  size = "md",
  footer = null,
}) => {
  const isShowing = show || isOpen;
  const hideHandler = onHide || onClose;

  useEffect(() => {
    if (isShowing) {
      document.body.style.overflow = "hidden";
      // Scroll to top of the modal if it's too long
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isShowing]);

  if (!isShowing) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    >
      {/* Backdrop - Separate layer for guaranteed full coverage */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-auto"
        style={{ position: "fixed", inset: 0 }}
        onClick={hideHandler}
      ></div>

      {/* Modal Wrapper - The Centering Engine */}
      <div
        className={`relative w-full ${sizeClasses[size]} z-[100000] pointer-events-auto animate-slideDownPop`}
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="relative flex flex-col w-full bg-white border-0 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] outline-none focus:outline-none overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-solid border-slate-100">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            <button
              className="p-2 ml-auto bg-slate-50 border-0 text-slate-400 rounded-full hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              onClick={hideHandler}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div
            className="relative p-4 md:p-8 flex-auto overflow-y-auto"
            style={{ maxHeight: "calc(90vh - 150px)" }}
          >
            {children}
          </div>

          {/* Footer (Optional) */}
          {footer && (
            <div className="flex items-center justify-end p-4 md:p-6 border-t border-solid border-slate-100 bg-slate-50/50 gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
