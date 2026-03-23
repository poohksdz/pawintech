import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  additionstockcartItems: localStorage.getItem('additionstockcart')
    ? JSON.parse(localStorage.getItem('additionstockcart'))
    : [],
};

const stockAdditionApiSlice = createSlice({
  name: 'additionstockcart',
  initialState,
  reducers: {
    addToAdditionStockCart: (state, action) => {
      const item = action.payload;
      // สร้าง cartId แบบสุ่มเพื่อป้องกันรายการซ้ำกันในตาราง
      const newItem = {
        ...item,
        cartId: Date.now() + Math.random().toString(36).substr(2, 9) 
      };
      state.additionstockcartItems.push(newItem);
      localStorage.setItem('additionstockcart', JSON.stringify(state.additionstockcartItems));
    },

    updateAdditionQty: (state, action) => {
      const { cartId, qty } = action.payload;
      state.additionstockcartItems = state.additionstockcartItems.map((item) =>
        item.cartId === cartId ? { ...item, additionqty: Number(qty) } : item
      );
      localStorage.setItem('additionstockcart', JSON.stringify(state.additionstockcartItems));
    },

    removeAdditionStockFromCart: (state, action) => {
      state.additionstockcartItems = state.additionstockcartItems.filter(
        (x) => x.cartId !== action.payload
      );
      localStorage.setItem('additionstockcart', JSON.stringify(state.additionstockcartItems));
    },

    clearAdditionStockCartItems: (state) => {
      state.additionstockcartItems = [];
      localStorage.removeItem('additionstockcart');
    },
  },
});

export const {
  addToAdditionStockCart,
  updateAdditionQty,
  removeAdditionStockFromCart,
  clearAdditionStockCartItems,
} = stockAdditionApiSlice.actions;

export default stockAdditionApiSlice.reducer;