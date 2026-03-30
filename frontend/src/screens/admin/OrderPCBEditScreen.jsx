import React, { useState, useEffect } from "react";
import {
  Table,
  Form,
  Button,
  Container,
  Row,
  Col,
  InputGroup,
  Nav,
  Card,
  Badge,
} from "react-bootstrap";
import {
  useUpdateShippingRatesMutation,
  useGetOwnShippingRatesQuery,
} from "../../slices/orderpcbSlice";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  FaSave,
  FaSlidersH,
  FaLayerGroup,
  FaTruck,
  FaChevronRight,
  FaGlobeAsia,
  FaCoins,
  FaBars,
  FaTimes,
} from "react-icons/fa";

// --- Helpers ---
const generateRates = () => {
  const rates = [];
  for (let i = 0.5; i <= 200; i += 0.5) {
    rates.push({ kg: parseFloat(i.toFixed(1)), ems: 0, dhl: 0 });
  }
  return rates;
};

const OrderPCBEditScreen = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [rates, setRates] = useState(generateRates());
  const [settings, setSettings] = useState({});
  const [showSidebar, setShowSidebar] = useState(false); // State for Mobile Menu

  const [baseMaterials, setBaseMaterials] = useState([]);
  const [surfaceFinishes, setSurfaceFinishes] = useState([]);
  const [copperWeights, setCopperWeights] = useState([]);
  const [pcbColors, setPcbColors] = useState([]);

  const { data, isLoading, error } = useGetOwnShippingRatesQuery();
  const [updateShippingRates, { isLoading: isUpdating }] =
    useUpdateShippingRatesMutation();

  useEffect(() => {
    if (data) {
      const defaults = data.defaultPricing || {};
      setSettings({
        basePrice: defaults.base_price || 0,
        pricePerCm: defaults.price_per_cm2 || 0,
        extraService: defaults.extra_service_fee || 0,
        profitMargin: defaults.profit_margin || 0,
        exchangeRate: defaults.exchange_rate || 0,
        vat: defaults.vat_percent || 0,
        build_time: defaults.build_time || 0,
        dhlRate: defaults.dhl_service_fixed || 0,
      });

      const mapPrice = (list) =>
        (list || []).map((item) => ({ ...item, price: Number(item.price) }));
      setBaseMaterials(mapPrice(data.baseMaterials));
      setSurfaceFinishes(mapPrice(data.surfaceFinishes));
      setCopperWeights(mapPrice(data.copperWeights));
      setPcbColors(mapPrice(data.pcbColors));

      const updatedRates = generateRates().map((rate) => {
        const emsRate = data.shippingRates.find(
          (r) =>
            Number(r.weight_kg).toFixed(1) === rate.kg.toFixed(1) &&
            r.shipping_type === "EMS",
        );
        const dhlRate = data.shippingRates.find(
          (r) =>
            Number(r.weight_kg).toFixed(1) === rate.kg.toFixed(1) &&
            r.shipping_type === "DHL",
        );
        return {
          ...rate,
          ems: emsRate ? emsRate.price : 0,
          dhl: dhlRate ? dhlRate.price : 0,
        };
      });
      setRates(updatedRates);
    }
  }, [data]);

  const handleSubmit = async () => {
    const payload = {
      base_price: settings.basePrice,
      price_per_cm2: settings.pricePerCm,
      extra_service_fee: settings.extraService,
      profit_margin: settings.profitMargin,
      exchange_rate: settings.exchangeRate,
      vat_percent: settings.vat,
      build_time: settings.build_time,
      dhl_service_fixed: settings.dhlRate,
      bulk_shipping_rates: rates.flatMap((r) => [
        { weight_kg: r.kg, shipping_type: "EMS", price: r.ems },
        { weight_kg: r.kg, shipping_type: "DHL", price: r.dhl },
      ]),
      baseMaterials,
      surfaceFinishes,
      copperWeights,
      pcbColors,
    };
    try {
      await updateShippingRates(payload).unwrap();
      toast.success("Configuration saved successfully");
      setShowSidebar(false); // Close sidebar on mobile after save
    } catch (err) {
      toast.error("Failed to save configuration");
    }
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  // --- Styled Components ---

  const SettingsTable = ({ title, items, colorTheme, icon }) => (
    <Card className="shadow-sm border-0 mb-4 overflow-hidden">
      <div
        className={`p-3 border-bottom d-flex align-items-center gap-2 bg-${colorTheme}-subtle text-${colorTheme}`}
      >
        {icon} <h6 className="mb-0 fw-bold text-uppercase">{title}</h6>
      </div>
      <Table bordered hover responsive className="mb-0 align-middle">
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td
                className={`bg-light text-secondary fw-medium`}
                style={{
                  width: "40%",
                  minWidth: "140px",
                  borderRight: "1px solid #dee2e6",
                }}
              >
                <span className="small text-uppercase ls-1">{item.label}</span>
              </td>
              <td className="p-0">
                <InputGroup className="input-group-flush">
                  <Form.Control
                    type="number"
                    className="border-0 shadow-none px-3 text-dark fw-bold"
                    value={settings[item.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [item.key]: Number(e.target.value),
                      })
                    }
                    style={{ height: "50px", fontSize: "1rem" }}
                  />
                  <InputGroup.Text className="bg-white border-0 text-muted small pe-3 fw-bold">
                    {item.unit}
                  </InputGroup.Text>
                </InputGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );

  const MaterialTable = ({ title, data, setData, colorClass }) => (
    <Card className="shadow-sm border-0 h-100 overflow-hidden material-card">
      <div
        className={`px-3 py-2 border-bottom ${colorClass} text-white d-flex justify-content-between align-items-center`}
      >
        <span className="fw-bold small text-uppercase">{title}</span>
      </div>
      <div className="table-responsive">
        <Table bordered hover size="sm" className="mb-0 align-middle">
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td
                  className="ps-3 text-secondary small fw-bold"
                  style={{ minWidth: "120px" }}
                >
                  {item.name}
                </td>
                <td className="p-0" style={{ width: "100px" }}>
                  <Form.Control
                    type="number"
                    className="border-0 shadow-none text-end pe-3 text-primary fw-bold"
                    value={item.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setData((prev) =>
                        prev.map((ent, i) =>
                          i === index ? { ...ent, price: val } : ent,
                        ),
                      );
                    }}
                    style={{ height: "40px", background: "transparent" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );

  return (
    <div
      className="d-flex"
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f0f2f5",
        position: "relative",
      }}
    >
      {/* 0. MOBILE OVERLAY (Backdrop) */}
      {showSidebar && (
        <div
          className="d-md-none position-fixed w-100 h-100 bg-black bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 1. SIDEBAR (Responsive) */}
      <div
        className={`d-flex flex-column text-white sidebar-container ${showSidebar ? "show-sidebar" : ""}`}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <div className="bg-primary rounded p-1">
                <FaSlidersH className="text-white" />
              </div>
              <h5 className="fw-bold mb-0">PCB Admin</h5>
            </div>
            <small className="text-white-50 ms-1">Pricing Control</small>
          </div>
          {/* Mobile Close Button */}
          <Button
            variant="link"
            className="text-white d-md-none p-0"
            onClick={() => setShowSidebar(false)}
          >
            <FaTimes size={24} />
          </Button>
        </div>

        <Nav className="flex-column p-3 gap-2">
          {[
            {
              id: "general",
              label: "General Config",
              icon: <FaGlobeAsia />,
              color: "#3b82f6",
            },
            {
              id: "materials",
              label: "Materials",
              icon: <FaLayerGroup />,
              color: "#10b981",
            },
            {
              id: "shipping",
              label: "Shipping Rates",
              icon: <FaTruck />,
              color: "#8b5cf6",
            },
          ].map((item) => (
            <Nav.Link
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setShowSidebar(false);
              }}
              className={`d-flex align-items-center px-3 py-3 rounded transition-all ${activeTab === item.id ? "active-link shadow" : "text-white-50 hover-light"}`}
              style={
                activeTab === item.id
                  ? { backgroundColor: item.color, color: "white" }
                  : {}
              }
            >
              <span className="me-3 fs-5">{item.icon}</span>
              <span className="fw-medium">{item.label}</span>
              {activeTab === item.id && (
                <FaChevronRight className="ms-auto small opacity-75" />
              )}
            </Nav.Link>
          ))}
        </Nav>

        <div className="mt-auto p-4 border-top border-secondary border-opacity-25 bg-black bg-opacity-25">
          <Button
            variant="light"
            className="w-100 py-2 fw-bold shadow-sm text-primary"
            onClick={handleSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? (
              "Saving..."
            ) : (
              <>
                <FaSave className="me-2" /> SAVE CHANGES
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. RIGHT CONTENT AREA */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden w-100">
        {/* Header (Responsive) */}
        <div
          className="bg-white border-bottom px-3 px-md-5 py-3 shadow-sm d-flex justify-content-between align-items-center"
          style={{ height: "70px", zIndex: 5 }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Toggle Button */}
            <Button
              variant="light"
              className="d-md-none border text-secondary"
              onClick={() => setShowSidebar(true)}
            >
              <FaBars />
            </Button>

            <div>
              <span className="text-muted text-uppercase small fw-bold ls-1 d-none d-sm-block">
                Current Section
              </span>
              <h5
                className="mb-0 fw-bold d-none d-sm-block"
                style={{
                  color:
                    activeTab === "general"
                      ? "#3b82f6"
                      : activeTab === "materials"
                        ? "#10b981"
                        : "#8b5cf6",
                }}
              >
                {activeTab === "general" && "General Configuration"}
                {activeTab === "materials" && "Material Costs"}
                {activeTab === "shipping" && "Shipping Matrix"}
              </h5>
              {/* Mobile Title (Simplified) */}
              <h5 className="mb-0 fw-bold d-sm-none text-dark">
                {activeTab === "general"
                  ? "General"
                  : activeTab === "materials"
                    ? "Materials"
                    : "Shipping"}
              </h5>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow-1 overflow-auto p-3 p-md-4 px-md-5">
          <Container fluid="lg" className="p-0" style={{ maxWidth: "1200px" }}>
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="fade-in">
                <Row className="g-3">
                  <Col xs={12} lg={6}>
                    <SettingsTable
                      title="Base Cost Parameters"
                      colorTheme="primary"
                      icon={<FaCoins />}
                      items={[
                        { label: "Base Price", key: "basePrice", unit: "฿" },
                        {
                          label: "Price per mm²",
                          key: "pricePerCm",
                          unit: "฿/mm²",
                        },
                        {
                          label: "Extra Service",
                          key: "extraService",
                          unit: "฿",
                        },
                        { label: "DHL Fixed", key: "dhlRate", unit: "฿/kg" },
                      ]}
                    />
                  </Col>
                  <Col xs={12} lg={6}>
                    <SettingsTable
                      title="Financial & Operations"
                      colorTheme="info"
                      icon={<FaGlobeAsia />}
                      items={[
                        {
                          label: "Profit Margin",
                          key: "profitMargin",
                          unit: "%",
                        },
                        { label: "VAT", key: "vat", unit: "%" },
                        { label: "USD Rate", key: "exchangeRate", unit: "$" },
                        {
                          label: "Build Time",
                          key: "build_time",
                          unit: "Days",
                        },
                      ]}
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* TAB: MATERIALS */}
            {activeTab === "materials" && (
              <div className="fade-in">
                <Row className="g-3 g-md-4">
                  <Col xs={12} md={6} xl={3}>
                    <MaterialTable
                      title="Base Materials"
                      data={baseMaterials}
                      setData={setBaseMaterials}
                      colorClass="bg-success"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialTable
                      title="Copper Weights"
                      data={copperWeights}
                      setData={setCopperWeights}
                      colorClass="bg-teal"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialTable
                      title="Surface Finishes"
                      data={surfaceFinishes}
                      setData={setSurfaceFinishes}
                      colorClass="bg-primary"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialTable
                      title="PCB Colors"
                      data={pcbColors}
                      setData={setPcbColors}
                      colorClass="bg-indigo"
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* TAB: SHIPPING */}
            {activeTab === "shipping" && (
              <div className="fade-in h-100">
                <Card className="shadow-sm border-0 overflow-hidden">
                  <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center">
                      <FaTruck className="me-2 text-primary" />
                      <span className="d-none d-sm-inline">
                        BULK SHIPPING RATES
                      </span>
                      <span className="d-sm-none">SHIPPING</span>
                    </h6>
                    <small className="text-muted">Per weight step</small>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div
                      style={{
                        height: "calc(100vh - 200px)",
                        overflow: "auto",
                      }}
                    >
                      <Table
                        bordered
                        hover
                        className="mb-0 text-center align-middle sticky-header-table"
                      >
                        <thead
                          className="text-white"
                          style={{ position: "sticky", top: 0, zIndex: 10 }}
                        >
                          <tr>
                            <th
                              className="py-3 bg-secondary"
                              style={{ width: "20%", minWidth: "80px" }}
                            >
                              KG
                            </th>
                            <th
                              className="py-3"
                              style={{
                                width: "40%",
                                minWidth: "100px",
                                backgroundColor: "#3b82f6",
                              }}
                            >
                              EMS (฿)
                            </th>
                            <th
                              className="py-3"
                              style={{
                                width: "40%",
                                minWidth: "100px",
                                backgroundColor: "#f59e0b",
                              }}
                            >
                              DHL (฿)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rates.map((row, index) => (
                            <tr key={index}>
                              <td className="fw-bold text-dark bg-light">
                                {row.kg.toFixed(1)}
                              </td>
                              <td className="p-0 position-relative bg-blue-light">
                                <Form.Control
                                  type="number"
                                  value={row.ems}
                                  onChange={(e) => {
                                    const newRates = [...rates];
                                    newRates[index].ems = Number(
                                      e.target.value,
                                    );
                                    setRates(newRates);
                                  }}
                                  className="border-0 shadow-none text-center text-primary fw-bold bg-transparent"
                                  style={{ height: "40px", minWidth: "100%" }}
                                />
                              </td>
                              <td className="p-0 position-relative bg-orange-light">
                                <Form.Control
                                  type="number"
                                  value={row.dhl}
                                  onChange={(e) => {
                                    const newRates = [...rates];
                                    newRates[index].dhl = Number(
                                      e.target.value,
                                    );
                                    setRates(newRates);
                                  }}
                                  className="border-0 shadow-none text-center text-warning-dark fw-bold bg-transparent"
                                  style={{ height: "40px", minWidth: "100%" }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}
          </Container>
        </div>
      </div>

      <style jsx global>{`
        /* --- Sidebar Logic --- */
        .sidebar-container {
          width: 260px;
          min-width: 260px;
          transition: transform 0.3s ease-in-out;
          z-index: 1050;
        }

        /* Mobile Sidebar Styling */
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            transform: translateX(-100%); /* Hide by default */
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
          }
          .sidebar-container.show-sidebar {
            transform: translateX(0); /* Show when active */
          }
        }

        /* --- Colors --- */
        .bg-teal {
          background-color: #0d9488 !important;
        }
        .bg-indigo {
          background-color: #6366f1 !important;
        }
        .text-warning-dark {
          color: #b45309 !important;
        }

        .bg-blue-light {
          background-color: #eff6ff;
        }
        .bg-orange-light {
          background-color: #fffbeb;
        }

        .hover-light:hover {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.1);
        }
        .ls-1 {
          letter-spacing: 0.5px;
        }
        .transition-all {
          transition: all 0.2s ease;
        }

        /* --- Strict Table Borders --- */
        .table-bordered th,
        .table-bordered td {
          border: 1px solid #e2e8f0;
        }

        /* Remove Input Spinners */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderPCBEditScreen;
