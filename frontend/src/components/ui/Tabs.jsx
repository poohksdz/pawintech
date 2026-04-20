import React, { useState } from "react";

export const Tabs = ({ children, defaultActiveKey, className = "" }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  // Filter children to only Tabs
  const tabs = React.Children.toArray(children).filter(
    (child) => child.type === Tab,
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex space-x-1 border-b border-slate-200 mb-4 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.props.eventKey;
          return (
            <button
              key={tab.props.eventKey}
              onClick={() => setActiveKey(tab.props.eventKey)}
              className={`
                whitespace-nowrap py-3 px-4 md:px-6 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none
                ${isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
              `}
            >
              {tab.props.title}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {tabs.map((tab) => {
          if (activeKey !== tab.props.eventKey) return null;
          return (
            <div key={tab.props.eventKey} className="animate-slideDownPop">
              {tab.props.children}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Tab = ({ children }) => {
  return <>{children}</>;
};
