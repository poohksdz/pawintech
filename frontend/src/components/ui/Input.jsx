import React from 'react';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    className = '',
    error = '',
    ...props
}) => {
    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-slate-100 disabled:text-slate-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
