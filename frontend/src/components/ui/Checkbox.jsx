import React from 'react';
import { FaCheck } from 'react-icons/fa';

const Checkbox = ({ id, checked, onChange, label, description }) => {
    return (
        <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-900/50 border border-zinc-800 transition-all hover:bg-zinc-900 hover:border-indigo-500/30 group">
            <div className="relative flex items-center h-6">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="peer sr-only"
                />
                <div
                    onClick={() => onChange({ target: { checked: !checked } })}
                    className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer
            ${checked
                            ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20'
                            : 'bg-zinc-950 border-zinc-700 group-hover:border-zinc-500'}`}
                >
                    {checked && <FaCheck className="text-white text-[10px]" />}
                </div>
            </div>
            <div className="flex flex-col gap-1 cursor-pointer select-none" onClick={() => onChange({ target: { checked: !checked } })}>
                <label
                    htmlFor={id}
                    className="text-[11px] font-black text-white uppercase tracking-widest leading-none pointer-events-none"
                >
                    {label}
                </label>
                {description && (
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter leading-tight pointer-events-none" title={description}>
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Checkbox;
