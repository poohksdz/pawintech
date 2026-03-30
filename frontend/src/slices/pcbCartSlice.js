import { createSlice } from "@reduxjs/toolkit";

const initialState = localStorage.getItem("pcbcart")
  ? JSON.parse(localStorage.getItem("pcbcart"))
  : {
      cartItems: [],
      shippingAddress: {},
      billingAddress: {},
      pcbDetails: {},
      pcbOrderDetails: [],
      itemsPrice: 0,
      shippingPrice: 0,
      totalPrice: 0,
      receivePlace: "",
    };

const pcbCartSlice = createSlice({
  name: "pcbcart",
  initialState,
  reducers: {
    addToPCBCart: (state, action) => {
      const { user, rating, numReviews, reviews, ...item } = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x._id === existItem._id ? item : x,
        );
      } else {
        state.cartItems.push(item);
      }
      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    updatePCBCartPrice: (state, action) => {
      const { pcbOrderDetails, receivePlace, shippingPrice } = action.payload;

      //  แก้ไข: ป้องกัน Error reduce โดยตรวจสอบว่าเป็น Array ก่อนเสมอ
      const safeOrders = Array.isArray(pcbOrderDetails) ? pcbOrderDetails : [];

      const totalPriceFromItems = safeOrders.reduce((sum, item) => {
        // รองรับทั้งฟิลด์ price และ total_amount_cost
        return sum + parseFloat(item.price || item.total_amount_cost || 0);
      }, 0);

      const shipping = shippingPrice || 0;
      const finalTotal = totalPriceFromItems + shipping;

      state.receivePlace = receivePlace || "";
      state.shippingPrice = shipping;
      state.totalPrice = parseFloat(finalTotal.toFixed(2));

      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    removeFromPCBCart: (state, action) => {
      if (!Array.isArray(state.pcbOrderDetails)) {
        state.pcbOrderDetails = [];
      }
      state.pcbOrderDetails = state.pcbOrderDetails.filter(
        (x) => x.id !== action.payload,
      );

      // Automatic Price Recalculation
      const itemsPrice = state.pcbOrderDetails.reduce((sum, item) => {
        return sum + parseFloat(item.price || item.total_amount_cost || 0);
      }, 0);
      state.itemsPrice = itemsPrice;
      state.totalPrice = itemsPrice + (state.shippingPrice || 0);

      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    saveBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    savePaymentTransfer: (state, action) => {
      state.paymentTransfer = action.payload;
      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    savePCBOrderDetails: (state, action) => {
      const newOrder = {
        id: Date.now(),
        ...action.payload,
      };
      if (!Array.isArray(state.pcbOrderDetails)) {
        state.pcbOrderDetails = [];
      }
      state.pcbOrderDetails.push(newOrder);

      // Automatic Price Recalculation
      const itemsPrice = state.pcbOrderDetails.reduce((sum, item) => {
        return sum + parseFloat(item.price || item.total_amount_cost || 0);
      }, 0);
      state.itemsPrice = itemsPrice;
      state.totalPrice = itemsPrice + (state.shippingPrice || 0);

      localStorage.setItem("pcbcart", JSON.stringify(state));
    },

    resetPCBCart: () => {
      localStorage.removeItem("pcbcart");
      return {
        cartItems: [],
        shippingAddress: {},
        billingAddress: {},
        pcbDetails: {},
        pcbOrderDetails: [],
        itemsPrice: 0,
        shippingPrice: 0,
        totalPrice: 0,
        receivePlace: "",
      };
    },
  },
});

export const {
  addToPCBCart,
  removeFromPCBCart,
  saveShippingAddress,
  saveBillingAddress,
  savePaymentTransfer,
  savePCBOrderDetails,
  resetPCBCart,
  updatePCBCartPrice,
} = pcbCartSlice.actions;

export default pcbCartSlice.reducer;
