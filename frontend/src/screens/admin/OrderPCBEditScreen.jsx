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
  Spinner,
} from "react-bootstrap";
import {
  useUpdateOrderPCBShippingRatesMutation,
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
  FaMicrochip,
  FaPalette,
} from "react-icons/fa";

// --- Helpers ---
const generateRates = () => {
  const rates = [];
  for (let i = 0.5; i <= 200; i += 0.5) {
    rates.push({ kg: parseFloat(i.toFixed(1)), ems: 0, dhl: 0 });
  }
  return rates;
};

const SettingInput = ({ label, unit, value, onChange }) => (
  <Form.Group className="mb-4">
    <Form.Label className="small fw-bold text-secondary text-uppercase ls-1 mb-2">
      {label}
    </Form.Label>
    <InputGroup className="premium-input-group shadow-sm overflow-hidden rounded-2">
      <Form.Control
        type="number"
        className="border-0 px-3 fw-bold text-dark fs-6 rounded-0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ height: "45px", backgroundColor: "#f8fafc" }}
      />
      <InputGroup.Text className="border-0 bg-light text-primary fw-bold px-3 rounded-0 border-start">
        {unit}
      </InputGroup.Text>
    </InputGroup>
  </Form.Group>
);

const MaterialCard = ({ title, icon, data, setData, gradient }) => (
  <Card className="premium-card h-100 border-0 rounded-4 overflow-hidden">
    <div className={`p-4 text-white d-flex align-items-center gap-2`} style={{ background: gradient }}>
      <div className="bg-white bg-opacity-25 p-2 rounded-circle">
        {icon}
      </div>
      <h6 className="mb-0 fw-bold text-uppercase ls-1">{title}</h6>
    </div>
    <Card.Body className="p-0 bg-white">
      <div className="material-list">
        {data.map((item, index) => (
          <div
            key={index}
            className="d-flex justify-content-between align-items-center p-3 border-bottom material-item-row transition-all"
          >
            <span className="fw-medium text-secondary small text-uppercase text-nowrap text-truncate pe-2" title={item.name}>
              {item.name}
            </span>
            <InputGroup size="sm" className="shadow-sm overflow-hidden rounded-1" style={{ width: '100px', minWidth: '100px', flexShrink: 0 }}>
              <Form.Control
                type="number"
                className="border-0 text-end fw-bold text-dark bg-light px-2 rounded-0"
                value={item.price}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setData((prev) =>
                    prev.map((ent, i) =>
                      i === index ? { ...ent, price: val } : ent
                    )
                  );
                }}
                style={{ height: "36px" }}
              />
              <InputGroup.Text className="border-0 bg-white text-muted fw-bold px-2 rounded-0 border-start">
                ฿
              </InputGroup.Text>
            </InputGroup>
          </div>
        ))}
      </div>
    </Card.Body>
  </Card>
);

const OrderPCBEditScreen = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [rates, setRates] = useState(generateRates());
  const [settings, setSettings] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);

  const [baseMaterials, setBaseMaterials] = useState([]);
  const [surfaceFinishes, setSurfaceFinishes] = useState([]);
  const [copperWeights, setCopperWeights] = useState([]);
  const [pcbColors, setPcbColors] = useState([]);

  const { data, isLoading, error, refetch } = useGetOwnShippingRatesQuery();
  const [updateShippingRates, { isLoading: isUpdating }] =
    useUpdateOrderPCBShippingRatesMutation();

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
    try {
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

      await updateShippingRates(payload).unwrap();
      await refetch();
      toast.success("บันทึกการตั้งค่าเรียบร้อย / Configuration saved");
      setShowSidebar(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(
        `บันทึกไม่สำเร็จ: ${err?.data?.message || err?.error || err?.message || "Unknown error"}`,
      );
    }
  };

  if (isLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><Loader /></div>;
  if (error)
    return (
      <Container className="py-5">
        <Message variant="danger">{error?.data?.message || error.error}</Message>
      </Container>
    );

  return (
    <div className="d-flex font-prompt full-width-breakout" style={{ height: "100vh", overflow: "hidden", backgroundColor: "#f1f5f9", position: "relative" }}>
      {/* 0. MOBILE OVERLAY */}
      {showSidebar && (
        <div
          className="d-md-none position-fixed w-100 h-100 bg-dark bg-opacity-50 blur-backdrop"
          style={{ zIndex: 1040 }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 1. SIDEBAR */}
      <div className={`sidebar-container d-flex flex-column shadow-lg ${showSidebar ? "show-sidebar" : ""}`}>
        <div className="sidebar-header p-4 d-flex justify-content-between align-items-center position-relative overflow-hidden">
          <div className="position-relative z-1">
            <div className="d-flex align-items-center gap-3 mb-1">
              <div className="bg-white text-indigo p-2 rounded-4 shadow-sm">
                <FaSlidersH size={20} />
              </div>
              <h4 className="fw-bold mb-0 text-white tracking-tight">Admin Config</h4>
            </div>
            <p className="text-white-50 small mb-0 ms-1 fw-medium">PCB Pricing & Logistics</p>
          </div>
          <Button variant="link" className="text-white d-md-none p-0 z-1" onClick={() => setShowSidebar(false)}>
            <FaTimes size={24} />
          </Button>
          {/* Decorative shapes */}
          <div className="sidebar-shape shape-1"></div>
          <div className="sidebar-shape shape-2"></div>
        </div>

        <Nav className="flex-column p-3 gap-2 mt-2 flex-grow-1">
          {[
            { id: "general", label: "General Settings", icon: <FaGlobeAsia />, gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
            { id: "materials", label: "Material Costs", icon: <FaLayerGroup />, gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
            { id: "shipping", label: "Shipping Matrix", icon: <FaTruck />, gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
          ].map((item) => (
            <Nav.Link
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setShowSidebar(false);
              }}
              className={`sidebar-link d-flex align-items-center px-4 py-3 rounded-4 transition-all position-relative ${activeTab === item.id ? "active shadow-md" : ""}`}
            >
              {activeTab === item.id && <div className="active-bg" style={{ background: item.gradient }}></div>}
              <span className="me-3 fs-5 position-relative z-1">{item.icon}</span>
              <span className="fw-bold position-relative z-1">{item.label}</span>
              {activeTab === item.id && <FaChevronRight className="ms-auto small opacity-75 position-relative z-1" />}
            </Nav.Link>
          ))}
        </Nav>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden w-100 position-relative">
        
        {/* Sticky Header with Glassmorphism */}
        <div className="main-header px-4 py-3 d-flex justify-content-between align-items-center border-bottom border-light">
          <div className="d-flex align-items-center gap-3">
            <Button variant="light" className="d-md-none rounded-circle shadow-sm btn-icon" onClick={() => setShowSidebar(true)}>
              <FaBars />
            </Button>
            <div>
              <h5 className="mb-0 fw-bold text-dark tracking-tight">
                {activeTab === "general" && "General Parameters"}
                {activeTab === "materials" && "Manufacturing Materials"}
                {activeTab === "shipping" && "Logistics & Shipping"}
              </h5>
              <span className="text-muted small fw-medium d-none d-sm-block">Manage your PCB ordering rules and pricing</span>
            </div>
          </div>
          <Button
            className="save-btn rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 border-0"
            onClick={handleSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Saving...</>
            ) : (
              <><FaSave size={18} /> <span>Save Changes</span></>
            )}
          </Button>
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-grow-1 overflow-auto p-3 p-md-4 p-xl-5 custom-scrollbar">
          <Container fluid="lg" className="p-0" style={{ maxWidth: "1400px" }}>
            
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="animate-fade-up">
                <Row className="g-4">
                  <Col xs={12} lg={6}>
                    <Card className="premium-card border-0 rounded-4 p-1">
                      <Card.Body className="p-4 p-xl-5">
                        <div className="d-flex align-items-center gap-3 mb-4">
                          <div className="icon-box bg-primary-subtle text-primary">
                            <FaCoins size={24} />
                          </div>
                          <h5 className="fw-bold mb-0 text-dark">Base Cost Parameters</h5>
                        </div>
                        <Row>
                          <Col sm={6}><SettingInput label="Base Price" unit="฿" value={settings.basePrice} onChange={(v) => setSettings({...settings, basePrice: v})} /></Col>
                          <Col sm={6}><SettingInput label="Price per mm²" unit="฿/mm²" value={settings.pricePerCm} onChange={(v) => setSettings({...settings, pricePerCm: v})} /></Col>
                          <Col sm={6}><SettingInput label="Extra Service" unit="฿" value={settings.extraService} onChange={(v) => setSettings({...settings, extraService: v})} /></Col>
                          <Col sm={6}><SettingInput label="DHL Fixed Cost" unit="฿/kg" value={settings.dhlRate} onChange={(v) => setSettings({...settings, dhlRate: v})} /></Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col xs={12} lg={6}>
                    <Card className="premium-card border-0 rounded-4 p-1">
                      <Card.Body className="p-4 p-xl-5">
                        <div className="d-flex align-items-center gap-3 mb-4">
                          <div className="icon-box bg-info-subtle text-info">
                            <FaGlobeAsia size={24} />
                          </div>
                          <h5 className="fw-bold mb-0 text-dark">Financial & Operations</h5>
                        </div>
                        <Row>
                          <Col sm={6}><SettingInput label="Profit Margin" unit="%" value={settings.profitMargin} onChange={(v) => setSettings({...settings, profitMargin: v})} /></Col>
                          <Col sm={6}><SettingInput label="VAT" unit="%" value={settings.vat} onChange={(v) => setSettings({...settings, vat: v})} /></Col>
                          <Col sm={6}><SettingInput label="USD Exchange Rate" unit="$" value={settings.exchangeRate} onChange={(v) => setSettings({...settings, exchangeRate: v})} /></Col>
                          <Col sm={6}><SettingInput label="Build Time" unit="Days" value={settings.build_time} onChange={(v) => setSettings({...settings, build_time: v})} /></Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* TAB: MATERIALS */}
            {activeTab === "materials" && (
              <div className="animate-fade-up">
                <Row className="g-4">
                  <Col xs={12} md={6} xl={3}>
                    <MaterialCard
                      title="Base Materials"
                      icon={<FaLayerGroup size={20} />}
                      data={baseMaterials}
                      setData={setBaseMaterials}
                      gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialCard
                      title="Copper Weights"
                      icon={<FaMicrochip size={20} />}
                      data={copperWeights}
                      setData={setCopperWeights}
                      gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialCard
                      title="Surface Finishes"
                      icon={<FaGlobeAsia size={20} />}
                      data={surfaceFinishes}
                      setData={setSurfaceFinishes}
                      gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    />
                  </Col>
                  <Col xs={12} md={6} xl={3}>
                    <MaterialCard
                      title="PCB Colors"
                      icon={<FaPalette size={20} />}
                      data={pcbColors}
                      setData={setPcbColors}
                      gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* TAB: SHIPPING */}
            {activeTab === "shipping" && (
              <div className="animate-fade-up h-100 pb-4">
                <Card className="premium-card border-0 rounded-4 overflow-hidden shadow-sm h-100 d-flex flex-column">
                  <div className="bg-white p-4 border-bottom d-flex align-items-center gap-3">
                    <div className="icon-box bg-indigo-subtle text-indigo">
                      <FaTruck size={24} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">Bulk Shipping Rates Matrix</h5>
                      <p className="text-muted small mb-0 mt-1">Configure pricing based on weight tiers</p>
                    </div>
                  </div>
                  
                  <div className="flex-grow-1 custom-scrollbar position-relative" style={{ height: "calc(100vh - 280px)", overflowY: "auto", overflowX: "hidden" }}>
                    <Table bordered hover responsive className="mb-0 text-center align-middle shipping-table">
                      <thead className="bg-light sticky-top shadow-sm z-2">
                        <tr>
                          <th className="py-3 text-secondary fw-bold text-uppercase ls-1 border-0" style={{ width: "20%", minWidth: "100px", backgroundColor: "#f8fafc" }}>
                            Weight (KG)
                          </th>
                          <th className="py-3 text-white fw-bold text-uppercase ls-1 border-0" style={{ width: "40%", minWidth: "150px", backgroundColor: "#3b82f6" }}>
                            EMS Cost (฿)
                          </th>
                          <th className="py-3 text-white fw-bold text-uppercase ls-1 border-0" style={{ width: "40%", minWidth: "150px", backgroundColor: "#f59e0b" }}>
                            DHL Cost (฿)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rates.map((row, index) => (
                          <tr key={index} className="shipping-row">
                            <td className="fw-bold text-secondary bg-white border-end border-light">
                              {row.kg.toFixed(1)} <span className="small text-muted fw-normal">kg</span>
                            </td>
                            <td className="p-2 bg-white border-end border-light">
                              <Form.Control
                                type="number"
                                value={row.ems}
                                onChange={(e) => {
                                  const newRates = [...rates];
                                  newRates[index].ems = Number(e.target.value);
                                  setRates(newRates);
                                }}
                                className="border-0 shadow-none text-center text-primary fw-bold form-control-shipping rounded-2"
                              />
                            </td>
                            <td className="p-2 bg-white">
                              <Form.Control
                                type="number"
                                value={row.dhl}
                                onChange={(e) => {
                                  const newRates = [...rates];
                                  newRates[index].dhl = Number(e.target.value);
                                  setRates(newRates);
                                }}
                                className="border-0 shadow-none text-center text-warning fw-bold form-control-shipping rounded-2"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

          </Container>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

        .font-prompt {
          font-family: 'Prompt', sans-serif;
        }

        /* --- Full Width Breakout --- */
        .full-width-breakout {
           width: 100vw;
           position: relative;
           left: 50%;
           right: 50%;
           margin-left: -50vw;
           margin-right: -50vw;
           margin-top: -1.5rem;
           margin-bottom: -1.5rem;
        }

        /* --- Sidebar & Layout --- */
        .sidebar-container {
          width: 280px;
          min-width: 280px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1050;
        }
        
        .sidebar-header {
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sidebar-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          z-index: 0;
          opacity: 0.4;
        }
        .shape-1 {
          width: 150px;
          height: 150px;
          background: #3b82f6;
          top: -50px;
          left: -50px;
        }
        .shape-2 {
          width: 100px;
          height: 100px;
          background: #8b5cf6;
          bottom: -30px;
          right: -30px;
        }

        .sidebar-link {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          overflow: hidden;
        }
        .sidebar-link:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }
        .sidebar-link.active {
          color: white;
        }
        .active-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          opacity: 0.9;
        }

        .main-header {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10;
        }

        .blur-backdrop {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        /* --- Components --- */
        .premium-card {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .premium-card:hover {
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.06);
        }

        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .text-indigo { color: #4f46e5; }
        .bg-indigo-subtle { background-color: #e0e7ff; }

        .premium-input-group {
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .premium-input-group:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }

        .material-item-row:hover {
          background-color: #f8fafc;
        }

        .save-btn {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          transition: all 0.3s ease;
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important;
        }
        .save-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        /* --- Shipping Table --- */
        .shipping-table th, .shipping-table td {
          vertical-align: middle;
        }
        .shipping-row {
          transition: background-color 0.2s ease;
        }
        .shipping-row:hover td {
          background-color: #f8fafc !important;
        }
        .form-control-shipping {
          background: #f1f5f9;
          border-radius: 8px !important;
          height: 44px;
          transition: all 0.2s;
        }
        .form-control-shipping:focus {
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }
        
        .text-warning { color: #d97706 !important; }

        /* --- Utilities --- */
        .tracking-tight { letter-spacing: -0.025em; }
        .ls-1 { letter-spacing: 1px; }
        .transition-all { transition: all 0.3s ease; }
        
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .animate-fade-up {
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive Sidebar */
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
          }
          .sidebar-container.show-sidebar {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderPCBEditScreen;

