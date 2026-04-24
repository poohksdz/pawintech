import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateCart, mergeCartItems } from "../utils/cartUtils";
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
      // FIX BUG: ใช้ PUT แทน POST เพื่อ replace cart ไม่ใช่ accumulate
      console.log("[Cart] Syncing cart to DB, items:", state.cart.cartItems.length);
      const response = await axios.put(
        CART_URL,
        { cartItems: state.cart.cartItems },
        getConfig(state),
      );
      if (response.data && response.data.cartItems) {
        console.log("[Cart] Sync completed, received:", response.data.cartItems.length, "items");
        return response.data.cartItems;
      }
    } catch (err) {
      console.error("Sync Cart Error:", err);
    }
  },
);

// --- INITIAL STATE ---
// FIX BUG: Merge duplicates when loading from localStorage
const loadCartFromStorage = () => {
  const saved = localStorage.getItem("cart");
  if (!saved) {
    return {
      cartItems: [],
      shippingAddress: {},
      billingAddress: {},
      paymentMethod: "PayPal",
      // Ensure default price fields exist
      itemsPrice: "0.00",
      vatPrice: "0.00",
      shippingPrice: "0.00",
      totalPrice: "0.00",
      receivePlace: "",
    };
  }
  const parsed = JSON.parse(saved);
  // Merge duplicates from localStorage on initial load
  if (parsed.cartItems && parsed.cartItems.length > 0) {
    parsed.cartItems = mergeCartItems(parsed.cartItems);
  }
  // FIX: Normalize isSelected to always be a proper boolean (true/false)
  if (parsed.cartItems) {
    parsed.cartItems = parsed.cartItems.map((item) => ({
      ...item,
      isSelected: item.isSelected !== false, // undefined/null -> true (default selected), false -> false
    }));
  }

  // Ensure default price fields always exist (CRITICAL FIX)
  return {
    ...parsed,
    itemsPrice: parsed.itemsPrice || "0.00",
    vatPrice: parsed.vatPrice || "0.00",
    shippingPrice: parsed.shippingPrice || "0.00",
    totalPrice: parsed.totalPrice || "0.00",
    receivePlace: parsed.receivePlace || "",
  };
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // --- Standard Actions (เปลี่ยนหน้าจอทันที เพื่อความลื่นไหล) ---
    // FIX: รองรับทั้ง _id และ product_id เป็น key
    addToCart: (state, action) => {
      const { replaceQty, ...item } = action.payload;

      // หา product ID ที่ใช้เป็น key (รองรับทั้ง _id และ product_id)
      const productKey = item._id || item.product_id;

      // หาสินค้าที่มีอยู่แล้ว (เช็คทั้ง _id และ product_id)
      const existItem = state.cartItems.find(
        (x) => (x._id || x.product_id) === productKey
      );

      if (existItem) {
        // ถ้าสินค้ามีอยู่แล้ว ให้บวก quantity
        const newQty = replaceQty ? item.qty : existItem.qty + item.qty;
        state.cartItems = state.cartItems.map((x) =>
          (x._id || x.product_id) === productKey
            ? { ...item, qty: newQty, isSelected: x.isSelected ?? true }
            : x,
        );
      } else {
        // New item is selected by default
        // ตรวจสอบว่ามี _id หรือไม่ ถ้าไม่มีใช้ product_id
        const newItem = { ...item, isSelected: true };
        if (!newItem._id && item.product_id) {
          newItem._id = item.product_id;
        }
        state.cartItems = [...state.cartItems, newItem];
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
        // Build a lookup map from current local state to preserve isSelected
        const localSelectionMap = {};
        (state.cartItems || []).forEach((item) => {
          const key = item._id || item.product_id;
          if (key) localSelectionMap[key] = item.isSelected;
        });

        // FIX BUG: Merge duplicate items from DB (same product_id multiple rows)
        // FIX: Preserve local isSelected state (DB doesn't store isSelected)
        state.cartItems = mergeCartItems(action.payload.cartItems).map((item) => {
          const key = item._id || item.product_id;
          const localSelected = key ? localSelectionMap[key] : undefined;
          return {
            ...item,
            // Use local isSelected if it exists (user explicitly set it), otherwise default to true
            isSelected: localSelected !== undefined ? localSelected : true,
          };
        });
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
