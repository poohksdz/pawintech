import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'

import './assets/styles/bootstrap.custom.css'
import './assets/styles/index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import StaffRoute from './components/StaffRoute'
import StoreRoute from './components/StoreRoute'
import HomeScreen from './screens/HomeScreen'
import ProductScreen from './screens/ProductScreen'
import CartScreen from './screens/CartScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ShippingScreen from './screens/ShippingScreen'
import PaymentScreen from './screens/PaymentScreen'
import OrderPCBShippingScreen from './screens/OrderPCB/OrderPCBShippingScreen'
// ✅ นำเข้าหน้า Payment ของ Standard PCB
import OrderPCBPaymentScreen from './screens/OrderPCB/OrderPCBPaymentScreen'
import PlaceOrderScreen from './screens/PlaceOrderScreen'
import OrderScreen from './screens/OrderScreen'
import OrderPCBDetailScreen from './screens/OrderPCBDetailScreen'
import ProfileScreen from './screens/ProfileScreen'
import OrderListScreen from './screens/admin/OrderListScreen'
import OrderProductUpdateScreen from './screens/admin/OrderProductUpdateScreen'
import ProductListScreen from './screens/admin/ProductListScreen'
import ProductEditScreen from './screens/admin/ProductEditScreen'
import UserListScreen from './screens/admin/UserListScreen'
import UserEditScreen from './screens/admin/UserEditScreen'
import store from './store'
import { Provider } from 'react-redux'
import ProductCreateScreen from './screens/admin/ProductCreateScreen'
import ServiceScreen from './screens/ServiceScreen'
import ProductAllScreen from './screens/ProductAllScreen'
import AboutScreen from './screens/AboutScreen'
import AboutEditScreen from './screens/admin/AboutEditScreen'
import ContactScreen from './screens/ContactScreen'
import ServiceListScreen from './screens/admin/ServiceListScreen'
import ServiceEditScreen from './screens/admin/ServiceEditScreen'
import ServiceCreateScreen from './screens/admin/ServiceCreateScreen'
import CategoryListScreen from './screens/admin/CategoryListScreen'
import CategoryCreateScreen from './screens/admin/CategoryCreateScreen'
import CategoryEditScreen from './screens/admin/CategoryEditScreen'
import ShowcaselListScreen from './screens/admin/ShowcaselListScreen'
import ShowcaseCreateScreen from './screens/admin/ShowcaseCreateScreen'
import ShowcaseEditScreen from './screens/admin/ShowcaseEditScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ResetPasswordGuardWrapper from './screens/ResetPasswordGuardWrapper'
import PointingEmailScreen from './screens/PointingEmailScreen'
import BlogScreen from './screens/BlogScreen'
import BlogListScreen from './screens/admin/BlogListScreen'
import BlogCreateScreen from './screens/admin/BlogCreateScreen'
import BlogEditScreen from './screens/admin/BlogEditScreen'
import BlogDetailScreen from './screens/BlogDetailScreen'
import FolioScreen from './screens/FolioScreen'
import FolioDetailScreen from './screens/FolioDetailScreen'

import NoContainerLayout from './screens/Layouts/NocontainerLayout'
import ContainerLayout from './screens/Layouts/ContainerLayout'
import FolioListScreen from './screens/admin/FolioListScreen'
import FolioCreateScreen from './screens/admin/FolioCreateScreen'
import FolioEditScreen from './screens/admin/FolioEditScreen'
import AssemblyBoardEditScreen from './screens/admin/AssemblyBoardEditScreen'
import OrderPCBEditScreen from './screens/admin/OrderPCBEditScreen'
import OrderPCBListScreen from './screens/admin/OrderPCBListScreen'
import OrderPCBEditsScreen from './screens/admin/OrderPCBEditsScreen'
import OrderPCBEditListsScreen from './screens/admin/OrderPCBEditListsScreen'
import ServiceAllScreen from './screens/ServiceAllScreen'
import GerberViewerScreen from './screens/GerberViewerScreen'
import AssemblyBoardScreen from './screens/AssemblyBoardScreen'
import OrderPCBCartScreen from './screens/OrderPCB/OrderPCBCartScreen'
import OrderAssemblyCartScreen from './screens/OrderAssembly/OrderAssemblyCartScreen'
import OrderProductCartScreen from './screens/OrderProductCartScreen'

// --- Copy PCB Imports ---
import CopyPCBShppingScreen from './screens/CopyPCB/CopyPCBShppingScreen'
import CopyPCBPaymentScreen from './screens/CopyPCB/CopyPCBPaymentScreen'
import CopyPCBSetScreen from './screens/CopyPCB/CopyPCBSetScreen'
import CopyPCBCartScreen from './screens/CopyPCB/CopyPCBCartScreen'
import CopyPCBDetailScreen from './screens/CopyPCB/CopyPCBDetailScreen'
import CopyPCBCartListScreen from './screens/CopyPCB/CopyPCBCartListScreen'
import CopyPCBOrderListScreen from './screens/CopyPCB/CopyPCBOrderListScreen'
import CopyPCBOrderEditScreen from './screens/CopyPCB/CopyPCBOrderEditScreen'
import CopyPCBCartDetailScreen from './screens/CopyPCB/CopyPCBCartDetailScreen'
import CopyPCBOrderEditListScreen from './screens/CopyPCB/CopyPCBOrderEditListScreen'
import CopyPCBCartEditScreen from './screens/CopyPCB/CopyPCBCartEditScreen'

// --- Custom PCB Imports ---
import CustomPCBSetScreen from './screens/CustomPCB/CustomPCBSetScreen'
import CustomPCBShippingScreen from './screens/CustomPCB/CustomPCBShippingScreen'
import CustomPCBPaymentScreen from './screens/CustomPCB/CustomPCBPaymentScreen'
import CustomPCBCartScreen from './screens/CustomPCB/CustomPCBCartScreen'
import CustomPCBOrderListScreen from './screens/CustomPCB/CustomPCBOrderListScreen'
import CustomPCBCartListScreen from './screens/CustomPCB/CustomPCBCartListScreen'
import CustomPCBCartDetailScreen from './screens/CustomPCB/CustomPCBCartDetailScreen'
import CustomPCBEditListScreen from './screens/CustomPCB/CustomPCBEditListScreen'
import CustomPCBOrderEditScreen from './screens/CustomPCB/CustomPCBOrderEditScreen'
import CustomPCBCartEditScreen from './screens/CustomPCB/CustomPCBCartEditScreen'

// --- Order Assembly Imports ---
import OrderassemblyCartListScreen from './screens/OrderAssembly/OrderassemblyCartListScreen'
import OrderassemblySetScreen from './screens/OrderAssembly/OrderassemblySetScreen'
import OrderassemblyCartDetailScreen from './screens/OrderAssembly/OrderassemblyCartDetailScreen'
import OrderassemblyProfileListScreen from './screens/OrderAssembly/OrderassemblyProfileListScreen'
import OrderassemblyOrderListScreen from './screens/OrderAssembly/OrderassemblyOrderListScreen'
import OrderassemblyShppingScreen from './screens/OrderAssembly/OrderassemblyShppingScreen'
import OrderassemblyDetailScreen from './screens/OrderAssembly/OrderassemblyDetailScreen'
import OrderassemblyCartDefaultScreen from './screens/OrderAssembly/OrderassemblyCartDefaultScreen'
import OrderassemblyOrderEditListScreen from './screens/OrderAssembly/OrderassemblyOrderEditListScreen'
import OrderassemblyOrderEditScreen from './screens/OrderAssembly/OrderassemblyOrderEditScreen'
import OrderassemblyCartEditScreen from './screens/OrderAssembly/OrderassemblyCartEditScreen'
import OrderassemblyPaymentScreen from './screens/OrderAssembly/OrderassemblyPaymentScreen'

// --- Quotation & Stock Imports ---
import QuotationSetScreen from './screens/Quotation/QuotationSetScreen'
import StockProductDashboardScreen from './screens/Stocks/StockProduct/StockProductDashboardScreen'
import StockProductEditListScreen from './screens/Stocks/StockProduct/StockProductEditListScreen'
import StockProductSetScreen from './screens/Stocks/StockProduct/StockProductSetScreen'
import StockProductDetailScreen from './screens/Stocks/StockProduct/StockProductDetailScreen'
import StockProductEditScreen from './screens/Stocks/StockProduct/StockProductEditScreen'
import StockRequestDashboardScreen from './screens/Stocks/StockProduct/StockRequestDashboardScreen'
import StockRequestDetailScreen from './screens/Stocks/StockProduct/StockRequestDetailScreen'
import StockReceiveDashboardScreen from './screens/Stocks/StockProduct/StockReceiveDashboardScreen'
import StockReceiveDetailScreen from './screens/Stocks/StockProduct/StockReceiveDetailScreen'
import StockIssueDashboardScreen from './screens/Stocks/StockProduct/StockIssueDashboardScreen'
import StockIssueDetailScreen from './screens/Stocks/StockProduct/StockIssueDetailScreen'
import StockCartScreen from './screens/Stocks/StockProduct/StockCartScreen'
import StockListForIssueScreen from './screens/Stocks/StockProduct/StockListForIssueScreen'
import StockUserRequestDashboardScreen from './screens/Stocks/StockProduct/StockUserRequestDashboardScreen'
import StockUserIssueDashboardScreen from './screens/Stocks/StockProduct/StockUserIssueDashboardScreen'
import StockCheckBom from './screens/Stocks/StockProduct/StockCheckBom'
import VatPDFScreen from './screens/VatPDFScreen'
import DefaultInvoiceDetailScreen from './screens/DefaultInvoices/DefaultInvoiceDetailScreen'
import DefaultInvoiceListEditScreen from './screens/DefaultInvoices/DefaultInvoiceListEditScreen'
import DefaultInvoiceEditScreen from './screens/DefaultInvoices/DefaultInvoiceEditScreen'
import DefaultInvoiceSetScreen from './screens/DefaultInvoices/DefaultInvoiceSetScreen'
import InvoiceSetScreen from './screens/Invoices/InvoiceSetScreen'
import InvoiceListEditScreen from './screens/Invoices/InvoiceListEditScreen'
import InvoiceEditScreen from './screens/Invoices/InvoiceEditScreen'
import InvoiceDetailScreen from './screens/Invoices/InvoiceDetailScreen'
import StockAddProductListScreen from './screens/Stocks/StockProduct/StockAddProductListScreen'
import StockAdditionCartScreen from './screens/Stocks/StockProduct/StockAdditionCartScreen'
import StockRequestImportanceScreen from './screens/Stocks/StockProduct/StockRequestImportanceScreen'
import StockRequestCancelScreen from './screens/Stocks/StockProduct/StockRequestCancelScreen'
import StockUserRequestImportanceScreen from './screens/Stocks/StockProduct/StockUserRequestImportanceScreen'
import StockManageDefaultScreen from './screens/Stocks/StockComponents/StockManageDefaultScreen'
import StockCreateCategoryScreen from './screens/Stocks/StockComponents/StockCreateCategoryScreen'
import StockEditSupplierScreen from './screens/Stocks/StockComponents/StockEditSupplierScreen'
import StockCreateSupplierScreen from './screens/Stocks/StockComponents/StockCreateSupplierScreen'
import StockEditSubcategoryScreen from './screens/Stocks/StockComponents/StockEditSubcategoryScreen'
import StockCreateSubcategoryScreen from './screens/Stocks/StockComponents/StockCreateSubcategoryScreen'
import StockEditManufacturingScreen from './screens/Stocks/StockComponents/StockEditManufacturingScreen'
import StockCreateManufacturingScreen from './screens/Stocks/StockComponents/StockCreateManufacturingScreen'
import StockEditFootprintScreen from './screens/Stocks/StockComponents/StockEditFootprintScreen'
import StockCreateFootprintScreen from './screens/Stocks/StockComponents/StockCreateFootprintScreen'
import StockEditCategoryScreen from './screens/Stocks/StockComponents/StockEditCategoryScreen'

// --- Quotation & Customer Imports ---
import QuotationDefaultListScreen from './screens/Quotation/QuotationDefaultListScreen'
import QuotationDefaultDetailScreen from './screens/Quotation/QuotationDefaultDetailScreen'
import QuotationDefaultEditScreen from './screens/Quotation/QuotationDefaultEditScreen'
import QuotationDefaultSetScreen from './screens/Quotation/QuotationDefaultSetScreen'
import QuotationEditScreen from './screens/Quotation/QuotationEditScreen'
import QuotationDetailScreen from './screens/Quotation/QuotationDetailScreen'
import QuotationListScreen from './screens/Quotation/QuotationListScreen'
import CustomerSetScreen from './screens/Customers/CustomerSetScreen'
import CustomerEditScreen from './screens/Customers/CustomerEditScreen'
import CustomerDetailScreen from './screens/Customers/CustomerDetailScreen'
import CustomerListScreen from './screens/Customers/CustomerListScreen'
import QuotationSetSelectedCustomerScreen from './screens/Quotation/QuotationSetSelectedCustomerScreen'

// --- PCB Admin Imports ---
import PCBAdminCreateAssemblyPCB from './screens/PCBAdmin/PCBAdminCreateAssemblyPCB'
import PCBAdminCreateCustomerPCB from './screens/PCBAdmin/PCBAdminCreateCustomerPCB'
import PCBAdminCreateCopyPCB from './screens/PCBAdmin/PCBAdminCreateCopyPCB'
import PCBAdminCreateOrderPCB from './screens/PCBAdmin/PCBAdminCreateOrderPCB'
import PCBAdminRoute from './components/PCBAdminRoute'
import OrderListsScreen from './screens/OrderListsScreen'
import ProductAdminCreateOrderScreen from './screens/admin/ProductAdminCreateOrderScreen'
import UserAddressListCreateOrderScreen from './screens/PCBAdmin/UserAddressListCreateOrderScreen'
import UserEditPCBAdminScreen from './screens/admin/UserEditPCBAdminScreen'
import ReorderPCBAdminCreateOrderPCBScreen from './screens/PCBAdmin/ReorderPCBAdminCreateOrderPCBScreen'
import ReorderPCBAdminCreateCustomPCBScreen from './screens/PCBAdmin/ReorderPCBAdminCreateCustomPCBScreen'
import ReorderPCBAdminCreateAssemblyPCBScreen from './screens/PCBAdmin/ReorderPCBAdminCreateAssemblyPCBScreen'
import ReorderPCBAdminCreateCopyPCBScreen from './screens/PCBAdmin/ReorderPCBAdminCreateCopyPCBScreen'
import AdminPaymentListScreen from './screens/admin/AdminPaymentListScreen'

window.Buffer = window.Buffer || Buffer

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />}>
      {/* Routes without Container */}
      <Route element={<NoContainerLayout />}>
        <Route index={true} path='/' element={<HomeScreen />} />
        <Route path='/page/:pageNumber' element={<HomeScreen />} />
        <Route
          path='/search/:keyword/page/:pageNumber'
          element={<HomeScreen />}
        />
      </Route>

      {/* Routes with Container */}
      <Route element={<ContainerLayout />}>
        <Route path='/search/:keyword' element={<ProductAllScreen />} />
        <Route path='/product/:id' element={<ProductScreen />} />
        <Route path='/product' element={<ProductAllScreen />} />
        <Route path='/service/:id' element={<ServiceScreen />} />
        <Route path='/service' element={<ServiceAllScreen />} />
        <Route path='/folio' element={<FolioScreen />} />
        <Route path='/folio/:id' element={<FolioDetailScreen />} />
        <Route path='/blogs' element={<BlogScreen />} />
        <Route path='/blogs/:id' element={<BlogDetailScreen />} />
        <Route path='/cart/:type?' element={<CartScreen />} />

        <Route path='/about' element={<AboutScreen />} />
        <Route path='/contact' element={<ContactScreen />} />
        <Route path='/login' element={<LoginScreen />} />
        <Route path='/register' element={<RegisterScreen />} />
        <Route
          path='/requestpasswordreset'
          element={<ForgotPasswordScreen />}
        />
        <Route path='/pointingemail' element={<PointingEmailScreen />} />
        <Route path='/resetpassword' element={<ResetPasswordGuardWrapper />} />
        <Route path='/orderpcb' element={<GerberViewerScreen />} />
        <Route path='/copypcb' element={<CopyPCBSetScreen />} />
        <Route path='/custompcb' element={<CustomPCBSetScreen />} />
        <Route path='/assemblyboard' element={<AssemblyBoardScreen />} />
        <Route path='/assemblypcb' element={<OrderassemblySetScreen />} />

        {/* =========================================
            {/* ✅ Registered users (ลูกค้าทั่วไป) */}
        ========================================= */}
        <Route path='' element={<PrivateRoute />}>
          <Route path='/shipping' element={<ShippingScreen />} />
          <Route path='/payment' element={<PaymentScreen />} />
          <Route path='/pcbshipping' element={<OrderPCBShippingScreen />} />

          {/* ✅ เพิ่ม Route สำหรับหน้า Payment ของ Standard PCB */}
          <Route path='/pcbpayment' element={<OrderPCBPaymentScreen />} />
          <Route path='/pcbpayment/:id' element={<OrderPCBPaymentScreen />} />

          {/* Copy PCB */}
          <Route path='/copypcbshipping/:id' element={<CopyPCBShppingScreen />} />
          <Route path='/copypcbpayment/:id' element={<CopyPCBPaymentScreen />} />

          {/* Order Assembly PCB */}
          <Route path='/assemblypcbshipping/:id' element={<OrderassemblyShppingScreen />} />
          <Route path='/assemblypcbpayment/:id' element={<OrderassemblyPaymentScreen />} />

          <Route path='/productcart' element={<OrderProductCartScreen />} />
          <Route path='/pcbcart' element={<OrderPCBCartScreen />} />
          <Route path='/copypcbcart' element={<CopyPCBCartScreen />} />
          <Route
            path='/pcbassemblycart'
            element={<OrderAssemblyCartScreen />}
          />
          <Route path='/order/:id' element={<OrderScreen />} />
          <Route path='/orderpcbs/:id' element={<OrderPCBDetailScreen />} />
          <Route
            path='/copycartpcb/:id'
            element={<CopyPCBCartDetailScreen />}
          />
          <Route path='/copypcb/:id' element={<CopyPCBDetailScreen />} />
          <Route
            path='/assemblycartpcb/:id'
            element={<OrderassemblyCartDetailScreen />}
          />
          <Route
            path='/assemblypcb/:id'
            element={<OrderassemblyDetailScreen />}
          />
          <Route
            path='/assemblyprofilepcb/:id'
            element={<OrderassemblyProfileListScreen />}
          />

          {/* ✅ เพิ่ม Custom PCB Shipping & Payment Routes */}
          <Route
            path='/custompcbshipping/:id'
            element={<CustomPCBShippingScreen />}
          />
          <Route
            path='/custompcbpayment/:id'
            element={<CustomPCBPaymentScreen />}
          />
          {/* ================================================= */}

          <Route path='/customcartpcbs' element={<CustomPCBCartScreen />} />
          <Route
            path='/customcartpcbs/:id'
            element={<CustomPCBCartDetailScreen />}
          />

          <Route path='/placeorder' element={<PlaceOrderScreen />} />
          <Route path='/profile' element={<ProfileScreen />} />
          <Route path='/vatscreen' element={<VatPDFScreen />} />
          <Route path='/invoice' element={<InvoiceDetailScreen />} />
        </Route>

        {/* Staff users */}
        <Route path='' element={<StaffRoute />}>
          <Route path='/componentcheckboom' element={<StockCheckBom />} />
          <Route
            path='/componentuserrequestlist'
            element={<StockUserRequestDashboardScreen />}
          />
          <Route path='/componentcartlist' element={<StockCartScreen />} />
          <Route
            path='/componentuserissuelist'
            element={<StockUserIssueDashboardScreen />}
          />
          <Route
            path='/componenteditlist'
            element={<StockProductEditListScreen />}
          />
          <Route
            path='/componenteditlist/set'
            element={<StockProductSetScreen />}
          />
          <Route
            path='/componenteditlist/:id'
            element={<StockProductDetailScreen />}
          />
          <Route
            path='/componenteditlist/:id/edit'
            element={<StockProductEditScreen />}
          />
          <Route
            path='/componentuserrequestedimportancelist'
            element={<StockUserRequestImportanceScreen />}
          />
          <Route
            path='/componentuserrequestedcancellist'
            element={<StockRequestCancelScreen />}
          />
          <Route path='/admin/bloglist' element={<BlogListScreen />} />
          <Route path='/admin/blogs/create' element={<BlogCreateScreen />} />
          <Route path='/admin/blogs/:id/edit' element={<BlogEditScreen />} />
          <Route path='/components' element={<StockProductDashboardScreen />} />
        </Route>

        {/* Store users */}
        <Route path='' element={<StoreRoute />}>
          <Route path='/admin/productlist' element={<ProductListScreen />} />
          <Route
            path='/admin/productlist/:pageNumber'
            element={<ProductListScreen />}
          />
          <Route
            path='/admin/product/create'
            element={<ProductCreateScreen />}
          />
          <Route
            path='/admin/product/:id/edit'
            element={<ProductEditScreen />}
          />
          <Route path='/admin/categorylist' element={<CategoryListScreen />} />
          <Route
            path='/admin/category/create'
            element={<CategoryCreateScreen />}
          />
          <Route
            path='/admin/category/:id/edit'
            element={<CategoryEditScreen />}
          />
          <Route path='/admin/user/:id/edit' element={<UserEditScreen />} />
          <Route path='/admin/orderlist' element={<OrderListScreen />} />
          <Route
            path='/admin/orderlist/:id/edit'
            element={<OrderProductUpdateScreen />}
          />
          <Route
            path='/componentissuecartlist'
            element={<StockListForIssueScreen />}
          />
          <Route
            path='/componentrequestlist'
            element={<StockRequestDashboardScreen />}
          />
          <Route
            path='/componentrequestlist/:id'
            element={<StockRequestDetailScreen />}
          />
          <Route
            path='/componentreceivelist'
            element={<StockReceiveDashboardScreen />}
          />
          <Route
            path='/componentreceivelist/:id'
            element={<StockReceiveDetailScreen />}
          />
          <Route
            path='/componentissuelist'
            element={<StockIssueDashboardScreen />}
          />
          <Route
            path='/componentissuelist/:id'
            element={<StockIssueDetailScreen />}
          />
          <Route
            path='/componentaddproductlist'
            element={<StockAddProductListScreen />}
          />
          <Route
            path='/componentaddcartlist'
            element={<StockAdditionCartScreen />}
          />
          <Route
            path='/componentdefaultlist'
            element={<StockManageDefaultScreen />}
          />
          <Route
            path='/componentcreatecategory'
            element={<StockCreateCategoryScreen />}
          />
          <Route
            path='/stock/category/:id/edit'
            element={<StockEditCategoryScreen />}
          />
          <Route
            path='/componentcreatefootprint'
            element={<StockCreateFootprintScreen />}
          />
          <Route
            path='/stock/footprint/:id/edit'
            element={<StockEditFootprintScreen />}
          />
          <Route
            path='/componentcreatemanufacturing'
            element={<StockCreateManufacturingScreen />}
          />
          <Route
            path='/stock/manufacture/:id/edit'
            element={<StockEditManufacturingScreen />}
          />
          <Route
            path='/componentcreatesubcategory'
            element={<StockCreateSubcategoryScreen />}
          />
          <Route
            path='/stock/subcategory/:id/edit'
            element={<StockEditSubcategoryScreen />}
          />
          <Route
            path='/componentcreatesupplier'
            element={<StockCreateSupplierScreen />}
          />
          <Route
            path='/stock/supplier/:id/edit'
            element={<StockEditSupplierScreen />}
          />
          <Route
            path='/componentcreatesupplier'
            element={<StockCreateSupplierScreen />}
          />
        </Route>

        {/* PCB Admin users */}
        <Route path='' element={<PCBAdminRoute />}>
          <Route path='/orderlists' element={<OrderListsScreen />} />
          <Route
            path='/createassemblypcb/set'
            element={<PCBAdminCreateAssemblyPCB />}
          />
          <Route
            path='/createcustomerpcb/set'
            element={<PCBAdminCreateCustomerPCB />}
          />
          <Route
            path='/createcopypcb/set'
            element={<PCBAdminCreateCopyPCB />}
          />
          <Route
            path='/createorderpcb/set'
            element={<PCBAdminCreateOrderPCB />}
          />
          <Route
            path='/createproductorder/set'
            element={<ProductAdminCreateOrderScreen />}
          />
          <Route
            path='/useraddresslistcreateorder/set'
            element={<UserAddressListCreateOrderScreen />}
          />
          <Route
            path='/adminpcbedituser/:id/edit'
            element={<UserEditPCBAdminScreen />}
          />
          <Route
            path='/reorderorderpcb/:id/set'
            element={<ReorderPCBAdminCreateOrderPCBScreen />}
          />
          <Route
            path='/reordercustompcb/:id/set'
            element={<ReorderPCBAdminCreateCustomPCBScreen />}
          />
          <Route
            path='/reordercopypcb/:id/set'
            element={<ReorderPCBAdminCreateCopyPCBScreen />}
          />
          <Route
            path='/reorderassemblypcb/:id/set'
            element={<ReorderPCBAdminCreateAssemblyPCBScreen />}
          />
        </Route>

        {/* Admin users */}
        <Route path='' element={<AdminRoute />}>
          <Route path='/admin/categorylist' element={<CategoryListScreen />} />
          <Route path='/admin/category/create' element={<CategoryCreateScreen />} />
          <Route path='/admin/category/:id/edit' element={<CategoryEditScreen />} />

          <Route
            path='/admin/defaultinvoicelist/:id/edit'
            element={<DefaultInvoiceEditScreen />}
          />
          <Route
            path='/admin/defaultinvoicelist/:id'
            element={<DefaultInvoiceDetailScreen />}
          />
          <Route
            path='/admin/defaultinvoicelist'
            element={<DefaultInvoiceListEditScreen />}
          />
          <Route
            path='/admin/defaultinvoiceset'
            element={<DefaultInvoiceSetScreen />}
          />
          <Route
            path='/admin/invoicelist/:id/edit'
            element={<InvoiceEditScreen />}
          />
          <Route
            path='/admin/invoicelist'
            element={<InvoiceListEditScreen />}
          />
          <Route path='/admin/invoiceset' element={<InvoiceSetScreen />} />

          <Route
            path='/admin/quotations/set'
            element={<QuotationSetScreen />}
          />
          <Route
            path='/admin/quotations/:id/edit'
            element={<QuotationEditScreen />}
          />
          <Route
            path='/admin/quotations/:id'
            element={<QuotationDetailScreen />}
          />
          <Route path='/admin/quotations' element={<QuotationListScreen />} />

          <Route path='/admin/customers/set' element={<CustomerSetScreen />} />
          <Route
            path='/admin/customers/:id/edit'
            element={<CustomerEditScreen />}
          />
          <Route
            path='/admin/customers/:id'
            element={<CustomerDetailScreen />}
          />
          <Route path='/admin/customers' element={<CustomerListScreen />} />
          <Route
            path='/admin/customers/selectedcustomer/:id/set'
            element={<QuotationSetSelectedCustomerScreen />}
          />
          <Route
            path='/admin/defaultquotations/set'
            element={<QuotationDefaultSetScreen />}
          />
          <Route
            path='/admin/defaultquotations/:id/edit'
            element={<QuotationDefaultEditScreen />}
          />
          <Route
            path='/admin/defaultquotations/:id'
            element={<QuotationDefaultDetailScreen />}
          />
          <Route
            path='/admin/defaultquotations'
            element={<QuotationDefaultListScreen />}
          />

          <Route
            path='/admin/cartcustompcblist'
            element={<CustomPCBCartListScreen />}
          />
          <Route
            path='/admin/cartcustompcblist/:id/edit'
            element={<CustomPCBCartEditScreen />}
          />
          <Route
            path='/admin/cartcopypcblist'
            element={<CopyPCBCartListScreen />}
          />
          <Route
            path='/admin/cartcopypcblist/:id/edit'
            element={<CopyPCBCartEditScreen />}
          />
          <Route
            path='/admin/cartassemblypcblist'
            element={<OrderassemblyCartListScreen />}
          />
          <Route
            path='/admin/cartassemblypcblist/:id/edit'
            element={<OrderassemblyCartEditScreen />}
          />
          <Route path='/admin/about/:id/edit' element={<AboutEditScreen />} />
          <Route path='/admin/userlist' element={<UserListScreen />} />
          <Route path='/admin/servicelist' element={<ServiceListScreen />} />
          <Route
            path='/admin/service/create'
            element={<ServiceCreateScreen />}
          />
          <Route
            path='/admin/service/:id/edit'
            element={<ServiceEditScreen />}
          />
          <Route path='/admin/orderpcblist' element={<OrderPCBListScreen />} />
          <Route
            path='/admin/orderpcbeditlist'
            element={<OrderPCBEditScreen />}
          />
          <Route
            path='/admin/orderpcbeditlists'
            element={<OrderPCBEditListsScreen />}
          />
          <Route
            path='/admin/orderpcbeditlists/:id/edit'
            element={<OrderPCBEditsScreen />}
          />
          <Route
            path='/admin/ordercopypcblist'
            element={<CopyPCBOrderListScreen />}
          />
          <Route
            path='/admin/ordercopypcbeditlist'
            element={<CopyPCBOrderEditListScreen />}
          />
          <Route
            path='/admin/ordercopypcbeditlist/:id/edit'
            element={<CopyPCBOrderEditScreen />}
          />
          <Route
            path='/admin/ordercustompcblist'
            element={<CustomPCBOrderListScreen />}
          />
          <Route
            path='/admin/ordercustompcbEditlist'
            element={<CustomPCBEditListScreen />}
          />
          <Route
            path='/admin/ordercustompcbEditlist/:id/edit'
            element={<CustomPCBOrderEditScreen />}
          />
          <Route
            path='/admin/orderassemblypcblist'
            element={<OrderassemblyOrderListScreen />}
          />
          <Route
            path='/admin/orderassemblypcbeditlist'
            element={<OrderassemblyOrderEditListScreen />}
          />
          <Route
            path='/admin/assemblyboardeditd'
            element={<OrderassemblyCartDefaultScreen />}
          />
          <Route
            path='/admin/assemblyboardeditlist'
            element={<AssemblyBoardEditScreen />}
          />
          <Route
            path='/admin/assemblyboardeditlist/:id/edit'
            element={<OrderassemblyOrderEditScreen />}
          />
          <Route
            path='/admin/componentrequestimportancelist'
            element={<StockRequestImportanceScreen />}
          />
          <Route
            path='/admin/componentrequestedcancellist'
            element={<StockRequestCancelScreen />}
          />
          <Route path='/admin/showcaselist' element={<ShowcaselListScreen />} />
          <Route path='/admin/foliolist' element={<FolioListScreen />} />
          <Route path='/admin/folio/create' element={<FolioCreateScreen />} />
          <Route path='/admin/folio/:id/edit' element={<FolioEditScreen />} />
          <Route
            path='/admin/showcase/create'
            element={<ShowcaseCreateScreen />}
          />
          <Route
            path='/admin/showcase/:id/edit'
            element={<ShowcaseEditScreen />}
          />

          <Route path='/admin/paymentlist' element={<AdminPaymentListScreen />} />

        </Route>
        {/* Redirect unmatched routes */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Route>
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store} deferLoading={true}>
        <RouterProvider router={router} />
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
)

reportWebVitals()
