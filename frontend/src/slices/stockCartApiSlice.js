import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stockcartItems: localStorage.getItem("stockcart")
    ? JSON.parse(localStorage.getItem("stockcart"))
    : [],
};

const stockCartApiSlice = createSlice({
  name: "stockcart",
  initialState,
  reducers: {
    addToStockCart: (state, action) => {
      const { user, replaceQty, ...item } = action.payload;
      const existItem = state.stockcartItems.find(
        (x) => x._id === item._id.toString(),
      );

      if (existItem) {
        // ถ้า replaceQty = true ให้แทนที่ qty (กรณีแก้ไขโดยตรง)
        // ถ้า replaceQty = false/undefined ให้สะสม qty (กรณีเพิ่มสินค้า)
        const newQty = replaceQty
          ? item.reqqty
          : (existItem.reqqty || 0) + (item.reqqty || 0);

        state.stockcartItems = state.stockcartItems.map((x) =>
          x._id === existItem._id
            ? { ...item, reqqty: newQty, note: item.note !== undefined ? item.note : x.note }
            : x,
        );
      } else {
        state.stockcartItems.push(item);
      }

      localStorage.setItem("stockcart", JSON.stringify(state.stockcartItems));
    },

    removeStockFromCart: (state, action) => {
      state.stockcartItems = state.stockcartItems.filter(
        (x) => x._id !== action.payload,
      );
      localStorage.setItem("stockcart", JSON.stringify(state.stockcartItems));
    },

    clearStockCartItems: (state) => {
      state.stockcartItems = [];
      localStorage.setItem("stockcart", JSON.stringify([]));
    },

    resetStockCart: (state) => {
      state.stockcartItems = initialState.stockcartItems;
      localStorage.setItem("stockcart", JSON.stringify(state.stockcartItems));
    },
  },
});

export const {
  addToStockCart,
  removeStockFromCart,
  clearStockCartItems,
  resetStockCart,
} = stockCartApiSlice.actions;

export default stockCartApiSlice.reducer;
