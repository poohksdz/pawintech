import React from "react";

const Table = ({ children, className = "" }) => {
  return (
    <div
      className={`overflow-x-auto shadow-sm rounded-lg border border-slate-200 ${className}`}
    >
      <table className="min-w-full divide-y divide-slate-200">{children}</table>
    </div>
  );
};

const Thead = ({ children, className = "" }) => (
  <thead className={`bg-slate-50 ${className}`}>{children}</thead>
);

const Tbody = ({ children, className = "" }) => (
  <tbody className={`bg-white divide-y divide-slate-200 ${className}`}>
    {children}
  </tbody>
);

const Tr = ({ children, className = "", onClick }) => (
  <tr
    className={`${onClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""} ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const Th = ({ children, className = "" }) => (
  <th
    scope="col"
    className={`px-4 md:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td
    className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${className}`}
  >
    {children}
  </td>
);

// Group exports
Table.Header = Thead;
Table.Body = Tbody;
Table.Row = Tr;
Table.Head = Th;
Table.Cell = Td;

export default Table;
