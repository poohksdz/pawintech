import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaChevronLeft,
  FaCheckCircle,
  FaLayerGroup,
  FaRulerCombined,
  FaPalette,
  FaMicrochip,
  FaCheck,
  FaCloudUploadAlt,
  FaInfoCircle,
  FaMoneyBillWave,
  FaTruck,
  FaShieldAlt,
  FaBoxOpen,
  FaUserCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import {
  useGetOrderPCBByorderIDQuery,
  useGetOwnShippingRatesQuery,
  useCreateOrderPCBbyAdminMutation
} from '../../slices/orderpcbSlice';
import { useUploadPaymentSlipImageMutation } from '../../slices/ordersApiSlice';

const ReorderPCBAdminCreateOrderPCBScreen = () => {
  const { id: orderID } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  // Data Fetching
  const { data: orderData, isLoading: isOrderLoading, error: orderError } = useGetOrderPCBByorderIDQuery(orderID);
  const { data: shippingData, isLoading: isShippingLoading } = useGetOwnShippingRatesQuery();
  const [createOrder, { isLoading: isCreating }] = useCreateOrderPCBbyAdminMutation();
  const [uploadPaymentSlip, { isLoading: isUploadingSlip }] = useUploadPaymentSlipImageMutation();

  // Original stored price from the database
  const [originalPrice, setOriginalPrice] = useState(null);
  const [useOriginalPrice, setUseOriginalPrice] = useState(true);

  // Form State (Internal data structure sent to API)
  const [formData, setFormData] = useState({
    projectname: '',
    pcbQty: 5,
    dimensions: { x: 0, y: 0, unit: 'mm' },
    baseMaterial: 'FR-4',
    layers: 2,
    thickness: '1.6mm',
    pcbColor: 'Green',
    silkscreen: 'White',
    surfaceFinish: 'HASL(With lead)',
    copperWeight: '1 oz',
    gerberZip: '',
  });

  const [customerInfo, setCustomerInfo] = useState({
    customerUserID: '',
    customerCompanyName: '',
    customerName: '',
    customerAddress: '',
    customerEmailAddress: '',
    customerPhoneNumber: '',
  });

  const [shippingAddress, setShippingAddress] = useState({
    shippingname: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    receivePlace: 'bysending',
  });

  const [billingAddress, setBillingAddress] = useState({});

  // Payment State
  const [paymentInfo, setPaymentInfo] = useState({
    status: 'accepted',
    confirmedPrice: '',
    confirmedReason: '',
    transferedName: '',
    transferedDate: '',
    transferedAmount: '',
    paymentSlip: '',
  });

  // Initial Data Sync
  useEffect(() => {
    if (orderData) {
      const order = Array.isArray(orderData) ? orderData[0] : orderData;
      if (order) {
        // Store the original price from the database
        const storedPrice = Number(order.quoted_price_to_customer) || Number(order.total_amount_cost) || 0;
        if (storedPrice > 0) {
          setOriginalPrice(storedPrice);
        }

        setFormData({
          projectname: `${order.projectname || 'Reorder'} (Redo)`,
          pcbQty: order.pcb_quantity || 5,
          dimensions: {
            x: order.length_cm || 0,
            y: order.width_cm || 0,
            unit: 'mm'
          },
          baseMaterial: order.base_material || 'FR-4',
          layers: order.layers || 2,
          thickness: order.thickness_mm || '1.6mm',
          pcbColor: order.color || 'Green',
          silkscreen: order.silkscreen_color || 'White',
          surfaceFinish: order.surface_finish || 'HASL(With lead)',
          copperWeight: order.copper_weight_oz || '1 oz',
          gerberZip: order.gerberZip || '',
        });

        if (order.customerInfo) setCustomerInfo(order.customerInfo);
        if (order.shippingAddress) setShippingAddress(order.shippingAddress);
        if (order.billingAddress) setBillingAddress(order.billingAddress);
      }
    }
  }, [orderData]);

  // Pricing Helper Functions
  const getThicknessPrice = () => {
    return formData.thickness === '0.8mm' ? 0.5 : 1.0;
  };

  const getkilogram = () => {
    const area = (Number(formData.dimensions.x) || 0) * (Number(formData.dimensions.y) || 0);
    const thickness = getThicknessPrice();
    const weight = area * 0.0000035 * (Number(formData.pcbQty) || 5) * thickness;
    const weightPack = weight + 0.3;
    return weightPack.toFixed(2);
  };

  const getEmsDeliveryPrice = () => {
    const kg = parseFloat(getkilogram());
    const shippingRates = shippingData?.shippingRates || [];
    const emsRates = shippingRates
      .filter((rate) => rate.shipping_type === 'EMS')
      .sort((a, b) => parseFloat(a.weight_kg) - parseFloat(b.weight_kg));

    for (const rate of emsRates) {
      if (kg <= parseFloat(rate.weight_kg)) {
        return Number(rate.price);
      }
    }
    return emsRates.length > 0 ? Number(emsRates[emsRates.length - 1].price) : 0;
  };

  const getDhlDeliveryPrice = () => {
    const kg = parseFloat(getkilogram());
    const shippingRates = shippingData?.shippingRates || [];
    const dhlRates = shippingRates
      .filter((rate) => rate.shipping_type === 'DHL')
      .sort((a, b) => parseFloat(a.weight_kg) - parseFloat(b.weight_kg));

    for (const rate of dhlRates) {
      if (kg <= parseFloat(rate.weight_kg)) {
        return Number(rate.price);
      }
    }
    return dhlRates.length > 0 ? Number(dhlRates[dhlRates.length - 1].price) : 0;
  };

  const getColorPrice = () => {
    const pcbColors = shippingData?.pcbColors || [];
    const selected = pcbColors.find((item) => item.name === formData.pcbColor);
    return Number(selected?.price) || 0;
  };

  const getSurfaceFinishPrice = () => {
    const surfaceFinishes = shippingData?.surfaceFinishes || [];
    const selected = surfaceFinishes.find((s) => s.name === formData.surfaceFinish);
    return Number(selected?.price) || 0;
  };

  const getCopperWeightPrice = () => {
    const copperWeights = shippingData?.copperWeights || [];
    const selected = copperWeights.find((c) => c.name === formData.copperWeight);
    return Number(selected?.price) || 0;
  };

  const getBaseMaterialPrice = () => {
    const baseMaterials = shippingData?.baseMaterials || [];
    const selected = baseMaterials.find((m) => m.name === formData.baseMaterial);
    return Number(selected?.price) || 0;
  };

  const getOptionAddOnTotal = () => {
    return (
      getBaseMaterialPrice() +
      getColorPrice() +
      getSurfaceFinishPrice() +
      getCopperWeightPrice()
    );
  };

  // Pricing Logic (Memoized)
  const pricing = useMemo(() => {
    if (!shippingData || !shippingData.success) {
      return { total: 0, vat: 0, subtotal: 0, addons: 0, shipping: 0 };
    }

    const { defaultPricing } = shippingData;
    if (!defaultPricing) {
      return { total: 0, vat: 0, subtotal: 0, addons: 0, shipping: 0 };
    }

    const area = (Number(formData.dimensions.x) || 0) * (Number(formData.dimensions.y) || 0);
    const qty = Number(formData.pcbQty) || 5;

    if (area === 0) return { total: 0, vat: 0, subtotal: 0, addons: 0, shipping: 0 };

    const pricePerCm = Number(defaultPricing.price_per_cm2) || 0;
    const baseMin = Number(defaultPricing.base_price) || 0;
    const extraFee = Number(defaultPricing.extra_service_fee) || 0;
    const margin = Number(defaultPricing.profit_margin) || 0;
    const vatRate = Number(defaultPricing.vat_percent) || 0;
    const dhlRate = Number(getDhlDeliveryPrice());
    const emsRate = Number(getEmsDeliveryPrice());
    const dhlService = Number(defaultPricing.dhl_service_fixed) || 0;
    const addons = getOptionAddOnTotal();

    // Material Cost includes Area Price, Extra Fee, DHL Rates/Service, and Addons
    const materialCost = (area * pricePerCm * qty) + extraFee + dhlRate + dhlService + addons;
    const withMargin = materialCost * (1 + margin / 100);
    const vatAmount = withMargin * (vatRate / 100);
    const withVat = withMargin + vatAmount + emsRate;
    const total = Math.max(baseMin, withVat);

    return {
      subtotal: withMargin || 0,
      vat: vatAmount || 0,
      addons: addons || 0,
      shipping: emsRate || 0,
      total: isNaN(total) ? "0.00" : total.toFixed(2)
    };
  }, [formData, shippingData]);

  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formPayload = new FormData();
    formPayload.append('image', file);

    try {
      const res = await uploadPaymentSlip(formPayload).unwrap();
      const path = res?.image?.path ?? res?.image ?? '';
      setPaymentInfo(prev => ({ ...prev, paymentSlip: path }));
      toast.success('Payment slip uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  // Determine the active price: use original stored price or live recalculated price
  const activePrice = (useOriginalPrice && originalPrice != null)
    ? originalPrice.toFixed(2)
    : pricing.total;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrder({
        orderData: {
          ...formData,
          length_cm: formData.dimensions.x,
          width_cm: formData.dimensions.y,
          pcb_quantity: formData.pcbQty,
          thickness_mm: formData.thickness,
          silkscreen_color: formData.silkscreen,
          surface_finish: formData.surfaceFinish,
          copper_weight_oz: formData.copperWeight,
          color: formData.pcbColor,
          price: activePrice,
          customerInfo,
          sellerInfo: {
            sellerUserID: userInfo._id,
            sellerName: userInfo.name,
          },
          shippingAddress,
          billingAddress,
          ...paymentInfo
        }
      }).unwrap();
      toast.success('Order confirmed for production successfully');
      navigate('/admin/orderpcblist');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to confirm order');
    }
  };

  if (isOrderLoading || isShippingLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader />
    </div>
  );

  if (orderError) return <Message variant="danger">{orderError?.data?.message || 'Error loading order'}</Message>;

  // Info Block Component for clean read-only display
  const InfoBlock = ({ label, value, icon }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon} {label}
      </div>
      <div className="font-semibold text-slate-900">{value || '-'}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header - Invoice Style */}
        <div className="mb-8 border-b-2 border-slate-200 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="group mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
              >
                <FaChevronLeft className="transition-transform group-hover:-translate-x-1" />
                Back to Orders
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <FaCheckCircle className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                    Production <span className="text-blue-600">Manifest</span>
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Confirming details for Order <span className="font-mono font-bold text-slate-700">#{orderID}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden text-right lg:block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Final Valuation</span>
              <span className="font-display text-4xl font-black text-slate-900">฿{activePrice}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Left/Main Column: Project Details (Read-Only) */}
          <div className="space-y-6 lg:col-span-2">

            {/* Technical Configuration Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <FaMicrochip className="text-xl text-blue-500" />
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800">Technical Specifications</h2>
              </div>

              <div className="mb-8">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Project Workspace Name</p>
                <p className="text-xl font-bold text-slate-900">{formData.projectname}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoBlock label="Dimensions" value={`${formData.dimensions.x} × ${formData.dimensions.y} mm`} icon={<FaRulerCombined />} />
                <InfoBlock label="Quantity" value={`${formData.pcbQty} Units`} icon={<FaBoxOpen />} />
                <InfoBlock label="Layers" value={`${formData.layers} Layers`} icon={<FaLayerGroup />} />
                <InfoBlock label="Thickness" value={formData.thickness} icon={<FaRulerCombined />} />

                <InfoBlock label="Color" value={formData.pcbColor} icon={<FaPalette />} />
                <InfoBlock label="Silkscreen" value={formData.silkscreen} icon={<FaPalette />} />
                <InfoBlock label="Finish" value={formData.surfaceFinish} icon={<FaMicrochip />} />
                <InfoBlock label="Copper" value={formData.copperWeight} icon={<FaMicrochip />} />
              </div>
            </div>

            {/* Logistics & Fulfillment Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <FaTruck className="text-xl text-emerald-500" />
                <h2 className="text-lg font-black uppercase tracking-wide text-slate-800">Fulfillment Manifest</h2>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FaUserCircle /> Customer Profile
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="font-bold text-slate-900 text-lg">{customerInfo.customerName}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{customerInfo.customerCompanyName || 'Personal Account'}</p>
                    <p className="text-sm text-slate-500 mt-1">{customerInfo.customerPhoneNumber}</p>
                    <p className="text-sm text-slate-500">{customerInfo.customerEmailAddress}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FaInfoCircle /> Delivery Destination
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-5 border border-blue-100/50 h-full">
                    <p className="font-bold text-blue-900 mb-2 border-b border-blue-100 pb-2">
                      {shippingAddress.receivePlace === 'bysending' ? 'Home Delivery Service' : 'Warehouse Pickup'}
                    </p>
                    <p className="text-sm leading-relaxed text-blue-800/80">
                      {shippingAddress.address}<br />
                      {shippingAddress.city} {shippingAddress.postalCode}<br />
                      {shippingAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Settlement & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-10 space-y-6">

              {/* Financial Dashboard */}
              <div className="overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-xl">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <FaMoneyBillWave size={18} />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Net Payable</span>
                    <span className="text-3xl font-black text-white">฿{activePrice}</span>
                  </div>
                </div>

                {/* Price source toggle - Cleaned up */}
                {originalPrice != null && (
                  <div className="mb-6 flex rounded-xl bg-slate-800/50 p-1">
                    <button
                      type="button"
                      onClick={() => setUseOriginalPrice(true)}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${useOriginalPrice ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Original Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseOriginalPrice(false)}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${!useOriginalPrice ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Live Quote
                    </button>
                  </div>
                )}

                <div className="space-y-3 mb-8">
                  {(!useOriginalPrice || originalPrice == null) ? (
                    <>
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Materials & Options</span>
                        <span className="font-mono text-slate-300">฿{(pricing.subtotal + pricing.addons).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Shipping</span>
                        <span className="font-mono text-slate-300">฿{pricing.shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-400/80">
                        <span>VAT (7%)</span>
                        <span className="font-mono text-emerald-400">฿{pricing.vat.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Stored Invoice Price</span>
                      <span className="font-mono text-white">฿{originalPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-blue-600 py-4 font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
                  style={{ fontSize: '11px' }}
                >
                  {isCreating ? <Loader mini color="white" /> : (
                    <>
                      <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0 duration-300 ease-out" />
                      <FaCheckCircle size={16} className="relative z-10" />
                      <span className="relative z-10">Confirm Production & Shipping</span>
                    </>
                  )}
                </button>
              </div>

              {/* Payment Slip Upload (Optional/Admin Override) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <FaShieldAlt className="text-slate-300" /> Admin Payment Override <span className="text-[9px] font-normal lowercase bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 ml-auto">(Optional)</span>
                </h3>

                <div className="space-y-4">
                  <select
                    value={paymentInfo.transferedName}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, transferedName: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Receiving Bank</option>
                    <option value="KTB - Main">KTB (082-0-74742-4)</option>
                    <option value="SCB - Secondary">SCB (146-2-90304-4)</option>
                  </select>

                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleUploadSlip}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-4 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50">
                      {paymentInfo.paymentSlip ? (
                        <>
                          <FaCheck className="text-emerald-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Slip Uploaded</span>
                        </>
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Upload Slip Evidence</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReorderPCBAdminCreateOrderPCBScreen;