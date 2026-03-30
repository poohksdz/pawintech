// notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { count: 0, list: [] },
  reducers: {
    addNotification(state, action) {
      state.count += 1;
      state.list.unshift(action.payload);
    },
    clearNotifications(state) {
      state.count = 0;
      state.list = [];
    },
  },
});

export const { addNotification, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
