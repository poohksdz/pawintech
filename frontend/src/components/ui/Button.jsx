import React from "react";

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-md";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-black dark:text-white dark:hover:bg-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-400 dark:text-white dark:hover:bg-yellow-500",
    light: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-black dark:border-zinc-800 dark:text-white dark:hover:bg-slate-800",
    dark: "bg-slate-800 text-white hover:bg-slate-900 dark:bg-black dark:text-white dark:hover:bg-white",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 md:px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
