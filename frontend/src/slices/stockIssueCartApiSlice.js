import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stockissuecartItems: localStorage.getItem("stockissuecart")
    ? JSON.parse(localStorage.getItem("stockissuecart"))
    : [],
};

const stockIssueCartApiSlice = createSlice({
  name: "stockissuecart",
  initialState,
  reducers: {
    addToStockIssueCart: (state, action) => {
      const { user, ...item } = action.payload;

      const existIndex = state.stockissuecartItems.findIndex(
        (x) => x.ID === item.ID,
      );

      if (existIndex !== -1) {
        // Replace the existing item at that index
        state.stockissuecartItems.splice(existIndex, 1);
      }

      // Push the latest item (new or updated)
      state.stockissuecartItems.push(item);

      localStorage.setItem(
        "stockissuecart",
        JSON.stringify(state.stockissuecartItems),
      );
    },

    removeStockFromIssueCart: (state, action) => {
      state.stockissuecartItems = state.stockissuecartItems.filter(
        (x) => x.ID !== action.payload,
      );
      localStorage.setItem(
        "stockissuecart",
        JSON.stringify(state.stockissuecartItems),
      );
    },

    clearStockIssueCartItems: (state) => {
      state.stockissuecartItems = [];
      localStorage.setItem("stockissuecart", JSON.stringify([]));
    },

    resetStockIssueCart: (state) => {
      state.stockissuecartItems = initialState.stockissuecartItems;
      localStorage.setItem(
        "stockissuecart",
        JSON.stringify(state.stockissuecartItems),
      );
    },
  },
});

export const {
  addToStockIssueCart,
  removeStockFromIssueCart,
  clearStockIssueCartItems,
  resetStockIssueCart,
} = stockIssueCartApiSlice.actions;

export default stockIssueCartApiSlice.reducer;
