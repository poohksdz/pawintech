import React from "react";
import { Tabs, Tab } from "../../../components/ui/Tabs";
import StockListCategoryScreen from "./StockListCategoryScreen";
import StockListFootprintScreen from "./StockListFootprintScreen";
import StockListManufacturingScreen from "./StockListManufacturingScreen";
import StockListSubcategoryScreen from "./StockListSubcategoryScreen";
import StockListSupplierScreen from "./StockListSupplierScreen";

const StockManageDefaultScreen = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pageFade">
      <h3 className="text-2xl font-semibold mb-6 text-slate-800">
        Stock Default Management
      </h3>
      <Tabs
        defaultActiveKey="category"
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
      >
        {/* Category Tab */}
        <Tab eventKey="category" title="Category">
          <StockListCategoryScreen />
        </Tab>

        {/* Subcategory Tab */}
        <Tab eventKey="subcategory" title="Subcategory">
          <StockListSubcategoryScreen />
        </Tab>

        {/* Footprint Tab */}
        <Tab eventKey="footprint" title="Footprint">
          <StockListFootprintScreen />
        </Tab>

        {/* Manufacture Tab */}
        <Tab eventKey="manufacture" title="Manufacture">
          <StockListManufacturingScreen />
        </Tab>

        {/* Supplier Tab */}
        <Tab eventKey="supplier" title="Supplier">
          <StockListSupplierScreen />
        </Tab>
      </Tabs>
    </div>
  );
};

export default StockManageDefaultScreen;
