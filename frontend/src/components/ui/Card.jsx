import React from 'react';

export const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, action, className = '' }) => {
    return (
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 ${className}`}>
            <h3 className="text-lg font-semibold text-slate-800 m-0">{title}</h3>
            {action && <div>{action}</div>}
        </div>
    );
};

export const CardBody = ({ children, className = '' }) => {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
};

export const CardFooter = ({ children, className = '' }) => {
    return (
        <div className={`px-6 py-4 border-t border-slate-200 bg-slate-50 ${className}`}>
            {children}
        </div>
    );
};
