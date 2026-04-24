import React, { useState, useRef, useMemo, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
// Icons
import {
  FaShoppingCart,
  FaStore,
  FaChevronDown,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaBoxOpen,
  FaMicrochip,
  FaTools,
  FaStar,
} from "react-icons/fa";
import {
  BsBoxSeam,
  BsCardChecklist,
  BsCpu,
  BsPeopleFill,
} from "react-icons/bs";
import {
  MdDesignServices,
  MdAdminPanelSettings,
  MdPayments,
  MdNotifications,
  MdDelete,
  MdDarkMode,
  MdLightMode,
} from "react-icons/md";

// State & API
import { useLogoutMutation } from "../slices/usersApiSlice";
import { logout } from "../slices/authSlice";
import { resetCart, fetchCartDB } from "../slices/cartSlice";
import { setLanguageCredentials } from "../slices/languageSlice";
import { toggleTheme } from "../slices/themeSlice";
import { useGetProductsQuery } from "../slices/productsApiSlice";
import { useGetServicesQuery } from "../slices/servicesApiSlice";
import { useGetCustomCartByUserIDQuery } from "../slices/custompcbCartApiSlice";
import { useGetcopyCartByUserIDQuery } from "../slices/copypcbCartApiSlice";
import { useGetAssemblyCartByUserIDQuery } from "../slices/assemblypcbCartApiSlice";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from "../slices/notificationApiSlice";

const QUERY_PARAMS = {};
const QUERY_OPTIONS = {
  pollingInterval: 0,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
};

// --- DESKTOP COMPONENTS ---
const SimpleListItem = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
  >
    {label}
  </Link>
);

const CleanLinkItem = ({ to, icon, title, desc, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition-all duration-200 ease-out border border-transparent hover:border-slate-100 dark:hover:border-zinc-800"
  >
    <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
      <span className="text-lg">{icon}</span>
    </div>
    <div className="min-w-0">
      <h6 className="text-sm font-semibold text-slate-700 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
        {title}
      </h6>
      {desc && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium leading-relaxed line-clamp-1 group-hover:dark:text-slate-400 transition-colors">
          {desc}
        </p>
      )}
    </div>
  </Link>
);

const SectionLabel = ({ label, icon }) => (
  <div className="flex items-center gap-2 px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 pb-1">
    {icon && <span className="text-slate-400 dark:text-zinc-500">{icon}</span>} {label}
  </div>
);

const DropdownWrapper = ({ children, className = "" }) => (
  <div
    className={`absolute top-full mt-2 bg-white dark:bg-zinc-950 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 dark:ring-zinc-800 z-50 overflow-hidden animate-slideUpFade origin-top-left ${className}`}
  >
    {children}
  </div>
);

// --- MOBILE COMPONENTS ---
const MobileAccordion = ({ title, icon, isOpen, onClick, children }) => (
  <div className="border-b border-slate-100 dark:border-zinc-800 last:border-0">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-2 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3 font-semibold">
        {icon && <span className="text-slate-400 text-lg">{icon}</span>}
        <span>{title}</span>
      </div>
      <FaChevronDown
        className={`text-xs text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
    >
      <div className="pl-9 pr-2 pb-3 space-y-1">{children}</div>
    </div>
  </div>
);

const MobileLink = ({ to, label, icon, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 py-3 px-2 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-colors border-b border-slate-100 dark:border-zinc-800 last:border-0"
  >
    {icon && <span className="text-slate-400 text-lg">{icon}</span>}
    <span className="font-semibold">{label}</span>
  </Link>
);

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState({});
  const timerRef = useRef(null);

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  const { theme } = useSelector((state) => state.theme);

  const { cartItems } = useSelector((state) => state.cart);
  const { pcbOrderDetails } = useSelector((state) => state.pcbcart);

  const { data: customCarts } = useGetCustomCartByUserIDQuery(userInfo?._id, {
    skip: !userInfo?._id,
  });
  const { data: copyCarts } = useGetcopyCartByUserIDQuery(userInfo?._id, {
    skip: !userInfo?._id,
  });
  const { data: assemblyCarts } = useGetAssemblyCartByUserIDQuery(
    userInfo?._id,
    { skip: !userInfo?._id },
  );

  const totalCartItems = useMemo(() => {
    let count = 0;
    // 1. Standard Products
    count +=
      cartItems?.reduce((acc, item) => acc + (Number(item.qty) || 1), 0) || 0;
    // 2. Gerber PCB
    count += pcbOrderDetails?.length || 0;
    // 3. Custom PCB (Filter qty > 0)
    count +=
      customCarts?.data?.filter((i) => (i.qty || i.pcb_qty) > 0).length || 0;
    // 4. Copy PCB (Filter pcb_qty > 0)
    count += copyCarts?.data?.filter((i) => i.pcb_qty > 0).length || 0;
    // 5. Assembly Board (Filter pcb_qty > 0)
    count += assemblyCarts?.data?.filter((i) => i.pcb_qty > 0).length || 0;
    return count;
  }, [cartItems, pcbOrderDetails, customCarts, copyCarts, assemblyCarts]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const { data } = useGetProductsQuery(QUERY_PARAMS, QUERY_OPTIONS);
  const { data: services, isLoading: serviceLoading } = useGetServicesQuery(
    QUERY_PARAMS,
    QUERY_OPTIONS,
  );

  useEffect(() => {
    if (userInfo) dispatch(fetchCartDB());
  }, [userInfo, dispatch]);

  const { data: notifications } = useGetNotificationsQuery(undefined, {
    skip: !userInfo,
    pollingInterval: 30000,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const groupedNotifications = useMemo(() => {
    if (!notifications) return {};
    return notifications.reduce((groups, n) => {
      const date = new Date(n.createdAt);
      let group = "Earlier";
      if (isToday(date)) group = "Today";
      else if (isYesterday(date)) group = "Yesterday";

      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
      return groups;
    }, {});
  }, [notifications]);

  const categories = useMemo(() => {
    if (!data?.products) return [];
    const validProducts = data.products.filter(
      (p) => p[language === "thai" ? "categoryThai" : "category"],
    );
    const uniqueCategories = new Set(
      validProducts.map(
        (p) => p[language === "thai" ? "categoryThai" : "category"],
      ),
    );
    return Array.from(uniqueCategories).map((cat) => ({
      label: cat,
      value: cat,
    }));
  }, [data, language]);

  const handleMouseEnter = (menu) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveDropdown(menu);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };
  const closeMenu = () => setShowOffcanvas(false);

  const toggleMobileMenu = (menu) => {
    setMobileMenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      dispatch(resetCart());
      navigate("/login");
      closeMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead({ id: n.id, scope: n.scope });

    // Payment Success → ไปหน้า Order Lists
    if (n.type === "payment_success") {
      navigate("/orderlist");
      setActiveDropdown(null);
    } else if (n.type === "star_expiration_warning" || n.type === "star_reset") {
      if (n.related_id) {
        navigate(`/componenteditlist/${n.related_id}/edit`);
        setActiveDropdown(null);
      }
    } else if (n.type === "stock_request") {
      navigate("/componentrequestlist");
      setActiveDropdown(null);
    }
  };

  const handleDeleteNotification = async (e, n) => {
    e.stopPropagation();
    try {
      await deleteNotification({ id: n.id, scope: n.scope }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications().unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const t = {
    en: {
      home: "Home",
      product: "Products",
      service: "Services",
      blog: "Blog",
      folio: "Portfolio",
      signIn: "Sign In",
      logout: "Logout",
      profile: "Profile",
      Hardware: "Hardware",
      Ordering: "Ordering Tools",
      Inventory: "Inventory",
      Admin: "Admin",
      viewAll: "View All",
      Dashboard: "Dashboard",
      CheckBoom: "Check BOM",
      MyRequested: "My Requests",
      AllRequested: "All Requests",
      AddQuantity: "Add Stock",
      ManageComponents: "Manage Items",
      confirmCustomIdeaPCB: "Confirm Custom PCB",
      confirmCopyModifyPCB: "Confirm Copy PCB",
      confirmAssemblyBoard: "Confirm Assembly",
      orderlist: "Product Orders",
      orderCustomerGerberPCB: "PCB Orders",
      orderCustomIdeaPCB: "Custom Orders",
      orderCopyModifyPCB: "Copy Orders",
      orderAssemblyPCB: "Assembly Orders",
      adminProducts: "Manage Products",
      Categories: "Categories",
      foliolistAdmin: "Folio List",
      Quotations: "Quotations",
      Invoices: "Invoices",
      Customers: "Customers",
      adminUsers: "Users",
      folioListAdmin: "Folio List",
      customIdeaPCB: "Custom Idea PCB",
      copyModifyPCB: "Copy & Modify PCB",
      orderCustomerPCB: "Order Customer PCB",
      assemblyBoard: "Assembly Board",
      confirmStandardPCB: "Confirm Standard PCB",
      ConfirmList: "Approvals",
      AdminPayments: "Payment Checks",
      ServiceConfig: "Service Config",
      Finance: "Finance",
      People: "People",
      StoreAdmin: "Store Admin",
      Requests: "Requests",
      descCustom: "Start from your idea",
      descCopy: "Clone/Modify existing",
      descOrder: "Production from Gerber",
      descAssy: "Professional Assembly",
    },
    thai: {
      home: "หน้าแรก",
      product: "สินค้า",
      service: "บริการ",
      blog: "บทความ",
      folioList: "จัดการผลงาน",
      folio: "ผลงาน",
      signIn: "เข้าสู่ระบบ",
      logout: "ออกระบบ",
      profile: "โปรไฟล์",
      Hardware: "ฮาร์ดแวร์",
      Ordering: "เครื่องมือสั่งงาน",
      Inventory: "คลังสินค้า",
      Admin: "ผู้ดูแลระบบ",
      viewAll: "ดูทั้งหมด",
      Dashboard: "แดชบอร์ดสต็อก",
      CheckBoom: "ตรวจสอบ BOM",
      MyRequested: "รายการเบิกของฉัน",
      AllRequested: "รายการเบิกทั้งหมด",
      AddQuantity: "เติมสต็อกสินค้า",
      ManageComponents: "จัดการรายการสินค้า",
      confirmCustomIdeaPCB: "อนุมัติ Custom PCB",
      confirmCopyModifyPCB: "อนุมัติ Copy PCB",
      confirmAssemblyBoard: "อนุมัติงานประกอบ",
      orderlist: "ออเดอร์สินค้า",
      orderCustomerGerberPCB: "ออเดอร์ PCB",
      orderCustomIdeaPCB: "ออเดอร์ Custom",
      orderCopyModifyPCB: "ออเดอร์ Copy",
      orderAssemblyPCB: "ออเดอร์ Assembly",
      adminProducts: "จัดการสินค้าหน้าร้าน",
      Categories: "หมวดหมู่สินค้า",
      foliolistAdmin: "รายการผลงาน",
      Quotations: "ใบเสนอราคา",
      Invoices: "ใบแจ้งหนี้",
      Customers: "รายชื่อลูกค้า",
      adminUsers: "ผู้ใช้งานระบบ",
      customIdeaPCB: "สั่งทำไอเดีย PCB",
      copyModifyPCB: "ก๊อปปี้/แก้ไข PCB",
      orderCustomerPCB: "สั่งผลิต PCB",
      assemblyBoard: "งานประกอบบอร์ด",
      confirmStandardPCB: "อนุมัติ Standard PCB",
      ConfirmList: "รายการรออนุมัติ",
      AdminPayments: "ตรวจสอบยอดเงิน",
      ServiceConfig: "ตั้งค่าบริการ",
      Finance: "การเงิน",
      People: "บุคลากร",
      StoreAdmin: "ผู้ดูแลร้านค้า",
      Requests: "การเบิกจ่าย",
      descCustom: "เริ่มจากไอเดียของคุณ",
      descCopy: "ก๊อปปี้หรือแก้ไขบอร์ดเดิม",
      descOrder: "สั่งผลิตจากไฟล์ Gerber",
      descAssy: "บริการประกอบวงจรครบวงจร",
    },
  }[language || "en"];

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  //  ปรับปรุง Logic การเช็ค Role ให้ยืดหยุ่นขึ้น (รองรับค่า 1/0 จาก SQL)
  const isStore =
    userInfo &&
    (Number(userInfo.isStore) === 1 || Number(userInfo.isAdmin) === 1);
  const isPCB =
    userInfo &&
    (Number(userInfo.isPCBAdmin) === 1 || Number(userInfo.isAdmin) === 1);
  const isAdmin = userInfo && Number(userInfo.isAdmin) === 1;

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white/95 dark:bg-black backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/60 z-[100] h-[70px] md:h-[76px] m-0 p-0 transition-colors duration-500 print:hidden">
        <div className="w-full h-full flex items-center justify-between px-4 md:px-10 relative m-0">
          {/* 1. LOGO */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 z-20"
            onClick={closeMenu}
          >
            <img
              src="/image/favicon.ico"
              alt="Pawin"
              className="h-7 md:h-8 w-auto"
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight block transition-colors duration-500">
              PAWIN
            </span>
          </Link>

          {/* 2. CENTER NAVIGATION */}
          <nav className="hidden xl:flex items-center gap-1 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <Link
              to="/"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-white dark:hover:text-blue-400 rounded-lg transition-colors"
            >
              {t.home}
            </Link>

            {/* Products Dropdown */}
            <div
              className="relative group h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("product")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors ${activeDropdown === "product" ? "text-blue-600 bg-blue-50/50 dark:text-blue-400 dark:bg-zinc-800" : "text-slate-600 hover:text-slate-900 dark:text-white dark:hover:text-blue-400"}`}
              >
                {t.product}{" "}
                <FaChevronDown
                  size={8}
                  className={`opacity-50 transition-transform ${activeDropdown === "product" ? "rotate-180" : ""}`}
                />
              </button>
              {activeDropdown === "product" && (
                <DropdownWrapper className="w-max left-0 min-w-[200px]">
                  <div className="p-2">
                    <SectionLabel label={t.product} />
                    <div className="space-y-0.5">
                      <SimpleListItem
                        to="/product"
                        label={
                          language === "thai" ? "สินค้าทั้งหมด" : "All Products"
                        }
                        onClick={() => setActiveDropdown(null)}
                      />
                      {categories.map((cat, idx) => (
                        <SimpleListItem
                          key={idx}
                          to={`/product?category=${cat.value}`}
                          label={cat.label}
                          onClick={() => setActiveDropdown(null)}
                        />
                      ))}
                    </div>
                  </div>
                </DropdownWrapper>
              )}
            </div>

            {/* Services Dropdown */}
            <div
              className="relative group h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("service")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors ${activeDropdown === "service" ? "text-blue-600 bg-blue-50/50 dark:text-blue-400 dark:bg-zinc-800" : "text-slate-600 hover:text-slate-900 dark:text-white dark:hover:text-blue-400"}`}
              >
                {t.service}{" "}
                <FaChevronDown
                  size={8}
                  className={`opacity-50 transition-transform ${activeDropdown === "service" ? "rotate-180" : ""}`}
                />
              </button>
              {activeDropdown === "service" && !serviceLoading && (
                <DropdownWrapper className="w-[550px] left-1/2 transform -translate-x-1/2 flex">
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex items-center mb-4">
                      <SectionLabel label="SOLUTIONS" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-slate-800 dark:text-zinc-200 font-bold text-sm transition-colors">
                        <BsCpu className="text-blue-500 dark:text-blue-400" /> {t.Hardware}
                      </div>
                      <div className="space-y-1">
                        {services?.services
                          ?.filter(
                            (s) => s.deploymentTypes === "Hardware Deployment",
                          )
                          .slice(0, 5)
                          .map((s) => (
                            <SimpleListItem
                              key={s.ID}
                              to={`/service/${s.ID}`}
                              label={
                                language === "thai"
                                  ? s.headerThaiOne
                                  : s.headerTextOne
                              }
                              onClick={() => setActiveDropdown(null)}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-[280px] bg-slate-50 dark:bg-zinc-900/50 border-l border-slate-100 dark:border-zinc-800 p-4 md:p-6 transition-colors">
                    <SectionLabel label={t.Ordering} />
                    <div className="space-y-2 mt-3">
                      <CleanLinkItem
                        to="/custompcb"
                        icon={<FaTools />}
                        title={t.customIdeaPCB}
                        desc={t.descCustom}
                        onClick={() => setActiveDropdown(null)}
                      />
                      <CleanLinkItem
                        to="/copypcb"
                        icon={<FaBoxOpen />}
                        title={t.copyModifyPCB}
                        desc={t.descCopy}
                        onClick={() => setActiveDropdown(null)}
                      />
                      <CleanLinkItem
                        to="/orderpcb"
                        icon={<FaMicrochip />}
                        title={t.orderCustomerPCB}
                        desc={t.descOrder}
                        onClick={() => setActiveDropdown(null)}
                      />
                      <CleanLinkItem
                        to="/assemblypcb"
                        icon={<BsCpu />}
                        title={t.assemblyBoard}
                        desc={t.descAssy}
                        onClick={() => setActiveDropdown(null)}
                      />
                    </div>
                  </div>
                </DropdownWrapper>
              )}
            </div>

            <Link
              to="/folio"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-white dark:hover:text-blue-400 rounded-lg transition-colors"
            >
              {t.folio}
            </Link>
            <Link
              to="/blogs"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-white dark:hover:text-blue-400 rounded-lg transition-colors"
            >
              {t.blog}
            </Link>
          </nav>

          {/* 3. RIGHT ACTIONS */}
          <div className="flex items-center gap-3 shrink-0 z-20">
            {(isStore || isPCB || isAdmin) && (
              <div className="hidden xl:flex items-center gap-1 pr-3 border-r border-slate-200 mr-1">
                {isStore && (
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("store")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/components"
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:text-white dark:hover:text-blue-400 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      <FaStore size={16} />
                    </Link>
                    {activeDropdown === "store" && (
                      <DropdownWrapper className="w-max right-0">
                        <div className="p-2 min-w-[220px]">
                          <SectionLabel
                            label={t.Inventory}
                            icon={<BsBoxSeam />}
                          />
                          <div className="space-y-0.5 mb-2">
                            <SimpleListItem
                              to="/components"
                              label={t.Dashboard}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/componentcheckboom"
                              label={t.CheckBoom}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/componentaddproductlist"
                              label={t.AddQuantity}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/componenteditlist"
                              label={t.ManageComponents}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                          <SectionLabel
                            label={t.Requests}
                            icon={<BsCardChecklist />}
                          />
                          <div className="space-y-0.5 mb-2">
                            <SimpleListItem
                              to="/componentuserrequestlist"
                              label={t.MyRequested}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/componentrequestlist"
                              label={t.AllRequested}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                          <SectionLabel
                            label={t.StoreAdmin}
                            icon={<FaBoxOpen />}
                          />
                          <div className="space-y-0.5">
                            <SimpleListItem
                              to="/admin/productlist"
                              label={t.adminProducts}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/orderlist"
                              label={t.orderlist}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/servicelist"
                              label={t.ServiceConfig}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                        </div>
                      </DropdownWrapper>
                    )}
                  </div>
                )}
                {isPCB && (
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("pcb")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-full transition-colors">
                      <MdDesignServices size={18} />
                    </button>
                    {activeDropdown === "pcb" && (
                      <DropdownWrapper className="w-max right-0">
                        <div className="p-2 min-w-[220px]">
                          <SectionLabel
                            label={language === "thai" ? "รายการสั่งทำ PCB" : "PCB Orders"}
                            icon={<FaMicrochip />}
                          />
                          <div className="space-y-0.5 mb-2">
                            <SimpleListItem
                              to="/admin/orderpcblist"
                              label={t.orderCustomerGerberPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/ordercustompcblist"
                              label={t.orderCustomIdeaPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/ordercopypcblist"
                              label={t.orderCopyModifyPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/orderassemblypcblist"
                              label={t.orderAssemblyPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                          <SectionLabel
                            label={t.ConfirmList}
                            icon={<BsCardChecklist />}
                          />
                          <div className="space-y-0.5">
                            <SimpleListItem
                              to="/admin/cartcustompcblist"
                              label={t.confirmCustomIdeaPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/cartcopypcblist"
                              label={t.confirmCopyModifyPCB}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/cartassemblypcblist"
                              label={t.confirmAssemblyBoard}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                        </div>
                      </DropdownWrapper>
                    )}
                  </div>
                )}
                {isAdmin && (
                  <div
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter("admin")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to="/admin/orderlist"
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:text-white dark:hover:text-rose-400 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      <MdAdminPanelSettings size={18} />
                    </Link>
                    {activeDropdown === "admin" && (
                      <DropdownWrapper className="w-max right-0">
                        <div className="p-2 min-w-[220px]">
                          <SectionLabel
                            label={t.Finance}
                            icon={<MdPayments />}
                          />
                          <div className="space-y-0.5 mb-2">
                            <SimpleListItem
                              to="/admin/paymentlist"
                              label={t.AdminPayments}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/quotations"
                              label={t.Quotations}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/invoicelist"
                              label={t.Invoices}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                          <SectionLabel
                            label={t.People}
                            icon={<BsPeopleFill />}
                          />
                          <div className="space-y-0.5">
                            <SimpleListItem
                              to="/admin/customers"
                              label={t.Customers}
                              onClick={() => setActiveDropdown(null)}
                            />
                            <SimpleListItem
                              to="/admin/userlist"
                              label={t.adminUsers}
                              onClick={() => setActiveDropdown(null)}
                            />
                          </div>
                        </div>
                      </DropdownWrapper>
                    )}
                  </div>
                )}
              </div>
            )}

            {userInfo && (
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("notifications")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="relative w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 dark:text-white dark:hover:bg-zinc-800 rounded-full transition-all duration-200 active:scale-90">
                  <MdNotifications size={22} className="text-slate-600 dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {activeDropdown === "notifications" && (
                  <DropdownWrapper className="!fixed sm:!absolute top-[70px] sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-[400px] !mt-2 sm:!mt-3 overflow-visible z-[1050]">
                    <div className="hidden sm:block absolute top-0 right-4 -mt-1.5 w-3 h-3 bg-white rotate-45 border-l border-t border-slate-900/5"></div>
                    <div className="relative bg-white rounded-xl overflow-hidden border border-slate-100 shadow-xl flex flex-col">
                      <div className="bg-white border-b border-slate-100 flex flex-col">
                        <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <MdNotifications size={16} className="sm:size-[18px]" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight">Notifications</h3>
                          </div>
                          {unreadCount > 0 && (
                            <div className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black rounded-md shadow-sm">
                              {unreadCount} NEW
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                          <button
                            onClick={() => markAllAsRead()}
                            disabled={unreadCount === 0}
                            className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all py-1 px-2 sm:py-1.5 sm:px-3 hover:bg-white rounded-md hover:shadow-xs"
                          >
                            Mark all read
                          </button>
                          <div className="w-px h-3 bg-slate-200"></div>
                          <button
                            onClick={handleClearAll}
                            disabled={!notifications?.length}
                            className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-all py-1 px-2 sm:py-1.5 sm:px-3 hover:bg-white rounded-md hover:shadow-xs"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[300px] sm:max-h-[420px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {notifications?.length > 0 ? (
                          <div className="pb-2">
                            {["Today", "Yesterday", "Earlier"].map((group) => {
                              const groupItems = groupedNotifications[group] || [];
                              if (groupItems.length === 0) return null;
                              return (
                                <div key={group} className="mt-1 first:mt-0">
                                  <div className="sticky top-0 z-10 px-5 py-2.5 bg-slate-50/95 backdrop-blur-sm border-y border-slate-100/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{groupItems.length} messages</span>
                                  </div>
                                  <div className="divide-y divide-slate-100/50">
                                    {groupItems.map((n) => {
                                      const rowClasses = "px-4 py-3 sm:px-5 sm:py-4 hover:bg-white transition-all cursor-pointer relative group " + (!n.isRead ? "bg-indigo-50/20" : "");
                                      const textClasses = "text-[12px] sm:text-[13px] leading-relaxed mb-1 sm:mb-1.5 " + (!n.isRead ? "text-slate-900 font-bold" : "text-slate-600 font-medium");
                                      return (
                                        <div key={n.id} className={rowClasses} onClick={() => handleNotificationClick(n)}>
                                          {!n.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"></div>
                                          )}
                                          <div className="flex gap-2.5 sm:gap-4">
                                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm ring-1 ring-slate-100 group-hover:ring-slate-200 group-hover:shadow transition-all duration-300">
                                              {n.product_img ? (
                                                <img
                                                  src={n.product_img}
                                                  alt="Product"
                                                  className="w-full h-full object-contain mix-blend-multiply scale-110 group-hover:scale-125 transition-transform duration-500"
                                                  onError={(e) => { e.target.onerror = null; e.target.src = "/images/sample.jpg"; }}
                                                />
                                              ) : n.type?.includes("star") ? (
                                                <FaStar className="size-3.5 sm:size-4 text-amber-500 animate-pulse-slow" />
                                              ) : (
                                                <MdNotifications className="size-4 sm:size-[18px] text-indigo-500" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className={textClasses}>
                                                {n.message}
                                              </p>
                                              <div className="flex items-center justify-between">
                                                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-tight">
                                                  {format(new Date(n.createdAt), "HH:mm")}
                                                </span>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteNotification(e, n); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                  >
                                                    <MdDelete size={14} className="sm:size-[15px]" />
                                                  </button>
                                                  {!n.isRead && (
                                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 md:py-6 sm:py-20 px-4 sm:px-8 text-center bg-white">
                            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-50 rounded-full sm:rounded-[2rem] flex items-center justify-center mx-auto mb-3 sm:mb-5 border border-slate-100 shadow-inner rotate-12 group-hover:rotate-0 transition-transform duration-500">
                              <MdNotifications className="text-slate-200 -rotate-12 size-6 sm:size-10" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">Clean slate</h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium max-w-[180px] sm:max-w-[200px] mx-auto leading-relaxed">
                              You're all caught up! No notifications at the moment.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 bg-white border-t border-slate-100 text-center">
                        <button className="w-full py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100 text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] rounded-lg sm:rounded-xl transition-all border border-slate-100 active:scale-[0.98]">
                          Activity Dashboard
                        </button>
                      </div>
                    </div>
                  </DropdownWrapper>
                )}
              </div>
            )}

            <Link
              to={userInfo ? "/cart" : "/login"}
              className="relative w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200 active:scale-90"
            >
              <FaShoppingCart size={18} />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-white shadow-sm">
                  {totalCartItems}
                </span>
              )}
            </Link>

            <button
              onClick={() =>
                dispatch(
                  setLanguageCredentials(language === "en" ? "thai" : "en"),
                )
              }
              className="hidden xl:flex w-9 h-9 items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors text-xs font-bold uppercase border border-slate-100 dark:border-zinc-800"
            >
              {language === "en" ? "TH" : "EN"}
            </button>

            <button
              onClick={() => dispatch(toggleTheme())}
              className="hidden xl:flex w-9 h-9 items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 rounded-full transition-colors"
            >
              {theme === "dark" ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
            </button>

            {userInfo ? (
              <div
                className="hidden xl:block relative ml-2"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                    <FaUserCircle size={18} />
                  </div>
                  {/*  แก้ไขจุดที่ Error: ใช้ Optional Chaining เช็ค userInfo?.name ก่อน split เสมอ */}
                  <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
                    {userInfo?.name ? userInfo.name.split(" ")[0] : ""}
                  </span>
                </button>
                {activeDropdown === "profile" && (
                  <DropdownWrapper className="w-[160px] right-0">
                    <div className="p-2 space-y-1">
                      <SimpleListItem
                        to="/profile"
                        label={t.profile}
                        onClick={() => setActiveDropdown(null)}
                      />
                      <button
                        onClick={logoutHandler}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors"
                      >
                        {t.logout}
                      </button>
                    </div>
                  </DropdownWrapper>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden xl:inline-flex ml-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-full transition-transform hover:-translate-y-0.5 shadow-md"
              >
                {t.signIn}
              </Link>
            )}

            <button
              onClick={() => setShowOffcanvas(true)}
              className="xl:hidden ml-1 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FaBars size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE OFFCANVAS --- */}
      {showOffcanvas && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] xl:hidden transition-opacity duration-300"
          onClick={closeMenu}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 right-0 w-[85%] max-w-[320px] bg-white z-[1010] shadow-2xl transform transition-transform duration-300 ease-out xl:hidden flex flex-col ${showOffcanvas ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <span className="font-black text-xl text-slate-900 tracking-tight">
            PAWIN
          </span>
          <button
            onClick={closeMenu}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-start">
          {userInfo ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3 text-start">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                <FaUserCircle size={32} />
              </div>
              <div className="overflow-hidden text-start">
                <div className="font-bold text-slate-800 truncate">
                  {userInfo?.name || ""}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {userInfo?.email || ""}
                </div>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="text-xs font-bold text-blue-600 mt-1 inline-block hover:underline"
                >
                  {t.profile}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex w-full items-center justify-center py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg"
              >
                {t.signIn}
              </Link>
            </div>
          )}
          <div className="space-y-1">
            <MobileLink to="/" label={t.home} onClick={closeMenu} />
            <MobileAccordion
              title={t.product}
              isOpen={mobileMenuOpen["product"]}
              onClick={() => toggleMobileMenu("product")}
            >
              <Link
                to="/product"
                onClick={closeMenu}
                className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
              >
                {language === "thai" ? "สินค้าทั้งหมด" : "All Products"}
              </Link>
              {categories.map((cat, idx) => (
                <Link
                  key={idx}
                  to={`/product?category=${cat.value}`}
                  onClick={closeMenu}
                  className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
                >
                  {cat.label}
                </Link>
              ))}
            </MobileAccordion>
            <MobileAccordion
              title={t.service}
              isOpen={mobileMenuOpen["service"]}
              onClick={() => toggleMobileMenu("service")}
            >
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-1">
                {language === "thai" ? "โซลูชันฮาร์ดแวร์" : "Hardware Solutions"}
              </div>
              {services?.services
                ?.filter((s) => s.deploymentTypes === "Hardware Deployment")
                .map((s) => (
                  <Link
                    key={s.ID}
                    to={`/service/${s.ID}`}
                    onClick={closeMenu}
                    className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
                  >
                    {language === "thai" ? s.headerThaiOne : s.headerTextOne}
                  </Link>
                ))}
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                {language === "thai" ? "เครื่องมือสั่งซื้อ" : "Ordering Tools"}
              </div>
              <Link
                to="/custompcb"
                onClick={closeMenu}
                className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
              >
                {t.customIdeaPCB}
              </Link>
              <Link
                to="/copypcb"
                onClick={closeMenu}
                className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
              >
                {t.copyModifyPCB}
              </Link>
              <Link
                to="/orderpcb"
                onClick={closeMenu}
                className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
              >
                {t.orderCustomerPCB}
              </Link>
              <Link
                to="/assemblypcb"
                onClick={closeMenu}
                className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3"
              >
                {t.assemblyBoard}
              </Link>
            </MobileAccordion>
            <MobileLink to="/folio" label={t.folio} onClick={closeMenu} />
            <MobileLink to="/blogs" label={t.blog} onClick={closeMenu} />
            <MobileLink to="/admin/foliolist" label={t.folioList} onClick={closeMenu} />
            {(isStore || isPCB || isAdmin) && (
              <MobileAccordion
                title={t.Admin}
                icon={<MdAdminPanelSettings />}
                isOpen={mobileMenuOpen["admin"]}
                onClick={() => toggleMobileMenu("admin")}
              >
                {isStore && (
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 mt-2">
                      {t.Inventory}
                    </div>
                    <Link to="/components" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.Dashboard}
                    </Link>
                    <Link to="/componentcheckboom" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.CheckBoom}
                    </Link>
                    <Link to="/componentaddproductlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.AddQuantity}
                    </Link>
                    <Link to="/componenteditlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.ManageComponents}
                    </Link>

                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 mt-4">
                      {t.Requests}
                    </div>
                    <Link to="/componentuserrequestlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.MyRequested}
                    </Link>
                    <Link to="/componentrequestlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.AllRequested}
                    </Link>

                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 mt-4">
                      {t.StoreAdmin}
                    </div>
                    <Link to="/admin/productlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.adminProducts}
                    </Link>
                    <Link to="/admin/orderlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-blue-600 border-l-2 border-slate-200 pl-3">
                      {t.orderlist}
                    </Link>
                  </div>
                )}

                {isPCB && (
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 mt-2">
                      {language === "thai" ? "รายการสั่งทำ PCB" : "PCB Orders"}
                    </div>
                    <Link to="/admin/orderpcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.orderCustomerGerberPCB}
                    </Link>
                    <Link to="/admin/ordercustompcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.orderCustomIdeaPCB}
                    </Link>
                    <Link to="/admin/ordercopypcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.orderCopyModifyPCB}
                    </Link>
                    <Link to="/admin/orderassemblypcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.orderAssemblyPCB}
                    </Link>

                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 mt-4">
                      {t.ConfirmList}
                    </div>
                    <Link to="/admin/cartcustompcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.confirmCustomIdeaPCB}
                    </Link>
                    <Link to="/admin/cartcopypcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.confirmCopyModifyPCB}
                    </Link>
                    <Link to="/admin/cartassemblypcblist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-emerald-600 border-l-2 border-slate-200 pl-3">
                      {t.confirmAssemblyBoard}
                    </Link>
                  </div>
                )}

                {isAdmin && (
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5 mt-2">
                      {t.Finance}
                    </div>
                    <Link to="/admin/paymentlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.AdminPayments}
                    </Link>
                    <Link to="/admin/quotations" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.Quotations}
                    </Link>
                    <Link to="/admin/invoicelist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.Invoices}
                    </Link>

                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5 mt-4">
                      {t.People}
                    </div>
                    <Link to="/admin/customers" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.Customers}
                    </Link>
                    <Link to="/admin/userlist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.adminUsers}
                    </Link>
                    <Link to="/admin/servicelist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.ServiceConfig}
                    </Link>
                    <Link to="/admin/foliolist" onClick={closeMenu} className="block py-2 text-sm text-slate-600 hover:text-rose-600 border-l-2 border-slate-200 pl-3">
                      {t.folioListAdmin}
                    </Link>
                  </div>
                )}
              </MobileAccordion>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch(setLanguageCredentials("en"))}
              className={`py - 2 text - xs font - bold rounded - lg border transition - colors ${language === "en" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"}`}
            >
              English
            </button>
            <button
              onClick={() => dispatch(setLanguageCredentials("thai"))}
              className={`py-2 text-xs font-bold rounded-lg border transition-colors ${language === "thai" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"}`}
            >
              ภาษาไทย
            </button>
          </div>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
          >
            {theme === "dark" ? (
              <>
                <MdLightMode size={16} /> Light Mode
              </>
            ) : (
              <>
                <MdDarkMode size={16} /> Dark Mode
              </>
            )}
          </button>
          {userInfo && (
            <button
              onClick={logoutHandler}
              className="w-full mt-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
