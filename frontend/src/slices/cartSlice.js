import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateCart } from "../utils/cartUtils";
import axios from "axios";

// --- API CONFIG ---
const CART_URL = "/api/cart";

// Helper: สร้าง Config สำหรับ Axios (ใส่ Token ของ User)
const getConfig = (state) => {
  return {
    headers: {
      Authorization: `Bearer ${state.auth.userInfo.token}`,
      "Content-Type": "application/json",
    },
  };
};

// --- ASYNC THUNKS (งานหลังบ้าน) ---

// 1. ดึงตะกร้าจาก Database (ทำงานตอน Login หรือ Refresh หน้าเว็บ)
export const fetchCartDB = createAsyncThunk(
  "cart/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      // ถ้าไม่ได้ Login ไม่ต้องดึง
      if (!auth.userInfo) return null;

      const { data } = await axios.get(CART_URL, getConfig(getState()));
      return data; // Backend ควรส่ง { cartItems: [...] } กลับมา
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// 2. บันทึกตะกร้าลง Database (ทำงานตอนเพิ่ม/ลบสินค้า)
export const syncCartDB = createAsyncThunk(
  "cart/sync",
  async (_, { getState }) => {
    const state = getState();
    // ถ้าเป็น Guest ไม่ต้องเซฟลง DB (ใช้แค่ LocalStorage ก็พอ)
    if (!state.auth.userInfo) return;

    try {
      // ส่งสินค้าทั้งหมดไปเซฟทับที่ Server
      await axios.post(
        CART_URL,
        { cartItems: state.cart.cartItems },
        getConfig(state),
      );
    } catch (err) {
      console.error("Sync Cart Error:", err);
    }
  },
);

// --- INITIAL STATE ---
const initialState = localStorage.getItem("cart")
  ? JSON.parse(localStorage.getItem("cart"))
  : {
    cartItems: [],
    shippingAddress: {},
    billingAddress: {},
    paymentMethod: "PayPal",
  };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // --- Standard Actions (เปลี่ยนหน้าจอทันที เพื่อความลื่นไหล) ---
    addToCart: (state, action) => {
      const { replaceQty, ...item } = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);

      if (existItem) {
        const newQty = replaceQty ? item.qty : existItem.qty + item.qty;
        state.cartItems = state.cartItems.map((x) =>
          x._id === existItem._id ? { ...item, qty: newQty, isSelected: x.isSelected ?? true } : x,
        );
      } else {
        // New item is selected by default
        state.cartItems = [...state.cartItems, { ...item, isSelected: true }];
      }
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    toggleSelectItem: (state, action) => {
      const id = action.payload;
      const item = state.cartItems.find((x) => x._id === id);
      if (item) {
        item.isSelected = !item.isSelected;
      }
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    selectAllItems: (state, action) => {
      const isSelected = action.payload;
      state.cartItems = state.cartItems.map((x) => ({
        ...x,
        isSelected: isSelected,
      }));
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x._id !== action.payload);
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },
    saveBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },
    savePaymentTransfer: (state, action) => {
      state.paymentTransfer = action.payload;
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },
    clearCartItems: (state) => {
      state.cartItems = [];
      updateCart(state);
      localStorage.setItem("cart", JSON.stringify(state));
    },
    updateCartPrice: (state, action) => {
      const { receivePlace, shippingPrice, totalPrice, vatPrice } =
        action.payload;
      state.receivePlace = receivePlace;
      state.shippingPrice = shippingPrice;
      state.totalPrice = totalPrice;
      state.vatPrice = vatPrice;
      localStorage.setItem("cart", JSON.stringify(state));
    },

    //  Reset Cart: ใช้ตอน Logout (เคลียร์เกลี้ยง เพื่อความปลอดภัย)
    resetCart: (state) => {
      state.cartItems = [];
      state.shippingAddress = {};
      state.billingAddress = {};
      state.paymentMethod = "PayPal";
      localStorage.removeItem("cart"); // ลบจากเครื่องนี้ทิ้งไปเลย
    },
  },

  // --- Handle API Response (เมื่อดึงข้อมูลเสร็จ) ---
  extraReducers: (builder) => {
    builder.addCase(fetchCartDB.fulfilled, (state, action) => {
      // ถ้า Backend ส่งรายการสินค้ากลับมา ให้ใช้แทนของในเครื่องทันที
      if (action.payload && action.payload.cartItems) {
        state.cartItems = action.payload.cartItems;
        updateCart(state);
        localStorage.setItem("cart", JSON.stringify(state)); // Sync กลับ LocalStorage กันเหนียว
      }
    });
  },
});

export const {
  addToCart,
  removeFromCart,
  toggleSelectItem,
  selectAllItems,
  saveShippingAddress,
  saveBillingAddress,
  savePaymentMethod,
  savePaymentTransfer,
  clearCartItems,
  resetCart,
  updateCartPrice,
} = cartSlice.actions;

export default cartSlice.reducer;
